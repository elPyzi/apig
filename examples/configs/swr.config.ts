import { defineConfig, typescript, sdk, swr } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [
    typescript(),
    sdk(),
    swr(),
  ],
})
