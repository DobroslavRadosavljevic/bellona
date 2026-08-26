import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getStaticPropertyName, unwrapAssignmentTarget, unwrapExpression } from '../ast.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';

function isLocationObject(node: ESTree.Expression | undefined): boolean {
  const expression = unwrapExpression(node);
  if (expression === undefined) {
    return false;
  }
  if (expression.type === 'Identifier' && expression.name === 'location') {
    return true;
  }
  if (expression.type === 'MemberExpression') {
    return getStaticPropertyName(expression.property) === 'location';
  }
  return false;
}

function isHistoryObject(node: ESTree.Expression | undefined): boolean {
  const expression = unwrapExpression(node);
  if (expression === undefined) {
    return false;
  }
  if (expression.type === 'Identifier' && expression.name === 'history') {
    return true;
  }
  return (
    expression.type === 'MemberExpression' &&
    getStaticPropertyName(expression.property) === 'history'
  );
}

const LOCATION_MUTATORS = new Set(['assign', 'replace', 'reload']);
const HISTORY_MUTATORS = new Set(['pushState', 'replaceState', 'push', 'replace']);

export const noImperativeLocationNavigationName = bnRuleName('no-imperative-location-navigation');

export const noImperativeLocationNavigation: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow imperative location/history navigation when using TanStack Router',
    },
    messages: {
      imperative: agentDiagnostic({
        problem:
          'This in-app navigation uses `location` / `history` (`assign`, `replace`, `push`, and similar) while the file imports TanStack Router.',
        why: 'Imperative browser APIs skip typed `to` / `params` / `search` and can drop router state.',
        fix: 'Use `<Link to="…" params={…} />`, `navigate({ to, params })`, `throw redirect({ to })`, or `router.navigate({ to, params })` with literal paths.',
        avoid: 'Do not use `window.location.href = …` as a substitute. Do not disable the rule.',
      }),
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
      AssignmentExpression(node) {
        if (node.operator !== '=') {
          return;
        }
        const left = unwrapAssignmentTarget(node.left);
        if (left.type !== 'MemberExpression') {
          return;
        }
        const prop = getStaticPropertyName(left.property);
        if (prop === 'href' && isLocationObject(left.object)) {
          context.report({ messageId: 'imperative', node });
          return;
        }
        if (prop === 'location') {
          const object = unwrapExpression(left.object);
          if (
            object?.type === 'Identifier' &&
            (object.name === 'window' || object.name === 'globalThis')
          ) {
            context.report({ messageId: 'imperative', node });
          }
        }
      },
      CallExpression(node) {
        const callee = unwrapExpression(node.callee);
        if (callee?.type !== 'MemberExpression') {
          return;
        }
        const method = getStaticPropertyName(callee.property);
        if (method === undefined) {
          return;
        }
        if (LOCATION_MUTATORS.has(method) && isLocationObject(callee.object)) {
          context.report({ messageId: 'imperative', node });
          return;
        }
        if (HISTORY_MUTATORS.has(method) && isHistoryObject(callee.object)) {
          context.report({ messageId: 'imperative', node });
        }
      },
    };
  },
});
