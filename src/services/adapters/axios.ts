export const axiosAdapter = {
  get: (url: string, type: string, instanceName: string, hasQuery: boolean) =>
    hasQuery
      ? `${instanceName}.get<${type}>(${url}, { params })`
      : `${instanceName}.get<${type}>(${url})`,

  post: (
    url: string,
    type: string,
    instanceName: string,
    hasQuery: boolean,
    hasBody: boolean,
  ) =>
    hasQuery
      ? `${instanceName}.post<${type}>(${url}, ${hasBody ? 'body' : 'undefined'}, { params })`
      : `${instanceName}.post<${type}>(${url}${hasBody ? ', body' : ''})`,

  put: (
    url: string,
    type: string,
    instanceName: string,
    hasQuery: boolean,
    hasBody: boolean,
  ) =>
    hasQuery
      ? `${instanceName}.put<${type}>(${url}, ${hasBody ? 'body' : 'undefined'}, { params })`
      : `${instanceName}.put<${type}>(${url}${hasBody ? ', body' : ''})`,

  patch: (
    url: string,
    type: string,
    instanceName: string,
    hasQuery: boolean,
    hasBody: boolean,
  ) =>
    hasQuery
      ? `${instanceName}.patch<${type}>(${url}, ${hasBody ? 'body' : 'undefined'}, { params })`
      : `${instanceName}.patch<${type}>(${url}${hasBody ? ', body' : ''})`,

  delete: (
    url: string,
    type: string,
    instanceName: string,
    hasQuery: boolean,
  ) =>
    hasQuery
      ? `${instanceName}.delete<${type}>(${url}, { params })`
      : `${instanceName}.delete<${type}>(${url})`,
};
