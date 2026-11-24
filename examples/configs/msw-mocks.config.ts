import { defineConfig, typescript, faker, msw } from 'zvyappy'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [
    typescript(),
    faker(),
    msw(),
  ],
})
