import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import {
  getStaticMemberPath,
  getStaticPropertyName,
  outerParent,
  unwrapExpression,
} from '../ast.ts';
import {
  collectEffectBindings,
  isModuleCall,
  type BindingKind,
  type EffectBindings,
} from '../bindings.ts';
import { collectConstValues } from '../const-values.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipEffectFile } from '../options.ts';

export const requireBoundedConcurrencyName = bnRuleName('require-bounded-concurrency');

/**
 * Calls with a `concurrency` option. `arity` is the argument count of the data-first form
 * (`Effect.forEach(list, f, options)`); a list call with fewer arguments is data-last.
 * Stream calls (`arity: 0`) always work on a stream, whose size is not fixed.
 */
const APIS: readonly { kind: BindingKind; name: string; arity: number }[] = [
  { kind: 'effect', name: 'all', arity: 2 },
  { kind: 'effect', name: 'forEach', arity: 3 },
  { kind: 'stream', name: 'mergeAll', arity: 2 },
  { kind: 'stream', name: 'mapEffect', arity: 0 },
  { kind: 'stream', name: 'flatMap', arity: 0 },
];

function isUnboundedOption(node: ESTree.Node | undefined): boolean {
  const options = unwrapExpression(node);
  return (
    options?.type === 'ObjectExpression' &&
    options.properties.some((property) => {
      if (property.type !== 'Property' || getStaticPropertyName(property.key) !== 'concurrency') {
        return false;
      }
      const value = unwrapExpression(property.value);
      return value?.type === 'Literal' && value.value === 'unbounded';
    })
  );
}

/** The list argument: data-first `f(list, …)`, `f(options)(list)`, or `list.pipe(f(…))`. */
function inputOf(node: ESTree.CallExpression, arity: number): ESTree.Node | undefined {
  if (node.arguments.length >= arity) {
    const first = node.arguments[0];
    return first?.type === 'SpreadElement' ? undefined : unwrapExpression(first);
  }
  const parent = outerParent(node);
  if (parent?.type !== 'CallExpression') {
    return undefined;
  }
  if (unwrapExpression(parent.callee) === node) {
    const list = parent.arguments[0];
    return list?.type === 'SpreadElement' ? undefined : unwrapExpression(list);
  }
  const callee = unwrapExpression(parent.callee);
  if (callee?.type === 'MemberExpression' && getStaticPropertyName(callee.property) === 'pipe') {
    return unwrapExpression(callee.object);
  }
  return undefined;
}

export const requireBoundedConcurrency: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow concurrency: "unbounded" when the number of items is not fixed in the code',
    },
    messages: {
      unbounded: agentDiagnostic({
        problem:
          '`{{api}}` runs with `concurrency: "unbounded"` on input whose size is not fixed in the code.',
        why: 'With "unbounded", Effect starts one fiber for each item at the same time. A large input then opens too many requests or database connections, and can hit rate limits or run out of memory.',
        fix: 'Set a number: `{ concurrency: 8 }`. Use "unbounded" only for a fixed list, such as `Effect.all([a, b, c], { concurrency: "unbounded" })`.',
        avoid: 'Do not set a very large number to get the same effect. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: EffectBindings;
    let consts: ReadonlyMap<string, ESTree.Node>;

    return {
      before() {
        if (shouldSkipEffectFile(context)) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
        consts = collectConstValues(context.sourceCode.ast);
      },
      CallExpression(node) {
        const api = APIS.find(({ kind, name }) => isModuleCall(node, bindings, kind, name));
        if (api === undefined) {
          return;
        }
        const last = node.arguments[node.arguments.length - 1];
        if (last === undefined || last.type === 'SpreadElement' || !isUnboundedOption(last)) {
          return;
        }
        if (api.arity > 0 && isFixedList(inputOf(node, api.arity))) {
          return;
        }
        const label = api.kind === 'effect' ? 'Effect' : 'Stream';
        context.report({ messageId: 'unbounded', node, data: { api: `${label}.${api.name}` } });
      },
    };

    /** An array or object literal without spread, or a same-file `const` bound to one. */
    function isFixedList(node: ESTree.Node | undefined): boolean {
      let value = unwrapExpression(node);
      if (value?.type === 'Identifier') {
        value = unwrapExpression(consts.get(value.name));
      }
      // `Object.values(clients)` of a fixed object literal is a fixed list too.
      if (value?.type === 'CallExpression' && value.arguments.length === 1) {
        const path = getStaticMemberPath(value.callee);
        if (
          path?.length === 2 &&
          path[0] === 'Object' &&
          ['values', 'keys', 'entries'].includes(path[1] ?? '')
        ) {
          const source = value.arguments[0];
          return source?.type !== 'SpreadElement' && isFixedObject(source);
        }
      }
      if (value?.type === 'ArrayExpression') {
        return value.elements.every((element) => element?.type !== 'SpreadElement');
      }
      return isFixedObject(value);
    }

    function isFixedObject(node: ESTree.Node | undefined): boolean {
      let value = unwrapExpression(node);
      if (value?.type === 'Identifier') {
        value = unwrapExpression(consts.get(value.name));
      }
      return (
        value?.type === 'ObjectExpression' &&
        value.properties.every((property) => property.type === 'Property')
      );
    }
  },
});
