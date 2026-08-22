import { describe, expect, it } from 'vitest';

import react from '../../../../src/plugins/react/index.ts';

describe('react plugin', () => {
  it('registers every React rule under a bn- id', () => {
    expect(Object.keys(react.rules)).toEqual([
      'bn-component-file-name-match',
      'bn-hook-file-name-match',
      'bn-no-jsx-iife-in-components',
      'bn-no-jsx-local-constants-in-components',
      'bn-no-jsx-module-constants',
      'bn-no-jsx-variable-reassignment-in-components',
      'bn-no-multi-component-files',
      'bn-no-multi-hook-files',
      'bn-no-native-html',
      'bn-no-react-namespace',
      'bn-no-render-helper-functions-in-components',
    ]);
  });
});
