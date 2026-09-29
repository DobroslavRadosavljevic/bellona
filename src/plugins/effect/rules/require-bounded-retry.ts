import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { booleanField, objectOptionAt } from '../../../lib/options.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import {
  getCallArgument,
  getStaticPropertyName,
  isFunctionLike,
  unwrapExpression,
} from '../ast.ts';
import { collectEffectBindings, isModuleCall, type EffectBindings } from '../bindings.ts';
import { collectConstValues } from '../const-values.ts';
import { collectModuleNames, moduleNameMemberOf, type ModuleNames } from '../module-names.ts';
import { shouldSkipEffectFile } from '../options.ts';

export const requireBoundedRetryName = bnRuleName('require-bounded-retry');

/** Schedules that recur forever on their own. */
const UNBOUNDED = new Set(['exponential', 'spaced', 'fixed', 'fibonacci', 'forever', 'windowed']);

/** Schedule combinators that stop a schedule. */
const BOUNDS = new Set(['recurs', 'upTo', 'during', 'while']);

/** Retry / repeat options that stop the loop. */
const BOUND_OPTIONS = new Set(['times', 'until', 'while']);

const OPTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    allow: { type: 'array', items: { type: 'string', minLength: 1 }, uniqueItems: true },
    checkRepeat: { type: 'boolean' },
  },
} as const;

/** What a schedule expression contains. `base` is the first unbounded schedule. */
interface ScheduleFacts {
  readonly base: string | undefined;
  readonly bounded: boolean;
  readonly unknown: boolean;
}

const NEUTRAL: ScheduleFacts = { base: undefined, bounded: false, unknown: false };
const UNKNOWN: ScheduleFacts = { base: undefined, bounded: false, unknown: true };

/** Facts for schedules that run one after another or while any recurs: bounded only if all are. */
function allBounded(parts: readonly ScheduleFacts[]): ScheduleFacts {
  const open = parts.find((part) => part.base !== undefined && !part.bounded);
  return {
    base: open?.base,
    bounded: open === undefined && parts.some((part) => part.bounded),
    unknown: parts.some((part) => part.unknown),
  };
}

/** Facts for schedules that recur while all recur, or a wrapper: bounded if any part is. */
function anyBounded(parts: readonly ScheduleFacts[]): ScheduleFacts {
  return {
    base: parts.find((part) => part.base !== undefined)?.base,
    bounded: parts.some((part) => part.bounded),
    unknown: parts.some((part) => part.unknown),
  };
}

export const requireBoundedRetry: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require a bound (Schedule.recurs, upTo, during, or times) on Effect / Stream retry schedules, and on repeat with checkRepeat',
    },
    messages: {
      unbounded: agentDiagnostic({
        problem: '`{{api}}` uses a `Schedule.{{base}}` schedule with no bound. It can run forever.',
        why: '`Schedule.{{base}}` never stops by itself. A retry then hides a permanent failure and keeps the fiber busy, and a repeat never ends.',
        fix: 'Add a bound: `Schedule.{{base}}(…).pipe(Schedule.upTo("30 seconds"))`, `Schedule.max([schedule, Schedule.recurs(5)])`, or the option `{ schedule, times: 5 }`. `Schedule.min` keeps going while any member recurs, so it does not bound. For a loop that must run for the whole process, add the file to `allow`.',
        avoid:
          'Do not use a very large `recurs` count to hide the problem. Do not disable the rule.',
      }),
    },
    schema: [OPTION_SCHEMA],
    defaultOptions: [{ allow: [], checkRepeat: false }],
  },
  createOnce(context) {
    let bindings: EffectBindings;
    let schedule: ModuleNames;
    let consts: ReadonlyMap<string, ESTree.Node>;
    let names: readonly string[];

    return {
      before() {
        if (shouldSkipEffectFile(context)) {
          return false;
        }
        bindings = collectEffectBindings(context.sourceCode.ast);
        schedule = collectModuleNames(context.sourceCode.ast, 'Schedule');
        consts = collectConstValues(context.sourceCode.ast);
        // A repeat that runs for the whole process (a poll or heartbeat) is often on purpose.
        names = booleanField(objectOptionAt(context, 0), 'checkRepeat', false)
          ? ['retry', 'repeat']
          : ['retry'];
      },
      CallExpression(node) {
        const api = apiName(node);
        if (api === undefined) {
          return;
        }
        const last = node.arguments[node.arguments.length - 1];
        if (last === undefined || last.type === 'SpreadElement') {
          return;
        }
        const policy = unwrapExpression(last);
        let target: ESTree.Node | undefined = policy;
        if (policy?.type === 'ObjectExpression') {
          target = undefined;
          for (const property of policy.properties) {
            if (property.type !== 'Property') {
              return;
            }
            const key = getStaticPropertyName(property.key);
            if (key !== undefined && BOUND_OPTIONS.has(key)) {
              return;
            }
            if (key === 'schedule') {
              target = property.value;
            }
          }
        }
        if (target === undefined) {
          return;
        }
        const facts = analyze(target, new Set());
        const base = facts.base;
        if (base === undefined || facts.bounded || facts.unknown) {
          return;
        }
        context.report({ messageId: 'unbounded', node, data: { api, base } });
      },
    };

    function apiName(node: ESTree.CallExpression): string | undefined {
      for (const [kind, label] of [
        ['effect', 'Effect'],
        ['stream', 'Stream'],
      ] as const) {
        for (const name of names) {
          if (isModuleCall(node, bindings, kind, name)) {
            return `${label}.${name}`;
          }
        }
      }
      return undefined;
    }

    function analyzeArguments(
      node: ESTree.CallExpression,
      seen: ReadonlySet<string>,
    ): ScheduleFacts[] {
      return node.arguments.map((argument) =>
        argument.type === 'SpreadElement' ? UNKNOWN : analyze(argument, seen),
      );
    }

    /** Facts for `Schedule.min([a, b])` / `Schedule.max([a, b])` array members. */
    function analyzeList(
      node: ESTree.Node | undefined,
      seen: ReadonlySet<string>,
    ): ScheduleFacts[] {
      const list = unwrapExpression(node);
      if (list?.type !== 'ArrayExpression') {
        return [UNKNOWN];
      }
      return list.elements.map((element) =>
        element === null || element.type === 'SpreadElement' ? UNKNOWN : analyze(element, seen),
      );
    }

    function analyze(node: ESTree.Node | undefined, seen: ReadonlySet<string>): ScheduleFacts {
      const expression = unwrapExpression(node);
      if (
        expression === undefined ||
        isFunctionLike(expression) ||
        expression.type === 'Literal' ||
        expression.type === 'TemplateLiteral' ||
        expression.type === 'ObjectExpression'
      ) {
        return NEUTRAL;
      }
      const member = moduleNameMemberOf(expression, schedule, 'Schedule');
      if (expression.type === 'Identifier' || expression.type === 'MemberExpression') {
        if (member !== undefined) {
          return member === 'forever' ? { ...NEUTRAL, base: member } : NEUTRAL;
        }
        const value = expression.type === 'Identifier' ? consts.get(expression.name) : undefined;
        if (expression.type !== 'Identifier' || value === undefined || seen.has(expression.name)) {
          return UNKNOWN;
        }
        return analyze(value, new Set([...seen, expression.name]));
      }
      if (expression.type !== 'CallExpression') {
        return UNKNOWN;
      }
      const callee = unwrapExpression(expression.callee);
      const name = moduleNameMemberOf(callee, schedule, 'Schedule');
      if (name === undefined) {
        if (
          callee?.type !== 'MemberExpression' ||
          getStaticPropertyName(callee.property) !== 'pipe'
        ) {
          return UNKNOWN;
        }
        // `schedule.pipe(Schedule.upTo(…), Schedule.jittered)`: every step wraps the result.
        return anyBounded([analyze(callee.object, seen), ...analyzeArguments(expression, seen)]);
      }
      if (UNBOUNDED.has(name)) {
        return { ...NEUTRAL, base: name };
      }
      if (BOUNDS.has(name)) {
        return { ...anyBounded(analyzeArguments(expression, seen)), bounded: true };
      }
      if (name === 'min') {
        return allBounded(analyzeList(getCallArgument(expression, 0), seen));
      }
      if (name === 'max') {
        return anyBounded(analyzeList(getCallArgument(expression, 0), seen));
      }
      if (name === 'concat') {
        return allBounded(analyzeArguments(expression, seen));
      }
      return anyBounded(analyzeArguments(expression, seen));
    }
  },
});
