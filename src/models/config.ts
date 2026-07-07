import type { ApigPlugin } from './plugin';

export const LOG_LEVELS = {
  MINIMAL: 'minimal',
  NORMAL: 'normal',
  DETAILED: 'detailed',
} as const;

export type LogLevel = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];

export interface LoggingConfig {
  level?: LogLevel;
}

export interface GenerationStats {
  operations: number;
  schemas: number;
  createdFiles: number;
  updatedFiles: number;
  deletedFiles: number;
  startedAt: number;
  endedAt: number;
}

/**
 * Supported HTTP client libraries.
 */
export const HTTP_CLIENTS = {
  AXIOS: 'axios',
  FETCH: 'fetch',
  KY: 'ky',
  OFETCH: 'ofetch',
  WRETCH: 'wretch',
} as const;

export type HttpClients = (typeof HTTP_CLIENTS)[keyof typeof HTTP_CLIENTS];

/**
 * HTTP client configuration.
 * For axios, ky, and ofetch — path and export are required.
 * For fetch — path and export are optional.
 */
export interface HttpClient {
  /** HTTP client library to use. */
  name: HttpClients;
  /** Path to the file that exports the client instance. Required for axios, ky, ofetch. */
  path?: string;
  /** Named export of the client instance. Required for axios, ky, ofetch. */
  export?: string;
}

/**
 * Code formatter to apply after file generation.
 */
export const FORMATTERS = {
  PRETTIER: 'prettier',
  BIOME: 'biome',
  OXFMT: 'oxfmt',
  NONE: 'none',
} as const;

export type Formatter = (typeof FORMATTERS)[keyof typeof FORMATTERS];

/**
 * Naming convention for generated files and directories.
 */
export const NAMING_CASES = {
  KEBAB: 'kebab-case',
  CAMEL: 'camelCase',
  SNAKE: 'snake_case',
  PASCAL: 'PascalCase',
} as const;

export type NamingCase = (typeof NAMING_CASES)[keyof typeof NAMING_CASES];

/**
 * Controls how generated files are grouped.
 * - `none`: all files in a single directory
 * - `tags`: files grouped by OpenAPI tags
 * - `endpoints`: each endpoint in its own directory under a tag subdirectory
 * - `operations`: each endpoint in its own flat directory (no tag subdirectory)
 */
export const GROUP_BY = {
  NONE: 'none',
  TAGS: 'tags',
  ENDPOINTS: 'endpoints',
  OPERATIONS: 'operations',
} as const;

export type GroupBy = (typeof GROUP_BY)[keyof typeof GROUP_BY];

/**
 * Available code generation plugins.
 */
export const PLUGINS = {
  SDK: 'sdk',
  TYPESCRIPT: 'typescript',

  TANSTACK_QUERY: 'tanstack-query',
  SWR: 'swr',

  ZOD: 'zod',
  VALIBOT: 'valibot',
  YUP: 'yup',

  MSW: 'msw',
  FAKER: 'faker',
} as const;

export type Plugin = (typeof PLUGINS)[keyof typeof PLUGINS];

/**
 * Enum generation style.
 * - `union`: `type Status = 'active' | 'inactive'`
 * - `enum`: `enum Status { Active = 'active' }`
 * - `const`: `const Status = { Active: 'active' } as const`
 */
export const ENUM_STYLES = {
  UNION: 'union',
  ENUM: 'enum',
  CONST: 'const',
} as const;

export type EnumStyle = (typeof ENUM_STYLES)[keyof typeof ENUM_STYLES];

/**
 * Type declaration style for object schemas.
 * - `type`: `export type User = { ... }`
 * - `interface`: `export interface User { ... }`
 */
export const TYPE_STYLES = {
  TYPE: 'type',
  INTERFACE: 'interface',
} as const;

export type TypeStyle = (typeof TYPE_STYLES)[keyof typeof TYPE_STYLES];

/**
 * Plugin configuration with optional overrides.
 */

export const FAKER_LOCALES = {
  RU: 'ru',
  EN: 'en',
} as const;

export type FakerLocale = (typeof FAKER_LOCALES)[keyof typeof FAKER_LOCALES];

export interface Versioning {
  /** Enable snapshot versioning. Default: false. */
  enabled?: boolean;
  /** Directory to store snapshots. Default: ".apig/versions". */
  storage?: string;
  /** Save the original OpenAPI spec in each snapshot. Default: false. */
  saveSpec?: boolean;
  /** Maximum number of snapshots to keep. Oldest are removed first. Default: unlimited. */
  maxSaves?: number;
  /** Snapshot IDs that must never be automatically deleted when maxSaves is applied. */
  pinVersions?: string[];
  /**
   * Template for snapshot alias. Available variables: {generation}, {apiVersion}, {date}.
   * Default: "gen{generation}"
   * Examples: "v{apiVersion}-gen{generation}", "{date}-{generation}"
   */
  aliasTemplate?: string;
}

/**
 * Output path as a string or configuration object.
 * When specified as a string, clean defaults to true.
 */
export type Output =
  | string
  | {
      /** Output directory path. */
      path: string;
      /** Remove output directory before generation. Defaults to true. */
      clean?: boolean;
    };

/**
 * Filter configuration for selective endpoint generation.
 */
export interface FilterConfig {
  /** Generate only endpoints with these tags. */
  tags?: string[];
  /** Exclude endpoints with these tags. */
  exclude?: string[];
  /** Include deprecated endpoints. Defaults to false. */
  deprecated?: boolean;
}

/**
 * Lifecycle hooks executed at specific points during generation.
 */
export interface HooksConfig {
  /** Shell command to run after all files are written. */
  afterAllFilesWrite?: string;
}

/**
 * Result returned by each generator plugin.
 */
export interface PluginResult {
  code: string;
  exports: string[];
  typeExports: string[];
}

export type { ApigPlugin, PluginContext } from './plugin';

/**
 * Main configuration object for a single generation job.
 */
export interface ApigConfig {
  /**
   * Optional label for this generation job.
   * Shown in CLI output when multiple configs are used.
   * @example "weather-api"
   * @example "main"
   */
  name?: string;

  /**
   * OpenAPI spec source — file path, URL, or async function returning a URL.
   * @example "./openapi.json"
   * @example "https://api.example.com/openapi.json"
   * @example () => fetch('...').then(r => r.json())
   */
  input: string | (() => Promise<string>);

  /**
   * Output directory path or configuration object.
   * @example "./src/api"
   * @example { path: "./src/api", clean: true }
   */
  /** Output directory. Defaults to ".apig/generated" if not specified. */
  output?: Output;

  /**
   * HTTP client to use for generated SDK functions.
   * @default "fetch"
   * @example { name: "axios", path: "./lib/axios", export: "axiosInstance" }
   */
  httpClient?: HttpClient;

  /**
   * Plugins to run during generation.
   * @example [typescript(), sdk(), tanstackQuery()]
   */
  plugins?: ApigPlugin[];

  /**
   * Code formatter to apply after generation.
   * @default "none"
   */
  formatter?: Formatter;

  /**
   * Naming convention for generated files and directories.
   * @default "kebab-case"
   */
  fileNaming?: NamingCase;

  /**
   * Controls how generated files are grouped.
   * - `"none"` — all files in a single directory
   * - `"tags"` — files grouped by OpenAPI tags
   * - `"operations"` — each operation in its own flat directory
   * - `"endpoints"` — each operation in its own directory under a tag subdirectory
   * @default "none"
   */
  groupBy?: GroupBy;

  /**
   * Generate `index.ts` with named re-exports for all generated files.
   * @default true
   */
  index?: boolean;

  /**
   * Base URL prefix to prepend to all generated request paths.
   * @example "https://api.example.com"
   * @example "/api/v1"
   */
  baseUrl?: string;

  /**
   * Filter which endpoints to include in generation.
   * @example { tags: ["pet", "store"] }
   * @example { exclude: ["user"], deprecated: false }
   */
  filter?: FilterConfig;

  /**
   * Rename `operationId` values before generation.
   * @example { getPetById: "fetchPet", addPet: "createPet" }
   */
  rename?: Record<string, string>;

  /**
   * Validate the OpenAPI spec before generation.
   * @default true
   */
  validate?: boolean;

  /**
   * Lifecycle hooks executed at specific points during generation.
   * @example { afterAllFilesWrite: "prettier --write ./src/api" }
   */
  hooks?: HooksConfig;

  /**
   * Enum generation style.
   * - `"union"` — `type Status = 'active' | 'inactive'`
   * - `"enum"` — `enum Status { Active = 'active' }`
   * - `"const"` — `const Status = { Active: 'active' } as const`
   * @default "const"
   */
  enumStyle?: EnumStyle;

  /**
   * Type declaration style for object schemas.
   * - `"type"` — `export type User = { ... }`
   * - `"interface"` — `export interface User { ... }`
   * @default "type"
   */
  typeStyle?: TypeStyle;

  /**
   * Naming convention for generated SDK function names.
   * @default "camelCase"
   */
  functionNaming?: NamingCase;

  /**
   * Snapshot versioning — saves IR and spec snapshots for diffing and rollback.
   * @example { enabled: true, maxSaves: 10 }
   */
  versioning?: Versioning;

  /**
   * Optional comment attached to the generated snapshot.
   * @example "before auth refactor"
   */
  comment?: string;

  /**
   * Generate `endpoints.ts` with all API paths as a typed const map.
   * @default false
   */
  endpointsMap?: boolean;

  /**
   * Cache the parsed IR on disk (.apig/cache). On repeated runs, skips parsing
   * if the spec has not changed (uses ETag for URLs, hash for local files).
   * @default false
   */
  cache?: boolean;

  /**
   * Add `console.log(functionName, response)` to each generated SDK function.
   * @default false
   */
  apiLogging?: boolean;

  /**
   * Configure CLI logging verbosity.
   * @default { level: "normal" }
   */
  cliLogging?: LoggingConfig;

  /**
   * Enable error handling for all SDK functions.
   * - `true` (default) — generates built-in `ApigError` class
   * - `false` — disables error handling entirely
   * - `{ path, export }` — uses a custom error class from the given path
   * @default true
   * @example { path: "./lib/errors", export: "ApiError" }
   */
  errorHandling?: boolean | { path: string; export: string };

  /**
   * Return full response object `{ body, status, headers }` instead of just data.
   * @default false
   */
  rawResponse?: boolean;
}

/**
 * A value that can be provided directly, as a sync function, or as an async function.
 */
export type LazyOrAsync<T> = T | (() => Promise<T>) | (() => T);
