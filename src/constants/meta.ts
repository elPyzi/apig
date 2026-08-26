import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

/**
 * Documentation site root — used by the banner, `apig start`/`apig config`,
 * and as the fallback link in config validation errors.
 */
export const DOCS_BASE = 'https://apig-docs.vercel.app/en/docs/get-started/introduction';

/**
 * The single-page config reference. There are no per-option anchors on the
 * site, so every `defineConfig` field's doc link points here.
 */
export const CONFIG_DOCS_URL =
  'https://apig-docs.vercel.app/en/docs/get-started/configuration';

/** Guide pages that cover one config field in depth. */
export const GUIDE_DOCS = {
  errorHandling: 'https://apig-docs.vercel.app/en/docs/guides/error-handling',
  versioning: 'https://apig-docs.vercel.app/en/docs/guides/versioning',
} as const;

/**
 * Package version, read from the nearest package.json at runtime so `apig --version`
 * can never drift from what was published. Works both from `src` in dev and from
 * `dist` in the installed package.
 */
export const getVersion = (): string => {
  let dir = dirname(fileURLToPath(import.meta.url));

  for (let depth = 0; depth < 5; depth++) {
    try {
      const pkg = JSON.parse(
        readFileSync(join(dir, 'package.json'), 'utf-8'),
      ) as { version?: string };
      if (pkg.version) return pkg.version;
    } catch {
      // no package.json here — keep walking up
    }

    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return '0.0.0';
};
