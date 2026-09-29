import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { isGeneratorFunction, unwrapExpression } from '../ast.ts';
import { collectEffectBindings, type EffectBindings } from '../bindings.ts';
import { effectFnOwnerCall } from '../module-refs.ts';
import {
  ALLOW_OPTION_SCHEMA,
  DEFAULT_ALLOW_OPTIONS,
  shouldSkipEffectStyleFile,
} from '../options.ts';

export const requireFnReturnAnnotationName = bnRuleName('require-fn-return-annotation');

/** Local names that `export { a, b as c }` exports from this file. */
function exportedLocals(program: ESTree.Program): ReadonlySet<string> {
  const names = new Set<string>();
  for (const statement of program.body) {
    if (statement.type !== 'ExportNamedDeclaration' || statement.source !== null) {
      continue;
    }
    for (const specifier of statement.specifiers) {
      if (specifier.local.type === 'Identifier') {
        names.add(specifier.local.name);
      }
    }
  }
  return names;
}

export const requireFnReturnAnnotation: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require a return type (Effect.fn.Return<A, E, R>) on an exported top-level Effect.fn or Effect.fnUntraced generator',
    },
    messages: {
      annotation: agentDiagnostic({
        problem:
          'The exported function `{{name}}` has no return type. Its success, error, and dependency types are inferred from the body.',
        why: 'An exported function is a contract for other modules. An inferred type changes when the body changes, so a new error or dependency reaches callers without a review. A written type also makes type checks faster.',
        fix: 'Write the return type on the generator: `Effect.fn("{{name}}")(function* (input: Input): Effect.fn.Return<Output, SomeError, Dependency> { … })`. Use `never` for no error or no dependency.',
        avoid:
          'Do not write `Effect.fn.Return<any, any, any>`. Do not cast the result with `as`. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: EffectBindings;

    function check(init: ESTree.Node | null | undefined, name: string): void {
      const call = unwrapExpression(init);
      if (call?.type !== 'CallExpression') {
        return;
      }
      const generator = unwrapExpression(call.arguments[0]);
      if (
        generator === undefined ||
        !isGeneratorFunction(generator) ||
        effectFnOwnerCall(generator, bindings) !== call
      ) {
        return;
      }
      if (
        (generator.type === 'FunctionExpression' || generator.type === 'FunctionDeclaration') &&
        generator.returnType === null
      ) {
        context.report({ messageId: 'annotation', node: generator, data: { name } });
      }
    }

    return {
      before() {
        if (shouldSkipEffectStyleFile(context)) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
      },
      Program(program) {
        const exported = exportedLocals(program);
        for (const statement of program.body) {
          if (statement.type === 'ExportDefaultDeclaration') {
            check(statement.declaration, 'default');
            continue;
          }
          const isExport = statement.type === 'ExportNamedDeclaration';
          const declaration = isExport ? statement.declaration : statement;
          if (declaration?.type !== 'VariableDeclaration') {
            continue;
          }
          for (const declarator of declaration.declarations) {
            if (declarator.id.type !== 'Identifier') {
              continue;
            }
            if (isExport || exported.has(declarator.id.name)) {
              check(declarator.init, declarator.id.name);
            }
          }
        }
      },
    };
  },
});
