import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree, Scope, SourceCode, Variable } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';

const moduleMockMethods = new Set(['doMock', 'mock', 'unstable_mockModule']);

function resolveVariable(
  sourceCode: SourceCode,
  identifier: ESTree.IdentifierReference,
): Variable | null {
  let scope: Scope | null = sourceCode.getScope(identifier);
  while (scope !== null) {
    const variable = scope.set.get(identifier.name);
    if (variable !== undefined) return variable;
    scope = scope.upper;
  }
  return null;
}

function importedName(node: ESTree.Node): string | null {
  if (node.type !== 'ImportSpecifier') return null;
  return node.imported.type === 'Identifier' ? node.imported.name : node.imported.value;
}

function isTestFrameworkObject(
  sourceCode: SourceCode,
  expression: ESTree.Expression,
): expression is ESTree.IdentifierReference {
  if (expression.type !== 'Identifier') return false;
  if (
    (expression.name === 'vi' || expression.name === 'jest') &&
    sourceCode.isGlobalReference(expression)
  ) {
    return true;
  }

  const variable = resolveVariable(sourceCode, expression);
  if (variable === null || variable.defs.length === 0) {
    return expression.name === 'vi' || expression.name === 'jest';
  }
  return variable.defs.some((definition) => {
    if (definition.type !== 'ImportBinding' || definition.parent?.type !== 'ImportDeclaration') {
      return false;
    }
    const source = definition.parent.source.value;
    const name = importedName(definition.node);
    return (
      (source === 'vitest' && name === 'vi') || (source === '@jest/globals' && name === 'jest')
    );
  });
}

function moduleMockCall(sourceCode: SourceCode, callee: ESTree.Expression): boolean {
  if (!('property' in callee) || !('object' in callee) || !('computed' in callee)) return false;
  if (!isTestFrameworkObject(sourceCode, callee.object)) return false;
  const property = callee.property;
  const method = callee.computed
    ? property.type === 'Literal' &&
      (property.value === 'doMock' ||
        property.value === 'mock' ||
        property.value === 'unstable_mockModule')
      ? property.value
      : null
    : property.type === 'Identifier'
      ? property.name
      : null;
  return method !== null && moduleMockMethods.has(method);
}

/** Ban test framework module mocking in favor of real dependency seams. */
export const noModuleMockingName = bnRuleName('no-module-mocking');

export const noModuleMocking: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow Vitest and Jest module mocking; tests must replace dependencies through real interfaces.',
    },
    messages: {
      moduleMock: agentDiagnostic({
        problem:
          'This is a Vitest or Jest module mock (`vi.mock`, `vi.doMock`, `vi.unstable_mockModule`, or the same methods on `jest`, global or imported from `vitest` / `@jest/globals`).',
        why: 'Module mocks replace a real module graph with a fake. Tests then pass without proving the production seam. Refactors of the mocked module do not fail the test.',
        fix: 'Inject a real interface, service, or test double through parameters or a small adapter. Construct the collaborator in the test and pass it in. Keep the production import graph intact.',
        avoid:
          'Do not switch `vi.mock` to `jest.mock` or `unstable_mockModule`. Do not wrap the mock in a helper to hide it. Do not disable the rule in tests — this rule is meant to run on test files.',
      }),
    },
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        if (node.callee.type === 'Super' || node.callee.type === 'V8IntrinsicExpression') return;
        if (moduleMockCall(context.sourceCode, node.callee)) {
          context.report({ node, messageId: 'moduleMock' });
        }
      },
    };
  },
});
