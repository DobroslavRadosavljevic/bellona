import { forbiddenTermInNamesId } from '../../../../src/plugins/js/rules/no-shape-in-symbol-names.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runJsRule } from './harness.ts';

const forbidden = error('forbiddenSymbolName');

runJsRule(forbiddenTermInNamesId, {
  valid: [
    validWith('const user = { id: "one" };', { name: 'plain identifier' }),
    validWith('interface User { readonly id: string }', { name: 'interface without term' }),
    validWith('function saveUser(user: User) {}', { name: 'function without term' }),
    validWith('class UserStore {}', { name: 'class without term' }),
    validWith('const userShape = 1;', {
      name: 'custom term allows shape',
      options: [{ term: 'dto' }],
    }),
    validWith('const ShapeOfUser = 1;', {
      name: 'case-sensitive miss',
      options: [{ caseSensitive: true }],
    }),
    validWith('const fields = UserSchema.shape;', {
      name: 'third-party member name (Zod .shape)',
    }),
    validWith('const size = tensor.shape.length;', { name: 'member read' }),
    validWith('import { Shape } from "konva";\nnew Shape();', {
      name: 'import keeps the source module name',
    }),
    validWith('import { Shape as Figure } from "konva";\nnew Figure();', {
      name: 'import renamed to an owner name',
    }),
    validWith('draw({ shape: "circle" });', { name: 'object key passed to an API' }),
    validWith('export { Figure } from "./figure";', { name: 'no declaration' }),
  ],
  invalid: [
    invalidWith({
      name: 'const binding',
      code: 'const userShape = 1;',
      errors: [forbidden],
    }),
    invalidWith({
      name: 'interface name',
      code: 'interface UserShape { readonly id: string }',
      errors: [forbidden],
    }),
    invalidWith({
      name: 'function name',
      code: 'function toShape(value: User) {}',
      errors: [forbidden],
    }),
    invalidWith({
      name: 'class name',
      code: 'class UserShape {}',
      errors: [forbidden],
    }),
    invalidWith({
      name: 'case-insensitive match',
      code: 'const ShapeOfUser = 1;',
      errors: [forbidden],
    }),
    invalidWith({
      name: 'one report per declaration, not per use',
      code: 'type UserShape = { id: string };\nconst a: UserShape = { id: "1" };\nfunction f(user: UserShape) { return user; }',
      errors: [forbidden],
    }),
    invalidWith({
      name: 'parameter name',
      code: 'function f(shape: User) { return shape; }',
      errors: [forbidden],
    }),
    invalidWith({
      name: 'destructured binding',
      code: 'const { shape } = UserSchema;',
      errors: [forbidden],
    }),
    invalidWith({
      name: 'import renamed to the term',
      code: 'import { Figure as UserShape } from "./figure";',
      errors: [forbidden],
    }),
    invalidWith({
      name: 'default import local name',
      code: 'import UserShape from "./user";',
      errors: [forbidden],
    }),
    invalidWith({
      name: 'own member declarations',
      code: 'interface User { shape: string }\nclass Store { #shape = 1; shapeOf() { return this.#shape; } }',
      errors: [forbidden, forbidden, forbidden],
    }),
    invalidWith({
      name: 'enum, type parameter, and export alias',
      code: 'enum Kind { Shape }\ntype Box<TShape> = TShape;\nconst user = 1;\nexport { user as userShape };',
      errors: [forbidden, forbidden, forbidden],
    }),
    invalidWith({
      name: 'custom term',
      code: 'const userDto = 1;',
      options: [{ term: 'dto' }],
      errors: [forbidden],
    }),
  ],
});
