import { defineConfig, typescript, requests, swr } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [
    typescript(),
    requests(),
    swr(),
  ],
})
