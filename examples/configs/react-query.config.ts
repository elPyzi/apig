import { defineConfig, typescript, requests, zod, tanstackQuery } from 'zvyappy'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [
    typescript(),
    requests(),
    zod({ withTypes: true }),
    tanstackQuery({ infinite: true, suspense: true }),
  ],
})
