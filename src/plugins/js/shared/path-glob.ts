/**
 * Glob-lite for file paths with `/` separators: `*` matches inside one
 * segment, `**` matches any number of segments, and `?` matches one character.
 * A pattern matches from the start of the path; begin it with `**` to match
 * at any depth.
 */
const sourceCache = new Map<string, string>();

function globSource(pattern: string): string {
  const cached = sourceCache.get(pattern);
  if (cached !== undefined) return cached;
  let source = '';
  let index = 0;
  while (index < pattern.length) {
    if (pattern.startsWith('**/', index)) {
      source += '(?:[^/]+/)*';
      index += 3;
      continue;
    }
    if (pattern.startsWith('**', index)) {
      source += '.*';
      index += 2;
      continue;
    }
    const character = pattern.charAt(index);
    if (character === '*') source += '[^/]*';
    else if (character === '?') source += '[^/]';
    else source += character.replaceAll(/[.+^${}()|[\]\\]/gu, '\\$&');
    index += 1;
  }
  sourceCache.set(pattern, source);
  return source;
}

function trimDirectory(pattern: string): string {
  return pattern.replace(/^\.\//u, '').replace(/\/+$/u, '');
}

/** Reports whether the whole `path` matches `pattern`. */
export function matchesGlob(path: string, pattern: string): boolean {
  return new RegExp(`^${globSource(trimDirectory(pattern))}$`, 'u').test(path);
}

/**
 * If `path` is inside a directory that matches `root`, return the rest of the
 * path after that directory (`services/a.service.ts`). Otherwise return `null`.
 */
export function pathUnderRoot(path: string, root: string): string | null {
  const match = new RegExp(`^${globSource(trimDirectory(root))}/(.+)$`, 'u').exec(path);
  return match?.[1] ?? null;
}
