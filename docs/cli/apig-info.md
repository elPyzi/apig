Shows stats about the spec without generating any files. A quick way to check that the config actually points at the right API and sees every operation.

## Usage

```bash
apig info
```

Alias — `apig i`. The only flag is `-c, --config <path>`, the config path, defaulting to `apig.config.ts`.

```bash
apig info -c ./config/apig.config.ts
```

## What it prints

```text
------------------------------------------------
API:       Petstore v1.0.0
Input:     ./openapi.json
Output:    ./src/api
Group by:  tags
------------------------------------------------
Operations: 14
  DELETE  2
  GET     8
  POST    3
  PUT     1
Schemas:    9
Tags:       pet, store, user
------------------------------------------------
Plugins:   typescript, sdk, zod, tanstack-query
------------------------------------------------
```

Data is read directly from the spec and the IR — nothing gets cached separately from what `cache: true` in the config already gives you.

## Multiple configs

If `apig.config.ts` exports an array, `info` prints a stats block for each config in turn — same as `generate`.

## If the spec fails to load

```text
$ apig info
Failed to load spec: ENOENT: no such file or directory, open './openapi.json'
```

The process exits with code 1. Handy as a quick check before `apig generate` in CI — if `info` fails, the spec isn't reachable and generation won't work either.

## What it works with

> Writes nothing to disk — it only parses the spec and reads the config. Safe to run as many times as you want, even alongside `--watch` in another terminal.
