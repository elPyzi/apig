export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

export type HttpMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];
export type HttpMethodLower = Lowercase<HttpMethod>;

export const toHttpMethodLower = (method: HttpMethod): HttpMethodLower =>
  method.toLowerCase() as HttpMethodLower;

export type IRType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'tuple'
  | 'null'
  | 'unknown'
  | 'allOf'
  | 'oneOf'
  | 'anyOf';

export interface IRSchema {
  type: IRType;
  name?: string;
  properties?: IRProperty[];
  items?: IRSchema;
  /**
   * Fixed leading members of a 3.1 tuple (`prefixItems`). When `items` is also
   * set it types the remaining, variadic members.
   */
  prefixItems?: IRSchema[];
  enum?: string[];
  isEnum?: boolean;
  required?: string[];
  schemas?: IRSchema[];
  /** Discriminator property name — set when OpenAPI spec has discriminator.propertyName */
  discriminator?: string;
  /** Whether this schema can be null */
  nullable?: boolean;
  /** OpenAPI format hint: "date" | "date-time" | "uuid" | "email" | "uri" | "password" | etc. */
  format?: string;
  /** Human-readable description from the OpenAPI spec */
  description?: string;
  // string constraints
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  // number constraints
  minimum?: number;
  maximum?: number;
  /** Exclusive bound — from 3.1's numeric form or 3.0's boolean flag. */
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  // array constraints
  minItems?: number;
  maxItems?: number;
  // misc
  default?: unknown;
}

/** How an array or object query parameter is serialized into the query string. */
export const QUERY_STYLES = {
  FORM: 'form',
  SPACE_DELIMITED: 'spaceDelimited',
  PIPE_DELIMITED: 'pipeDelimited',
  DEEP_OBJECT: 'deepObject',
} as const;

export type QueryStyle = (typeof QUERY_STYLES)[keyof typeof QUERY_STYLES];

export interface IRProperty {
  name: string;
  required: boolean;
  type: IRType;
  schema?: IRSchema;
  /** Property description from the OpenAPI spec */
  description?: string;
  /** Whether this property is marked as deprecated */
  deprecated?: boolean;
  /** Serialization style — only meaningful for query parameters. */
  style?: QueryStyle;
  /** Whether each array member gets its own key. Defaults to true for `form`. */
  explode?: boolean;
}

export interface IRParams {
  path: IRProperty[];
  query: IRProperty[];
  header: IRProperty[];
}

export interface IRBody {
  required: boolean;
  schema: IRSchema;
  /** Content type of the request body */
  contentType?: 'json' | 'multipart';
}

export interface IRErrorResponse {
  status: number;
  schema: IRSchema;
}

export interface IROperation {
  id: string;
  method: HttpMethod;
  path: string;
  tag: string;
  deprecated: boolean;
  params: IRParams;
  body: IRBody | null;
  response: IRSchema | null;
  /** Error responses (4xx/5xx) from the OpenAPI spec */
  errors?: IRErrorResponse[];
  /** Short summary from the OpenAPI spec */
  summary?: string;
  /** Full description from the OpenAPI spec */
  description?: string;
}

export interface IR {
  operations: IROperation[];
  schemas: IRSchema[];
}
