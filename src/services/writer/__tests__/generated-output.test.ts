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
import { tmpdir } from 'os';
import { join, dirname, resolve } from 'path';

import type { ApigConfig } from '@models';
import { write } from '@services/writer';
import {
  typescript,
  sdk,
  zod,
  tanstackQuery,
  swr,
  rhf,
  faker,
  msw,
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
      plugins: [typescript(), sdk(), tanstackQuery()],
      ...overrides,
    }),
  );
};

/**
 * Type-checks the generated files that import nothing but each other, so the
 * suite does not need msw, zod or a query library installed to prove the
 * generator emits compiling TypeScript.
 */
const compileGenerated = (outDir: string): void => {
  const files = ['config.ts', 'types.ts', 'sdk.ts', 'endpoints.ts']
    .map((name) => join(outDir, name))
    .filter(existsSync);

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
  root = mkdtempSync(join(tmpdir(), 'apig-e2e-'));
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
          sdk(),
          zod({ withTypes: false }),
          tanstackQuery({ infinite: true, suspense: true }),
          swr(),
          rhf({ resolver: 'zod' }),
          faker(),
          msw(),
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

    test('dependency-free files compile under strict TypeScript', () => {
      compileGenerated(outDir);
    });
  });

  describe('groupBy: tags', () => {
    test('nested files still resolve their imports', async () => {
      const outDir = join(root, 'tags');
      await generate(outDir, {
        groupBy: 'tags',
        plugins: [
          typescript(),
          sdk(),
          zod({ withTypes: false }),
          faker(),
          msw(),
        ],
      });

      const broken = collectImports(outDir).filter(({ file, specifier }) => {
        if (!specifier.startsWith('.')) {
          return !ALLOWED_PACKAGES.includes(specifier);
        }
        return !existsSync(resolve(dirname(file), `${specifier}.ts`));
      });

      expect(broken).toEqual([]);
    });
  });

  describe('type ownership', () => {
    test('withTypes: false hands types back to typescript()', async () => {
      const outDir = join(root, 'with-types-false');
      await generate(outDir, {
        plugins: [typescript(), sdk(), zod({ withTypes: false })],
      });

      const sdkCode = readFileSync(join(outDir, 'sdk.ts'), 'utf-8');
      expect(sdkCode).toContain("from './types'");
      expect(sdkCode).not.toContain("} from './zod'");
    });

    test('withTypes: true keeps types in the validation file', async () => {
      const outDir = join(root, 'with-types-true');
      await generate(outDir, {
        plugins: [typescript(), sdk(), zod({ withTypes: true })],
      });

      const sdkCode = readFileSync(join(outDir, 'sdk.ts'), 'utf-8');
      expect(sdkCode).toContain("from './zod'");
    });
  });

  describe('output cleaning', () => {
    test('keeps hand-written files sitting in the output directory', async () => {
      const outDir = join(root, 'clean-keeps');
      await generate(outDir, { plugins: [typescript(), sdk()] });

      const handwritten = join(outDir, 'client.ts');
      writeFileSync(handwritten, 'export const apiClient = {};\n', 'utf-8');

      await generate(outDir, { plugins: [typescript(), sdk()] });

      expect(existsSync(handwritten)).toBe(true);
      expect(readFileSync(handwritten, 'utf-8')).toContain('apiClient');
    });

    test('drops generated files a later run no longer produces', async () => {
      const outDir = join(root, 'clean-drops');
      await generate(outDir, {
        plugins: [typescript(), sdk(), faker(), msw()],
      });
      expect(existsSync(join(outDir, 'msw.ts'))).toBe(true);

      await generate(outDir, { plugins: [typescript(), sdk()] });

      expect(existsSync(join(outDir, 'msw.ts'))).toBe(false);
      expect(existsSync(join(outDir, 'sdk.ts'))).toBe(true);
    });
  });

  describe('header params and OpenAPI 3.1', () => {
    let outDir: string;
    let sdkCode: string;

    beforeAll(async () => {
      outDir = join(root, 'headers-31');
      await generate(outDir, {
        input: 'src/services/writer/__tests__/fixtures/headers-3.1.json',
        plugins: [typescript(), sdk()],
      });
      sdkCode = readFileSync(join(outDir, 'sdk.ts'), 'utf-8');
    });

    test('header params reach the function signature', () => {
      expect(sdkCode).toContain(
        `headers: { 'X-Tenant-Id': string; 'X-Trace'?: string }`,
      );
    });

    test('header params reach the request', () => {
      expect(sdkCode).toContain(
        `headers: { 'Content-Type': 'application/json', ...headers }`,
      );
    });

    test('an optional argument before a required one widens instead of taking ?', () => {
      expect(sdkCode).toContain('params: { limit?: number } | undefined');
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
        plugins: [typescript(), sdk()],
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
    let sdkCode: string;
    let toQuery: (
      params?: Record<string, unknown>,
      formats?: Record<string, string>,
    ) => string;

    beforeAll(async () => {
      outDir = join(root, 'query-styles');
      await generate(outDir, {
        input: 'src/services/writer/__tests__/fixtures/query-styles.json',
        plugins: [typescript(), sdk()],
      });
      sdkCode = readFileSync(join(outDir, 'sdk.ts'), 'utf-8');
      ({ toQuery } = await import(join(outDir, 'config.ts')));
    });

    test('array params are typed as arrays, not strings', () => {
      expect(sdkCode).toContain('tags?: string[]');
      expect(sdkCode).toContain('ids?: number[]');
    });

    test('scalar param types survive alongside them', () => {
      expect(sdkCode).toContain('active?: boolean');
      expect(sdkCode).toContain(`state?: 'on' | 'off'`);
    });

    test('only non-default styles are passed to toQuery', () => {
      expect(sdkCode).toContain(
        `toQuery(params, { 'ids': 'comma', 'cols': 'pipe', 'words': 'space' })`,
      );
      expect(sdkCode).not.toContain(`'tags':`);
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
      await generate(outDir, { plugins: [typescript(), sdk()] });

      const sdkCode = readFileSync(join(outDir, 'sdk.ts'), 'utf-8');
      expect(sdkCode).toContain('${toQuery(params)}');
      expect(sdkCode).not.toContain('new URLSearchParams(params)');
      expect(readFileSync(join(outDir, 'config.ts'), 'utf-8')).toContain(
        'export const toQuery',
      );
    });
  });
});
