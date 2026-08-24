import { HTTP_CLIENTS, type HttpClients, type HttpMethodLower } from '@models';

export interface AdapterCtx {
  /** URL as a template literal, backticks included: `` `https://api/pets/${id}` `` */
  url: string;
  /** Response type name used for the generic / cast. */
  type: string;
  /** Identifier of the user's client instance (empty for plain fetch). */
  client: string;
  hasQuery: boolean;
  hasBody: boolean;
  /** Operation declares `in: header` parameters, passed as a `headers` argument. */
  hasHeaders: boolean;
  /**
   * Object literal of non-default query formats, or null when every parameter
   * uses `form`/`explode: true`. Only the fetch adapter can honour it — the
   * other clients serialize query params themselves.
   */
  queryFormats?: string | null;
}

/** Builds the request expression for a single operation. */
export type Adapter = (method: HttpMethodLower, ctx: AdapterCtx) => string;

const BODY_METHODS = new Set<HttpMethodLower>(['post', 'put', 'patch']);

/**
 * Appends the query string inside the URL template literal.
 * `toQuery` is emitted into the generated config.ts — it skips nullish values,
 * expands arrays and returns '' when there is nothing to serialize, which a bare
 * `new URLSearchParams(params)` cannot do (and does not typecheck for non-string values).
 */
const fetchUrl = ({ url, hasQuery, queryFormats }: AdapterCtx): string => {
  if (!hasQuery) return url;
  const args = queryFormats ? `params, ${queryFormats}` : 'params';
  return `${url.slice(0, -1)}\${toQuery(${args})}\``;
};

const fetchAdapter: Adapter = (method, ctx) => {
  const parse = `.then(r => r.json() as Promise<${ctx.type}>)`;
  const url = fetchUrl(ctx);

  const init: string[] = [];
  if (method !== 'get') init.push(`method: '${method.toUpperCase()}'`);
  if (BODY_METHODS.has(method) && ctx.hasBody)
    init.push('body: JSON.stringify(body)');

  const headers: string[] = [];
  if (BODY_METHODS.has(method))
    headers.push(`'Content-Type': 'application/json'`);
  // spread last so an explicit header from the caller wins
  if (ctx.hasHeaders) headers.push('...headers');
  if (headers.length > 0) {
    // nothing to merge with, so the caller's object is forwarded by shorthand
    const onlyCallerHeaders = headers.length === 1 && ctx.hasHeaders;
    init.push(
      onlyCallerHeaders ? 'headers' : `headers: { ${headers.join(', ')} }`,
    );
  }

  if (init.length === 0) return `fetch(${url})${parse}`;
  return `fetch(${url}, { ${init.join(', ')} })${parse}`;
};

const axiosAdapter: Adapter = (
  method,
  { url, type, client, hasQuery, hasBody, hasHeaders },
) => {
  const config: string[] = [];
  if (hasQuery) config.push('params');
  if (hasHeaders) config.push('headers');
  const configArg = config.length > 0 ? `{ ${config.join(', ')} }` : '';

  if (!BODY_METHODS.has(method)) {
    return `${client}.${method}<${type}>(${url}${configArg ? `, ${configArg}` : ''})`;
  }

  // axios puts the body in the second positional argument, so a config-only
  // request still has to pass an explicit `undefined` placeholder.
  if (configArg) {
    return `${client}.${method}<${type}>(${url}, ${hasBody ? 'body' : 'undefined'}, ${configArg})`;
  }
  return `${client}.${method}<${type}>(${url}${hasBody ? ', body' : ''})`;
};

const kyAdapter: Adapter = (
  method,
  { url, type, client, hasQuery, hasBody, hasHeaders },
) => {
  const parse = `.json<${type}>()`;
  const opts: string[] = [];
  if (BODY_METHODS.has(method) && hasBody) opts.push('json: body');
  if (hasQuery) opts.push('searchParams: params');
  if (hasHeaders) opts.push('headers');

  const args = opts.length > 0 ? `${url}, { ${opts.join(', ')} }` : url;
  return `${client}.${method}(${args})${parse}`;
};

const ofetchAdapter: Adapter = (
  method,
  { url, type, client, hasQuery, hasBody, hasHeaders },
) => {
  const opts = [`method: '${method.toUpperCase()}'`];
  if (BODY_METHODS.has(method) && hasBody) opts.push('body');
  if (hasQuery) opts.push('query: params');
  if (hasHeaders) opts.push('headers');

  return `${client}<${type}>(${url}, { ${opts.join(', ')} })`;
};

const wretchAdapter: Adapter = (
  method,
  { url, type, client, hasQuery, hasBody, hasHeaders },
) => {
  const chain = [`${client}.url(${url})`];
  if (hasQuery) chain.push('.query(params)');
  if (hasHeaders) chain.push('.headers(headers)');
  // wretch requires an explicit body call on write methods, even an empty one.
  if (BODY_METHODS.has(method)) chain.push(`.json(${hasBody ? 'body' : '{}'})`);
  chain.push(`.${method}()`);

  return `${chain.join('')}.json<${type}>()`;
};

const ADAPTERS: Record<HttpClients, Adapter> = {
  [HTTP_CLIENTS.FETCH]: fetchAdapter,
  [HTTP_CLIENTS.AXIOS]: axiosAdapter,
  [HTTP_CLIENTS.KY]: kyAdapter,
  [HTTP_CLIENTS.OFETCH]: ofetchAdapter,
  [HTTP_CLIENTS.WRETCH]: wretchAdapter,
};

export const getAdapterByName = (name: HttpClients): Adapter =>
  ADAPTERS[name] ?? fetchAdapter;
