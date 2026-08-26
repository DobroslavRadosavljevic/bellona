import { noUselessReexportName } from '../../../../src/plugins/js/rules/no-useless-reexport.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runJsRule } from './harness.ts';

const reexportFile = error('reexportFile');
const starReexport = error('starReexport');
const passThrough = error('passThrough');
const importReexport = error('importReexport');

runJsRule(noUselessReexportName, {
  valid: [
    { name: 'local function', code: 'export function loadUser() { return 1; }' },
    { name: 'local const then export', code: 'const foo = 1;\nexport { foo };' },
    { name: 'default function', code: 'export default function load() { return 1; }' },
    { name: 'type alias', code: 'export type User = { id: string };' },
    { name: 'empty module marker', code: 'export {};' },
    { name: 'side-effect import only', code: "import './polyfill';" },
    {
      name: 'import used locally and re-exported',
      code: 'import { foo, fooName } from "./foo";\nconst plugin = { [fooName]: foo };\nexport { foo, fooName };',
    },
    {
      name: 'import used in a function and re-exported',
      code: 'import { foo } from "./foo";\nexport function useFoo() { return foo; }\nexport { foo };',
    },
    {
      name: 'type import used in a signature',
      code: 'import type { User } from "./user";\nexport function loadUser(user: User) { return user; }',
    },
    {
      name: 'type import used and re-exported',
      code: 'import type { User } from "./user";\nexport function loadUser(user: User) { return user; }\nexport type { User };',
    },
    {
      name: 'mixed file rename from source',
      code: 'export function load() { return 1; }\nexport { Internal as User } from "./internal";',
    },
    {
      name: 'mixed file default as name',
      code: 'export function load() { return 1; }\nexport { default as Button } from "./button";',
    },
    {
      name: 'mixed file import then rename export',
      code: 'import { foo } from "./foo";\nexport function load() { return 1; }\nexport { foo as bar };',
    },
    {
      name: 'export a local function by name',
      code: 'function inner() { const foo = 1; return foo; }\nexport { inner };',
    },
    {
      name: 'mixed file default import exported under a new name',
      code: 'import foo from "./foo";\nexport function load() { return 1; }\nexport { foo };',
    },
    {
      name: 'unused import is not a re-export',
      code: 'import { foo } from "./foo";\nexport function load() { return 1; }',
    },
    validWith('export * from "./foo";', {
      name: 'allow path substring',
      filename: 'src/public/index.ts',
      options: [{ allow: ['/public/'] }],
    }),
    validWith('export { foo } from "./foo";', {
      name: 'allow basename',
      filename: 'src/barrel.ts',
      options: [{ allow: ['barrel.ts'] }],
    }),
  ],
  invalid: [
    invalidWith({
      name: 'star re-export file',
      code: 'export * from "./foo";',
      errors: [reexportFile],
    }),
    invalidWith({
      name: 'namespace star re-export file',
      code: 'export * as Foo from "./foo";',
      errors: [reexportFile],
    }),
    invalidWith({
      name: 'type star re-export file',
      code: 'export type * from "./foo";',
      errors: [reexportFile],
    }),
    invalidWith({
      name: 'pass-through named re-export file',
      code: 'export { foo } from "./foo";',
      errors: [reexportFile],
    }),
    invalidWith({
      name: 'several pass-throughs still one file report',
      code: 'export { foo } from "./foo";\nexport { bar } from "./bar";',
      errors: [reexportFile],
    }),
    invalidWith({
      name: 'type-only re-export file',
      code: 'export type { User } from "./user";',
      errors: [reexportFile],
    }),
    invalidWith({
      name: 'inline type specifier re-export file',
      code: 'export { type User } from "./user";',
      errors: [reexportFile],
    }),
    invalidWith({
      name: 'default pass-through file',
      code: 'export { default } from "./button";',
      errors: [reexportFile],
    }),
    invalidWith({
      name: 'rename-only file is still a re-export file',
      code: 'export { Internal as User } from "./internal";',
      errors: [reexportFile],
    }),
    invalidWith({
      name: 'import then export file',
      code: 'import { foo } from "./foo";\nexport { foo };',
      errors: [reexportFile],
    }),
    invalidWith({
      name: 'import then default export file',
      code: 'import foo from "./foo";\nexport default foo;',
      errors: [reexportFile],
    }),
    invalidWith({
      name: 'namespace import then export file',
      code: 'import * as Foo from "./foo";\nexport { Foo };',
      errors: [reexportFile],
    }),
    invalidWith({
      name: 'type import then export file',
      code: 'import type { User } from "./user";\nexport type { User };',
      errors: [reexportFile],
    }),
    invalidWith({
      name: 'mixed file star re-export',
      code: 'export function load() { return 1; }\nexport * from "./foo";',
      errors: [starReexport],
    }),
    invalidWith({
      name: 'mixed file namespace star',
      code: 'export function load() { return 1; }\nexport * as Foo from "./foo";',
      errors: [starReexport],
    }),
    invalidWith({
      name: 'mixed file pass-through',
      code: 'export function load() { return 1; }\nexport { foo } from "./foo";',
      errors: [passThrough],
    }),
    invalidWith({
      name: 'mixed file two pass-throughs',
      code: 'export function load() { return 1; }\nexport { foo, bar } from "./foo";',
      errors: [passThrough, passThrough],
    }),
    invalidWith({
      name: 'mixed file same-name alias',
      code: 'export function load() { return 1; }\nexport { foo as foo } from "./foo";',
      errors: [passThrough],
    }),
    invalidWith({
      name: 'mixed file default pass-through',
      code: 'export function load() { return 1; }\nexport { default } from "./button";',
      errors: [passThrough],
    }),
    invalidWith({
      name: 'mixed file type pass-through',
      code: 'export function load() { return 1; }\nexport type { User } from "./user";',
      errors: [passThrough],
    }),
    invalidWith({
      name: 'mixed file import then export',
      code: 'import { foo } from "./foo";\nexport function load() { return 1; }\nexport { foo };',
      errors: [importReexport],
    }),
    invalidWith({
      name: 'mixed file import then default export of default import',
      code: 'import foo from "./foo";\nexport function load() { return 1; }\nexport default foo;',
      errors: [importReexport],
    }),
    invalidWith({
      name: 'mixed file namespace import then export',
      code: 'import * as Foo from "./foo";\nexport function load() { return 1; }\nexport { Foo };',
      errors: [importReexport],
    }),
    invalidWith({
      name: 'shadowed inner binding does not hide a pass-through export',
      code: 'import { foo } from "./foo";\nfunction inner() { const foo = 1; return foo; }\nexport { foo, inner };',
      errors: [importReexport],
    }),
    invalidWith({
      name: 'side-effect import does not hide pass-throughs',
      code: 'import "./polyfill";\nexport { foo } from "./foo";',
      errors: [passThrough],
    }),
    invalidWith({
      name: 'allowRenames false flags mixed-file rename',
      code: 'export function load() { return 1; }\nexport { Internal as User } from "./internal";',
      options: [{ allowRenames: false }],
      errors: [passThrough],
    }),
    invalidWith({
      name: 'allowRenames false flags mixed-file import rename',
      code: 'import { foo } from "./foo";\nexport function load() { return 1; }\nexport { foo as bar };',
      options: [{ allowRenames: false }],
      errors: [importReexport],
    }),
  ],
});
