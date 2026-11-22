import { HTTP_CLIENTS } from '@models';

const stripThen = (call: string): string =>
  call.replace(/\.then\(r => r\.json\(\)[^)]*\)$/, '');

// cut at the last `.json<` — the type argument can nest (`Array<Item>`), so a
// pattern stopping at the first `>` leaves the parse call in place
const stripJson = (call: string): string => {
  const at = call.lastIndexOf('.json<');
  return at === -1 ? call : call.slice(0, at);
};

// axios headers are a plain object, not the `Headers` that ApigResponse promises
const AXIOS_HEADERS =
  'new Headers(Object.entries(r.headers).filter(([, v]) => v != null).map(([k, v]): [string, string] => [k, String(v)]))';

/**
 * @param logging When true, assigns the result to `const response = { ... }` instead of returning,
 *                so the caller can insert console.log before the return.
 */
export const buildRawResponseBody = (
  call: string,
  responseType: string,
  client: string,
  withError: boolean,
  errorClass: string,
  logging = false,
): string => {
  const ret = (expr: string) =>
    logging ? `  const response = ${expr};` : `  return ${expr};`;

  if (client === HTTP_CLIENTS.FETCH) {
    const bare = stripThen(call);
    const errorLine = withError
      ? `  if (!r.ok) throw new ${errorClass}(r.status, await parseErrorBody(r));\n`
      : '';
    return [
      `  const r = await ${bare};`,
      `${errorLine}  const data = await r.json() as ${responseType};`,
      ret(`{ body: data, status: r.status, headers: r.headers }`),
    ].join('\n');
  }
  if (client === HTTP_CLIENTS.AXIOS) {
    const lines = [`  const r = await ${call};`];
    if (withError) {
      lines.unshift(`  try {`);
      lines.push(
        `    ${ret(`{ body: r.data as ${responseType}, status: r.status, headers: ${AXIOS_HEADERS} }`).trimStart()}`,
      );
      lines.push(`  } catch (e: unknown) {`);
      lines.push(
        `    if (e && typeof e === 'object' && 'isAxiosError' in e) {`,
      );
      lines.push(
        `      const ae = e as { response?: { status: number; data: unknown } };`,
      );
      lines.push(
        `      throw new ${errorClass}(ae.response?.status ?? 0, ae.response?.data);`,
      );
      lines.push(`    }`);
      lines.push(`    throw e;`);
      lines.push(`  }`);
    } else {
      lines.push(
        ret(
          `{ body: r.data as ${responseType}, status: r.status, headers: ${AXIOS_HEADERS} }`,
        ),
      );
    }
    return lines.join('\n');
  }
  if (client === HTTP_CLIENTS.KY) {
    const stripped = stripJson(call);
    const lines = [
      `  const res = await ${stripped};`,
      `  const data = await res.json() as ${responseType};`,
      ret(`{ body: data, status: res.status, headers: res.headers }`),
    ];
    if (withError) {
      return [
        `  try {`,
        ...lines.map((l) => `  ${l}`),
        `  } catch (e: unknown) {`,
        `    const err = e as { response?: Response };`,
        `    if (err.response instanceof Response)`,
        `      throw new ${errorClass}(err.response.status, await err.response.json());`,
        `    throw e;`,
        `  }`,
      ].join('\n');
    }
    return lines.join('\n');
  }
  if (client === HTTP_CLIENTS.WRETCH) {
    const stripped = stripJson(call);
    const lines = [
      `  const res = await ${stripped}.res();`,
      `  const data = await res.json() as ${responseType};`,
      ret(`{ body: data, status: res.status, headers: res.headers }`),
    ];
    if (withError) {
      return [
        `  try {`,
        ...lines.map((l) => `  ${l}`),
        `  } catch (e: unknown) {`,
        `    const err = e as { status?: number; json?: unknown };`,
        `    if (err.status !== undefined)`,
        `      throw new ${errorClass}(err.status, err.json);`,
        `    throw e;`,
        `  }`,
      ].join('\n');
    }
    return lines.join('\n');
  }
  // ofetch — use $fetch.raw()
  const rawCall = call.replace(/^(\w+)</, '$1.raw<');
  const lines = [
    `  const r = await ${rawCall};`,
    ret(
      `{ body: r._data as ${responseType}, status: r.status, headers: r.headers }`,
    ),
  ];
  if (withError) {
    return [
      `  try {`,
      ...lines.map((l) => `  ${l}`),
      `  } catch (e: unknown) {`,
      `    const err = e as { name?: string; status?: number; data?: unknown };`,
      `    if (err.name === 'FetchError')`,
      `      throw new ${errorClass}(err.status!, err.data);`,
      `    throw e;`,
      `  }`,
    ].join('\n');
  }
  return lines.join('\n');
};
