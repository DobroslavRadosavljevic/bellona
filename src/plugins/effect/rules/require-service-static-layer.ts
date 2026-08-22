import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { defineVamanaRule, vmRuleName } from '../../../lib/rule.ts';
import { getCallArgument, hasStaticClassMember, objectHasMakeOption } from '../ast.ts';
import {
  collectEffectBindings,
  isContextServiceClassSuper,
  type EffectBindings,
} from '../bindings.ts';
import {
  ALLOW_OPTION_SCHEMA,
  DEFAULT_ALLOW_OPTIONS,
  shouldSkipEffectStyleFile,
} from '../options.ts';

export const requireServiceStaticLayerName = vmRuleName('require-service-static-layer');

export const requireServiceStaticLayer: CreateOnceRule = defineVamanaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require Context.Service classes to declare static readonly layer (or options.make)',
    },
    messages: {
      layer: 'Attach static readonly layer on this Context.Service class.',
      defaultMember: 'Effect v4 does not use .Default. Attach static readonly layer instead.',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: EffectBindings;

    return {
      before() {
        if (shouldSkipEffectStyleFile(context)) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
      },
      ClassDeclaration(node) {
        reportClass(node);
      },
      ClassExpression(node) {
        reportClass(node);
      },
    };

    function reportClass(node: ESTree.Class): void {
      if (!isContextServiceClassSuper(node.superClass ?? undefined, bindings)) {
        return;
      }
      if (hasStaticClassMember(node, 'Default')) {
        context.report({ messageId: 'defaultMember', node });
      }
      const superCall = node.superClass;
      if (superCall !== null && superCall !== undefined && superCall.type === 'CallExpression') {
        if (objectHasMakeOption(getCallArgument(superCall, 1))) {
          return;
        }
      }
      if (hasStaticClassMember(node, 'layer')) {
        return;
      }
      context.report({ messageId: 'layer', node });
    }
  },
});
