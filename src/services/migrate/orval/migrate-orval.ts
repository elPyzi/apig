import { dirname, extname, join } from 'path';
import type { Config, Options, OptionsExport } from 'orval';
import type { EnumStyle, Formatter, GroupBy, NamingCase } from '@models';
import { dedupeOutputPaths, rebasePath } from '../paths';
import { buildPlugins, type Features } from '../plugins';
import type { MigratedProject } from '../types';

type Loose = Record<string, unknown>;

const asObject = (value: unknown): Loose | undefined =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Loose)
    : undefined;

const GROUP_BY: Record<string, GroupBy> = {
  single: 'none',
  split: 'none',
  tags: 'tags',
  'tags-split': 'tags',
  'tags-operations': 'endpoints',
  'tags-operations-split': 'endpoints',
};

const TANSTACK_FRAMEWORKS: Record<string, string> = {
  'react-query': 'react',
  'vue-query': 'vue',
  'svelte-query': 'svelte',
  'solid-query': 'solid',
};

const FORMATTERS = ['prettier', 'biome', 'oxfmt'];
const NAMING = ['camelCase', 'PascalCase', 'snake_case', 'kebab-case'];
const ENUM_STYLES = ['const', 'enum', 'union'];

const resolveProject = async (value: OptionsExport): Promise<Options> =>
  typeof value === 'function' ? await value() : await value;

const readInput = (
  input: Options['input'],
  configDir: string,
  project: MigratedProject,
) => {
  const options = asObject(input);
  let target: unknown = options ? options.target : input;

  if (Array.isArray(target)) {
    project.notes.push(
      `orval merged ${target.length} specs; apig reads one — only the first is used`,
    );
    target = target[0];
  }
  if (typeof target === 'string') {
    project.input = rebasePath(target, configDir);
  } else {
    project.notes.push(
      'the spec was an inline object in the orval config — point input at a file or URL',
    );
  }

  if (!options) return;

  const filters = asObject(options.filters);
  const tags = Array.isArray(filters?.tags) ? filters.tags : [];
  const names = tags.filter((t): t is string => typeof t === 'string');
  if (names.length < tags.length)
    project.notes.push(
      'RegExp tag filters have no apig equivalent and were dropped',
    );
  if (names.length)
    project.filter =
      filters?.mode === 'exclude' ? { exclude: names } : { tags: names };
  if (filters?.schemas)
    project.notes.push('input.filters.schemas has no apig equivalent');

  if (asObject(options.override)?.transformer)
    project.notes.push(
      'input.override.transformer has no apig equivalent — use `rename` or `filter`',
    );
  if (options.parserOptions)
    project.notes.push(
      'input.parserOptions was not migrated — for a spec behind basic auth, set `auth: { username, password }`',
    );
};

const readHooks = (hooks: Options['hooks'], project: MigratedProject) => {
  const raw = hooks?.afterAllFilesWrite;
  if (!raw) return;
  const commands: string[] = [];
  let skipped = false;
  for (const entry of Array.isArray(raw) ? raw : [raw]) {
    const command =
      typeof entry === 'string' ? entry : asObject(entry)?.command;
    if (typeof command === 'string') commands.push(command);
    else skipped = true;
  }
  if (commands.length)
    project.hooks = { afterAllFilesWrite: commands.join(' && ') };
  if (skipped)
    project.notes.push(
      'function hooks in afterAllFilesWrite cannot be expressed as a shell command and were dropped',
    );
};

const outputDir = (output: Loose, configDir: string): string => {
  const target = typeof output.target === 'string' ? output.target : '.';
  const workspace =
    typeof output.workspace === 'string' ? output.workspace : undefined;
  const joined = workspace ? join(workspace, target) : target;
  return rebasePath(extname(target) ? dirname(joined) : joined, configDir);
};

const readMock = (mock: unknown): { faker: boolean; msw: boolean } => {
  if (mock === true) return { faker: true, msw: true };
  const options = asObject(mock);
  if (!options) return { faker: false, msw: false };
  const generators = Array.isArray(options.generators)
    ? options.generators.map((g) => asObject(g)?.type)
    : undefined;
  const types = [options.type, ...(generators ?? [])];
  // an object without a type is orval's msw default
  const msw = types.includes('msw') || (!options.type && !generators);
  return { faker: msw || types.includes('faker'), msw };
};

const migrateProject = (
  name: string,
  options: Options,
  configDir: string,
  single: boolean,
): MigratedProject => {
  const project: MigratedProject = {
    name: single ? undefined : name,
    input: './openapi.json',
    output: { path: './src/api', clean: false },
    plugins: [],
    notes: [],
  };

  readInput(options.input, configDir, project);
  readHooks(options.hooks, project);

  const output: Loose =
    typeof options.output === 'string'
      ? { target: options.output }
      : ((options.output as Loose | undefined) ?? {});
  const override = asObject(output.override) ?? {};
  const query = asObject(override.query) ?? {};

  project.output = {
    path: outputDir(output, configDir),
    clean: !!output.clean,
  };

  const mode = typeof output.mode === 'string' ? output.mode : 'single';
  const groupBy = GROUP_BY[mode];
  if (groupBy && groupBy !== 'none') project.groupBy = groupBy;

  const client = output.client ?? 'axios-functions';
  const features: Features = { requests: true };
  if (typeof client === 'function') {
    project.notes.push('a custom client function has no apig equivalent');
  } else if (typeof client === 'string' && TANSTACK_FRAMEWORKS[client]) {
    features.tanstack = {
      framework: TANSTACK_FRAMEWORKS[client],
      infinite: !!(query.useInfinite || query.useSuspenseInfiniteQuery),
      suspense: !!query.useSuspenseQuery,
    };
  } else if (client === 'swr') {
    features.swr = true;
  } else if (client === 'zod') {
    features.requests = false;
    features.zod = true;
  } else if (client === 'mcp') {
    features.mcp = true;
  } else if (
    client !== 'fetch' &&
    client !== 'axios' &&
    client !== 'axios-functions'
  ) {
    project.notes.push(
      `orval client "${String(client)}" has no apig equivalent — plain request functions are generated instead`,
    );
  }

  const usesAxios =
    client === 'axios' ||
    client === 'axios-functions' ||
    output.httpClient === 'axios';
  const mutator = override.mutator;
  const mutatorPath =
    typeof mutator === 'string' ? mutator : asObject(mutator)?.path;
  if (typeof mutatorPath === 'string') {
    const from =
      typeof output.workspace === 'string'
        ? rebasePath(output.workspace, configDir)
        : configDir;
    const mutatorName = asObject(mutator)?.name ?? 'default export';
    project.notes.push(
      `orval mutator ${rebasePath(mutatorPath, from)} (${String(mutatorName)}) is a request function; apig takes the client instance itself — point httpClient at the module exporting it, e.g. { name: 'axios', path, export }`,
    );
  } else if (usesAxios && features.requests) {
    project.notes.push(
      "orval used axios's default instance; apig needs a module that exports one — set httpClient: { name: 'axios', path, export }, until then requests use fetch",
    );
  }

  const mock = readMock(output.mock);
  features.faker = mock.faker;
  features.msw = mock.msw;
  project.plugins = buildPlugins(features);

  if (typeof output.baseUrl === 'string') project.baseUrl = output.baseUrl;
  else if (output.baseUrl)
    project.notes.push(
      'output.baseUrl as an object was not migrated — set baseUrl',
    );

  const formatter = [
    output.formatter,
    output.prettier && 'prettier',
    output.biome && 'biome',
  ].find((f) => typeof f === 'string' && FORMATTERS.includes(f));
  if (formatter) project.formatter = formatter as Formatter;

  if (
    typeof output.namingConvention === 'string' &&
    NAMING.includes(output.namingConvention)
  )
    project.fileNaming = output.namingConvention as NamingCase;
  if (output.indexFiles === false) project.index = false;

  const enumStyle = override.enumGenerationType;
  if (
    typeof enumStyle === 'string' &&
    ENUM_STYLES.includes(enumStyle) &&
    enumStyle !== 'const'
  )
    project.enumStyle = enumStyle as EnumStyle;
  // orval writes interfaces unless told otherwise; apig defaults to type aliases
  if (!override.useTypeOverInterfaces) project.typeStyle = 'interface';

  if (output.schemas)
    project.notes.push(
      'orval wrote schemas to a separate directory; apig writes types.ts into the output directory',
    );
  if (override.operationName || query.operationName)
    project.notes.push(
      'override.operationName has no apig equivalent — use `rename` for individual operations',
    );
  if (override.transformer)
    project.notes.push('override.transformer has no apig equivalent');

  // a filter makes apig drop deprecated operations; orval keeps them unless
  // useDeprecatedOperations is turned off
  const keepDeprecated = override.useDeprecatedOperations !== false;
  if (project.filter) project.filter.deprecated = keepDeprecated;
  else if (!keepDeprecated) project.filter = { deprecated: false };

  return project;
};

/** Translates every project in an orval config into an apig config. */
export const migrateOrval = async (
  config: Config,
  configPath: string,
): Promise<MigratedProject[]> => {
  const configDir = dirname(configPath);
  const entries = Object.entries(config).filter(
    (entry): entry is [string, OptionsExport] =>
      entry[0] !== 'logLevel' && !!entry[1],
  );
  const projects: MigratedProject[] = [];
  for (const [name, value] of entries) {
    const options = await resolveProject(value);
    projects.push(
      migrateProject(name, options, configDir, entries.length === 1),
    );
  }
  dedupeOutputPaths(projects);
  return projects;
};
