import { describe, test, expect } from 'bun:test';
import { join } from 'path';
import type { Config } from 'orval';
import type { UserConfig } from 'kubb';
import type { UserConfig as HeyApiConfig } from '@hey-api/openapi-ts';
import {
  migrateHeyApi,
  migrateKubb,
  migrateOrval,
  renderConfig,
} from '@services/migrate';

const configPath = join(process.cwd(), 'orval.config.ts');
const factories = (p: { plugins: { factory: string }[] }) =>
  p.plugins.map((pl) => pl.factory);

describe('migrateOrval', () => {
  test('a react-query project maps to tanstackQuery with its options', async () => {
    const [project] = await migrateOrval(
      {
        api: {
          input: { target: './openapi.json', filters: { tags: ['pets'] } },
          output: {
            mode: 'tags-split',
            target: './src/api/generated.ts',
            client: 'react-query',
            clean: true,
            formatter: 'prettier',
            override: { query: { useInfinite: true, useSuspenseQuery: true } },
          },
        },
      } as Config,
      configPath,
    );

    expect(project!.name).toBeUndefined();
    expect(project!.input).toBe('./openapi.json');
    expect(project!.output).toEqual({ path: './src/api', clean: true });
    expect(project!.groupBy).toBe('tags');
    expect(project!.formatter).toBe('prettier');
    expect(project!.filter).toEqual({ tags: ['pets'], deprecated: true });
    expect(project!.plugins).toContainEqual({
      factory: 'tanstackQuery',
      options: { framework: undefined, infinite: true, suspense: true },
    });
  });

  test('resolves projects exported as functions and promises', async () => {
    const projects = await migrateOrval(
      {
        a: () => ({
          input: './a.json',
          output: { target: './a', client: 'swr' },
        }),
        b: Promise.resolve({ input: './b.json', output: './b' }),
      } as unknown as Config,
      configPath,
    );

    expect(projects.map((p) => p.name)).toEqual(['a', 'b']);
    expect(factories(projects[0]!)).toEqual(['typescript', 'requests', 'swr']);
  });

  test('mcp and msw bring in the plugins they depend on', async () => {
    const [project] = await migrateOrval(
      {
        api: {
          input: './a.json',
          output: { target: './a', client: 'mcp', mock: true },
        },
      } as Config,
      configPath,
    );

    expect(factories(project!)).toEqual([
      'typescript',
      'requests',
      'zod',
      'faker',
      'msw',
      'mcp',
    ]);
  });

  test('a mutator becomes a note rather than a broken httpClient', async () => {
    const [project] = await migrateOrval(
      {
        api: {
          input: './a.json',
          output: {
            target: './a',
            override: {
              mutator: { path: './http.ts', name: 'customInstance' },
            },
          },
        },
      } as Config,
      configPath,
    );

    expect(project!.notes.join()).toContain('./http.ts (customInstance)');
  });

  test('projects sharing a directory each move into their own subdirectory', async () => {
    const projects = await migrateOrval(
      {
        pets: { input: './a.json', output: './gen/pets.ts' },
        orders: { input: './b.json', output: './gen/orders.ts' },
      } as Config,
      configPath,
    );

    expect(projects.map((p) => p.output.path)).toEqual([
      './gen/pets',
      './gen/orders',
    ]);
  });
});

describe('migrateKubb', () => {
  const plugin = (name: string, options: Record<string, unknown> = {}) => ({
    name,
    options,
  });

  test('maps plugins, enum style and grouping', () => {
    const [project] = migrateKubb([
      {
        root: process.cwd(),
        input: { path: './openapi.json' },
        output: { path: './src/gen', clean: true, format: 'biome' },
        plugins: [
          plugin('plugin-oas'),
          plugin('plugin-ts', {
            enum: { type: 'literal' },
            syntaxType: 'interface',
          }),
          plugin('plugin-fetch', {
            baseURL: 'https://api.example.com',
            group: { type: 'tag' },
          }),
          plugin('plugin-vue-query', { infinite: {} }),
          plugin('plugin-zod'),
        ],
      } as unknown as UserConfig,
    ]);

    expect(project!.output).toEqual({ path: './src/gen', clean: true });
    expect(project!.formatter).toBe('biome');
    expect(project!.enumStyle).toBe('union');
    expect(project!.typeStyle).toBe('interface');
    expect(project!.groupBy).toBe('tags');
    expect(project!.baseUrl).toBe('https://api.example.com');
    expect(project!.notes).toEqual([]);
    expect(project!.plugins).toEqual([
      { factory: 'typescript' },
      { factory: 'requests' },
      { factory: 'zod' },
      {
        factory: 'tanstackQuery',
        options: { framework: 'vue', infinite: true, suspense: undefined },
      },
    ]);
  });

  test('an unknown plugin is reported', () => {
    const [project] = migrateKubb([
      {
        root: process.cwd(),
        input: { path: './a.json' },
        output: { path: './a' },
        plugins: [plugin('plugin-redoc')],
      } as unknown as UserConfig,
    ]);

    expect(project!.notes).toEqual([
      'kubb plugin-redoc has no zvyappy equivalent and was dropped',
    ]);
  });
});

describe('deprecated operations', () => {
  test('a migrated tag filter keeps them, as orval did', async () => {
    const [project] = await migrateOrval(
      {
        api: {
          input: { target: './a.json', filters: { tags: ['pets'] } },
          output: './a',
        },
      } as Config,
      configPath,
    );

    expect(project!.filter).toEqual({ tags: ['pets'], deprecated: true });
  });

  test('orval dropping them becomes a filter that drops them', async () => {
    const [project] = await migrateOrval(
      {
        api: {
          input: './a.json',
          output: {
            target: './a',
            override: { useDeprecatedOperations: false },
          },
        },
      } as Config,
      configPath,
    );

    expect(project!.filter).toEqual({ deprecated: false });
  });
});

describe('migrateHeyApi', () => {
  const heyApi = (config: Record<string, unknown>) =>
    migrateHeyApi([config as unknown as HeyApiConfig], configPath);

  test('no plugins means hey-api defaults: types and an SDK, unions for enums', () => {
    const [project] = heyApi({ input: './openapi.json', output: 'src/client' });

    expect(project!.output).toEqual({ path: './src/client', clean: true });
    expect(project!.enumStyle).toBe('union');
    expect(project!.plugins).toEqual([
      { factory: 'typescript' },
      { factory: 'requests' },
    ]);
  });

  test('maps plugin names and options', () => {
    const [project] = heyApi({
      input: { path: './openapi.json' },
      output: {
        path: './src/client',
        clean: false,
        postProcess: ['biome:format'],
      },
      parser: {
        filters: { tags: { exclude: ['internal'] }, deprecated: false },
      },
      plugins: [
        { name: '@hey-api/client-fetch', baseUrl: 'https://api.example.com' },
        {
          name: '@hey-api/typescript',
          enums: { enabled: true, mode: 'typescript' },
        },
        '@hey-api/sdk',
        '@tanstack/svelte-query',
        'zod',
      ],
    });

    expect(project!.output.clean).toBe(false);
    expect(project!.formatter).toBe('biome');
    expect(project!.baseUrl).toBe('https://api.example.com');
    expect(project!.enumStyle).toBe('enum');
    expect(project!.filter).toEqual({
      exclude: ['internal'],
      deprecated: false,
    });
    expect(project!.notes).toEqual([]);
    expect(factories(project!)).toEqual([
      'typescript',
      'requests',
      'zod',
      'tanstackQuery',
    ]);
  });

  test('paired input and output arrays become separate projects', () => {
    const projects = heyApi({
      input: ['./a.json', './b.json'],
      output: ['./gen/a', './gen/b'],
    });

    expect(projects.map((p) => [p.name, p.input, p.output.path])).toEqual([
      ['a', './a.json', './gen/a'],
      ['b', './b.json', './gen/b'],
    ]);
  });

  test('merged inputs, registry shorthands and auth headers are reported', () => {
    const [project] = heyApi({
      input: ['hey-api/backend', './b.json'],
      output: './gen',
    });
    const [withAuth] = heyApi({
      input: {
        path: './a.json',
        fetch: { headers: { authorization: 'Basic x' } },
      },
      output: './gen',
    });

    expect(project!.input).toBe('hey-api/backend');
    expect(project!.notes.join('\n')).toContain('merged 2 specs');
    expect(project!.notes.join('\n')).toContain('API registry shorthand');
    expect(withAuth!.notes.join('\n')).toContain(
      'auth: { username, password }',
    );
  });

  test('an axios client asks for an instance', () => {
    const [project] = heyApi({
      input: './a.json',
      output: './gen',
      plugins: ['@hey-api/client-axios', '@hey-api/typescript', '@hey-api/sdk'],
    });

    expect(project!.notes[0]).toContain(
      "httpClient: { name: 'axios', path, export }",
    );
  });
});

describe('renderConfig', () => {
  test('writes imports, options and notes as TODO comments', () => {
    const code = renderConfig(
      [
        {
          input: "./it's.json",
          output: { path: './src/api', clean: true },
          plugins: [
            { factory: 'typescript' },
            { factory: 'tanstackQuery', options: { framework: 'vue' } },
          ],
          groupBy: 'tags',
          notes: ['check this'],
        },
      ],
      'orval.config.ts',
    );

    expect(code).toContain(
      "import { defineConfig, typescript, tanstackQuery } from 'zvyappy';",
    );
    expect(code).toContain('  // TODO(migrate): check this');
    expect(code).toContain("  input: './it\\'s.json',");
    expect(code).toContain("    tanstackQuery({ framework: 'vue' }),");
    expect(code).toContain("  groupBy: 'tags',");
  });
});
