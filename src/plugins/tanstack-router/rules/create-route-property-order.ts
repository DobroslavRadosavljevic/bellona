import type { CreateOnceRule } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getStaticPropertyName, unwrapExpression } from '../ast.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';
import { getCreateRouteOptions, sortRoutePropertiesByOrder } from '../route.ts';

export const createRoutePropertyOrderName = bnRuleName('create-route-property-order');

export const createRoutePropertyOrder: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require inference-sensitive `createRoute` / `createFileRoute` option keys in documented order',
    },
    messages: {
      invalidOrder:
        'Put inference-sensitive route options in order: `params` / `validateSearch`, then `search`, `loaderDeps`, `context`, `beforeLoad`, `loader`, then lifecycle fields. `{{functionName}}` is out of order.',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    return {
      before() {
        if (shouldSkipRouterFile(context)) {
          return false;
        }
      },
      CallExpression(node) {
        const created = getCreateRouteOptions(node);
        if (created === undefined || created.options.properties.length < 2) {
          return;
        }
        const named: { name: string }[] = [];
        for (const property of created.options.properties) {
          if (property.type === 'SpreadElement') {
            const argument = unwrapExpression(property.argument);
            if (argument?.type !== 'Identifier') {
              return;
            }
            named.push({ name: argument.name });
            continue;
          }
          const name = getStaticPropertyName(property.key);
          if (name === undefined) {
            return;
          }
          named.push({ name });
        }
        if (sortRoutePropertiesByOrder(named) === undefined) {
          return;
        }
        context.report({
          messageId: 'invalidOrder',
          node: created.options,
          data: { functionName: created.functionName },
        });
      },
    };
  },
});
