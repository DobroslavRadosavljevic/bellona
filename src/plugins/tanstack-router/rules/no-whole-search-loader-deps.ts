import type { CreateOnceRule, ESTree } from '@oxlint/plugins';

import { isAstNode } from '../../../lib/ast-node.ts';
import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getStaticPropertyName, isFunctionLike, unwrapExpression } from '../ast.ts';
import {
  collectRouterEdgeBindings,
  getAppliedRouteOptions,
  type RouterEdgeBindings,
} from '../edge.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipRouterFile } from '../options.ts';
import { getObjectPropValue } from '../router.ts';

type LoaderDepsFunction = ESTree.Function | ESTree.ArrowFunctionExpression;

/** How the first parameter exposes `search`: a destructured local name, or the context name. */
type SearchSource = { readonly local: string | undefined; readonly context: string | undefined };

function searchSource(fn: LoaderDepsFunction): SearchSource {
  const param = fn.params[0];
  const pattern = param?.type === 'AssignmentPattern' ? param.left : param;
  if (pattern?.type === 'Identifier') {
    return { local: undefined, context: pattern.name };
  }
  if (pattern?.type !== 'ObjectPattern') {
    return { local: undefined, context: undefined };
  }
  for (const property of pattern.properties) {
    if (property.type !== 'Property' || getStaticPropertyName(property.key) !== 'search') {
      continue;
    }
    const value =
      property.value.type === 'AssignmentPattern' ? property.value.left : property.value;
    if (value.type === 'Identifier') {
      return { local: value.name, context: undefined };
    }
  }
  return { local: undefined, context: undefined };
}

/** `search` (destructured) or `ctx.search` / `ctx["search"]`. */
function isWholeSearch(node: ESTree.Expression, source: SearchSource): boolean {
  const expression = unwrapExpression(node);
  if (expression?.type === 'Identifier') {
    return source.local !== undefined && expression.name === source.local;
  }
  if (expression?.type !== 'MemberExpression' || source.context === undefined) {
    return false;
  }
  const object = unwrapExpression(expression.object);
  return (
    object?.type === 'Identifier' &&
    object.name === source.context &&
    getStaticPropertyName(expression.property) === 'search' &&
    (!expression.computed || expression.property.type === 'Literal')
  );
}

/** The returned value copies all of search: `search`, `{ ...search }`, or `{ search }`. */
function returnsWholeSearch(node: ESTree.Expression, source: SearchSource): boolean {
  if (isWholeSearch(node, source)) {
    return true;
  }
  const expression = unwrapExpression(node);
  if (expression?.type !== 'ObjectExpression') {
    return false;
  }
  return expression.properties.some((property) =>
    property.type === 'SpreadElement'
      ? isWholeSearch(property.argument, source)
      : isWholeSearch(property.value, source),
  );
}

/** Values of `return` statements that belong to `fn`, not to nested functions. */
function collectReturnValues(node: ESTree.Node, fn: ESTree.Node, out: ESTree.Expression[]): void {
  if (node !== fn && isFunctionLike(node)) {
    return;
  }
  if (node.type === 'ReturnStatement') {
    if (node.argument !== null && node.argument !== undefined) {
      out.push(node.argument);
    }
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === 'parent') {
      continue;
    }
    const children = Array.isArray(value) ? value : [value];
    for (const child of children) {
      if (isAstNode(child)) {
        collectReturnValues(child, fn, out);
      }
    }
  }
}

function returnedValues(fn: LoaderDepsFunction): ESTree.Expression[] {
  if (fn.body === null || fn.body === undefined) {
    return [];
  }
  if (fn.body.type !== 'BlockStatement') {
    return [fn.body];
  }
  const values: ESTree.Expression[] = [];
  collectReturnValues(fn.body, fn, values);
  return values;
}

export const noWholeSearchLoaderDepsName = bnRuleName('no-whole-search-loader-deps');

export const noWholeSearchLoaderDeps: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow `loaderDeps` that return the whole `search` object',
    },
    messages: {
      wholeSearch: agentDiagnostic({
        problem: '`loaderDeps` returns the whole `search` object.',
        why: 'The router compares `loaderDeps` to decide when to run `loader` again and to key its cache. A change to any search param, also one the loader does not use, then runs the loader again.',
        fix: 'Return only the fields that the loader reads: `loaderDeps: ({ search: { page, q } }) => ({ page, q })`. Then read `deps` in `loader`.',
        avoid:
          'Do not spread `search` into the result. Do not read `location.search` in `loader`. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: RouterEdgeBindings;

    return {
      before() {
        if (shouldSkipRouterFile(context)) {
          return false;
        }
        bindings = collectRouterEdgeBindings(context.sourceCode.ast);
      },
      CallExpression(node) {
        const applied = getAppliedRouteOptions(node, bindings);
        if (applied === undefined) {
          return;
        }
        const value = unwrapExpression(getObjectPropValue(applied.argument, 'loaderDeps'));
        if (value === undefined || !isFunctionLike(value)) {
          return;
        }
        const source = searchSource(value);
        if (source.local === undefined && source.context === undefined) {
          return;
        }
        for (const returned of returnedValues(value)) {
          if (returnsWholeSearch(returned, source)) {
            context.report({ messageId: 'wholeSearch', node: returned });
          }
        }
      },
    };
  },
});
