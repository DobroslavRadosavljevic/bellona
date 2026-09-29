import { preferContextAsProviderName } from '../../../../src/plugins/react/rules/prefer-context-as-provider.ts';
import { invalidWith, validWith } from '../../lib/cases.ts';
import { runReactRule } from './harness.ts';

const tsx = 'theme-root.tsx';

function provider(name: string) {
  return { messageId: 'provider' as const, data: { name } };
}

function providerReference(name: string) {
  return { messageId: 'providerReference' as const, data: { name } };
}

runReactRule(preferContextAsProviderName, {
  valid: [
    validWith('const el = <ThemeContext value={theme}><App /></ThemeContext>;', { filename: tsx }),
    validWith('const el = <Toast.Provider><App /></Toast.Provider>;', { filename: tsx }),
    validWith('const el = <TooltipPrimitive.Provider delay={0} />;', { filename: tsx }),
    validWith('const el = <QueryClientProvider client={client} />;', { filename: tsx }),
    validWith('const el = <Context.Provider value={1} />;', { filename: tsx }),
    validWith('const el = <ThemeContext.Consumer>{render}</ThemeContext.Consumer>;', {
      filename: tsx,
    }),
    validWith('const el = <ThemeContext.Provider value={theme} />;', {
      filename: 'theme-root.test.tsx',
    }),
    validWith('const el = <ThemeContext.Provider value={theme} />;', {
      filename: 'src/legacy/theme-root.tsx',
      options: [{ allow: ['src/legacy/'] }],
    }),
    validWith('const provider = ThemeContext.Provider;', { filename: 'theme-root.ts' }),
    validWith(
      'const ThemeContext = makeStore();\nexport const ThemeProvider = ThemeContext.Provider;',
      {
        filename: 'theme-context.tsx',
      },
    ),
    validWith(
      'import { Toast } from "@base-ui/react/toast";\nexport const ToastProvider = Toast.Provider;',
      {
        filename: 'toast.tsx',
      },
    ),
    validWith('const Context = createContext(null);\nexport const Provider = Context.Provider;', {
      filename: 'context.tsx',
    }),
    validWith(
      'const ThemeContext = createContext(null);\nexport const ThemeProvider = ThemeContext.Provider;',
      { filename: 'theme-context.test.tsx' },
    ),
  ],
  invalid: [
    invalidWith({
      filename: tsx,
      code: 'const el = <ThemeContext.Provider value={theme}><App /></ThemeContext.Provider>;',
      errors: [provider('ThemeContext')],
    }),
    invalidWith({
      name: 'provider read from a same-file createContext',
      filename: 'sparkline-context.tsx',
      code: 'import { createContext } from "react";\nexport const SparklineContext = createContext<SparklineValue | null>(null);\nexport const SparklineProvider = SparklineContext.Provider;',
      errors: [providerReference('SparklineContext')],
    }),
    invalidWith({
      name: 'provider read before the declaration, in a .ts file, with React.createContext',
      filename: 'sparkbar-context.ts',
      code: 'export const providers = [SparkbarContext.Provider];\nconst SparkbarContext = React.createContext(null);',
      errors: [providerReference('SparkbarContext')],
    }),
    invalidWith({
      name: 'provider read from an imported context',
      filename: 'theme-root.tsx',
      code: 'import { ThemeContext } from "./theme-context";\nexport const ThemeProvider = ThemeContext.Provider;',
      errors: [providerReference('ThemeContext')],
    }),
    invalidWith({
      filename: 'theme-root.jsx',
      code: 'const el = <ui.CitationItemContext.Provider value={item} />;',
      errors: [provider('CitationItemContext')],
    }),
  ],
});
