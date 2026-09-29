import { runQueryRule } from './harness.ts';

const names = [
  'Hydrate',
  'useHydrate',
  'hashQueryKey',
  'FetchQueryOptions',
  'EnsureQueryDataOptions',
  'FetchInfiniteQueryOptions',
  'EnsureInfiniteQueryDataOptions',
  'isCancelledError',
  'isServer',
];
runQueryRule('no-deprecated-imports', {
  valid: [
    'import { HydrationBoundary, hashKey, keepPreviousData, QueryExecuteOptions, InfiniteQueryExecuteOptions } from "@tanstack/react-query";',
    'import { Hydrate } from "other";',
    'import { CancelledError, environmentManager } from "@tanstack/react-query"; error instanceof CancelledError; environmentManager.isServer();',
    'import { isServer } from "other";',
    'const Hydrate = other; Hydrate();',
    'import * as Q from "@tanstack/react-query"; function use(Q) { return Q.Hydrate; }',
    'import * as Q from "@tanstack/react-query"; Q[key];',
    {
      code: 'import { Hydrate } from "@tanstack/react-query";',
      filename: '/src/legacy.ts',
      options: [{ allow: ['legacy.ts'] }],
    },
  ],
  invalid: [
    {
      code: 'import * as Q from "@tanstack/react-query"; const { Hydrate: Old } = Q;',
      errors: [{ messageId: 'deprecated' }],
    },

    ...names.map((name) => ({
      code: `import { ${name} as Alias } from '@tanstack/react-query';`,
      errors: [{ messageId: 'deprecated' }],
    })),
    {
      code: 'export { hashQueryKey as hash } from "@tanstack/query-core";',
      errors: [{ messageId: 'deprecated' }],
    },
    {
      code: 'import type { FetchQueryOptions } from "@tanstack/query-core";',
      errors: [{ messageId: 'deprecated' }],
    },
    {
      code: 'import * as Q from "@tanstack/react-query"; Q["hashQueryKey"]([]);',
      errors: [{ messageId: 'deprecated' }],
    },
    {
      code: 'import * as Q from "@tanstack/react-query"; type Options = Q.FetchQueryOptions;',
      errors: [{ messageId: 'deprecated' }],
    },
    {
      code: 'import * as Q from "@tanstack/query-core"; if (Q.isServer) Q.isCancelledError(error);',
      errors: [{ messageId: 'deprecated' }, { messageId: 'deprecated' }],
    },
    {
      code: 'import * as Q from "@tanstack/react-query"; const view = <Q.Hydrate />;',
      errors: [{ messageId: 'deprecated' }],
    },
  ],
});
