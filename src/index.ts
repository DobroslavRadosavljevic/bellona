/**
 * Oxlint `jsPlugins` specifiers. Each subpath is a separate plugin; rules stay
 * off until the consumer enables them by id (`bl-<plugin>/<rule>`).
 */
export const plugins = {
  js: 'bellona/js',
  react: 'bellona/react',
  baseUi: 'bellona/base-ui',
  zod: 'bellona/zod',
  tanstackRouter: 'bellona/tanstack-router',
  elysia: 'bellona/elysia',
  effect: 'bellona/effect',
} satisfies Record<string, `bellona/${string}`>;

export type BellonaPluginSpecifier = (typeof plugins)[keyof typeof plugins];
