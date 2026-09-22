import { maxServicesName } from '../../../../src/plugins/effect/rules/max-services.ts';
import { error } from '../../lib/cases.ts';
import { ts, withEffect } from './fixtures.ts';
import { runEffectRule } from './harness.ts';

const first = 'const Db = Context.Service("app/Db");';
const second = 'class Log extends Context.Service<Log, {}>()("app/Log") {}';

runEffectRule(maxServicesName, {
  valid: [
    { ...ts, code: withEffect(first) },
    { ...ts, code: withEffect(second) },
    { ...ts, code: withEffect('const Db = class extends Context.Service<Db, {}>()("app/Db") {};') },
    { ...ts, code: withEffect('const factory = Context.Service<Db, {}>();') },
    { ...ts, code: first + second },
    { ...ts, code: 'import { Context } from "other"; ' + first + second },
    { ...ts, code: withEffect(first + second), options: [{ allow: ['app.ts'] }] },
    { ...ts, code: withEffect('class A {} class B {}') },
    {
      ...ts,
      code: 'import { Effect } from "effect"; import { Db, Log } from "./services"; Effect.succeed([Db, Log]);',
    },
  ],
  invalid: [
    { ...ts, code: withEffect(first + second), errors: [error('maxServices')] },
    {
      ...ts,
      code: withEffect(first + 'const Log = Context.Service("app/Log");'),
      errors: [error('maxServices')],
    },
    {
      ...ts,
      code: withEffect(second + 'class Db extends Context.Service<Db, {}>()("app/Db") {}'),
      errors: [error('maxServices')],
    },
    {
      ...ts,
      code: withEffect(first + second + 'const Third = Context.Service("app/Third");'),
      errors: [error('maxServices')],
    },
    {
      ...ts,
      filename: 'src/db.test.ts',
      code: withEffect(first + second),
      errors: [error('maxServices')],
    },
    {
      ...ts,
      filename: 'src/db.service.ts',
      code: withEffect(first + second),
      errors: [error('maxServices')],
    },
    {
      ...ts,
      code: 'import { Service as Key } from "effect/Context"; const A = Key("app/A"); const B = class extends Key<B, {}>()("app/B") {};',
      errors: [error('maxServices')],
    },
    {
      ...ts,
      code: 'import * as E from "effect"; const A = E.Context.Service("app/A"); const B = E.Context.Service("app/B");',
      errors: [error('maxServices')],
    },
    {
      ...ts,
      code: 'import * as C from "effect/Context"; const A = C.Service("app/A"); const B = C.Service("app/B");',
      errors: [error('maxServices')],
    },
    {
      ...ts,
      code: withEffect('const A = Context.Service(firstId); const B = Context.Service(secondId);'),
      errors: [error('maxServices')],
    },
  ],
});
