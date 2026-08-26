import type { CreateOnceRule } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getStaticPropertyName, isZStringSchemaExpression, unwrapExpression } from '../ast.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipZodFile } from '../options.ts';

/**
 * Deprecated `z.string()` format methods → Zod 4 top-level factories.
 * ISO date/time methods map to `z.iso.*`. `ip` has no single replacement.
 */
function formatReplacement(method: string): string | undefined {
  switch (method) {
    case 'email':
      return 'z.email()';
    case 'url':
      return 'z.url()';
    case 'httpUrl':
      return 'z.httpUrl()';
    case 'uuid':
    case 'uuidv4':
    case 'uuidv6':
    case 'uuidv7':
      return 'z.uuid()';
    case 'guid':
      return 'z.guid()';
    case 'hostname':
      return 'z.hostname()';
    case 'e164':
      return 'z.e164()';
    case 'emoji':
      return 'z.emoji()';
    case 'base64':
      return 'z.base64()';
    case 'base64url':
      return 'z.base64url()';
    case 'hex':
      return 'z.hex()';
    case 'jwt':
      return 'z.jwt()';
    case 'nanoid':
      return 'z.nanoid()';
    case 'cuid':
      return 'z.cuid()';
    case 'cuid2':
      return 'z.cuid2()';
    case 'ulid':
      return 'z.ulid()';
    case 'ipv4':
      return 'z.ipv4()';
    case 'ipv6':
      return 'z.ipv6()';
    case 'ip':
      return 'z.ipv4() or z.ipv6()';
    case 'mac':
      return 'z.mac()';
    case 'cidrv4':
      return 'z.cidrv4()';
    case 'cidrv6':
      return 'z.cidrv6()';
    case 'creditCard':
      return 'z.creditCard()';
    case 'hash':
      return 'z.hash()';
    case 'datetime':
      return 'z.iso.datetime()';
    case 'date':
      return 'z.iso.date()';
    case 'time':
      return 'z.iso.time()';
    case 'duration':
      return 'z.iso.duration()';
    default:
      return undefined;
  }
}

export const zodModernFormatValidatorsName = bnRuleName('modern-format-validators');

export const zodModernFormatValidators: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer Zod 4 top-level format factories over deprecated z.string() format methods',
    },
    messages: {
      preferTopLevel: agentDiagnostic({
        problem:
          'This uses deprecated Zod 3 string format chaining: `z.string().{{method}}()`. Zod 4 exposes top-level factories.',
        why: 'The chained methods are deprecated. Top-level factories (`z.email()`, `z.iso.datetime()`, …) are the v4 contract.',
        fix: 'Replace `z.string().{{method}}()` with `{{replacement}}`. Keep other refinements on the result if needed.',
        avoid:
          'Do not keep `z.string()` and add `.{{method}}()` again. Do not wrap in `z.string().pipe(...)`. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
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
        if (method === undefined) {
          return;
        }
        const replacement = formatReplacement(method);
        if (replacement === undefined) {
          return;
        }

        const object = unwrapExpression(callee.object);
        if (!isZStringSchemaExpression(object)) {
          return;
        }

        context.report({
          messageId: 'preferTopLevel',
          data: { method, replacement },
          node,
        });
      },
    };
  },
});
