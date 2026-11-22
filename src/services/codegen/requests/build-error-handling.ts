import { HTTP_CLIENTS } from '@models';
import { DISCARD_BODY, NO_BODY } from '@services/adapters';
import { KY_ERROR_BODY, returnLines } from './return-lines';

export const stripThen = (call: string): string =>
  call.endsWith(DISCARD_BODY)
    ? call.slice(0, -DISCARD_BODY.length)
    : call.replace(/\.then\(r => r\.json\(\)[^)]*\)$/, '');

/**
 * @param logAs Function name to log the result under (`apiLogging`), if any.
 */
export const buildErrorHandlingBody = (
  call: string,
  responseType: string,
  client: string,
  errorClass: string,
  logAs?: string,
): string => {
  if (client === HTTP_CLIENTS.FETCH) {
    const bare = stripThen(call);
    const lines = [
      `  const r = await ${bare};`,
      `  if (!r.ok) throw new ${errorClass}(r.status, await parseErrorBody(r));`,
    ];
    // awaited rather than returned as a promise: the raw-response path
    // already does, and an IDE flags every generated function otherwise
    if (responseType !== NO_BODY)
      lines.push(
        ...returnLines(`(await r.json()) as ${responseType}`, '  ', logAs),
      );
    else if (logAs) lines.push(`  console.log('${logAs}');`);
    return lines.join('\n');
  }
  if (client === HTTP_CLIENTS.AXIOS) {
    return [
      `  try {`,
      `    const r = await ${call};`,
      ...returnLines(`r.data as ${responseType}`, '    ', logAs),
      `  } catch (e: unknown) {`,
      `    if (e && typeof e === 'object' && 'isAxiosError' in e) {`,
      `      const ae = e as { response?: { status: number; data: unknown } };`,
      `      throw new ${errorClass}(ae.response?.status ?? 0, ae.response?.data);`,
      `    }`,
      `    throw e;`,
      `  }`,
    ].join('\n');
  }
  if (client === HTTP_CLIENTS.KY) {
    return [
      `  try {`,
      ...returnLines(`await ${call}`, '    ', logAs),
      `  } catch (e: unknown) {`,
      `    const err = e as { response?: Response; data?: unknown };`,
      `    if (err.response instanceof Response)`,
      `      throw new ${errorClass}(err.response.status, ${KY_ERROR_BODY});`,
      `    throw e;`,
      `  }`,
    ].join('\n');
  }
  if (client === HTTP_CLIENTS.WRETCH) {
    return [
      `  try {`,
      ...returnLines(`await ${call}`, '    ', logAs),
      `  } catch (e: unknown) {`,
      `    const err = e as { status?: number; json?: unknown; name?: string };`,
      `    if (err.status !== undefined)`,
      `      throw new ${errorClass}(err.status, err.json);`,
      `    throw e;`,
      `  }`,
    ].join('\n');
  }
  // ofetch
  return [
    `  try {`,
    ...returnLines(`await ${call}`, '    ', logAs),
    `  } catch (e: unknown) {`,
    `    const err = e as { name?: string; status?: number; data?: unknown };`,
    `    if (err.name === 'FetchError')`,
    `      throw new ${errorClass}(err.status!, err.data);`,
    `    throw e;`,
    `  }`,
  ].join('\n');
};
