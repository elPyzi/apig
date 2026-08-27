The command reads the config, parses the spec, runs it through the plugins, and writes the files to disk.

## Usage

```bash
apig generate
```

Alias — `apig g`. By default it looks for `apig.config.ts` in the current directory.

## Flags

| Flag                  | What it does                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `-c, --config <path>` | Path to the config file. Defaults to `apig.config.ts` in the current directory.             |
| `-d, --dry-run`       | Runs the whole generation but doesn't write any files — shows what would change.            |
| `-w, --watch`         | Keeps the process alive and regenerates the code on every change to the spec or the config. |

```bash
apig generate --dry-run
apig generate --watch
apig generate -c ./config/apig.config.ts
```

## Multiple configs in one file

If `apig.config.ts` exports an array, `generate` runs through it one at a time and prints `config.name` before each run — if a name is set.

```ts
export default [
defineConfig({ name: "petstore", input: "./specs/petstore.json", ... }),
defineConfig({ name: "payments", input: "./specs/payments.json", ... }),
];
```

## Watch mode

For a local spec file, both the file itself and the config are watched. For a spec fetched from a URL, only the config is — there's no way to watch a file over the network.

```text
$ apig generate --watch
Watching: apig.config.ts
Watching: ./openapi.json
Watching for changes. Press Ctrl+C to stop.
```

Changes are debounced by 300 ms — a quick double-save doesn't trigger generation twice.

> **watch + dry-run**
>
> This combination is valid — every change just prints what would change, without writing to disk. Handy for watching a live diff while you're still working on the spec.

## When generation fails

On a config error, the CLI doesn't just print a stack trace — it prints a list of specific problems with links to the docs:

```text
Generation failed: Config validation failed
✗ mcp plugin requires sdk plugin — add sdk() to plugins
  https://travjek.dev/docs/plugins/mcp
```

Without `--watch`, the process exits with code 1 — handy for CI. With `--watch`, the process stays alive and waits for the next change, even if the current run failed.

## What it works with

> The only command that actually writes files. `info` and `version show` only read — they don't put anything on disk.
