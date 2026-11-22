import type { SpecAuth } from '@models';

const originOf = (url: string): string | null => {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
};

/**
 * Headers for fetching `url` while loading the spec at `specUrl`.
 *
 * Credentials go only to the spec's own origin: an external `$ref` can point
 * at any host, and that host has no business receiving the password.
 */
export const specRequestHeaders = (
  url: string,
  specUrl: string,
  auth: SpecAuth | undefined,
): Record<string, string> => {
  if (!auth?.username || auth.password === undefined) return {};
  const origin = originOf(specUrl);
  if (!origin || originOf(url) !== origin) return {};
  const token = Buffer.from(`${auth.username}:${auth.password}`).toString(
    'base64',
  );
  return { Authorization: `Basic ${token}` };
};

/** Why a spec request was refused, phrased around the `auth` option. */
export const authFailureMessage = (
  status: number,
  url: string,
  auth: SpecAuth | undefined,
): string =>
  auth
    ? `${url} rejected the credentials in auth (HTTP ${status}) — check auth.username and auth.password`
    : `${url} requires authentication (HTTP ${status}) — set auth: { username, password } in the config`;
