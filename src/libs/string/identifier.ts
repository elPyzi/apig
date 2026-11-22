import { toCamelCase } from '@libs/string/to-camel-case';
import { joinPascalWords } from '@libs/string/to-pascal-case';

/**
 * Words that cannot be bound with `const` in a module. Includes the strict-mode
 * reserved set, since generated files are ES modules and always strict.
 */
const RESERVED_WORDS = new Set([
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'interface',
  'let',
  'new',
  'null',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'static',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
]);

const VALID_IDENTIFIER = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

/** Whether `name` can be written bare, as an identifier or an unquoted key. */
export const isValidIdentifier = (name: string): boolean =>
  VALID_IDENTIFIER.test(name);

/**
 * An object key, quoted when it cannot be written bare.
 *
 * OpenAPI parameter and property names are not bound by JavaScript's rules —
 * `employee-search-form-selection` and `2fa` are perfectly legal there and both
 * are syntax errors as a bare key.
 */
export const quoteKey = (name: string): string =>
  isValidIdentifier(name) ? name : toStringLiteral(name);

/** A single-quoted string literal, with the quote and backslash escaped. */
export const toStringLiteral = (value: string): string =>
  `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/**
 * The member name an enum value is written under, in a const object or a TS
 * `enum`.
 *
 * Enum values are free text — `1 (першы) квартал` PascalCases to
 * `1(першы)Квартал`, which is no identifier, so it is quoted. A purely numeric
 * name is prefixed instead: TypeScript rejects `'1'` as an enum member name.
 */
export const enumMemberKey = (value: string): string => {
  // not toPascalCase: a member key may be quoted, so it keeps the punctuation
  // that function strips — changing it would rename keys users already reference
  const key = joinPascalWords(value) || '_';
  return quoteKey(/^\d+(\.\d+)?$/.test(key) ? `_${key}` : key);
};

/**
 * A name safe to bind with `const`.
 *
 * An `operationId` of `delete` or `new` is legal in a spec and reaches the
 * generator unchanged; declaring it would not parse. The leading underscore
 * matches what other OpenAPI generators emit for the same case.
 */
export const escapeReservedWord = (name: string): string =>
  RESERVED_WORDS.has(name) ? `_${name}` : name;

/**
 * A path parameter rendered as a function parameter name.
 *
 * Path parameters become positional arguments, where quoting is not an option
 * the way it is for an object key — `structure-type` has to be renamed rather
 * than escaped. Every place that emits or interpolates one goes through this,
 * so the signature and the URL cannot disagree.
 */
export const toParamName = (name: string): string => {
  if (isValidIdentifier(name)) return escapeReservedWord(name);

  const camel = toCamelCase(name).replace(/[^a-zA-Z0-9_$]/g, '');
  // camelCasing alone does not rescue every name: `2nd` still opens with a
  // digit, which no identifier may do.
  const safe = /^[a-zA-Z_$]/.test(camel) ? camel : `_${camel}`;

  return escapeReservedWord(safe);
};
