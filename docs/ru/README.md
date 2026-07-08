# @travjek/apig

Мощный и удобный генератор кода из OpenAPI спецификаций, который берёт на себя всю боль интеграции с API — и делает твой день чуточку счастливее.

## Установка

```bash
npm install -D @travjek/apig
```

## Быстрый старт

```ts
// apig.config.ts
import { defineConfig, typescript, sdk, zod, tanstackQuery } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [
    typescript(),
    sdk(),
    zod({ withTypes: true }),
    tanstackQuery(),
  ],
})
```

```bash
npx apig generate
```

## Плагины

| Плагин | Описание |
|--------|----------|
| `typescript()` | TypeScript типы из OpenAPI схем |
| `sdk()` | Типизированные функции запросов (`fetch`, `axios`, `ky`, `ofetch`, `wretch`) |
| `zod()` | Zod схемы с email, uuid, min/max, discriminated unions |
| `valibot()` | Valibot схемы |
| `yup()` | Yup схемы |
| `tanstackQuery()` | TanStack Query v5 хуки |
| `swr()` | SWR хуки |
| `rhf()` | Резолверы для React Hook Form |
| `faker()` | Faker.js фабрики |
| `msw()` | Обработчики Mock Service Worker |

## CLI

```bash
apig generate           # генерация кода
apig generate --watch   # режим отслеживания изменений
apig generate --dry-run # предпросмотр без записи файлов
apig versions           # список сохранённых снапшотов
apig info               # статистика по спецификации без генерации
```

## Документация

- [Конфигурация](./config.md)
- [CLI](./cli.md)
- [Плагины](./plugins/index.md)
  - [typescript()](./plugins/typescript.md)
  - [sdk()](./plugins/sdk.md)
  - [zod()](./plugins/zod.md)
  - [valibot()](./plugins/valibot.md)
  - [yup()](./plugins/yup.md)
  - [tanstackQuery()](./plugins/tanstack-query.md)
  - [swr()](./plugins/swr.md)
  - [rhf()](./plugins/rhf.md)
  - [faker()](./plugins/faker.md)
  - [msw()](./plugins/msw.md)
- [Создание своего плагина](./custom-plugin.md)
- [ApigError клиент](./client.md)
- [Кэш](./cache.md)
- [endpointsMap](./endpoints-map.md)

## Лицензия

MIT
