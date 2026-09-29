import { noV3ArbitraryVarName } from '../../../../src/plugins/tailwind/rules/no-v3-arbitrary-var.ts';
import { invalidWith, validWith } from '../../lib/cases.ts';
import { runTailwindRule } from './harness.ts';

function arbitraryVar(token: string, fix: string) {
  return { messageId: 'arbitraryVar' as const, data: { token, fix } };
}

function removedOpacity(token: string, family: string) {
  return { messageId: 'removedOpacity' as const, data: { token, family } };
}

function deprecatedUtility(token: string, fix: string) {
  return { messageId: 'deprecatedUtility' as const, data: { token, fix } };
}

runTailwindRule(
  noV3ArbitraryVarName,
  {
    valid: [
      { code: '<div className="bg-(--brand) w-(--sidebar-width)" />;' },
      { code: '<div className="bg-[var(--brand)] [--gap:4px]" />;' },
      { code: '<div className="shadow-sm rounded outline-none ring shrink-0 grow" />;' },
      { code: '<div className="text-ellipsis box-decoration-clone bg-black/50" />;' },
      { code: '<div key="bg-[--brand]" title="flex-shrink-0" />;' },
      { code: 'const label = "bg-opacity-50";' },
      { code: 'const x = format("bg-[--brand]");' },
      validWith('<div className="bg-[--brand]" />;', { filename: 'card.test.tsx' }),
      validWith('<div className="bg-[--brand]" />;', {
        filename: 'src/legacy/card.tsx',
        options: [{ allow: ['src/legacy/'] }],
      }),
      validWith('const x = merge("bg-[--brand]");', { options: [{ callees: ['cn'] }] }),
    ],
    invalid: [
      invalidWith({
        code: '<div className="flex bg-[--brand]" />;',
        errors: [arbitraryVar('bg-[--brand]', 'bg-(--brand)')],
      }),
      invalidWith({
        name: 'variant, type hint, and opacity keep their place',
        code: '<div className="hover:bg-[color:--brand]/50 w-[--sidebar-width]" />;',
        errors: [
          arbitraryVar('hover:bg-[color:--brand]/50', 'hover:bg-(color:--brand)/50'),
          arbitraryVar('w-[--sidebar-width]', 'w-(--sidebar-width)'),
        ],
      }),
      invalidWith({
        code: '<div class="bg-black bg-opacity-50 ring-opacity-25" />;',
        errors: [removedOpacity('bg-opacity-50', 'bg'), removedOpacity('ring-opacity-25', 'ring')],
      }),
      invalidWith({
        code: '<div className={cn("flex-shrink-0", active && "flex-grow")} />;',
        errors: [
          deprecatedUtility('flex-shrink-0', 'shrink-0'),
          deprecatedUtility('flex-grow', 'grow'),
        ],
      }),
      invalidWith({
        code: 'const title = clsx({ "overflow-ellipsis": true }, ["md:decoration-clone"]);',
        errors: [
          deprecatedUtility('overflow-ellipsis', 'text-ellipsis'),
          deprecatedUtility('md:decoration-clone', 'md:box-decoration-clone'),
        ],
      }),
      invalidWith({
        name: 'tv config values',
        code: 'const card = tv({ base: "text-opacity-80", variants: { tone: { muted: "border-opacity-10" } } });',
        errors: [
          removedOpacity('text-opacity-80', 'text'),
          removedOpacity('border-opacity-10', 'border'),
        ],
      }),
      invalidWith({
        name: 'template literal and ClassName-suffixed attribute',
        code: '<Card contentClassName={`p-2 ${open ? "decoration-slice" : ""} divide-opacity-5`} />;',
        errors: [
          deprecatedUtility('decoration-slice', 'box-decoration-slice'),
          removedOpacity('divide-opacity-5', 'divide'),
        ],
      }),
      invalidWith({
        name: 'nested cn is read one time',
        code: '<div className={cn("placeholder-opacity-50", cn("bg-[--x]"))} />;',
        errors: [
          removedOpacity('placeholder-opacity-50', 'placeholder'),
          arbitraryVar('bg-[--x]', 'bg-(--x)'),
        ],
      }),
      invalidWith({
        name: 'custom callee',
        code: 'const x = merge("bg-[--brand]");',
        options: [{ callees: ['merge'] }],
        errors: [arbitraryVar('bg-[--brand]', 'bg-(--brand)')],
      }),
    ],
  },
  'tsx',
);
