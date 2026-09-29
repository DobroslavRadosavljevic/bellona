import { requireFileLayoutName } from '../../../../src/plugins/js/rules/require-file-layout.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runJsRule } from './harness.ts';

const layoutStray = error('layoutStray');
const serviceOutsideServices = error('serviceOutsideServices');
const servicesFolderStray = error('servicesFolderStray');

const code = 'export const value = 1;';

const serverModules = [
  {
    layouts: [
      {
        root: '**/src/modules/*/',
        allow: ['live.ts', 'routes/**', 'services/**', 'schema/**', 'streams/**'],
      },
    ],
  },
];

runJsRule(requireFileLayoutName, {
  valid: [
    validWith(code, { name: 'no options: plain file', filename: 'src/pricing/price.ts' }),
    validWith(code, {
      name: 'service in a services folder',
      filename: 'apps/api/src/modules/billing/services/billing.service.ts',
    }),
    validWith(code, {
      name: 'service outside services is fine with no serviceDirectories',
      filename: 'packages/product/usage/src/meter/meter.service.ts',
    }),
    validWith(code, {
      name: 'nested folder inside services is not a direct child',
      filename: 'apps/api/src/modules/billing/services/errors/billing-not-found.error.ts',
    }),
    validWith(code, {
      name: 'test file in services',
      filename: 'apps/api/src/modules/billing/services/billing.service.test.ts',
    }),
    validWith(code, {
      name: 'allowed layout places',
      filename: 'apps/api/src/modules/billing/routes/get-plan.ts',
      options: serverModules,
    }),
    validWith(code, {
      name: 'allowed root file',
      filename: 'apps/api/src/modules/billing/live.ts',
      options: serverModules,
    }),
    validWith(code, {
      name: 'deep match with **',
      filename: 'apps/api/src/modules/chat/services/errors/invalid-cursor.error.ts',
      options: serverModules,
    }),
    validWith(code, {
      name: 'file outside every root',
      filename: 'apps/api/src/server/runtime.ts',
      options: serverModules,
    }),
    validWith(code, {
      name: 'skips stories, generated files, and .d.ts',
      filename: 'apps/api/src/modules/billing/plan.stories.tsx',
      options: serverModules,
    }),
    validWith(code, {
      name: 'skips generated files',
      filename: 'apps/api/src/modules/billing/plan.gen.ts',
      options: serverModules,
    }),
    validWith(code, {
      name: 'skips declaration files',
      filename: 'apps/api/src/modules/billing/env.d.ts',
      options: serverModules,
    }),
    validWith(code, {
      name: 'skips test files',
      filename: 'apps/api/src/modules/billing/plan.test.ts',
      options: serverModules,
    }),
    validWith(code, {
      name: 'allow skips the file',
      filename: 'apps/api/src/modules/billing/services/is-uuid.ts',
      options: [{ allow: ['is-uuid.ts'] }],
    }),
    validWith(code, {
      name: 'servicesFolderContents can be turned off',
      filename: 'apps/api/src/modules/billing/services/is-uuid.ts',
      options: [{ servicesFolderContents: false }],
    }),
    validWith(code, {
      name: 'serviceDirectories: service in services under the root',
      filename: 'apps/api/src/modules/billing/services/billing.service.ts',
      options: [{ serviceDirectories: ['**/src/modules/*/'] }],
    }),
    validWith(code, {
      name: 'serviceDirectories: service outside the root is not checked',
      filename: 'packages/product/usage/src/meter/meter.service.ts',
      options: [{ serviceDirectories: ['**/src/modules/*/'] }],
    }),
  ],
  invalid: [
    invalidWith({
      name: 'a non-service file directly in services',
      code,
      filename: 'apps/api/src/modules/billing/services/is-uuid.ts',
      errors: [servicesFolderStray],
    }),
    invalidWith({
      name: 'stray at the module root',
      code,
      filename: 'apps/file-server/src/modules/files/file-response.ts',
      options: serverModules,
      errors: [layoutStray],
    }),
    invalidWith({
      name: 'stray folder',
      code,
      filename: 'apps/scrape-api/src/modules/scrape/addresses/public-host.ts',
      options: serverModules,
      errors: [layoutStray],
    }),
    invalidWith({
      name: 'custom message',
      code,
      filename: 'apps/api/src/modules/chat/model-routing/routing.ts',
      options: [
        {
          layouts: [
            { root: '**/src/modules/*/', allow: ['services/**'], message: 'See SERVER.md.' },
          ],
        },
      ],
      errors: [
        {
          messageId: 'layoutStray',
          data: {
            root: '**/src/modules/*/',
            path: 'model-routing/routing.ts',
            allowed: '`services/**`',
            note: ' See SERVER.md.',
          },
        },
      ],
    }),
    invalidWith({
      name: 'serviceDirectories: service outside services under the root',
      code,
      filename: 'apps/api/src/modules/chat/streams/viewers.service.ts',
      options: [{ serviceDirectories: ['**/src/modules/*/'] }],
      errors: [serviceOutsideServices],
    }),
    invalidWith({
      name: 'both layout and service checks',
      code,
      filename: 'apps/api/src/modules/chat/transports/direct.service.ts',
      options: [{ ...serverModules[0], serviceDirectories: ['**/src/modules/*/'] }],
      errors: [layoutStray, serviceOutsideServices],
    }),
    invalidWith({
      name: 'allow for another file does not skip',
      code,
      filename: 'apps/api/src/modules/billing/services/is-uuid.ts',
      options: [{ allow: ['other.ts'] }],
      errors: [servicesFolderStray],
    }),
  ],
});
