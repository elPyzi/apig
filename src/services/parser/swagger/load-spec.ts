import { load, dereference } from '@scalar/openapi-parser';
import { fetchUrls } from '@scalar/openapi-parser/plugins/fetch-urls';
import { readFiles } from '@scalar/openapi-parser/plugins/read-files';
import { upgrade } from '@scalar/openapi-upgrader';
import type { OpenAPIV3 } from 'openapi-types';
import { logger } from '@libs/logger';
import { authFailureMessage, specRequestHeaders } from '@libs/auth';
import type { ZvyappyConfig, LoadSpecResult } from '@models';
import { bundleExternalRefs } from './bundle-external';

const isUrl = (value: unknown): value is string =>
  typeof value === 'string' && /^https?:\/\//.test(value);

/**
 * `readFiles` claims every relative `$ref`, including one inside a spec that
 * was fetched over HTTP, and joins it with `path.join` — which collapses
 * `http://host` into `http:/host`, a path that exists nowhere. Next to a URL a
 * relative reference is resolved the way a browser would, and the result is
 * then picked up by `fetchUrls`.
 */
const readFilesBesideUrls = () => {
  const files = readFiles();
  return {
    ...files,
    resolvePath: (value: unknown, reference: string): string =>
      isUrl(value)
        ? new URL(reference, value).href
        : files.resolvePath!(value, reference),
  };
};

const isSwagger2 = (spec: Record<string, unknown>): boolean =>
  typeof spec.swagger === 'string' && spec.swagger.startsWith('2.');

const convertToV3 = (spec: Record<string, unknown>): Record<string, unknown> =>
  upgrade(spec, '3.0') as Record<string, unknown>;

export const loadSpec = async (
  config: ZvyappyConfig,
): Promise<LoadSpecResult> => {
  const input =
    typeof config.input === 'function' ? await config.input() : config.input;

  // the parser reports a refused request as unparseable content, so the
  // status is caught here to say what actually went wrong
  // asserted, not annotated: assigned inside a callback, so TypeScript would
  // otherwise narrow it to `null` for good
  let refused = null as { status: number; url: string } | null;
  const fetchWithAuth = async (url: string): Promise<Response> => {
    const res = await fetch(url, {
      headers: specRequestHeaders(url, input, config.auth),
    });
    if ((res.status === 401 || res.status === 403) && !refused)
      refused = { status: res.status, url };
    return res;
  };

  const loaded = await load(input, {
    plugins: [fetchUrls({ fetch: fetchWithAuth }), readFilesBesideUrls()],
  });

  if (refused) {
    const { status, url } = refused;
    throw new Error(authFailureMessage(status, url, config.auth));
  }

  if (loaded.errors?.length) {
    throw new Error(
      `Failed to load specification: ${loaded.errors.map((e) => e.message).join(', ')}`,
    );
  }

  let filesystem = loaded.filesystem;

  // before the 2.0 upgrade, which reloads from a serialized document and so
  // leaves the neighbouring files behind
  bundleExternalRefs(filesystem);

  const raw = loaded.specification as Record<string, unknown>;
  if (isSwagger2(raw)) {
    const converted = convertToV3(raw);
    const reloaded = await load(JSON.stringify(converted));
    filesystem = reloaded.filesystem;
  }

  const { specification, errors } = dereference(filesystem);

  if (errors?.length) {
    logger.warn(
      `${errors.length} unresolvable $ref(s) in specification — affected fields will be typed as unknown`,
    );
  }

  const spec = specification as unknown as OpenAPIV3.Document;

  const schemaNames = new Map<object, string>();
  for (const [name, s] of Object.entries(spec.components?.schemas ?? {})) {
    schemaNames.set(s as object, name);
  }

  return { spec, schemaNames };
};
