/**
 * Oxlint `jsPlugins` specifiers. Each subpath is a separate plugin; rules stay
 * off until the consumer enables them by id (`<plugin-name>/<rule>`).
 */
export const plugins = {
  js: 'vamana/js',
  react: 'vamana/react',
  baseUi: 'vamana/base-ui',
  zod: 'vamana/zod',
  tanstackRouter: 'vamana/tanstack-router',
  elysia: 'vamana/elysia',
  effect: 'vamana/effect',
} satisfies Record<string, `vamana/${string}`>;

export type VamanaPluginSpecifier = (typeof plugins)[keyof typeof plugins];
