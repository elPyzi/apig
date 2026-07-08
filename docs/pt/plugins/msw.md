# msw()

Gera handlers de requisição [Mock Service Worker](https://mswjs.io) a partir de operações OpenAPI.

Requer a presença do plugin `faker()` no array de plugins — caso contrário, lança um erro na geração.

## Uso

```ts
import { defineConfig, faker, msw } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [faker(), msw()],
})
```

## Exemplo de saída

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

## Regras de geração da resposta

- Uma resposta que é um array do esquema `X` é gerada como `[generate${X}()]` — não é criada uma função separada para listas (`generateUserList` etc.), a menos que seja um esquema nomeado próprio com campos `items`/`total`.
- Operações sem esquema de resposta e todas as operações `DELETE` retornam `new HttpResponse(null, { status: 204 })`.
- Operações com corpo de requisição (`requestBody`) o leem via `await request.json()`, sem usar o valor.
- Parâmetros de caminho (`{id}`) são convertidos automaticamente para o formato MSW (`:id`).

> **Particularidade conhecida:** o import de funções faker atualmente gerado aponta para `@/plugins/faker` — este é um caminho de alias interno do código-fonte do apig, e não um caminho relativo dentro do seu diretório de saída. Se o `msw.ts` gerado não compilar por causa desse import, ajuste o caminho manualmente para o arquivo com as factories faker no seu diretório de saída (por exemplo `./faker`).
