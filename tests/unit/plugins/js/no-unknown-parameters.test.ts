import { noUnknownParametersName } from '../../../../src/plugins/js/rules/no-unknown-parameters.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runJsRule } from './harness.ts';

const unknownParameter = error('unknownParameter');

runJsRule(noUnknownParametersName, {
  valid: [
    'function handle(input: User) {}',
    'function wrap(cause: unknown) {}',
    'const wrap = (cause: unknown) => {};',
    'type Handler = (cause: unknown) => void;',
    'interface Handler { handle(cause: unknown): void }',
    'function generic<Value>(value: Value) {}',
    {
      name: 'decoder: one unknown input, a data return type, no assertion (kuzenbo lightbox)',
      code: 'export function readLightboxIndex(payload: unknown): number | undefined {\n  if (typeof payload === "number" && Number.isFinite(payload)) {\n    return payload;\n  }\n  if (payload !== null && typeof payload === "object" && "index" in payload && typeof payload.index === "number") {\n    return payload.index;\n  }\n  return undefined;\n}',
    },
    {
      name: 'arrow decoder',
      code: 'const readPort = (value: unknown): number | null => (typeof value === "number" ? value : null);',
    },
    {
      name: 'decoder that throws',
      code: 'function readName(value: unknown): string { if (typeof value !== "string") throw new TypeError("name"); return value; }',
    },
    {
      name: 'async decoder',
      code: 'async function readCount(value: unknown): Promise<number | undefined> { return typeof value === "number" ? value : undefined; }',
    },
    // A callback type in parameter position is called by this function. Its input flows out, to the decoder.
    'function fetchJson<A>(url: string, decode: (body: unknown) => A): Promise<A> { return load(url).then(decode); }',
    'const fetchJson = <A>(url: string, decode?: ((body: unknown) => A) | undefined) => load(url, decode);',
    'function fetchJson<A>(url: string, options: { decode: (body: unknown) => A }) { return load(url, options.decode); }',
    'function fetchJson<A>(url: string, options: { decode(body: unknown): A }) { return load(url, options); }',
    'interface Client { get<A>(url: string, decode: (body: unknown) => A): Promise<A> }',
    'declare function fetchJson<A>(url: string, decode: (body: unknown) => A): Promise<A>;',
    // Callers see only the overload signatures, not the implementation signature.
    'function parse(input: string): number;\nfunction parse(input: number): number;\nfunction parse(input: unknown): number { return 1; }',
    'export function parse(input: string): number;\nexport function parse(input: unknown): number { return 1; }',
    'class Parser { parse(input: string): number; parse(input: unknown): number { return 1; } }',
    validWith('function parse(payload: unknown) {}', { options: [{ allow: ['payload'] }] }),
  ],
  invalid: [
    {
      code: 'function parse(input: unknown): number;\nfunction parse(input: unknown): number { return 1; }',
      errors: [unknownParameter],
    },
    {
      code: 'class Parser { static parse(input: string): number; parse(input: unknown): number { return 1; } }',
      options: [{ allowDecoders: false }],
      errors: [unknownParameter],
    },
    { code: 'function handle(input: unknown) {}', errors: [unknownParameter] },
    { code: 'const handle = (input: unknown) => {};', errors: [unknownParameter] },
    { code: 'type Handler = (input: unknown) => void;', errors: [unknownParameter] },
    { code: 'interface Handler { handle(input: unknown): void }', errors: [unknownParameter] },
    { code: 'declare function handle(input: unknown): void;', errors: [unknownParameter] },
    {
      name: 'decoder is off with allowDecoders: false',
      code: 'export function readLightboxIndex(payload: unknown): number | undefined {\n  if (typeof payload === "number" && Number.isFinite(payload)) {\n    return payload;\n  }\n  if (payload !== null && typeof payload === "object" && "index" in payload && typeof payload.index === "number") {\n    return payload.index;\n  }\n  return undefined;\n}',
      options: [{ allowDecoders: false }],
      errors: [unknownParameter],
    },
    {
      name: 'an assertion means the checks did not prove the return value',
      code: 'function read(value: unknown): number { if (typeof value === "object") return 0; return value as number; }',
      errors: [unknownParameter],
    },
    {
      name: 'any inside the body',
      code: 'function read(value: unknown): number { const loose: any = value; return typeof loose === "number" ? loose : 0; }',
      errors: [unknownParameter],
    },
    {
      name: 'no return type',
      code: 'function read(value: unknown) { return typeof value === "number" ? value : 0; }',
      errors: [unknownParameter],
    },
    {
      name: 'boolean return is a check, not a decoded value',
      code: 'function isPort(value: unknown): boolean { return typeof value === "number"; }',
      errors: [unknownParameter],
    },
    {
      name: 'void return',
      code: 'function check(value: unknown): void { if (typeof value !== "number") throw new Error(); }',
      errors: [unknownParameter],
    },
    {
      name: 'return type with unknown',
      code: 'function read(value: unknown): number | unknown { return typeof value === "number" ? value : 0; }',
      errors: [unknownParameter],
    },
    {
      name: 'a second parameter',
      code: 'function read(value: unknown, fallback: number): number { return typeof value === "number" ? value : fallback; }',
      errors: [unknownParameter],
    },
    {
      code: 'function makeHandler(): (input: unknown) => void { return run; }',
      errors: [unknownParameter],
    },
    {
      code: 'type Decoder<A> = (body: unknown) => A;',
      errors: [unknownParameter],
    },
    {
      code: 'interface Options<A> { decode: (body: unknown) => A }',
      errors: [unknownParameter],
    },
    {
      code: 'type Outer = (register: (handler: (input: unknown) => void) => void) => void;',
      errors: [unknownParameter],
    },
    invalidWith({
      code: 'function wrap(cause: unknown) {}',
      options: [{ allow: [] }],
      errors: [unknownParameter],
    }),
  ],
});
