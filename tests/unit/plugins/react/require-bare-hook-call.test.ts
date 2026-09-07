import { requireBareHookCallName } from '../../../../src/plugins/react/rules/require-bare-hook-call.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runReactRule } from './harness.ts';

const notBare = [error('notBare')];

runReactRule(requireBareHookCallName, {
  valid: [
    validWith('const tags = useSomethingTags();', { filename: 'file.tsx' }),
    validWith('let tags = useSomethingTags();', { filename: 'file.tsx' }),
    validWith('var tags = useSomethingTags();', { filename: 'file.tsx' }),
    validWith('export const tags = useSomethingTags();', { filename: 'file.tsx' }),
    validWith('const { items } = useSomethingTags();', { filename: 'file.tsx' }),
    validWith('const [count, setCount] = useState(0);', { filename: 'file.tsx' }),
    validWith('const [count, setCount] = React.useState(0);', { filename: 'file.tsx' }),
    validWith('const value = hooks.useLocaleLoader();', { filename: 'file.tsx' }),
    validWith('const memo = useMemo(() => 1, []);', { filename: 'file.tsx' }),
    validWith('useEffect(() => {}, []);', { filename: 'file.tsx' }),
    validWith('React.useLayoutEffect(() => {}, []);', { filename: 'file.tsx' }),
    validWith('tags = useSomethingTags();', { filename: 'file.tsx' }),
    validWith('tags ??= useSomethingTags();', { filename: 'file.tsx' }),
    validWith('const tags = (useSomethingTags());', { filename: 'file.tsx' }),
    validWith('const tags = ((useSomethingTags()));', { filename: 'file.tsx' }),
    validWith('const tags = useSomethingTags<string[]>();', { filename: 'file.tsx' }),
    validWith('const a = useFoo(), b = 1;', { filename: 'file.tsx' }),
    validWith('const loader = useSomethingTags();\nconst tags = loader?.tags ?? [];', {
      filename: 'file.tsx',
    }),
    validWith('const tags = loadLocale()?.tags ?? [];', { filename: 'file.tsx' }),
    validWith('const value = use()?.ok;', { filename: 'file.tsx' }),
    validWith('const value = userLoader()?.tags;', { filename: 'file.tsx' }),
    validWith('const tags = useSomethingTags()?.tags ?? [];', { filename: 'file.test.tsx' }),
    validWith('const tags = useSomethingTags()?.tags ?? [];', { filename: 'file.spec.tsx' }),
    validWith('const tags = useSomethingTags()?.tags ?? [];', { filename: 'file.stories.tsx' }),
    validWith('const tags = useSomethingTags()?.tags ?? [];', {
      filename: 'src/__tests__/file.tsx',
    }),
    validWith('const tags = useSomethingTags()?.tags ?? [];', {
      filename: 'file.tsx',
      options: [{ allow: ['file.tsx'] }],
    }),
    validWith('const tags = useSomethingTags()?.tags ?? [];', {
      filename: 'src/widgets/tags.tsx',
      options: [{ allow: ['/widgets/'] }],
    }),
  ],
  invalid: [
    invalidWith({
      filename: 'file.tsx',
      code: 'const tags = useSomethingTags()?.tags ?? [];',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'const tags = useSomethingTags().tags;',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'const tags = useSomethingTags()[0];',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'const tags = useSomethingTags() ?? [];',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'const tags = useSomethingTags() || [];',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'const ok = useSomethingTags() && true;',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'const label = useSomethingTags() ? "a" : "b";',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'const first = useItems()?.[0];',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'const run = useHandler()?.();',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'const run = useHandler()();',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'const tags = (useSomethingTags())?.tags;',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'const value = hooks.useLocaleLoader()?.tags;',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'const tags = React.useSomethingTags().tags;',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'const tags = useSomethingTags() as string[];',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'const tags = useSomethingTags() satisfies string[];',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'const tags = useSomethingTags()!;',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'const tags = useSomethingTags()!.length;',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'return useSomethingTags();',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'throw useSomethingTags();',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'if (useSomethingTags()) {}',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'void useSomethingTags();',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'export default useSomethingTags();',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'foo(useSomethingTags());',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'const list = [useSomethingTags()];',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'const copy = { ...useSomethingTags() };',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'const text = `${useSomethingTags()}`;',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'const pair = (useFoo(), useBar());',
      errors: [error('notBare'), error('notBare')],
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'const value = cond ? useFoo() : useBar();',
      errors: [error('notBare'), error('notBare')],
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'const memo = useMemo(() => useFoo(), []);',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'function Card() { return <div>{useSomethingTags()}</div>; }',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'function f(x = useSomethingTags()) {}',
      errors: notBare,
    }),
    invalidWith({
      filename: 'file.jsx',
      code: 'const tags = useSomethingTags().tags;',
      errors: notBare,
    }),
  ],
});

runReactRule(
  requireBareHookCallName,
  {
    valid: [
      validWith('const tags = useSomethingTags();', { filename: 'use-tags.ts' }),
      validWith('const tags = useSomethingTags()?.x;', { filename: 'use-tags.test.ts' }),
    ],
    invalid: [
      invalidWith({
        filename: 'use-tags.ts',
        code: 'const tags = useSomethingTags()?.tags ?? [];',
        errors: notBare,
      }),
      invalidWith({
        filename: 'use-tags.ts',
        code: 'export function useTags() { return useSomethingTags(); }',
        errors: notBare,
      }),
    ],
  },
  'ts',
);
