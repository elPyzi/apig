# 커스텀 플러그인 만들기

플러그인은 apig의 핵심 확장 포인트입니다. 내장된 각 생성기(`typescript`, `sdk`, `zod` 등)는 그 자체가 `ApigPlugin` 인터페이스를 구현하는 플러그인입니다.

## `ApigPlugin` 인터페이스

```ts
import type { ApigPlugin } from '@travjek/apig'

export interface ApigPlugin {
  /** 고유한 플러그인 이름 — 중복 제거와 검사에 사용됩니다. */
  name: string;
  /** 확장자 없는 출력 파일의 기본 이름 ("sdk" → "sdk.ts"). */
  fileName: string;
  /**
   * "root"       — 전체 IR에 대해 한 번 호출됨 (types, zod, faker, msw, ...)
   * "operations" — groupBy=tags/endpoints일 때 각 그룹마다 호출됨 (sdk, tanstack, swr)
   */
  scope: 'root' | 'operations';
  generate: (ir: IR, config: ApigConfig, ctx?: PluginContext) => PluginResult;
  /** 선택 사항: 모든 그룹이 작성된 후 전체 IR과 함께 한 번 호출됨. */
  generateRootFiles?: (ir: IR, config: ApigConfig) => ExtraFile[];
  /** 유효성 검사 플러그인으로 동작할 때 typescript()의 억제를 비활성화합니다. 기본값 true. */
  withTypes?: boolean;
}
```

## `PluginResult`

`generate()`가 반환하는 결과:

```ts
interface PluginResult {
  code: string;         // 파일 내용
  exports: string[];     // 이름이 지정된 export (index.ts 구성에 사용)
  typeExports: string[]; // 타입 전용 export
}
```

## 최소 예제

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

설정에서 사용:

```ts
import { defineConfig } from '@travjek/apig'
import { myPlugin } from './my-plugin'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [myPlugin()],
})
```

## IR (Intermediate Representation, 중간 표현)

```ts
interface IR {
  operations: IROperation[]
  schemas: IRSchema[]
}

interface IROperation {
  id: string           // operationId (rename이 지정된 경우 적용 후)
  method: string        // 'get' | 'post' | 'put' | 'patch' | 'delete'
  path: string           // '/users/{id}'
  tag: string
  params: { path: IRParam[]; query: IRParam[] }
  body?: { schema: IRSchema; required: boolean; contentType: string }
  response?: IRSchema
  errors?: { status: string; schema: IRSchema }[]
}
```

## 다른 플러그인 존재 여부 확인

```ts
generate(ir, config) {
  const hasFaker = (config.plugins ?? []).some((p) => p.name === 'faker')
  if (!hasFaker) throw new Error('my-plugin requires the faker() plugin')
  // ...
}
```

내장 플러그인 `msw()`가 이렇게 동작합니다 — `plugins`에 `faker()`가 없으면 예외를 던집니다.

## `scope: 'operations'`와 `PluginContext`

`scope: 'operations'`인 플러그인(`sdk`, `tanstackQuery`, `swr`처럼)은 `groupBy: 'tags'` 또는 `'endpoints'`일 때 각 그룹마다 반복해서 호출됩니다. `generate`에는 하드코딩 대신 사용해야 할 import 경로가 담긴 `ctx`가 전달됩니다:

```ts
generate: (ir, config, ctx) => {
  const sdkImport = ctx?.sdkImportPath ?? './sdk' // groupBy에 따라 달라짐
  // ...
}
```

## `generateRootFiles` — 공유 파일

플러그인이 모든 그룹에 공통으로 사용되는 파일을 한 번만 생성해야 하는 경우(예: `query-keys.ts`), `generateRootFiles`를 사용하세요:

```ts
generateRootFiles: (ir, config) => [
  { fileName: 'my-shared-file.ts', code: '/* ... */' },
],
```
