import { preferEdenTreatyInTestsName } from '../../../../src/plugins/elysia/rules/prefer-eden-treaty-in-tests.ts';
import { error } from '../../lib/cases.ts';
import { runElysiaRule } from './harness.ts';

const testFile = { filename: 'tests/users.test.ts' };
const appImport = `import { app } from '../src/app'\n`;

runElysiaRule(preferEdenTreatyInTestsName, {
  valid: [
    {
      ...testFile,
      code: `import { treaty } from '@elysia/eden'\n${appImport}const api = treaty(app)\nawait api.users.get()`,
    },
    {
      name: 'handle with a non-Request argument',
      ...testFile,
      code: `${appImport}await app.handle(fakeRequest)`,
    },
    {
      name: 'not a test file',
      filename: 'src/server/proxy.ts',
      code: `${appImport}export const forward = (url: string) => app.handle(new Request(url))`,
    },
    {
      name: 'stories are not tests',
      filename: 'src/users.stories.ts',
      code: `${appImport}app.handle(new Request('http://localhost/users'))`,
    },
    {
      name: 'allow',
      ...testFile,
      options: [{ allow: ['users.test.ts'] }],
      code: `${appImport}await app.handle(new Request('http://localhost/users'))`,
    },
  ],
  invalid: [
    {
      ...testFile,
      code: `${appImport}const response = await app.handle(new Request('http://localhost/users'))`,
      errors: [error('preferTreaty')],
    },
    {
      name: 'spec file',
      filename: 'src/users.spec.ts',
      code: `${appImport}await app.handle(new Request('http://localhost/users', { method: 'POST' }))`,
      errors: [error('preferTreaty')],
    },
    {
      name: 'request built in a same-file const',
      ...testFile,
      code: `${appImport}const request = new Request('http://localhost/users')\nawait app.handle(request)`,
      errors: [error('preferTreaty')],
    },
    {
      name: 'request helper',
      ...testFile,
      code: `${appImport}const call = (path: string) => app.handle(new Request('http://localhost' + path))`,
      errors: [error('preferTreaty')],
    },
  ],
});
