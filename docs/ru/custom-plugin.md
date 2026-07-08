# Создание кастомного плагина

Плагины — основная точка расширения apig. Каждый встроенный генератор (`typescript`, `sdk`, `zod` и т.д.) сам является плагином, реализующим интерфейс `ApigPlugin`.

## Интерфейс `ApigPlugin`

```ts
import type { ApigPlugin } from '@travjek/apig'

export interface ApigPlugin {
  /** Уникальное имя плагина — используется для дедупликации и проверок. */
  name: string;
  /** Базовое имя выходного файла без расширения ("sdk" → "sdk.ts"). */
  fileName: string;
  /**
   * "root"       — вызывается один раз для всего IR (types, zod, faker, msw, ...)
   * "operations" — вызывается на каждую группу при groupBy=tags/endpoints (sdk, tanstack, swr)
   */
  scope: 'root' | 'operations';
  generate: (ir: IR, config: ApigConfig, ctx?: PluginContext) => PluginResult;
  /** Опционально: вызывается один раз с полным IR после записи всех групп. */
  generateRootFiles?: (ir: IR, config: ApigConfig) => ExtraFile[];
  /** Отключает подавление typescript() при работе как валидационный плагин. По умолчанию true. */
  withTypes?: boolean;
}
```

## `PluginResult`

Результат, возвращаемый `generate()`:

```ts
interface PluginResult {
  code: string;         // содержимое файла
  exports: string[];     // именованные экспорты (для построения index.ts)
  typeExports: string[]; // экспорты только типов
}
```

## Минимальный пример

```ts
import type { ApigPlugin } from '@travjek/apig'

export const myPlugin = (): ApigPlugin => ({
  name: 'my-plugin',
  fileName: 'my-output',
  scope: 'root',
  generate(ir) {
    const lines = ir.operations.map(
      (op) => `// ${op.method.toUpperCase()} ${op.path} → ${op.id}`
    )

    return {
      code: lines.join('\n'),
      exports: [],
      typeExports: [],
    }
  },
})
```

Использование в конфиге:

```ts
import { defineConfig } from '@travjek/apig'
import { myPlugin } from './my-plugin'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [myPlugin()],
})
```

## IR (Intermediate Representation)

```ts
interface IR {
  operations: IROperation[]
  schemas: IRSchema[]
}

interface IROperation {
  id: string           // operationId (после rename, если указан)
  method: string        // 'get' | 'post' | 'put' | 'patch' | 'delete'
  path: string           // '/users/{id}'
  tag: string
  params: { path: IRParam[]; query: IRParam[] }
  body?: { schema: IRSchema; required: boolean; contentType: string }
  response?: IRSchema
  errors?: { status: string; schema: IRSchema }[]
}
```

## Проверка наличия другого плагина

```ts
generate(ir, config) {
  const hasFaker = (config.plugins ?? []).some((p) => p.name === 'faker')
  if (!hasFaker) throw new Error('my-plugin требует плагин faker()')
  // ...
}
```

Так поступает встроенный плагин `msw()` — он бросает исключение, если в `plugins` нет `faker()`.

## `scope: 'operations'` и `PluginContext`

Плагины со `scope: 'operations'` (как `sdk`, `tanstackQuery`, `swr`) вызываются повторно для каждой группы при `groupBy: 'tags'` или `'endpoints'`. В `generate` передаётся `ctx` с путями импорта, которые нужно использовать вместо хардкода:

```ts
generate: (ir, config, ctx) => {
  const sdkImport = ctx?.sdkImportPath ?? './sdk' // меняется в зависимости от groupBy
  // ...
}
```

## `generateRootFiles` — общие файлы

Если плагину нужно один раз сгенерировать файл, общий для всех групп (например `query-keys.ts`), используй `generateRootFiles`:

```ts
generateRootFiles: (ir, config) => [
  { fileName: 'my-shared-file.ts', code: '/* ... */' },
],
```
