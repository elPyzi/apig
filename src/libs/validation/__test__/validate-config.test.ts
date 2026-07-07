import { describe, test, expect } from 'bun:test';
import { validateConfig } from '../validate-config';
import { NEGATIVE_CONFIGS, POSITIVE_CONFIGS } from './fixtures';

describe('validateConfig', () => {
  describe('happy test', () => {
    test('Тест на минимальный конфиг с string output', () => {
      expect(() =>
        validateConfig(POSITIVE_CONFIGS.MINIMAL_OUTPUT_STRING),
      ).not.toThrow();
    });

    test('Тест на минимальный конфиг с object output', () => {
      expect(() =>
        validateConfig(POSITIVE_CONFIGS.MINIMAL_OUTPUT_OBJECT),
      ).not.toThrow();
    });

    test('Тест на group by', () => {
      expect(() =>
        validateConfig(POSITIVE_CONFIGS.WITH_GROUP_BY),
      ).not.toThrow();
    });

    test('Тест на http client c fetch', () => {
      expect(() =>
        validateConfig(POSITIVE_CONFIGS.WITH_HTTP_CLIENT_FETCH),
      ).not.toThrow();
    });

    test('Тест на http client c axios', () => {
      expect(() =>
        validateConfig(POSITIVE_CONFIGS.WITH_HTTP_CLIENT_AXIOS),
      ).not.toThrow();
    });

    test('Тест с zod плагином', () => {
      expect(() =>
        validateConfig(POSITIVE_CONFIGS.WITH_ZOD_PLUGIN),
      ).not.toThrow();
    });

    test('Тест на msw и faker', () => {
      expect(() =>
        validateConfig(POSITIVE_CONFIGS.WITH_MSW_AND_FAKER),
      ).not.toThrow();
    });

    test('Тест на error handling == boolean', () => {
      expect(() =>
        validateConfig(POSITIVE_CONFIGS.WITH_ERROR_HANDLING_BOOLEAN),
      ).not.toThrow();
    });

    test('Тест на error handling == object', () => {
      expect(() =>
        validateConfig(POSITIVE_CONFIGS.WITH_ERROR_HANDLING_OBJECT),
      ).not.toThrow();
    });

    test('Тест на cli логирование', () => {
      expect(() =>
        validateConfig(POSITIVE_CONFIGS.WITH_CLI_LOGGING),
      ).not.toThrow();
    });

    test('Тест со большенства параметрами', () => {
      expect(() => validateConfig(POSITIVE_CONFIGS.FULL)).not.toThrow();
    });
  });

  describe('negative test', () => {
    test('Тест на пропущенный input', () => {
      expect(() => validateConfig(NEGATIVE_CONFIGS.MISSING_INPUT)).toThrow();
    });

    test('Тест на invalid input', () => {
      expect(() =>
        validateConfig(NEGATIVE_CONFIGS.INVALID_INPUT_TYPE),
      ).toThrow();
    });

    test('Тест пропущенный output', () => {
      expect(() => validateConfig(NEGATIVE_CONFIGS.MISSING_OUTPUT)).toThrow();
    });

    test('Тест invalid output', () => {
      expect(() =>
        validateConfig(NEGATIVE_CONFIGS.INVALID_OUTPUT_TYPE),
      ).toThrow();
    });

    test('Тест на пропщуенный path в output object', () => {
      expect(() =>
        validateConfig(NEGATIVE_CONFIGS.OUTPUT_OBJECT_MISSING_PATH),
      ).toThrow();
    });

    test('Тест на инвалид group by', () => {
      expect(() => validateConfig(NEGATIVE_CONFIGS.INVALID_GROUP_BY)).toThrow();
    });

    test('Тест на http client без name', () => {
      expect(() =>
        validateConfig(NEGATIVE_CONFIGS.HTTP_CLIENT_MISSING_NAME),
      ).toThrow();
    });

    test('Тест на невалидный http client name', () => {
      expect(() =>
        validateConfig(NEGATIVE_CONFIGS.HTTP_CLIENT_INVALID_NAME),
      ).toThrow();
    });

    test('Тест на axios без path и export', () => {
      expect(() =>
        validateConfig(
          NEGATIVE_CONFIGS.HTTP_CLIENT_AXIOS_MISSING_PATH_AND_EXPORT,
        ),
      ).toThrow();
    });

    test('Тест на невалидный тип plugins', () => {
      expect(() =>
        validateConfig(NEGATIVE_CONFIGS.INVALID_PLUGINS_TYPE),
      ).toThrow();
    });

    test('Тест на невалидный тип errorHandling', () => {
      expect(() =>
        validateConfig(NEGATIVE_CONFIGS.ERROR_HANDLING_INVALID_TYPE),
      ).toThrow();
    });

    test('Тест на errorHandling объект без полей', () => {
      expect(() =>
        validateConfig(NEGATIVE_CONFIGS.ERROR_HANDLING_OBJECT_MISSING_FIELDS),
      ).toThrow();
    });

    test('Тест на невалидный cliLogging.level', () => {
      expect(() =>
        validateConfig(NEGATIVE_CONFIGS.CLI_LOGGING_INVALID_LEVEL),
      ).toThrow();
    });

    test('Тест на невалидный тип rawResponse', () => {
      expect(() =>
        validateConfig(NEGATIVE_CONFIGS.RAW_RESPONSE_INVALID_TYPE),
      ).toThrow();
    });

    test('Тест на несколько ошибок одновременно', () => {
      expect(() =>
        validateConfig(NEGATIVE_CONFIGS.MULTIPLE_ERRORS_AT_ONCE),
      ).toThrow();
    });
  });
});
