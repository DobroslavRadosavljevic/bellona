import { noMultiComponentFilesName } from '../../../../src/plugins/react/rules/no-multi-component-files.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runReactRule } from './harness.ts';

runReactRule(noMultiComponentFilesName, {
  valid: [
    validWith('function UserCard() {\n  function UserBadge() { return null; }\n  return null;\n}', {
      filename: 'user-card.tsx',
    }),
    validWith(
      'function UserCard() { return null; }\nfunction UserCardProvider() { return null; }',
      { filename: 'user-card.tsx' },
    ),
    validWith('function UserCard() { return null; }\nfunction UserCardContext() { return null; }', {
      filename: 'user-card.tsx',
    }),
    validWith('const UserCard = memo(() => null);', { filename: 'user-card.tsx' }),
    validWith(
      'function DataGridRows(props: DataGridRowsProps) { return null; }\nexport const DataGridRowsMemo = memo(DataGridRows, (previous, next) => previous.rows === next.rows);',
      { filename: 'data-grid-rows.tsx' },
    ),
    validWith(
      'function DataGridRows() { return null; }\nexport const DataGridRowsMemo = React.memo(DataGridRows, function areEqual(a, b) { return a === b; });\nexport const DataGridRowsRef = forwardRef(DataGridRows);',
      { filename: 'data-grid-rows.tsx' },
    ),
    validWith('export const UserCard = memo(function UserCard() { return null; });', {
      filename: 'user-card.tsx',
    }),
    validWith(
      'export function UserList() {\n  return items.map(() => {\n    function UserRow() { return null; }\n    return null;\n  });\n}',
      { filename: 'user-list.tsx' },
    ),
    validWith(
      'export default () => {\n  const UserRow = () => null;\n  const UserBadge = () => null;\n  return null;\n};',
      { filename: 'user-list.tsx' },
    ),
    validWith('function UserCard() { return null; }\nfunction UserBadge() { return null; }', {
      filename: 'user-card.test.tsx',
    }),
    validWith('function UserCard() { return null; }\nfunction UserBadge() { return null; }', {
      filename: 'user-card.tsx',
      options: [{ allow: ['user-card.tsx'] }],
    }),
  ],
  invalid: [
    invalidWith({
      name: 'two inline memo components still count as two',
      filename: 'user-card.tsx',
      code: 'const UserCard = memo(function UserCard() { return null; });\nconst UserBadge = memo(() => null, (a, b) => a === b);',
      errors: [error('multiple')],
    }),
    invalidWith({
      filename: 'user-card.tsx',
      code: 'function UserCard() { return null; }\nfunction UserCardImpl() { return null; }',
      errors: [error('multiple')],
    }),
    invalidWith({
      filename: 'user-card.tsx',
      code: 'function UserCard() { return null; }\nfunction UserBadge() { return null; }',
      errors: [error('multiple')],
    }),
    invalidWith({
      filename: 'user-card.tsx',
      code: 'const UserCard = () => null;\nconst UserBadge = () => null;',
      errors: [error('multiple')],
    }),
    invalidWith({
      filename: 'user-card.tsx',
      code: 'const UserCard = memo(() => null);\nconst UserBadge = memo(() => null);',
      errors: [error('multiple')],
    }),
    invalidWith({
      filename: 'user-card.tsx',
      code: 'function UserCard() { return null; }\nconst UserBadge = forwardRef(() => null);',
      errors: [error('multiple')],
    }),
  ],
});
