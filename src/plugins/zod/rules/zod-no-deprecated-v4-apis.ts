import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { isJsString } from '../../../lib/js-kind.ts';
import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getStaticPropertyName, unwrapExpression } from '../ast.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipZodFile } from '../options.ts';

/**
 * Schema methods marked `@deprecated` in zod 4.6.5 `v4/classic/schemas.d.ts`,
 * with the replacement from that JSDoc. `.strict()` and `.superRefine()` are
 * not deprecated in 4.6.5, so they are not listed. String format chains
 * (`z.string().email()`) belong to `modern-format-validators`.
 *
 * @see https://zod.dev/v4/changelog
 */
const DEPRECATED_SCHEMA_METHODS: ReadonlyMap<string, string> = new Map([
  ['merge', '`A.extend(B.shape)`'],
  ['passthrough', '`.loose()` or `z.looseObject(…)`'],
  ['step', '`.multipleOf(n)`'],
  ['safe', '`.int()`'],
  ['finite', 'nothing (remove the call). Zod 4 numbers reject infinite values by default'],
  ['removeDefault', '`.unwrap()`'],
  ['removeCatch', '`.unwrap()`'],
]);

/** ZodError methods marked `@deprecated` in zod 4.6.5 `v4/classic/errors.d.ts`. */
const DEPRECATED_ERROR_METHODS: ReadonlyMap<string, string> = new Map([
  ['format', '`z.treeifyError(error)`'],
  ['flatten', '`z.flattenError(error)` (or `z.treeifyError(error)`)'],
]);

/** Builders whose first argument maps field names: a `message` key there is a field. */
const FIELD_MAP_BUILDERS = new Set([
  'object',
  'strictObject',
  'looseObject',
  'extend',
  'safeExtend',
  'pick',
  'omit',
  'partial',
  'required',
]);

type Program = ESTree.Program;

/** Top-level `const name = init` in the program, if any. */
function findTopLevelInit(program: Program, name: string): ESTree.Expression | undefined {
  for (const statement of program.body) {
    const declaration =
      statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
    if (declaration?.type !== 'VariableDeclaration') {
      continue;
    }
    for (const declarator of declaration.declarations) {
      if (declarator.id.type === 'Identifier' && declarator.id.name === name && declarator.init) {
        return declarator.init;
      }
    }
  }
  return undefined;
}

/**
 * True when `node` is a Zod schema expression: a chain that starts at `z`
 * (`z.object(…).extend(…)`), an identifier named `…Schema`, or a same-file
 * top-level const that resolves to one of those.
 */
function isZodSchemaExpression(
  node: ESTree.Expression | undefined,
  program: Program,
  seen: Set<string> = new Set<string>(),
): boolean {
  let current = unwrapExpression(node);
  while (current) {
    if (current.type === 'CallExpression') {
      current = unwrapExpression(current.callee);
      continue;
    }
    if (current.type === 'MemberExpression') {
      current = unwrapExpression(current.object);
      continue;
    }
    break;
  }
  if (current?.type !== 'Identifier') {
    return false;
  }
  if (current.name === 'z' || current.name.endsWith('Schema')) {
    return true;
  }
  if (seen.has(current.name)) {
    return false;
  }
  seen.add(current.name);
  return isZodSchemaExpression(findTopLevelInit(program, current.name), program, seen);
}

/** True when a call starts at `z` (`z.string(…)`, `z.string().min(…)`). */
function isZRootedCall(node: ESTree.CallExpression): boolean {
  let current = unwrapExpression(node.callee);
  while (current) {
    if (current.type === 'CallExpression') {
      current = unwrapExpression(current.callee);
      continue;
    }
    if (current.type === 'MemberExpression') {
      current = unwrapExpression(current.object);
      continue;
    }
    break;
  }
  return current?.type === 'Identifier' && current.name === 'z';
}

/** `z.ZodError` / `ZodError` in an `instanceof` right side. */
function isZodErrorClass(node: ESTree.Expression | undefined): boolean {
  const expression = unwrapExpression(node);
  if (expression?.type === 'Identifier') {
    return expression.name === 'ZodError';
  }
  if (expression?.type === 'MemberExpression') {
    const object = unwrapExpression(expression.object);
    return (
      object?.type === 'Identifier' &&
      object.name === 'z' &&
      getStaticPropertyName(expression.property) === 'ZodError'
    );
  }
  return false;
}

/** True when `test` contains `name instanceof ZodError` (or `z.ZodError`). */
function testChecksZodError(test: ESTree.Node, name: string): boolean {
  if (test.type === 'BinaryExpression' && test.operator === 'instanceof') {
    const left = unwrapExpression(test.left);
    return left?.type === 'Identifier' && left.name === name && isZodErrorClass(test.right);
  }
  if (test.type === 'LogicalExpression' && test.operator === '&&') {
    return testChecksZodError(test.left, name) || testChecksZodError(test.right, name);
  }
  if (test.type === 'ParenthesizedExpression') {
    return testChecksZodError(test.expression, name);
  }
  return false;
}

/**
 * True when `receiver` is a Zod error: `result.error` (a `safeParse` result) or
 * an identifier inside `if (err instanceof z.ZodError) { … }`.
 */
function isZodErrorReceiver(receiver: ESTree.Expression | undefined, call: ESTree.Node): boolean {
  const expression = unwrapExpression(receiver);
  if (expression?.type === 'MemberExpression') {
    return getStaticPropertyName(expression.property) === 'error' && !expression.computed;
  }
  if (expression?.type !== 'Identifier') {
    return false;
  }
  let child: ESTree.Node = call;
  let current: ESTree.Node | undefined = call.parent ?? undefined;
  while (current) {
    if (
      (current.type === 'IfStatement' || current.type === 'ConditionalExpression') &&
      current.consequent === child &&
      testChecksZodError(current.test, expression.name)
    ) {
      return true;
    }
    child = current;
    current = current.parent ?? undefined;
  }
  return false;
}

/** String or template value (an error message, not a field schema). */
function isMessageText(node: ESTree.Node): boolean {
  return node.type === 'TemplateLiteral' || (node.type === 'Literal' && isJsString(node.value));
}

export const zodNoDeprecatedV4ApisName = bnRuleName('no-deprecated-v4-apis');

export const zodNoDeprecatedV4Apis: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow Zod APIs that zod 4 marks @deprecated (message param, merge, passthrough, nativeEnum, ZodError format/flatten)',
    },
    messages: {
      messageParam: agentDiagnostic({
        problem:
          'This Zod call passes `{ message: "…" }`. Zod 4 marks the `message` parameter `@deprecated`.',
        why: 'Zod 4 uses one `error` parameter for custom messages. `error` also takes a function, so one key covers text and per-issue messages.',
        fix: 'Rename the key to `error`: `z.string().min(1, { error: "Required" })` or the short form `z.string().min(1, "Required")`.',
        avoid:
          'Do not keep both `message` and `error`. Do not rename a schema field that is called `message`. Do not disable the rule.',
      }),
      deprecatedMethod: agentDiagnostic({
        problem: 'This Zod schema calls `.{{method}}()`. Zod 4 marks it `@deprecated`.',
        why: 'Deprecated Zod methods stay only for migration and can go in a later major version. The replacement is the Zod 4 API.',
        fix: 'Replace `.{{method}}()` with {{replacement}}.',
        avoid: 'Do not wrap the old call in a helper to hide it. Do not disable the rule.',
      }),
      nativeEnum: agentDiagnostic({
        problem: 'This uses `z.nativeEnum(…)`. Zod 4 marks it `@deprecated`.',
        why: 'Zod 4 merged `z.nativeEnum` into `z.enum`, which now accepts TypeScript enums and enum-like objects.',
        fix: 'Replace `z.nativeEnum(MyEnum)` with `z.enum(MyEnum)`.',
        avoid: 'Do not convert the enum to a string array by hand. Do not disable the rule.',
      }),
      errorMethod: agentDiagnostic({
        problem: 'This calls `.{{method}}()` on a `ZodError`. Zod 4 marks it `@deprecated`.',
        why: 'Zod 4 moved error formatting to top-level functions that take the error.',
        fix: 'Replace `error.{{method}}()` with {{replacement}}. Use `z.prettifyError(error)` for a readable string.',
        avoid:
          'Do not walk `error.issues` by hand to rebuild the same shape. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    /** Report `message: "…"` keys in the object arguments of a Zod call. */
    const reportMessageParams = (node: ESTree.CallExpression, method: string | undefined) => {
      node.arguments.forEach((argument, index) => {
        if (index === 0 && method !== undefined && FIELD_MAP_BUILDERS.has(method)) {
          return;
        }
        const object = argument.type === 'SpreadElement' ? undefined : unwrapExpression(argument);
        if (object?.type !== 'ObjectExpression') {
          return;
        }
        for (const property of object.properties) {
          if (
            property.type === 'Property' &&
            !property.computed &&
            getStaticPropertyName(property.key) === 'message' &&
            isMessageText(property.value)
          ) {
            context.report({ messageId: 'messageParam', node: property });
          }
        }
      });
    };

    return {
      before() {
        if (shouldSkipZodFile(context)) {
          return false;
        }
      },
      CallExpression(node) {
        const callee = unwrapExpression(node.callee);
        if (callee?.type !== 'MemberExpression') {
          return;
        }
        const method = getStaticPropertyName(callee.property);
        const receiver = unwrapExpression(callee.object);
        const program = context.sourceCode.ast;

        if (isZRootedCall(node)) {
          reportMessageParams(node, method);
        }

        if (method === undefined) {
          return;
        }

        if (method === 'nativeEnum' && receiver?.type === 'Identifier' && receiver.name === 'z') {
          context.report({ messageId: 'nativeEnum', node });
          return;
        }

        const errorReplacement = DEPRECATED_ERROR_METHODS.get(method);
        if (errorReplacement !== undefined && isZodErrorReceiver(receiver, node)) {
          context.report({
            messageId: 'errorMethod',
            data: { method, replacement: errorReplacement },
            node,
          });
          return;
        }

        const replacement = DEPRECATED_SCHEMA_METHODS.get(method);
        if (replacement !== undefined && isZodSchemaExpression(receiver, program)) {
          context.report({
            messageId: 'deprecatedMethod',
            data: { method, replacement },
            node,
          });
        }
      },
    };
  },
});
