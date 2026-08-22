import { noReactNamespaceName } from '../../../../src/plugins/react/rules/no-react-namespace.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runReactRule } from './harness.ts';

runReactRule(noReactNamespaceName, {
  valid: [
    validWith('import { useState, type MouseEvent } from "react";', { filename: 'file.tsx' }),
    validWith('import { useState } from "react";\nconst [x, setX] = useState(0);', {
      filename: 'file.tsx',
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
      code: 'import * as React from "react";\nconst x = React.useState(0);',
      errors: [error('namespaceImport'), error('memberAccess')],
    }),
  ],
});

runReactRule(
  noReactNamespaceName,
  {
    valid: [],
    invalid: [
      invalidWith({
        filename: 'file.ts',
        code: 'import * as React from "react";\ntype E = React.MouseEvent;',
        errors: [error('namespaceImport'), error('typeAccess')],
      }),
    ],
  },
  'ts',
);
