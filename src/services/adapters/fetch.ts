export const fetchAdapter = {
  get: (url: string, type: string, _instanceName: string, hasQuery: boolean) =>
    hasQuery
      ? `fetch(${url.slice(0, -1)}?\${new URLSearchParams(params)}\`).then(r => r.json() as Promise<${type}>)`
      : `fetch(${url}).then(r => r.json() as Promise<${type}>)`,

  post: (
    url: string,
    type: string,
    _instanceName: string,
    hasQuery: boolean,
    hasBody: boolean,
  ) =>
    hasQuery
      ? `fetch(\`\${${url}}?\${new URLSearchParams(params)}\`, { method: 'POST'${hasBody ? ', body: JSON.stringify(body)' : ''}, headers: { 'Content-Type': 'application/json' } }).then(r => r.json() as Promise<${type}>)`
      : `fetch(${url}, { method: 'POST'${hasBody ? ', body: JSON.stringify(body)' : ''}, headers: { 'Content-Type': 'application/json' } }).then(r => r.json() as Promise<${type}>)`,

  put: (
    url: string,
    type: string,
    _instanceName: string,
    hasQuery: boolean,
    hasBody: boolean,
  ) =>
    hasQuery
      ? `fetch(\`\${${url}}?\${new URLSearchParams(params)}\`, { method: 'PUT'${hasBody ? ', body: JSON.stringify(body)' : ''}, headers: { 'Content-Type': 'application/json' } }).then(r => r.json() as Promise<${type}>)`
      : `fetch(${url}, { method: 'PUT'${hasBody ? ', body: JSON.stringify(body)' : ''}, headers: { 'Content-Type': 'application/json' } }).then(r => r.json() as Promise<${type}>)`,

  patch: (
    url: string,
    type: string,
    _instanceName: string,
    hasQuery: boolean,
    hasBody: boolean,
  ) =>
    hasQuery
      ? `fetch(\`\${${url}}?\${new URLSearchParams(params)}\`, { method: 'PATCH'${hasBody ? ', body: JSON.stringify(body)' : ''}, headers: { 'Content-Type': 'application/json' } }).then(r => r.json() as Promise<${type}>)`
      : `fetch(${url}, { method: 'PATCH'${hasBody ? ', body: JSON.stringify(body)' : ''}, headers: { 'Content-Type': 'application/json' } }).then(r => r.json() as Promise<${type}>)`,

  delete: (
    url: string,
    type: string,
    _instanceName: string,
    hasQuery: boolean,
  ) =>
    hasQuery
      ? `fetch(\`\${${url}}?\${new URLSearchParams(params)}\`, { method: 'DELETE' }).then(r => r.json() as Promise<${type}>)`
      : `fetch(${url}, { method: 'DELETE' }).then(r => r.json() as Promise<${type}>)`,
};
