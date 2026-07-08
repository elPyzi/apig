# CLI

## Commands

### `apig generate` (alias `g`)

Run code generation.

```bash
apig generate
```

**Flags:**

| Flag | Description |
|------|-------------|
| `-c, --config <path>` | Path to the config file (defaults to `apig.config.ts`) |
| `-d, --dry-run` | Preview without writing files |
| `-w, --watch` | Watch the spec and config for changes |

```bash
apig generate --dry-run
apig generate --watch
apig generate -c ./config/apig.config.ts
```

With `--watch`, for local spec files both the config and the spec file itself are watched. For spec files served over a URL, watching the spec is not supported — only the config is watched.

---

### `apig start` (alias `s`)

An interactive setup wizard — choose plugins and output options through terminal prompts.

```bash
apig start
```

---

### `apig config` (alias `c`)

Scaffolds an `apig.config.ts` file in the current directory. This command does **not** print the resolved config — it generates a new config file.

```bash
apig config
```

If `apig.config.ts` already exists, the command exits with an error.

**Flags:**

| Flag | Description |
|------|-------------|
| `-p, --preset <name>` | Use one of the built-in presets |
| `--list-presets` | Show the list of available presets and exit |

```bash
apig config --list-presets
apig config --preset react
```

**Available presets:**

| Preset | Description |
|--------|-------------|
| `minimal` | TypeScript types + SDK fetch functions |
| `react` | TypeScript + SDK + TanStack Query + Zod (standard React stack) |
| `react-swr` | TypeScript + SDK + SWR + Zod |
| `testing` | React stack + Faker factories + MSW handlers for mocking |
| `forms` | TypeScript + SDK + Zod + React Hook Form resolvers |
| `full` | All plugins at once |

---

### `apig info` (alias `i`)

Shows statistics about the loaded spec without generating files: API title and version, input/output paths, `groupBy`, operation count (broken down by method), schema count, list of tags, and enabled plugins.

```bash
apig info
```

**Flags:**

| Flag | Description |
|------|-------------|
| `-c, --config <path>` | Path to the config file (defaults to `apig.config.ts`) |

---

### `apig versions`

List all saved snapshots (requires `versioning.enabled` in the config).

```bash
apig versions
```

**Flags:**

| Flag | Description |
|------|-------------|
| `-c, --config <path>` | Path to the config file |
| `-s, --storage <path>` | Snapshot storage directory (overrides the config) |

Columns: alias, snapshot ID, creation date.

---

### `apig version checkout <id|alias>`

Regenerate code from a saved snapshot.

```bash
apig version checkout abc123
apig version checkout gen5
```

**Flags:** `-c, --config <path>`, `--dry-run`

---

### `apig version show <id|alias>`

Detailed information about a snapshot: alias, ID, API version, generation number, creation date, comment, whether the spec was saved.

```bash
apig version show abc123
```

**Flags:** `-c, --config <path>`, `-s, --storage <path>`

---

## Custom config path

By default apig looks for `apig.config.ts` in the current directory. Use `-c` to point at a different file:

```bash
apig generate -c ./config/apig.config.ts
```
