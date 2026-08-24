import type { CreateOnceRule } from '@oxlint/plugins';

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
      maxClasses: 'Do not declare more than {{max}} classes in one file.',
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
