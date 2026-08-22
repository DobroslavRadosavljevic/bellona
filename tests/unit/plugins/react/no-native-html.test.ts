import { noNativeHtmlName } from '../../../../src/plugins/react/rules/no-native-html.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runReactRule } from './harness.ts';

const tsx = 'file.tsx';

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
  ],
  invalid: [
    invalidWith({
      code: "const el = <button type='button'>Go</button>;",
      filename: 'file.jsx',
      errors: [error('forbidden')],
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
  ],
});
