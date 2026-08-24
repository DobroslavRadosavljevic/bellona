export function slash(filename: string): string {
  return filename.replaceAll('\\', '/');
}

export function basenameWithoutExtension(filename: string): string {
  const base = slash(filename).split('/').at(-1) ?? '';
  return base.replace(/\.[^.]+$/u, '');
}

export function isTestFile(filename: string): boolean {
  const path = slash(filename);
  return (
    /(?:^|\/)(?:__tests__|test|tests|fixtures)(?:\/|$)/u.test(path) ||
    /\.(?:test|spec|stories)\.[cm]?[jt]sx?$/u.test(path)
  );
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

export function kebabToPascal(kebab: string): string {
  return kebab
    .split('-')
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function isPascalCaseName(value: string): boolean {
  return /^[A-Z][A-Za-z0-9]*$/u.test(value);
}

export function isComponentName(name: string | undefined): boolean {
  return name !== undefined && isPascalCaseName(name);
}

const COMPONENT_HELPER_SUFFIX_PATTERN = /(?:Impl|Provider|Context)$/u;

export function isPrimaryComponentName(name: string | undefined): boolean {
  return name !== undefined && isComponentName(name) && !COMPONENT_HELPER_SUFFIX_PATTERN.test(name);
}

export function isHookName(name: string | undefined): boolean {
  return name !== undefined && /^use[A-Z]/u.test(name);
}

const HOOK_FILE_PATTERN = /^use-[a-z0-9-]+$/u;

export function isHookFile(filename: string): boolean {
  if (isTestFile(filename)) {
    return false;
  }
  const basename = basenameWithoutExtension(filename);
  const path = slash(filename);
  return (
    HOOK_FILE_PATTERN.test(basename) &&
    (path.endsWith('.ts') || path.endsWith('.tsx') || path.endsWith('.js') || path.endsWith('.jsx'))
  );
}

export function hookNameFromBasename(basename: string): string | undefined {
  if (!basename.startsWith('use-')) {
    return undefined;
  }
  const pascalName = kebabToPascal(basename);
  if (!pascalName.startsWith('Use')) {
    return undefined;
  }
  return `use${pascalName.slice(3)}`;
}

export function isJsxFilename(filename: string): boolean {
  return filename.endsWith('.tsx') || filename.endsWith('.jsx');
}

export function isTsxFilename(filename: string): boolean {
  return filename.endsWith('.tsx');
}
