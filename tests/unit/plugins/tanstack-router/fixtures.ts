export const APP_FILENAME = 'src/routes/posts.tsx';

export const LIB_FILENAME = 'src/lib/posts.ts';

export const COLOCATED_LIB_FILENAME = 'src/routes/-lib/posts.ts';

const DEFAULT_IMPORTS = [
  'Link',
  'Navigate',
  'linkOptions',
  'redirect',
  'useLoaderData',
  'useNavigate',
  'useParams',
] as const;

export function routerCode(body: string, names: readonly string[] = DEFAULT_IMPORTS): string {
  return `import { ${names.join(', ')} } from '@tanstack/react-router';\n${body}`;
}

export function routerCodeFrom(module: string, body: string, names: readonly string[]): string {
  return `import { ${names.join(', ')} } from '${module}';\n${body}`;
}

export function fileRouteCode(options: string, extra = ''): string {
  return routerCode(`export const Route = createFileRoute('/posts')({ ${options} })\n${extra}`, [
    'createFileRoute',
    'useSearch',
  ]);
}

export function fileRouteWith(names: readonly string[], options: string, extra = ''): string {
  return routerCode(`export const Route = createFileRoute('/posts')({ ${options} })\n${extra}`, [
    'createFileRoute',
    ...names,
  ]);
}

export function startServerFnCode(body: string, names: readonly string[] = ['notFound']): string {
  return `import { createServerFn } from '@tanstack/react-start';\nimport { ${names.join(', ')} } from '@tanstack/react-router';\n${body}`;
}
