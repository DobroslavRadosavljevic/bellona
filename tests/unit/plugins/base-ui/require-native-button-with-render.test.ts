import { requireNativeButtonWithRenderName } from '../../../../src/plugins/base-ui/rules/require-native-button-with-render.ts';
import { invalidWith, validWith } from '../../lib/cases.ts';
import { runBaseUiRule } from './harness.ts';

const tsx = 'file.tsx';

runBaseUiRule(requireNativeButtonWithRenderName, {
  valid: [
    validWith('const A = () => <Button>Save</Button>', { filename: tsx }),
    validWith('const A = () => <Button render={<button type="button" />}>Save</Button>', {
      filename: tsx,
    }),
    validWith(
      'const A = () => <PopoverTrigger render={<Button variant="outline" />}>Open</PopoverTrigger>',
      { filename: tsx },
    ),
    validWith('const A = () => <DialogTrigger render={<Button />}>Open</DialogTrigger>', {
      filename: tsx,
    }),
    validWith(
      'const A = () => <Button nativeButton render={<button type="button" />}>Save</Button>',
      { filename: tsx },
    ),
    validWith('const A = () => <Button nativeButton={false} render={<Link to="/" />}>Go</Button>', {
      filename: tsx,
    }),
    validWith('const A = () => <Button nativeButton={false} render={<a href="/" />}>Go</Button>', {
      filename: tsx,
    }),
    validWith('const A = () => <DropdownMenuItem render={<Link to="/" />}>Go</DropdownMenuItem>', {
      filename: tsx,
    }),
    validWith(
      'const A = () => <DropdownMenuTrigger render={<SidebarMenuButton />}>Open</DropdownMenuTrigger>',
      { filename: tsx },
    ),
    validWith(
      'const A = () => <PopoverTrigger render={<MyButton size="md" />}>Open</PopoverTrigger>',
      { filename: tsx },
    ),
    validWith('const A = (host: never) => <Button render={host}>Go</Button>', { filename: tsx }),
    validWith('const A = () => <Button render={<Link to="/" />}>Go</Button>', {
      filename: tsx,
      options: [{ components: ['DialogTrigger'] }],
    }),
    validWith(
      'const A = () => <Button nativeButton={false} render={(props) => <Link {...props} to="/" />}>Go</Button>',
      { filename: tsx },
    ),
    validWith(
      'const A = () => <TabsTab nativeButton={false} render={<Link to="/overview" />} value="overview">Overview</TabsTab>',
      { filename: tsx },
    ),
  ],
  invalid: [
    invalidWith({
      filename: tsx,
      code: 'const A = () => <Button render={<Link to="/" />}>Go</Button>',
      errors: [{ messageId: 'requireFalse', data: { component: 'Button' } }],
    }),
    invalidWith({
      filename: tsx,
      code: 'const A = () => <Button render={<a href="/" />}>Go</Button>',
      errors: [{ messageId: 'requireFalse', data: { component: 'Button' } }],
    }),
    invalidWith({
      filename: tsx,
      code: 'const A = () => <Button render={<div />}>Go</Button>',
      errors: [{ messageId: 'requireFalse', data: { component: 'Button' } }],
    }),
    invalidWith({
      filename: tsx,
      code: 'const A = () => <Button nativeButton={true} render={<Link to="/" />}>Go</Button>',
      errors: [{ messageId: 'requireFalse', data: { component: 'Button' } }],
    }),
    invalidWith({
      filename: tsx,
      code: 'const A = () => <TabsTab render={<Link to="/overview" />} value="overview">Overview</TabsTab>',
      errors: [{ messageId: 'requireFalse', data: { component: 'TabsTab' } }],
    }),
    invalidWith({
      filename: tsx,
      code: 'const A = () => <PopoverTrigger nativeButton={false} render={<Button variant="outline" />}>Open</PopoverTrigger>',
      errors: [{ messageId: 'requireTrue', data: { component: 'PopoverTrigger' } }],
    }),
    invalidWith({
      filename: tsx,
      code: 'const A = () => <DropdownMenuTrigger nativeButton={false} render={<SidebarMenuButton />}>Open</DropdownMenuTrigger>',
      errors: [{ messageId: 'requireTrue', data: { component: 'DropdownMenuTrigger' } }],
    }),
    invalidWith({
      filename: tsx,
      code: 'const A = (host: never) => <Button render={host}>Go</Button>',
      options: [{ requireExplicitWhenUnknown: true }],
      errors: [{ messageId: 'requireExplicit', data: { component: 'Button' } }],
    }),
    invalidWith({
      filename: tsx,
      code: 'const A = () => <Button render={(props) => <Link {...props} to="/" />}>Go</Button>',
      errors: [{ messageId: 'requireFalse', data: { component: 'Button' } }],
    }),
  ],
});
