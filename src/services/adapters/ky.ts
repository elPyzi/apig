export const kyAdapter = {
  get: (url: string, type: string, instanceName: string, hasQuery: boolean) =>
    hasQuery
      ? `${instanceName}.get(${url}, { searchParams: params }).json<${type}>()`
      : `${instanceName}.get(${url}).json<${type}>()`,

  post: (
    url: string,
    type: string,
    instanceName: string,
    hasQuery: boolean,
    hasBody: boolean,
  ) =>
    hasQuery
      ? `${instanceName}.post(${url}, { ${hasBody ? 'json: body, ' : ''}searchParams: params }).json<${type}>()`
      : `${instanceName}.post(${url}${hasBody ? ', { json: body }' : ''}).json<${type}>()`,

  put: (
    url: string,
    type: string,
    instanceName: string,
    hasQuery: boolean,
    hasBody: boolean,
  ) =>
    hasQuery
      ? `${instanceName}.put(${url}, { ${hasBody ? 'json: body, ' : ''}searchParams: params }).json<${type}>()`
      : `${instanceName}.put(${url}${hasBody ? ', { json: body }' : ''}).json<${type}>()`,

  patch: (
    url: string,
    type: string,
    instanceName: string,
    hasQuery: boolean,
    hasBody: boolean,
  ) =>
    hasQuery
      ? `${instanceName}.patch(${url}, { ${hasBody ? 'json: body, ' : ''}searchParams: params }).json<${type}>()`
      : `${instanceName}.patch(${url}${hasBody ? ', { json: body }' : ''}).json<${type}>()`,

  delete: (
    url: string,
    type: string,
    instanceName: string,
    hasQuery: boolean,
  ) =>
    hasQuery
      ? `${instanceName}.delete(${url}, { searchParams: params }).json<${type}>()`
      : `${instanceName}.delete(${url}).json<${type}>()`,
};
