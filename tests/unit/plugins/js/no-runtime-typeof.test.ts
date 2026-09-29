import { noRuntimeTypeofName } from '../../../../src/plugins/js/rules/no-runtime-typeof.ts';
import { runJsRule } from './harness.ts';

const error = { messageId: 'runtimeTypeof' };
const allowInTypeGuards = [{ allowInTypeGuards: true }];

runJsRule(noRuntimeTypeofName, {
  valid: [
    'const value = input;',
    'export const isServer = typeof window === "undefined";',
    'if (typeof Bun !== "undefined") start();',
    'const canClone = typeof globalThis.structuredClone === "function";',
    'type Loader = typeof load;',
    {
      code: 'function isString(value: unknown): value is string { return typeof value === "string"; }',
      options: allowInTypeGuards,
    },
    {
      code: 'const isString = (value: unknown): value is string => typeof value === "string";',
      options: allowInTypeGuards,
    },
    {
      code: 'function assertString(value: unknown): asserts value is string { if (typeof value !== "string") throw new Error(); }',
      options: allowInTypeGuards,
    },
    // A declared union is the contract. `typeof` is how TypeScript narrows it.
    {
      name: 'parameter union with a primitive keyword',
      code: 'import type { Breakpoint } from "./breakpoints";\nfunction px(value: Breakpoint | number): number { return typeof value === "number" ? value : 0; }',
    },
    {
      name: 'parameter union with a function type',
      code: 'import type { CSSProperties } from "react";\nfunction staticStyle(style: CSSProperties | ((state: State) => CSSProperties) | undefined) { return typeof style === "function" ? undefined : style; }',
    },
    {
      name: 'state class name: string or a function of state, compared with "function"',
      code: 'type State = { open: boolean };\nexport function resolveStateClassName(className: string | ((state: State) => string) | undefined, state: State): string | undefined {\n  return typeof className === "function" ? className(state) : className;\n}',
    },
    {
      name: 'state class name through a generic function alias (kuzenbo shape)',
      code: 'type StateClassNameFn<State> = (state: State) => string | undefined;\nexport function resolveStateClassName<State>(className: string | StateClassNameFn<State> | undefined, state: State) {\n  return typeof className === "function" ? className(state) : className;\n}',
    },
    {
      name: 'generic function alias alone with undefined',
      code: 'type Callback<T> = (value: T) => void;\nfunction run<T>(callback: Callback<T> | undefined, value: T) { if (typeof callback === "function") callback(value); }',
    },
    {
      name: 'local alias that resolves to a narrowable union',
      code: 'type Style = Css | ((state: State) => Css);\nfunction staticStyle(style: Style) { return typeof style === "function" ? undefined : style; }',
    },
    {
      name: 'union member through a local alias',
      code: 'type Size = number;\nfunction size(value: Size | "auto") { return typeof value === "number" ? value : 0; }',
    },
    {
      name: 'optional parameter adds undefined',
      code: 'function run(callback?: () => void) { if (typeof callback === "function") callback(); }',
    },
    {
      name: 'defaulted parameter',
      code: 'function pad(value: string | number = 0) { return typeof value === "string" ? value : String(value); }',
    },
    {
      name: 'parameter property',
      code: 'class Box { constructor(private readonly size: number | "auto") { log(typeof size === "number"); } }',
    },
    {
      name: 'string literal member and object member',
      code: 'function parse(query: "all" | Query) { return typeof query === "string" ? query : build(query); }',
    },
    {
      name: 'branded string member',
      code: 'function parse(query: Query | (string & {})) { return typeof query === "string" ? query : build(query); }',
    },
    {
      name: 'annotated local binding',
      code: 'const input: string | number = read();\nexport const isText = typeof input === "string";',
    },
    {
      name: 'declared constant',
      code: 'declare const input: string | number;\nif (typeof input === "string") use(input);',
    },
    {
      name: 'parameter name shadows a global',
      code: 'function f(window: string | number) { return typeof window === "string"; }',
    },
    {
      name: 'member of a local interface',
      code: 'interface Props { style?: Css | ((state: State) => Css) }\nfunction Input(props: Props) { return typeof props.style === "function"; }',
    },
    {
      name: 'destructured member of a local type alias',
      code: 'type Props = { size: number | "auto"; label: string };\nfunction Input({ size }: Props) { return typeof size === "number"; }',
    },
    {
      name: 'destructured member of an inline type',
      code: 'function Input({ style }: { style: Css | (() => Css) }) { return typeof style === "function"; }',
    },
    {
      name: 'member of an intersection alias',
      code: 'type Props = Base & { size: number | "auto" };\nfunction Input(props: Props) { return typeof props.size === "number"; }',
    },
    // A type parameter narrows like its constraint.
    {
      name: 'generic guard constrained to a local union (coordinator repro)',
      code: 'type Probe = number | string | (() => void) | undefined;\nexport function a<T extends Probe>(value: T): value is Extract<T, number> {\n  return typeof value === "number";\n}',
    },
    {
      name: 'chart-datum guards with a declared constraint',
      code: 'export type ChartScalar = boolean | Date | null | number | string;\nexport type ChartCallable = (...args: never[]) => ChartScalar | undefined;\ntype ChartValue = ChartScalar | ChartScalar[] | ChartCallable | undefined;\nexport function isChartNumber<T extends ChartValue>(value: T): value is Extract<T, number> {\n  return typeof value === "number" && Number.isFinite(value);\n}\nexport function isChartString<T extends ChartValue>(value: T): value is Extract<T, string> {\n  return typeof value === "string";\n}\nexport function isChartFunction<T extends ChartValue>(value: T): value is Extract<T, ChartCallable> {\n  return typeof value === "function";\n}',
    },
    {
      name: 'inline union constraint',
      code: 'const size = <T extends number | "auto">(value: T) => (typeof value === "number" ? value : 0);',
    },
    {
      name: 'class type parameter',
      code: 'class Cell<T extends string | number> { read(value: T) { return typeof value === "string"; } }',
    },
    {
      name: 'type parameter constrained by another type parameter',
      code: 'function f<A extends string | number, B extends A>(value: B) { return typeof value === "string"; }',
    },
    {
      name: 'type parameter in a union annotation',
      code: 'function f<T extends string | number>(value: T | undefined) { return typeof value === "string"; }',
    },
    {
      name: 'type parameter shadows a local alias of the same name',
      code: 'type T = { id: string };\nfunction f<T extends string | number>(value: T) { return typeof value === "string"; }',
    },
    // A default does not change the declared type of a destructured member.
    {
      name: 'destructured member with a renamed default (funnel-chart shape)',
      code: 'interface GridConfig { stroke: string }\ninterface FunnelChartProps { grid?: boolean | GridConfig }\nexport function FunnelChart({ grid: gridProp = false }: FunnelChartProps) {\n  return typeof gridProp === "object" ? gridProp : {};\n}',
    },
    {
      name: 'destructured member with a default',
      code: 'type P = { grid?: boolean | { stroke: string } };\nfunction a({ grid = false }: P) { return typeof grid === "object"; }',
    },
    // A named type that this file cannot see is a declared contract. Other bl-js rules check it where it is declared.
    {
      name: 'imported union (sparkbar shape)',
      code: 'import type { SparkbarDatum } from "./sparkbar-types";\nfunction value(item: SparkbarDatum) { return typeof item === "number" ? item : item.value; }',
    },
    {
      name: 'indexed access type (chart-child-passthrough shape)',
      code: 'import type { ReactElement } from "react";\nexport function isDomHostType(type: ReactElement["type"]): type is string {\n  return typeof type === "string";\n}',
    },
    {
      name: 'indexed access on a name this file does not import',
      code: 'function f(style: InputProps["style"]) { return typeof style === "function"; }',
    },
    {
      name: 'qualified name',
      code: 'function f(node: React.ReactNode) { return typeof node === "string"; }',
    },
    {
      name: 'type query',
      code: 'import { defaults } from "./defaults";\nfunction f(value: typeof defaults.size) { return typeof value === "number"; }',
    },
    {
      name: 'type parameter constrained to an imported alias',
      code: 'import type { Probe } from "./probe";\nfunction f<T extends Probe>(value: T) { return typeof value === "number"; }',
    },
    {
      name: 'member of an imported props type',
      code: 'import type { Props } from "./props";\nfunction f(props: Props) { return typeof props.size === "number"; }',
    },
    {
      name: 'destructured member of an imported props type',
      code: 'import type { Props } from "./props";\nfunction f({ size }: Props) { return typeof size === "number"; }',
    },
    {
      name: 'member that a local interface inherits from an imported base',
      code: 'import type { Base } from "./base";\ninterface Props extends Base { label: string }\nfunction f({ size }: Props) { return typeof size === "number"; }',
    },
    // Trace a const back to an annotated source (kuzenbo charts).
    {
      name: 'member of a parameter typed Props | undefined (line-chart-inner shape)',
      code: 'import type { ReactElement } from "react";\nimport type { LineProps } from "./line";\nfunction registersLineDomain(child: ReactElement, props: LineProps | undefined) {\n  if (!props?.dataKey) return false;\n  return typeof props.dataKey === "string" && props.dataKey.length > 0;\n}',
    },
    {
      name: 'member of an as result with undefined (bar-chart-core shape)',
      code: 'import type { BarProps } from "./bar";\nexport function isBar(child: { props: object }) {\n  // SAFETY: chart child props are typed at the call site.\n  const props = child.props as BarProps | undefined;\n  return props !== undefined && typeof props.dataKey === "string";\n}',
    },
    {
      name: 'optional chain member of an as result (area-chart-inner shape)',
      code: 'import type { AreaProps } from "./area";\nexport function isArea(child: { props: object }) {\n  const props = child.props as AreaProps | undefined;\n  return typeof props?.dataKey === "string";\n}',
    },
    {
      name: 'member of a local interface through a union with undefined',
      code: 'interface ScatterProps { dataKey?: string | number }\nfunction f(props: ScatterProps | undefined) { return typeof props?.dataKey === "string"; }',
    },
    {
      name: 'for-of element of a readonly imported array (sparkbar-values shape)',
      code: 'import type { SparkbarDatum } from "./sparkbar-types";\nexport function sparkbarValues(data: readonly SparkbarDatum[]): number[] {\n  const values: number[] = [];\n  for (const item of data) {\n    if (typeof item === "number") values.push(item);\n    else if (typeof item.value === "number") values.push(item.value);\n  }\n  return values;\n}',
    },
    {
      name: 'conditional of a for-of element (sparkline-values shape)',
      code: 'import type { SparklineDatum } from "./sparkline-types";\nexport function sparklineValues(data: readonly SparklineDatum[]): number[] {\n  const values: number[] = [];\n  for (const item of data) {\n    const value = typeof item === "number" ? item : item.value;\n    if (typeof value === "number") values.push(value);\n  }\n  return values;\n}',
    },
    {
      name: 'indexed read of an imported row (projection-utils shape)',
      code: 'import type { ChartDatum } from "@kuzenbo/chart-core/chart-datum";\nfunction readDate(row: ChartDatum, xDataKey: string): Date | null {\n  const raw = row[xDataKey];\n  if (typeof raw === "number" || typeof raw === "string") return new Date(raw);\n  return null;\n}',
    },
    {
      name: 'Array<T> and ReadonlyArray<T> elements of a local union',
      code: 'type Cell = string | number;\nfunction f(a: Array<Cell>, b: ReadonlyArray<Cell>) { for (const x of a) typeof x; for (const y of b) typeof y; }',
    },
    {
      name: 'indexed read of a local dictionary with a narrowable value',
      code: 'type Row = Record<string, string | number | undefined>;\nfunction f(row: Row, key: string) { const raw = row[key]; return typeof raw === "string"; }',
    },
    {
      name: 'destructured element of a traced value',
      code: 'interface Point { x: number | string }\nfunction f(points: readonly Point[]) { for (const { x } of points) { if (typeof x === "number") use(x); } }',
    },
    {
      name: 'const copy of an annotated parameter',
      code: 'function f(value: string | number) { const copy = value; return typeof copy === "string"; }',
    },
    // A global lib type alias is a declared contract, unless it is a known object type.
    {
      name: 'lib.dom FormDataEntryValue (File | string)',
      code: 'function formEntryText(entry: FormDataEntryValue) {\n  return typeof entry === "string" ? entry : entry.name;\n}',
    },
    {
      name: 'global PropertyKey',
      code: 'function keyText(key: PropertyKey) { return typeof key === "symbol" ? key.toString() : String(key); }',
    },
    {
      name: 'Partial of a local interface member',
      code: 'interface Props { size: number | "auto" }\nfunction f(props: Partial<Props>) { return typeof props.size === "number"; }',
    },
    {
      name: 'Readonly, NonNullable, and Awaited resolve through their argument',
      code: 'type Cell = string | number;\nfunction f(a: Readonly<Cell>, b: NonNullable<Cell | undefined>, c: Awaited<Cell>) { return [typeof a, typeof b, typeof c]; }',
    },
    {
      name: 'member of a global lib type',
      code: 'function f(init: RequestInit) { return typeof init.body === "string"; }',
    },
    // A small hand-written decoder is the boundary. TypeScript proves each return value.
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
    // A schema predicate is the boundary decoder that the rule asks for.
    {
      name: 'z.custom predicate',
      code: 'const Geometry = z.custom<Geometry>((value) => typeof value === "object" && value !== null && "type" in value);',
    },
    {
      name: 'refine and superRefine callbacks',
      code: 'const A = z.unknown().refine((value) => typeof value === "string");\nconst B = z.unknown().superRefine((value, ctx) => { if (typeof value !== "string") ctx.addIssue("text"); });',
    },
    {
      name: 'Effect Schema.declare, Schema.makeFilter, and Schema.filter',
      code: 'const A = Schema.declare((input) => typeof input === "string");\nconst B = Schema.makeFilter((input) => typeof input === "number");\nconst C = Schema.filter((input) => typeof input === "bigint");',
    },
    {
      name: 'Predicate combinator',
      code: 'const isText = Predicate.or((value) => typeof value === "string", isNumber);',
    },
    {
      name: 'helper inside a schema predicate',
      code: 'const A = z.custom((value) => { const isText = () => typeof value === "string"; return isText(); });',
    },
    {
      name: 'type guard on a union without the option',
      code: 'const isText = (value: string | number): value is string => typeof value === "string";',
    },
  ],
  invalid: [
    {
      code: 'import { value } from "./value";\nexport const isText = typeof value === "string";',
      errors: [error],
    },
    { code: 'const isText = typeof globalThis.payload.name === "string";', errors: [error] },
    {
      code: 'function isString(value: unknown): value is string { return typeof value === "string"; }',
      errors: [error],
    },
    {
      name: 'allowInTypeGuards does not cover a decoder when allowDecoders is off',
      code: 'function parse(value: unknown): string { if (typeof value !== "string") throw new Error(); return value; }',
      options: [{ allowInTypeGuards: true, allowDecoders: false }],
      errors: [error],
    },
    {
      code: 'function isString(value: unknown): value is string { const check = () => typeof value === "string"; return check(); }',
      options: allowInTypeGuards,
      errors: [error],
    },
    {
      name: 'unknown parameter',
      code: 'function f(value: unknown) { return typeof value === "string"; }',
      errors: [error],
    },
    {
      name: 'any parameter',
      code: 'function f(value: any) { return typeof value === "string"; }',
      errors: [error],
    },
    {
      name: 'unannotated parameter',
      code: 'function f(value) { return typeof value === "string"; }',
      errors: [error],
    },
    {
      name: 'unannotated local',
      code: 'const data = JSON.parse(text);\nexport const isText = typeof data === "string";',
      errors: [error],
    },
    {
      name: 'union with unknown is unknown',
      code: 'function f(value: string | unknown) { return typeof value === "string"; }',
      errors: [error],
    },
    {
      name: 'single primitive: nothing to narrow',
      code: 'function f(value: string) { return typeof value === "string"; }',
      errors: [error],
    },
    {
      name: 'object union has no typeof member',
      code: 'interface User { id: string }\ninterface Team { name: string }\nfunction f(value: User | Team) { return typeof value === "object"; }',
      errors: [error],
    },
    {
      name: 'member of untyped data',
      code: 'const payload = JSON.parse(text);\nexport const isText = typeof payload.name === "string";',
      errors: [error],
    },
    {
      name: 'member of an unknown record',
      code: 'function f(input: Record<string, unknown>) { return typeof input.name === "string"; }',
      errors: [error],
    },
    {
      name: 'member with a non-union type',
      code: 'interface Props { label: string }\nfunction f(props: Props) { return typeof props.label === "string"; }',
      errors: [error],
    },
    {
      name: 'decoder is off with allowDecoders: false',
      code: 'export function readLightboxIndex(payload: unknown): number | undefined {\n  if (typeof payload === "number" && Number.isFinite(payload)) {\n    return payload;\n  }\n  if (payload !== null && typeof payload === "object" && "index" in payload && typeof payload.index === "number") {\n    return payload.index;\n  }\n  return undefined;\n}',
      options: [{ allowDecoders: false }],
      errors: [error, error, error],
    },
    {
      name: 'an assertion means the checks did not prove the return value',
      code: 'function read(value: unknown): number { if (typeof value === "object") return 0; return value as number; }',
      errors: [error],
    },
    {
      name: 'any inside the body',
      code: 'function read(value: unknown): number { const loose: any = value; return typeof loose === "number" ? loose : 0; }',
      errors: [error],
    },
    {
      name: 'no return type',
      code: 'function read(value: unknown) { return typeof value === "number" ? value : 0; }',
      errors: [error],
    },
    {
      name: 'boolean return is a check, not a decoded value',
      code: 'function isPort(value: unknown): boolean { return typeof value === "number"; }',
      errors: [error],
    },
    {
      name: 'void return',
      code: 'function check(value: unknown): void { if (typeof value !== "number") throw new Error(); }',
      errors: [error],
    },
    {
      name: 'return type with unknown',
      code: 'function read(value: unknown): number | unknown { return typeof value === "number" ? value : 0; }',
      errors: [error],
    },
    {
      name: 'a second parameter',
      code: 'function read(value: unknown, fallback: number): number { return typeof value === "number" ? value : fallback; }',
      errors: [error],
    },
    {
      name: 'unconstrained generic guard (chart-datum shape today)',
      code: 'export function isChartNumber<T>(value: T): value is Extract<T, number> {\n  return typeof value === "number";\n}',
      errors: [error],
    },
    {
      name: 'unconstrained type parameter in a union with undefined',
      code: 'function f<T>(value: T | undefined) { return typeof value === "string"; }',
      errors: [error],
    },
    {
      name: 'type parameter constrained to unknown',
      code: 'function f<T extends unknown>(value: T) { return typeof value === "string"; }',
      errors: [error],
    },
    {
      name: 'type parameter constrained to object',
      code: 'function f<T extends object>(value: T) { return typeof value === "function"; }',
      errors: [error],
    },
    {
      name: 'type parameter default is not a constraint',
      code: 'function f<T = string | number>(value: T) { return typeof value === "string"; }',
      errors: [error],
    },
    {
      name: 'local alias to an object type',
      code: 'type User = { id: string };\nfunction f(value: User) { return typeof value === "object"; }',
      errors: [error],
    },
    {
      name: 'local alias to Record<string, unknown>',
      code: 'type Bag = Record<string, unknown>;\nfunction f(value: Bag) { return typeof value === "object"; }',
      errors: [error],
    },
    {
      name: 'global object type',
      code: 'function f(value: Date) { return typeof value === "object"; }',
      errors: [error],
    },
    {
      name: 'imported union with an unknown member',
      code: 'import type { Datum } from "./datum";\nfunction f(value: Datum | unknown) { return typeof value === "number"; }',
      errors: [error],
    },
    {
      name: 'member missing from a closed local type',
      code: 'type Props = { label: string };\nfunction f(props: Props) { return typeof props.size === "number"; }',
      errors: [error],
    },
    {
      name: 'destructured default from an unknown pattern',
      code: 'function f({ grid = false }: { grid?: unknown }) { return typeof grid === "object"; }',
      errors: [error],
    },
    {
      name: 'as unknown stays reported',
      code: 'function f(child: { props: object }) { const props = child.props as unknown; return typeof props === "object"; }',
      errors: [error],
    },
    {
      name: 'member of an as any result stays reported',
      code: 'function f(child: { props: object }) { const props = child.props as any; return typeof props.dataKey === "string"; }',
      errors: [error],
    },
    {
      name: 'for-of element of unknown[]',
      code: 'function f(data: unknown[]) { for (const item of data) { if (typeof item === "number") use(item); } }',
      errors: [error],
    },
    {
      name: 'for-of element of an unannotated value',
      code: 'const data = JSON.parse(text);\nfor (const item of data) { if (typeof item === "number") use(item); }',
      errors: [error],
    },
    {
      name: 'indexed read of Record<string, unknown>',
      code: 'function f(row: Record<string, unknown>, key: string) { const raw = row[key]; return typeof raw === "string"; }',
      errors: [error],
    },
    {
      name: 'conditional with one untraceable branch',
      code: 'import type { Datum } from "./datum";\nfunction f(item: Datum, flag: boolean) { const value = flag ? item : JSON.parse("1"); return typeof value === "number"; }',
      errors: [error],
    },
    {
      name: 'reassigned let stays reported',
      code: 'import type { Datum } from "./datum";\nfunction f(item: Datum) { let value = item; value = read(); return typeof value === "number"; }',
      errors: [error],
    },
    {
      name: 'member of a local type with an object-only member',
      code: 'type Props = { dataKey: Record<string, unknown> };\nfunction f(props: Props | undefined) { return props !== undefined && typeof props.dataKey === "object"; }',
      errors: [error],
    },
    {
      name: 'object-only globals stay reported',
      code: 'function f(a: Map<string, number>, b: HTMLElement, c: TypeError, d: Uint8Array, e: File, g: Response, h: RegExp) {\n  return [typeof a, typeof b, typeof c, typeof d, typeof e, typeof g, typeof h];\n}',
      errors: [error, error, error, error, error, error, error],
    },
    {
      name: 'Readonly of Record<string, unknown> stays reported',
      code: 'function f(value: Readonly<Record<string, unknown>>) { return typeof value === "object"; }',
      errors: [error],
    },
    {
      name: 'Partial of unknown stays reported',
      code: 'function f(value: Partial<unknown>) { return typeof value === "object"; }',
      errors: [error],
    },
    {
      name: 'a local type named like a global wrapper is not the global',
      code: 'type Partial<T> = { value: T };\nfunction f(value: Partial<string>) { return typeof value === "object"; }',
      errors: [error],
    },
    {
      name: 'Array.filter is not a schema predicate',
      code: 'const texts = items.filter((item) => typeof item === "string");',
      errors: [error],
    },
    {
      name: 'filter on another object is not Effect Schema',
      code: 'const texts = rows.filter((row) => typeof row === "string");',
      errors: [error],
    },
    {
      name: 'the schema call itself is not a predicate argument',
      code: 'function f(value: unknown) { return z.custom(typeof value === "string" ? isText : isOther); }',
      errors: [error],
    },
    {
      name: 'computed member',
      code: 'interface Props { size: number | "auto" }\nfunction f(props: Props, key: "size") { return typeof props[key] === "number"; }',
      errors: [error],
    },
  ],
});
