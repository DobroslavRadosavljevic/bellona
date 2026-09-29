import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { objectOptionAt, stringListField } from '../../../lib/options.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import {
  getBindingNameForInitializer,
  getStaticMemberPath,
  getStaticPropertyName,
  isFunctionLike,
  outerParent,
  pipeRoot,
  unwrapExpression,
  visitAstChildren,
} from '../ast.ts';
import {
  collectEffectBindings,
  isEffectNamespaceCall,
  isModuleCall,
  type EffectBindings,
} from '../bindings.ts';
import { slash } from '../filename.ts';
import {
  collectModuleRefs,
  effectFnOwnerCall,
  HTTP_CLIENT_MODULE,
  moduleMemberName,
  nearestFunction,
  type ModuleRefs,
} from '../module-refs.ts';
import { shouldSkipEffectStyleFile } from '../options.ts';

export const requireTimeoutOnExternalIoName = bnRuleName('require-timeout-on-external-io');

/** `Effect` timeouts. Verified in `effect@4.0.0-rc.115` (v4 has no `timeoutFail`). */
const EFFECT_TIMEOUTS = ['timeout', 'timeoutOption', 'timeoutOrElse'];

/** `HttpClient` calls that send a request. */
const HTTP_METHODS = ['execute', 'get', 'post', 'put', 'patch', 'del', 'head', 'options'];

const SERVICE_FILE = /\.service\.[cm]?tsx?$/u;

const TIMEOUT_OPTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    allow: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      uniqueItems: true,
    },
    helpers: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      uniqueItems: true,
    },
    localApis: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      uniqueItems: true,
    },
  },
} as const;

/**
 * Local work that does not wait for another system: file system calls and Bun file writes.
 * A Promise function that calls one of these is not checked.
 */
export const DEFAULT_LOCAL_APIS = [
  'readFile',
  'writeFile',
  'appendFile',
  'mkdir',
  'mkdtemp',
  'rm',
  'rmdir',
  'unlink',
  'rename',
  'copyFile',
  'readdir',
  'stat',
  'lstat',
  'access',
  'Bun.write',
  'Bun.file',
];

/** An option key that sets a timeout inside the Promise function: `{ timeout: 5000 }`. */
const TIMEOUT_KEY = /^(?:timeout|timeoutMs|requestTimeout|requestTimeoutMs)$/iu;

/** The Promise function of `Effect.tryPromise(fn)` or `Effect.tryPromise({ try: fn })`. */
function promiseFunction(node: ESTree.CallExpression): ESTree.Node | undefined {
  const first = unwrapExpression(node.arguments[0]);
  if (isFunctionLike(first)) {
    return first;
  }
  if (first?.type !== 'ObjectExpression') {
    return undefined;
  }
  for (const property of first.properties) {
    if (property.type === 'Property' && getStaticPropertyName(property.key) === 'try') {
      const value = unwrapExpression(property.value);
      return isFunctionLike(value) ? value : undefined;
    }
  }
  return undefined;
}

/** True for `rm(…)`, `fs.rm(…)`, `fs.promises.rm(…)`, or a full dotted name such as `Bun.write`. */
function isLocalApiCall(path: readonly string[], localApis: readonly string[]): boolean {
  const full = path.join('.');
  const last = path[path.length - 1];
  const owner = path.slice(0, -1).join('.');
  const bareOrFs = path.length === 1 || owner.endsWith('fs') || owner.endsWith('promises');
  return localApis.some((name) => name === full || (bareOrFs && name === last));
}

/**
 * True when the Promise function has no call, `new`, or tagged template: it only reads a
 * promise that already exists (`() => result.finishReason`, `async () => await pending`).
 * It starts no work, so the timeout belongs to the code that made that promise.
 */
function onlyAwaitsExistingPromise(fn: ESTree.Node): boolean {
  if (!isFunctionLike(fn) || fn.body === null) {
    return false;
  }
  let startsWork = false;
  const visit = (node: ESTree.Node): void => {
    if (startsWork) {
      return;
    }
    if (
      node.type === 'CallExpression' ||
      node.type === 'NewExpression' ||
      node.type === 'TaggedTemplateExpression'
    ) {
      startsWork = true;
      return;
    }
    visitAstChildren(node, visit);
  };
  visit(fn.body);
  return !startsWork;
}

/**
 * True when the Promise function sets its own timeout (`AbortSignal.timeout(…)` or a
 * `timeout` option), or calls a local API. Nested callbacks are checked too.
 */
function promiseFunctionIsBounded(fn: ESTree.Node, localApis: readonly string[]): boolean {
  let bounded = false;
  const visit = (node: ESTree.Node): void => {
    if (bounded) {
      return;
    }
    if (node.type === 'Property' && TIMEOUT_KEY.test(getStaticPropertyName(node.key) ?? '')) {
      bounded = true;
      return;
    }
    if (node.type === 'CallExpression') {
      const path = getStaticMemberPath(node.callee);
      if (
        path !== undefined &&
        (path.join('.') === 'AbortSignal.timeout' || isLocalApiCall(path, localApis))
      ) {
        bounded = true;
        return;
      }
    }
    visitAstChildren(node, visit);
  };
  visit(fn);
  return bounded;
}

/** The name that a call site uses: `request` in `request(x)` and `service.request(x)`. */
function calleeName(node: ESTree.Node | undefined): string | undefined {
  const path = getStaticMemberPath(node);
  return path?.[path.length - 1];
}

function matchesName(node: ESTree.Node | undefined, names: readonly string[]): boolean {
  const path = getStaticMemberPath(node);
  if (path === undefined) {
    return false;
  }
  const full = path.join('.');
  const last = path[path.length - 1];
  return names.some((name) => name === full || name === last);
}

/** Names of functions in this file whose body applies an `Effect` timeout. */
function timeoutHelperNames(
  program: ESTree.Program | undefined,
  bindings: EffectBindings,
): Set<string> {
  const names = new Set<string>();
  const hasTimeout = (fn: ESTree.Node): boolean => {
    let found = false;
    const visit = (node: ESTree.Node): void => {
      if (found) {
        return;
      }
      if (node.type === 'CallExpression' && isTimeoutCall(node, bindings)) {
        found = true;
        return;
      }
      visitAstChildren(node, visit);
    };
    visit(fn);
    return found;
  };
  const visit = (node: ESTree.Node): void => {
    if (node.type === 'FunctionDeclaration' && node.id !== null && hasTimeout(node)) {
      names.add(node.id.name);
    }
    if (isFunctionLike(node) && node.type !== 'FunctionDeclaration') {
      const name = getBindingNameForInitializer(node);
      if (
        name !== undefined &&
        effectFnOwnerCall(node, bindings) === undefined &&
        hasTimeout(node)
      ) {
        names.add(name);
      }
    }
    visitAstChildren(node, visit);
  };
  if (program !== undefined) {
    visit(program);
  }
  return names;
}

function isTimeoutCall(node: ESTree.CallExpression, bindings: EffectBindings): boolean {
  return EFFECT_TIMEOUTS.some((name) => isModuleCall(node, bindings, 'effect', name));
}

export const requireTimeoutOnExternalIo: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require an Effect timeout on Effect.tryPromise and HttpClient calls inside Effect.fn bodies in .service.ts files',
    },
    messages: {
      timeout: agentDiagnostic({
        problem:
          '`{{api}}` waits for an outside system, but this `Effect.fn` applies no timeout to it.',
        why: 'An outside system can stop answering. Without a timeout, the fiber waits with no limit, holds its resources, and the caller never gets an error.',
        fix: 'Add `Effect.timeout("10 seconds")` or `Effect.timeoutOrElse({ duration, orElse })` to the same pipe, or pass it as an extra argument: `Effect.fn("Owner.name")(function* () { … }, Effect.timeout("10 seconds"))`. If a shared helper adds the timeout, add its name to the `helpers` option.',
        avoid: 'Do not add a very long timeout only to silence the rule. Do not disable the rule.',
      }),
    },
    schema: [TIMEOUT_OPTION_SCHEMA],
    defaultOptions: [{ allow: [], helpers: [], localApis: DEFAULT_LOCAL_APIS }],
  },
  createOnce(context) {
    let bindings: EffectBindings;
    let httpRefs: ModuleRefs;
    let helpers: readonly string[];
    let localApis: readonly string[];
    let clientNames: Set<string>;
    let timedNames: Set<string> | undefined;
    let localHelpers: readonly string[] | undefined;

    /** A pipe step or wrapper that applies a timeout: `Effect.timeout(…)` or a helper. */
    function isTimingStep(node: ESTree.Node | undefined, helperNames: readonly string[]): boolean {
      const step = unwrapExpression(node);
      if (step?.type === 'CallExpression') {
        return isTimeoutCall(step, bindings) || matchesName(step.callee, helperNames);
      }
      return matchesName(step, helperNames);
    }

    /**
     * Names of functions that a caller in this file wraps in a timeout, such as `request` in
     * `request(url).pipe(Effect.timeout(…))` or in `finish(response(url))`.
     */
    function collectTimedNames(allHelpers: readonly string[]): Set<string> {
      const names = new Set<string>();
      const addSubject = (node: ESTree.Node | undefined): void => {
        let subject = unwrapExpression(pipeRoot(node));
        // Look through data-first wrappers such as `Effect.scoped(request(x))`.
        while (
          subject?.type === 'CallExpression' &&
          isEffectNamespaceCall(subject, bindings) &&
          subject.arguments.length > 0
        ) {
          subject = unwrapExpression(pipeRoot(subject.arguments[0]));
        }
        if (subject?.type === 'CallExpression') {
          const name = calleeName(subject.callee);
          if (name !== undefined) {
            names.add(name);
          }
        }
      };
      const visit = (node: ESTree.Node): void => {
        if (node.type === 'CallExpression') {
          const callee = unwrapExpression(node.callee);
          if (
            callee?.type === 'MemberExpression' &&
            calleeName(callee) === 'pipe' &&
            node.arguments.some((argument) => isTimingStep(argument, allHelpers))
          ) {
            addSubject(callee.object);
          }
          if (isTimingStep(node, allHelpers)) {
            for (const argument of node.arguments) {
              addSubject(argument);
            }
          }
        }
        visitAstChildren(node, visit);
      };
      const program = context.sourceCode.ast;
      if (program !== undefined) {
        visit(program);
      }
      return names;
    }

    /** True when the chain that starts at `node` gets a timeout before it leaves the expression. */
    function chainHasTimeout(node: ESTree.Node, allHelpers: readonly string[]): boolean {
      let current: ESTree.Node = node;
      while (true) {
        const parent = outerParent(current);
        if (parent?.type === 'MemberExpression' && calleeName(parent) === 'pipe') {
          const call = outerParent(parent);
          if (call?.type !== 'CallExpression' || unwrapExpression(call.callee) !== parent) {
            return false;
          }
          if (call.arguments.some((argument) => isTimingStep(argument, allHelpers))) {
            return true;
          }
          current = call;
          continue;
        }
        if (parent?.type !== 'CallExpression' || unwrapExpression(parent.callee) === current) {
          return false;
        }
        if (isTimingStep(parent, allHelpers)) {
          return true;
        }
        if (
          isEffectNamespaceCall(parent, bindings) &&
          unwrapExpression(parent.arguments[0]) === current
        ) {
          current = parent;
          continue;
        }
        return false;
      }
    }

    function externalApi(node: ESTree.CallExpression): string | undefined {
      if (isModuleCall(node, bindings, 'effect', 'tryPromise')) {
        const fn = promiseFunction(node);
        return fn !== undefined &&
          (onlyAwaitsExistingPromise(fn) || promiseFunctionIsBounded(fn, localApis))
          ? undefined
          : 'Effect.tryPromise';
      }
      const member = moduleMemberName(node.callee, httpRefs, HTTP_CLIENT_MODULE);
      if (member !== undefined && HTTP_METHODS.includes(member)) {
        return `HttpClient.${member}`;
      }
      const path = getStaticMemberPath(node.callee);
      if (
        path?.length === 2 &&
        path[0] !== undefined &&
        clientNames.has(path[0]) &&
        path[1] !== undefined &&
        HTTP_METHODS.includes(path[1])
      ) {
        return `HttpClient.${path[1]}`;
      }
      return undefined;
    }

    /** `client` in `const client = yield* HttpClient.HttpClient` (also with `.pipe(…)`). */
    function collectClientNames(program: ESTree.Program | undefined): Set<string> {
      const names = new Set<string>();
      const visit = (node: ESTree.Node): void => {
        if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier') {
          const root = unwrapExpression(pipeRoot(node.init ?? undefined));
          const service =
            root?.type === 'YieldExpression' && root.delegate
              ? unwrapExpression(pipeRoot(root.argument ?? undefined))
              : undefined;
          if (moduleMemberName(service, httpRefs, HTTP_CLIENT_MODULE) === 'HttpClient') {
            names.add(node.id.name);
          }
        }
        visitAstChildren(node, visit);
      };
      if (program !== undefined) {
        visit(program);
      }
      return names;
    }

    return {
      before() {
        if (shouldSkipEffectStyleFile(context) || !SERVICE_FILE.test(slash(context.filename))) {
          return false;
        }
        const program = context.sourceCode.ast;
        bindings = collectEffectBindings(program);
        httpRefs = collectModuleRefs(program, HTTP_CLIENT_MODULE);
        helpers = stringListField(objectOptionAt(context, 0), 'helpers', []);
        localApis = stringListField(objectOptionAt(context, 0), 'localApis', DEFAULT_LOCAL_APIS);
        clientNames = collectClientNames(program);
        timedNames = undefined;
        localHelpers = undefined;
      },
      CallExpression(node) {
        const api = externalApi(node);
        if (api === undefined) {
          return;
        }
        const fn = nearestFunction(node);
        const owner = fn === undefined ? undefined : effectFnOwnerCall(fn, bindings);
        if (owner === undefined) {
          return;
        }
        const helperNames = (localHelpers ??= [
          ...helpers,
          ...timeoutHelperNames(context.sourceCode.ast, bindings),
        ]);
        if (chainHasTimeout(node, helperNames)) {
          return;
        }
        if (owner.arguments.slice(1).some((argument) => isTimingStep(argument, helperNames))) {
          return;
        }
        timedNames ??= collectTimedNames(helperNames);
        const binding = getBindingNameForInitializer(owner);
        if (binding !== undefined && timedNames.has(binding)) {
          return;
        }
        context.report({ messageId: 'timeout', node, data: { api } });
      },
    };
  },
});
