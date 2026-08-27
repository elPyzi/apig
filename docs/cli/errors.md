Before generating, `apig` validates `apig.config.ts` — field types, allowed enum values, plugin compatibility. If the config fails validation, generation never starts.

## What an error looks like

```text
✗ Generation failed: Config validation failed
- plugin "mcp" requires sdk() and zod() — its output imports from them
- unknown property "outputt" — did you mean "output"?

docs:  https://apig-docs.vercel.app/en/docs/get-started/configuration
plugins:  https://apig-docs.vercel.app/en/docs/get-started/configuration
```

The list at the bottom isn't generic — it's built from the specific fields that came up in errors. The `docs` link below is always there — it's the general configuration page.

## Error types

| What                               | Example message                                                                                                                                                                                       |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unknown property                   | `unknown property "outputt" — did you mean "output"?` The hint shows up when the name looks close to a real field — a typo, wrong case, or partial word.                                              |
| Required field                     | `input is required`, `httpClient.name is required`                                                                                                                                                    |
| Invalid enum value                 | `groupBy must be one of: "none" \| "tags" \| "endpoints" \| "operations"` Same goes for `httpClient.name`, `fileNaming`, `functionNaming`, `enumStyle`, `typeStyle`, `formatter`, `cliLogging.level`. |
| Wrong field type                   | `filter.tags must be an array of strings`, `errorHandling must be boolean or { path: string, export: string }`                                                                                        |
| Plugin missing a dependency        | `plugin "mcp" requires sdk() and zod() — its output imports from them` `msw()` pulls in `faker()`, `mcp()` pulls in `sdk()` and `zod()`, `rhf()` needs any one of `zod()`, `valibot()`, `yup()`.      |
| mcp() incompatible with apiLogging | `apiLogging cannot be used with the mcp() plugin — its console.log output corrupts the MCP stdio transport` The MCP server talks over stdout — any stray `console.log` corrupts the protocol.         |
| Duplicate plugins or files         | `plugin "zod" is listed more than once`, `plugins output to the same file "types.ts" — only the last one would be written`                                                                            |
| Multiple plugins generating types  | `plugins [zod, valibot] all emit TypeScript types — use only one, or set withTypes: false on the others`                                                                                              |

Checks don't stop at the first error — the whole config is validated at once, so the list shows everything that needs fixing right away, instead of one error per run.

## Links under the errors

Every field mentioned in the errors gets its own link. Almost all of them point to the configuration page — the exceptions:

```text
errorHandling  →  /docs/guides/error-handling
versioning     →  /docs/guides/versioning
everything else  →  /docs/get-started/configuration
```

The `docs` link at the top of the list is always the general configuration page — it's there no matter which fields broke.

## Exit code

Without `--watch`, the process exits with code 1 right after printing the errors — nothing gets written to disk. With `--watch`, the process stays alive and just waits for the next file change, even if the current run failed.

> Validation is only about the config itself: field types, enums, plugin compatibility. If the spec fails to load (file not found, broken URL), that's a different error — see `apig info`.
