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
  'grow',
  'hidden',
  'inline',
  'invisible',
  'isolate',
  'italic',
  'lowercase',
  'outline',
  'overline',
  'relative',
  'ring',
  'rounded',
  'separate',
  'shadow',
  'shrink',
  'static',
  'sticky',
  'table',
  'truncate',
  'underline',
  'uppercase',
  'visible',
]);

/** Hyphenated standalones that almost never appear as English. */
const STRONG_BARE_UTILITIES = new Set([
  'flow-root',
  'line-through',
  'no-underline',
  'not-italic',
  'not-sr-only',
  'sr-only',
  'subpixel-antialiased',
]);

const UTILITY_PREFIXES = [
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
  'grid-rows',
  'hue-rotate',
  'inset-x',
  'inset-y',
  'justify-items',
  'justify-self',
  'list-image',
  'max-h',
  'max-w',
  'min-h',
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
  'rounded',
  'saturate',
  'tracking',
  'transition',
  'translate',
  'whitespace',
  'accent',
  'animate',
  'aspect',
  'basis',
  'bg',
  'blur',
  'border',
  'bottom',
  'box',
  'break',
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
  'inset',
  'invert',
  'items',
  'left',
  'list',
  'm',
  'mb',
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
  'text',
  'to',
  'top',
  'touch',
  'via',
  'w',
  'z',
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
  'neutral',
  'orange',
  'pink',
  'purple',
  'red',
  'rose',
  'sky',
  'slate',
  'stone',
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

function splitClassTokens(text: string): string[] {
  const tokens: string[] = [];
  for (const part of text.trim().split(/\s+/u)) {
    if (part !== '') {
      tokens.push(part);
    }
  }
  return tokens;
}

function forEachOuterCharacter(text: string, visit: (character: string) => void): void {
  let depth = 0;
  for (const character of text) {
    if (character === '[') {
      depth += 1;
      continue;
    }
    if (character === ']') {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth === 0) {
      visit(character);
    }
  }
}

function hasOuterPunctuation(text: string): boolean {
  let found = false;
  forEachOuterCharacter(text, (character) => {
    if (/[.,;!?(){}'"=]/u.test(character)) {
      found = true;
    }
  });
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
  let current = '';
  let depth = 0;
  let body = token;
  let hasVariant = false;
  for (const character of token) {
    if (character === '[') {
      depth += 1;
    } else if (character === ']') {
      depth = Math.max(0, depth - 1);
    }
    if (character === ':' && depth === 0) {
      hasVariant = true;
      body = '';
      current = '';
      continue;
    }
    current += character;
    body = current;
  }
  return { body, hasVariant };
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
  if (body.startsWith('-') && body.length > 1) {
    hasNegative = true;
    body = body.slice(1);
  }
  const slash = body.lastIndexOf('/');
  if (slash !== -1) {
    const opacity = body.slice(slash + 1);
    if (/^(?:\d{1,3}|\[[^\]]+\])$/u.test(opacity)) {
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
  if (/^\d+(?:\.\d+)?$/u.test(value)) {
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
  let depth = 0;
  for (const character of token) {
    if (character === '[') {
      depth += 1;
      continue;
    }
    if (character === ']') {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth > 0) {
      continue;
    }
    if (/[A-Z]/u.test(character)) {
      return false;
    }
    if (!/[@a-z0-9:./%_*!-]/u.test(character)) {
      return false;
    }
  }
  return depth === 0;
}

function isLetterSlashMime(token: string): boolean {
  return /[a-z]\/[a-z]/iu.test(token) && !/\/(?:\d{1,3}|\[[^\]]+\])$/u.test(token);
}

export function classifyClassToken(token: string): ClassTokenKind {
  if (!isClassTokenCharset(token) || STOPWORDS.has(token) || isLetterSlashMime(token)) {
    return 'other';
  }
  const { body: raw, hasVariant } = splitUtilityBody(token);
  if (raw === '') {
    return 'other';
  }
  if (/^\[[^\]]+\]$/u.test(raw)) {
    return 'strong';
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
  if (/^[a-z][a-z0-9-]*\[[^\]]+\]$/u.test(utility)) {
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
  if (!isKnownValue(matched.value)) {
    return 'other';
  }
  return 'strong';
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
