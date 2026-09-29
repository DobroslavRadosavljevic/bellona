import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { isSkippedLayoutFile, matchesAllow, relativePath } from '../filename.ts';
import { readAllowList, readRequireFileLayoutOptions } from '../options.ts';
import { matchesGlob, pathUnderRoot } from '../shared/path-glob.ts';

const stringList = { type: 'array', items: { type: 'string', minLength: 1 } } as const;

function parentFolder(path: string): string {
  const segments = path.split('/');
  return segments.at(-2) ?? '';
}

function basename(path: string): string {
  return path.split('/').at(-1) ?? path;
}

/** Require files under configured roots to sit in allowed places, and keep services in `services/`. */
export const requireFileLayoutName = bnRuleName('require-file-layout');

export const requireFileLayout: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require files under configured folders to sit in allowed places, and keep service files and services folders consistent.',
    },
    messages: {
      layoutStray: agentDiagnostic({
        problem:
          'This file is under `{{root}}`, but its place `{{path}}` matches none of the allowed places: {{allowed}}.',
        why: 'The folder layout tells readers and agents where each kind of code lives. A file in another place is hard to find, and the next file copies the wrong place.',
        fix: 'Move the file to the allowed place for its kind of code. If this is a new kind of code that the project accepts, add its place to `allow` for this root on `bl-js/require-file-layout`.{{note}}',
        avoid:
          'Do not add a catch-all pattern such as `**` to `allow`. Do not rename the file only to match a pattern. Do not disable the rule.',
      }),
      serviceOutsideServices: agentDiagnostic({
        problem:
          'Service file `{{file}}` is in the folder `{{folder}}`. Under `{{root}}`, a `*.service.ts` file must sit in a `services` folder.',
        why: 'One fixed place for services lets readers find every service of a module in one folder.',
        fix: 'Move the file into the `services` folder of its module and update the imports. If the file is not a service, rename it without the `.service.ts` suffix.',
        avoid:
          'Do not rename the folder to `services` when it holds other kinds of code. Do not disable the rule.',
      }),
      servicesFolderStray: agentDiagnostic({
        problem:
          '`{{file}}` sits directly in a `services` folder, but it is not a `*.service.ts` file.',
        why: 'A `services` folder is the list of services of its module. A helper file there looks like a service and hides where the helper belongs.',
        fix: 'Move the file next to the code that owns its concept, or into a subfolder named for that concept (`services/errors/`). If it is a service, rename it to `<name>.service.ts`.',
        avoid:
          'Do not rename a helper to `*.service.ts` only to pass the check. Do not disable the rule.',
      }),
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          allow: { ...stringList, uniqueItems: true },
          layouts: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['root', 'allow'],
              properties: {
                root: { type: 'string', minLength: 1 },
                allow: stringList,
                message: { type: 'string' },
              },
            },
          },
          servicesFolderContents: { type: 'boolean' },
          serviceDirectories: stringList,
        },
      },
    ],
    defaultOptions: [
      { allow: [], layouts: [], servicesFolderContents: true, serviceDirectories: [] },
    ],
  },
  createOnce(context) {
    return {
      before() {
        if (matchesAllow(context.filename, readAllowList(context))) return false;
      },
      Program(node) {
        const path = relativePath(context.filename, context.cwd);
        if (isSkippedLayoutFile(path)) return;
        const options = readRequireFileLayoutOptions(context);
        const file = basename(path);

        for (const layout of options.layouts) {
          const rest = pathUnderRoot(path, layout.root);
          if (rest === null || layout.allow.some((pattern) => matchesGlob(rest, pattern))) {
            continue;
          }
          context.report({
            node,
            messageId: 'layoutStray',
            data: {
              root: layout.root,
              path: rest,
              allowed: layout.allow.map((pattern) => `\`${pattern}\``).join(', '),
              note: layout.message === null ? '' : ` ${layout.message}`,
            },
          });
          break;
        }

        const isService = file.endsWith('.service.ts');
        const folder = parentFolder(path);
        if (isService && folder !== 'services') {
          const root = options.serviceDirectories.find(
            (entry) => pathUnderRoot(path, entry) !== null,
          );
          if (root !== undefined) {
            context.report({
              node,
              messageId: 'serviceOutsideServices',
              data: { file, folder, root },
            });
          }
        }
        if (options.servicesFolderContents && folder === 'services' && !isService) {
          context.report({ node, messageId: 'servicesFolderStray', data: { file } });
        }
      },
    };
  },
});
