# msw()

Generiert [Mock Service Worker](https://mswjs.io)-Anfrage-Handler aus OpenAPI-Operationen.

Erfordert, dass das Plugin `faker()` im Plugins-Array vorhanden ist — andernfalls wird bei der Generierung ein Fehler geworfen.

## Verwendung

```ts
import { defineConfig, faker, msw } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [faker(), msw()],
})
```

## Ausgabebeispiel

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

## Regeln für die Antwortgenerierung

- Eine Antwort, die ein Array des Schemas `X` ist, wird als `[generate${X}()]` generiert — für Listen wird keine eigene Funktion erzeugt (`generateUserList` usw.), es sei denn, es handelt sich um ein eigenes benanntes Schema mit den Feldern `items`/`total`.
- Operationen ohne Antwortschema und alle `DELETE`-Operationen geben `new HttpResponse(null, { status: 204 })` zurück.
- Operationen mit Anfragekörper (`requestBody`) lesen diesen über `await request.json()`, ohne den Wert zu verwenden.
- Pfadparameter (`{id}`) werden automatisch in das MSW-Format (`:id`) konvertiert.

> **Bekannte Einschränkung:** Der generierte Import der Faker-Funktionen verweist aktuell auf `@/plugins/faker` — das ist ein interner Alias-Pfad aus dem Quellcode von apig, kein relativer Pfad innerhalb deines Ausgabeverzeichnisses. Wenn die generierte `msw.ts` wegen dieses Imports nicht baut, korrigiere den Pfad manuell auf die Datei mit den Faker-Factories in deinem Ausgabeverzeichnis (zum Beispiel `./faker`).
