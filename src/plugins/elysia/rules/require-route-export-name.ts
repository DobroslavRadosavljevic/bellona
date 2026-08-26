import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
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
export const requireRouteExportNameName = bnRuleName('require-route-export-name');

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
      badName: agentDiagnostic({
        problem:
          'Exported Elysia route plugin `{{name}}` is not camelCase ending in `Route` or `Routes` (example: `featureActionRoute`).',
        why: 'The export name is how `routes/index` and tests find the plugin. Other names hide the file’s job.',
        fix: 'Rename the export to `featureActionRoute` (or `featureRoutes` for an index). Update the Elysia `{ name }` option to SCREAMING_SNAKE of that export.',
        avoid: 'Do not default-export. Do not disable the rule.',
      }),
      missingNameOption: agentDiagnostic({
        problem:
          '`new Elysia(...)` for this route export is missing `{ name: "{{name}}" }` (SCREAMING_SNAKE matching the camelCase export).',
        why: 'The instance name is used for lifecycle dedup and must match the export.',
        fix: 'Write `new Elysia({ name: "{{name}}" })` then chain `.get` / `.post`.',
        avoid: 'Do not invent a different string. Do not disable the rule.',
      }),
      nameMismatch: agentDiagnostic({
        problem:
          '`new Elysia({ name: "{{optionName}}" })` does not match export `{{name}}`. Expected `{{expectedName}}`.',
        why: 'A mismatched name breaks the 1:1 map between export and plugin id.',
        fix: 'Set `{ name: "{{expectedName}}" }` to the SCREAMING_SNAKE form of `{{name}}`.',
        avoid:
          'Do not change only the export or only the option. Keep them paired. Do not disable the rule.',
      }),
      defaultExport: agentDiagnostic({
        problem: 'This Elysia route plugin is a default export.',
        why: 'Default exports hide the `featureActionRoute` name that indexes and tests rely on.',
        fix: 'Use a named export: `export const featureActionRoute = new Elysia({ name: "FEATURE_ACTION_ROUTE" })`.',
        avoid: 'Do not add `export default` plus a named export. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
    type: 'problem',
  },
});
