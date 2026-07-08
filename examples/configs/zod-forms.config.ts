import { defineConfig, typescript, zod, rhf } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [
    typescript(),
    zod({ withTypes: true }),
    rhf({ resolver: 'zod' }),
  ],
})
