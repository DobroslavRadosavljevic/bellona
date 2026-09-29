import { noGenericModuleNamesName } from '../../../../src/plugins/js/rules/no-generic-module-names.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runJsRule } from './harness.ts';

const genericName = error('genericName');
const code = 'export const value = 1;';

runJsRule(noGenericModuleNamesName, {
  valid: [
    validWith(code, { name: 'concept names', filename: 'src/pricing/price-rules.ts' }),
    validWith(code, { name: 'lib folder', filename: 'src/lib/format.ts' }),
    validWith(code, {
      name: 'TanStack -lib colocation folder',
      filename: 'src/routes/posts/-lib/post-query.ts',
    }),
    validWith(code, { name: 'shared is allowed by default', filename: 'src/shared/money.ts' }),
    validWith(code, { name: 'name only contains the word', filename: 'src/utilization/meter.ts' }),
    validWith(code, { name: 'prefix is not a suffix', filename: 'src/helper-text/field.tsx' }),
    validWith(code, { name: 'test file', filename: 'src/utils/format.test.ts' }),
    validWith(code, {
      name: 'singular suffix names a concept (a rule about the status helper)',
      filename: 'src/plugins/elysia/rules/prefer-status-helper.ts',
    }),
    validWith(code, { name: 'common suffix is not checked', filename: 'src/lowest-common.ts' }),
    validWith(code, { name: 'story file', filename: 'src/helpers.stories.tsx' }),
    validWith(code, { name: 'declaration file', filename: 'src/types/common.d.ts' }),
    validWith(code, {
      name: 'allow skips the file',
      filename: 'apps/web/cms/views/helpers.ts',
      options: [{ allow: ['cms/views/helpers.ts'] }],
    }),
    validWith(code, {
      name: 'custom names replace the default list',
      filename: 'src/utils/format.ts',
      options: [{ names: ['shared'] }],
    }),
  ],
  invalid: [
    invalidWith({
      name: 'utils folder',
      code,
      filename: 'apps/web/src/modules/onboarding/utils/person-name.ts',
      errors: [
        {
          messageId: 'genericName',
          data: { segment: 'utils', path: 'apps/web/src/modules/onboarding/utils/person-name.ts' },
        },
      ],
    }),
    invalidWith({
      name: 'helpers file',
      code,
      filename: 'apps/web/cms/views/helpers.ts',
      errors: [genericName],
    }),
    invalidWith({
      name: '-utils suffix',
      code,
      filename: 'packages/ui/charts/core/src/motion-utils.ts',
      errors: [genericName],
    }),
    invalidWith({
      name: '-helpers suffix',
      code,
      filename: 'packages/ui/charts/cartesian/src/time-series-chart-helpers.ts',
      errors: [genericName],
    }),
    invalidWith({
      name: 'dot suffix',
      code,
      filename: 'src/string.utils.ts',
      errors: [genericName],
    }),
    invalidWith({
      name: 'common folder',
      code,
      filename: 'src/common/index.ts',
      errors: [genericName],
    }),
    invalidWith({ name: 'misc file', code, filename: 'src/misc.tsx', errors: [genericName] }),
    invalidWith({
      name: 'TanStack -utils colocation folder',
      code,
      filename: 'src/routes/posts/-utils/format.ts',
      errors: [genericName],
    }),
    invalidWith({
      name: 'one report per file',
      code,
      filename: 'src/common/utils/helpers.ts',
      errors: [genericName],
    }),
    invalidWith({
      name: 'shared through names',
      code,
      filename: 'src/shared/money.ts',
      options: [{ names: ['shared'] }],
      errors: [genericName],
    }),
    invalidWith({
      name: 'allow for another file does not skip',
      code,
      filename: 'src/utils/format.ts',
      options: [{ allow: ['other.ts'] }],
      errors: [genericName],
    }),
  ],
});
