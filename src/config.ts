import type { ZvyappyConfig, LazyOrAsync } from '@models';

export function defineConfig(
  config: LazyOrAsync<ZvyappyConfig>,
): LazyOrAsync<ZvyappyConfig>;
export function defineConfig(
  config: LazyOrAsync<ZvyappyConfig[]>,
): LazyOrAsync<ZvyappyConfig[]>;
export function defineConfig(
  config: LazyOrAsync<ZvyappyConfig | ZvyappyConfig[]>,
): LazyOrAsync<ZvyappyConfig | ZvyappyConfig[]> {
  return config;
}
