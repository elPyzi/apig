import { HTTP_CLIENTS } from '@models';
import { DISCARD_BODY, NO_BODY } from '@services/adapters';
import { stripThen } from './build-error-handling';
import { KY_ERROR_BODY, returnLines } from './return-lines';

// cut at the last `.json<` — the type argument can nest (`Array<Item>`), so a
// pattern stopping at the first `>` leaves the parse call in place
const stripJson = (call: string): string => {
  for (const tail of [`.res()${DISCARD_BODY}`, DISCARD_BODY])
    if (call.endsWith(tail)) return call.slice(0, -tail.length);
  const at = call.lastIndexOf('.json<');
  return at === -1 ? call : call.slice(0, at);
};

// axios headers are a plain object, not the `Headers` that ApigResponse promises
const AXIOS_HEADERS =
  'new Headers(Object.entries(r.headers).filter(([, v]) => v != null).map(([k, v]): [string, string] => [k, String(v)]))';

/**
 * @param logAs Function name to log the result under (`apiLogging`), if any.
 */
export const buildRawResponseBody = (
  call: string,
  responseType: string,
  client: string,
  withError: boolean,
  errorClass: string,
  logAs?: string,
): string => {
  const ret = (expr: string) => returnLines(expr, '  ', logAs);
  const noBody = responseType === NO_BODY;
  // an empty body cannot be parsed as JSON, so there is no `data` to read
  const readData = (res: string) =>
    noBody ? [] : [`  const data = await ${res}.json() as ${responseType};`];
  const body = noBody ? 'undefined' : 'data';

  if (client === HTTP_CLIENTS.FETCH) {
    const bare = stripThen(call);
    const errorLine = withError
      ? `  if (!r.ok) throw new ${errorClass}(r.status, await parseErrorBody(r));\n`
      : '';
    return [
      `  const r = await ${bare};`,
      ...(errorLine ? [errorLine.trimEnd()] : []),
      ...readData('r'),
      ...ret(`{ body: ${body}, status: r.status, headers: r.headers }`),
    ].join('\n');
  }
  if (client === HTTP_CLIENTS.AXIOS) {
    const lines = [`  const r = await ${call};`];
    if (withError) {
      lines.unshift(`  try {`);
      lines.push(
        ...ret(
          `{ body: r.data as ${responseType}, status: r.status, headers: ${AXIOS_HEADERS} }`,
        ).map((l) => `  ${l}`),
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
        ...ret(
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
      ...readData('res'),
      ...ret(`{ body: ${body}, status: res.status, headers: res.headers }`),
    ];
    if (withError) {
      return [
        `  try {`,
        ...lines.map((l) => `  ${l}`),
        `  } catch (e: unknown) {`,
        `    const err = e as { response?: Response; data?: unknown };`,
        `    if (err.response instanceof Response)`,
        `      throw new ${errorClass}(err.response.status, ${KY_ERROR_BODY});`,
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
      ...readData('res'),
      ...ret(`{ body: ${body}, status: res.status, headers: res.headers }`),
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
    ...ret(
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
