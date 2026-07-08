# Client ApigError

## La classe `ApigError`

Quand `errorHandling` est activé (par défaut `true`), apig génère la classe `ApigError` directement dans le répertoire de sortie — dans le fichier `config.ts`. Ce n'est **pas** un export du package `@travjek/apig` — c'est du code généré qui se trouve à côté de ton SDK.

```ts
// ./src/api/config.ts généré
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

Les fonctions SDK générées lèvent cette classe sur les réponses non-2xx.

### Capturer les erreurs

```ts
import { ApigError } from './api/config'
import { getUser } from './api/sdk'

try {
  const user = await getUser('123')
} catch (e) {
  if (e instanceof ApigError) {
    console.log(e.status) // 404
    console.log(e.body)   // corps de la réponse du serveur
  }
}
```

## `@travjek/apig/client`

Une petite bibliothèque d'exécution avec des fonctions guard typées — utile quand il n'est pas pratique d'importer la classe `ApigError` générée (par exemple dans des utilitaires partagés en dehors du répertoire de sortie).

```ts
import { isApigError, isApigStatus } from '@travjek/apig/client'
import type { ApigErrorLike } from '@travjek/apig/client'
```

### `isApigError(error)`

Vérifie que l'erreur a été levée par le SDK généré (via `error.name === 'ApigError'`), sans importer la classe concrète :

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

Vérifie l'erreur et un statut HTTP précis en un seul appel :

```ts
import { isApigStatus } from '@travjek/apig/client'

const { data, error } = useGetUserQuery('123')

if (isApigStatus(error, 404)) return <NotFound />
if (isApigStatus(error, 403)) return <Forbidden />
```

## Classe d'erreur personnalisée

La classe `ApigError` peut être remplacée par la tienne via `defineConfig` :

```ts
defineConfig({
  errorHandling: { path: './lib/MyCustomError', export: 'MyCustomError' },
  plugins: [sdk()],
})
```

Les fonctions générées lèveront `MyCustomError` au lieu de `ApigError`. La classe doit être importable depuis le chemin indiqué.

## Désactiver la gestion des erreurs

```ts
defineConfig({
  errorHandling: false,
  plugins: [sdk()],
})
```

Les fonctions générées n'enrobent plus les erreurs — `fetch`/`axios`, etc. propagent les exceptions telles quelles.
