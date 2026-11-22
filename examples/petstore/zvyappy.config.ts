import {
  defineConfig,
  typescript,
  requests,
  zod,
  tanstackQuery,
  swr,
  rhf,
  faker,
  msw,
} from 'zvyappy';

export default defineConfig({
  input: './openapi.json',
  output: './generated',
  index: false,
  plugins: [
    typescript(),
    requests(),
    zod({ withTypes: true }),
    tanstackQuery({ infinite: true, suspense: true }),
    swr(),
    rhf({ resolver: 'zod' }),
    faker(),
    msw(),
  ],
});
