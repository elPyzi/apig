Builds an MCP server on top of the generated SDK. Every operation from the spec becomes a tool — an AI assistant like Claude calls your API directly, with nothing in between.

## Usage

```ts

import { defineConfig, typescript, sdk, zod, mcp } from "@travjek/apig";

export default defineConfig({
input: "./openapi.json",
output: "./src/api",
plugins: [
  typescript(),
  sdk(),
  zod(),
  mcp({ name: "petstore", version: "1.0.0" }),
],
});

```

> **Required dependencies**
>
> `mcp()` won't build without `sdk()` and `zod()` in the plugin list — it throws right during generation. SDK gives you the API call functions, Zod gives you the schemas for validating tool input parameters.

The output is an `mcp.ts` with the server and one tool per operation:

```ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getPetById } from './sdk';

export const server = new McpServer({ name: "petstore", version: "1.0.0" });

server.registerTool(
'getPetById',
{
description: 'Get a pet by ID',
inputSchema: { id: z.string() },
},
async ({ id }) => {
try {
const data = await getPetById(id);
return { content: [{ type: 'text', text: JSON.stringify(data) }] };
} catch (e) {
return { isError: true, content: [{ type: 'text', text: String(e) }] };
}
},
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

## Options

| Option    | Default   | What it does                                                                                                        |
| --------- | --------- | ------------------------------------------------------------------------------------------------------------------- |
| `name`    | `"apig"`  | The server name the MCP client sees — in the list of connected servers in Claude or another assistant.              |
| `version` | `"1.0.0"` | The server version, also visible to the client. Handy to bump on each spec rebuild so you can tell revisions apart. |

## How operation parameters become a tool's input

The tool's input schema mirrors the SDK function's signature: path parameters are flat fields, query goes under `params`, the request body goes under `body`.

```ts
// operation: PATCH /users/{id}?notify=true, body: UpdateUserBody
server.registerTool(
'updateUser',
{
  inputSchema: {
    id: z.string(),
    params: z.object({ notify: z.boolean().optional() }),
    body: UpdateUserSchema,
  },
},
async ({ id, params, body }) => {
  const data = await updateUser(id, body, params);
  return { content: [{ type: 'text', text: JSON.stringify(data) }] };
},
);
```

## What doesn't make it into the server

Operations with a `multipart` body are skipped entirely — a file upload can't be expressed as an MCP tool's input. apig prints a warning to the console listing the skipped operations; generation itself doesn't fail.

## Connecting to an MCP client

The file is a plain Node/Bun script that keeps an stdio channel open. Register it in the client's config:

```json
{
"mcpServers": {
  "petstore": {
    "command": "bun",
    "args": ["./src/api/mcp.ts"]
  }
}
}
```

> **stdout is for the protocol only**
>
> The MCP protocol lives on stdout. Any `console.log` from your code or a third-party library inside this process breaks the connection to the client — use `console.error` or a separate logger if you need to print anything.

## Runtime dependencies

The generated file needs `@modelcontextprotocol/sdk` and `zod` wherever it actually runs — apig only warns about this in the console, it doesn't install anything itself.

## Works well with

> Requires both `sdk()` and `zod()` at once — generation fails with a clear error if either is missing. `apiLogging: true` in the config is incompatible with `mcp()`: an extra `console.log` in an SDK function would land on that same stdout and break the protocol, so apig rejects that combination during config validation.
