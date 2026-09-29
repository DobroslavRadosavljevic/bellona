import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { isFunctionLike, unwrapExpression } from '../ast.ts';
import {
  collectEffectBindings,
  isBareVitestItCall,
  isEffectExpression,
  type EffectBindings,
} from '../bindings.ts';
import {
  ALLOW_OPTION_SCHEMA,
  DEFAULT_ALLOW_OPTIONS,
  shouldSkipNonTestEffectFile,
} from '../options.ts';

export const preferEffectVitestName = bnRuleName('prefer-vitest');

function callbackReturnsEffect(fn: ESTree.Node, bindings: EffectBindings): boolean {
  if (!isFunctionLike(fn)) {
    return false;
  }
  if (fn.type === 'ArrowFunctionExpression' && fn.expression === true) {
    return isEffectExpression(fn.body, bindings);
  }
  const body = fn.body;
  if (body === null || body === undefined || body.type !== 'BlockStatement') {
    return false;
  }
  for (const statement of body.body) {
    if (statement.type === 'ReturnStatement') {
      const argument = statement.argument ?? undefined;
      if (argument !== undefined && isEffectExpression(argument, bindings)) {
        return true;
      }
    }
  }
  return false;
}

export const preferEffectVitest: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Use it.effect from @effect/vitest when a test returns an Effect',
    },
    messages: {
      itEffect: agentDiagnostic({
        problem:
          'This test file uses bare `it` / `test` whose callback returns an Effect. `@effect/vitest` needs `it.effect`.',
        why: 'A returned Effect is not run by Vitest. The test passes without executing the program.',
        fix: 'Import `{ it } from "@effect/vitest"` and write `it.effect("name", () => Effect.gen(function* () { … }))` (or return the Effect from `it.effect`).',
        avoid: 'Do not `void Effect.runPromise` inside `it`. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: EffectBindings;

    return {
      before() {
        if (shouldSkipNonTestEffectFile(context)) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
      },
      CallExpression(node) {
        if (!isBareVitestItCall(node, bindings)) {
          return;
        }
        for (const argument of node.arguments) {
          if (argument.type === 'SpreadElement') {
            continue;
          }
          const expression = unwrapExpression(argument);
          if (expression !== undefined && callbackReturnsEffect(expression, bindings)) {
            context.report({ messageId: 'itEffect', node });
            return;
          }
        }
      },
    };
  },
});
