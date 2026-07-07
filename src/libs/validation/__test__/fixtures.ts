import type { ApigConfig, HttpClient } from '@models';
import { sdk, tanstackQuery, typescript, zod, msw, faker } from '@plugins';

const VALID_INPUT = 'https://petstore3.swagger.io/api/v3/openapi.json';
const INVALID_INPUT = {
  age: 0,
};

const VALID_OUTPUT_STRING = 'src/cool-output';
const VALID_OUTPUT_OBJECT = { path: 'src/api/generated/none', clean: true };
const INVALID_OUTPUT_TYPE = 12345;
const OUTPUT_OBJECT_WITHOUT_PATH = { clean: true };

const VALID_PLUGINS = [typescript(), sdk(), tanstackQuery()];
const VALID_PLUGINS_WITH_ZOD = [typescript(), sdk(), zod()];
const VALID_PLUGINS_WITH_MSW = [typescript(), sdk(), faker(), msw()];
const INVALID_PLUGINS_TYPE = `
  When you were here before
  Couldn't look you in the eye
  You're just like an angel
  Your skin makes me cry
  You float like a feather
  In a beautiful world
  I wish I was special
  You're so fuckin' special
  `;

const VALID_GROUP_BY = 'tags';
const INVALID_GROUP_BY = 'by-color';

const VALID_HTTP_CLIENT_FETCH = {
  name: 'fetch',
} satisfies HttpClient;

const VALID_HTTP_CLIENT_AXIOS = {
  name: 'axios',
  path: 'src/api/client',
  export: 'apiClient',
} satisfies HttpClient;

const HTTP_CLIENT_MISSING_NAME = {};
const HTTP_CLIENT_INVALID_NAME = { name: 'superagent' };
const HTTP_CLIENT_AXIOS_WITHOUT_PATH_AND_EXPORT = { name: 'axios' };

const VALID_ERROR_HANDLING_BOOLEAN = true;
const VALID_ERROR_HANDLING_OBJECT = {
  path: 'src/errors/api-error',
  export: 'ApigError',
};
const ERROR_HANDLING_INVALID_TYPE = 'yes';
const ERROR_HANDLING_OBJECT_MISSING_FIELDS = {};

const VALID_CLI_LOGGING = {
  level: 'detailed',
} satisfies ApigConfig['cliLogging'];

const CLI_LOGGING_INVALID_LEVEL = { level: 'verbose' };

const RAW_RESPONSE_INVALID_TYPE = 'true';

export const POSITIVE_CONFIGS = {
  MINIMAL_OUTPUT_STRING: {
    input: VALID_INPUT,
    output: VALID_OUTPUT_STRING,
    plugins: VALID_PLUGINS,
  },
  MINIMAL_OUTPUT_OBJECT: {
    input: VALID_INPUT,
    output: VALID_OUTPUT_OBJECT,
    plugins: VALID_PLUGINS,
  },
  WITH_GROUP_BY: {
    input: VALID_INPUT,
    output: VALID_OUTPUT_OBJECT,
    plugins: VALID_PLUGINS,
    groupBy: VALID_GROUP_BY,
  },
  WITH_HTTP_CLIENT_FETCH: {
    input: VALID_INPUT,
    output: VALID_OUTPUT_OBJECT,
    plugins: VALID_PLUGINS,
    httpClient: VALID_HTTP_CLIENT_FETCH,
  },
  WITH_HTTP_CLIENT_AXIOS: {
    input: VALID_INPUT,
    output: VALID_OUTPUT_OBJECT,
    plugins: VALID_PLUGINS,
    httpClient: VALID_HTTP_CLIENT_AXIOS,
  },
  WITH_ZOD_PLUGIN: {
    input: VALID_INPUT,
    output: VALID_OUTPUT_OBJECT,
    plugins: VALID_PLUGINS_WITH_ZOD,
  },
  WITH_MSW_AND_FAKER: {
    input: VALID_INPUT,
    output: VALID_OUTPUT_OBJECT,
    plugins: VALID_PLUGINS_WITH_MSW,
  },
  WITH_ERROR_HANDLING_BOOLEAN: {
    input: VALID_INPUT,
    output: VALID_OUTPUT_OBJECT,
    plugins: VALID_PLUGINS,
    errorHandling: VALID_ERROR_HANDLING_BOOLEAN,
  },
  WITH_ERROR_HANDLING_OBJECT: {
    input: VALID_INPUT,
    output: VALID_OUTPUT_OBJECT,
    plugins: VALID_PLUGINS,
    errorHandling: VALID_ERROR_HANDLING_OBJECT,
  },
  WITH_CLI_LOGGING: {
    input: VALID_INPUT,
    output: VALID_OUTPUT_OBJECT,
    plugins: VALID_PLUGINS,
    cliLogging: VALID_CLI_LOGGING,
  },
  FULL: {
    input: VALID_INPUT,
    output: VALID_OUTPUT_OBJECT,
    plugins: VALID_PLUGINS_WITH_MSW,
    groupBy: VALID_GROUP_BY,
    httpClient: VALID_HTTP_CLIENT_AXIOS,
    errorHandling: VALID_ERROR_HANDLING_OBJECT,
    cliLogging: VALID_CLI_LOGGING,
    rawResponse: true,
    apiLogging: true,
    endpointsMap: true,
  },
} satisfies Record<string, ApigConfig>;

export const NEGATIVE_CONFIGS = {
  MISSING_INPUT: {
    output: VALID_OUTPUT_STRING,
  },
  INVALID_INPUT_TYPE: {
    input: INVALID_INPUT,
    output: VALID_OUTPUT_STRING,
  },
  MISSING_OUTPUT: {
    input: VALID_INPUT,
  },
  INVALID_OUTPUT_TYPE: {
    input: VALID_INPUT,
    output: INVALID_OUTPUT_TYPE,
  },
  OUTPUT_OBJECT_MISSING_PATH: {
    input: VALID_INPUT,
    output: OUTPUT_OBJECT_WITHOUT_PATH,
  },
  INVALID_GROUP_BY: {
    input: VALID_INPUT,
    output: VALID_OUTPUT_STRING,
    groupBy: INVALID_GROUP_BY,
  },
  HTTP_CLIENT_MISSING_NAME: {
    input: VALID_INPUT,
    output: VALID_OUTPUT_STRING,
    httpClient: HTTP_CLIENT_MISSING_NAME,
  },
  HTTP_CLIENT_INVALID_NAME: {
    input: VALID_INPUT,
    output: VALID_OUTPUT_STRING,
    httpClient: HTTP_CLIENT_INVALID_NAME,
  },
  HTTP_CLIENT_AXIOS_MISSING_PATH_AND_EXPORT: {
    input: VALID_INPUT,
    output: VALID_OUTPUT_STRING,
    httpClient: HTTP_CLIENT_AXIOS_WITHOUT_PATH_AND_EXPORT,
  },
  INVALID_PLUGINS_TYPE: {
    input: VALID_INPUT,
    output: VALID_OUTPUT_STRING,
    plugins: INVALID_PLUGINS_TYPE,
  },
  ERROR_HANDLING_INVALID_TYPE: {
    input: VALID_INPUT,
    output: VALID_OUTPUT_STRING,
    errorHandling: ERROR_HANDLING_INVALID_TYPE,
  },
  ERROR_HANDLING_OBJECT_MISSING_FIELDS: {
    input: VALID_INPUT,
    output: VALID_OUTPUT_STRING,
    errorHandling: ERROR_HANDLING_OBJECT_MISSING_FIELDS,
  },
  CLI_LOGGING_INVALID_LEVEL: {
    input: VALID_INPUT,
    output: VALID_OUTPUT_STRING,
    cliLogging: CLI_LOGGING_INVALID_LEVEL,
  },
  RAW_RESPONSE_INVALID_TYPE: {
    input: VALID_INPUT,
    output: VALID_OUTPUT_STRING,
    rawResponse: RAW_RESPONSE_INVALID_TYPE,
  },
  MULTIPLE_ERRORS_AT_ONCE: {
    output: OUTPUT_OBJECT_WITHOUT_PATH,
    groupBy: INVALID_GROUP_BY,
    rawResponse: RAW_RESPONSE_INVALID_TYPE,
  },
} as const;
