import { noIifeName } from '../../../../src/plugins/js/rules/no-iife.ts';
import { error, invalidWith } from '../../lib/cases.ts';
import { runJsRule } from './harness.ts';

const iife = error('iife');

runJsRule(noIifeName, {
  valid: [
    { name: 'named call', code: 'function run() { return 1; }\nrun();' },
    { name: 'member call', code: 'const api = { load() {} };\napi.load();' },
    { name: 'fn.call', code: 'function run() {}\nrun.call(null);' },
    {
      name: 'function expression .call is not a direct call',
      code: '(function () {}).call(null);',
    },
    {
      name: 'callback passed but not called',
      code: 'function useMemo<T>(make: () => T, _deps: unknown[]): T { return make(); }\nconst total = useMemo(() => 1 + 2, []);',
    },
    { name: 'arrow stored in a binding', code: 'const make = () => 1;\nmake();' },
    { name: 'class expression with new', code: 'const value = new (class {})();' },
    { name: 'top-level await', code: 'export {};\nawait Promise.resolve(1);' },
  ],
  invalid: [
    invalidWith({ name: 'arrow IIFE', code: '(() => 1)();', errors: [iife] }),
    invalidWith({ name: 'function IIFE', code: '(function () { return 1; })();', errors: [iife] }),
    invalidWith({ name: 'named function IIFE', code: '(function load() {})();', errors: [iife] }),
    invalidWith({
      name: 'function IIFE with the call inside the parentheses',
      code: '(function () {}());',
      errors: [iife],
    }),
    invalidWith({
      name: 'async arrow IIFE',
      code: '(async () => { await 1; })();',
      errors: [iife],
    }),
    invalidWith({
      name: 'async function IIFE',
      code: 'void (async function () { await 1; })();',
      errors: [iife],
    }),
    invalidWith({ name: 'IIFE with arguments', code: '((x: number) => x)(1);', errors: [iife] }),
    invalidWith({ name: 'nested parentheses', code: '((() => 1))();', errors: [iife] }),
    invalidWith({
      name: 'IIFE inside a component body',
      filename: 'price.tsx',
      code: 'function Price({ cents }: { cents: number }) {\n  const label = (() => (cents > 0 ? String(cents / 100) : "Free"))();\n  return <span>{label}</span>;\n}',
      errors: [iife],
    }),
    invalidWith({
      name: 'nested IIFEs report each call',
      code: '(() => (() => 1)())();',
      errors: [iife, iife],
    }),
  ],
});
