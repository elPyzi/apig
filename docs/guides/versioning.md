On every `apig generate` you can save a snapshot of the IR and the spec — to disk, right next to the project. You can roll back to any of them later with one command, no git and no manual backups needed.

## Turning it on

Off by default — apig writes nothing until you explicitly ask for it.

```ts
export default defineConfig({
input: "./openapi.json",
output: "./src/api",
plugins: [typescript(), sdk()],

versioning: {
enabled: true,
},
});
```

From this point on, every `apig generate` drops a snapshot into `.apig/versions`. `--dry-run` doesn't create a snapshot — a preview never makes it into history.

## What actually gets saved

A snapshot isn't a backup of the output files — it's the IR itself (the already-parsed and normalized spec) plus metadata.

```text
.apig/versions/
└── api_v1.2.0-gen_v5 - 20.08.2026 14:32/
  ├── ir.json
  ├── metadata.json
  └── spec.json          # only if saveSpec: true
```

`ir.json` is the same intermediate representation plugins generate code from. The generated `.ts` files don't go into the snapshot — they're always rebuilt fresh from the IR when you roll back.

## Options

| Option          | Default           | What it does                                                                                                                                           |
| --------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`       | `false`           | Turns on saving a snapshot on every generation                                                                                                         |
| `storage`       | `.apig/versions`  | Where to put the snapshots                                                                                                                             |
| `saveSpec`      | `false`           | Also save the OpenAPI spec itself alongside the IR — handy if you need to see what an endpoint looked like before an edit, not just the generated code |
| `maxSaves`      | no limit          | How many snapshots to keep. Extras get deleted by creation date, oldest first                                                                          |
| `pinVersions`   | `[]`              | List of `snapshotId` values that `maxSaves` isn't allowed to delete                                                                                    |
| `aliasTemplate` | `gen{generation}` | Template for the snapshot's short name. Variables: `{generation}`, `{apiVersion}`, `{date}`                                                            |

## snapshotId vs alias — what's the difference

`snapshotId` is built from the API version in the spec and a sequential generation number for that version — `api_v{apiVersion}-gen_v{generation}`. It's unique, but awkward to type out by hand each time.

```text
api_v1.2.0-gen_v5
```

`alias` is a short name following the `aliasTemplate` pattern, `gen5` by default. Every CLI command accepts either one — whichever is easier to type.

```bash
apig version show gen5
apig version show api_v1.2.0-gen_v5
```

> **The generation number tracks the API version, not a global count**
>
> The `generation` counter is tracked separately for each `apiVersion` from the spec's `info.version`. Bump the API version from 1.2.0 to 2.0.0 and generations start over at 1, instead of continuing a shared count.

## Custom aliasTemplate

```ts
versioning: {
enabled: true,
aliasTemplate: "v{apiVersion}-{date}",
}
```

```text
v1.2.0-2026-08-20
```

If the template doesn't include `{generation}` or `{date}`, two consecutive snapshots can end up with the same alias — apig prints a warning to the console but still saves the snapshot. You'll then have to resolve the conflicting alias in CLI commands by its full `snapshotId`.

## Limit and protection from deletion

```ts
versioning: {
enabled: true,
maxSaves: 10,
pinVersions: ["api_v1.0.0-gen_v1"],
}
```

When `maxSaves` is exceeded, apig deletes the oldest snapshots — except the ones in `pinVersions`. If you've pinned more snapshots than `maxSaves` allows, or exactly that many, the next generation fails with an error — free up a slot in `pinVersions` or raise the limit.

## Viewing history

```text
apig versions

ALIAS SNAPSHOT ID CREATED

---

gen5 api_v1.2.0-gen_v5 20.08.2026 14:32
gen4 api_v1.2.0-gen_v4 18.08.2026 09:15 📌
gen3 api_v1.1.0-gen_v3 15.08.2026 11:00
```

```bash
apig version show gen5

Alias: gen5
Snapshot: api_v1.2.0-gen_v5
API Version: 1.2.0
Generation: 5
Created: 20.08.2026 14:32
Comment: before auth refactor
Spec Saved: true
```

`Comment` comes from the `comment` option in `defineConfig` — handy to set once before a risky spec edit, generate, and remove the comment again afterward.

## Rolling back

```bash
apig version checkout gen5
```

Takes the saved IR and runs it through the current plugins from the config — just like a regular `apig generate`, except the data source is history instead of a fresh spec. Writes to the same `output` directory and overwrites what's there now — no new snapshot gets created, a rollback doesn't count as a generation. Run it with `--dry-run` first if you're not sure it's fine to overwrite.

> **Plugins from the config, not from the snapshot**
>
> A rollback applies the current set of plugins and their options to the saved IR — if you added `zod()` to the config after the snapshot was taken, checkout generates Zod schemas too, even though they didn't exist at snapshot time.

## When you need this

- Before a risky spec edit — so you can roll back if something goes wrong
- Keeping an API revision history separate from git, if the spec itself isn't in the repository

If the spec is already versioned in git next to the code, that's usually enough, and you can skip `versioning` entirely.
