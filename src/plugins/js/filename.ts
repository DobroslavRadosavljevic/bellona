export function slash(filename: string): string {
  return filename.replaceAll('\\', '/');
}

export function matchesAllow(filename: string, allow: readonly string[]): boolean {
  if (allow.length === 0) {
    return false;
  }
  const path = slash(filename);
  const base = path.split('/').at(-1) ?? '';
  return allow.some((entry) => {
    const normalized = slash(entry);
    if (path.includes(normalized)) {
      return true;
    }
    const segments = normalized.split('/');
    for (let index = segments.length - 1; index >= 0; index -= 1) {
      const segment = segments[index];
      if (segment !== undefined && segment !== '' && segment.includes('.') && base === segment) {
        return true;
      }
    }
    return false;
  });
}
