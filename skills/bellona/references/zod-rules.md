# bellona/zod rules

Plugin name: `bl-zod`. Ids: `bl-zod/<slug>`.

**Skip:** files that do not import `zod` or `zod/…`, test/spec/stories files, and `allow` matches.

Reports use four lines: **Problem**, **Why**, **Fix**, **Avoid**. Apply **Fix**.

## `bl-zod/modern-format-validators`

Prefer Zod 4 **top-level** format factories over deprecated `z.string().email()` (and friends).

Zod 4 only. With `zod@3` the root `zod` import is Zod 3, which has no top-level format factories.

Zod 4 marks the `z.string()` format chains `@deprecated`. It removed `.ip()` and `.cidr()`. Some mapped names (`httpUrl`, `hostname`, `hex`, `hash`, `mac`, `creditCard`) never existed as chains. The rule still points them to the top-level factory.

```ts
// bad
z.string().email()
z.string().uuid()
z.string().datetime()

// good
z.email()
z.uuid()
z.iso.datetime()
```

| Method | Replacement |
| --- | --- |
| `email` | `z.email()` |
| `url` | `z.url()` |
| `httpUrl` | `z.httpUrl()` |
| `uuid` | `z.uuid()` |
| `uuidv4` / `uuidv6` / `uuidv7` | `z.uuidv4()` / `z.uuidv6()` / `z.uuidv7()` (keeps the version check) |
| `guid` | `z.guid()` |
| `hostname` | `z.hostname()` |
| `e164` | `z.e164()` |
| `emoji` | `z.emoji()` |
| `base64` | `z.base64()` |
| `base64url` | `z.base64url()` |
| `hex` | `z.hex()` |
| `jwt` | `z.jwt()` |
| `nanoid` | `z.nanoid()` |
| `cuid` | `z.cuid2()` for new ids, or `z.cuid()` to keep CUID v1 (deprecated) |
| `cuid2` | `z.cuid2()` |
| `ulid` | `z.ulid()` |
| `xid` | `z.xid()` |
| `ksuid` | `z.ksuid()` |
| `ipv4` | `z.ipv4()` |
| `ipv6` | `z.ipv6()` |
| `ip` (Zod 3) | `z.union([z.ipv4(), z.ipv6()])` |
| `cidr` (Zod 3) | `z.union([z.cidrv4(), z.cidrv6()])` |
| `mac` | `z.mac()` |
| `cidrv4` | `z.cidrv4()` |
| `cidrv6` | `z.cidrv6()` |
| `creditCard` | `z.creditCard()` |
| `hash` | `z.hash()` |
| `datetime` | `z.iso.datetime()` |
| `date` | `z.iso.date()` |
| `time` | `z.iso.time()` |
| `duration` | `z.iso.duration()` |

## `bl-zod/no-deprecated-v4-apis`

Disallow Zod APIs that zod 4.6.5 marks `@deprecated`. String format chains belong to `bl-zod/modern-format-validators`.

| Deprecated | Replacement |
| --- | --- |
| `{ message: "…" }` param (string or template value) | `{ error: "…" }` |
| `.merge(B)` | `.extend(B.shape)` |
| `.passthrough()` | `.loose()` / `z.looseObject(…)` |
| `.step(n)` | `.multipleOf(n)` |
| `.safe()` | `.int()` |
| `.finite()` | remove (numbers reject infinity by default) |
| `.removeDefault()` / `.removeCatch()` | `.unwrap()` |
| `z.nativeEnum(E)` | `z.enum(E)` |
| ZodError `.format()` | `z.treeifyError(error)` |
| ZodError `.flatten()` | `z.flattenError(error)` |

Schema methods count only on a chain that starts at `z`, an identifier named `…Schema`, or a same-file const that resolves to one. ZodError methods count on `result.error` or inside `if (err instanceof z.ZodError)`. A `message` key in the first argument of `z.object` / `.extend` / `.pick` / `.omit` / `.partial` / `.required` is a field name, not a param.

Not deprecated in 4.6.5, so not reported: `.strict()`, `.superRefine()`.

## `bl-zod/schema-naming`

Exported Zod schema bindings must be PascalCase names ending in `Schema` (`/^[A-Z][A-Za-z0-9]*Schema$/`).

Detected when the initializer is a `z.*` / schema builder call (`object`, `string`, `enum`, `pipe`, `stringbool`, `optional`, `uuidv7`, …), `z.iso.*`, or `z.coerce.*`, plus chained schema methods.

Not a schema: a chain that calls `parse`, `safeParse`, `parseAsync`, `safeParseAsync`, `spa`, `encode` / `decode` (and async / safe forms), `implement`, `implementAsync`, `isOptional`, `isNullable`, `toJSONSchema`, or `meta()` with no argument. `export const env = z.object({…}).parse(process.env)` is not reported.

```ts
// bad
export const user = z.object({ id: z.string() })
export const user_schema = z.object({})

// good
export const UserSchema = z.object({ id: z.string() })
```
