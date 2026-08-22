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
