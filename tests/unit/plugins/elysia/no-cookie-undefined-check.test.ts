import { noCookieUndefinedCheckName } from '../../../../src/plugins/elysia/rules/no-cookie-undefined-check.ts';
import { error } from '../../lib/cases.ts';
import { runElysiaRule } from './harness.ts';

const ts = { filename: 'file.ts' };
const elysiaImport = `import { Elysia } from 'elysia'\n`;

runElysiaRule(noCookieUndefinedCheckName, {
  valid: [
    { ...ts, code: `${elysiaImport}if (!cookie.session.value) {}` },
    { ...ts, code: `${elysiaImport}if (cookie.session.value == null) {}` },
    { ...ts, code: `${elysiaImport}session.value = 'x'` },
    // No elysia import
    { ...ts, code: `if (!cookie.session) {}` },
  ],
  invalid: [
    {
      ...ts,
      code: `${elysiaImport}if (!cookie.session) {}`,
      errors: [error('cookieCheck')],
    },
    {
      ...ts,
      code: `${elysiaImport}if (cookie.session == null) {}`,
      errors: [error('cookieCheck')],
    },
    {
      ...ts,
      code: `${elysiaImport}if (cookie.session) {}`,
      errors: [error('cookieCheck')],
    },
    {
      ...ts,
      code: `${elysiaImport}if (cookie?.session) {}`,
      errors: [error('cookieCheck')],
    },
    {
      ...ts,
      code: `${elysiaImport}cookie.session && doStuff()`,
      errors: [error('cookieCheck')],
    },
  ],
});
