import { noReactNamespaceName } from '../../../../src/plugins/react/rules/no-react-namespace.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runReactRule } from './harness.ts';

runReactRule(noReactNamespaceName, {
  valid: [
    validWith('import { useState, type MouseEvent } from "react";', { filename: 'file.tsx' }),
    validWith('import { useState, use } from "react";\nconst [x, setX] = useState(0);', {
      filename: 'file.tsx',
    }),
    validWith('import { jsx } from "react/jsx-runtime";', { filename: 'file.tsx' }),
    validWith('import { createRoot } from "react-dom/client";', { filename: 'file.tsx' }),
    validWith('import * as React from "react";', { filename: 'file.test.tsx' }),
    validWith('import * as React from "react";', {
      filename: 'file.tsx',
      options: [{ allow: ['file.tsx'] }],
    }),
  ],
  invalid: [
    invalidWith({
      filename: 'file.tsx',
      code: 'import * as React from "react";',
      errors: [error('namespaceImport')],
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'import React from "react";',
      errors: [error('defaultImport')],
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'import React, { useState } from "react";',
      errors: [error('defaultImport')],
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'import * as React from "react";\nconst x = React.useState(0);',
      errors: [error('namespaceImport'), error('memberAccess')],
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'const x = React.useState(0);',
      errors: [error('memberAccess')],
    }),
    invalidWith({
      filename: 'file.tsx',
      code: 'import * as Runtime from "react/jsx-runtime";',
      errors: [error('namespaceImport')],
    }),
  ],
});

runReactRule(
  noReactNamespaceName,
  {
    valid: [
      validWith('import { type ReactNode } from "react";\ntype T = ReactNode;', {
        filename: 'file.ts',
      }),
    ],
    invalid: [
      invalidWith({
        filename: 'file.ts',
        code: 'import * as React from "react";\ntype E = React.MouseEvent;',
        errors: [error('namespaceImport'), error('typeAccess')],
      }),
      invalidWith({
        filename: 'file.ts',
        code: 'type E = React.ReactNode;',
        errors: [error('typeAccess')],
      }),
    ],
  },
  'ts',
);
