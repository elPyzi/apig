import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { checkbox, input, select, confirm } from '@inquirer/prompts';

const quote = (s: string) => `'${s}'`;

interface StartAnswers {
  input: string;
  output: string;
  baseUrl: string;
  plugins: string[];
  groupBy: string;
  enumStyle: string;
  typeStyle: string;
  fileNaming: string;
  formatter: string;
  httpClient: string;
  httpClientPath: string;
  httpClientExport: string;
  queryKeysStyle: string;
  index: boolean;
}

const PLUGIN_FACTORIES: Record<string, string> = {
  typescript: 'typescript',
  sdk: 'sdk',
  'tanstack-query': 'tanstackQuery',
  swr: 'swr',
  zod: 'zod',
  valibot: 'valibot',
  yup: 'yup',
  faker: 'faker',
  msw: 'msw',
};

const PLUGIN_LABELS: Record<string, string> = {
  typescript: 'TypeScript types',
  sdk: 'SDK (fetch functions)',
  'tanstack-query': 'TanStack Query hooks',
  swr: 'SWR hooks',
  zod: 'Zod schemas',
  valibot: 'Valibot schemas',
  yup: 'Yup schemas',
  faker: 'Faker factories (mock data)',
  msw: 'MSW handlers (API mocking)',
};

const buildPluginCall = (plugin: string, answers: StartAnswers): string => {
  const fn = PLUGIN_FACTORIES[plugin] ?? plugin;
  const opts: string[] = [];

  if (plugin === 'tanstack-query' && answers.queryKeysStyle !== 'functions') {
    opts.push(`queryKeysStyle: ${quote(answers.queryKeysStyle)}`);
  }
  if (plugin === 'swr' && answers.queryKeysStyle !== 'functions') {
    opts.push(`queryKeysStyle: ${quote(answers.queryKeysStyle)}`);
  }

  return opts.length > 0 ? `${fn}({ ${opts.join(', ')} })` : `${fn}()`;
};

const buildHttpClient = (answers: StartAnswers): string | null => {
  if (answers.httpClient === 'fetch') return null;
  const lines = [`name: ${quote(answers.httpClient)}`];
  if (answers.httpClientPath)
    lines.push(`path: ${quote(answers.httpClientPath)}`);
  if (answers.httpClientExport)
    lines.push(`export: ${quote(answers.httpClientExport)}`);
  return `httpClient: { ${lines.join(', ')} },`;
};

const buildConfig = (answers: StartAnswers): string => {
  const usedFactories = answers.plugins
    .map((p) => PLUGIN_FACTORIES[p] ?? p)
    .filter((v, i, a) => a.indexOf(v) === i);

  const pluginLines = answers.plugins
    .map((p) => buildPluginCall(p, answers))
    .join(',\n    ');

  const httpClient = buildHttpClient(answers);

  const lines: string[] = [
    `// @travjek/apig — https://travjek.dev/docs`,
    `import { defineConfig, ${usedFactories.join(', ')} } from '@travjek/apig';`,
    ``,
    `export default defineConfig({`,
    `  input: ${quote(answers.input)},`,
    `  output: {`,
    `    path: ${quote(answers.output)},`,
    `    clean: true,`,
    `  },`,
  ];

  if (answers.baseUrl) lines.push(`  baseUrl: ${quote(answers.baseUrl)},`);
  if (httpClient) lines.push(`  ${httpClient}`);
  lines.push(`  plugins: [`);
  lines.push(`    ${pluginLines},`);
  lines.push(`  ],`);
  if (answers.groupBy !== 'none')
    lines.push(`  groupBy: ${quote(answers.groupBy)},`);
  if (answers.enumStyle !== 'const')
    lines.push(`  enumStyle: ${quote(answers.enumStyle)},`);
  if (answers.typeStyle !== 'type')
    lines.push(`  typeStyle: ${quote(answers.typeStyle)},`);
  if (answers.fileNaming !== 'kebab-case')
    lines.push(`  fileNaming: ${quote(answers.fileNaming)},`);
  if (answers.formatter !== 'none')
    lines.push(`  formatter: ${quote(answers.formatter)},`);
  if (!answers.index) lines.push(`  index: false,`);
  lines.push(`});`);
  lines.push(``);

  return lines.join('\n');
};

export const runStart = async (): Promise<void> => {
  console.log('');
  console.log('  @travjek/apig — interactive setup');
  console.log('  docs: https://travjek.dev/docs');
  console.log('');

  const plugins = await checkbox({
    message: 'Select plugins',
    choices: Object.entries(PLUGIN_LABELS).map(([value, label]) => ({
      name: label,
      value,
      checked: value === 'typescript' || value === 'sdk',
    })),
    validate: (v) => v.length > 0 || 'Select at least one plugin',
  });

  const specInput = await input({
    message: 'OpenAPI spec (URL or file path)',
    default: 'https://api.example.com/openapi.json',
    validate: (v) => v.trim().length > 0 || 'Required',
  });

  const outputPath = await input({
    message: 'Output directory',
    default: 'src/api/generated',
  });

  const baseUrl = await input({
    message: 'Base URL (leave blank to skip)',
    default: '',
  });

  const httpClient = await select({
    message: 'HTTP client',
    choices: [
      { name: 'fetch (built-in)', value: 'fetch' },
      { name: 'axios', value: 'axios' },
      { name: 'ky', value: 'ky' },
      { name: 'ofetch', value: 'ofetch' },
    ],
    default: 'fetch',
  });

  let httpClientPath = '';
  let httpClientExport = '';
  if (httpClient !== 'fetch') {
    httpClientPath = await input({
      message: 'Client instance file path',
      default: `./src/lib/${httpClient}`,
    });
    httpClientExport = await input({
      message: 'Named export of the client instance',
      default: httpClient,
    });
  }

  const needsQueryKeys =
    plugins.includes('tanstack-query') || plugins.includes('swr');

  let queryKeysStyle = 'functions';
  if (needsQueryKeys) {
    queryKeysStyle = await select({
      message: 'Query keys style',
      choices: [
        {
          name: 'functions — inline key fn per hook (getPetByIdQueryKey)',
          value: 'functions',
        },
        {
          name: 'object   — shared queryKeys object in query-keys.ts',
          value: 'object',
        },
      ],
      default: 'functions',
    });
  }

  const groupBy = await select({
    message: 'Group generated files by',
    choices: [
      { name: 'none       — all files in one directory', value: 'none' },
      { name: 'tags       — one directory per OpenAPI tag', value: 'tags' },
      { name: 'endpoints  — one directory per endpoint', value: 'endpoints' },
      { name: 'operations — one directory per operation', value: 'operations' },
    ],
    default: 'none',
  });

  const enumStyle = await select({
    message: 'Enum style',
    choices: [
      {
        name: "const   — const Status = { Active: 'active' } as const",
        value: 'const',
      },
      { name: "union   — type Status = 'active' | 'inactive'", value: 'union' },
      { name: "enum    — enum Status { Active = 'active' }", value: 'enum' },
    ],
    default: 'const',
  });

  const typeStyle = await select({
    message: 'Type declaration style',
    choices: [
      { name: 'type      — export type User = { ... }', value: 'type' },
      { name: 'interface — export interface User { ... }', value: 'interface' },
    ],
    default: 'type',
  });

  const fileNaming = await select({
    message: 'File naming convention',
    choices: [
      { name: 'kebab-case', value: 'kebab-case' },
      { name: 'camelCase', value: 'camelCase' },
      { name: 'snake_case', value: 'snake_case' },
      { name: 'PascalCase', value: 'PascalCase' },
    ],
    default: 'kebab-case',
  });

  const formatter = await select({
    message: 'Code formatter',
    choices: [
      { name: 'none', value: 'none' },
      { name: 'prettier', value: 'prettier' },
      { name: 'biome', value: 'biome' },
      { name: 'oxfmt', value: 'oxfmt' },
    ],
    default: 'none',
  });

  const genIndex = await confirm({
    message: 'Generate index.ts with re-exports?',
    default: true,
  });

  const answers: StartAnswers = {
    input: specInput,
    output: outputPath,
    baseUrl: baseUrl.trim(),
    plugins,
    groupBy,
    enumStyle,
    typeStyle,
    fileNaming,
    formatter,
    httpClient,
    httpClientPath,
    httpClientExport,
    queryKeysStyle,
    index: genIndex,
  };

  const configPath = join(process.cwd(), 'apig.config.ts');
  const code = buildConfig(answers);

  if (existsSync(configPath)) {
    const overwrite = await confirm({
      message: 'apig.config.ts already exists — overwrite?',
      default: false,
    });
    if (!overwrite) {
      console.log('\n  Aborted — config not written.\n');
      return;
    }
  }

  writeFileSync(configPath, code, 'utf-8');

  console.log('');
  console.log('  ✓ apig.config.ts created');
  console.log('');
  console.log('  Next steps:');
  console.log('    apig info       — preview spec stats');
  console.log('    apig generate   — generate code');
  console.log('    apig generate --dry-run  — preview files first');
  console.log('');
};
