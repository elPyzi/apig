import { describe, test, expect } from 'bun:test';
import {
  isValidIdentifier,
  quoteKey,
  escapeReservedWord,
} from '@libs/string/identifier';

describe('isValidIdentifier', () => {
  test('accepts what can be written bare', () => {
    expect(isValidIdentifier('limit')).toBe(true);
    expect(isValidIdentifier('_private')).toBe(true);
    expect(isValidIdentifier('$ref')).toBe(true);
    expect(isValidIdentifier('page2')).toBe(true);
  });

  test('rejects what cannot', () => {
    expect(isValidIdentifier('employee-search-form-selection')).toBe(false);
    expect(isValidIdentifier('2fa')).toBe(false);
    expect(isValidIdentifier('with space')).toBe(false);
    expect(isValidIdentifier('')).toBe(false);
  });
});

describe('quoteKey', () => {
  test('leaves a plain key alone', () => {
    expect(quoteKey('limit')).toBe('limit');
  });

  test('quotes a key holding a dash', () => {
    expect(quoteKey('employee-search-form-selection')).toBe(
      "'employee-search-form-selection'",
    );
  });

  test('quotes a key starting with a digit', () => {
    expect(quoteKey('2fa')).toBe("'2fa'");
  });
});

describe('escapeReservedWord', () => {
  test('escapes words that cannot be bound with const', () => {
    expect(escapeReservedWord('delete')).toBe('_delete');
    expect(escapeReservedWord('new')).toBe('_new');
    expect(escapeReservedWord('class')).toBe('_class');
    expect(escapeReservedWord('return')).toBe('_return');
  });

  test('escapes strict-mode reserved words too, since output is a module', () => {
    expect(escapeReservedWord('interface')).toBe('_interface');
    expect(escapeReservedWord('static')).toBe('_static');
    expect(escapeReservedWord('yield')).toBe('_yield');
  });

  test('leaves an ordinary name alone', () => {
    expect(escapeReservedWord('deletePet')).toBe('deletePet');
    expect(escapeReservedWord('newOrder')).toBe('newOrder');
    expect(escapeReservedWord('listPets')).toBe('listPets');
  });

  test('leaves a name that merely contains a reserved word alone', () => {
    expect(escapeReservedWord('undelete')).toBe('undelete');
    expect(escapeReservedWord('renew')).toBe('renew');
  });
});
