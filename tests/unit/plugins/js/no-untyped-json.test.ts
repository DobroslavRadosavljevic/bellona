import { noUntypedJsonName } from '../../../../src/plugins/js/rules/no-untyped-json.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runJsRule } from './harness.ts';

const untypedJson = error('untypedJson');

runJsRule(noUntypedJsonName, {
  valid: [
    { name: 'unknown binding', code: 'const data: unknown = JSON.parse(text);' },
    { name: 'direct decoder argument', code: 'const user = UserSchema.parse(JSON.parse(text));' },
    {
      name: 'direct argument after await',
      code: 'async function load(response: Response) { return UserSchema.parse(await response.json()); }',
    },
    { name: 'assert to unknown', code: 'const data = JSON.parse(text) as unknown;' },
    { name: 'satisfies', code: 'const data = JSON.parse(text) satisfies unknown;' },
    {
      name: 'function returns unknown',
      code: 'function read(text: string): unknown { return JSON.parse(text); }',
    },
    {
      name: 'async function returns Promise<unknown>',
      code: 'async function read(response: Response): Promise<unknown> { return await response.json(); }',
    },
    {
      name: 'arrow returns unknown',
      code: 'const read = (text: string): unknown => JSON.parse(text);',
    },
    { name: 'JSON.stringify is not a source', code: 'const text = JSON.stringify(value);' },
    { name: 'local JSON object', code: 'const JSON = { parse: () => 1 }; const n = JSON.parse();' },
    {
      name: 'json() with arguments is not a body read',
      code: 'async function f() { const value = await store.json("key"); }',
    },
    {
      name: 'json() not awaited',
      code: 'const load = () => fetch(url).then((response) => response.json());',
    },
    validWith('const data = JSON.parse(text);', {
      name: 'allow skips the file',
      filename: 'scripts/sync-models.ts',
      options: [{ allow: ['/scripts/'] }],
    }),
  ],
  invalid: [
    invalidWith({
      name: 'unannotated binding',
      code: 'const data = JSON.parse(text);',
      errors: [untypedJson],
    }),
    invalidWith({
      name: 'destructured binding',
      code: 'const { id } = JSON.parse(text);',
      errors: [untypedJson],
    }),
    invalidWith({
      name: 'domain annotation is an unchecked cast',
      code: 'const user: User = JSON.parse(text);',
      errors: [untypedJson],
    }),
    invalidWith({
      name: 'assertion',
      code: 'const user = JSON.parse(text) as User;',
      errors: [untypedJson],
    }),
    invalidWith({
      name: 'angle assertion',
      code: 'const user = <User>JSON.parse(text);',
      errors: [untypedJson],
    }),
    invalidWith({
      name: 'member access',
      code: 'const id = JSON.parse(text).id;',
      errors: [untypedJson],
    }),
    invalidWith({
      name: 'computed JSON.parse access',
      code: 'const id = JSON["parse"](text)?.id;',
      errors: [untypedJson],
    }),
    invalidWith({
      name: 'returned',
      code: 'function read(text: string) { return JSON.parse(text); }',
      errors: [untypedJson],
    }),
    invalidWith({
      name: 'arrow body',
      code: 'const read = (text: string) => JSON.parse(text);',
      errors: [untypedJson],
    }),
    invalidWith({
      name: 'awaited body returned',
      code: 'async function load(response: Response) { return await response.json(); }',
      errors: [untypedJson],
    }),
    invalidWith({
      name: 'awaited body in a binding',
      code: 'async function load(response: Response) { const body = await response.clone().json(); return body; }',
      errors: [untypedJson],
    }),
    invalidWith({
      name: 'awaited body member access',
      code: 'async function load(response: Response) { return (await response.json()).items; }',
      errors: [untypedJson],
    }),
    invalidWith({
      name: 'allow for another path does not skip',
      code: 'const data = JSON.parse(text);',
      filename: 'src/app.ts',
      options: [{ allow: ['/scripts/'] }],
      errors: [untypedJson],
    }),
  ],
});
