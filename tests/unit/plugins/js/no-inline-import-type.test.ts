import { noInlineImportTypeName } from '../../../../src/plugins/js/rules/no-inline-import-type.ts';
import { error, invalidWith } from '../../lib/cases.ts';
import { runJsRule } from './harness.ts';

const inline = error('inlineImportType');

runJsRule(noInlineImportTypeName, {
  valid: [
    {
      code: 'import type { LightboxTravel } from "./lightbox-context";\nconst ref: LightboxTravel | null = null;',
    },
    {
      code: 'import { type LightboxTravel } from "./lightbox-context";\nfunction useRef<T>(value: T) { return value; }\nuseRef<LightboxTravel | null>(null);',
    },
    { code: 'const loaded = import("./lightbox-context");' },
    { code: 'async function load() { return await import("./lightbox-context"); }' },
    { code: 'type Travel = { id: string };\nconst ref: Travel | null = null;' },
  ],
  invalid: [
    invalidWith({
      code: 'function useRef<T>(_value: T) {}\nuseRef<import("./lightbox-context").LightboxTravel | null>(null);',
      errors: [inline],
    }),
    invalidWith({
      code: 'const travel: import("./lightbox-context").LightboxTravel = {};',
      errors: [inline],
    }),
    invalidWith({
      code: 'type Travel = import("./lightbox-context").LightboxTravel;',
      errors: [inline],
    }),
    invalidWith({
      code: 'function take(travel: import("./lightbox-context").LightboxTravel) {}',
      errors: [inline],
    }),
    invalidWith({
      code: 'type Module = typeof import("./lightbox-context");',
      errors: [inline],
    }),
    invalidWith({
      code: 'type Nested = import("./a").Foo<import("./b").Bar>;',
      errors: [inline, inline],
    }),
  ],
});
