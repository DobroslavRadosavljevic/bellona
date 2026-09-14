import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { booleanField, objectOptionAt, stringField } from '../../../lib/options.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';

const DEFAULT_TERM = 'shape';

function containsForbiddenTerm(name: string, needle: string, caseSensitive: boolean): boolean {
  if (caseSensitive) {
    return name.includes(needle);
  }
  return name.toLowerCase().includes(needle);
}

/** Ban a configurable substring (default `shape`) in JavaScript and TypeScript symbol names. */
export const forbiddenTermInNamesId = bnRuleName('no-shape-in-symbol-names');

export const forbiddenTermInNames: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow a configurable substring in JavaScript, TypeScript, private, and JSX symbol names.',
    },
    messages: {
      forbiddenSymbolName: agentDiagnostic({
        problem:
          'Symbol "{{name}}" contains "{{term}}". The default term is `shape` (case-insensitive unless `{ caseSensitive: true }`). This includes JS/TS names, private fields, and JSX names.',
        why: 'The word describes structure, not ownership. Names like `UserShape` do not say who owns the type, so later code treats the structure as the domain.',
        fix: 'Rename to an owner name: `UserShape` → `User` or `ParsedUser`. Remove "{{term}}" from the identifier.',
        avoid:
          'Do not hide the term with a typo (`shap`, `ShapeImpl` still matches by default). Do not disable the rule. Change the identifier.',
      }),
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
    let term = DEFAULT_TERM;
    let caseSensitive = false;
    let needle = DEFAULT_TERM;

    const reportForbiddenSymbolName = (node: ESTree.Node & { name: string }) => {
      if (!containsForbiddenTerm(node.name, needle, caseSensitive)) {
        return;
      }
      context.report({
        node,
        messageId: 'forbiddenSymbolName',
        data: { name: node.name, term },
      });
    };

    return {
      before() {
        const options = objectOptionAt(context, 0);
        term = stringField(options, 'term', DEFAULT_TERM);
        caseSensitive = booleanField(options, 'caseSensitive', false);
        needle = caseSensitive ? term : term.toLowerCase();
      },
      Identifier: reportForbiddenSymbolName,
      PrivateIdentifier: reportForbiddenSymbolName,
      JSXIdentifier: reportForbiddenSymbolName,
    };
  },
});
