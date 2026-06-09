export type HttpClient = "axios" | "fetch" | "ky" | "ofetch";

export type Formatter = "prettier" | "biome" | "oxfmt" | "none";

export type NamingCase =
  | "kebab-case"
  | "camelCase"
  | "snake_case"
  | "PascalCase";

export type GroupBy = "none" | "tags" | "endpoints";

export type Plugin =
  | "typescript"
  | "sdk"
  | "tanstack-query"
  | "zod"
  | "msw"
  | "faker";

type Locale = "ru" | "en";

export interface PluginConfig {
  name: Plugin;
  output?: string;
  validate?: boolean;
  locale?: Locale;
}

export type PluginOrConfig = Plugin | PluginConfig;

export type Output =
  | string
  | {
      path: string;
      clean?: boolean;
    };

export interface InstanceConfig {
  name: HttpClient;
  path: string;
  export: string;
}

export interface FilterConfig {
  tags?: string[];
  exclude?: string[];
  deprecated?: boolean;
}

export interface HooksConfig {
  afterAllFilesWrite?: string;
}

export type EnumStyle = "union" | "enum" | "const";

export interface ApigConfig {
  input: string | (() => Promise<string>);

  output: Output;

  instance?: HttpClient | InstanceConfig;

  plugins?: PluginOrConfig[];

  formatter?: Formatter;

  naming?: NamingCase;

  groupBy?: GroupBy;

  index?: boolean;

  baseUrl?: string;

  filter?: FilterConfig;

  rename?: Record<string, string>;

  validate?: boolean;

  hooks?: HooksConfig;
}

export type LazyOrAsync<T> = T | (() => Promise<T>) | (() => T);
