import { describe, expect, it } from 'vitest';

import baseUi from '../../../../src/plugins/base-ui/index.ts';

describe('base-ui plugin', () => {
  it('registers every Base UI rule under a base-ui- id', () => {
    expect(Object.keys(baseUi.rules)).toEqual(['base-ui-require-native-button-with-render']);
  });
});
