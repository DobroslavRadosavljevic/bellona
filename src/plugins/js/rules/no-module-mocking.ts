import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree, Scope, SourceCode, Variable } from '@oxlint/plugins';

import { isJsString } from '../../../lib/js-kind.ts';
import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';

/**
 * Module mock methods per test API. `framework` is Vitest `vi` or Jest `jest`.
 * `runtime` is the `mock` object from `bun:test` or `node:test`, whose
 * `mock.module()` replaces a module in the loader.
 * @see https://bun.sh/docs/test/mocks#module-mocks-with-mock-module
 * @see https://nodejs.org/api/test.html#mockmodulespecifier-options
 */
const moduleMockMethods = {
  framework: new Set(['doMock', 'mock', 'unstable_mockModule']),
  runtime: new Set(['module']),
} as const;

type MockApi = keyof typeof moduleMockMethods;

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

function importedMockApi(source: string, name: string | null): MockApi | null {
  if ((source === 'vitest' && name === 'vi') || (source === '@jest/globals' && name === 'jest')) {
    return 'framework';
  }
  return (source === 'bun:test' || source === 'node:test') && name === 'mock' ? 'runtime' : null;
}

function mockApiOf(sourceCode: SourceCode, expression: ESTree.Expression): MockApi | null {
  if (expression.type !== 'Identifier') return null;
  const isFrameworkGlobalName = expression.name === 'vi' || expression.name === 'jest';
  if (isFrameworkGlobalName && sourceCode.isGlobalReference(expression)) return 'framework';

  const variable = resolveVariable(sourceCode, expression);
  if (variable === null || variable.defs.length === 0) {
    return isFrameworkGlobalName ? 'framework' : null;
  }
  for (const definition of variable.defs) {
    if (definition.type !== 'ImportBinding' || definition.parent?.type !== 'ImportDeclaration') {
      continue;
    }
    const api = importedMockApi(definition.parent.source.value, importedName(definition.node));
    if (api !== null) return api;
  }
  return null;
}

function moduleMockCall(sourceCode: SourceCode, callee: ESTree.Expression): boolean {
  if (!('property' in callee) || !('object' in callee) || !('computed' in callee)) return false;
  const api = mockApiOf(sourceCode, callee.object);
  if (api === null) return false;
  const property = callee.property;
  const method = callee.computed
    ? property.type === 'Literal' && isJsString(property.value)
      ? property.value
      : null
    : property.type === 'Identifier'
      ? property.name
      : null;
  return method !== null && moduleMockMethods[api].has(method);
}

/** Ban test framework module mocking in favor of real dependency seams. */
export const noModuleMockingName = bnRuleName('no-module-mocking');

export const noModuleMocking: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow Vitest, Jest, Bun, and Node test module mocking; tests must replace dependencies through real interfaces.',
    },
    messages: {
      moduleMock: agentDiagnostic({
        problem:
          'This is a test module mock: `vi.mock`, `vi.doMock`, `vi.unstable_mockModule`, the same methods on `jest` (global or imported from `vitest` / `@jest/globals`), or `mock.module` from `bun:test` / `node:test`.',
        why: 'Module mocks replace a real module graph with a fake. Tests then pass without proving the production seam. Refactors of the mocked module do not fail the test.',
        fix: 'Inject a real interface, service, or test double through parameters or a small adapter. Construct the collaborator in the test and pass it in. Keep the production import graph intact.',
        avoid:
          'Do not switch `vi.mock` to `jest.mock`, `unstable_mockModule`, or `mock.module`. Do not wrap the mock in a helper to hide it. Do not disable the rule in tests — this rule is meant to run on test files.',
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
