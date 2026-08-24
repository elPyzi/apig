import { QUERY_STYLES, type IRProperty } from '@models';

/** Matches the `QueryFormat` union emitted into the generated config.ts. */
export type QueryFormat = 'repeat' | 'comma' | 'space' | 'pipe' | 'deep';

const DEFAULT_FORMAT: QueryFormat = 'repeat';

/**
 * Maps a parameter's style/explode pair onto the format understood by the
 * generated `toQuery` helper. `form` + `explode: true` is the OpenAPI default
 * and needs no annotation.
 */
export const queryFormat = (param: IRProperty): QueryFormat => {
  switch (param.style) {
    case QUERY_STYLES.SPACE_DELIMITED:
      return 'space';
    case QUERY_STYLES.PIPE_DELIMITED:
      return 'pipe';
    case QUERY_STYLES.DEEP_OBJECT:
      return 'deep';
    case QUERY_STYLES.FORM:
    default:
      return param.explode === false ? 'comma' : DEFAULT_FORMAT;
  }
};

/**
 * Object literal of the non-default formats for an operation, or `null` when
 * every parameter uses the default — in which case `toQuery` is called with a
 * single argument, exactly as before.
 */
export const buildQueryFormats = (query: IRProperty[]): string | null => {
  const entries = query
    .map((param) => [param.name, queryFormat(param)] as const)
    .filter(([, format]) => format !== DEFAULT_FORMAT)
    .map(([name, format]) => `'${name}': '${format}'`);

  return entries.length > 0 ? `{ ${entries.join(', ')} }` : null;
};

/** Whether any parameter needs serialization the HTTP client cannot be told about. */
export const hasCustomQueryFormat = (query: IRProperty[]): boolean =>
  query.some((param) => queryFormat(param) !== DEFAULT_FORMAT);
