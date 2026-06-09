import type { ApigConfig, LazyOrAsync } from "./types";

export function defineConfig(
  config: LazyOrAsync<ApigConfig[]>,
): LazyOrAsync<ApigConfig[]> {
  return config;
}
