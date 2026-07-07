export interface Preset {
  name: string;
  description: string;
  template: string;
}

const header = `// @travjek/apig — https://travjek.dev/docs`;
const inputLine = `  input: 'https://api.example.com/openapi.json',`;
const outputBlock = `  output: {
    path: 'src/api/generated',
    clean: true,
  },`;
const baseUrlLine = `  baseUrl: 'https://api.example.com',`;

const build = (imports: string[], plugins: string[], extra = ''): string =>
  [
    header,
    `import { defineConfig, ${imports.join(', ')} } from '@travjek/apig';`,
    ``,
    `export default defineConfig({`,
    inputLine,
    outputBlock,
    baseUrlLine,
    ``,
    `  plugins: [`,
    ...plugins.map((p) => `    ${p},`),
    `  ],`,
    extra ? `\n${extra}` : ``,
    `});`,
    ``,
  ]
    .filter((l) => l !== undefined)
    .join('\n');

export const PRESETS: Record<string, Preset> = {
  /**
   * minimal — TypeScript types + SDK fetch functions only.
   * Zero dependencies beyond TypeScript.
   */
  minimal: {
    name: 'minimal',
    description: 'TypeScript types + SDK fetch functions',
    template: build(['typescript', 'sdk'], ['typescript()', 'sdk()']),
  },

  /**
   * react — Standard React stack: types, SDK, TanStack Query, Zod schemas.
   * Requires: @tanstack/react-query, zod
   */
  react: {
    name: 'react',
    description:
      'TypeScript + SDK + TanStack Query + Zod (standard React stack)',
    template: build(
      ['typescript', 'sdk', 'tanstackQuery', 'zod'],
      ['typescript()', 'sdk()', 'tanstackQuery()', 'zod()'],
      `  enumStyle: 'const',
  typeStyle: 'type',`,
    ),
  },

  /**
   * react-swr — React stack with SWR instead of TanStack Query.
   * Requires: swr, zod
   */
  'react-swr': {
    name: 'react-swr',
    description: 'TypeScript + SDK + SWR + Zod',
    template: build(
      ['typescript', 'sdk', 'swr', 'zod'],
      ['typescript()', 'sdk()', 'swr()', 'zod()'],
      `  enumStyle: 'const',
  typeStyle: 'type',`,
    ),
  },

  /**
   * testing — Full stack with mocking support: types, SDK, TanStack Query,
   * Zod, Faker factories and MSW handlers.
   * Requires: @tanstack/react-query, zod, @faker-js/faker, msw
   */
  testing: {
    name: 'testing',
    description: 'React stack + Faker factories + MSW handlers for mocking',
    template: build(
      ['typescript', 'sdk', 'tanstackQuery', 'zod', 'faker', 'msw'],
      ['typescript()', 'sdk()', 'tanstackQuery()', 'zod()', 'faker()', 'msw()'],
      `  enumStyle: 'const',
  typeStyle: 'type',`,
    ),
  },

  /**
   * forms — Types, SDK and React Hook Form resolvers with Zod validation.
   * No data-fetching hooks — suited for form-heavy apps.
   * Requires: zod, react-hook-form, @hookform/resolvers
   */
  forms: {
    name: 'forms',
    description: 'TypeScript + SDK + Zod + React Hook Form resolvers',
    template: build(
      ['typescript', 'sdk', 'zod', 'rhf'],
      ['typescript()', 'sdk()', 'zod()', "rhf({ resolver: 'zod' })"],
      `  enumStyle: 'const',
  typeStyle: 'type',`,
    ),
  },

  /**
   * full — Everything enabled: types, SDK, TanStack Query, Zod, Faker,
   * MSW, React Hook Form resolvers and an endpoints map.
   */
  full: {
    name: 'full',
    description:
      'All plugins — types, SDK, TanStack Query, Zod, Faker, MSW, RHF',
    template: build(
      ['typescript', 'sdk', 'tanstackQuery', 'zod', 'faker', 'msw', 'rhf'],
      [
        'typescript()',
        'sdk()',
        'tanstackQuery()',
        'zod()',
        'faker()',
        'msw()',
        "rhf({ resolver: 'zod' })",
      ],
      `  enumStyle: 'const',
  typeStyle: 'type',
  endpointsMap: true,`,
    ),
  },
};

export const PRESET_NAMES = Object.keys(PRESETS) as (keyof typeof PRESETS)[];
