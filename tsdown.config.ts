import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: './src/index.ts',
    js: './src/plugins/js/index.ts',
    react: './src/plugins/react/index.ts',
    'base-ui': './src/plugins/base-ui/index.ts',
    zod: './src/plugins/zod/index.ts',
    'tanstack-router': './src/plugins/tanstack-router/index.ts',
    elysia: './src/plugins/elysia/index.ts',
    effect: './src/plugins/effect/index.ts',
    tailwind: './src/plugins/tailwind/index.ts',
  },
  format: 'esm',
  dts: true,
  platform: 'node',
  outExtensions: () => ({ js: '.js' }),
});
