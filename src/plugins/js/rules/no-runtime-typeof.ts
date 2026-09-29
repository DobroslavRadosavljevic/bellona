import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree, Scope, SourceCode } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { booleanField, objectOptionAt } from '../../../lib/options.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { isDecoderFunction } from '../shared/decoders.ts';
import {
  createNarrowingEnvironment,
  isDeclaredNarrowableUnion,
  type NarrowingEnvironment,
} from '../shared/narrowable-union.ts';

type RuntimeFunction = ESTree.ArrowFunctionExpression | ESTree.Function;

function isRuntimeFunction(node: ESTree.Node): node is RuntimeFunction {
  return (
    node.type === 'ArrowFunctionExpression' ||
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression'
  );
}

function isInsideTypeGuard(node: ESTree.Node): boolean {
  let current: ESTree.Node | null = node.parent;
  while (current !== null && current.type !== 'Program') {
    if (isRuntimeFunction(current)) {
      return current.returnType?.typeAnnotation.type === 'TSTypePredicate';
    }
    current = current.parent;
  }
  return false;
}

function isFreeIdentifier(sourceCode: SourceCode, identifier: ESTree.IdentifierReference): boolean {
  let scope: Scope | null = sourceCode.getScope(identifier);
  while (scope !== null) {
    const variable = scope.set.get(identifier.name);
    if (variable !== undefined) return variable.defs.length === 0;
    scope = scope.upper;
  }
  return true;
}

/**
 * `typeof` on a name that no code in this file declares tests the host
 * environment (`typeof window`, `typeof Bun`). It is the only check that does
 * not throw a ReferenceError for an undeclared global, so no decoder can
 * replace it. `globalThis.name` is the same feature test.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof#interaction_with_undeclared_and_uninitialized_variables
 */
function isEnvironmentFeatureTest(sourceCode: SourceCode, argument: ESTree.Expression): boolean {
  if (argument.type === 'Identifier') return isFreeIdentifier(sourceCode, argument);
  return (
    argument.type === 'MemberExpression' &&
    argument.object.type === 'Identifier' &&
    argument.object.name === 'globalThis' &&
    isFreeIdentifier(sourceCode, argument.object)
  );
}

const validatorMethods: ReadonlySet<string> = new Set(['custom', 'refine', 'superRefine']);
const effectSchemaMethods: ReadonlySet<string> = new Set(['declare', 'filter', 'makeFilter']);

function calleeMethod(callee: ESTree.Expression): { owner: string | null; method: string } | null {
  if (callee.type !== 'MemberExpression' || callee.computed) return null;
  if (callee.property.type !== 'Identifier') return null;
  return {
    owner: callee.object.type === 'Identifier' ? callee.object.name : null,
    method: callee.property.name,
  };
}

/**
 * A predicate passed to a schema API is the boundary decoder: `z.custom(fn)`,
 * `.refine(fn)`, `.superRefine(fn)`, `Schema.declare(fn)`,
 * `Schema.makeFilter(fn)`, `Schema.filter(fn)`, and `Predicate.*(fn)`.
 * `typeof` inside it is the check that the schema runs on raw input.
 */
function isSchemaPredicate(fn: RuntimeFunction): boolean {
  const call = fn.parent;
  if (call?.type !== 'CallExpression' || !call.arguments.some((argument) => argument === fn)) {
    return false;
  }
  const callee = calleeMethod(call.callee);
  if (callee === null) return false;
  if (validatorMethods.has(callee.method) || callee.owner === 'Predicate') return true;
  return callee.owner === 'Schema' && effectSchemaMethods.has(callee.method);
}

function isInsideSchemaPredicate(node: ESTree.Node): boolean {
  let current: ESTree.Node | null = node.parent;
  while (current !== null && current.type !== 'Program') {
    if (isRuntimeFunction(current) && isSchemaPredicate(current)) return true;
    current = current.parent;
  }
  return false;
}

function isInsideDecoder(
  node: ESTree.Node,
  visitorKeys: Readonly<Record<string, readonly string[]>>,
): boolean {
  let current: ESTree.Node | null = node.parent;
  while (current !== null && current.type !== 'Program') {
    if (isRuntimeFunction(current) && isDecoderFunction(current, visitorKeys)) return true;
    current = current.parent;
  }
  return false;
}

/** Disallow runtime typeof checks that narrow unparsed values instead of decoding them. A declared union narrows with `typeof` as TypeScript intends. */
export const noRuntimeTypeofName = bnRuleName('no-runtime-typeof');

export const noRuntimeTypeof: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow runtime typeof checks on values with no declared union type; external values must be decoded at their I/O boundary.',
    },
    messages: {
      runtimeTypeof: agentDiagnostic({
        problem:
          'This `typeof` check narrows a value with no declared contract: `unknown`, `any`, no annotation, an unconstrained type parameter, or a local type with no primitive or function member. It does not decode the value into a domain type. Allowed: a declared union (`value: string | number`), a named type from another module or an indexed type (`item: SparkbarDatum`, `type: ReactElement["type"]`), a schema predicate (`z.custom`, `.refine`), a small decoder, and a feature test of an undeclared global (`typeof window`).',
        why: 'On a value with no declared contract, a `typeof` result is only a representation tag. External input can still be the wrong shape. Callers then branch on a tag instead of a parsed owner type. A declared type is a contract that TypeScript checks at each call, so `typeof` on it is ordinary narrowing.',
        fix: 'Parse at the I/O boundary with a schema (Zod, Effect Schema, or the project decoder), then branch on the named domain value. If the value is in memory and has a known set of forms, give the parameter or binding that type: a union (`className: string | ((state: State) => string)`), a named type (`item: Datum`), or a type parameter constrained to one (`<T extends Value>(value: T)`); then `typeof` is allowed. If this function is an explicit `x is T` type guard and the project allows it, set `{ allowInTypeGuards: true }` on `bl-js/no-runtime-typeof`.',
        avoid:
          'Do not replace `typeof` with a tag check such as `Object.prototype.toString.call(x) === "[object String]"`, `instanceof Object`, `in`, `constructor.name`, `z.function().safeParse(x)`, or `Number.isFinite(x as number)`. Do not add `as T` after the check. Do not disable the rule to keep the typeof.',
      }),
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowInTypeGuards: { type: 'boolean' },
          allowDecoders: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ allowInTypeGuards: false, allowDecoders: true }],
  },
  createOnce(context) {
    let environment: NarrowingEnvironment | null = null;

    return {
      Program(node) {
        environment = createNarrowingEnvironment(context.sourceCode, node);
      },
      UnaryExpression(node) {
        const allowInTypeGuards = booleanField(
          objectOptionAt(context, 0),
          'allowInTypeGuards',
          false,
        );
        if (node.operator !== 'typeof') return;
        if (isEnvironmentFeatureTest(context.sourceCode, node.argument)) return;
        if (isInsideSchemaPredicate(node)) return;
        if (
          booleanField(objectOptionAt(context, 0), 'allowDecoders', true) &&
          isInsideDecoder(node, context.sourceCode.visitorKeys)
        ) {
          return;
        }
        if (environment !== null && isDeclaredNarrowableUnion(node.argument, environment)) {
          return;
        }
        if (!allowInTypeGuards || !isInsideTypeGuard(node)) {
          context.report({ node, messageId: 'runtimeTypeof' });
        }
      },
    };
  },
});
