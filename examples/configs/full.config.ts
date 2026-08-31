import {
  defineConfig,
  typescript,
  requests,
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
    requests(),
    zod({ withTypes: true }),
    tanstackQuery({ infinite: true, suspense: true }),
    rhf({ resolver: 'zod' }),
    faker(),
    msw(),
  ],
})
