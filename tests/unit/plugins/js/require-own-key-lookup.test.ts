import { requireOwnKeyLookupName } from '../../../../src/plugins/js/rules/require-own-key-lookup.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runJsRule } from './harness.ts';

const ownKeyLookup = error('ownKeyLookup');

const table = 'const prices: Record<string, number> = { a: 1 };\n';

runJsRule(requireOwnKeyLookupName, {
  valid: [
    { name: 'static key', code: `${table}export const a = prices["a"] + prices.a;` },
    {
      name: 'Object.hasOwn guard',
      code: `${table}export function price(id: string) { return Object.hasOwn(prices, id) ? prices[id] : undefined; }`,
    },
    {
      name: 'early return guard',
      code: `${table}export function price(id: string) { if (!Object.hasOwn(prices, id)) return 0; return prices[id]; }`,
    },
    {
      name: 'hasOwnProperty.call guard',
      code: `${table}export function price(id: string) { return Object.prototype.hasOwnProperty.call(prices, id) ? prices[id] : 0; }`,
    },
    {
      name: 'guard in the outer function',
      code: `${table}export function price(id: string) { if (Object.hasOwn(prices, id)) return [1].map(() => prices[id]); return []; }`,
    },
    {
      name: 'for-in key',
      code: `${table}for (const key in prices) use(prices[key]);`,
    },
    {
      name: 'for-of Object.keys key',
      code: `${table}for (const key of Object.keys(prices)) use(prices[key]);`,
    },
    {
      name: 'Object.keys callback key',
      code: `${table}export const total = Object.keys(prices).map((key) => prices[key]);`,
    },
    {
      name: 'the same key was written before the read',
      code: 'const sizes: Record<string, number> = {};\nexport function resize(ids: string[]) {\n  ids.forEach((id) => { sizes[id] = 1; });\n  ids.forEach((id) => use(sizes[id]));\n}',
    },
    { name: 'write only', code: `${table}export function set(id: string) { prices[id] = 2; }` },
    {
      name: 'closed key union',
      code: 'type Tone = "info" | "warn";\nconst badge: Record<Tone, string> = { info: "a", warn: "b" };\nexport const read = (tone: Tone) => badge[tone];',
    },
    {
      name: 'Map',
      code: 'const prices = new Map<string, number>();\nexport const read = (id: string) => prices.get(id);',
    },
    {
      name: 'null prototype table',
      code: 'const prices: Record<string, number> = Object.create(null);\nexport const read = (id: string) => prices[id];',
    },
    {
      name: 'let binding is out of scope',
      code: 'let prices: Record<string, number> = { a: 1 };\nexport const read = (id: string) => prices[id];',
    },
    {
      name: 'no annotation',
      code: 'const prices = { a: 1 };\nexport const read = (id: "a") => prices[id];',
    },
    {
      name: 'parameter table',
      code: 'export const read = (prices: Record<string, number>, id: string) => prices[id];',
    },
    {
      name: 'array index',
      code: 'const items: string[] = ["a"];\nexport const read = (index: number) => items[index];',
    },
    validWith(`${table}export const read = (id: string) => prices[id];`, {
      name: 'allow skips the file',
      filename: 'src/generated/prices.ts',
      options: [{ allow: ['/generated/'] }],
    }),
  ],
  invalid: [
    invalidWith({
      name: 'runtime key read',
      code: `${table}export const read = (id: string) => prices[id];`,
      errors: [ownKeyLookup],
    }),
    invalidWith({
      name: 'in is not an own-key check',
      code: `${table}export const read = (id: string) => (id in prices ? prices[id] : 0);`,
      errors: [ownKeyLookup],
    }),
    invalidWith({
      name: 'guard on another key',
      code: `${table}export const read = (id: string, other: string) => (Object.hasOwn(prices, other) ? prices[id] : 0);`,
      errors: [ownKeyLookup],
    }),
    invalidWith({
      name: 'guard in another function',
      code: `${table}const has = (id: string) => Object.hasOwn(prices, id);\nexport const read = (id: string) => prices[id];`,
      errors: [ownKeyLookup],
    }),
    invalidWith({
      name: 'counting accumulator',
      code: 'const counts: Record<string, number> = {};\nexport function count(word: string) { counts[word] = (counts[word] ?? 0) + 1; }',
      errors: [ownKeyLookup],
    }),
    invalidWith({
      name: 'write of another key does not count',
      code: 'const sizes: Record<string, number> = {};\nexport function f(a: string, b: string) { sizes[a] = 1; return sizes[b]; }',
      errors: [ownKeyLookup],
    }),
    invalidWith({
      name: 'index signature literal type',
      code: 'const labels: { [key: string]: string } = { save: "Save" };\nexport const label = (key: string) => labels[key];',
      errors: [ownKeyLookup],
    }),
    invalidWith({
      name: 'open-key alias',
      code: 'type Prices = Readonly<Record<string, number>>;\nconst prices: Prices = { a: 1 };\nexport const read = (id: string) => prices[id];',
      errors: [ownKeyLookup],
    }),
    invalidWith({
      name: 'template key',
      code: 'const models: Record<`m-${string}`, number> = { "m-a": 1 };\nexport const read = (id: `m-${string}`) => models[id];',
      errors: [ownKeyLookup],
    }),
    invalidWith({
      name: 'allow for another path does not skip',
      code: `${table}export const read = (id: string) => prices[id];`,
      filename: 'src/prices.ts',
      options: [{ allow: ['/generated/'] }],
      errors: [ownKeyLookup],
    }),
  ],
});
