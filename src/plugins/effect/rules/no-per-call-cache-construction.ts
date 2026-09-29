import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getStaticPropertyName, isFunctionLike, parentOf, unwrapExpression } from '../ast.ts';
import { collectEffectBindings, isModuleCall, type EffectBindings } from '../bindings.ts';
import {
  CACHE_MODULE,
  collectModuleRefs,
  effectFnOwnerCall,
  moduleMemberName,
  RC_MAP_MODULE,
  SCOPED_CACHE_MODULE,
  type ModuleRefs,
  type ModuleSource,
} from '../module-refs.ts';
import {
  ALLOW_OPTION_SCHEMA,
  DEFAULT_ALLOW_OPTIONS,
  shouldSkipEffectStyleFile,
} from '../options.ts';

export const noPerCallCacheConstructionName = bnRuleName('no-per-call-cache-construction');

/** Constructors for each cache module. Verified in `effect@4.0.0-rc.115`. */
const CACHE_CONSTRUCTORS: ReadonlyMap<ModuleSource, readonly string[]> = new Map([
  [CACHE_MODULE, ['make', 'makeWith']],
  [SCOPED_CACHE_MODULE, ['make', 'makeWith']],
  [RC_MAP_MODULE, ['make']],
]);

/** `Effect.cached*` makes a memoized Effect. It must be built once to share the result. */
const EFFECT_CACHED = ['cached', 'cachedWithTTL', 'cachedInvalidateWithTTL'];

/** True when `fn` is a member of the object in `Service.of({ … })`. */
function isServiceOfMember(fn: ESTree.Node): boolean {
  let current = parentOf(fn);
  if (current?.type === 'Property') {
    current = parentOf(current);
  }
  if (current?.type !== 'ObjectExpression') {
    return false;
  }
  const call = parentOf(current);
  if (call?.type !== 'CallExpression' || unwrapExpression(call.arguments[0]) !== current) {
    return false;
  }
  const callee = unwrapExpression(call.callee);
  return callee?.type === 'MemberExpression' && getStaticPropertyName(callee.property) === 'of';
}

/** True when `node` is inside a function that runs for each call, not once. */
function runsPerCall(node: ESTree.Node, bindings: EffectBindings): boolean {
  let current = parentOf(node);
  while (current !== undefined) {
    if (
      isFunctionLike(current) &&
      (effectFnOwnerCall(current, bindings) !== undefined || isServiceOfMember(current))
    ) {
      return true;
    }
    current = parentOf(current);
  }
  return false;
}

export const noPerCallCacheConstruction: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow Cache, ScopedCache, RcMap, and Effect.cached construction inside a function that runs for each call',
    },
    messages: {
      perCall: agentDiagnostic({
        problem:
          '`{{api}}` makes a new cache inside a function that runs for each call. Each call gets an empty cache.',
        why: 'A cache helps only when many calls share it. A cache that is built for each call never gets a hit. It also adds work and memory to each call.',
        fix: 'Build the cache one time in the layer: `const cache = yield* {{api}}(…)` in the `Layer.effect` generator, before `return Service.of({ … })`. Then use `cache` in the methods.',
        avoid: 'Do not move the cache into a module-level `let`. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    let bindings: EffectBindings;
    let refs: ReadonlyMap<ModuleSource, ModuleRefs>;

    function cacheApi(node: ESTree.CallExpression): string | undefined {
      for (const name of EFFECT_CACHED) {
        if (isModuleCall(node, bindings, 'effect', name)) {
          return `Effect.${name}`;
        }
      }
      for (const [source, exports] of CACHE_CONSTRUCTORS) {
        const moduleRefs = refs.get(source);
        if (moduleRefs === undefined) {
          continue;
        }
        const name = moduleMemberName(node.callee, moduleRefs, source);
        if (name !== undefined && exports.includes(name)) {
          return `${source.name}.${name}`;
        }
      }
      return undefined;
    }

    return {
      before() {
        if (shouldSkipEffectStyleFile(context)) {
          return false;
        }
        const program = context.sourceCode.ast;
        bindings = collectEffectBindings(program);
        refs = new Map(
          [...CACHE_CONSTRUCTORS.keys()].map((source) => [
            source,
            collectModuleRefs(program, source),
          ]),
        );
      },
      CallExpression(node) {
        const api = cacheApi(node);
        if (api === undefined || !runsPerCall(node, bindings)) {
          return;
        }
        context.report({ messageId: 'perCall', node, data: { api } });
      },
    };
  },
});
