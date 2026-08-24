export const TV_IMPORT = "import { tv, createTV } from 'tailwind-variants';\n";

export function withTv(body: string): string {
  return `${TV_IMPORT}${body}`;
}
