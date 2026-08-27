Three commands for snapshots: listing them, details for one, and rolling back to it. They work on top of `versioning` from the config — for how the mechanism works, see the [versioning guide](../guides/versioning.md).

## apig versions — list snapshots

```bash
apig versions
```

**Flags:** `-c, --config <path>`, `-s, --storage <path>` — overrides `versioning.storage` from the config, if snapshots are stored somewhere else.

```text
ALIAS         SNAPSHOT ID               CREATED
------------  ------------------------  ----------------
gen5          a1b2c3d4e5f6a1b2c3d4      2026-08-20 14:32
v1.2.0-gen4   9f8e7d6c5b4a9f8e7d6c      2026-08-18 09:15  📌
gen3          1a2b3c4d5e6f1a2b3c4d      2026-08-15 11:00
```

A 📌 next to a row means the snapshot is in `versioning.pinVersions` — it won't get auto-deleted when `maxSaves` is exceeded. An empty list isn't an error — there just aren't any snapshots yet.

## apig version show — snapshot details

```bash
apig version show gen5
```

The first argument is the alias or the full snapshot ID. `-c, --config` and `-s, --storage` work the same way as for `versions`.

```text
Alias:        gen5
Snapshot:     a1b2c3d4e5f6a1b2c3d4
API Version:  1.2.0
Generation:   5
Created:      2026-08-20 14:32
Comment:      before auth refactor
Spec Saved:   true
```

`Spec Saved: true` means the OpenAPI spec itself was saved along with the snapshot — that's controlled by `versioning.saveSpec`. Without it, the snapshot only holds the IR: you can still roll back, but you can't see the original spec for that version.

## apig version checkout — roll back to a snapshot

```bash
apig version checkout gen5
```

Regenerates code from the saved IR — as if `apig generate` had been run at the moment the snapshot was created. `-c, --config` sets the config, `--dry-run` shows the result without writing files.

```bash
apig version checkout gen5 --dry-run
```

> **The current output gets overwritten**
>
> Checkout writes to the same `output` directory as a regular `generate`. If the spec changed and was regenerated after the snapshot, that version of the output will be replaced with code from the chosen snapshot. Run it with `--dry-run` first if you're not sure.

## Snapshot ID or alias

All three commands accept either the alias (`gen5`) or the full snapshot ID as the second argument — both resolve to the same storage. If you copied the whole line from `apig versions` output, date and all, separated by " - ", apig trims the extra part and takes just the ID.

## If versioning isn't enabled

```text
$ apig versions
No snapshots found.
```

Without `versioning: { enabled: true }` in the config, snapshots never get created — the commands don't fail, the list is just empty.

## What it works with

> Snapshots are written by regular `apig generate` when `versioning.enabled: true`. These three commands only read the storage, and for `checkout`, regenerate code from it — the version history itself lives independently of the current config.
