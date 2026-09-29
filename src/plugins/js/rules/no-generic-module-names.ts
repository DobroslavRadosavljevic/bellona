import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { isSkippedLayoutFile, matchesAllow, relativePath } from '../filename.ts';
import { DEFAULT_GENERIC_MODULE_NAMES, readAllowList, readGenericModuleNames } from '../options.ts';

/** `-utils` is a TanStack colocation folder name; the `-` prefix does not change the name. */
function folderName(segment: string): string {
  return segment.replace(/^-/u, '').toLowerCase();
}

/**
 * A file stem that ends in `-utils` or `-helpers` is a bag of helpers
 * (`string-utils.ts`). A singular suffix often names a concept instead
 * (`prefer-status-helper.ts` is a rule about the `status` helper), so only
 * these plural names count as a suffix.
 */
const suffixNames: readonly string[] = ['utils', 'helpers'];

/** `string-utils.ts` and `string.utils.ts` end with a generic name; `utilization.ts` does not. */
function fileStem(file: string): string {
  return file.replace(/\.[cm]?[jt]sx?$/u, '').toLowerCase();
}

function genericSegment(path: string, names: ReadonlySet<string>): string | null {
  const segments = path.split('/');
  const file = segments.pop() ?? '';
  for (const segment of segments) {
    if (names.has(folderName(segment))) return segment;
  }
  const stem = fileStem(file);
  if (names.has(stem)) return file;
  for (const name of suffixNames) {
    if (!names.has(name)) continue;
    if (stem.endsWith(`-${name}`) || stem.endsWith(`.${name}`) || stem.endsWith(`_${name}`)) {
      return file;
    }
  }
  return null;
}

/** Ban generic folder and file names such as `utils`, `helpers`, and `common`. */
export const noGenericModuleNamesName = bnRuleName('no-generic-module-names');

export const noGenericModuleNames: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow generic folder and file names such as utils, helpers, and common; name modules after the concept they own.',
    },
    messages: {
      genericName: agentDiagnostic({
        problem:
          'The name `{{segment}}` in `{{path}}` is generic. It tells the shape of the code (`utils`, `helpers`, `common`), not the concept that the module owns.',
        why: 'A generic module collects unrelated code. Readers cannot guess what is inside, and each new helper goes there because the name fits everything.',
        fix: 'Name the module after the concept it owns: `pricing/`, `framing.ts`, `person-name.ts`. Move each function next to the code that uses it, or into a module named for its concept.',
        avoid:
          'Do not rename to a synonym such as `tools`, `support`, `core`, or `shared`. Do not add a prefix only to pass the check. Do not disable the rule.',
      }),
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          allow: { type: 'array', items: { type: 'string', minLength: 1 }, uniqueItems: true },
          names: { type: 'array', items: { type: 'string', minLength: 1 }, uniqueItems: true },
        },
      },
    ],
    defaultOptions: [{ allow: [], names: [...DEFAULT_GENERIC_MODULE_NAMES] }],
  },
  createOnce(context) {
    return {
      before() {
        if (matchesAllow(context.filename, readAllowList(context))) return false;
      },
      Program(node) {
        const path = relativePath(context.filename, context.cwd);
        if (isSkippedLayoutFile(path)) return;
        const names = new Set(readGenericModuleNames(context).map((name) => name.toLowerCase()));
        const segment = genericSegment(path, names);
        if (segment === null) return;
        context.report({ node, messageId: 'genericName', data: { segment, path } });
      },
    };
  },
});
