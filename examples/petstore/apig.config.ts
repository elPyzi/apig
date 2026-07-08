import {
  defineConfig,
  typescript,
  sdk,
  zod,
  tanstackQuery,
  swr,
  rhf,
  faker,
  msw,
} from '@travjek/apig';

export default defineConfig({
  input: 'https://petstore3.swagger.io/api/v3/openapi.json',
  output: './generated',
  plugins: [
    typescript(),
    sdk(),
    zod({ withTypes: true }),
    tanstackQuery({ infinite: true, suspense: true }),
    swr(),
    rhf({ resolver: 'zod' }),
    faker(),
    msw(),
  ],
});
