import { describe, expect, it } from 'vitest';

import {
  classifyJsxHostName,
  DEFAULT_RENDER_HOST_CATALOG,
} from '../../../../src/plugins/base-ui/hosts.ts';
import {
  canonicalComponentName,
  nameSetHas,
  NATIVE_BUTTON_COMPONENTS,
  NON_NATIVE_BUTTON_COMPONENTS,
  toNameSet,
} from '../../../../src/plugins/base-ui/options.ts';

describe('canonicalComponentName', () => {
  it('maps namespaced parts onto flattened wrapper names', () => {
    expect(canonicalComponentName('Dialog.Trigger')).toBe('DialogTrigger');
    expect(canonicalComponentName('Tabs.Tab')).toBe('TabsTab');
    expect(canonicalComponentName('Button')).toBe('Button');
  });
});

describe('nameSetHas', () => {
  it('matches dotted and flattened forms of the same part', () => {
    const names = toNameSet(['Dialog.Trigger', 'Checkbox.Root']);
    expect(nameSetHas(names, 'Dialog.Trigger')).toBe(true);
    expect(nameSetHas(names, 'DialogTrigger')).toBe(true);
    expect(nameSetHas(names, 'Checkbox.Root')).toBe(true);
    expect(nameSetHas(names, 'CheckboxRoot')).toBe(true);
    expect(nameSetHas(names, 'Menu.Trigger')).toBe(false);
  });
});

describe('classifyJsxHostName', () => {
  it('classifies HTML tags by whether they are button', () => {
    expect(classifyJsxHostName('button')).toBe('button');
    expect(classifyJsxHostName('a')).toBe('non-button');
    expect(classifyJsxHostName('div')).toBe('non-button');
    expect(classifyJsxHostName('span')).toBe('non-button');
  });

  it('classifies Base UI native-button parts as button hosts', () => {
    expect(classifyJsxHostName('Dialog.Trigger')).toBe('button');
    expect(classifyJsxHostName('DialogTrigger')).toBe('button');
    expect(classifyJsxHostName('Menu.Trigger')).toBe('button');
    expect(classifyJsxHostName('Toolbar.Button')).toBe('button');
    expect(classifyJsxHostName('Autocomplete.Clear')).toBe('button');
    expect(classifyJsxHostName('SidebarMenuButton')).toBe('button');
  });

  it('classifies Base UI non-native parts and link hosts as non-button', () => {
    expect(classifyJsxHostName('Menu.Item')).toBe('non-button');
    expect(classifyJsxHostName('Checkbox.Root')).toBe('non-button');
    expect(classifyJsxHostName('Link')).toBe('non-button');
    expect(classifyJsxHostName('NavLink')).toBe('non-button');
  });

  it('leaves unknown custom hosts alone', () => {
    expect(classifyJsxHostName('MyButton')).toBe('unknown');
    expect(classifyJsxHostName('ContextMenu.Trigger')).toBe('unknown');
    expect(classifyJsxHostName(undefined)).toBe('unknown');
  });

  it('uses the supplied catalog', () => {
    const catalog = {
      buttonNames: toNameSet(['MyButton']),
      nonButtonNames: toNameSet(['AppLink']),
    };
    expect(classifyJsxHostName('MyButton', catalog)).toBe('button');
    expect(classifyJsxHostName('AppLink', catalog)).toBe('non-button');
    expect(classifyJsxHostName('Link', catalog)).toBe('unknown');
    expect(classifyJsxHostName('button', catalog)).toBe('button');
  });
});

describe('default part lists', () => {
  it('keeps native and non-native part names disjoint', () => {
    const native = new Set(NATIVE_BUTTON_COMPONENTS);
    for (const name of NON_NATIVE_BUTTON_COMPONENTS) {
      expect(native.has(name)).toBe(false);
    }
  });

  it('includes official namespaced parts in the default catalog', () => {
    expect(DEFAULT_RENDER_HOST_CATALOG.buttonNames.has('Dialog.Trigger')).toBe(true);
    expect(DEFAULT_RENDER_HOST_CATALOG.nonButtonNames.has('Menu.Item')).toBe(true);
  });
});
