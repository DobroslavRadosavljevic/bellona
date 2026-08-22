const CLASS_NAMES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function classDeclarations(count: number): string {
  if (count < 0 || count > CLASS_NAMES.length) {
    throw new Error(`classDeclarations count must be 0..${CLASS_NAMES.length}`);
  }
  const parts: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const name = CLASS_NAMES[index];
    if (name === undefined) {
      throw new Error(`Missing class name at index ${index}`);
    }
    parts.push(`class ${name} {}`);
  }
  return parts.join(' ');
}

export function classExpressions(count: number): string {
  const parts: string[] = [];
  for (let index = 0; index < count; index += 1) {
    parts.push(`const c${index} = class {};`);
  }
  return parts.join(' ');
}
