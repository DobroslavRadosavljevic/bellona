import { noForwardRefName } from '../../../../src/plugins/react/rules/no-forward-ref.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runReactRule } from './harness.ts';

const tsx = 'text-input.tsx';

runReactRule(noForwardRefName, {
  valid: [
    validWith(
      'type TextInputProps = ComponentProps<"input">;\nexport function TextInput({ ref, ...props }: TextInputProps) { return <input ref={ref} {...props} />; }',
      { filename: tsx },
    ),
    validWith('import { forwardRef } from "preact/compat";\nconst A = forwardRef(() => null);', {
      filename: tsx,
    }),
    validWith('const A = forwardRef(() => null);', { filename: tsx }),
    validWith('import { forwardRef } from "react";\nconst A = forwardRef(() => null);', {
      filename: 'text-input.test.tsx',
    }),
    validWith('import { forwardRef } from "react";\nconst A = forwardRef(() => null);', {
      filename: 'src/legacy/text-input.tsx',
      options: [{ allow: ['src/legacy/'] }],
    }),
    validWith('const ui = { forwardRef };\nui.forwardRef(() => null);', { filename: tsx }),
  ],
  invalid: [
    invalidWith({
      filename: tsx,
      code: 'import { forwardRef } from "react";\nexport const TextInput = forwardRef<HTMLInputElement, TextInputProps>((props, ref) => null);',
      errors: [error('forwardRef')],
    }),
    invalidWith({
      filename: tsx,
      code: 'import { forwardRef as withRef } from "react";\nexport const TextInput = withRef(() => null);',
      errors: [error('forwardRef')],
    }),
    invalidWith({
      filename: tsx,
      code: 'import * as R from "react";\nexport const TextInput = R.forwardRef(() => null);',
      errors: [error('forwardRef')],
    }),
    invalidWith({
      name: 'UMD React global',
      filename: 'text-input.ts',
      code: 'export const TextInput = React.forwardRef(() => null);',
      errors: [error('forwardRef')],
    }),
    invalidWith({
      filename: tsx,
      code: 'import React from "react";\nexport const TextInput = React.memo(React.forwardRef(() => null));',
      errors: [error('forwardRef')],
    }),
  ],
});
