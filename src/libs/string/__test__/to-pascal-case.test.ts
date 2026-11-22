import { describe, test, expect } from 'bun:test';
import { applyNaming, toCamelCase, toPascalCase } from '@libs/string';
import { joinPascalWords } from '@libs/string/to-pascal-case';

describe('toPascalCase', () => {
  test('joins words split on the usual separators', () => {
    expect(toPascalCase('get_user-name')).toBe('GetUserName');
    expect(toPascalCase('pets/list all')).toBe('PetsListAll');
  });

  test('a dotted component name becomes one identifier', () => {
    expect(toPascalCase('v1.Pet')).toBe('V1Pet');
    expect(toPascalCase('io.k8s.api.core.v1.Pod')).toBe('IoK8sApiCoreV1Pod');
  });

  test('drops any other character an identifier cannot hold', () => {
    expect(toPascalCase('Pet (v2)')).toBe('PetV2');
    expect(toPascalCase('@type')).toBe('Type');
  });

  test('a name opening with a digit is prefixed', () => {
    expect(toPascalCase('3dModel')).toBe('_3dModel');
  });

  test('keeps letters outside ASCII', () => {
    expect(toPascalCase('квартал отчёт')).toBe('КварталОтчёт');
  });

  test('toCamelCase follows it', () => {
    expect(toCamelCase('pets.list')).toBe('petsList');
  });
});

describe('names that are not identifiers keep their punctuation', () => {
  test('joinPascalWords splits on separators only', () => {
    expect(joinPascalWords('io.k8s')).toBe('Io.k8s');
  });

  test('a file or directory name is unchanged by the identifier rules', () => {
    expect(applyNaming('io.k8s', 'PascalCase')).toBe('Io.k8s');
    expect(applyNaming('io.k8s', 'camelCase')).toBe('io.k8s');
    expect(applyNaming('2fa setup', 'PascalCase')).toBe('2faSetup');
  });
});
