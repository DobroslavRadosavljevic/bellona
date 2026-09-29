import { noNativeHtmlName } from '../../../../src/plugins/react/rules/no-native-html.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runReactRule } from './harness.ts';

const tsx = 'file.tsx';

const kitReplacements = {
  input: { component: 'Input', from: '@kuzenbo/ui/input' },
  textarea: { component: 'Textarea', from: '@kuzenbo/ui/textarea' },
  table: { component: 'Table', from: '@kuzenbo/ui/table' },
  tr: { component: 'TableRow', from: '@kuzenbo/ui/table' },
  td: { component: 'TableCell', from: '@kuzenbo/ui/table' },
};

const kitOptions = [{ replacements: kitReplacements }];

runReactRule(noNativeHtmlName, {
  valid: [
    validWith('const el = <Box />;', { filename: tsx }),
    validWith('const el = <Button onClick={() => {}} />;', { filename: 'file.jsx' }),
    validWith('const el = <Foo.Bar />;', { filename: tsx }),
    validWith("const el = <div className='flex' />;", { filename: tsx }),
    validWith('const el = <span>text</span>;', { filename: tsx }),
    validWith('const el = <p>ok</p>;', { filename: tsx }),
    validWith("const el = <a href='/'>Home</a>;", { filename: tsx }),
    validWith('const el = <h1>Title</h1>;', { filename: tsx }),
    validWith('const el = <Typeset><h1>Title</h1><p>Body</p></Typeset>;', {
      filename: tsx,
      options: [{ tags: ['h1', 'p'] }],
    }),
    validWith('const el = <div className="typeset"><h1>Title</h1><p>Body</p></div>;', {
      filename: tsx,
      options: [{ tags: ['h1', 'p'] }],
    }),
    validWith('const el = <div data-slot="typeset"><p>Body</p></div>;', {
      filename: tsx,
      options: [{ tags: ['p'] }],
    }),
    validWith('const el = <ul><li>One</li></ul>;', { filename: tsx }),
    validWith('const el = <button />;', { filename: tsx, options: [{ tags: [] }] }),
    validWith('const el = <button />;', { filename: tsx, options: [{ tags: ['a'] }] }),
    validWith(
      'const el = <input aria-hidden="true" name={name} readOnly type="hidden" value={value} />;',
      { filename: 'rating.tsx', options: kitOptions },
    ),
    validWith("const el = <input type={'hidden'} name='token' />;", { filename: tsx }),
    validWith(
      'export function Input({ className, ...props }: InputProps) {\n  return <span><input className={className} {...props} /></span>;\n}',
      { filename: 'src/input/input.tsx', options: kitOptions },
    ),
    validWith('export function TableRow(props: TableRowProps) { return <tr {...props} />; }', {
      filename: 'src/table/table-row.tsx',
      options: kitOptions,
    }),
    validWith(
      'function Table(props: TableProps) { return <div><table {...props} /></div>; }\nexport { Table };',
      { filename: 'src/table/table.tsx', options: kitOptions },
    ),
    validWith('export const TableCell = (props: TableCellProps) => <td {...props} />;', {
      filename: 'src/table/table-cell.tsx',
      options: kitOptions,
    }),
    validWith('export default function Separator() { return <hr />; }', {
      filename: 'separator.tsx',
    }),
    validWith('export function Legacy() { return <table><tr><td /></tr></table>; }', {
      filename: 'src/vendor/legacy-grid.tsx',
      options: [{ replacements: kitReplacements, hostFiles: ['src/vendor/'] }],
    }),
  ],
  invalid: [
    invalidWith({
      code: "const el = <button type='button'>Go</button>;",
      filename: 'file.jsx',
      errors: [error('forbidden')],
    }),
    invalidWith({
      name: 'default hint uses the Base UI or shadcn part name',
      code: 'const el = <><hr /><details><summary>More</summary></details><table><thead><tr><td>1</td></tr></thead></table></>;',
      filename: tsx,
      errors: [
        { messageId: 'forbidden', data: { tag: 'hr', component: 'Separator' } },
        { messageId: 'forbidden', data: { tag: 'details', component: 'Collapsible' } },
        { messageId: 'forbidden', data: { tag: 'summary', component: 'Collapsible.Trigger' } },
        { messageId: 'forbidden', data: { tag: 'table', component: 'Table' } },
        { messageId: 'forbidden', data: { tag: 'thead', component: 'TableHeader' } },
        { messageId: 'forbidden', data: { tag: 'tr', component: 'TableRow' } },
        { messageId: 'forbidden', data: { tag: 'td', component: 'TableCell' } },
      ],
    }),
    invalidWith({
      name: 'a visible input next to a hidden one',
      code: 'const el = <><input type="hidden" name="a" /><input type="text" /><input type={kind} /></>;',
      filename: tsx,
      errors: [error('forbidden'), error('forbidden')],
    }),
    invalidWith({
      name: 'the Input file may not render other native tags',
      code: 'export function Input(props: InputProps) { return <><input {...props} /><button /></>; }',
      filename: 'src/input/input.tsx',
      options: [
        {
          replacements: {
            ...kitReplacements,
            button: { component: 'Button', from: '@kuzenbo/ui/button' },
          },
        },
      ],
      errors: [
        {
          messageId: 'forbiddenFrom',
          data: { tag: 'button', component: 'Button', from: '@kuzenbo/ui/button' },
        },
      ],
    }),
    invalidWith({
      name: 'a local component with the replacement name that is not exported',
      code: 'function TableRow() { return <tr />; }\nexport function Report() { return <TableRow />; }',
      filename: 'report.tsx',
      options: kitOptions,
      errors: [
        {
          messageId: 'forbiddenFrom',
          data: { tag: 'tr', component: 'TableRow', from: '@kuzenbo/ui/table' },
        },
      ],
    }),
    invalidWith({
      name: 'an exported Input does not allow a table',
      code: 'export function Input() { return <table />; }',
      filename: 'src/input/input.tsx',
      options: kitOptions,
      errors: [
        {
          messageId: 'forbiddenFrom',
          data: { tag: 'table', component: 'Table', from: '@kuzenbo/ui/table' },
        },
      ],
    }),
    invalidWith({
      code: "const el = <input type='text' />;",
      filename: tsx,
      errors: [error('forbidden')],
    }),
    invalidWith({
      code: 'const el = <select><option value="1">One</option></select>;',
      filename: tsx,
      errors: [error('forbidden'), error('forbidden')],
    }),
    invalidWith({
      code: 'const el = <h1>Title</h1>;',
      filename: tsx,
      options: [{ tags: ['h1'] }],
      errors: [error('forbidden')],
    }),
    invalidWith({
      code: 'const el = <button />;',
      filename: tsx,
      options: [
        {
          tags: ['button'],
          replacements: { button: { component: 'Button', from: '@ui/button' } },
        },
      ],
      errors: [
        {
          messageId: 'forbiddenFrom',
          data: { tag: 'button', component: 'Button', from: '@ui/button' },
        },
      ],
    }),
    invalidWith({
      code: 'const el = <><Typeset><h1>Title</h1></Typeset><p>Outside</p></>;',
      filename: tsx,
      options: [{ tags: ['h1', 'p'] }],
      errors: [error('forbidden')],
    }),
    invalidWith({
      code: 'const el = <textarea />;',
      filename: tsx,
      errors: [error('forbidden')],
    }),
    invalidWith({
      code: 'const el = <dialog open />;',
      filename: tsx,
      errors: [error('forbidden')],
    }),
    invalidWith({
      code: 'const el = <button />;',
      filename: tsx,
      options: [
        {
          tags: ['button'],
          replacements: { Button: { component: 'UiButton', from: '@ui/button' } },
        },
      ],
      errors: [
        {
          messageId: 'forbiddenFrom',
          data: { tag: 'button', component: 'UiButton', from: '@ui/button' },
        },
      ],
    }),
  ],
});
