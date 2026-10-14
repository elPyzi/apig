import { describe, test, expect } from 'bun:test';
import { validateConfig } from '../validate-config';
import { NEGATIVE_CONFIGS, POSITIVE_CONFIGS } from './fixtures';

describe('validateConfig', () => {
  describe('cache', () => {
    const base = { input: 'spec.yaml', output: './out' };

    test('accepts both forms', () => {
      expect(() => validateConfig({ ...base, cache: true })).not.toThrow();
      expect(() => validateConfig({ ...base, cache: false })).not.toThrow();
      expect(() => validateConfig({ ...base, cache: {} })).not.toThrow();
    });

    test('accepts every ttl unit', () => {
      for (const ttl of ['30s', '15m', '12h', '7d']) {
        expect(() => validateConfig({ ...base, cache: { ttl } })).not.toThrow();
      }
    });

    test('accepts a positive maxEntries', () => {
      expect(() =>
        validateConfig({ ...base, cache: { maxEntries: 20 } }),
      ).not.toThrow();
    });

    test('rejects a maxEntries that cannot bound anything', () => {
      for (const maxEntries of [0, -1, 1.5, '20', null]) {
        expect(() =>
          validateConfig({ ...base, cache: { maxEntries } }),
        ).toThrow();
      }
    });

    test('rejects a ttl it cannot read, rather than silently never expiring', () => {
      for (const ttl of ['7w', '7 days', 'soon', '0d', 7]) {
        expect(() => validateConfig({ ...base, cache: { ttl } })).toThrow();
      }
    });
  });

  describe('functionNaming', () => {
    const base = { input: 'spec.yaml', output: './out' };

    test('accepts the two conventions that yield an identifier', () => {
      for (const functionNaming of ['camelCase', 'snake_case']) {
        expect(() => validateConfig({ ...base, functionNaming })).not.toThrow();
      }
    });

    test('rejects kebab-case, which is not an identifier at all', () => {
      expect(() =>
        validateConfig({ ...base, functionNaming: 'kebab-case' }),
      ).toThrow();
    });

    test('rejects PascalCase, which collides with the generated type names', () => {
      expect(() =>
        validateConfig({ ...base, functionNaming: 'PascalCase' }),
      ).toThrow();
    });
  });

  describe('happy test', () => {
    test('minimal config with a string output', () => {
      expect(() =>
        validateConfig(POSITIVE_CONFIGS.MINIMAL_OUTPUT_STRING),
      ).not.toThrow();
    });

    test('minimal config with an object output', () => {
      expect(() =>
        validateConfig(POSITIVE_CONFIGS.MINIMAL_OUTPUT_OBJECT),
      ).not.toThrow();
    });

    test('groupBy', () => {
      expect(() =>
        validateConfig(POSITIVE_CONFIGS.WITH_GROUP_BY),
      ).not.toThrow();
    });

    test('httpClient with fetch', () => {
      expect(() =>
        validateConfig(POSITIVE_CONFIGS.WITH_HTTP_CLIENT_FETCH),
      ).not.toThrow();
    });

    test('httpClient with axios', () => {
      expect(() =>
        validateConfig(POSITIVE_CONFIGS.WITH_HTTP_CLIENT_AXIOS),
      ).not.toThrow();
    });

    test('with the zod plugin', () => {
      expect(() =>
        validateConfig(POSITIVE_CONFIGS.WITH_ZOD_PLUGIN),
      ).not.toThrow();
    });

    test('msw and faker', () => {
      expect(() =>
        validateConfig(POSITIVE_CONFIGS.WITH_MSW_AND_FAKER),
      ).not.toThrow();
    });

    test('errorHandling as a boolean', () => {
      expect(() =>
        validateConfig(POSITIVE_CONFIGS.WITH_ERROR_HANDLING_BOOLEAN),
      ).not.toThrow();
    });

    test('errorHandling as an object', () => {
      expect(() =>
        validateConfig(POSITIVE_CONFIGS.WITH_ERROR_HANDLING_OBJECT),
      ).not.toThrow();
    });

    test('cli logging', () => {
      expect(() =>
        validateConfig(POSITIVE_CONFIGS.WITH_CLI_LOGGING),
      ).not.toThrow();
    });

    test('with most options set', () => {
      expect(() => validateConfig(POSITIVE_CONFIGS.FULL)).not.toThrow();
    });
  });

  describe('negative test', () => {
    test('missing input', () => {
      expect(() => validateConfig(NEGATIVE_CONFIGS.MISSING_INPUT)).toThrow();
    });

    test('invalid input', () => {
      expect(() =>
        validateConfig(NEGATIVE_CONFIGS.INVALID_INPUT_TYPE),
      ).toThrow();
    });

    test('missing output', () => {
      expect(() =>
        validateConfig(NEGATIVE_CONFIGS.MISSING_OUTPUT),
      ).not.toThrow();
    });

    test('invalid output', () => {
      expect(() =>
        validateConfig(NEGATIVE_CONFIGS.INVALID_OUTPUT_TYPE),
      ).toThrow();
    });

    test('missing path in the output object', () => {
      expect(() =>
        validateConfig(NEGATIVE_CONFIGS.OUTPUT_OBJECT_MISSING_PATH),
      ).toThrow();
    });

    test('invalid groupBy', () => {
      expect(() => validateConfig(NEGATIVE_CONFIGS.INVALID_GROUP_BY)).toThrow();
    });

    test('httpClient without a name', () => {
      expect(() =>
        validateConfig(NEGATIVE_CONFIGS.HTTP_CLIENT_MISSING_NAME),
      ).toThrow();
    });

    test('invalid httpClient name', () => {
      expect(() =>
        validateConfig(NEGATIVE_CONFIGS.HTTP_CLIENT_INVALID_NAME),
      ).toThrow();
    });

    test('axios without path and export', () => {
      expect(() =>
        validateConfig(
          NEGATIVE_CONFIGS.HTTP_CLIENT_AXIOS_MISSING_PATH_AND_EXPORT,
        ),
      ).toThrow();
    });

    test('invalid plugins type', () => {
      expect(() =>
        validateConfig(NEGATIVE_CONFIGS.INVALID_PLUGINS_TYPE),
      ).toThrow();
    });

    test('invalid errorHandling type', () => {
      expect(() =>
        validateConfig(NEGATIVE_CONFIGS.ERROR_HANDLING_INVALID_TYPE),
      ).toThrow();
    });

    test('errorHandling object with no fields', () => {
      expect(() =>
        validateConfig(NEGATIVE_CONFIGS.ERROR_HANDLING_OBJECT_MISSING_FIELDS),
      ).toThrow();
    });

    test('invalid cliLogging.level', () => {
      expect(() =>
        validateConfig(NEGATIVE_CONFIGS.CLI_LOGGING_INVALID_LEVEL),
      ).toThrow();
    });

    test('invalid rawResponse type', () => {
      expect(() =>
        validateConfig(NEGATIVE_CONFIGS.RAW_RESPONSE_INVALID_TYPE),
      ).toThrow();
    });

    test('several errors at once', () => {
      expect(() =>
        validateConfig(NEGATIVE_CONFIGS.MULTIPLE_ERRORS_AT_ONCE),
      ).toThrow();
    });

    test('apiLogging together with mcp()', () => {
      expect(() =>
        validateConfig(NEGATIVE_CONFIGS.MCP_WITH_API_LOGGING),
      ).toThrow();
    });

    test('mcp() without requests() and zod()', () => {
      expect(() =>
        validateConfig(NEGATIVE_CONFIGS.MCP_WITHOUT_DEPENDENCIES),
      ).toThrow();
    });
  });
});
