export const ZOD_IMPORT = "import { z } from 'zod';\n";
export const ZOD_V4_IMPORT = "import { z } from 'zod/v4';\n";
export const ZOD_MINI_IMPORT = "import * as z from 'zod/mini';\n";

export function withZod(code: string, importLine: string = ZOD_IMPORT): string {
  return `${importLine}${code}`;
}
