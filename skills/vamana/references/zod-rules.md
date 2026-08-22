# vamana/zod rules

Plugin name: `zod`. Ids: `zod/vm-<slug>`.

**Skip:** files that do not import `zod` or `zod/…`, test/spec/stories files, and `allow` matches.

## `zod/vm-zod-modern-format-validators`

Prefer Zod 4 **top-level** format factories over deprecated `z.string().email()` (and friends).

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
| `uuid` / `uuidv4` / `uuidv6` / `uuidv7` | `z.uuid()` |
| `guid` | `z.guid()` |
| `hostname` | `z.hostname()` |
| `e164` | `z.e164()` |
| `emoji` | `z.emoji()` |
| `base64` | `z.base64()` |
| `base64url` | `z.base64url()` |
| `hex` | `z.hex()` |
| `jwt` | `z.jwt()` |
| `nanoid` | `z.nanoid()` |
| `cuid` | `z.cuid()` |
| `cuid2` | `z.cuid2()` |
| `ulid` | `z.ulid()` |
| `ipv4` | `z.ipv4()` |
| `ipv6` | `z.ipv6()` |
| `ip` | `z.ipv4()` or `z.ipv6()` |
| `mac` | `z.mac()` |
| `cidrv4` | `z.cidrv4()` |
| `cidrv6` | `z.cidrv6()` |
| `creditCard` | `z.creditCard()` |
| `hash` | `z.hash()` |
| `datetime` | `z.iso.datetime()` |
| `date` | `z.iso.date()` |
| `time` | `z.iso.time()` |
| `duration` | `z.iso.duration()` |

## `zod/vm-zod-schema-naming`

Exported Zod schema bindings must be PascalCase names ending in `Schema` (`/^[A-Z][A-Za-z0-9]*Schema$/`).

Detected when the initializer is a `z.*` / schema builder call (`object`, `string`, `enum`, `pipe`, …).

```ts
// bad
export const user = z.object({ id: z.string() })
export const user_schema = z.object({})

// good
export const UserSchema = z.object({ id: z.string() })
```
