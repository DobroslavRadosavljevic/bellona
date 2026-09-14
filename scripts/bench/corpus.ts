export type CorpusFile = {
  readonly relativePath: string;
  readonly content: string;
};

function jsFile(index: number): string {
  const helpers = Array.from({ length: 8 }, (_, helper) => helper)
    .map(
      (helper) => `export function helper${index}_${helper}(value: number): number {
  return value + ${helper};
}`,
    )
    .join('\n');
  return `export type User${index} = { id: number; name: string };

export function loadUser${index}(user: User${index}): User${index} {
  const next: User${index} = { id: user.id + 1, name: user.name };
  return next;
}

${helpers}
`;
}

function reactFile(index: number): string {
  return `import { useMemo, useState } from 'react';

export type Panel${index}Props = {
  readonly title: string;
};

export function Panel${index}(props: Panel${index}Props) {
  const [open, setOpen] = useState(false);
  const label = useMemo(() => props.title, [props.title]);
  return (
    <section>
      <button type="button" onClick={() => setOpen(!open)}>
        {label}
      </button>
      {open ? <p>{label}</p> : null}
    </section>
  );
}
`;
}

function effectFile(index: number): string {
  return `import { Effect } from 'effect';

export const loadItem${index} = Effect.fn('loadItem${index}')(function* () {
  return yield* Effect.succeed(${index});
});
`;
}

function elysiaFile(index: number): string {
  return `import { Elysia } from 'elysia';

export const item${index}Get = new Elysia({ name: 'item-${index}' }).get('/item/${index}', () => ({
  id: ${index},
}), {
  response: { 200: { type: 'object' } },
});
`;
}

function routerFile(index: number): string {
  return `import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/item/${index}')({
  component: Item${index}Page,
});

function Item${index}Page() {
  return <p>item ${index}</p>;
}
`;
}

function tailwindFile(index: number): string {
  return `export function card${index}(active: boolean): string {
  return active
    ? 'flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm text-white'
    : 'flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-900';
}
`;
}

function zodFile(index: number): string {
  return `import { z } from 'zod';

export const item${index}Schema = z.object({
  id: z.number(),
  name: z.string(),
});
`;
}

function baseUiFile(index: number): string {
  return `import { Button } from '@base-ui/react/button';

export function Action${index}() {
  return (
    <Button nativeButton={true} render={<button type="button" />}>
      Save ${index}
    </Button>
  );
}
`;
}

export function buildCorpusFiles(scale: number): readonly CorpusFile[] {
  const files: CorpusFile[] = [];
  for (let index = 0; index < scale; index += 1) {
    files.push({ relativePath: `js/module-${index}.ts`, content: jsFile(index) });
    files.push({ relativePath: `react/Panel${index}.tsx`, content: reactFile(index) });
    files.push({ relativePath: `effect/load-item-${index}.ts`, content: effectFile(index) });
    files.push({
      relativePath: `elysia/routes/item-${index}-get.ts`,
      content: elysiaFile(index),
    });
    files.push({
      relativePath: `tanstack-router/routes/item-${index}.tsx`,
      content: routerFile(index),
    });
    files.push({ relativePath: `tailwind/card-${index}.ts`, content: tailwindFile(index) });
    files.push({ relativePath: `zod/item-${index}-schema.ts`, content: zodFile(index) });
    files.push({ relativePath: `base-ui/Action${index}.tsx`, content: baseUiFile(index) });
  }
  return files;
}

export type CorpusStats = {
  readonly files: number;
  readonly bytes: number;
};

export function corpusStats(files: readonly CorpusFile[]): CorpusStats {
  let bytes = 0;
  for (const file of files) {
    bytes += file.content.length;
  }
  const stats: CorpusStats = { files: files.length, bytes };
  return stats;
}
