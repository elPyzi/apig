# Cache

With `cache: true` in `defineConfig`, apig caches the **parsed IR** on disk, to avoid re-downloading and re-parsing the spec on every run when it hasn't changed.

```ts
defineConfig({
  input: 'https://api.example.com/openapi.json',
  cache: true,
  plugins: [typescript(), sdk()],
})
```

## How It Works

**Remote specs (URL):**

1. First run — downloads and parses, saves IR + ETag under `.apig/cache/`
2. Later runs — sends `If-None-Match: <etag>`
3. `304 Not Modified` → uses the cached IR, skips re-download and re-parse
4. ETag changed → downloads, parses, and updates the cache

**Local files:**

1. First run — hashes the file (SHA-256), saves the hash alongside the IR
2. Later runs — compares the current hash to the cached one
3. Unchanged → uses the cached IR, skips re-parsing
4. Changed → re-parses and updates the cache

Note: the file-writing step always runs from the IR regardless of cache hit/miss — `cache` only saves the network request and parse step.

## Location

```
.apig/cache/
  <key>.ir.json    — cached IR
  <key>.meta.json  — ETag (URL) or spec hash (local file)
```

`<key>` is the first 16 hex chars of the SHA-256 hash of the `input` value.

Add to `.gitignore` if you don't want to commit the cache:

```
.apig/cache/
```
