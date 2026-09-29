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
    {
      name: 'global declaration file: a top-level import would make it a module',
      filename: 'worker-configuration.d.ts',
      code: 'declare namespace Cloudflare {\n  interface GlobalProps {\n    mainModule: typeof import("./src/index");\n  }\n}\ninterface Env { readonly FILES: import("./bucket").Bucket }',
    },
    {
      name: 'global declaration file with a .d.mts name',
      filename: 'env.d.mts',
      code: 'interface ImportMetaEnv { readonly MODE: import("./mode").Mode }',
    },
  ],
  invalid: [
    invalidWith({
      name: 'module declaration file',
      filename: 'types.d.ts',
      code: 'export type Travel = import("./lightbox-context").LightboxTravel;',
      errors: [inline],
    }),
    invalidWith({
      name: 'module declaration file with declare global',
      filename: 'global.d.ts',
      code: 'export {};\ndeclare global { interface Window { travel: import("./travel").Travel } }',
      errors: [inline],
    }),
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
