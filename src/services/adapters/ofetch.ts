export const ofetchAdapter = {
  get: (url: string, type: string, instanceName: string, hasQuery: boolean) =>
    hasQuery
      ? `${instanceName}<${type}>(${url}, { method: 'GET', query: params })`
      : `${instanceName}<${type}>(${url}, { method: 'GET' })`,

  post: (
    url: string,
    type: string,
    instanceName: string,
    hasQuery: boolean,
    hasBody: boolean,
  ) =>
    hasQuery
      ? `${instanceName}<${type}>(${url}, { method: 'POST', ${hasBody ? 'body, ' : ''}query: params })`
      : `${instanceName}<${type}>(${url}, { method: 'POST'${hasBody ? ', body' : ''} })`,

  put: (
    url: string,
    type: string,
    instanceName: string,
    hasQuery: boolean,
    hasBody: boolean,
  ) =>
    hasQuery
      ? `${instanceName}<${type}>(${url}, { method: 'PUT', ${hasBody ? 'body, ' : ''}query: params })`
      : `${instanceName}<${type}>(${url}, { method: 'PUT'${hasBody ? ', body' : ''} })`,

  patch: (
    url: string,
    type: string,
    instanceName: string,
    hasQuery: boolean,
    hasBody: boolean,
  ) =>
    hasQuery
      ? `${instanceName}<${type}>(${url}, { method: 'PATCH', ${hasBody ? 'body, ' : ''}query: params })`
      : `${instanceName}<${type}>(${url}, { method: 'PATCH'${hasBody ? ', body' : ''} })`,

  delete: (
    url: string,
    type: string,
    instanceName: string,
    hasQuery: boolean,
  ) =>
    hasQuery
      ? `${instanceName}<${type}>(${url}, { method: 'DELETE', query: params })`
      : `${instanceName}<${type}>(${url}, { method: 'DELETE' })`,
};
