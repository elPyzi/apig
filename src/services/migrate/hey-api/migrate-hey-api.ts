import { dirname, extname } from 'path';
import type { UserConfig } from '@hey-api/openapi-ts';
import type { EnumStyle, Formatter } from '@models';
import { dedupeOutputPaths, isUrl, rebasePath } from '../paths';
import { buildPlugins, type Features } from '../plugins';
import type { MigratedProject } from '../types';

type Loose = Record<string, unknown>;

const asObject = (value: unknown): Loose | undefined =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Loose)
    : undefined;

const TANSTACK_PLUGINS: Record<string, string> = {
  '@tanstack/react-query': 'react',
  '@tanstack/vue-query': 'vue',
  '@tanstack/svelte-query': 'svelte',
  '@tanstack/solid-query': 'solid',
};

const CLIENTS_NEEDING_INSTANCE: Record<string, string> = {
  '@hey-api/client-axios': 'axios',
  '@hey-api/client-ky': 'ky',
  '@hey-api/client-ofetch': 'ofetch',
};

/** What hey-api generates when `plugins` is left out. */
const DEFAULT_PLUGINS = ['@hey-api/typescript', '@hey-api/sdk'];

const FORMATTERS: Record<string, Formatter> = {
  prettier: 'prettier',
  biome: 'biome',
  'biome:format': 'biome',
  'biome:check': 'biome',
  oxfmt: 'oxfmt',
};

const ENUM_STYLES: Record<string, EnumStyle> = {
  javascript: 'const',
  typescript: 'enum',
  'typescript-const': 'enum',
};

/** One input/output pair from a hey-api config. */
interface Job {
  input: unknown;
  output: unknown;
}

/**
 * hey-api merges an array of inputs into one output, unless `output` is an
 * array of the same length — then each input is its own job.
 */
const splitJobs = (config: UserConfig, notes: string[]): Job[] => {
  const inputs = Array.isArray(config.input) ? config.input : [config.input];
  const outputs = Array.isArray(config.output)
    ? config.output
    : [config.output];
  if (inputs.length > 1 && inputs.length === outputs.length)
    return inputs.map((input, i) => ({ input, output: outputs[i] }));
  if (inputs.length > 1)
    notes.push(
      `hey-api merged ${inputs.length} specs into one output; apig reads one — only the first is used`,
    );
  return [{ input: inputs[0], output: outputs[0] }];
};

const readInput = (
  input: unknown,
  configDir: string,
  project: MigratedProject,
) => {
  const options = asObject(input);
  // a parsed spec object passed inline has no `path`, only OpenAPI fields
  const path =
    typeof input === 'string'
      ? input
      : typeof options?.path === 'string'
        ? options.path
        : undefined;

  if (path === undefined) {
    project.notes.push(
      'the spec was an inline object in the hey-api config — point input at a file or URL',
    );
  } else if (
    isUrl(path) ||
    extname(path) ||
    path.startsWith('.') ||
    path.startsWith('/')
  ) {
    project.input = rebasePath(path, configDir);
  } else {
    project.input = path;
    project.notes.push(
      `input "${path}" is a hey-api API registry shorthand — replace it with the spec's URL`,
    );
  }

  const headers = asObject(asObject(options?.fetch)?.headers);
  if (
    headers &&
    Object.keys(headers).some((h) => h.toLowerCase() === 'authorization')
  )
    project.notes.push(
      'the spec was fetched with an Authorization header — for basic auth set auth: { username, password }, read from environment variables',
    );
};

const readFilters = (config: UserConfig, project: MigratedProject) => {
  // `parser.filters` today, `input.filters` in older releases
  const filters =
    asObject(asObject((config as Loose).parser)?.filters) ??
    asObject(asObject(config.input)?.filters);
  if (!filters) return;

  const tags = asObject(filters.tags);
  const strings = (value: unknown) =>
    Array.isArray(value)
      ? value.filter((v): v is string => typeof v === 'string')
      : [];
  const include = strings(tags?.include);
  const exclude = strings(tags?.exclude);
  if (include.length || exclude.length)
    project.filter = {
      ...(include.length ? { tags: include } : {}),
      ...(exclude.length ? { exclude } : {}),
      // a filter makes apig drop deprecated operations; hey-api keeps them
      deprecated: filters.deprecated !== false,
    };
  else if (filters.deprecated === false) project.filter = { deprecated: false };
  if (filters.operations || filters.schemas || filters.parameters)
    project.notes.push(
      'filters on operations, schemas or parameters have no apig equivalent — apig filters by tag',
    );
};

const readOutput = (
  output: unknown,
  configDir: string,
  project: MigratedProject,
) => {
  const options = asObject(output);
  const path = typeof output === 'string' ? output : options?.path;
  project.output = {
    path: rebasePath(
      typeof path === 'string' ? path : './src/client',
      configDir,
    ),
    // hey-api empties the output folder by default
    clean: options?.clean !== false,
  };
  if (options?.indexFile === false || options?.entryFile === false)
    project.index = false;

  const processors = [
    ...(Array.isArray(options?.postProcess) ? options.postProcess : []),
    options?.format,
  ];
  const formatter = processors
    .map((p) => (typeof p === 'string' ? FORMATTERS[p] : undefined))
    .find(Boolean);
  if (formatter) project.formatter = formatter;
};

const readPlugins = (config: UserConfig, project: MigratedProject) => {
  const entries = (config.plugins ?? DEFAULT_PLUGINS) as unknown[];
  const features: Features = {};
  let client = '@hey-api/client-fetch';

  for (const entry of entries) {
    const options = asObject(entry) ?? {};
    const name = typeof entry === 'string' ? entry : String(options.name ?? '');

    if (name === '@hey-api/typescript') {
      const enums = options.enums;
      const enumOptions = asObject(enums);
      const mode =
        enums === true
          ? 'javascript'
          : typeof enums === 'string'
            ? enums
            : enumOptions?.mode;
      const enabled = enumOptions ? enumOptions.enabled !== false : !!enums;
      // without enums hey-api writes unions; apig defaults to const objects
      project.enumStyle =
        enabled && typeof mode === 'string'
          ? (ENUM_STYLES[mode] ?? 'const')
          : 'union';
      if (project.enumStyle === 'const') delete project.enumStyle;
    } else if (name === '@hey-api/sdk') {
      features.requests = true;
      if (options.asClass)
        project.notes.push(
          'hey-api generated an SDK class; apig generates standalone request functions',
        );
    } else if (name.startsWith('@hey-api/client-')) {
      client = name;
      if (typeof options.baseUrl === 'string')
        project.baseUrl = options.baseUrl;
    } else if (TANSTACK_PLUGINS[name]) {
      features.tanstack = { framework: TANSTACK_PLUGINS[name] };
    } else if (name === 'swr') {
      features.swr = true;
    } else if (name === 'zod') {
      features.zod = true;
    } else if (name === 'valibot') {
      features.valibot = true;
    } else if (name === '@faker-js/faker') {
      features.faker = true;
    } else if (name === 'msw') {
      features.msw = true;
    } else if (name === '@hey-api/schemas') {
      project.notes.push(
        '@hey-api/schemas (JSON Schema exports) has no apig equivalent — zod() or valibot() validate at runtime instead',
      );
    } else if (name === '@hey-api/transformers') {
      project.notes.push(
        '@hey-api/transformers (e.g. string → Date) has no apig equivalent',
      );
    } else if (name) {
      project.notes.push(
        `hey-api plugin ${name} has no apig equivalent and was dropped`,
      );
    }
  }

  const instanceClient = CLIENTS_NEEDING_INSTANCE[client];
  if (
    instanceClient &&
    (features.requests || features.tanstack || features.swr)
  ) {
    project.notes.push(
      `hey-api used ${client}; apig takes a client instance — set httpClient: { name: '${instanceClient}', path, export } to a module exporting one, until then requests use fetch`,
    );
  } else if (client !== '@hey-api/client-fetch') {
    project.notes.push(`${client} has no apig equivalent — requests use fetch`);
  }

  project.plugins = buildPlugins(features);
};

/** Translates every job in a hey-api config into an apig config. */
export const migrateHeyApi = (
  configs: UserConfig[],
  configPath: string,
): MigratedProject[] => {
  const configDir = dirname(configPath);
  const projects: MigratedProject[] = [];

  for (const config of configs) {
    const shared: string[] = [];
    for (const job of splitJobs(config, shared)) {
      const project: MigratedProject = {
        input: './openapi.json',
        output: { path: './src/client', clean: true },
        plugins: [],
        notes: [...shared],
      };
      readInput(job.input, configDir, project);
      readOutput(job.output, configDir, project);
      readFilters(config, project);
      readPlugins(config, project);
      projects.push(project);
    }
  }

  if (projects.length > 1)
    projects.forEach((project, i) => {
      const base = project.output.path.split('/').filter(Boolean).pop();
      project.name = base && base !== '.' ? base : `project-${i + 1}`;
    });
  dedupeOutputPaths(projects);
  return projects;
};
