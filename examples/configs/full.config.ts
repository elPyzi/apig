import {
  defineConfig,
  typescript,
  sdk,
  zod,
  tanstackQuery,
  rhf,
  faker,
  msw,
} from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [
    typescript(),
    sdk(),
    zod({ withTypes: true }),
    tanstackQuery({ infinite: true, suspense: true }),
    rhf({ resolver: 'zod' }),
    faker(),
    msw(),
  ],
})
