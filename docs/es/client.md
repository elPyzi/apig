# Cliente ApigError

## Clase `ApigError`

Cuando `errorHandling` está activado (por defecto `true`), apig genera la clase `ApigError` directamente en el directorio de salida — en el archivo `config.ts`. Esto **no** es una exportación del paquete `@travjek/apig` — es código generado que se ubica junto a tu SDK.

```ts
// generado en ./src/api/config.ts
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

Las funciones SDK generadas lanzan esta clase en respuestas no 2xx.

### Capturar errores

```ts
import { ApigError } from './api/config'
import { getUser } from './api/sdk'

try {
  const user = await getUser('123')
} catch (e) {
  if (e instanceof ApigError) {
    console.log(e.status) // 404
    console.log(e.body)   // cuerpo de la respuesta del servidor
  }
}
```

## `@travjek/apig/client`

Una pequeña biblioteca en tiempo de ejecución con funciones guard type-safe — útil cuando no resulta cómodo importar la clase `ApigError` generada (por ejemplo, en utilidades compartidas fuera del directorio de salida).

```ts
import { isApigError, isApigStatus } from '@travjek/apig/client'
import type { ApigErrorLike } from '@travjek/apig/client'
```

### `isApigError(error)`

Verifica que el error fue lanzado por el SDK generado (mediante `error.name === 'ApigError'`), sin necesidad de importar la clase concreta:

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

Verifica el error y un código de estado HTTP concreto en una sola llamada:

```ts
import { isApigStatus } from '@travjek/apig/client'

const { data, error } = useGetUserQuery('123')

if (isApigStatus(error, 404)) return <NotFound />
if (isApigStatus(error, 403)) return <Forbidden />
```

## Clase de error personalizada

La clase `ApigError` puede reemplazarse por una propia mediante `defineConfig`:

```ts
defineConfig({
  errorHandling: { path: './lib/MyCustomError', export: 'MyCustomError' },
  plugins: [sdk()],
})
```

Las funciones generadas lanzarán `MyCustomError` en lugar de `ApigError`. La clase debe poder importarse desde la ruta indicada.

## Desactivar el manejo de errores

```ts
defineConfig({
  errorHandling: false,
  plugins: [sdk()],
})
```

Las funciones generadas no envolverán los errores — `fetch`/`axios`, etc. propagan las excepciones tal cual.
