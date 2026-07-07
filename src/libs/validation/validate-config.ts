import {
  GROUP_BY,
  HTTP_CLIENTS,
  NAMING_CASES,
  ENUM_STYLES,
  LOG_LEVELS,
  FORMATTERS,
  TYPE_STYLES,
} from '@models';
import type { ApigConfig } from '@models';

const GROUP_BY_VALUES = Object.values(GROUP_BY);
const HTTP_CLIENT_VALUES = Object.values(HTTP_CLIENTS);
const NAMING_VALUES = Object.values(NAMING_CASES);
const ENUM_STYLE_VALUES = Object.values(ENUM_STYLES);
const LOG_LEVEL_VALUES = Object.values(LOG_LEVELS);
const FORMATTER_VALUES = Object.values(FORMATTERS);
const TYPE_STYLE_VALUES = Object.values(TYPE_STYLES);

const DOCS_BASE = 'https://example.com/docs';

const DOCS_LINKS: Record<string, string> = {
  name: `${DOCS_BASE}/config/name`,
  input: `${DOCS_BASE}/config/input`,
  output: `${DOCS_BASE}/config/output`,
  groupBy: `${DOCS_BASE}/config/group-by`,
  httpClient: `${DOCS_BASE}/config/http-client`,
  fileNaming: `${DOCS_BASE}/config/file-naming`,
  functionNaming: `${DOCS_BASE}/config/function-naming`,
  enumStyle: `${DOCS_BASE}/config/enum-style`,
  typeStyle: `${DOCS_BASE}/config/type-style`,
  formatter: `${DOCS_BASE}/config/formatter`,
  plugins: `${DOCS_BASE}/config/plugins`,
  errorHandling: `${DOCS_BASE}/config/error-handling`,
  rawResponse: `${DOCS_BASE}/config/raw-response`,
  filter: `${DOCS_BASE}/config/filter`,
  rename: `${DOCS_BASE}/config/rename`,
  hooks: `${DOCS_BASE}/config/hooks`,
  versioning: `${DOCS_BASE}/config/versioning`,
  baseUrl: `${DOCS_BASE}/config/base-url`,
  index: `${DOCS_BASE}/config/index`,
  validate: `${DOCS_BASE}/config/validate`,
  endpointsMap: `${DOCS_BASE}/config/endpoints-map`,
  apiLogging: `${DOCS_BASE}/config/api-logging`,
  cliLogging: `${DOCS_BASE}/config/cli-logging`,
  comment: `${DOCS_BASE}/config/comment`,
  cache: `${DOCS_BASE}/config/cache`,
};

const extractFieldsFromErrors = (errors: string[]): string[] => {
  const found = new Set<string>();
  for (const error of errors) {
    for (const field of Object.keys(DOCS_LINKS)) {
      if (error.startsWith(field) || error.includes(`"${field}"`)) {
        found.add(field);
      }
    }
  }
  return [...found];
};

export class ConfigValidationError extends Error {
  public readonly validationErrors: string[];
  public readonly docLinks: Record<string, string>;

  constructor(errors: string[]) {
    const fields = extractFieldsFromErrors(errors);
    const links: Record<string, string> = { docs: `${DOCS_BASE}/config` };
    for (const field of fields) {
      if (DOCS_LINKS[field]) links[field] = DOCS_LINKS[field];
    }

    super(`[apig] Config validation failed`);
    this.name = 'ConfigValidationError';
    this.validationErrors = errors;
    this.docLinks = links;
  }
}

const KNOWN_KEYS = new Set(Object.keys(DOCS_LINKS));

export const validateConfig = (config: ApigConfig): void => {
  const errors: string[] = [];

  // unknown keys
  for (const key of Object.keys(config)) {
    if (!KNOWN_KEYS.has(key)) {
      const similar = [...KNOWN_KEYS].find(
        (k) =>
          k.toLowerCase() === key.toLowerCase() ||
          k.toLowerCase().includes(key.toLowerCase()) ||
          key.toLowerCase().includes(k.toLowerCase()),
      );
      errors.push(
        similar
          ? `unknown property "${key}" — did you mean "${similar}"?`
          : `unknown property "${key}"`,
      );
    }
  }

  // name
  if (config.name !== undefined && typeof config.name !== 'string') {
    errors.push(`name must be a string`);
  }

  // input
  if (!config.input) {
    errors.push(`input is required`);
  }
  if (typeof config.input !== 'string' && typeof config.input !== 'function') {
    errors.push(`input must be a string or function`);
  }

  // output
  if (config.output !== undefined) {
    if (typeof config.output !== 'string' && typeof config.output !== 'object') {
      errors.push(`output must be a string or object`);
    }
    if (typeof config.output === 'object' && !config.output.path) {
      errors.push(`output.path is required when output is an object`);
    }
  }

  // groupBy
  if (config.groupBy && !GROUP_BY_VALUES.includes(config.groupBy)) {
    errors.push(
      `groupBy must be one of: ${GROUP_BY_VALUES.map((v) => `"${v}"`).join(' | ')}`,
    );
  }

  // httpClient
  if (config.httpClient) {
    if (!config.httpClient.name) {
      errors.push(`httpClient.name is required`);
    }

    if (!HTTP_CLIENT_VALUES.includes(config.httpClient.name)) {
      errors.push(
        `httpClient.name must be one of: ${HTTP_CLIENT_VALUES.map((v) => `"${v}"`).join(' | ')}`,
      );
    }

    if (config.httpClient.name !== HTTP_CLIENTS.FETCH) {
      if (!config.httpClient.path)
        errors.push(
          `httpClient.path is required for "${config.httpClient.name}"`,
        );

      if (!config.httpClient.export)
        errors.push(
          `httpClient.export is required for "${config.httpClient.name}"`,
        );
    }
  }

  // fileNaming
  if (config.fileNaming && !NAMING_VALUES.includes(config.fileNaming)) {
    errors.push(
      `fileNaming must be one of: ${NAMING_VALUES.map((v) => `"${v}"`).join(' | ')}`,
    );
  }

  // enumStyle
  if (config.enumStyle && !ENUM_STYLE_VALUES.includes(config.enumStyle)) {
    errors.push(
      `enumStyle must be one of: ${ENUM_STYLE_VALUES.map((v) => `"${v}"`).join(' | ')}`,
    );
  }

  // plugins
  if (config.plugins && !Array.isArray(config.plugins)) {
    errors.push(`plugins must be an array`);
  }

  if (Array.isArray(config.plugins) && config.plugins.length > 0) {
    const TYPE_PLUGINS = ['zod', 'valibot', 'yup'];

    // Duplicate plugin names
    const names = config.plugins.map((p) => p.name);
    const duplicateNames = names.filter((n, i) => names.indexOf(n) !== i);
    for (const name of [...new Set(duplicateNames)]) {
      errors.push(`plugin "${name}" is listed more than once`);
    }

    // Duplicate output filenames (would silently overwrite each other)
    const fileNames = config.plugins.map((p) => p.fileName);
    const duplicateFiles = fileNames.filter((f, i) => fileNames.indexOf(f) !== i);
    for (const fileName of [...new Set(duplicateFiles)]) {
      errors.push(
        `plugins output to the same file "${fileName}.ts" — only the last one would be written`,
      );
    }

    // Multiple type-emitting validation plugins
    const typePlugins = config.plugins.filter(
      (p) => TYPE_PLUGINS.includes(p.name) && p.withTypes !== false,
    );
    if (typePlugins.length > 1) {
      errors.push(
        `plugins [${typePlugins.map((p) => p.name).join(', ')}] all emit TypeScript types — use only one, or set withTypes: false on the others`,
      );
    }
  }

  // errorHandling
  if (
    config.errorHandling &&
    typeof config.errorHandling !== 'boolean' &&
    typeof config.errorHandling !== 'object'
  ) {
    errors.push(
      `errorHandling must be boolean or { path: string, export: string }`,
    );
  }
  if (config.errorHandling && typeof config.errorHandling === 'object') {
    if (!config.errorHandling.path) {
      errors.push(`errorHandling.path is required`);
    }
    if (!config.errorHandling.export) {
      errors.push(`errorHandling.export is required`);
    }
  }

  // cliLogging
  if (config.cliLogging && typeof config.cliLogging !== 'object') {
    errors.push(`cliLogging must be an object`);
  }

  if (
    config.cliLogging &&
    config.cliLogging.level !== undefined &&
    !LOG_LEVEL_VALUES.includes(config.cliLogging.level)
  ) {
    errors.push(
      `cliLogging.level must be one of: ${LOG_LEVEL_VALUES.map((v) => `"${v}"`).join(' | ')}`,
    );
  }

  // formatter
  if (config.formatter && !FORMATTER_VALUES.includes(config.formatter)) {
    errors.push(
      `formatter must be one of: ${FORMATTER_VALUES.map((v) => `"${v}"`).join(' | ')}`,
    );
  }

  // typeStyle
  if (config.typeStyle && !TYPE_STYLE_VALUES.includes(config.typeStyle)) {
    errors.push(
      `typeStyle must be one of: ${TYPE_STYLE_VALUES.map((v) => `"${v}"`).join(' | ')}`,
    );
  }

  // functionNaming
  if (config.functionNaming && !NAMING_VALUES.includes(config.functionNaming)) {
    errors.push(
      `functionNaming must be one of: ${NAMING_VALUES.map((v) => `"${v}"`).join(' | ')}`,
    );
  }

  // baseUrl
  if (config.baseUrl !== undefined && typeof config.baseUrl !== 'string') {
    errors.push(`baseUrl must be a string`);
  }

  // index
  if (config.index !== undefined && typeof config.index !== 'boolean') {
    errors.push(`index must be a boolean`);
  }

  // validate
  if (config.validate !== undefined && typeof config.validate !== 'boolean') {
    errors.push(`validate must be a boolean`);
  }

  // filter
  if (config.filter !== undefined) {
    if (typeof config.filter !== 'object' || Array.isArray(config.filter)) {
      errors.push(`filter must be an object`);
    } else {
      if (config.filter.tags !== undefined && !Array.isArray(config.filter.tags)) {
        errors.push(`filter.tags must be an array of strings`);
      }
      if (config.filter.exclude !== undefined && !Array.isArray(config.filter.exclude)) {
        errors.push(`filter.exclude must be an array of strings`);
      }
      if (config.filter.deprecated !== undefined && typeof config.filter.deprecated !== 'boolean') {
        errors.push(`filter.deprecated must be a boolean`);
      }
    }
  }

  // rename
  if (config.rename !== undefined) {
    if (typeof config.rename !== 'object' || Array.isArray(config.rename)) {
      errors.push(`rename must be an object (Record<string, string>)`);
    } else {
      const invalidValues = Object.entries(config.rename).filter(([, v]) => typeof v !== 'string');
      if (invalidValues.length > 0) {
        errors.push(
          `rename values must be strings — invalid keys: ${invalidValues.map(([k]) => `"${k}"`).join(', ')}`,
        );
      }
    }
  }

  // hooks
  if (config.hooks !== undefined) {
    if (typeof config.hooks !== 'object' || Array.isArray(config.hooks)) {
      errors.push(`hooks must be an object`);
    } else if (
      config.hooks.afterAllFilesWrite !== undefined &&
      typeof config.hooks.afterAllFilesWrite !== 'string'
    ) {
      errors.push(`hooks.afterAllFilesWrite must be a string (shell command)`);
    }
  }

  // versioning
  if (config.versioning !== undefined) {
    if (typeof config.versioning !== 'object' || Array.isArray(config.versioning)) {
      errors.push(`versioning must be an object`);
    } else {
      if (config.versioning.enabled !== undefined && typeof config.versioning.enabled !== 'boolean') {
        errors.push(`versioning.enabled must be a boolean`);
      }
      if (config.versioning.storage !== undefined && typeof config.versioning.storage !== 'string') {
        errors.push(`versioning.storage must be a string (directory path)`);
      }
      if (config.versioning.saveSpec !== undefined && typeof config.versioning.saveSpec !== 'boolean') {
        errors.push(`versioning.saveSpec must be a boolean`);
      }
      if (config.versioning.maxSaves !== undefined) {
        if (typeof config.versioning.maxSaves !== 'number' || config.versioning.maxSaves < 1) {
          errors.push(`versioning.maxSaves must be a positive number`);
        }
      }
      if (config.versioning.pinVersions !== undefined) {
        if (!Array.isArray(config.versioning.pinVersions)) {
          errors.push(`versioning.pinVersions must be an array of snapshot IDs`);
        } else if (config.versioning.pinVersions.some((v) => typeof v !== 'string')) {
          errors.push(`versioning.pinVersions must contain only strings`);
        }
      }
      if (config.versioning.aliasTemplate !== undefined && typeof config.versioning.aliasTemplate !== 'string') {
        errors.push(`versioning.aliasTemplate must be a string`);
      }
    }
  }

  // comment
  if (config.comment !== undefined && typeof config.comment !== 'string') {
    errors.push(`comment must be a string`);
  }

  // cache
  if (config.cache !== undefined && typeof config.cache !== 'boolean') {
    errors.push(`cache must be a boolean`);
  }

  // boolean flags
  for (const key of ['rawResponse', 'apiLogging', 'endpointsMap'] as const) {
    if (config[key] !== undefined && typeof config[key] !== 'boolean') {
      errors.push(`${key} must be a boolean`);
    }
  }

  if (errors.length > 0) throw new ConfigValidationError(errors);
};
