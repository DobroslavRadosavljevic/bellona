import type { CreateOnceRule } from '@oxlint/plugins';

import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { unwrapExpression } from '../ast.ts';
import {
  camelCaseToScreamingSnake,
  getElysiaOptionsNameLiteral,
  getRootNewElysiaExpression,
  isElysiaInstanceExpression,
  isExportedNode,
  isRouteExportName,
} from '../elysia.ts';
import {
  ALLOW_OPTION_SCHEMA,
  DEFAULT_ALLOW_OPTIONS,
  shouldSkipElysiaRoutesLeaf,
} from '../options.ts';

/**
 * Exported Elysia route plugins in leaf `routes/` files must use camelCase
 * `…Route` / `…Routes` bindings. `new Elysia({ name })` stays SCREAMING_SNAKE
 * and must equal the camelCase export converted to SCREAMING_SNAKE.
 */
export const requireRouteExportNameName = bnRuleName('elysia', 'require-route-export-name');

export const requireRouteExportName: CreateOnceRule = defineBellonaRule({
  createOnce(context) {
    return {
      before() {
        if (shouldSkipElysiaRoutesLeaf(context)) {
          return false;
        }
      },
      VariableDeclarator(node) {
        if (node.id.type !== 'Identifier' || !node.init) {
          return;
        }
        if (!isExportedNode(node)) {
          return;
        }

        const init = unwrapExpression(node.init);
        if (!isElysiaInstanceExpression(init)) {
          return;
        }

        const bindingName = node.id.name;
        if (!isRouteExportName(bindingName)) {
          context.report({
            messageId: 'badName',
            data: { name: bindingName },
            node: node.id,
          });
        }

        const root = getRootNewElysiaExpression(init);
        if (!root) {
          return;
        }
        const optionName = getElysiaOptionsNameLiteral(root);
        const expectedName = camelCaseToScreamingSnake(bindingName);
        if (optionName === undefined) {
          context.report({
            messageId: 'missingNameOption',
            data: { name: expectedName },
            node: root,
          });
          return;
        }
        if (optionName !== expectedName) {
          context.report({
            messageId: 'nameMismatch',
            data: { name: bindingName, optionName, expectedName },
            node: root,
          });
        }
      },
      ExportDefaultDeclaration(node) {
        const declaration = node.declaration;
        const expression =
          declaration.type === 'FunctionDeclaration' || declaration.type === 'ClassDeclaration'
            ? undefined
            : unwrapExpression(declaration);
        if (!expression || !isElysiaInstanceExpression(expression)) {
          return;
        }
        context.report({
          messageId: 'defaultExport',
          node,
        });
      },
    };
  },
  meta: {
    docs: {
      description:
        'Require camelCase …Route(s) exports; Elysia name option must be SCREAMING_SNAKE equivalent',
    },
    messages: {
      badName:
        'Exported Elysia route plugins must be named like `featureActionRoute` (camelCase ending in `Route` or `Routes`). Found `{{name}}`.',
      missingNameOption:
        'Pass `{ name: "{{name}}" }` on `new Elysia(...)` (SCREAMING_SNAKE matching the camelCase export).',
      nameMismatch:
        '`new Elysia({ name: "{{optionName}}" })` must be `{{expectedName}}` for export `{{name}}`.',
      defaultExport:
        'Do not default-export Elysia route plugins. Use a named `featureActionRoute` export.',
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
    type: 'problem',
  },
});
