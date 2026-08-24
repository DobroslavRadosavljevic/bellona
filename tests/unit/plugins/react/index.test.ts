import { describe, expect, it } from 'vitest';

import react from '../../../../src/plugins/react/index.ts';

describe('react plugin', () => {
  it('registers every React rule under a react- id', () => {
    expect(Object.keys(react.rules)).toEqual([
      'react-component-file-name-match',
      'react-hook-file-name-match',
      'react-no-jsx-iife-in-components',
      'react-no-jsx-local-constants-in-components',
      'react-no-jsx-module-constants',
      'react-no-jsx-variable-reassignment-in-components',
      'react-no-multi-component-files',
      'react-no-multi-hook-files',
      'react-no-native-html',
      'react-no-namespace',
      'react-no-render-helper-functions-in-components',
    ]);
  });
});
