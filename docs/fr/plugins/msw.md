# msw()

Génère des gestionnaires de requêtes [Mock Service Worker](https://mswjs.io) depuis les opérations OpenAPI.

Nécessite la présence du plugin `faker()` dans le tableau de plugins — sinon une erreur est levée lors de la génération.

## Utilisation

```ts
import { defineConfig, faker, msw } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [faker(), msw()],
})
```

## Exemple de sortie

```ts
import { http, HttpResponse } from 'msw';
import { faker } from '@faker-js/faker';
import { generateUser } from '@/plugins/faker';

export const handlers = [
  http.get('/users', () => {
    return HttpResponse.json([generateUser()]);
  }),
  http.post('/users', async ({ request }) => {
    await request.json();
    return HttpResponse.json(generateUser());
  }),
  http.get('/users/:id', ({ params }) => {
    return HttpResponse.json(generateUser());
  }),
  http.delete('/users/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
```

## Règles de génération de la réponse

- Une réponse qui est un tableau du schéma `X` est générée sous la forme `[generate${X}()]` — aucune fonction séparée n'est créée pour les listes (`generateUserList`, etc.), sauf s'il s'agit d'un schéma nommé distinct avec des champs `items`/`total`.
- Les opérations sans schéma de réponse et toutes les opérations `DELETE` renvoient `new HttpResponse(null, { status: 204 })`.
- Les opérations avec un corps de requête (`requestBody`) le lisent via `await request.json()`, sans utiliser la valeur.
- Les paramètres de chemin (`{id}`) sont automatiquement convertis au format MSW (`:id`).

> **Particularité connue :** l'import des fonctions faker généré pointe actuellement vers `@/plugins/faker` — c'est un chemin d'alias interne du code source d'apig, pas un chemin relatif à l'intérieur de ton répertoire de sortie. Si le `msw.ts` généré ne compile pas à cause de cet import, corrige le chemin manuellement vers le fichier contenant les fabriques faker dans ton répertoire de sortie (par exemple `./faker`).
