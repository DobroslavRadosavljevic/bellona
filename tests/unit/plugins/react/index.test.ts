import { describe, expect, it } from 'vitest';

import react from '../../../../src/plugins/react/index.ts';

describe('react plugin', () => {
  it('registers every React rule under a react- id', () => {
    expect(Object.keys(react.rules)).toEqual([
      'component-file-name-match',
      'component-props-type',
      'hook-file-name-match',
      'no-jsx-iife-in-components',
      'no-jsx-local-constants-in-components',
      'no-jsx-module-constants',
      'no-jsx-variable-reassignment-in-components',
      'no-multi-component-files',
      'no-multi-hook-files',
      'no-native-html',
      'no-namespace',
      'no-render-helper-functions-in-components',
    ]);
  });
});
