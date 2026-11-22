import type { UserConfig } from '@hey-api/openapi-ts';
import { loadModule } from '@services/migrate/load-module';

/**
 * `defineConfig` from `@hey-api/openapi-ts` is async — it resolves a function
 * and returns a promise — and takes one config or an array of them, so the
 * default export can be any of those.
 */
type HeyApiConfigResult = UserConfig | ReadonlyArray<UserConfig>;
type HeyApiConfigExternal =
  | HeyApiConfigResult
  | Promise<HeyApiConfigResult>
  | (() => HeyApiConfigResult | Promise<HeyApiConfigResult>);

export const loadHeyApiConfig = async (
  configPath: string,
): Promise<UserConfig[]> => {
  const external = await loadModule<HeyApiConfigExternal>(configPath);
  const result = await (typeof external === 'function' ? external() : external);
  return Array.isArray(result) ? [...result] : [result as UserConfig];
};
