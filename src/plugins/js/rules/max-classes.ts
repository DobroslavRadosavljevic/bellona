import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { DEFAULT_MAX_CLASSES, readMaxClassesOptions } from '../options.ts';

export const maxClassesName = bnRuleName('max-classes');

export const maxClasses: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow more than a configurable number of class declarations in a file',
    },
    messages: {
      maxClasses: agentDiagnostic({
        problem:
          'This file has more than {{max}} `class` declarations. This report fires on the first extra ClassDeclaration. Class expressions (`const X = class {}`) do not count.',
        why: 'Several class declarations in one module mix unrelated owners. Imports, tests, and refactors then target the wrong type.',
        fix: 'Move each extra class into its own file, one public class per module. If this file is a generated fixture that must keep many classes, set `{ max: N }` on `bl-js/max-classes`.',
        avoid:
          'Do not merge the classes into one type, wrap them in a namespace, convert declarations to class expressions to dodge the count, or add an oxlint-disable comment.',
      }),
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          max: { type: 'integer', minimum: 0 },
        },
      },
    ],
    defaultOptions: [{ max: DEFAULT_MAX_CLASSES }],
  },
  createOnce(context) {
    let classCount: number;

    return {
      before() {
        classCount = 0;
      },
      ClassDeclaration(node) {
        classCount += 1;
        const { max } = readMaxClassesOptions(context);
        if (classCount === max + 1) {
          context.report({ messageId: 'maxClasses', node, data: { max } });
        }
      },
    };
  },
});
