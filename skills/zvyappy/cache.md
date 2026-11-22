# Cache

With `cache: true` in `defineConfig`, zvyappy caches the **parsed IR** on disk, to avoid re-downloading and re-parsing the spec on every run when it hasn't changed.

```ts
defineConfig({
  input: 'https://api.example.com/openapi.json',
  cache: true,
  plugins: [typescript(), requests()],
})
```

## Options

```ts
cache: true                            // entries never expire; replaced when the spec changes
cache: { ttl: '7d' }                   // turns the cache on; ttl units: s, m, h, d
cache: { ttl: '12h', maxEntries: 20 }  // keep at most 20 entries (one per spec), oldest removed first
```

Expired entries are swept on the next run. Entries written by another zvyappy version are discarded, so an upgrade never serves a stale IR. A cache that cannot be written (read-only disk, permissions) only logs a warning — the run continues uncached.

## CLI

```bash
zvyappy cache status   # what is cached
zvyappy cache clear    # drop every entry so the next run parses again
```

## How It Works

**Remote specs (URL):**

1. First run — downloads and parses, saves IR + ETag under `.zvyappy/cache/`
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
.zvyappy/cache/
  <key>.ir.json    — cached IR
  <key>.meta.json  — ETag (URL) or spec hash (local file)
```

`<key>` is the first 16 hex chars of the SHA-256 hash of the `input` value.

Add to `.gitignore` if you don't want to commit the cache:

```
.zvyappy/cache/
```
