import type { Context } from '@oxlint/plugins';

import { booleanField, integerField, objectOptionAt, stringListField } from '../../lib/options.ts';

export interface MaxClassesOptions {
  max: number;
}

export const DEFAULT_MAX_CLASSES = 5;

export function readMaxClassesOptions(context: Context): MaxClassesOptions {
  return {
    max: integerField(objectOptionAt(context, 0), 'max', DEFAULT_MAX_CLASSES),
  };
}

export interface NoUselessReexportOptions {
  allow: readonly string[];
  allowRenames: boolean;
}

export const DEFAULT_ALLOW_RENAMES = true;

export function readNoUselessReexportOptions(context: Context): NoUselessReexportOptions {
  const object = objectOptionAt(context, 0);
  return {
    allow: stringListField(object, 'allow', []),
    allowRenames: booleanField(object, 'allowRenames', DEFAULT_ALLOW_RENAMES),
  };
}
