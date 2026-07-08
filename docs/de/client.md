# Client ApigError

## Klasse `ApigError`

Wenn `errorHandling` aktiviert ist (standardmäßig `true`), generiert apig die Klasse `ApigError` direkt in das Ausgabeverzeichnis — in die Datei `config.ts`. Das ist **kein** Export aus dem Paket `@travjek/apig` — es ist generierter Code, der neben deinem SDK liegt.

```ts
// generierte ./src/api/config.ts
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

Die generierten SDK-Funktionen werfen diese Klasse bei Antworten, die nicht 2xx sind.

### Fehler abfangen

```ts
import { ApigError } from './api/config'
import { getUser } from './api/sdk'

try {
  const user = await getUser('123')
} catch (e) {
  if (e instanceof ApigError) {
    console.log(e.status) // 404
    console.log(e.body)   // Antwortkörper des Servers
  }
}
```

## `@travjek/apig/client`

Eine kleine Laufzeitbibliothek mit typsicheren Guard-Funktionen — nützlich, wenn es unpraktisch ist, die generierte Klasse `ApigError` zu importieren (zum Beispiel in gemeinsam genutzten Hilfsfunktionen außerhalb des Ausgabeverzeichnisses).

```ts
import { isApigError, isApigStatus } from '@travjek/apig/client'
import type { ApigErrorLike } from '@travjek/apig/client'
```

### `isApigError(error)`

Prüft, ob der Fehler vom generierten SDK geworfen wurde (anhand von `error.name === 'ApigError'`), ohne die konkrete Klasse zu importieren:

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

Prüft den Fehler und einen bestimmten HTTP-Status in einem einzigen Aufruf:

```ts
import { isApigStatus } from '@travjek/apig/client'

const { data, error } = useGetUserQuery('123')

if (isApigStatus(error, 404)) return <NotFound />
if (isApigStatus(error, 403)) return <Forbidden />
```

## Benutzerdefinierte Fehlerklasse

Die Klasse `ApigError` kann über `defineConfig` durch eine eigene ersetzt werden:

```ts
defineConfig({
  errorHandling: { path: './lib/MyCustomError', export: 'MyCustomError' },
  plugins: [sdk()],
})
```

Die generierten Funktionen werfen dann `MyCustomError` statt `ApigError`. Die Klasse muss aus dem angegebenen Pfad importierbar sein.

## Fehlerbehandlung deaktivieren

```ts
defineConfig({
  errorHandling: false,
  plugins: [sdk()],
})
```

Die generierten Funktionen wrappen Fehler dann nicht — `fetch`/`axios` usw. werfen Exceptions unverändert durch.
