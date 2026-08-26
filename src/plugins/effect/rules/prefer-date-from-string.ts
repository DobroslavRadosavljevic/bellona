import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { collectEffectBindings, isModuleMember, type EffectBindings } from '../bindings.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipEffectFile } from '../options.ts';

export const preferDateFromStringName = bnRuleName('prefer-date-from-string');

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
      date: agentDiagnostic({
        problem:
          '`Schema.Date` in Effect v4 accepts `Date` instances, not ISO strings. This schema is used as if it parsed a string.',
        why: 'Passing a string into `Schema.Date` is the wrong decoder and will fail or lie.',
        fix: 'Use `Schema.DateFromString` for ISO strings. Keep `Schema.Date` only for actual `Date` values.',
        avoid: 'Do not `new Date(string)` before `Schema.Date`. Do not disable the rule.',
      }),
      fromSelf: agentDiagnostic({
        problem:
          'This Date schema mix is wrong for the input kind (`Schema.Date` vs string vs self).',
        why: 'v4 splits instance vs string vs millis decoders. The wrong one accepts the wrong input.',
        fix: 'Use `Schema.Date` for `Date` instances, `Schema.DateFromString` for ISO strings.',
        avoid: 'Do not chain `.pipe(Schema.Date)` on a string schema. Do not disable the rule.',
      }),
      fromNumber: agentDiagnostic({
        problem: 'This uses `Schema.DateFromNumber`. The v4 name is `Schema.DateFromMillis`.',
        why: 'The number decoder is milliseconds in v4, and the old name is gone.',
        fix: 'Replace with `Schema.DateFromMillis`.',
        avoid: 'Do not keep `DateFromNumber` as an alias. Do not disable the rule.',
      }),
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
