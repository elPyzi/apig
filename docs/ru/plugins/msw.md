# msw()

Генерирует [Mock Service Worker](https://mswjs.io) обработчики запросов из OpenAPI операций.

Требует наличия плагина `faker()` в массиве плагинов — иначе выбрасывает ошибку при генерации.

## Использование

```ts
import { defineConfig, faker, msw } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [faker(), msw()],
})
```

## Пример вывода

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

## Правила генерации ответа

- Ответ, который является массивом схемы `X`, генерируется как `[generate${X}()]` — отдельной функции для списков (`generateUserList` и т.п.) не создаётся, если только это не отдельная именованная схема с полями `items`/`total`.
- Операции без схемы ответа и все `DELETE` операции возвращают `new HttpResponse(null, { status: 204 })`.
- Операции с телом запроса (`requestBody`) читают его через `await request.json()`, не используя значение.
- Параметры пути (`{id}`) автоматически конвертируются в формат MSW (`:id`).

> **Известная особенность:** сгенерированный импорт функций faker сейчас указывает на `@/plugins/faker` — это внутренний путь алиаса из исходного кода apig, а не относительный путь внутри твоей директории вывода. Если сгенерированный `msw.ts` не собирается из-за этого импорта, поправь путь вручную на файл с faker-фабриками в твоей директории вывода (например `./faker`).
