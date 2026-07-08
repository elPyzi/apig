# Cache

When `cache: true` is set, apig caches the parsed IR (intermediate representation) so it doesn't have to download and re-parse the spec on every run if it hasn't changed.

## Config

```ts
defineConfig({
  input: 'https://api.example.com/openapi.json',
  output: './src/api',
  cache: true,
  plugins: [typescript(), sdk()],
})
```

## How it works

**Remote specs (URL input):**

1. On first run — downloads and parses the spec, saves the IR and ETag to `.apig/cache/`
2. On subsequent runs — sends an `If-None-Match` header with the cached ETag
3. If the server returns `304 Not Modified` — uses the cached IR, skipping the re-download and re-parse
4. If the ETag changed — downloads and parses the updated spec, updates the cache

**Local files:**

1. On first run — computes a SHA-256 hash of the file contents, stores it alongside the IR
2. On subsequent runs — compares the current hash with the cached hash
3. If unchanged — uses the cached IR, skipping the parse
4. If changed — re-parses and updates the cache

File generation from the IR (the disk-writing step) always runs regardless — `cache` only saves the network request and spec parsing.

## Cache location

```
.apig/
  cache/
    <key>.ir.json     — cached IR
    <key>.meta.json   — ETag (for URLs) or spec hash (for local files)
```

`<key>` is the first 16 characters of the SHA-256 hash of the `input` value.

Add it to `.gitignore` if you don't want to commit the cache:

```
.apig/cache/
```
