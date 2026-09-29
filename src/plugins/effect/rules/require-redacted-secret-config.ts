import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { objectOptionAt, stringField } from '../../../lib/options.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getCallArgument, getStringLiteral, unwrapExpression } from '../ast.ts';
import {
  collectModuleRefs,
  CONFIG_MODULE,
  moduleMemberName,
  type ModuleRefs,
} from '../module-refs.ts';
import { shouldSkipEffectStyleFile } from '../options.ts';

export const requireRedactedSecretConfigName = bnRuleName('require-redacted-secret-config');

/** Key names that usually hold a secret. Matched without case. */
export const DEFAULT_SECRET_PATTERN = '(KEY|TOKEN|SECRET|PASSWORD|PASS|PRIVATE|CREDENTIAL)';

/** `Config` constructors that read a plain string. Verified in `effect@4.0.0-rc.115`. */
const PLAIN_STRING_CONFIGS = ['String', 'NonEmptyString'];

const SECRET_OPTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    allow: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      uniqueItems: true,
    },
    pattern: { type: 'string', minLength: 1 },
  },
} as const;

/** The text of a string literal or a template literal without `${…}`. */
function staticString(node: ESTree.Node | undefined): string | undefined {
  const expression = unwrapExpression(node);
  if (expression?.type === 'TemplateLiteral' && expression.expressions.length === 0) {
    return expression.quasis[0]?.value.cooked ?? undefined;
  }
  return getStringLiteral(expression);
}

/** Key names in a `Config` path: `"KEY"` or `["group", "KEY"]`. */
function pathKeys(node: ESTree.Node | undefined): string[] {
  const expression = unwrapExpression(node);
  if (expression?.type === 'ArrayExpression') {
    return expression.elements.flatMap((element) => {
      const key = element === null ? undefined : staticString(element);
      return key === undefined ? [] : [key];
    });
  }
  const key = staticString(expression);
  return key === undefined ? [] : [key];
}

/** True when the schema of `Config.schema(schema, key)` is already `Redacted`. */
function isRedactedSchema(node: ESTree.Node | undefined): boolean {
  const expression = unwrapExpression(node);
  if (expression?.type !== 'CallExpression') {
    return false;
  }
  const callee = unwrapExpression(expression.callee);
  return (
    (callee?.type === 'MemberExpression' &&
      callee.property.type === 'Identifier' &&
      callee.property.name.startsWith('Redacted')) ||
    (callee?.type === 'Identifier' && callee.name.startsWith('Redacted'))
  );
}

export const requireRedactedSecretConfig: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require Config.Redacted for a config key whose name looks like a secret (key, token, password)',
    },
    messages: {
      secret: agentDiagnostic({
        problem:
          '`{{api}}` reads `{{key}}` as a plain string. The name says that the value is a secret.',
        why: 'A plain string shows in logs, traces, error messages, and `console.log` output. `Redacted` shows `<redacted>` in all of these places. You must call `Redacted.value` to read it, so each use of the secret is easy to find.',
        fix: 'Write `Config.Redacted("{{key}}")`. For a schema, write `Config.schema(Schema.Redacted(Schema.String), "{{key}}")`. Call `Redacted.value(secret)` only at the place that sends the value.',
        avoid:
          'Do not call `Redacted.value` right after you read the config. Do not rename the key to hide it. Do not disable the rule.',
      }),
    },
    schema: [SECRET_OPTION_SCHEMA],
    defaultOptions: [{ allow: [], pattern: DEFAULT_SECRET_PATTERN }],
  },
  createOnce(context) {
    let refs: ModuleRefs;
    let pattern: RegExp;

    return {
      before() {
        if (shouldSkipEffectStyleFile(context)) {
          return false;
        }
        refs = collectModuleRefs(context.sourceCode.ast, CONFIG_MODULE);
        const source = stringField(objectOptionAt(context, 0), 'pattern', DEFAULT_SECRET_PATTERN);
        pattern = new RegExp(source, 'iu');
      },
      CallExpression(node) {
        const name = moduleMemberName(node.callee, refs, CONFIG_MODULE);
        let keys: string[];
        if (name !== undefined && PLAIN_STRING_CONFIGS.includes(name)) {
          keys = pathKeys(getCallArgument(node, 0));
        } else if (name === 'schema' && !isRedactedSchema(getCallArgument(node, 0))) {
          keys = pathKeys(getCallArgument(node, 1));
        } else {
          return;
        }
        const key = keys.find((entry) => pattern.test(entry));
        if (key === undefined) {
          return;
        }
        context.report({ messageId: 'secret', node, data: { api: `Config.${name}`, key } });
      },
    };
  },
});
