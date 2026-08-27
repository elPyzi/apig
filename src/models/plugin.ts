import type { IR } from './ir';
import type { ApigConfig, PluginResult, FakerLocale } from './config';

/**
 * Runtime context injected by the writer into operation-scoped plugins.
 * sdkImportPath changes per groupBy strategy:
 *   none      → './sdk'
 *   tags      → './<tag>.sdk'
 *   endpoints → './<operation>.sdk'
 */
export interface PluginContext {
  sdkImportPath: string;
  /** Import path to the shared query-keys file. Only set when queryKeysStyle="object". */
  queryKeysImportPath?: string;
  /** Import path to the shared config.ts file (ApigError, ApigResponse). */
  configImportPath?: string;
  /** Import path to the custom error class file, resolved relative to the generated file. */
  customErrorImportPath?: string;
  /** Import path to the custom HTTP client file, resolved relative to the generated file. */
  clientImportPath?: string;
}

export interface ExtraFile {
  fileName: string;
  code: string;
}

/**
 * Use: sdk(), typescript(), tanstackQuery(), zod(), …
 */
export interface ApigPlugin {
  /** Unique plugin name — used for deduplication and validation checks. */
  name: string;
  /** Base output filename without extension (e.g. "sdk" → "sdk.ts"). */
  fileName: string;
  /**
   * "root"       — generated once for the full IR (types, zod, faker, msw, …)
   * "operations" — called per group in groupBy=tags/endpoints (sdk, tanstack, swr)
   */
  scope: 'root' | 'operations';
  generate: (ir: IR, config: ApigConfig, ctx?: PluginContext) => PluginResult;
  /**
   * Optional: called once with the full IR after all groupBy writing.
   * Used to emit root-level shared files (e.g. query-keys.ts).
   */
  generateRootFiles?: (ir: IR, config: ApigConfig) => ExtraFile[];
  /**
   * Whether this plugin emits TypeScript type aliases.
   * When false, the writer will NOT suppress the typescript() plugin even if
   * this plugin is a validation plugin (zod/valibot/yup).
   * Default: true.
   */
  withTypes?: boolean;
  /**
   * Suffix this plugin appends to generated schema names.
   * Exposed so plugins that import those schemas (`rhf`, `mcp`) can resolve the
   * names without the user keeping two options in sync by hand.
   */
  schemaSuffix?: string;
}

/** Options for the `typescript()` plugin — generates TypeScript types from schemas. */
export interface TypescriptOptions {}

/** Options for the `sdk()` plugin — generates typed request functions. */
export interface SdkOptions {}

/** Options for the `zod()` plugin — generates Zod schemas. */
export interface ZodOptions {
  /**
   * Export TypeScript types inferred from schemas via `z.infer<typeof Schema>`.
   * Removes the need for a separate `typescript()` plugin.
   * @default false
   * @example infer: true  // export type Pet = z.infer<typeof PetSchema>
   */
  infer?: boolean;
  /**
   * Export `z.input<typeof Schema>` types (before transforms).
   * Only relevant when your schemas use `.transform()`.
   * @default false
   */
  input?: boolean;
  /**
   * Export `z.output<typeof Schema>` types (after transforms).
   * Only relevant when your schemas use `.transform()`.
   * @default false
   */
  output?: boolean;
  /**
   * Parse API responses through the generated Zod schema at runtime.
   * Adds a `.parse()` call inside each SDK function.
   * @default false
   */
  validateResponse?: boolean;
  /**
   * Include TypeScript type exports alongside Zod schemas.
   * Set to `false` when using alongside `typescript()` to avoid duplicate types.
   * @default true
   */
  withTypes?: boolean;
  /**
   * Suffix appended to every schema variable name.
   * Must match `schemaSuffix` in the `rhf()` plugin if used together.
   * @default "Schema"
   * @example schemaSuffix: "Schema"  // PetSchema, UserSchema
   */
  schemaSuffix?: string;
}

/** Options for the `valibot()` plugin — generates Valibot schemas. */
export interface ValibotOptions {
  /**
   * Include TypeScript type exports alongside Valibot schemas.
   * Set to `false` when using alongside `typescript()` to avoid duplicate types.
   * @default true
   */
  withTypes?: boolean;
  /**
   * Suffix appended to every schema variable name.
   * Must match `schemaSuffix` in the `rhf()` plugin if used together.
   * @default "Schema"
   * @example schemaSuffix: "Schema"  // PetSchema, UserSchema
   */
  schemaSuffix?: string;
}

/** Options for the `yup()` plugin — generates Yup schemas. */
export interface YupOptions {
  /**
   * Include TypeScript type exports alongside Yup schemas.
   * Set to `false` when using alongside `typescript()` to avoid duplicate types.
   * @default true
   */
  withTypes?: boolean;
  /**
   * Suffix appended to every schema variable name.
   * Must match `schemaSuffix` in the `rhf()` plugin if used together.
   * @default "Schema"
   * @example schemaSuffix: "Schema"  // PetSchema, UserSchema
   */
  schemaSuffix?: string;
}

/** Options for the `faker()` plugin — generates Faker.js factories. */
export interface FakerOptions {
  /**
   * Faker locale used for generating realistic fake data.
   * @default "en"
   * @example locale: "ru"
   */
  locale?: FakerLocale;
}

/** Options for the `msw()` plugin — generates Mock Service Worker handlers. */
export interface MswOptions {}

/**
 * How the generated `authedApi` fixture carries authentication into later calls.
 * - `"cookie"` — nothing to carry by hand: an `APIRequestContext` keeps its own
 *   cookie jar, so a `Set-Cookie` from the login call is replayed automatically.
 *   Works with httpOnly cookies, which a test can never read.
 * - `"bearer"` — the token is read out of the login response and sent as a
 *   header on every later call.
 */
export type PlaywrightAuthStrategy = 'cookie' | 'bearer';

/**
 * Payload posted to the login operation.
 *
 * Either a raw expression inlined into the generated file, or a named export
 * the generated file imports. Credentials never live in apig's config — where
 * they come from (env, a secret manager, a fixture file) stays yours.
 * @example '{ user: process.env.API_USER, pass: process.env.API_PASS }'
 * @example { import: 'authPayload', from: '../auth.config' }
 */
export type PlaywrightAuthPayload =
  | string
  | {
      /** Named export to import. */ import: string;
      /** Module to import it from. */ from: string;
    };

/** Authenticated-fixture options for the `playwright()` plugin. */
export interface PlaywrightAuthFixtureOptions {
  /**
   * `operationId` of the login endpoint. The fixture is only emitted into files
   * that actually contain this operation — with `groupBy`, that is the group it
   * belongs to.
   * @example login: "loginUser"
   */
  login: string;
  /**
   * How authentication is carried into later calls.
   * @default "cookie"
   */
  strategy?: PlaywrightAuthStrategy;
  /**
   * Property of the login response holding the token. Only used by `"bearer"`.
   * @default "token"
   * @example tokenPath: "accessToken"
   */
  tokenPath?: string;
  /** Payload posted to the login operation. */
  payload: PlaywrightAuthPayload;
  /**
   * Header the bearer token is sent in. Only used by `"bearer"`.
   * @default "Authorization"
   */
  header?: string;
  /**
   * Name of the generated authenticated fixture.
   * @default "authedApi"
   */
  fixtureName?: string;
}

/** Options for the `playwright()` plugin — generates a typed Playwright API client. */
export interface PlaywrightOptions {
  /**
   * Name of the exported `test` built with `test.extend()`.
   * Under `groupBy`, each group prefixes it with its own name to keep the
   * barrel file free of duplicate exports (`petsApigPlaywrightTest`).
   * @default "apigPlaywrightTest"
   */
  testName?: string;
  /**
   * Name of the fixture holding the client — what a test destructures.
   * @default "api"
   * @example fixtureName: "sdk"  // test('…', async ({ sdk }) => …)
   */
  fixtureName?: string;
  /**
   * Base URL prefixed to every request path. Overrides the top-level `baseUrl`.
   * Leave unset to rely on `baseURL` from `playwright.config.ts`.
   * @example baseUrl: "https://staging.example.com"
   */
  baseUrl?: string;
  /**
   * Re-export the Faker factories for request bodies as `sample<Operation>()`.
   * Requires the `faker()` plugin.
   * @default false
   * @example withFaker: true  // const body = sampleCreatePet()
   */
  withFaker?: boolean;
  /** Emit an extra fixture that logs in before handing the client over. */
  authFixture?: PlaywrightAuthFixtureOptions;
}

/** Options for the `mcp()` plugin — generates an MCP server over the SDK. */
export interface McpOptions {
  /**
   * Server name reported to the MCP client.
   * @default "apig"
   */
  name?: string;
  /**
   * Server version reported to the MCP client.
   * @default "1.0.0"
   */
  version?: string;
}

export const QUERY_KEYS_STYLE = {
  FUNCTIONS: 'functions',
  OBJECT: 'object',
} as const;

export type QueryKeysStyle =
  (typeof QUERY_KEYS_STYLE)[keyof typeof QUERY_KEYS_STYLE];

/** Framework target for TanStack Query code generation. */
export type TanstackFramework = 'react' | 'vue' | 'solid' | 'svelte';

/** Framework target for SWR code generation. */
export type SwrFramework = 'react' | 'vue';

/**
 * Per-operation hook generation overrides for `tanstackQuery()`.
 * Each field overrides the top-level plugin option for this specific operation.
 * @example { searchPets: { query: true, mutation: false } }
 */
export interface TanstackHookStrategy {
  /** Generate a `useQuery` hook for this operation. */
  query?: boolean;
  /** Generate a `useMutation` hook for this operation. */
  mutation?: boolean;
  /** Generate a `useInfiniteQuery` hook for this operation. */
  infinite?: boolean;
  /** Generate a `useSuspenseQuery` hook for this operation. */
  suspense?: boolean;
}

/**
 * Per-operation hook generation overrides for `swr()`.
 * Each field overrides the top-level plugin option for this specific operation.
 * @example { searchPets: { query: true, mutation: false } }
 */
export interface SwrHookStrategy {
  /** Generate a `useSWR` query hook for this operation. */
  query?: boolean;
  /** Generate a `useSWRMutation` hook for this operation. */
  mutation?: boolean;
}

/** Options for the `tanstackQuery()` plugin — generates TanStack Query hooks. */
export interface TanstackQueryOptions {
  /** Generate useQuery hooks for GET operations. Default: true. */
  query?: boolean;
  /** Generate useMutation hooks for non-GET operations. Default: true. */
  mutation?: boolean;
  /** Generate useInfiniteQuery hooks (useInfinity* prefix) for GET operations. Default: false. */
  infinite?: boolean;
  /** Generate useSuspenseQuery hooks (useSuspense* prefix) for GET operations. Default: false. */
  suspense?: boolean;
  /**
   * Query key generation style.
   * - "functions": export individual key functions inline in each hook file.
   * - "object": emit a shared query-keys.ts at the output root with all keys.
   * Default: "functions".
   */
  queryKeysStyle?: QueryKeysStyle;
  /**
   * Per-operation overrides for hook generation.
   * Useful when a POST is used as a search endpoint and should generate a query hook.
   * @example { searchPets: { query: true } }
   */
  hookGenerationStrategies?: Record<string, TanstackHookStrategy>;
  /**
   * Target framework for generated hooks.
   * - `"react"` — `@tanstack/react-query` (default)
   * - `"vue"`   — `@tanstack/vue-query`
   * - `"solid"` — `@tanstack/solid-query` (uses `create*` prefix)
   * - `"svelte"` — `@tanstack/svelte-query` (uses `create*` prefix)
   * @default "react"
   */
  framework?: TanstackFramework;
}

/** Resolver type for React Hook Form. */
export type RhfResolver = 'zod' | 'valibot' | 'yup';

/** Options for the `rhf()` plugin — generates React Hook Form resolvers. */
export interface RhfOptions {
  /**
   * Validation library to use for resolver generation. **Required.**
   * A matching validation plugin (`zod()`, `valibot()`, or `yup()`) must also be in your plugins list.
   * @example resolver: "zod"
   */
  resolver: RhfResolver;
  /**
   * Schema variable suffix — must match `schemaSuffix` in the validation plugin.
   * @default "Schema"
   * @example schemaSuffix: "Schema"  // looks for PetSchema, UserSchema, …
   */
  schemaSuffix?: string;
  /**
   * Custom import path for the generated schemas file.
   * @default "./<resolver>"  // e.g. "./zod", "./valibot", "./yup"
   * @example schemasImportPath: "../validation/zod"
   */
  schemasImportPath?: string;
}

/** Options for the `swr()` plugin — generates SWR hooks. */
export interface SwrOptions {
  /**
   * Query key generation style.
   * - "functions": export individual key functions inline in each hook file.
   * - "object": emit a shared query-keys.ts at the output root with all keys.
   * Default: "functions".
   */
  queryKeysStyle?: QueryKeysStyle;
  /**
   * Per-operation overrides for hook generation.
   * Useful when a POST is used as a search endpoint and should generate a query hook.
   * @example { searchPets: { query: true } }
   */
  hookGenerationStrategies?: Record<string, SwrHookStrategy>;
  /**
   * Target framework for generated hooks.
   * - `"react"` — `swr` (default)
   * - `"vue"`   — `swrv`
   * @default "react"
   */
  framework?: SwrFramework;
}
