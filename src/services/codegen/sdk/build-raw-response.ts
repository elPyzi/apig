import { HTTP_CLIENTS } from '@models';

const stripThen = (call: string): string =>
  call.replace(/\.then\(r => r\.json\(\)[^)]*\)$/, '');

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
      ? `  if (!r.ok) throw new ${errorClass}(r.status, await r.json());\n`
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
      lines.push(`    ${ret(`{ body: r.data as ${responseType}, status: r.status, headers: r.headers }`).trimStart()}`);
      lines.push(`  } catch (e: unknown) {`);
      lines.push(`    if (e && typeof e === 'object' && 'isAxiosError' in e) {`);
      lines.push(`      const ae = e as { response?: { status: number; data: unknown } };`);
      lines.push(`      throw new ${errorClass}(ae.response?.status, ae.response?.data);`);
      lines.push(`    }`);
      lines.push(`    throw e;`);
      lines.push(`  }`);
    } else {
      lines.push(ret(`{ body: r.data as ${responseType}, status: r.status, headers: r.headers }`));
    }
    return lines.join('\n');
  }
  if (client === HTTP_CLIENTS.KY) {
    const stripped = call.replace(/\.json<[^>]+>\(\)$/, '');
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
    const stripped = call.replace(/\.json<[^>]+>\(\)$/, '');
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
    ret(`{ body: r._data as ${responseType}, status: r.status, headers: r.headers }`),
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
