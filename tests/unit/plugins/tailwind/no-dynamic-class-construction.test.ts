import { noDynamicClassConstructionName } from '../../../../src/plugins/tailwind/rules/no-dynamic-class-construction.ts';
import { invalidWith, validWith } from '../../lib/cases.ts';
import { runTailwindRule } from './harness.ts';

function dynamic(fragment: string) {
  return { messageId: 'dynamic' as const, data: { fragment } };
}

runTailwindRule(
  noDynamicClassConstructionName,
  {
    valid: [
      { code: '<div className={`${base} flex`} />;' },
      { code: '<div className={`flex ${active ? "bg-red-500" : "bg-blue-500"}`} />;' },
      { code: '<div className={`icon-${name}`} />;' },
      { code: '<div className={`${prefix}-${suffix}`} />;' },
      { code: '<div key={`bg-${notch.index}`} id={`text-${id}`} />;' },
      { code: 'const key = `bg-${hue}-500`;' },
      { code: 'const id = format(`p-${n}`);' },
      validWith('<div className={`bg-${hue}-500`} />;', { filename: 'card.stories.tsx' }),
      validWith('<div className={`bg-${hue}-500`} />;', {
        filename: 'src/legacy/card.tsx',
        options: [{ allow: ['src/legacy/'] }],
      }),
      validWith('<div tw={`bg-${hue}-500`} />;', { options: [{ attributes: ['className'] }] }),
    ],
    invalid: [
      invalidWith({
        code: '<div className={`flex bg-${hue}-500`} />;',
        errors: [dynamic('bg-')],
      }),
      invalidWith({
        code: '<div class={`hover:text-${tone}`} />;',
        errors: [dynamic('hover:text-')],
      }),
      invalidWith({
        code: '<div className={cn("flex", `-mt-${gap}`, `w-[${width}px]`)} />;',
        errors: [dynamic('-mt-'), dynamic('w-[')],
      }),
      invalidWith({
        name: 'color family plus value',
        code: 'const card = tv({ base: `bg-red-${shade}` });',
        errors: [dynamic('bg-red-')],
      }),
      invalidWith({
        name: 'ClassName-suffixed attribute',
        code: '<Grid itemClassName={`grid-cols-${columns}`} />;',
        errors: [dynamic('grid-cols-')],
      }),
      invalidWith({
        name: 'custom attribute',
        code: '<div tw={`p-${n}`} />;',
        options: [{ attributes: ['tw'] }],
        errors: [dynamic('p-')],
      }),
    ],
  },
  'tsx',
);
