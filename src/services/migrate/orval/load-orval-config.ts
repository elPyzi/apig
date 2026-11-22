import type { Config, ConfigExternal } from 'orval';
import { loadModule } from '@services/migrate/load-module';

/**
 * orval's default export isn't always the config object itself — `defineConfig`
 * types it as `Config | Promise<Config> | ConfigFn`, so a function or a promise
 * has to be resolved before the caller sees a plain `Config`.
 */
export const loadOrvalConfig = async (configPath: string): Promise<Config> => {
  const external = await loadModule<ConfigExternal>(configPath);
  const resolved = typeof external === 'function' ? external() : external;
  return await resolved;
};
