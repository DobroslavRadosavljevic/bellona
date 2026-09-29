import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { objectOptionAt, stringListField } from '../../../lib/options.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getCallArgument, isFunctionLike, unwrapExpression } from '../ast.ts';
import {
  collectEffectBindings,
  isModuleCall,
  isModuleMember,
  type EffectBindings,
} from '../bindings.ts';
import { referencesAnyName, simpleParamNames, soleReturnedExpression } from '../handler-values.ts';
import { shouldSkipEffectStyleFile } from '../options.ts';

export const noSilentCatchCauseName = bnRuleName('no-silent-catch-cause');

/** Handlers that also catch defects and interruptions. */
const CAUSE_CATCHERS = new Set(['catchCause', 'catchDefect']);

const CATCHERS = ['catchCause', 'catchDefect', 'catch', 'catchTag', 'catchTags'] as const;

/**
 * Checked by default: the two handlers that also catch bugs. A `catchTag` handler that
 * returns a fixed value is the normal way to map an expected error, so it is opt-in.
 */
const DEFAULT_APIS = ['catchCause', 'catchDefect'];

const OPTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    allow: { type: 'array', items: { type: 'string', minLength: 1 }, uniqueItems: true },
    apis: { type: 'array', items: { enum: [...CATCHERS] }, uniqueItems: true },
  },
} as const;

const TYPED_WHY =
  'The typed error is dropped, so the caller gets a normal value and cannot tell that the work failed.';

const WHY: Readonly<Record<(typeof CATCHERS)[number], string>> = {
  catchCause:
    '`Effect.catchCause` catches every failure: typed errors, defects (bugs), and interruptions.',
  catchDefect: '`Effect.catchDefect` catches defects: bugs and unexpected throws.',
  catch: TYPED_WHY,
  catchTag: TYPED_WHY,
  catchTags: TYPED_WHY,
};

/** `Effect.succeed(x)`, `Effect.succeedSome(x)`, `Effect.as(Effect.void, x)`, `Effect.void`, or `Effect.succeedNone`. */
function isConstantSuccess(node: ESTree.Node | undefined, bindings: EffectBindings): boolean {
  const expression = unwrapExpression(node);
  if (
    isModuleMember(expression, bindings, 'effect', 'void') ||
    isModuleMember(expression, bindings, 'effect', 'succeedNone')
  ) {
    return true;
  }
  if (expression?.type !== 'CallExpression') {
    return false;
  }
  if (
    isModuleCall(expression, bindings, 'effect', 'succeed') ||
    isModuleCall(expression, bindings, 'effect', 'succeedSome')
  ) {
    return true;
  }
  return (
    isModuleCall(expression, bindings, 'effect', 'as') &&
    expression.arguments.length === 2 &&
    isConstantSuccess(getCallArgument(expression, 0), bindings)
  );
}

/** A handler that ignores its parameter and returns a fixed success. */
function isSilentHandler(node: ESTree.Node | undefined, bindings: EffectBindings): boolean {
  const fn = unwrapExpression(node);
  if (!isFunctionLike(fn) || fn.generator === true || fn.async === true) {
    return false;
  }
  const params = simpleParamNames(fn);
  const returned = soleReturnedExpression(fn);
  return (
    params !== undefined &&
    returned !== undefined &&
    isConstantSuccess(returned, bindings) &&
    !referencesAnyName(returned, params)
  );
}

function handlersOf(node: ESTree.CallExpression, api: string): readonly ESTree.Node[] {
  const handlers: ESTree.Node[] = [];
  for (const argument of node.arguments) {
    const expression = argument.type === 'SpreadElement' ? undefined : unwrapExpression(argument);
    if (isFunctionLike(expression)) {
      handlers.push(expression);
    } else if (api === 'catchTags' && expression?.type === 'ObjectExpression') {
      for (const property of expression.properties) {
        if (property.type === 'Property') {
          handlers.push(property.value);
        }
      }
    }
  }
  return handlers;
}

export const noSilentCatchCause: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow Effect catch handlers that drop the error and return a fixed success without a log',
    },
    messages: {
      silent: agentDiagnostic({
        problem:
          'This `Effect.{{api}}` handler ignores the {{what}} and returns a fixed success. The failure disappears with no log.',
        why: '{{why}} Nobody can see or debug the failure later.',
        fix: 'Log it first: `Effect.{{api}}((cause) => Effect.logWarning("… failed", cause).pipe(Effect.as(fallback)))`. Better, catch only the expected error with `Effect.catchTag("NotFound", …)`.',
        avoid: 'Do not rename the parameter to `_` to hide it. Do not disable the rule.',
      }),
    },
    schema: [OPTION_SCHEMA],
    defaultOptions: [{ allow: [], apis: DEFAULT_APIS }],
  },
  createOnce(context) {
    let bindings: EffectBindings;
    let apis: readonly string[];

    return {
      before() {
        if (shouldSkipEffectStyleFile(context)) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
        apis = stringListField(objectOptionAt(context, 0), 'apis', DEFAULT_APIS);
      },
      CallExpression(node) {
        const api = CATCHERS.find(
          (name) => apis.includes(name) && isModuleCall(node, bindings, 'effect', name),
        );
        if (api === undefined) {
          return;
        }
        if (!handlersOf(node, api).some((handler) => isSilentHandler(handler, bindings))) {
          return;
        }
        const causeCatcher = CAUSE_CATCHERS.has(api);
        context.report({
          messageId: 'silent',
          node,
          data: { api, what: causeCatcher ? 'cause' : 'error', why: WHY[api] },
        });
      },
    };
  },
});
