import type { ApigConfig, LazyOrAsync } from '@models';

export function defineConfig(
  config: LazyOrAsync<ApigConfig>,
): LazyOrAsync<ApigConfig>;
export function defineConfig(
  config: LazyOrAsync<ApigConfig[]>,
): LazyOrAsync<ApigConfig[]>;
export function defineConfig(
  config: LazyOrAsync<ApigConfig | ApigConfig[]>,
): LazyOrAsync<ApigConfig | ApigConfig[]> {
  return config;
}
