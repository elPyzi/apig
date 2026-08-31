Every SDK function throws `ApigError` on a non-2xx response — no matter which HTTP client it uses under the hood. Controlled by the `errorHandling` option in `defineConfig`.

## What it looks like at the call site

```ts
try {
const pet = await getPetById("1");
} catch (e) {
if (e instanceof ApigError) {
  console.log(e.status, e.body);
}
}
```

`ApigError` is generated automatically in `config.ts` along with the SDK itself — nothing extra to wire up.

## Three modes

| errorHandling      | What happens                                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| `true` (default)   | Generates the built-in `ApigError` class                                                              |
| `false`            | Error handling is off entirely — an SDK function just re-throws whatever the HTTP client itself threw |
| `{ path, export }` | Uses your own error class instead of the built-in one                                                 |

```ts
errorHandling: {
path: "./lib/errors",
export: "ApiError",
}
```

Your own class needs a constructor that accepts `(status: number, body: unknown)` — that's exactly how the SDK function calls it, the signature is hardcoded into the generator.

## The ApigError class

```ts
export class ApigError<T = unknown> extends Error {
status: number;
body: T;
constructor(status: number, body: T) {
  super(`ApigError ${status}`);
  this.name = 'ApigError';
  this.status = status;
  this.body = body;
}
}
```

`status` is the response's HTTP code, `body` is the error body as-is, with no extra parsing on top. Exported as a plain class, caught with `instanceof` like any other.

## Different clients, the same ApigError

Internally, each HTTP client's error looks different, but the SDK function always hands you back the same `ApigError`.

| Client   | What it normalizes                                                               |
| -------- | -------------------------------------------------------------------------------- |
| `fetch`  | Checks `r.ok`, reads the body via `parseErrorBody`                               |
| `axios`  | Catches `isAxiosError`, takes the status and data from `error.response`          |
| `ky`     | Catches `HTTPError`, reads JSON from `error.response`                            |
| `ofetch` | Catches `FetchError`, takes `status` and `data` straight off the error object    |
| `wretch` | Catches the error by the presence of `status`, takes `json` from the same object |

Switch `httpClient` in the config and you don't have to touch the calling code — `catch (e instanceof ApigError)` works the same way for all five.

## Non-JSON error bodies

A gateway can respond with a 502 and an HTML page instead of JSON. `response.json()` in that case throws its own exception and masks the real error behind a parsing failure — so apig reads the body as text first, and only then tries to parse it.

```ts
export const parseErrorBody = async (response: Response): Promise<unknown> => {
const text = await response.text().catch(() => '');
if (!text) return undefined;
try {
  return JSON.parse(text) as unknown;
} catch {
  return text;
}
};
```

Only used by the `fetch` adapter — the other clients decide for themselves how to parse the response body, and do it before the error ever reaches apig.

## Typed errors by status code

If the spec describes specific response codes with a body — 400, 404, 409, and so on — apig collects them into a single union type per operation.

```json
"responses": {
"200": { "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Pet" } } } },
"404": { "content": { "application/json": { "schema": { "$ref": "#/components/schemas/NotFoundError" } } } },
"409": { "content": { "application/json": { "schema": { "$ref": "#/components/schemas/ConflictError" } } } }
}
```

```ts
export type GetPetByIdErrors =
| { status: 404; body: NotFoundError }
| { status: 409; body: ConflictError };
```

The type lives in `sdk.ts` right next to the function itself. Responses under code 400 don't go into it — that's the `responseType`'s territory, not errors.

This is only a description in the spec — at runtime it still always throws the same `ApigError<unknown>`. The type exists so you can narrow `e.body` after checking `e.status` by hand:

```ts
try {
await getPetById("1");
} catch (e) {
if (e instanceof ApigError) {
  const err = e as ApigError<GetPetByIdErrors["body"]>;
  if (e.status === 404) {
    // err.body is now NotFoundError
  }
}
}
```

## Full response instead of just data

```ts
// By default — just the body
const pets = await listPets(); // PetList

// rawResponse: true — { body, status, headers }
const { body, status, headers } = await listPets();
```

`rawResponse` doesn't replace error handling — a non-2xx response still throws `ApigError`, a successful response just arrives in full, together with the status and headers.

## Errors in plugins built on top of the SDK

> `tanstackQuery()` and `swr()` plug `ApigError` in as the second generic in `useQuery` / `useSWR` — if an operation has typed errors described, the hook's type gets not just `ApigError` but `ApigError<GetPetByIdErrors["body"]>`. In `mcp()`, the error never propagates outward — the tool catches it itself and returns `{ isError: true, content: [...] }`, so a failed call doesn't take down the whole MCP connection.
