import type { UserConfig } from 'kubb';
import type { CLIOptions } from '@kubb/core';
import { loadModule } from '@services/migrate/load-module';

/**
 * kubb's `defineConfig` accepts a single config, an array of them (its own
 * multi-project shape — unlike orval's keyed record), a promise of either, or
 * a function of the parsed CLI options returning one of the above. There's no
 * real CLI invocation during a migration, so the function form is called with
 * an empty `CLIOptions` — every field on it is optional.
 */
type KubbConfigResult = UserConfig | UserConfig[];
type KubbConfigExternal =
  | KubbConfigResult
  | Promise<KubbConfigResult>
  | ((cli: CLIOptions) => KubbConfigResult | Promise<KubbConfigResult>);

export const loadKubbConfig = async (
  configPath: string,
): Promise<UserConfig[]> => {
  const external = await loadModule<KubbConfigExternal>(configPath);
  const resolved = typeof external === 'function' ? external({}) : external;
  const result = await resolved;
  return Array.isArray(result) ? result : [result];
};
