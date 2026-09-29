import { noKnownValueWideningName } from '../../../../src/plugins/js/rules/no-known-value-widening.ts';
import { runJsRule } from './harness.ts';

const error = { messageId: 'widening' };
const anonymous = { messageId: 'anonymousObject' };

const prelude = 'type Command = () => void; const startCommand = () => {};';

runJsRule(noKnownValueWideningName, {
  valid: [
    `${prelude} const commands: Record<string, Command> = {};`,
    `${prelude} type Index<T> = Record<string, T>; const commands: Index<Command> = {};`,
    `${prelude} class Registry { commands: Record<string, Command> = {}; }`,
    `${prelude} class Registry { accessor commands: Record<string, Command> = {}; }`,
    `${prelude} let commands: Record<string, Command>; commands = {};`,
    `${prelude} function create(): Record<string, Command> { return {}; }`,
    `${prelude} const create = (): Record<string, Command> => ({});`,
    `${prelude} const commands = {} as Record<string, Command>;`,
    `${prelude} const commands = <Record<string, Command>>{};`,
    `${prelude} const commands = { start: startCommand };`,
    `${prelude} const commands = { start: startCommand } as const;`,
    `${prelude} const commands = { start: startCommand } satisfies Record<string, Command>;`,
    `${prelude} type Commands = Record<string, Command>; const commands = { start: startCommand } as const satisfies Commands;`,
    `${prelude} interface Commands { readonly start: Command } const commands: Commands = { start: startCommand };`,
    `${prelude} type Commands = { readonly start: Command }; const commands: Commands = { start: startCommand };`,
    `${prelude} type PermissionLevels = { readonly [Level in Permission]: number }; const levels: PermissionLevels = { admin: 1 };`,
    `${prelude} function create() { return { start: startCommand }; }`,
    `${prelude} interface Commands { readonly start: Command } function create(): Commands { return { start: startCommand }; }`,
    `${prelude} declare function make(): Record<string, Command>; const commands: Record<string, Command> = make();`,
    `${prelude} import { Commands } from './types'; const commands: Commands = { start: startCommand };`,
    // A closed key union makes the map exhaustive. That adds a check; it does not widen.
    'type Tone = "info" | "warn"; const badge: Record<Tone, string> = { info: "a", warn: "b" };',
    'import type { Tone } from "./tone"; const badge: Record<Tone, string> = { info: "a", warn: "b" };',
    'import type { Tone } from "./tone"; const badge: Partial<Record<Tone, string>> = { info: "a" };',
    'import type { Tone } from "./tone"; type Badges = Record<Tone, string>; const badge: Badges = { info: "a", warn: "b" };',
    'import type { Tone } from "./tone"; const badge: { [K in Tone]: string } = { info: "a", warn: "b" };',
    'import type { Tone } from "./tone"; type ByTone<V> = Record<Tone, V>; const badge: ByTone<string> = { info: "a", warn: "b" };',
    'const labels = { a: 1 }; function f(): Record<keyof typeof labels, number> { return { a: 2 }; }',
    // A lookup by a runtime key needs the dictionary type. Inference rejects `prices[id]` (TS7053).
    'const prices: Record<string, number> = { a: 1 };\nexport function price(id: string) { return prices[id]; }',
    'const counts: Record<string, number> = { total: 0 };\nfor (const key of keys) counts[key] = 1;',
    'let counts: Record<string, number>;\ncounts = { total: 0 };\nexport const read = (key: string) => counts[key];',
  ],
  invalid: [
    { code: 'const value: unknown = {};', errors: [error] },
    { code: 'const value: object = {};', errors: [error] },
    { code: 'let value: unknown; value = {};', errors: [error] },
    { code: 'function create(): unknown { return {}; }', errors: [error] },
    {
      code: `${prelude} const commands: Record<string, Command> = { start: startCommand };`,
      errors: [error],
    },
    {
      code: `${prelude} const commands: { [key: string]: Command } = { start: startCommand };`,
      errors: [error],
    },
    {
      code: `${prelude} const commands: { [K in string]: Command } = { start: startCommand };`,
      errors: [error],
    },
    {
      code: `${prelude} const commands: { start: Command } = { start: startCommand };`,
      errors: [anonymous],
    },
    {
      code: 'type Key = string; const prices: Record<Key, number> = { a: 1 };',
      errors: [error],
    },
    {
      code: 'const prices: Record<`model-${string}`, number> = { "model-a": 1 };',
      errors: [error],
    },
    {
      code: 'const prices: Record<string, number> = { a: 1 };\nexport const a = prices["a"] + prices.a;',
      errors: [error],
    },
    {
      code: `${prelude} const commands = { start: startCommand } as Record<string, Command>;`,
      errors: [error],
    },
    {
      code: `${prelude} const commands = ({ start: startCommand } as Record<string, Command>) as object;`,
      errors: 1,
    },
    {
      code: `${prelude} class Registry { commands: Record<string, Command> = { start: startCommand }; }`,
      errors: [error],
    },
    {
      code: `${prelude} let commands: Record<string, Command>; commands = { start: startCommand };`,
      errors: [error],
    },
    {
      code: `${prelude} function create(): Record<string, Command> { return { start: startCommand }; }`,
      errors: [error],
    },
    {
      code: `${prelude} function create(): { start: Command } { return { start: startCommand }; }`,
      errors: [anonymous],
    },
    {
      code: `${prelude} const source = { start: startCommand }; const commands: Record<string, Command> = source;`,
      errors: [error],
    },
    {
      code: `${prelude} type Open = Record<string, Command>; const source = { start: startCommand }; const commands: Open = source;`,
      errors: [error],
    },
    {
      code: `${prelude} type Open = { [key: string]: Command }; const source = { start: startCommand }; const commands: Open = source;`,
      errors: [error],
    },
    {
      code: `${prelude} type Open = { [key in string]: Command }; const source = { start: startCommand }; const commands: Open = source;`,
      errors: [error],
    },
    {
      code: `${prelude} type Open = Readonly<Record<string, Command>>; const source = { start: startCommand }; const commands: Open = source;`,
      errors: [error],
    },
    {
      code: `${prelude} type Index<T> = Record<string, T>; const commands: Index<Command> = { start: startCommand };`,
      errors: [error],
    },
    {
      code: `${prelude} type Index<T> = Record<string, T>; type CommandsByName = Index<Command>; const commands: CommandsByName = { start: startCommand };`,
      errors: [error],
    },
    {
      code: `${prelude} type Index<T = Command> = Record<string, T>; const commands: Index = { start: startCommand };`,
      errors: [error],
    },
    { code: 'const value: unknown = 1;', errors: [error] },
    { code: 'const value: object = [];', errors: [error] },
  ],
});
