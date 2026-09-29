import { noModuleMockingName } from '../../../../src/plugins/js/rules/no-module-mocking.ts';
import { runJsRule } from './harness.ts';

const error = { messageId: 'moduleMock' };

runJsRule(noModuleMockingName, {
  valid: [
    'const store = new InMemoryUserStore();',
    "vi.spyOn(store, 'save');",
    'const vi = { mock() {} }; vi.mock();',
    'function test(jest: { mock(): void }) { jest.mock(); }',
    "import { vi as localVi } from './helpers'; localVi.mock('./module');",
    "import { mock } from 'bun:test'; const save = mock(() => 1);",
    "const mock = { module() {} }; mock.module('./db');",
    "import { mock } from './helpers'; mock.module('./db');",
  ],
  invalid: [
    {
      code: "import { mock } from 'bun:test'; mock.module('./db', () => ({ query: () => [] }));",
      errors: [error],
    },
    {
      code: "import { mock as testMock } from 'bun:test'; testMock['module']('./db', () => ({}));",
      errors: [error],
    },
    {
      code: "import { mock } from 'node:test'; mock.module('./db', { namedExports: {} });",
      errors: [error],
    },
    { code: "vi.mock('./user-store');", errors: [error] },
    { code: "jest.mock('./user-store');", errors: [error] },
    { code: "vi['doMock']('./user-store');", errors: [error] },
    { code: "jest.unstable_mockModule('./user-store');", errors: [error] },
    { code: "import { vi } from 'vitest'; vi.mock('./user-store');", errors: [error] },
    {
      code: "import { vi as testApi } from 'vitest'; testApi.mock('./user-store');",
      errors: [error],
    },
    {
      code: "import { jest } from '@jest/globals'; jest.mock('./user-store');",
      errors: [error],
    },
  ],
});
