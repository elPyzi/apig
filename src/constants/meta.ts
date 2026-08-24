import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

/**
 * Documentation site root. Placeholder until the site ships — swap this one
 * literal and every doc link (banner, `apig start`, config validation errors)
 * follows.
 */
export const DOCS_BASE = 'https://example.com/docs';

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
