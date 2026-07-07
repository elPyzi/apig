import { HTTP_METHODS, toHttpMethodLower, type IROperation, type ApigConfig } from '@models';
import { toMswPath, getFakerResponse } from './utils';

export { hasFakerPlugin, getMswUsedGenerators, getMswNeedsFaker } from './utils';

export const generateMswHandler = (
  operation: IROperation,
  config: ApigConfig,
): string => {
  const method = toHttpMethodLower(operation.method);
  const path = toMswPath(operation.path, config.baseUrl);
  const fakerFn = getFakerResponse(operation);

  if (method === toHttpMethodLower(HTTP_METHODS.DELETE) || !fakerFn) {
    return [
      `  http.${method}('${path}', () => {`,
      `    return new HttpResponse(null, { status: 204 });`,
      `  }),`,
    ].join('\n');
  }

  if (operation.body) {
    return [
      `  http.${method}('${path}', async ({ request }) => {`,
      `    await request.json();`,
      `    return HttpResponse.json(${fakerFn});`,
      `  }),`,
    ].join('\n');
  }

  if (operation.params.path.length > 0) {
    return [
      `  http.${method}('${path}', ({ params }) => {`,
      `    return HttpResponse.json(${fakerFn});`,
      `  }),`,
    ].join('\n');
  }

  return [
    `  http.${method}('${path}', () => {`,
    `    return HttpResponse.json(${fakerFn});`,
    `  }),`,
  ].join('\n');
};
