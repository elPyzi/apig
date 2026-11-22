import type {
  TanstackQueryOptions,
  SwrOptions,
  ZodOptions,
  ValibotOptions,
  YupOptions,
  FakerOptions,
} from './plugin';
import { LOG_LEVELS } from './config';
import type { ZvyappyConfig } from './config';

export const DEFAULTS = {
  CONFIG: {
    output: '.zvyappy/generated',
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
    // `minimal` is what the CLI has always done — the constant said `normal`
    // but nothing read it, so the writer's own fallback was the real default
    cliLogging: { level: LOG_LEVELS.MINIMAL },
  } satisfies Partial<ZvyappyConfig>,

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
      name: 'zvyappy',
      version: '1.0.0',
    },
  },
} as const;
