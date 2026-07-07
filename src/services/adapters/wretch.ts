export const wretchAdapter = {
  get: (url: string, type: string, instanceName: string, hasQuery: boolean) =>
    hasQuery
      ? `${instanceName}.url(${url}).query(params).get().json<${type}>()`
      : `${instanceName}.url(${url}).get().json<${type}>()`,

  post: (
    url: string,
    type: string,
    instanceName: string,
    hasQuery: boolean,
    hasBody: boolean,
  ) =>
    hasQuery
      ? `${instanceName}.url(${url}).query(params).json(${hasBody ? 'body' : '{}'}).post().json<${type}>()`
      : `${instanceName}.url(${url}).json(${hasBody ? 'body' : '{}'}).post().json<${type}>()`,

  put: (
    url: string,
    type: string,
    instanceName: string,
    hasQuery: boolean,
    hasBody: boolean,
  ) =>
    hasQuery
      ? `${instanceName}.url(${url}).query(params).json(${hasBody ? 'body' : '{}'}).put().json<${type}>()`
      : `${instanceName}.url(${url}).json(${hasBody ? 'body' : '{}'}).put().json<${type}>()`,

  patch: (
    url: string,
    type: string,
    instanceName: string,
    hasQuery: boolean,
    hasBody: boolean,
  ) =>
    hasQuery
      ? `${instanceName}.url(${url}).query(params).json(${hasBody ? 'body' : '{}'}).patch().json<${type}>()`
      : `${instanceName}.url(${url}).json(${hasBody ? 'body' : '{}'}).patch().json<${type}>()`,

  delete: (url: string, type: string, instanceName: string, hasQuery: boolean) =>
    hasQuery
      ? `${instanceName}.url(${url}).query(params).delete().json<${type}>()`
      : `${instanceName}.url(${url}).delete().json<${type}>()`,
};
