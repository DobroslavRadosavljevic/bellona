import type { CreateOnceRule, ESTree } from '@oxlint/plugins';

import { agentDiagnostic } from '../../../lib/lint-message.ts';
import { bnRuleName, defineBellonaRule } from '../../../lib/rule.ts';
import { objectProperties, propertyName, resolveValue, variableFor } from '../ast.ts';
import { optionObjects } from '../option-objects.ts';
import { DEFAULT_OPTIONS, OPTIONS_SCHEMA, skipFile } from '../options.ts';

export const noDeprecatedQueryContextName = bnRuleName('no-deprecated-query-context');
export const noDeprecatedQueryContext: CreateOnceRule = defineBellonaRule({
  meta: {
    type: 'problem',
    docs: { description: 'Disallow deprecated direction on the query function context' },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: DEFAULT_OPTIONS,
    messages: {
      direction: agentDiagnostic({
        problem: 'QueryFunctionContext.direction is deprecated.',
        why: 'Direction must be part of the page value when the query function needs it.',
        fix: 'Put direction in pageParam and return it from the page selection callbacks.',
        avoid: 'Do not rename unrelated direction fields.',
      }),
    },
  },
  createOnce(context) {
    let functions: Set<ESTree.Node>;
    let members: ESTree.MemberExpression[];
    let declarations: ESTree.VariableDeclarator[];
    function collect(node: ESTree.CallExpression | ESTree.NewExpression): void {
      for (const options of optionObjects(context, node)) {
        if (options.kind !== 'query' && options.kind !== 'observer') continue;
        for (const property of objectProperties(context.sourceCode, options.node)) {
          if (propertyName(property.key, property.computed) !== 'queryFn') continue;
          const fn = resolveValue(context.sourceCode, property.value);
          if (
            fn?.type === 'ArrowFunctionExpression' ||
            fn?.type === 'FunctionExpression' ||
            fn?.type === 'FunctionDeclaration'
          )
            functions.add(fn);
        }
      }
    }
    return {
      before() {
        functions = new Set();
        members = [];
        declarations = [];
        if (skipFile(context)) return false;
      },
      CallExpression: collect,
      NewExpression: collect,
      MemberExpression(node) {
        members.push(node);
      },
      VariableDeclarator(node) {
        declarations.push(node);
      },
      'Program:exit'() {
        function report(node: ESTree.Node): void {
          context.report({ node, messageId: 'direction' });
        }
        function checkPattern(node: ESTree.Node): void {
          if (node.type !== 'ObjectPattern') return;
          for (const property of node.properties)
            if (
              property.type === 'Property' &&
              propertyName(property.key, property.computed) === 'direction'
            )
              report(property.key);
        }
        for (const fn of functions) {
          if (
            fn.type !== 'ArrowFunctionExpression' &&
            fn.type !== 'FunctionExpression' &&
            fn.type !== 'FunctionDeclaration'
          )
            continue;
          const param = fn.params[0];
          if (param === undefined) continue;
          checkPattern(param.type === 'AssignmentPattern' ? param.left : param);
          if (param.type !== 'Identifier') continue;
          const variable = variableFor(context.sourceCode, param);
          if (variable === undefined) continue;
          for (const member of members)
            if (
              propertyName(member.property, member.computed) === 'direction' &&
              variableFor(context.sourceCode, member.object) === variable
            )
              report(member.property);
          for (const declaration of declarations)
            if (
              declaration.init != null &&
              variableFor(context.sourceCode, declaration.init) === variable
            )
              checkPattern(declaration.id);
        }
      },
    };
  },
});
