import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { isFunctionLike, walkFunctionBody } from '../ast.ts';
import {
  collectEffectBindings,
  isEffectGenExpression,
  isInsideVitestEffectCallback,
  type EffectBindings,
} from '../bindings.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipEffectFile } from '../options.ts';

export const preferEffectFnName = bnRuleName('prefer-fn');

function returnsEffectGen(fn: ESTree.Node, bindings: EffectBindings): boolean {
  if (!isFunctionLike(fn)) {
    return false;
  }
  if (
    (fn.type === 'FunctionExpression' || fn.type === 'FunctionDeclaration') &&
    fn.generator === true
  ) {
    return false;
  }
  if (fn.type === 'ArrowFunctionExpression' && fn.expression === true) {
    return isEffectGenExpression(fn.body, bindings);
  }
  let found = false;
  walkFunctionBody(fn, (node) => {
    if (found || node.type !== 'ReturnStatement') {
      return;
    }
    const argument = node.argument ?? undefined;
    if (argument === undefined) {
      return;
    }
    if (isEffectGenExpression(argument, bindings)) {
      found = true;
    }
  });
  return found;
}

export const preferEffectFn: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer Effect.fn("name") over functions that return Effect.gen',
    },
    messages: {
      wrap: agentDiagnostic({
        problem:
          'This function returns `Effect.gen(...)`. Wrap it with `Effect.fn("{{name}}")` instead. `it.effect` callbacks are excluded.',
        why: '`Effect.fn` is the v4 named, traceable function. A plain function that returns `gen` hides the span name and the extra-combinator slot.',
        fix: 'Write `export const {{name}} = Effect.fn("{{name}}")(function* (id: string) { return yield* find(id) })`. Pass extra combinators as extra arguments to `Effect.fn`, not `.pipe` on the result.',
        avoid:
          'Do not keep a wrapper `function {{name}}() { return Effect.gen(...) }`. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: EffectBindings;

    return {
      before() {
        if (shouldSkipEffectFile(context)) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
      },
      FunctionDeclaration(node) {
        reportFn(node);
      },
      FunctionExpression(node) {
        reportFn(node);
      },
      ArrowFunctionExpression(node) {
        reportFn(node);
      },
    };

    function reportFn(node: ESTree.Node): void {
      if (!isFunctionLike(node) || !returnsEffectGen(node, bindings)) {
        return;
      }
      if (isInsideVitestEffectCallback(node, bindings)) {
        return;
      }
      const name =
        node.type === 'FunctionDeclaration' && node.id?.type === 'Identifier'
          ? node.id.name
          : 'name';
      context.report({
        messageId: 'wrap',
        node: node.type === 'FunctionDeclaration' && node.id !== null ? node.id : node,
        data: { name },
      });
    }
  },
});
