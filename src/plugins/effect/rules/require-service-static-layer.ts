import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { hasStaticClassMember } from '../ast.ts';
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

export const requireServiceStaticLayerName = bnRuleName('require-service-static-layer');

export const requireServiceStaticLayer: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require Context.Service classes to declare static readonly layer, also when they set options.make',
    },
    messages: {
      layer: agentDiagnostic({
        problem: 'This `Context.Service` class has no `static readonly layer`.',
        why: 'v4 services are provided through a static layer, not `.Default`. `options.make` only stores the constructor Effect on the class. It does not make a layer.',
        fix: 'Add `static readonly layer = Layer.effect(this, Effect.gen(function* () { … }))`. When the class has `make`, write `static readonly layer = Layer.effect(this, this.make)`.',
        avoid: 'Do not add `.Default`. Do not disable the rule.',
      }),
      defaultMember: agentDiagnostic({
        problem: 'This code uses `.Default` on a service. Effect v4 removed that member.',
        why: '`.Default` is v3 `Effect.Service` sugar. v4 uses `static readonly layer`.',
        fix: 'Delete `.Default`. Provide `Service.layer` (or `Layer.provide(Service.layer)`).',
        avoid: 'Do not alias `.Default`. Do not disable the rule.',
      }),
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
      if (hasStaticClassMember(node, 'layer')) {
        return;
      }
      context.report({ messageId: 'layer', node });
    }
  },
});
