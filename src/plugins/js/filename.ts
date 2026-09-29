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

/** The linted path with `/` separators, relative to the lint working directory. */
export function relativePath(filename: string, cwd: string): string {
  const path = slash(filename);
  const base = slash(cwd).replace(/\/+$/u, '');
  return base !== '' && path.startsWith(`${base}/`) ? path.slice(base.length + 1) : path;
}

const skippedFilePattern =
  /(?:\.(?:test|spec|stories)\.|\.stories-|\.gen\.|\.d\.[cm]?ts$|\/__tests__\/|\/generated\/)/u;

/** Tests, stories, generated files, and declaration files follow their own layout. */
export function isSkippedLayoutFile(path: string): boolean {
  return skippedFilePattern.test(path);
}
