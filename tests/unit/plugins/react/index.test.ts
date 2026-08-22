import { describe, expect, it } from 'vitest';

import react from '../../../../src/plugins/react/index.ts';

describe('react plugin', () => {
  it('registers every React rule under a vm- id', () => {
    expect(Object.keys(react.rules)).toEqual([
      'vm-component-file-name-match',
      'vm-hook-file-name-match',
      'vm-no-jsx-iife-in-components',
      'vm-no-jsx-local-constants-in-components',
      'vm-no-jsx-module-constants',
      'vm-no-jsx-variable-reassignment-in-components',
      'vm-no-multi-component-files',
      'vm-no-multi-hook-files',
      'vm-no-native-html',
      'vm-no-react-namespace',
      'vm-no-render-helper-functions-in-components',
    ]);
  });
});
