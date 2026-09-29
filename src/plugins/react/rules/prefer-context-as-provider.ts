import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { getCallName, getStaticPropertyName, unwrapExpression } from '../ast.ts';
import { ALLOW_OPTION_SCHEMA, DEFAULT_ALLOW_OPTIONS, shouldSkipReactFile } from '../options.ts';

export const preferContextAsProviderName = bnRuleName('prefer-context-as-provider');

/** `ThemeContext` → true. `Toast`, `TooltipPrimitive`, and bare `Context` → false. */
function isContextName(name: string): boolean {
  return name.length > 'Context'.length && name.endsWith('Context');
}

/** The context name for `<ThemeContext.Provider>` or `<ui.ThemeContext.Provider>`. */
function contextNameOfProvider(name: ESTree.JSXOpeningElement['name']): string | undefined {
  if (name.type !== 'JSXMemberExpression' || name.property.name !== 'Provider') {
    return undefined;
  }
  const { object } = name;
  const objectName = object.type === 'JSXIdentifier' ? object.name : object.property.name;
  return isContextName(objectName) ? objectName : undefined;
}

/** `createContext(…)` or `React.createContext(…)`. */
function isCreateContextCall(node: ESTree.Expression | null | undefined): boolean {
  const init = unwrapExpression(node);
  if (init?.type !== 'CallExpression') {
    return false;
  }
  const name = getCallName(init);
  return name === 'createContext' || name?.endsWith('.createContext') === true;
}

export const preferContextAsProvider: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer `<SomeContext>` over `<SomeContext.Provider>` and `SomeContext.Provider` reads (React 19)',
    },
    messages: {
      provider: agentDiagnostic({
        problem: 'This JSX renders `<{{name}}.Provider>`.',
        why: 'In React 19 a context object is a provider. React plans to deprecate `<Context.Provider>`.',
        fix: 'Render `<{{name}} value={…}>` and close it with `</{{name}}>`. Keep the same `value`.',
        avoid:
          'Do not change components that only end in `Provider` (such as `Toast.Provider`). Do not disable the rule.',
      }),
      providerReference: agentDiagnostic({
        problem:
          'This code reads `{{name}}.Provider` outside JSX (for example `const ThemeProvider = ThemeContext.Provider`).',
        why: 'In React 19 a context object is a provider. React plans to deprecate `Context.Provider`, so this alias will break.',
        fix: 'Use `{{name}}` in place of `{{name}}.Provider` (`export const ThemeProvider = ThemeContext`), or render `<{{name}} value={…}>` directly.',
        avoid: 'Do not keep `.Provider` behind a new alias. Do not disable the rule.',
      }),
    },
    schema: [ALLOW_OPTION_SCHEMA],
    defaultOptions: DEFAULT_ALLOW_OPTIONS,
  },
  createOnce(context) {
    const contextBindings = new Set<string>();
    const providerReads: { node: ESTree.Node; name: string }[] = [];

    return {
      before() {
        contextBindings.clear();
        providerReads.length = 0;
        if (shouldSkipReactFile(context)) {
          return false;
        }
      },
      ImportDeclaration(node) {
        for (const specifier of node.specifiers) {
          if (
            specifier.type !== 'ImportNamespaceSpecifier' &&
            isContextName(specifier.local.name)
          ) {
            contextBindings.add(specifier.local.name);
          }
        }
      },
      VariableDeclarator(node) {
        if (
          node.id.type === 'Identifier' &&
          isContextName(node.id.name) &&
          isCreateContextCall(node.init)
        ) {
          contextBindings.add(node.id.name);
        }
      },
      MemberExpression(node) {
        const object = unwrapExpression(node.object);
        if (
          node.computed ||
          getStaticPropertyName(node.property) !== 'Provider' ||
          object?.type !== 'Identifier' ||
          !isContextName(object.name)
        ) {
          return;
        }
        providerReads.push({ node, name: object.name });
      },
      after() {
        for (const read of providerReads) {
          if (contextBindings.has(read.name)) {
            context.report({
              messageId: 'providerReference',
              data: { name: read.name },
              node: read.node,
            });
          }
        }
      },
      JSXOpeningElement(node) {
        const name = contextNameOfProvider(node.name);
        if (name === undefined) {
          return;
        }
        context.report({ messageId: 'provider', data: { name }, node: node.name });
      },
    };
  },
});
