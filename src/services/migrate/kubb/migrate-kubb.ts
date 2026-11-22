import type { UserConfig } from 'kubb';
import type { EnumStyle, Formatter } from '@models';
import { dedupeOutputPaths, rebasePath } from '../paths';
import { buildPlugins, type Features } from '../plugins';
import type { MigratedProject } from '../types';

type Loose = Record<string, unknown>;

const asObject = (value: unknown): Loose | undefined =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Loose)
    : undefined;

const ENUM_STYLES: Record<string, EnumStyle> = {
  asConst: 'const',
  asPascalConst: 'const',
  enum: 'enum',
  constEnum: 'enum',
  literal: 'union',
  inlineLiteral: 'union',
};

const TANSTACK_PLUGINS: Record<string, string> = {
  'plugin-react-query': 'react',
  'plugin-vue-query': 'vue',
  'plugin-svelte-query': 'svelte',
  'plugin-solid-query': 'solid',
};

/** Plugins with no generated output of their own. */
const SILENT_PLUGINS = new Set(['plugin-oas', 'plugin-barrel']);

const FORMATTERS = ['prettier', 'biome', 'oxfmt'];

const readClient = (
  pluginName: string,
  options: Loose,
  project: MigratedProject,
) => {
  if (typeof options.baseURL === 'string') project.baseUrl = options.baseURL;
  if (options.dataReturnType === 'full' || options.returnType === 'full')
    project.rawResponse = true;

  // v4: `client: 'axios' | 'fetch'` (axios by default); v5: plugin-axios / plugin-fetch,
  // with plugin-client reserved for a custom client module at `importPath`
  const axios =
    pluginName === 'plugin-axios' ||
    (pluginName === 'plugin-client' &&
      !options.importPath &&
      options.client !== 'fetch');
  if (typeof options.importPath === 'string') {
    project.notes.push(
      `kubb used a custom client from ${options.importPath}; apig takes a client instance — set httpClient: { name, path, export }`,
    );
  } else if (axios) {
    project.notes.push(
      "kubb used axios's default instance; apig needs a module that exports one — set httpClient: { name: 'axios', path, export }, until then requests use fetch",
    );
  }
};

const migrateProject = (
  config: UserConfig,
  index: number,
  single: boolean,
): MigratedProject => {
  const root = typeof config.root === 'string' ? config.root : process.cwd();
  const output = (config.output ?? {}) as Loose;
  const input = (config.input ?? {}) as Loose;

  const project: MigratedProject = {
    name: single ? undefined : (config.name ?? `project-${index + 1}`),
    input: './openapi.json',
    output: {
      path: rebasePath(
        typeof output.path === 'string' ? output.path : '.',
        root,
      ),
      clean: !!output.clean,
    },
    plugins: [],
    notes: [],
  };

  if (typeof input.path === 'string')
    project.input = rebasePath(input.path, root);
  else
    project.notes.push(
      'the spec was passed as input.data in the kubb config — point input at a file or URL',
    );

  if (typeof output.format === 'string' && FORMATTERS.includes(output.format))
    project.formatter = output.format as Formatter;

  // kubb 4's `hooks: { done }`; kubb 5 dropped the field from UserConfig
  const hooks = asObject((config as Loose).hooks);
  const done = hooks?.done;
  if (typeof done === 'string' || Array.isArray(done))
    project.hooks = { afterAllFilesWrite: [done].flat().join(' && ') };

  const features: Features = {};
  for (const plugin of (config.plugins ?? []) as Loose[]) {
    const name = String(plugin.name ?? '');
    const options = asObject(plugin.options) ?? {};

    if (asObject(options.group)?.type === 'tag') project.groupBy = 'tags';
    else if (asObject(options.group)?.type === 'path')
      project.notes.push(
        `${name} grouped by path; apig groups by tag (groupBy: 'tags')`,
      );

    if (SILENT_PLUGINS.has(name)) continue;

    if (name === 'plugin-ts') {
      const enumType = asObject(options.enum)?.type ?? options.enumType;
      const style =
        typeof enumType === 'string' ? ENUM_STYLES[enumType] : undefined;
      if (style && style !== 'const') project.enumStyle = style;
      if (options.syntaxType === 'interface') project.typeStyle = 'interface';
    } else if (
      name === 'plugin-client' ||
      name === 'plugin-axios' ||
      name === 'plugin-fetch'
    ) {
      features.requests = true;
      readClient(name, options, project);
    } else if (TANSTACK_PLUGINS[name]) {
      features.tanstack = {
        framework: TANSTACK_PLUGINS[name],
        infinite: !!options.infinite,
        suspense: !!options.suspense,
      };
    } else if (name === 'plugin-swr') {
      features.swr = true;
    } else if (name === 'plugin-zod') {
      features.zod = true;
    } else if (name === 'plugin-faker') {
      features.faker = true;
    } else if (name === 'plugin-msw') {
      features.msw = true;
    } else if (name === 'plugin-mcp') {
      features.mcp = true;
    } else {
      project.notes.push(
        `kubb ${name || 'plugin'} has no apig equivalent and was dropped`,
      );
    }
  }
  project.plugins = buildPlugins(features);

  return project;
};

/** Translates every project in a kubb config into an apig config. */
export const migrateKubb = (configs: UserConfig[]): MigratedProject[] => {
  const projects = configs.map((config, i) =>
    migrateProject(config, i, configs.length === 1),
  );
  dedupeOutputPaths(projects);
  return projects;
};
