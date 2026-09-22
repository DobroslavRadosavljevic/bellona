import { requireServiceFilenameName } from '../../../../src/plugins/effect/rules/require-service-filename.ts';
import { error } from '../../lib/cases.ts';
import { ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

const service = 'const Db = Context.Service<{ query(): string }>("app/Db")';
const serviceClass = 'class Db extends Context.Service<Db, {}>()("app/Db") {}';

runEffectRule(requireServiceFilenameName, {
  valid: [
    { ...ts, filename: 'src/db.service.ts', code: withEffect(service) },
    { ...ts, filename: 'src/db.service.ts', code: withEffect(serviceClass) },
    { ...ts, filename: 'C:\\src\\db.service.ts', code: withEffect(service) },
    { ...ts, code: service },
    { ...ts, code: 'import type { Context } from "effect"; type Db = Context.Service<any>;' },
    { ...ts, code: 'import { Context } from "other"; ' + service },
    {
      ...ts,
      code: 'import { Effect } from "effect"; import { Db } from "./db.service"; Effect.succeed(Db);',
    },
    { ...ts, code: withEffect('const factory = Context.Service<Db, {}>();') },
    { ...ts, code: withEffect(service), options: [{ allow: ['app.ts'] }] },
  ],
  invalid: [
    ...[
      'src/db.ts',
      'src/db.service.tsx',
      'src/db.service.js',
      'src/db.service.mts',
      'src/db.service.ts/other.ts',
      'src/db.test.ts',
      'tests/db.ts',
    ].map((filename) => ({
      ...ts,
      filename,
      code: withEffect('const Db = Context.Service("app/Db");'),
      errors: [error('filename')],
    })),
    { ...ts, code: withEffect(serviceClass), errors: [error('filename')] },
    {
      ...ts,
      code: withEffect(service + '; const Other = Context.Service("app/Other");'),
      errors: [error('filename')],
    },
    {
      ...ts,
      code: 'import { Context as C } from "effect"; const Db = C.Service("app/Db");',
      errors: [error('filename')],
    },
    {
      ...ts,
      code: 'import { Service as Key } from "effect/Context"; const Db = Key("app/Db");',
      errors: [error('filename')],
    },
    {
      ...ts,
      code: 'import * as C from "effect/Context"; const Db = C.Service("app/Db");',
      errors: [error('filename')],
    },
    {
      ...ts,
      code: 'import * as E from "effect"; const Db = class extends E.Context.Service<Db, {}>()("app/Db") {};',
      errors: [error('filename')],
    },
    { ...ts, code: withEffect('const Db = Context.Service(id);'), errors: [error('filename')] },
  ],
});
