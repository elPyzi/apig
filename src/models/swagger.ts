import type { OpenAPIV2, OpenAPIV3 } from 'openapi-types';

export type RawSpec = OpenAPIV2.Document | OpenAPIV3.Document;

export type LoadSpecResult = {
  spec: OpenAPIV3.Document;
  schemaNames: Map<object, string>;
};
