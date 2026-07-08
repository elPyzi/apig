# msw()

Genera manejadores de solicitudes de [Mock Service Worker](https://mswjs.io) a partir de las operaciones OpenAPI.

Requiere que el plugin `faker()` esté presente en el array de plugins — de lo contrario lanza un error durante la generación.

## Uso

```ts
import { defineConfig, faker, msw } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [faker(), msw()],
})
```

## Ejemplo de salida

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

## Reglas de generación de la respuesta

- Una respuesta que es un array del esquema `X` se genera como `[generate${X}()]` — no se crea una función independiente para listas (`generateUserList`, etc.), a menos que sea un esquema con nombre propio y con campos `items`/`total`.
- Las operaciones sin esquema de respuesta y todas las operaciones `DELETE` devuelven `new HttpResponse(null, { status: 204 })`.
- Las operaciones con cuerpo de solicitud (`requestBody`) lo leen mediante `await request.json()`, sin usar el valor.
- Los parámetros de ruta (`{id}`) se convierten automáticamente al formato MSW (`:id`).

> **Particularidad conocida:** la importación generada de las funciones de faker actualmente apunta a `@/plugins/faker` — esta es una ruta interna de alias del código fuente de apig, no una ruta relativa dentro de tu directorio de salida. Si el `msw.ts` generado no compila por culpa de esta importación, corrige la ruta manualmente para que apunte al archivo con las fábricas de faker en tu directorio de salida (por ejemplo `./faker`).
