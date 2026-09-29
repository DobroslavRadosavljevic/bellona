import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import {
  classNameOf,
  getStaticPropertyName,
  isFunctionLike,
  unwrapExpression,
  visitAstChildren,
} from '../ast.ts';
import {
  collectEffectBindings,
  isContextServiceClassSuper,
  type EffectBindings,
} from '../bindings.ts';
import { effectFnOwnerCall } from '../module-refs.ts';
import {
  ALLOW_OPTION_SCHEMA,
  DEFAULT_ALLOW_OPTIONS,
  shouldSkipEffectStyleFile,
} from '../options.ts';

export const noForwardingServiceName = bnRuleName('no-forwarding-service');

/** Parameter names, or undefined when a parameter is a pattern, a default, or a rest. */
function simpleParams(fn: ESTree.Function | ESTree.ArrowFunctionExpression): string[] | undefined {
  const names: string[] = [];
  for (const param of fn.params) {
    if (param.type !== 'Identifier') {
      return undefined;
    }
    names.push(param.name);
  }
  return names;
}

/** The one expression that a function body returns, or undefined when it does more. */
function onlyReturned(
  fn: ESTree.Function | ESTree.ArrowFunctionExpression,
): ESTree.Node | undefined {
  const body = fn.body;
  if (body === null || body === undefined) {
    return undefined;
  }
  if (body.type !== 'BlockStatement') {
    return body;
  }
  const [statement, ...rest] = body.body;
  if (statement?.type !== 'ReturnStatement' || rest.length > 0) {
    return undefined;
  }
  return statement.argument ?? undefined;
}

/** Local names that come from imports. A call on one is a module call, not a service call. */
function importedNames(program: ESTree.Program | undefined): ReadonlySet<string> {
  const names = new Set<string>();
  for (const statement of program?.body ?? []) {
    if (statement.type !== 'ImportDeclaration') {
      continue;
    }
    for (const specifier of statement.specifiers) {
      names.add(specifier.local.name);
    }
  }
  return names;
}

/** `ServiceName.of({ … })` or `this.of({ … })`: the object argument. */
function serviceOfObject(
  node: ESTree.CallExpression,
  className: string,
): ESTree.ObjectExpression | undefined {
  const callee = unwrapExpression(node.callee);
  if (callee?.type !== 'MemberExpression' || getStaticPropertyName(callee.property) !== 'of') {
    return undefined;
  }
  const object = unwrapExpression(callee.object);
  const isOwner =
    object?.type === 'ThisExpression' ||
    (object?.type === 'Identifier' && object.name === className);
  const argument = unwrapExpression(node.arguments[0]);
  return isOwner && argument?.type === 'ObjectExpression' ? argument : undefined;
}

/** Every `.of({ … })` object in the static members of the class. */
function serviceObjects(cls: ESTree.Class, className: string): ESTree.ObjectExpression[] {
  const objects: ESTree.ObjectExpression[] = [];
  const visit = (node: ESTree.Node): void => {
    if (node.type === 'CallExpression') {
      const object = serviceOfObject(node, className);
      if (object !== undefined) {
        objects.push(object);
        return;
      }
    }
    visitAstChildren(node, visit);
  };
  for (const element of cls.body.body) {
    if (element.type === 'PropertyDefinition' && element.static && element.value !== null) {
      visit(element.value);
    }
  }
  return objects;
}

export const noForwardingService: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow a Context.Service whose members only forward calls to another service',
    },
    messages: {
      forwarding: agentDiagnostic({
        problem:
          'Each member of `{{name}}` only calls a method of another service with the same arguments. The service adds no behavior.',
        why: 'A forwarding service adds a layer, a span, and a contract that you must keep in sync with the real owner. Callers then depend on a copy, not on the owner of the operation.',
        fix: 'Remove `{{name}}`. Make callers `yield*` the service that owns the operation and call it directly. Keep a service only when at least one member does its own work.',
        avoid:
          'Do not add a no-op step to hide the forwarding. Do not merge other services into one facade. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: EffectBindings;
    let imports: ReadonlySet<string>;

    /** `other.method` where `other` is a local value, not an import and not `this`. */
    function isLocalMember(node: ESTree.Node | undefined): node is ESTree.MemberExpression {
      const expression = unwrapExpression(node);
      if (expression?.type !== 'MemberExpression' || expression.computed) {
        return false;
      }
      const object = unwrapExpression(expression.object);
      return object?.type === 'Identifier' && !imports.has(object.name);
    }

    /** `other.method(a, b)` where `a, b` are exactly the parameter names, in order. */
    function isForwardCall(node: ESTree.Node | undefined, params: readonly string[]): boolean {
      const call = unwrapExpression(node);
      if (call?.type !== 'CallExpression' || !isLocalMember(call.callee)) {
        return false;
      }
      if (call.arguments.length !== params.length) {
        return false;
      }
      return call.arguments.every((argument, index) => {
        const value = unwrapExpression(argument);
        return value?.type === 'Identifier' && value.name === params[index];
      });
    }

    function isForwardFunction(fn: ESTree.Function | ESTree.ArrowFunctionExpression): boolean {
      const params = simpleParams(fn);
      if (params === undefined) {
        return false;
      }
      const returned = unwrapExpression(onlyReturned(fn));
      if (fn.generator === true) {
        // `function* (a) { return yield* other.method(a) }`
        return (
          returned?.type === 'YieldExpression' &&
          returned.delegate &&
          isForwardCall(returned.argument ?? undefined, params)
        );
      }
      return isForwardCall(returned, params);
    }

    function isForwardMember(member: ESTree.ObjectExpression['properties'][number]): boolean {
      if (member.type === 'SpreadElement') {
        const argument = unwrapExpression(member.argument);
        return argument?.type === 'Identifier' && !imports.has(argument.name);
      }
      const value = unwrapExpression(member.value);
      if (value === undefined) {
        return false;
      }
      if (isLocalMember(value)) {
        return true;
      }
      if (isFunctionLike(value)) {
        return isForwardFunction(value);
      }
      if (value.type !== 'CallExpression') {
        return false;
      }
      // `Effect.fn("name")(function* (a) { return yield* other.method(a) })`
      const generator = unwrapExpression(value.arguments[0]);
      if (
        generator === undefined ||
        value.arguments.length !== 1 ||
        effectFnOwnerCall(generator, bindings) !== value ||
        !isFunctionLike(generator)
      ) {
        return false;
      }
      return isForwardFunction(generator);
    }

    function checkClass(node: ESTree.Class): void {
      if (!isContextServiceClassSuper(node.superClass ?? undefined, bindings)) {
        return;
      }
      const name = classNameOf(node);
      if (name === undefined) {
        return;
      }
      const objects = serviceObjects(node, name);
      const members = objects.flatMap((object) => object.properties);
      if (members.length === 0 || !members.every(isForwardMember)) {
        return;
      }
      context.report({ messageId: 'forwarding', node: node.id ?? node, data: { name } });
    }

    return {
      before() {
        if (shouldSkipEffectStyleFile(context)) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
        imports = importedNames(context.sourceCode.ast);
      },
      ClassDeclaration: checkClass,
      ClassExpression: checkClass,
    };
  },
});
