import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { collectEffectBindings, isModuleMember, type EffectBindings } from '../bindings.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipEffectFile } from '../options.ts';

export const preferDateFromStringName = bnRuleName('effect', 'prefer-date-from-string');

function reportDateSchema(
  node: ESTree.Node | undefined,
  bindings: EffectBindings,
  report: (messageId: 'fromSelf' | 'fromNumber' | 'date') => void,
): void {
  if (isModuleMember(node, bindings, 'schema', 'DateFromSelf')) {
    report('fromSelf');
    return;
  }
  if (isModuleMember(node, bindings, 'schema', 'DateFromNumber')) {
    report('fromNumber');
    return;
  }
  if (isModuleMember(node, bindings, 'schema', 'Date')) {
    report('date');
  }
}

export const preferDateFromString: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer Schema.DateFromString for ISO strings; Schema.Date in v4 accepts Date instances only',
    },
    messages: {
      date: 'Schema.Date accepts Date instances. Use Schema.DateFromString for ISO strings.',
      fromSelf: 'Use Schema.Date for Date instances, or Schema.DateFromString for ISO strings.',
      fromNumber: 'Use Schema.DateFromMillis instead of Schema.DateFromNumber.',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: EffectBindings;

    return {
      before() {
        if (shouldSkipEffectFile(context)) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
      },
      MemberExpression(node) {
        reportDateSchema(node, bindings, (messageId) => {
          context.report({ messageId, node });
        });
      },
      Identifier(node) {
        const parent = node.parent;
        if (parent?.type === 'ImportSpecifier' || parent?.type === 'ExportSpecifier') {
          return;
        }
        if (parent?.type === 'MemberExpression' && parent.property === node && !parent.computed) {
          return;
        }
        reportDateSchema(node, bindings, (messageId) => {
          context.report({ messageId, node });
        });
      },
    };
  },
});
