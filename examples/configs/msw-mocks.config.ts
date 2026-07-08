import { defineConfig, typescript, faker, msw } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [
    typescript(),
    faker(),
    msw(),
  ],
})
