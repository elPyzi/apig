import type {
  EnumStyle,
  FilterConfig,
  Formatter,
  GroupBy,
  NamingCase,
  TypeStyle,
} from '@models';

/** A plugin factory call as it will be written into `zvyappy.config.ts`. */
export interface PluginCall {
  factory: string;
  options?: Record<string, unknown>;
}

/**
 * One project from the source config, translated into zvyappy terms.
 *
 * Kept as plain data rather than an `ZvyappyConfig`: plugins have to end up as
 * source text (`zod()`), not as the objects those factories return.
 */
export interface MigratedProject {
  name?: string;
  input: string;
  output: { path: string; clean: boolean };
  baseUrl?: string;
  plugins: PluginCall[];
  groupBy?: GroupBy;
  enumStyle?: EnumStyle;
  typeStyle?: TypeStyle;
  fileNaming?: NamingCase;
  formatter?: Formatter;
  index?: boolean;
  rawResponse?: boolean;
  filter?: FilterConfig;
  hooks?: { afterAllFilesWrite: string };
  /** What could not be carried over — written into the config and the terminal. */
  notes: string[];
}
