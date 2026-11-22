import { defineConfig, typescript, requests, swr } from 'zvyappy'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [
    typescript(),
    requests(),
    swr(),
  ],
})
