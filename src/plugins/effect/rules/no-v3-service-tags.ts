import type { CreateOnceRule } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { unwrapExpression } from '../ast.ts';
import { collectEffectBindings, isModuleMember, type EffectBindings } from '../bindings.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipEffectFile } from '../options.ts';

export const noV3ServiceTagsName = bnRuleName('no-v3-service-tags');

export const noV3ServiceTags: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow Context.Tag, GenericTag, Effect.Tag, and Effect.Service; use Context.Service',
    },
    messages: {
      tag: 'Use Context.Service instead of {{api}}.',
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
        const parent = node.parent;
        if (parent?.type === 'CallExpression' && unwrapExpression(parent.callee) === node) {
          return;
        }
        const checks: readonly { kind: 'context' | 'effect'; name: string; api: string }[] = [
          { kind: 'context', name: 'Tag', api: 'Context.Tag' },
          { kind: 'context', name: 'GenericTag', api: 'Context.GenericTag' },
          { kind: 'effect', name: 'Tag', api: 'Effect.Tag' },
          { kind: 'effect', name: 'Service', api: 'Effect.Service' },
        ];
        for (const check of checks) {
          if (isModuleMember(node, bindings, check.kind, check.name)) {
            context.report({ messageId: 'tag', node, data: { api: check.api } });
            return;
          }
        }
      },
      Identifier(node) {
        const parent = node.parent;
        if (parent?.type === 'ImportSpecifier' || parent?.type === 'ExportSpecifier') {
          return;
        }
        if (parent?.type === 'CallExpression' && unwrapExpression(parent.callee) === node) {
          return;
        }
        if (parent?.type === 'MemberExpression' && parent.property === node && !parent.computed) {
          return;
        }
        const named: readonly { name: string; api: string; kind: 'context' | 'effect' }[] = [
          { name: 'Tag', api: 'Context.Tag', kind: 'context' },
          { name: 'GenericTag', api: 'Context.GenericTag', kind: 'context' },
        ];
        for (const check of named) {
          if (isModuleMember(node, bindings, check.kind, check.name)) {
            context.report({ messageId: 'tag', node, data: { api: check.api } });
            return;
          }
        }
      },
      CallExpression(node) {
        const callee = unwrapExpression(node.callee);
        if (isModuleMember(callee, bindings, 'context', 'Tag')) {
          context.report({ messageId: 'tag', node, data: { api: 'Context.Tag' } });
          return;
        }
        if (isModuleMember(callee, bindings, 'context', 'GenericTag')) {
          context.report({ messageId: 'tag', node, data: { api: 'Context.GenericTag' } });
          return;
        }
        if (isModuleMember(callee, bindings, 'effect', 'Tag')) {
          context.report({ messageId: 'tag', node, data: { api: 'Effect.Tag' } });
          return;
        }
        if (isModuleMember(callee, bindings, 'effect', 'Service')) {
          context.report({ messageId: 'tag', node, data: { api: 'Effect.Service' } });
        }
      },
    };
  },
});
