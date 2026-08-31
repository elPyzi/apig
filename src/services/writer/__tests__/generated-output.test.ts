import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { execFileSync } from 'child_process';
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  rmSync,
} from 'fs';
import { join, dirname, resolve, relative } from 'path';

import type { ApigConfig } from '@models';
import { write } from '@services/writer';
import {
  typescript,
  requests,
  zod,
  tanstackQuery,
  swr,
  rhf,
  faker,
  msw,
  playwright,
} from '@plugins';

const SPEC = 'examples/petstore/openapi.json';

/**
 * Packages the generated code is allowed to import. Anything else that is not a
 * relative path pointing at a real generated file is a codegen bug — that is how
 * an internal alias like `@/plugins/faker` used to leak into `msw.ts`.
 */
const ALLOWED_PACKAGES = [
  'msw',
  'zod',
  'swr',
  'swr/mutation',
  'swrv',
  '@faker-js/faker',
  '@tanstack/react-query',
  '@tanstack/vue-query',
  '@tanstack/solid-query',
  '@tanstack/svelte-query',
  '@hookform/resolvers/zod',
  '@hookform/resolvers/valibot',
  '@hookform/resolvers/yup',
  'valibot',
  'yup',
  '@playwright/test',
];

const IMPORT_RE = /(?:from|import)\s+['"]([^'"]+)['"]/g;

const listFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? listFiles(join(dir, entry.name))
      : [join(dir, entry.name)],
  );

interface Import {
  file: string;
  specifier: string;
}

const collectImports = (outDir: string): Import[] =>
  listFiles(outDir)
    .filter((file) => file.endsWith('.ts'))
    .flatMap((file) => {
      const code = readFileSync(file, 'utf-8');
      return [...code.matchAll(IMPORT_RE)].map((m) => ({
        file,
        specifier: m[1]!,
      }));
    });

/**
 * Imports that point at neither an allowed package nor a generated file next to
 * them — the shape a leaked internal alias or a wrong groupBy prefix takes.
 */
const brokenImports = (outDir: string): Import[] =>
  collectImports(outDir).filter(({ file, specifier }) =>
    specifier.startsWith('.')
      ? !existsSync(resolve(dirname(file), `${specifier}.ts`))
      : !ALLOWED_PACKAGES.includes(specifier),
  );

/** Silences the generator's console output so test runs stay readable. */
const quietly = async (fn: () => Promise<void>): Promise<void> => {
  const { log, error } = console;
  console.log = () => {};
  console.error = () => {};
  try {
    await fn();
  } finally {
    console.log = log;
    console.error = error;
  }
};

const generate = async (
  outDir: string,
  overrides: Partial<ApigConfig> = {},
): Promise<void> => {
  await quietly(() =>
    write({
      input: SPEC,
      output: { path: outDir, clean: true },
      baseUrl: 'https://api.example.com',
      plugins: [typescript(), requests(), tanstackQuery()],
      ...overrides,
    }),
  );
};

/**
 * Type-checks every generated file under the same strictness a consumer would.
 *
 * The peer libraries the output imports are dev dependencies here purely so
 * this can cover the whole surface — string assertions cannot tell that
 * `faker.number.int()` was assigned to a `string`, which is how a whole spec's
 * factories once shipped without compiling.
 */
const compileGenerated = (outDir: string): void => {
  const files = listFiles(outDir).filter((file) => file.endsWith('.ts'));
  if (files.length === 0) return;

  try {
    execFileSync(
      resolve('node_modules/.bin/tsc'),
      [
        '--noEmit',
        '--strict',
        '--target',
        'esnext',
        '--module',
        'esnext',
        '--moduleResolution',
        'bundler',
        '--lib',
        'esnext,dom',
        '--skipLibCheck',
        ...files,
      ],
      { encoding: 'utf-8', stdio: 'pipe' },
    );
  } catch (e) {
    const { stdout } = e as { stdout: string };
    throw new Error(`generated code does not compile:\n${stdout}`);
  }
};

let root: string;

beforeAll(() => {
  // Inside the repo on purpose: the generated files import the peer libraries by
  // bare specifier, and only a directory under the repo resolves them the way a
  // consumer's project would.
  root = mkdtempSync(join(process.cwd(), '.e2e-'));
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('generated output', () => {
  describe('all plugins, flat layout', () => {
    let outDir: string;

    beforeAll(async () => {
      outDir = join(root, 'flat');
      await generate(outDir, {
        plugins: [
          typescript(),
          requests(),
          zod({ withTypes: false }),
          tanstackQuery({ infinite: true, suspense: true }),
          rhf({ resolver: 'zod' }),
          faker(),
          msw(),
          playwright(),
        ],
      });
    });

    test('every import is a real package or an existing generated file', () => {
      const broken = collectImports(outDir).filter(({ file, specifier }) => {
        if (!specifier.startsWith('.')) {
          return !ALLOWED_PACKAGES.includes(specifier);
        }
        return !existsSync(resolve(dirname(file), `${specifier}.ts`));
      });

      expect(broken).toEqual([]);
    });

    test('no internal apig alias leaks into generated code', () => {
      const aliased = collectImports(outDir).filter(({ specifier }) =>
        /^@(\/|services|libs|models|plugins|constants|client)/.test(specifier),
      );

      expect(aliased).toEqual([]);
    });

    test('every generated file compiles under strict TypeScript', () => {
      compileGenerated(outDir);
    });
  });

  describe('swr, flat layout', () => {
    let outDir: string;

    beforeAll(async () => {
      outDir = join(root, 'swr');
      await generate(outDir, {
        plugins: [typescript(), requests(), swr(), faker()],
      });
    });

    test('every import is a real package or an existing generated file', () => {
      expect(brokenImports(outDir)).toEqual([]);
    });

    test('every generated file compiles under strict TypeScript', () => {
      compileGenerated(outDir);
    });
  });

  // Root-scoped plugins once built their import paths as if they were nested,
  // which broke every layout but the flat one — so each layout is generated and
  // compiled rather than only checked for resolvable specifiers.
  describe.each(['none', 'tags', 'endpoints', 'operations'] as const)(
    'groupBy: %s',
    (groupBy) => {
      let outDir: string;

      beforeAll(async () => {
        outDir = join(root, `group-${groupBy}`);
        await generate(outDir, {
          groupBy,
          plugins: [
            typescript(),
            requests(),
            zod({ withTypes: false }),
            tanstackQuery(),
            faker(),
            msw(),
            playwright(),
          ],
        });
      });

      test('every import resolves', () => {
        expect(brokenImports(outDir)).toEqual([]);
      });

      test('every generated file compiles under strict TypeScript', () => {
        compileGenerated(outDir);
      });
    },
  );

  /**
   * Every non-fetch client is reached through a module the user writes, so each
   * one is compiled against a real instance of the library it names — the
   * adapters build quite different call shapes and only `fetch` was ever
   * type-checked.
   */
  describe.each([
    [
      'axios',
      "import axios from 'axios';\nexport const api = axios.create();\n",
    ],
    ['ky', "import ky from 'ky';\nexport const api = ky.create({});\n"],
    [
      'ofetch',
      "import { ofetch } from 'ofetch';\nexport const api = ofetch.create({});\n",
    ],
    [
      'wretch',
      // `.query()` is an addon in wretch v3, and the generated calls use it —
      // a bare wretch() instance does not type-check against them.
      "import wretch from 'wretch';\nimport QueryStringAddon from 'wretch/addons/queryString';\nexport const api = wretch().addon(QueryStringAddon);\n",
    ],
  ] as const)('httpClient: %s', (name, stub) => {
    let outDir: string;

    beforeAll(async () => {
      outDir = join(root, `http-${name}`);
      await generate(outDir, {
        httpClient: {
          name,
          path: `${relative(process.cwd(), join(outDir, 'client'))}`,
          export: 'api',
        },
        plugins: [typescript(), requests()],
      });
      writeFileSync(join(outDir, 'client.ts'), stub, 'utf-8');
    });

    test('the generated calls compile against the real client', () => {
      compileGenerated(outDir);
    });
  });

  describe('type ownership', () => {
    test('withTypes: false hands types back to typescript()', async () => {
      const outDir = join(root, 'with-types-false');
      await generate(outDir, {
        plugins: [typescript(), requests(), zod({ withTypes: false })],
      });

      const requestsCode = readFileSync(join(outDir, 'requests.ts'), 'utf-8');
      expect(requestsCode).toContain("from './types'");
      expect(requestsCode).not.toContain("} from './zod'");
    });

    test('withTypes: true keeps types in the validation file', async () => {
      const outDir = join(root, 'with-types-true');
      await generate(outDir, {
        plugins: [typescript(), requests(), zod({ withTypes: true })],
      });

      const requestsCode = readFileSync(join(outDir, 'requests.ts'), 'utf-8');
      expect(requestsCode).toContain("from './zod'");
    });
  });

  describe('output cleaning', () => {
    test('keeps hand-written files sitting in the output directory', async () => {
      const outDir = join(root, 'clean-keeps');
      await generate(outDir, { plugins: [typescript(), requests()] });

      const handwritten = join(outDir, 'client.ts');
      writeFileSync(handwritten, 'export const apiClient = {};\n', 'utf-8');

      await generate(outDir, { plugins: [typescript(), requests()] });

      expect(existsSync(handwritten)).toBe(true);
      expect(readFileSync(handwritten, 'utf-8')).toContain('apiClient');
    });

    test('drops generated files a later run no longer produces', async () => {
      const outDir = join(root, 'clean-drops');
      await generate(outDir, {
        plugins: [typescript(), requests(), faker(), msw()],
      });
      expect(existsSync(join(outDir, 'msw.ts'))).toBe(true);

      await generate(outDir, { plugins: [typescript(), requests()] });

      expect(existsSync(join(outDir, 'msw.ts'))).toBe(false);
      expect(existsSync(join(outDir, 'requests.ts'))).toBe(true);
    });
  });

  describe('header params and OpenAPI 3.1', () => {
    let outDir: string;
    let requestsCode: string;

    beforeAll(async () => {
      outDir = join(root, 'headers-31');
      await generate(outDir, {
        input: 'src/services/writer/__tests__/fixtures/headers-3.1.json',
        plugins: [typescript(), requests()],
      });
      requestsCode = readFileSync(join(outDir, 'requests.ts'), 'utf-8');
    });

    test('header params reach the function signature', () => {
      expect(requestsCode).toContain(
        `headers: { 'X-Tenant-Id': string; 'X-Trace'?: string }`,
      );
    });

    test('header params reach the request', () => {
      expect(requestsCode).toContain(
        `headers: { 'Content-Type': 'application/json', ...headers }`,
      );
    });

    test('an optional argument before a required one widens instead of taking ?', () => {
      expect(requestsCode).toContain('params: { limit?: number } | undefined');
    });

    test('3.1 nullable unions and const reach the types', () => {
      const types = readFileSync(join(outDir, 'types.ts'), 'utf-8');

      expect(types).toContain('note?: string | null');
      expect(types).toContain(`Widget: 'widget'`);
    });

    test('the whole thing compiles under strict TypeScript', () => {
      compileGenerated(outDir);
    });
  });

  describe('3.1 tuples', () => {
    let outDir: string;

    beforeAll(async () => {
      outDir = join(root, 'tuples');
      await generate(outDir, {
        input: 'src/services/writer/__tests__/fixtures/tuples-3.1.json',
        plugins: [typescript(), requests()],
      });
    });

    test('prefixItems becomes a fixed-length tuple type', () => {
      expect(readFileSync(join(outDir, 'types.ts'), 'utf-8')).toContain(
        'coords: [number, number]',
      );
    });

    test('items alongside prefixItems becomes a variadic tail', () => {
      expect(readFileSync(join(outDir, 'types.ts'), 'utf-8')).toContain(
        'rest: [string, ...number[]]',
      );
    });

    test('the whole thing compiles under strict TypeScript', () => {
      compileGenerated(outDir);
    });
  });

  describe('query parameter styles', () => {
    let outDir: string;
    let requestsCode: string;
    let toQuery: (
      params?: Record<string, unknown>,
      formats?: Record<string, string>,
    ) => string;

    beforeAll(async () => {
      outDir = join(root, 'query-styles');
      await generate(outDir, {
        input: 'src/services/writer/__tests__/fixtures/query-styles.json',
        plugins: [typescript(), requests()],
      });
      requestsCode = readFileSync(join(outDir, 'requests.ts'), 'utf-8');
      ({ toQuery } = await import(join(outDir, 'config.ts')));
    });

    test('array params are typed as arrays, not strings', () => {
      expect(requestsCode).toContain('tags?: string[]');
      expect(requestsCode).toContain('ids?: number[]');
    });

    test('scalar param types survive alongside them', () => {
      expect(requestsCode).toContain('active?: boolean');
      expect(requestsCode).toContain(`state?: 'on' | 'off'`);
    });

    test('only non-default styles are passed to toQuery', () => {
      expect(requestsCode).toContain(
        `toQuery(params, { 'ids': 'comma', 'cols': 'pipe', 'words': 'space' })`,
      );
      expect(requestsCode).not.toContain(`'tags':`);
    });

    test('the default style repeats the key', () => {
      expect(toQuery({ tags: ['a', 'b'] })).toBe('?tags=a&tags=b');
    });

    test('explode: false joins on a comma', () => {
      expect(toQuery({ ids: [1, 2, 3] }, { ids: 'comma' })).toBe(
        '?ids=1%2C2%2C3',
      );
    });

    test('pipeDelimited joins on a pipe', () => {
      expect(toQuery({ cols: ['a', 'b'] }, { cols: 'pipe' })).toBe(
        '?cols=a%7Cb',
      );
    });

    test('spaceDelimited joins on a space', () => {
      expect(toQuery({ words: ['a', 'b'] }, { words: 'space' })).toBe(
        '?words=a+b',
      );
    });

    test('deepObject expands into bracketed keys', () => {
      expect(toQuery({ f: { status: 'on' } }, { f: 'deep' })).toBe(
        '?f%5Bstatus%5D=on',
      );
    });

    test('nullish values and empty arrays produce no query at all', () => {
      expect(toQuery({ a: undefined, b: null, c: [] })).toBe('');
      expect(toQuery()).toBe('');
    });

    test('nullish array members are skipped', () => {
      expect(toQuery({ tags: ['x', null, 'y'] })).toBe('?tags=x&tags=y');
    });

    test('the whole thing compiles under strict TypeScript', () => {
      compileGenerated(outDir);
    });
  });

  describe('fetch query params', () => {
    test('serializes through the toQuery helper, not raw URLSearchParams', async () => {
      const outDir = join(root, 'query');
      await generate(outDir, { plugins: [typescript(), requests()] });

      const requestsCode = readFileSync(join(outDir, 'requests.ts'), 'utf-8');
      expect(requestsCode).toContain('${toQuery(params)}');
      expect(requestsCode).not.toContain('new URLSearchParams(params)');
      expect(readFileSync(join(outDir, 'config.ts'), 'utf-8')).toContain(
        'export const toQuery',
      );
    });
  });
});
