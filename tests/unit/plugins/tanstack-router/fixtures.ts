export const APP_FILENAME = 'src/routes/posts.tsx';

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
