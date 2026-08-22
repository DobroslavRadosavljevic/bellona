import type { Context } from '@oxlint/plugins';

import { integerField, objectOptionAt } from '../../lib/options.ts';

export interface MaxClassesOptions {
  max: number;
}

export const DEFAULT_MAX_CLASSES = 5;

export function readMaxClassesOptions(context: Context): MaxClassesOptions {
  return {
    max: integerField(objectOptionAt(context, 0), 'max', DEFAULT_MAX_CLASSES),
  };
}
