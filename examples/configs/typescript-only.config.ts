import { defineConfig, typescript } from 'zvyappy'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript()],
})
