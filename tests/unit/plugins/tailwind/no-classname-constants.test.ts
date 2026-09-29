import { noClassnameConstantsName } from '../../../../src/plugins/tailwind/rules/no-classname-constants.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { withTv } from './fixtures.ts';
import { runTailwindRule } from './harness.ts';

const stored = error('storedClassNames');

runTailwindRule(noClassnameConstantsName, {
  valid: [
    { code: 'export const title = "Settings";' },
    { code: 'export const kind = "application/json";' },
    { code: 'const note = "flex your muscles";' },
    { code: 'const docs = "Use flex items-center in the docs";' },
    { code: 'const css = "display: flex";' },
    { code: 'const href = "https://example.com/flex";' },
    { code: 'const role = "end-user top-level";' },
    { code: 'const layout = "flex grid";' },
    { code: 'const position = "relative absolute";' },
    { code: 'const limit = "size-limit";' },
    { code: 'const pair = "bg-primary text-primary-foreground";' },
    { code: 'const note = "Save (draft) now";' },
    { code: 'const version = "v1.2.3 build";' },
    { code: withTv('export const button = tv({ base: "flex items-center text-white" });') },
    {
      code: withTv(
        'const { tv } = createTV({});\nexport const chip = tv({ base: "rounded px-2" });',
      ),
    },
    { code: 'const icon = () => "flex items-center";' },
    validWith('export const lightboxControlClassName = "flex items-center";', {
      filename: 'lightbox.test.ts',
    }),
    validWith('export const lightboxControlClassName = "flex items-center";', {
      filename: 'src/generated/lightbox-control.ts',
      options: [{ allow: ['lightbox-control.ts'] }],
    }),
    validWith('const shared = "flex items-center text-white";', {
      options: [{ minUtilities: 4 }],
    }),
    validWith(
      'import { cva } from "class-variance-authority";\nconst button = cva("flex items-center");',
      {
        options: [{ allowedCallees: ['cva'] }],
      },
    ),
  ],
  invalid: [
    invalidWith({
      code: 'export const lightboxControlClassName = "text-white hover:bg-white/10 hover:text-white data-pressed:bg-white/16 disabled:text-white/40";',
      errors: [stored],
    }),
    invalidWith({
      code: 'const shared = "flex items-center text-white";',
      errors: [stored],
    }),
    invalidWith({
      code: 'const styles = { root: "flex items-center gap-2" };',
      errors: [stored],
    }),
    invalidWith({
      code: 'const parts = ["flex", "items-center", "gap-2"];',
      errors: [stored],
    }),
    invalidWith({
      code: 'const className = `flex items-center ${gap}`;',
      errors: [stored],
    }),
    invalidWith({
      code: 'const className = cn("flex items-center", extra);',
      errors: [stored],
    }),
    invalidWith({
      code: 'const className = "hidden";',
      errors: [stored],
    }),
    invalidWith({
      code: 'import { cva } from "class-variance-authority";\nconst button = cva("flex items-center");',
      errors: [stored],
    }),
    invalidWith({
      code: 'class Host { static lightboxControlClassName = "flex items-center"; }',
      errors: [stored],
    }),
    invalidWith({
      name: 'v4 theme color with opacity and a class-name binding',
      code: 'const headerClassName = "text-xs leading-none text-secondary-foreground/80";',
      errors: [stored],
    }),
    invalidWith({
      name: 'v4 decimal spacing and important suffix',
      code: 'const shared = "flex! gap-1.5 items-center";',
      errors: [stored],
    }),
    invalidWith({
      name: 'v4 CSS variable shorthand',
      code: 'const ghost = { move: "rounded-sm border border-dashed border-(--event-color)/50" };',
      errors: [stored],
    }),
    invalidWith({
      name: 'named group and theme colors',
      code: 'const chip = "group/chip inline-flex items-center bg-secondary text-secondary-foreground";',
      errors: [stored],
    }),
    invalidWith({
      name: 'arbitrary variant with a side border',
      code: 'const footRowBorderClasses = "[&:not(:last-child)>td]:border-b";',
      errors: [stored],
    }),
  ],
});

runTailwindRule(
  noClassnameConstantsName,
  {
    valid: [
      {
        code: 'export function Button() { return <button className="flex items-center text-white" />; }',
      },
      { code: 'const icon = <span className="flex items-center" />;' },
      {
        code: 'function Row({ className }: { className?: string }) { return <div className={className} />; }',
      },
    ],
    invalid: [
      invalidWith({
        code: 'function Card() { const className = "flex items-center"; return <div className={className} />; }',
        errors: [error('localClassNames')],
      }),
      invalidWith({
        name: 'local cn() result inside a component',
        code: 'function Card({ active }: CardProps) {\n  const chipClassName = cn("inline-flex items-center gap-1", active && "bg-accent");\n  return <span className={chipClassName} />;\n}',
        errors: [error('localClassNames')],
      }),
      invalidWith({
        name: 'module-level constant in a component file',
        code: 'const chipClassName = "inline-flex items-center gap-1";\nexport function Card() { return <span className={chipClassName} />; }',
        errors: [stored],
      }),
    ],
  },
  'tsx',
);
