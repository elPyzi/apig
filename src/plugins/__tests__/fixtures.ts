import type {
  IR,
  IRSchema,
  IROperation,
  IRProperty,
  ApigConfig,
} from '@models';
import { HTTP_METHODS } from '@models';

export const baseConfig: ApigConfig = {
  input: 'spec.yaml',
  output: './out',
};

export const emptyIR: IR = { operations: [], schemas: [] };

export const makeSchema = (overrides: Partial<IRSchema> = {}): IRSchema => ({
  type: 'object',
  ...overrides,
});

export const makeProp = (
  name: string,
  type: IRSchema['type'] = 'string',
  required = true,
): IRProperty => ({
  name,
  required,
  type,
  schema: { type },
});

export const makeOperation = (
  overrides: Partial<IROperation> = {},
): IROperation => ({
  id: 'getUsers',
  method: HTTP_METHODS.GET,
  path: '/users',
  tag: 'users',
  deprecated: false,
  params: { path: [], query: [], header: [] },
  body: null,
  response: null,
  ...overrides,
});

export const makeIR = (
  operations: IROperation[] = [],
  schemas: IRSchema[] = [],
): IR => ({ operations, schemas });
