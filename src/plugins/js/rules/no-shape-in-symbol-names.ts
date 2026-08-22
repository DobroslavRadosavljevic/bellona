import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { booleanField, objectOptionAt, stringField } from '../../../lib/options.ts';
import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';

const DEFAULT_TERM = 'shape';

function containsForbiddenTerm(name: string, term: string, caseSensitive: boolean): boolean {
  if (caseSensitive) {
    return name.includes(term);
  }
  return name.toLowerCase().includes(term.toLowerCase());
}

/** Ban a configurable substring (default `shape`) in JavaScript and TypeScript symbol names. */
export const forbiddenTermInNamesId = vmRuleName('no-shape-in-symbol-names');

export const forbiddenTermInNames: CreateOnceRule = defineVamanaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow a configurable substring in JavaScript, TypeScript, private, and JSX symbol names.',
    },
    messages: {
      forbiddenSymbolName:
        'Rename symbol "{{name}}"; "{{term}}" describes structure rather than ownership.',
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          term: { type: 'string' },
          caseSensitive: { type: 'boolean' },
        },
      },
    ],
    defaultOptions: [{ term: DEFAULT_TERM }],
  },
  createOnce(context) {
    const reportForbiddenSymbolName = (node: ESTree.Node & { name: string }) => {
      const options = objectOptionAt(context, 0);
      const term = stringField(options, 'term', DEFAULT_TERM);
      const caseSensitive = booleanField(options, 'caseSensitive', false);
      if (!containsForbiddenTerm(node.name, term, caseSensitive)) {
        return;
      }
      context.report({
        node,
        messageId: 'forbiddenSymbolName',
        data: { name: node.name, term },
      });
    };

    return {
      Identifier: reportForbiddenSymbolName,
      PrivateIdentifier: reportForbiddenSymbolName,
      JSXIdentifier: reportForbiddenSymbolName,
    };
  },
});
