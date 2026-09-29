import type { CreateOnceRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { defineBellonaRule, bnRuleName } from '../../../lib/rule.ts';
import { asExpression, unwrapExpression } from '../ast.ts';
import { isTestFile, matchesAllow } from '../filename.ts';
import { getJsxAttrValue, getJsxName } from '../hosts.ts';
import {
  COMPONENT_AS_RENDER_OPTION_SCHEMA,
  DEFAULT_COMPONENT_AS_RENDER_OPTIONS,
  nameSetHas,
  readAllowList,
  readIgnoredComponents,
} from '../options.ts';

export const noComponentAsRenderName = bnRuleName('no-component-as-render');

const PASCAL_CASE_PATTERN = /^[A-Z]/u;

/**
 * The name Base UI sees on `render={Name}` or `render={Ui.Name}`: the last segment.
 * Base UI warns when that function name starts with an uppercase letter.
 */
function componentReferenceName(node: ESTree.Node | undefined): string | undefined {
  const expression = node?.type === 'Identifier' ? node : unwrapExpression(asExpression(node));
  if (expression?.type === 'Identifier') {
    return PASCAL_CASE_PATTERN.test(expression.name) ? expression.name : undefined;
  }
  if (
    expression?.type === 'MemberExpression' &&
    !expression.computed &&
    expression.property.type === 'Identifier' &&
    PASCAL_CASE_PATTERN.test(expression.property.name)
  ) {
    return expression.property.name;
  }
  return undefined;
}

/** True for `const LinkElement = <Link />`: an element, which is a valid `render` value. */
function isElementInit(node: ESTree.Expression | null | undefined): boolean {
  const init = unwrapExpression(node);
  return init?.type === 'JSXElement' || init?.type === 'JSXFragment';
}

interface Candidate {
  node: ESTree.Node;
  component: string;
  reference: string;
  binding: string | undefined;
}

export const noComponentAsRender: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow a component reference as a Base UI `render` value (`render={Link}`). Pass an element or a render function',
    },
    messages: {
      componentAsRender: agentDiagnostic({
        problem:
          'The `render` prop of `<{{component}}>` gets the component reference `{{reference}}`, not an element.',
        why: 'Base UI calls `render` as a plain function, not as a component. Hooks inside it then run in the Base UI part, which can break the Rules of Hooks. Base UI warns about this in development.',
        fix: 'Pass an element: `render={<{{reference}} />}`. Or pass a render function: `render={(props) => <{{reference}} {...props} />}`.',
        avoid:
          'Do not rename the component to lowercase only to silence the warning. Do not disable the rule.',
      }),
    },
    schema: [COMPONENT_AS_RENDER_OPTION_SCHEMA],
    defaultOptions: DEFAULT_COMPONENT_AS_RENDER_OPTIONS,
  },
  createOnce(context) {
    let ignored: ReadonlySet<string> = new Set();
    const elementBindings = new Set<string>();
    const candidates: Candidate[] = [];

    return {
      before() {
        elementBindings.clear();
        candidates.length = 0;
        const { filename } = context;
        if (isTestFile(filename) || matchesAllow(filename, readAllowList(context))) {
          return false;
        }
        ignored = readIgnoredComponents(context);
      },
      VariableDeclarator(node) {
        if (node.id.type === 'Identifier' && isElementInit(node.init)) {
          elementBindings.add(node.id.name);
        }
      },
      JSXOpeningElement(node) {
        const component = getJsxName(node);
        if (component === undefined || component === component.toLowerCase()) {
          return;
        }
        if (nameSetHas(ignored, component)) {
          return;
        }
        const value = getJsxAttrValue(node, 'render');
        const reference = componentReferenceName(value);
        if (value === undefined || reference === undefined) {
          return;
        }
        candidates.push({
          node: value,
          component,
          reference,
          binding: value.type === 'Identifier' ? value.name : undefined,
        });
      },
      after() {
        for (const candidate of candidates) {
          if (candidate.binding !== undefined && elementBindings.has(candidate.binding)) {
            continue;
          }
          context.report({
            messageId: 'componentAsRender',
            data: { component: candidate.component, reference: candidate.reference },
            node: candidate.node,
          });
        }
      },
    };
  },
});
