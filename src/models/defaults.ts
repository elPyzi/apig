import type {
  TanstackQueryOptions,
  SwrOptions,
  ZodOptions,
  ValibotOptions,
  YupOptions,
  FakerOptions,
} from './plugin';
import type { ApigConfig } from './config';

export const DEFAULTS = {
  CONFIG: {
    output: '.apig/generated',
    httpClient: {
      name: 'fetch',
    },
    formatter: 'none',
    fileNaming: 'kebab-case',
    groupBy: 'none',
    index: true,
    enumStyle: 'const',
    typeStyle: 'type',
    functionNaming: 'camelCase',
    endpointsMap: false,
    cache: false,
    apiLogging: false,
    rawResponse: false,
    errorHandling: true,
    cliLogging: { level: 'normal' },
  } satisfies Partial<ApigConfig>,

  PLUGINS: {
    TANSTACK: {
      query: true,
      mutation: true,
      infinite: false,
      suspense: false,
      queryKeysStyle: 'functions',
      hookGenerationStrategies: {},
      framework: 'react',
    } satisfies Required<TanstackQueryOptions>,

    SWR: {
      queryKeysStyle: 'functions',
      hookGenerationStrategies: {},
      framework: 'react',
    } satisfies Required<SwrOptions>,

    ZOD: {
      infer: true,
      input: false,
      output: false,
      validateResponse: false,
      withTypes: true,
      schemaSuffix: 'Schema',
    } satisfies Required<ZodOptions>,

    VALIBOT: {
      withTypes: true,
      schemaSuffix: 'Schema',
    } satisfies Required<ValibotOptions>,

    YUP: {
      withTypes: true,
      schemaSuffix: 'Schema',
    } satisfies Required<YupOptions>,

    FAKER: {
      locale: 'en',
    } satisfies Required<FakerOptions>,

    RHF: {
      schemaSuffix: 'Schema',
    },

    MCP: {
      name: 'apig',
      version: '1.0.0',
    },
  },
} as const;
