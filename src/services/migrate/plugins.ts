import type { PluginCall } from './types';

export interface Features {
  requests?: boolean;
  zod?: boolean;
  valibot?: boolean;
  tanstack?: { framework?: string; infinite?: boolean; suspense?: boolean };
  swr?: boolean;
  faker?: boolean;
  msw?: boolean;
  mcp?: boolean;
}

/**
 * Turns what a project generated into apig plugins, in a stable order and with
 * the plugins they depend on: hooks call the request functions, the MCP server
 * needs requests and zod, MSW handlers return faker data.
 */
export const buildPlugins = (features: Features): PluginCall[] => {
  const requests =
    features.requests || !!features.tanstack || features.swr || features.mcp;
  const zod = features.zod || features.mcp;
  const faker = features.faker || features.msw;

  const plugins: PluginCall[] = [{ factory: 'typescript' }];
  if (requests) plugins.push({ factory: 'requests' });
  if (zod) plugins.push({ factory: 'zod' });
  if (features.valibot) plugins.push({ factory: 'valibot' });
  if (features.tanstack) {
    const { framework, infinite, suspense } = features.tanstack;
    plugins.push({
      factory: 'tanstackQuery',
      options: {
        framework: framework && framework !== 'react' ? framework : undefined,
        infinite: infinite || undefined,
        suspense: suspense || undefined,
      },
    });
  }
  if (features.swr) plugins.push({ factory: 'swr' });
  if (faker) plugins.push({ factory: 'faker' });
  if (features.msw) plugins.push({ factory: 'msw' });
  if (features.mcp) plugins.push({ factory: 'mcp' });
  return plugins;
};
