Generates request functions from OpenAPI operations. `sdk()` takes no options — all its behavior is configured from outside, through `defineConfig`.

## Usage

```ts

import { defineConfig, typescript, sdk } from "@travjek/apig";

export default defineConfig({
input: "./openapi.json",
output: "./src/api",
plugins: [typescript(), sdk()],
});

```

From a `GET /pets/{id}` operation you get this function in `sdk.ts`:

```ts
export const getPetById = async (id: string): Promise<Pet> => {
const r = await fetch(`${baseUrl}/pets/${id}`);
if (!r.ok) throw new ApigError(r.status, await parseErrorBody(r));
return r.json() as Promise<Pet>;
};
```

## Config options that affect sdk()

The plugin doesn't configure anything on its own — it pulls these options from the root of `defineConfig`:

| Option           | Default     | What it does                                                                                                                                                                |
| ---------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`     | `fetch`     | Which client the function calls under the hood — `fetch`, `axios`, `ky`, `ofetch`, or `wretch`. Change it once in the config and the whole SDK gets rewritten.              |
| `baseUrl`        | —           | Prefix put in front of the request path. Set it and every function sends its request to `` `${baseUrl}/pets` `` instead of a bare `/pets`.                                  |
| `errorHandling`  | `true`      | With `true`, every function throws an `ApigError` on a non-2xx response. You can plug in your own error class via `{ path, export }`, or turn it off entirely with `false`. |
| `rawResponse`    | `false`     | By default a function returns only the response body. Turn this on and it returns an object — `{ body, status, headers }` — if you need the headers or the status code.     |
| `apiLogging`     | `false`     | Adds `console.log(functionName, response)` to every function. A quick way to see what actually went out and came back — no debugger needed.                                 |
| `functionNaming` | `camelCase` | How functions get named: `getPetById`, `get_pet_by_id`, `GetPetById`, and so on.                                                                                            |
| `groupBy`        | `none`      | Splits `sdk.ts` across folders — by tag, by operation, or by endpoint — instead of one flat file.                                                                           |

## Headers on requests

Parameters with `in: header` in the spec don't get mixed in with query params — they arrive as a separate, last `headers` argument, after path, query, and body.

```ts
export const getPetById = async (
id: string,
headers: { 'X-Request-Id': string; 'X-Trace-Id'?: string },
): Promise<Pet> => {
const r = await fetch(`${baseUrl}/pets/${id}`, { headers });
if (!r.ok) throw new ApigError(r.status, await parseErrorBody(r));
return r.json() as Promise<Pet>;
};
```

Header names in the type are always quoted — `'X-Request-Id'`, not `X-Request-Id` — because a hyphen isn't allowed in a JS identifier, while hyphens are completely normal in HTTP headers.

## Query: arrays, booleans, and serialization styles

An array query parameter is typed as an array, not as a plain `string` — you used to have to cast it by hand just to pass more than one value.

```ts
export const listPets = async (
params?: { tags?: string[]; inStock?: boolean },
): Promise<PetList> => {
const r = await fetch(`${baseUrl}/pets${toQuery(params)}`);
if (!r.ok) throw new ApigError(r.status, await parseErrorBody(r));
return r.json() as Promise<PetList>;
};
```

The array serialization format in the query string comes from `style`/`explode` in the spec — `?tags=a&tags=b` (repeat), `?tags=a,b` (comma), a space or `|`, or `deepObject` like `?filter[status]=active`. The `toQuery` helper takes the right format as a second argument and builds the string itself — you never serialize anything by hand.

> **Styles only work with fetch**
>
> `style`/`explode` are implemented inside `toQuery`, and only the `fetch` adapter calls it. The other clients — `axios`, `ky`, `ofetch`, `wretch` — serialize the query themselves, their own way. If the spec describes a non-standard style and the client isn't `fetch`, apig prints a warning to the console during generation and just ignores the style — you configure that serialization on the client instance itself in that case.

## Custom HTTP client

For `axios`, `ky`, `ofetch`, and `wretch` you need a ready-made client instance — apig doesn't create it, only imports it.

```ts
httpClient: {
name: "axios",
path: "./lib/axios",
export: "api",
}
```

The function in `sdk.ts` then looks like this:

```ts
import { api } from '../lib/axios';

export const getPetById = async (id: string): Promise<Pet> => {
const r = await api.get(`/pets/${id}`);
return r.data;
};
```

For all the clients and ready-to-use file examples, see the [configuration](../get-started/configuration.md) page.

## Error handling

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

## Works well with

> `tanstackQuery()`, `swr()`, and `mcp()` wrap the functions from `sdk()` — they won't build without it. Types for parameters and responses come from whichever of `typescript()`, `zod()`, `valibot()`, or `yup()` is enabled.
