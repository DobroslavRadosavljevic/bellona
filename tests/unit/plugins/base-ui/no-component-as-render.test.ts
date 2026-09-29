import { noComponentAsRenderName } from '../../../../src/plugins/base-ui/rules/no-component-as-render.ts';
import { invalidWith, validWith } from '../../lib/cases.ts';
import { runBaseUiRule } from './harness.ts';

const tsx = 'nav-item.tsx';

function componentAsRender(component: string, reference: string) {
  return { messageId: 'componentAsRender' as const, data: { component, reference } };
}

runBaseUiRule(noComponentAsRenderName, {
  valid: [
    validWith('const A = () => <Menu.Item render={<Link to="/" />}>Go</Menu.Item>;', {
      filename: tsx,
    }),
    validWith('const A = () => <Button render={(props) => <Link {...props} to="/" />} />;', {
      filename: tsx,
    }),
    validWith('const A = () => <Button render={renderLink} />;', { filename: tsx }),
    validWith('const A = () => <Button render={buttonElement} />;', { filename: tsx }),
    validWith('const A = () => <Button render={icons.link} />;', { filename: tsx }),
    validWith('const A = () => <div render={Link} />;', { filename: tsx }),
    validWith('const A = () => <Button render />;', { filename: tsx }),
    validWith(
      'const LinkElement = <Link to="/" />;\nconst A = () => <Button render={LinkElement} />;',
      { filename: tsx },
    ),
    validWith('const A = () => <Route path="/" render={Home} />;', {
      filename: tsx,
      options: [{ ignore: ['Route'] }],
    }),
    validWith('const A = () => <Button render={Link} />;', { filename: 'nav-item.test.tsx' }),
    validWith('const A = () => <Button render={Link} />;', {
      filename: 'src/legacy/nav-item.tsx',
      options: [{ allow: ['src/legacy/'] }],
    }),
  ],
  invalid: [
    invalidWith({
      filename: tsx,
      code: 'const A = () => <Button render={Link}>Go</Button>;',
      errors: [componentAsRender('Button', 'Link')],
    }),
    invalidWith({
      filename: tsx,
      code: 'const A = () => <Menu.Item render={Router.Link}>Go</Menu.Item>;',
      errors: [componentAsRender('Menu.Item', 'Link')],
    }),
    invalidWith({
      filename: tsx,
      code: 'const A = () => <DialogTrigger render={AppButton as never} />;',
      errors: [componentAsRender('DialogTrigger', 'AppButton')],
    }),
    invalidWith({
      name: 'a PascalCase render callback is also called as a function',
      filename: tsx,
      code: 'const RenderLink = (props) => <a {...props} />;\nconst A = () => <Tabs.Tab render={RenderLink} />;',
      errors: [componentAsRender('Tabs.Tab', 'RenderLink')],
    }),
  ],
});
