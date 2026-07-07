import { HTTP_CLIENTS } from '@models';


const stripThen = (call: string): string =>
  call.replace(/\.then\(r => r\.json\(\)[^)]*\)$/, '');

export const buildErrorHandlingBody = (
  call: string,
  responseType: string,
  client: string,
  errorClass: string,
): string => {
  if (client === HTTP_CLIENTS.FETCH) {
    const bare = stripThen(call);
    return [
      `  const r = await ${bare};`,
      `  if (!r.ok) throw new ${errorClass}(r.status, await r.json());`,
      `  return r.json() as Promise<${responseType}>;`,
    ].join('\n');
  }
  if (client === HTTP_CLIENTS.AXIOS) {
    return [
      `  try {`,
      `    const r = await ${call};`,
      `    return r.data as ${responseType};`,
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
      `    return await ${call};`,
      `  } catch (e: unknown) {`,
      `    const err = e as { response?: Response };`,
      `    if (err.response instanceof Response)`,
      `      throw new ${errorClass}(err.response.status, await err.response.json());`,
      `    throw e;`,
      `  }`,
    ].join('\n');
  }
  if (client === HTTP_CLIENTS.WRETCH) {
    return [
      `  try {`,
      `    return await ${call};`,
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
    `    return await ${call};`,
    `  } catch (e: unknown) {`,
    `    const err = e as { name?: string; status?: number; data?: unknown };`,
    `    if (err.name === 'FetchError')`,
    `      throw new ${errorClass}(err.status!, err.data);`,
    `    throw e;`,
    `  }`,
  ].join('\n');
};
