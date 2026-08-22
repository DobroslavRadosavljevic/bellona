import { requireNativeButtonWithRenderName } from '../../../../src/plugins/base-ui/rules/require-native-button-with-render.ts';
import { invalidWith, validWith } from '../../lib/cases.ts';
import { runBaseUiRule } from './harness.ts';

const tsx = 'file.tsx';

function requireFalse(component: string) {
  return { messageId: 'requireFalse' as const, data: { component } };
}

function requireTrue(component: string) {
  return { messageId: 'requireTrue' as const, data: { component } };
}

function requireExplicit(component: string) {
  return { messageId: 'requireExplicit' as const, data: { component } };
}

runBaseUiRule(requireNativeButtonWithRenderName, {
  valid: [
    validWith('const A = () => <Button>Save</Button>', { filename: tsx }),
    validWith('const A = () => <Dialog.Trigger>Open</Dialog.Trigger>', { filename: tsx }),
    validWith('const A = () => <Tabs.Tab value="overview">Overview</Tabs.Tab>', { filename: tsx }),
    validWith('const A = () => <Checkbox.Root />', { filename: tsx }),
    validWith('const A = () => <Menu.Item>Copy</Menu.Item>', { filename: tsx }),
    validWith('const A = () => <ContextMenu.Trigger>Area</ContextMenu.Trigger>', { filename: tsx }),
    validWith('const A = () => <Tooltip.Trigger render={<span />}>Hint</Tooltip.Trigger>', {
      filename: tsx,
    }),
    validWith('const A = () => <Menu.LinkItem href="/">Go</Menu.LinkItem>', { filename: tsx }),
    validWith('const A = () => <Button render={<button type="button" />}>Save</Button>', {
      filename: tsx,
    }),
    validWith(
      'const A = () => <Button nativeButton render={<button type="button" />}>Save</Button>',
      {
        filename: tsx,
      },
    ),
    validWith(
      'const A = () => <Button nativeButton={true} render={<button type="button" />}>Save</Button>',
      { filename: tsx },
    ),
    validWith(
      'const A = () => <Popover.Trigger render={<Button variant="outline" />}>Open</Popover.Trigger>',
      { filename: tsx },
    ),
    validWith('const A = () => <Dialog.Trigger render={<Button />}>Open</Dialog.Trigger>', {
      filename: tsx,
    }),
    validWith(
      'const A = () => <Menu.Trigger render={<MyButton size="md" />}>Open menu</Menu.Trigger>',
      { filename: tsx },
    ),
    validWith(
      'const A = () => <Tabs.Tab nativeButton={false} render={<Link href="/overview" />} value="overview">Overview</Tabs.Tab>',
      { filename: tsx },
    ),
    validWith('const A = () => <Button nativeButton={false} render={<Link to="/" />}>Go</Button>', {
      filename: tsx,
    }),
    validWith('const A = () => <Button nativeButton={false} render={<a href="/" />}>Go</Button>', {
      filename: tsx,
    }),
    validWith('const A = () => <Button nativeButton={false} render={<div />}>Go</Button>', {
      filename: tsx,
    }),
    validWith('const A = () => <Button nativeButton={false} render={<><span /></>}>Go</Button>', {
      filename: tsx,
    }),
    validWith('const A = () => <Menu.Item render={<a href="/" />}>Add to Library</Menu.Item>', {
      filename: tsx,
    }),
    validWith('const A = () => <Menu.Item render={<Link to="/" />}>Go</Menu.Item>', {
      filename: tsx,
    }),
    validWith(
      'const A = () => <Menu.Item nativeButton={false} render={<Link to="/" />}>Go</Menu.Item>',
      { filename: tsx },
    ),
    validWith('const A = () => <Checkbox.Root nativeButton render={<button type="button" />} />', {
      filename: tsx,
    }),
    validWith(
      'const A = () => <Checkbox.Root nativeButton={true} render={<button type="button" />} />',
      { filename: tsx },
    ),
    validWith('const A = () => <Checkbox.Root render={<span />} />', { filename: tsx }),
    validWith('const A = () => <Checkbox.Root nativeButton={false} render={<span />} />', {
      filename: tsx,
    }),
    validWith(
      'const A = () => <Menu.Item nativeButton render={<button type="button" />}>Copy</Menu.Item>',
      { filename: tsx },
    ),
    validWith('const A = () => <Menu.Trigger render={<SidebarMenuButton />}>Open</Menu.Trigger>', {
      filename: tsx,
    }),
    validWith('const A = () => <Toolbar.Button render={<Menu.Trigger />}>Open</Toolbar.Button>', {
      filename: tsx,
    }),
    validWith(
      'const A = () => <Tooltip.Trigger render={<Dialog.Trigger render={<Menu.Trigger render={<Button />} />} />} />',
      { filename: tsx },
    ),
    validWith('const A = (host: never) => <Button render={host}>Go</Button>', { filename: tsx }),
    validWith('const A = () => <Button render={<Link to="/" />}>Go</Button>', {
      filename: tsx,
      options: [{ components: ['DialogTrigger'], nonNativeButtonComponents: [] }],
    }),
    validWith(
      'const A = () => <Button nativeButton={false} render={(props) => <Link {...props} to="/" />}>Go</Button>',
      { filename: tsx },
    ),
    validWith(
      'const A = () => <Button nativeButton={false} render={(props) => { return <a href="/" {...props} /> }}>Go</Button>',
      { filename: tsx },
    ),
    validWith(
      'const A = () => <Button render={(props) => <button type="button" {...props} />}>Save</Button>',
      { filename: tsx },
    ),
    validWith(
      'const A = () => <Button nativeButton={isLink ? false : true} render={<Link to="/" />}>Go</Button>',
      { filename: tsx },
    ),
    validWith(
      'const A = () => <Button nativeButton={false as const} render={<Link to="/" />}>Go</Button>',
      { filename: tsx },
    ),
    validWith(
      'const A = () => <Button nativeButton={false} render={(<Link to="/" />) as const}>Go</Button>',
      { filename: tsx },
    ),
    validWith(
      'const A = () => <Button nativeButton={false} render={show && <Link to="/" />}>Go</Button>',
      { filename: tsx },
    ),
    validWith(
      'const A = () => <Button nativeButton={false} render={ok ? <Link to="/" /> : <a href="/" />}>Go</Button>',
      { filename: tsx },
    ),
    validWith(
      'const A = () => <Button render={ok ? <Button /> : <button type="button" />}>Save</Button>',
      { filename: tsx },
    ),
    validWith('const A = () => <Button render={<Link to="/" />}>Go</Button>', {
      filename: tsx,
      options: [{ components: [], nonNativeButtonComponents: [] }],
    }),
    validWith(
      'const A = () => <Button nativeButton={false} render={<AppLink to="/" />}>Go</Button>',
      { filename: tsx, options: [{ nonButtonHosts: ['AppLink'] }] },
    ),
    validWith('const A = () => <Dialog.Trigger render={<MyButton />}>Open</Dialog.Trigger>', {
      filename: tsx,
      options: [{ buttonHosts: ['MyButton'] }],
    }),
    validWith('const A = (host: never) => <Button nativeButton={false} render={host}>Go</Button>', {
      filename: tsx,
      options: [{ requireExplicitWhenUnknown: true }],
    }),
    validWith('const A = () => <NumberField.Increment />', { filename: tsx }),
    validWith(
      'const A = () => <Select.Item nativeButton={false} render={<div />} value="a">A</Select.Item>',
      { filename: tsx },
    ),
    validWith('const A = () => <Switch.Root nativeButton render={<button type="button" />} />', {
      filename: tsx,
    }),
    validWith(
      'const A = () => <Accordion.Trigger render={<Button />}>Section</Accordion.Trigger>',
      { filename: tsx },
    ),
    validWith(
      'const A = () => <Drawer.Close nativeButton={false} render={<div />}>Close</Drawer.Close>',
      { filename: tsx },
    ),
    validWith(
      'const A = () => <Combobox.Clear nativeButton={false} render={<span />}>Clear</Combobox.Clear>',
      { filename: tsx },
    ),
    validWith('const A = () => <DialogTrigger render={<Button />}>Open</DialogTrigger>', {
      filename: tsx,
      options: [{ components: ['Dialog.Trigger'], nonNativeButtonComponents: [] }],
    }),
    validWith('const A = () => <Dialog.Trigger render={<Button />}>Open</Dialog.Trigger>', {
      filename: tsx,
      options: [{ components: ['DialogTrigger'], nonNativeButtonComponents: [] }],
    }),
    validWith(
      'const A = () => <Button nativeButton={false as boolean} render={<Link to="/" />}>Go</Button>',
      { filename: tsx },
    ),
    validWith(
      'const A = () => <Button nativeButton={undefined} render={<Link to="/" />}>Go</Button>',
      { filename: tsx },
    ),
    validWith('const A = () => <Toggle nativeButton={false} render={<div />}>On</Toggle>', {
      filename: tsx,
    }),
    validWith('const A = () => <Menu.CheckboxItem render={<div />}>Quiet</Menu.CheckboxItem>', {
      filename: tsx,
    }),
    validWith(
      'const A = () => <Autocomplete.Clear nativeButton={false} render={<span />}>Clear</Autocomplete.Clear>',
      { filename: tsx },
    ),
    validWith('const A = (host: never) => <Button nativeButton={true} render={host}>Go</Button>', {
      filename: tsx,
      options: [{ requireExplicitWhenUnknown: true }],
    }),
    validWith(
      'const A = () => <Button nativeButton={false} render={() => { if (ok) return <Link to="/" />; return <button type="button" /> }}>Go</Button>',
      { filename: tsx },
    ),
    validWith(
      'const A = () => <DropdownMenuTrigger render={<Button />}>Open</DropdownMenuTrigger>',
      {
        filename: tsx,
        options: [{ components: ['DropdownMenuTrigger'], nonNativeButtonComponents: [] }],
      },
    ),
  ],
  invalid: [
    invalidWith({
      name: 'Button + Link needs nativeButton false',
      filename: tsx,
      code: 'const A = () => <Button render={<Link to="/" />}>Go</Button>',
      errors: [requireFalse('Button')],
    }),
    invalidWith({
      name: 'Button + anchor needs nativeButton false',
      filename: tsx,
      code: 'const A = () => <Button render={<a href="/" />}>Go</Button>',
      errors: [requireFalse('Button')],
    }),
    invalidWith({
      name: 'Button + div needs nativeButton false',
      filename: tsx,
      code: 'const A = () => <Button render={<div />}>Go</Button>',
      errors: [requireFalse('Button')],
    }),
    invalidWith({
      name: 'nativeButton true still conflicts with Link',
      filename: tsx,
      code: 'const A = () => <Button nativeButton={true} render={<Link to="/" />}>Go</Button>',
      errors: [requireFalse('Button')],
    }),
    invalidWith({
      name: 'boolean nativeButton still conflicts with Link',
      filename: tsx,
      code: 'const A = () => <Button nativeButton render={<Link to="/" />}>Go</Button>',
      errors: [requireFalse('Button')],
    }),
    invalidWith({
      name: 'docs Tabs.Tab as Link',
      filename: tsx,
      code: 'const A = () => <Tabs.Tab render={<Link href="/overview" />} value="overview">Overview</Tabs.Tab>',
      errors: [requireFalse('Tabs.Tab')],
    }),
    invalidWith({
      name: 'flattened TabsTab as Link',
      filename: tsx,
      code: 'const A = () => <TabsTab render={<Link to="/overview" />} value="overview">Overview</TabsTab>',
      errors: [requireFalse('TabsTab')],
    }),
    invalidWith({
      name: 'Dialog.Trigger as Link',
      filename: tsx,
      code: 'const A = () => <Dialog.Trigger render={<Link to="/" />}>Open</Dialog.Trigger>',
      errors: [requireFalse('Dialog.Trigger')],
    }),
    invalidWith({
      name: 'Menu.Trigger as div',
      filename: tsx,
      code: 'const A = () => <Menu.Trigger render={<div />}>Open</Menu.Trigger>',
      errors: [requireFalse('Menu.Trigger')],
    }),
    invalidWith({
      name: 'Popover.Trigger false with Button host',
      filename: tsx,
      code: 'const A = () => <Popover.Trigger nativeButton={false} render={<Button variant="outline" />}>Open</Popover.Trigger>',
      errors: [requireTrue('Popover.Trigger')],
    }),
    invalidWith({
      name: 'PopoverTrigger false with Button host',
      filename: tsx,
      code: 'const A = () => <PopoverTrigger nativeButton={false} render={<Button variant="outline" />}>Open</PopoverTrigger>',
      errors: [requireTrue('PopoverTrigger')],
    }),
    invalidWith({
      name: 'Menu.Trigger false with SidebarMenuButton',
      filename: tsx,
      code: 'const A = () => <Menu.Trigger nativeButton={false} render={<SidebarMenuButton />}>Open</Menu.Trigger>',
      errors: [requireTrue('Menu.Trigger')],
    }),
    invalidWith({
      name: 'Toolbar.Button false with Menu.Trigger',
      filename: tsx,
      code: 'const A = () => <Toolbar.Button nativeButton={false} render={<Menu.Trigger />}>Open</Toolbar.Button>',
      errors: [requireTrue('Toolbar.Button')],
    }),
    invalidWith({
      name: 'nested Dialog.Trigger is a button host',
      filename: tsx,
      code: 'const A = () => <Tooltip.Trigger nativeButton={false} render={<Dialog.Trigger />}>Open</Tooltip.Trigger>',
      options: [{ components: ['Tooltip.Trigger'] }],
      errors: [requireTrue('Tooltip.Trigger')],
    }),
    invalidWith({
      name: 'unknown host requires an explicit nativeButton',
      filename: tsx,
      code: 'const A = (host: never) => <Button render={host}>Go</Button>',
      options: [{ requireExplicitWhenUnknown: true }],
      errors: [requireExplicit('Button')],
    }),
    invalidWith({
      name: 'function render returning Link',
      filename: tsx,
      code: 'const A = () => <Button render={(props) => <Link {...props} to="/" />}>Go</Button>',
      errors: [requireFalse('Button')],
    }),
    invalidWith({
      name: 'block function render returning anchor',
      filename: tsx,
      code: 'const A = () => <Button render={(props) => { return <a href="/" {...props} /> }}>Go</Button>',
      errors: [requireFalse('Button')],
    }),
    invalidWith({
      name: 'fragment render is not a button',
      filename: tsx,
      code: 'const A = () => <Button render={<><span /></>}>Go</Button>',
      errors: [requireFalse('Button')],
    }),
    invalidWith({
      name: 'logical render with Link',
      filename: tsx,
      code: 'const A = () => <Button render={show && <Link to="/" />}>Go</Button>',
      errors: [requireFalse('Button')],
    }),
    invalidWith({
      name: 'conditional render with two non-button hosts',
      filename: tsx,
      code: 'const A = () => <Button render={ok ? <Link to="/" /> : <a href="/" />}>Go</Button>',
      errors: [requireFalse('Button')],
    }),
    invalidWith({
      name: 'TS as-const Link host',
      filename: tsx,
      code: 'const A = () => <Button render={(<Link to="/" />) as const}>Go</Button>',
      errors: [requireFalse('Button')],
    }),
    invalidWith({
      name: 'parenthesized Link host',
      filename: tsx,
      code: 'const A = () => <Button render={(<Link to="/" />)}>Go</Button>',
      errors: [requireFalse('Button')],
    }),
    invalidWith({
      name: 'Checkbox.Root as button needs nativeButton true',
      filename: tsx,
      code: 'const A = () => <Checkbox.Root render={<button type="button" />} />',
      errors: [requireTrue('Checkbox.Root')],
    }),
    invalidWith({
      name: 'Menu.Item as button needs nativeButton true',
      filename: tsx,
      code: 'const A = () => <Menu.Item render={<button type="button" />}>Copy</Menu.Item>',
      errors: [requireTrue('Menu.Item')],
    }),
    invalidWith({
      name: 'Menu.Item nativeButton false with button host',
      filename: tsx,
      code: 'const A = () => <Menu.Item nativeButton={false} render={<button type="button" />}>Copy</Menu.Item>',
      errors: [requireTrue('Menu.Item')],
    }),
    invalidWith({
      name: 'Checkbox.Root nativeButton true with span host',
      filename: tsx,
      code: 'const A = () => <Checkbox.Root nativeButton render={<span />} />',
      errors: [requireFalse('Checkbox.Root')],
    }),
    invalidWith({
      name: 'Select.Item as button',
      filename: tsx,
      code: 'const A = () => <Select.Item render={<button type="button" />} value="a">A</Select.Item>',
      errors: [requireTrue('Select.Item')],
    }),
    invalidWith({
      name: 'Switch.Root as button',
      filename: tsx,
      code: 'const A = () => <Switch.Root render={<button type="button" />} />',
      errors: [requireTrue('Switch.Root')],
    }),
    invalidWith({
      name: 'Radio.Root as button',
      filename: tsx,
      code: 'const A = () => <Radio.Root render={<button type="button" />} value="a" />',
      errors: [requireTrue('Radio.Root')],
    }),
    invalidWith({
      name: 'Menu.SubmenuTrigger as button',
      filename: tsx,
      code: 'const A = () => <Menu.SubmenuTrigger render={<button type="button" />}>More</Menu.SubmenuTrigger>',
      errors: [requireTrue('Menu.SubmenuTrigger')],
    }),
    invalidWith({
      name: 'NumberField.Increment as div',
      filename: tsx,
      code: 'const A = () => <NumberField.Increment render={<div />}>+</NumberField.Increment>',
      errors: [requireFalse('NumberField.Increment')],
    }),
    invalidWith({
      name: 'Toast.Close as Link',
      filename: tsx,
      code: 'const A = () => <Toast.Close render={<Link to="/" />}>Close</Toast.Close>',
      errors: [requireFalse('Toast.Close')],
    }),
    invalidWith({
      name: 'Drawer.Trigger as anchor',
      filename: tsx,
      code: 'const A = () => <Drawer.Trigger render={<a href="#panel" />}>Open</Drawer.Trigger>',
      errors: [requireFalse('Drawer.Trigger')],
    }),
    invalidWith({
      name: 'AlertDialog.Close as div',
      filename: tsx,
      code: 'const A = () => <AlertDialog.Close render={<div />}>Cancel</AlertDialog.Close>',
      errors: [requireFalse('AlertDialog.Close')],
    }),
    invalidWith({
      name: 'Combobox.Clear as span',
      filename: tsx,
      code: 'const A = () => <Combobox.Clear render={<span />}>Clear</Combobox.Clear>',
      errors: [requireFalse('Combobox.Clear')],
    }),
    invalidWith({
      name: 'custom non-button host option',
      filename: tsx,
      code: 'const A = () => <Button render={<AppLink to="/" />}>Go</Button>',
      options: [{ nonButtonHosts: ['AppLink'] }],
      errors: [requireFalse('Button')],
    }),
    invalidWith({
      name: 'custom button host option',
      filename: tsx,
      code: 'const A = () => <Dialog.Trigger nativeButton={false} render={<MyButton />}>Open</Dialog.Trigger>',
      options: [{ buttonHosts: ['MyButton'] }],
      errors: [requireTrue('Dialog.Trigger')],
    }),
    invalidWith({
      name: 'function returning button on a non-native part',
      filename: tsx,
      code: 'const A = () => <Checkbox.Root render={(props) => <button type="button" {...props} />} />',
      errors: [requireTrue('Checkbox.Root')],
    }),
    invalidWith({
      name: 'Button false with button host',
      filename: tsx,
      code: 'const A = () => <Button nativeButton={false} render={<button type="button" />}>Save</Button>',
      errors: [requireTrue('Button')],
    }),
    invalidWith({
      name: 'dotted option matches flattened JSX',
      filename: tsx,
      code: 'const A = () => <DialogTrigger render={<a href="/" />}>Open</DialogTrigger>',
      options: [{ components: ['Dialog.Trigger'], nonNativeButtonComponents: [] }],
      errors: [requireFalse('DialogTrigger')],
    }),
    invalidWith({
      name: 'flattened option matches dotted JSX',
      filename: tsx,
      code: 'const A = () => <Dialog.Trigger render={<a href="/" />}>Open</Dialog.Trigger>',
      options: [{ components: ['DialogTrigger'], nonNativeButtonComponents: [] }],
      errors: [requireFalse('Dialog.Trigger')],
    }),
    invalidWith({
      name: 'Toggle as div',
      filename: tsx,
      code: 'const A = () => <Toggle render={<div />}>On</Toggle>',
      errors: [requireFalse('Toggle')],
    }),
    invalidWith({
      name: 'Menu.CheckboxItem as button',
      filename: tsx,
      code: 'const A = () => <Menu.CheckboxItem render={<button type="button" />}>Quiet</Menu.CheckboxItem>',
      errors: [requireTrue('Menu.CheckboxItem')],
    }),
    invalidWith({
      name: 'Collapsible.Trigger as span',
      filename: tsx,
      code: 'const A = () => <Collapsible.Trigger render={<span />}>Open</Collapsible.Trigger>',
      errors: [requireFalse('Collapsible.Trigger')],
    }),
    invalidWith({
      name: 'NavigationMenu.Trigger as Link',
      filename: tsx,
      code: 'const A = () => <NavigationMenu.Trigger render={<Link href="/" />}>Start</NavigationMenu.Trigger>',
      errors: [requireFalse('NavigationMenu.Trigger')],
    }),
    invalidWith({
      name: 'Autocomplete.Clear as div',
      filename: tsx,
      code: 'const A = () => <Autocomplete.Clear render={<div />}>Clear</Autocomplete.Clear>',
      errors: [requireFalse('Autocomplete.Clear')],
    }),
    invalidWith({
      name: 'wrapper name via components option',
      filename: tsx,
      code: 'const A = () => <DropdownMenuTrigger render={<Link to="/" />}>Open</DropdownMenuTrigger>',
      options: [{ components: ['DropdownMenuTrigger'], nonNativeButtonComponents: [] }],
      errors: [requireFalse('DropdownMenuTrigger')],
    }),
    invalidWith({
      name: 'buttonHosts wins over nonButtonHosts on the same name',
      filename: tsx,
      code: 'const A = () => <Button nativeButton={false} render={<MyButton />}>Save</Button>',
      options: [{ buttonHosts: ['MyButton'], nonButtonHosts: ['MyButton'] }],
      errors: [requireTrue('Button')],
    }),
    invalidWith({
      name: 'mixed function returns treat a Link branch as non-button',
      filename: tsx,
      code: 'const A = () => <Button render={() => { if (ok) return <Link to="/" />; return <button type="button" /> }}>Go</Button>',
      errors: [requireFalse('Button')],
    }),
  ],
});
