/** Bare display/layout words. English uses them too, so they are weak alone. */
const WEAK_BARE_UTILITIES = new Set([
  'absolute',
  'antialiased',
  'block',
  'border',
  'capitalize',
  'collapse',
  'container',
  'contents',
  'fixed',
  'flex',
  'grid',
  'group',
  'grow',
  'hidden',
  'inline',
  'invisible',
  'isolate',
  'italic',
  'lowercase',
  'outline',
  'ordinal',
  'overline',
  'peer',
  'relative',
  'ring',
  'rounded',
  'separate',
  'shadow',
  'shrink',
  'static',
  'sticky',
  'table',
  'transform',
  'truncate',
  'underline',
  'uppercase',
  'visible',
]);

/** Hyphenated standalones that almost never appear as English. */
const STRONG_BARE_UTILITIES = new Set([
  '@container',
  'diagonal-fractions',
  'flow-root',
  'inline-block',
  'inline-flex',
  'inline-grid',
  'inline-table',
  'line-through',
  'lining-nums',
  'no-underline',
  'normal-case',
  'normal-nums',
  'not-italic',
  'not-sr-only',
  'oldstyle-nums',
  'proportional-nums',
  'slashed-zero',
  'sr-only',
  'stacked-fractions',
  'subpixel-antialiased',
  'tabular-nums',
]);

/**
 * Utility families. Tailwind v4 reads most values from `@theme` variables, so a
 * prefix can take any project name (`bg-primary`). See `classifyClassToken`.
 */
const UTILITY_PREFIXES = [
  'forced-color-adjust',
  'field-sizing',
  'backdrop-blur',
  'backdrop-brightness',
  'backdrop-contrast',
  'backdrop-filter',
  'backdrop-grayscale',
  'backdrop-hue-rotate',
  'backdrop-invert',
  'backdrop-opacity',
  'backdrop-saturate',
  'backdrop-sepia',
  'bg-blend',
  'break-after',
  'break-before',
  'break-inside',
  'col-end',
  'col-span',
  'col-start',
  'divide-x',
  'divide-y',
  'drop-shadow',
  'grid-cols',
  'grid-flow',
  'grid-rows',
  'hue-rotate',
  'inset-x',
  'inset-y',
  'justify-items',
  'line-clamp',
  'justify-self',
  'list-image',
  'max-block',
  'max-h',
  'max-inline',
  'max-w',
  'min-block',
  'min-h',
  'min-inline',
  'min-w',
  'mix-blend',
  'place-content',
  'place-items',
  'place-self',
  'pointer-events',
  'row-end',
  'row-span',
  'row-start',
  'scroll-m',
  'scroll-p',
  'space-x',
  'space-y',
  'translate-x',
  'translate-y',
  'underline-offset',
  'will-change',
  'auto-cols',
  'auto-rows',
  'brightness',
  'decoration',
  'grayscale',
  'justify',
  'leading',
  'opacity',
  'outline',
  'overflow',
  'overscroll',
  'appearance',
  'backface',
  'contain',
  'isolation',
  'perspective',
  'placeholder',
  'rounded',
  'saturate',
  'scrollbar',
  'tracking',
  'transform',
  'transition',
  'translate',
  'whitespace',
  'accent',
  'align',
  'animate',
  'aspect',
  'basis',
  'bg',
  'blur',
  'border',
  'block',
  'bottom',
  'box',
  'break',
  'caption',
  'caret',
  'clear',
  'col',
  'columns',
  'content',
  'contrast',
  'cursor',
  'delay',
  'divide',
  'duration',
  'ease',
  'end',
  'fill',
  'filter',
  'flex',
  'float',
  'font',
  'from',
  'gap',
  'grow',
  'h',
  'hyphens',
  'indent',
  'inline',
  'inset',
  'invert',
  'items',
  'left',
  'list',
  'm',
  'mask',
  'mb',
  'mbe',
  'mbs',
  'me',
  'ml',
  'mr',
  'ms',
  'mt',
  'mx',
  'my',
  'object',
  'order',
  'origin',
  'p',
  'pb',
  'pbe',
  'pbs',
  'pe',
  'pl',
  'pr',
  'ps',
  'pt',
  'px',
  'py',
  'resize',
  'right',
  'ring',
  'rotate',
  'row',
  'scale',
  'scheme',
  'scroll',
  'select',
  'self',
  'sepia',
  'shadow',
  'shrink',
  'size',
  'skew',
  'snap',
  'start',
  'stroke',
  'tab',
  'table',
  'text',
  'to',
  'top',
  'touch',
  'via',
  'w',
  'wrap',
  'z',
  'zoom',
];

const PREFIXES_LONGEST_FIRST: string[] = [];
for (const prefix of UTILITY_PREFIXES) {
  PREFIXES_LONGEST_FIRST.push(prefix);
}
PREFIXES_LONGEST_FIRST.sort((left, right) => {
  const byLength = right.length - left.length;
  if (byLength !== 0) {
    return byLength;
  }
  return left < right ? -1 : left > right ? 1 : 0;
});

const NAMED_VALUES = new Set([
  'all',
  'around',
  'auto',
  'balance',
  'baseline',
  'between',
  'black',
  'block',
  'bold',
  'both',
  'bottom',
  'center',
  'clip',
  'collapse',
  'col',
  'contain',
  'cover',
  'current',
  'dashed',
  'default',
  'disc',
  'dotted',
  'double',
  'dvh',
  'dvw',
  'ellipsis',
  'end',
  'evenly',
  'extrabold',
  'extralight',
  'fill',
  'first',
  'fit',
  'fixed',
  'full',
  'grab',
  'grabbing',
  'hidden',
  'inherit',
  'inline',
  'keep',
  'last',
  'left',
  'light',
  'local',
  'loose',
  'lvh',
  'lvw',
  'max',
  'medium',
  'min',
  'mono',
  'move',
  'none',
  'normal',
  'nowrap',
  'pointer',
  'pretty',
  'prose',
  'px',
  'relaxed',
  'reverse',
  'right',
  'row',
  'sans',
  'screen',
  'scroll',
  'semibold',
  'separate',
  'serif',
  'snug',
  'solid',
  'start',
  'stretch',
  'svh',
  'svw',
  'text',
  'thin',
  'tight',
  'top',
  'transparent',
  'visible',
  'wait',
  'white',
  'words',
  'wrap',
  'x',
  'y',
]);

const COLOR_NAMES = new Set([
  'amber',
  'black',
  'blue',
  'current',
  'cyan',
  'emerald',
  'fuchsia',
  'gray',
  'green',
  'indigo',
  'inherit',
  'lime',
  'mauve',
  'mist',
  'neutral',
  'olive',
  'orange',
  'pink',
  'purple',
  'red',
  'rose',
  'sky',
  'slate',
  'stone',
  'taupe',
  'teal',
  'transparent',
  'violet',
  'white',
  'yellow',
  'zinc',
]);

const COLOR_SHADES = new Set([
  '50',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
  '950',
]);

const SIZE_NAMES = new Set([
  '2xs',
  '3xs',
  'base',
  '2xl',
  '3xl',
  '4xl',
  '5xl',
  '6xl',
  '7xl',
  '8xl',
  '9xl',
  'lg',
  'md',
  'sm',
  'xl',
  'xs',
]);

const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'be',
  'docs',
  'for',
  'in',
  'is',
  'of',
  'on',
  'or',
  'please',
  'that',
  'the',
  'this',
  'to',
  'use',
  'we',
  'with',
  'you',
  'your',
]);

export type ClassTokenKind = 'strong' | 'weak' | 'other';

export function isClassNameBinding(name: string): boolean {
  const folded = name.replaceAll(/[_-]/gu, '');
  return /classnames?/iu.test(folded) || /classes/iu.test(folded);
}

export function splitClassTokens(text: string): string[] {
  const tokens: string[] = [];
  for (const part of text.trim().split(/\s+/u)) {
    if (part !== '') {
      tokens.push(part);
    }
  }
  return tokens;
}

/**
 * Visit the characters of a token that are outside `[…]` arbitrary values and
 * outside Tailwind v4 `-(…)` CSS variable values (`bg-(--brand)`).
 * Returns false when the brackets do not close.
 */
function forEachOuterCharacter(
  text: string,
  visit: (character: string, index: number) => void,
): boolean {
  let squareDepth = 0;
  let roundDepth = 0;
  for (let index = 0; index < text.length; index += 1) {
    const character = text.charAt(index);
    if (character === '[') {
      squareDepth += 1;
      continue;
    }
    if (character === ']') {
      squareDepth = Math.max(0, squareDepth - 1);
      continue;
    }
    if (squareDepth > 0) {
      continue;
    }
    if (character === '(' && (roundDepth > 0 || text.charAt(index - 1) === '-')) {
      roundDepth += 1;
      continue;
    }
    if (character === ')' && roundDepth > 0) {
      roundDepth -= 1;
      continue;
    }
    if (roundDepth === 0) {
      visit(character, index);
    }
  }
  return squareDepth === 0 && roundDepth === 0;
}

const DIGIT_PATTERN = /\d/u;

/**
 * `p-0.5` has a decimal point. `flex!` and `!flex` have an important mark.
 * Other outer punctuation means prose, not a class list.
 */
function isAllowedTokenPunctuation(token: string, character: string, index: number): boolean {
  if (character === '!') {
    return index === 0 || index === token.length - 1;
  }
  if (character === '.') {
    return (
      DIGIT_PATTERN.test(token.charAt(index - 1)) && DIGIT_PATTERN.test(token.charAt(index + 1))
    );
  }
  return false;
}

function hasOuterPunctuation(text: string): boolean {
  let found = false;
  for (const token of splitClassTokens(text)) {
    forEachOuterCharacter(token, (character, index) => {
      if (
        /[.,;!?(){}'"=]/u.test(character) &&
        !isAllowedTokenPunctuation(token, character, index)
      ) {
        found = true;
      }
    });
  }
  return found;
}

function looksLikeForeignString(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed === '') {
    return true;
  }
  if (/https?:\/\//iu.test(trimmed)) {
    return true;
  }
  if (/:\s/u.test(trimmed)) {
    return true;
  }
  if (hasOuterPunctuation(trimmed)) {
    return true;
  }
  if (/^[A-Z]/u.test(trimmed) && /\s/u.test(trimmed)) {
    return true;
  }
  return false;
}

interface UtilityBody {
  body: string;
  hasVariant: boolean;
}

function splitUtilityBody(token: string): UtilityBody {
  let lastColon = -1;
  forEachOuterCharacter(token, (character, index) => {
    if (character === ':') {
      lastColon = index;
    }
  });
  if (lastColon === -1) {
    return { body: token, hasVariant: false };
  }
  return { body: token.slice(lastColon + 1), hasVariant: true };
}

interface UtilityDecorators {
  body: string;
  hasImportant: boolean;
  hasNegative: boolean;
  hasOpacity: boolean;
}

function stripUtilityDecorators(utility: string): UtilityDecorators {
  let body = utility;
  let hasImportant = false;
  let hasNegative = false;
  let hasOpacity = false;
  if (body.startsWith('!')) {
    hasImportant = true;
    body = body.slice(1);
  }
  if (body.endsWith('!') && body.length > 1) {
    hasImportant = true;
    body = body.slice(0, -1);
  }
  if (body.startsWith('-') && body.length > 1) {
    hasNegative = true;
    body = body.slice(1);
  }
  const slash = body.lastIndexOf('/');
  if (slash !== -1) {
    const opacity = body.slice(slash + 1);
    if (/^(?:\d{1,3}(?:\.\d+)?|\[[^\]]+\]|\([^)]+\))$/u.test(opacity)) {
      hasOpacity = true;
      body = body.slice(0, slash);
    }
  }
  return { body, hasImportant, hasNegative, hasOpacity };
}

function isColorValue(value: string): boolean {
  if (COLOR_NAMES.has(value)) {
    return true;
  }
  const dash = value.lastIndexOf('-');
  if (dash <= 0) {
    return false;
  }
  const name = value.slice(0, dash);
  const shade = value.slice(dash + 1);
  return COLOR_NAMES.has(name) && COLOR_SHADES.has(shade);
}

function isKnownValue(value: string): boolean {
  if (value === '') {
    return false;
  }
  if (/^\[[^\]]+\]$/u.test(value)) {
    return true;
  }
  if (/^\d+(?:\.\d+)?%?$/u.test(value)) {
    return true;
  }
  if (/^\d+\/\d+$/u.test(value)) {
    return true;
  }
  if (NAMED_VALUES.has(value) || SIZE_NAMES.has(value) || isColorValue(value)) {
    return true;
  }
  if (/^linear-to-[trbl]{1,2}$/u.test(value)) {
    return true;
  }
  return false;
}

/**
 * A kebab-case value that is not in the default theme. Tailwind v4 makes a
 * utility for each `@theme` variable (`--color-primary` gives `bg-primary`),
 * so project names such as `muted-foreground` are real values.
 * @see https://tailwindcss.com/docs/theme#theme-variable-namespaces
 */
function isThemeLikeValue(value: string): boolean {
  return /^[a-z0-9][a-z0-9.-]*%?$/u.test(value);
}

interface PrefixMatch {
  prefix: string;
  value: string;
}

function matchPrefix(utility: string): PrefixMatch | undefined {
  for (const prefix of PREFIXES_LONGEST_FIRST) {
    if (utility.startsWith(`${prefix}-`)) {
      return { prefix, value: utility.slice(prefix.length + 1) };
    }
    if (utility === prefix) {
      return { prefix, value: '' };
    }
  }
  return undefined;
}

function isClassTokenCharset(token: string): boolean {
  if (token === '') {
    return false;
  }
  let valid = true;
  const balanced = forEachOuterCharacter(token, (character) => {
    if (/[A-Z]/u.test(character) || !/[@a-z0-9:./%_*!-]/u.test(character)) {
      valid = false;
    }
  });
  return valid && balanced;
}

function isLetterSlashMime(utility: string): boolean {
  return /[a-z]\/[a-z]/iu.test(utility) && !/\/(?:\d{1,3}|\[[^\]]+\]|\([^)]+\))$/u.test(utility);
}

/** Marker classes with a name: `group/item`, `peer/email`, `@container/main`. */
const NAMED_MARKER_PATTERN = /^(?:group|peer|@container)\/[a-z0-9_-]+$/u;

/** Tailwind v4 CSS variable shorthand: `bg-(--brand)`, `w-(--sidebar-width)`. */
const CSS_VARIABLE_VALUE_PATTERN = /^[a-z][a-z0-9-]*-\((?:[a-z-]+:)?--[a-zA-Z0-9_-]+\)$/u;

export function classifyClassToken(token: string): ClassTokenKind {
  if (!isClassTokenCharset(token) || STOPWORDS.has(token)) {
    return 'other';
  }
  const { body: raw, hasVariant } = splitUtilityBody(token);
  if (raw === '') {
    return 'other';
  }
  if (/^\[[^\]]+\]$/u.test(raw) || NAMED_MARKER_PATTERN.test(raw)) {
    return 'strong';
  }
  if (isLetterSlashMime(raw)) {
    return 'other';
  }
  const stripped = stripUtilityDecorators(raw);
  const utility = stripped.body;
  if (utility === '') {
    return 'other';
  }
  const distinctive =
    hasVariant || stripped.hasImportant || stripped.hasNegative || stripped.hasOpacity;
  if (STRONG_BARE_UTILITIES.has(utility)) {
    return 'strong';
  }
  if (WEAK_BARE_UTILITIES.has(utility)) {
    return distinctive ? 'strong' : 'weak';
  }
  if (/^[a-z][a-z0-9-]*\[[^\]]+\]$/u.test(utility) || CSS_VARIABLE_VALUE_PATTERN.test(utility)) {
    return 'strong';
  }
  const matched = matchPrefix(utility);
  if (matched === undefined) {
    return 'other';
  }
  if (matched.value === '') {
    if (matched.prefix.includes('-')) {
      return 'strong';
    }
    return distinctive ? 'strong' : 'weak';
  }
  if (isKnownValue(matched.value)) {
    return 'strong';
  }
  if (isThemeLikeValue(matched.value)) {
    return distinctive ? 'strong' : 'weak';
  }
  return 'other';
}

/**
 * The utility part of one class token, without variants, the important mark,
 * the negative mark, or an opacity modifier. `hover:!bg-black/50` → `bg-black`.
 */
export function utilityBodyOf(token: string): string {
  return stripUtilityDecorators(splitUtilityBody(token).body).body;
}

/** True when `name` is a utility family (`bg`), or a family plus a value (`bg-red`). */
export function startsWithUtilityPrefix(name: string): boolean {
  return name !== '' && matchPrefix(name) !== undefined;
}

export function isTailwindToken(token: string): boolean {
  return classifyClassToken(token) !== 'other';
}

export function looksLikeClassNameList(
  text: string,
  minUtilities: number,
  nameHint: boolean,
): boolean {
  if (looksLikeForeignString(text)) {
    return false;
  }
  const tokens = splitClassTokens(text);
  if (tokens.length === 0) {
    return false;
  }
  let strong = 0;
  let weak = 0;
  for (const token of tokens) {
    const kind = classifyClassToken(token);
    if (kind === 'other') {
      return false;
    }
    if (kind === 'strong') {
      strong += 1;
    } else {
      weak += 1;
    }
  }
  const utilities = strong + weak;
  const needed = nameHint ? 1 : Math.max(1, minUtilities);
  if (utilities < needed) {
    return false;
  }
  if (strong === 0 && !nameHint) {
    return false;
  }
  return true;
}
