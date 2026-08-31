An interactive setup wizard. Answer questions in the terminal and get a ready-to-use `apig.config.ts`, without writing a single line by hand.

## Usage

```bash
apig start
```

Alias — `apig s`. No flags.

## What it asks, in order

| Question                   | What it produces in the config                                                                                                                        |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plugins (checkboxes)       | `plugins`. `typescript` and `sdk` are checked by default.                                                                                             |
| OpenAPI spec (URL or path) | `input`                                                                                                                                               |
| Output directory           | `output.path`. `output.clean` is always `true`.                                                                                                       |
| Base URL (can be skipped)  | `baseUrl` — only makes it into the config if not empty                                                                                                |
| HTTP client                | `fetch`, `axios`, `ky`, or `ofetch`. Anything but `fetch` triggers a follow-up question for the path to the client instance file and the export name. |
| Query keys style           | Only if `tanstack-query` or `swr` is selected — `functions` or `object`.                                                                              |
| Group generated files by   | `groupBy`                                                                                                                                             |

After that come questions about `enumStyle`, `typeStyle` , `fileNaming`, `formatter`, and `index`. The wizard only writes values into the file that differ from the defaults — the resulting config stays compact, no clutter.

## Example result

Answered the questions for a React stack with Axios, got this:

```ts
// @travjek/apig — https://travjek.dev/docs
import { defineConfig, typescript, sdk, tanstackQuery, zod } from '@travjek/apig';

export default defineConfig({
input: 'https://api.example.com/openapi.json',
output: {
  path: 'src/api/generated',
  clean: true,
},
baseUrl: 'https://api.example.com',
httpClient: { name: 'axios', path: './src/lib/axios', export: 'axios' },
plugins: [
  typescript(),
  sdk(),
  tanstackQuery(),
  zod(),
],
});
```

Fields like `enumStyle` or `fileNaming` aren't in the file — the answers matched the defaults, so there's no reason to write them.

## start vs config

> `start` — a dialog with questions, ending in a config tailored to your specific project. `config` — a quick template or a ready-made preset, no questions asked. Not sure which plugins or style to pick — go with `start`. Know it already — `config --preset` is faster.

## Cancelling

```text
Aborted.
```

Shown after Ctrl+C or Esc on any question. No file gets created, the process exits with code 0 — this isn't an error, it's a deliberate cancellation.
