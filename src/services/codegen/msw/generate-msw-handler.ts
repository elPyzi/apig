import {
  HTTP_METHODS,
  toHttpMethodLower,
  type IROperation,
  type ZvyappyConfig,
} from '@models';
import { toMswPath, getFakerResponse } from './utils';

export {
  hasFakerPlugin,
  getMswUsedGenerators,
  getMswNeedsFaker,
} from './utils';

export const generateMswHandler = (
  operation: IROperation,
  config: ZvyappyConfig,
): string => {
  const method = toHttpMethodLower(operation.method);
  const path = toMswPath(operation.path, config.baseUrl);
  const fakerFn = getFakerResponse(operation);
  // msw has no `http.query()`; a handler for any other method is built directly
  const open =
    operation.method === HTTP_METHODS.QUERY
      ? `new HttpHandler('QUERY', '${path}', `
      : `http.${method}('${path}', `;

  if (method === toHttpMethodLower(HTTP_METHODS.DELETE) || !fakerFn) {
    return [
      `  ${open}() => {`,
      `    return new HttpResponse(null, { status: 204 });`,
      `  }),`,
    ].join('\n');
  }

  if (operation.body) {
    return [
      `  ${open}async ({ request }) => {`,
      `    await request.json();`,
      `    return HttpResponse.json(${fakerFn});`,
      `  }),`,
    ].join('\n');
  }

  if (operation.params.path.length > 0) {
    return [
      `  ${open}({ params }) => {`,
      `    return HttpResponse.json(${fakerFn});`,
      `  }),`,
    ].join('\n');
  }

  return [
    `  ${open}() => {`,
    `    return HttpResponse.json(${fakerFn});`,
    `  }),`,
  ].join('\n');
};
