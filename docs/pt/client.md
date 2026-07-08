# Cliente ApigError

## Classe `ApigError`

Quando `errorHandling` está habilitado (padrão `true`), o apig gera a classe `ApigError` diretamente no diretório de saída — no arquivo `config.ts`. Isso **não** é uma exportação do pacote `@travjek/apig` — é código gerado que fica ao lado do seu SDK.

```ts
// gerado em ./src/api/config.ts
export class ApigError<T = unknown> extends Error {
  status: number
  body: T
  constructor(status: number, body: T) {
    super(`ApigError ${status}`)
    this.name = 'ApigError'
    this.status = status
    this.body = body
  }
}
```

As funções SDK geradas lançam essa classe em respostas que não são 2xx.

### Capturando erros

```ts
import { ApigError } from './api/config'
import { getUser } from './api/sdk'

try {
  const user = await getUser('123')
} catch (e) {
  if (e instanceof ApigError) {
    console.log(e.status) // 404
    console.log(e.body)   // corpo da resposta do servidor
  }
}
```

## `@travjek/apig/client`

Uma pequena biblioteca de runtime com funções guard type-safe — útil quando não é conveniente importar a classe `ApigError` gerada (por exemplo, em utilitários compartilhados fora do diretório de saída).

```ts
import { isApigError, isApigStatus } from '@travjek/apig/client'
import type { ApigErrorLike } from '@travjek/apig/client'
```

### `isApigError(error)`

Verifica se o erro foi lançado pelo SDK gerado (via `error.name === 'ApigError'`), sem importar a classe concreta:

```ts
import { isApigError } from '@travjek/apig/client'

try {
  await getUser('123')
} catch (e) {
  if (isApigError(e)) {
    console.log(e.status)
    console.log(e.body)
  }
}
```

### `isApigStatus(error, status)`

Verifica o erro e um status HTTP específico em uma única chamada:

```ts
import { isApigStatus } from '@travjek/apig/client'

const { data, error } = useGetUserQuery('123')

if (isApigStatus(error, 404)) return <NotFound />
if (isApigStatus(error, 403)) return <Forbidden />
```

## Classe de erro personalizada

A classe `ApigError` pode ser substituída pela sua própria via `defineConfig`:

```ts
defineConfig({
  errorHandling: { path: './lib/MyCustomError', export: 'MyCustomError' },
  plugins: [sdk()],
})
```

As funções geradas lançarão `MyCustomError` em vez de `ApigError`. A classe deve ser importável a partir do caminho indicado.

## Desabilitando o tratamento de erros

```ts
defineConfig({
  errorHandling: false,
  plugins: [sdk()],
})
```

As funções geradas não vão encapsular os erros — `fetch`/`axios` etc. propagam as exceções como estão.
