import { describe, test, expect } from 'bun:test';
import { HTTP_METHODS, type ZvyappyConfig, type HttpClients } from '@models';
import { generateFunction } from '../generate-function';
import { generateErrorType } from '@services/codegen/common/generate-error-types';
import {
  needsParseErrorHelper,
  needsQueryHelper,
} from '@services/codegen/common/needs-query-helper';
import {
  baseConfig,
  makeOperation,
} from '../../../../plugins/__tests__/fixtures';

const deletePet = makeOperation({
  id: 'deletePet',
  method: HTTP_METHODS.DELETE,
  path: '/pets/{petId}',
  params: {
    path: [{ name: 'petId', required: true, type: 'string' }],
    query: [],
    header: [],
  },
  response: null,
});

const generate = (config: Partial<ZvyappyConfig> = {}, client?: HttpClients) =>
  generateFunction(deletePet, [], client ? 'api' : '', '', {
    ...baseConfig,
    ...config,
    ...(client
      ? { httpClient: { name: client, path: './client', export: 'api' } }
      : {}),
  });

describe('a response without a body', () => {
  test('fetch checks the status and parses nothing', () => {
    const code = generate();

    expect(code).toContain('Promise<void>');
    expect(code).toContain('if (!r.ok) throw new ZvyappyError');
    expect(code).not.toContain('.json()');
  });

  test('fetch without error handling discards the body', () => {
    const code = generate({ errorHandling: false });

    expect(code).toContain('.then(() => undefined)');
    expect(code).not.toContain('.json()');
  });

  test('raw response hands back an undefined body with the status', () => {
    const code = generate({ rawResponse: true });

    expect(code).not.toContain('.json()');
    expect(code).toContain(
      'return { body: undefined, status: r.status, headers: r.headers };',
    );
  });

  test('ky and wretch do not call their json parser', () => {
    for (const client of ['ky', 'wretch'] as const) {
      for (const config of [{}, { rawResponse: true }]) {
        expect(generate(config, client)).not.toContain('.json<');
      }
    }
    expect(generate({}, 'wretch')).toContain('.res().then(() => undefined)');
  });

  test('a response with a body is still parsed', () => {
    const code = generateFunction(
      { ...deletePet, response: { type: 'object', name: 'Pet' } },
      [{ type: 'object', name: 'Pet' }],
      '',
      '',
      baseConfig,
    );

    expect(code).toContain('return (await r.json()) as Pet;');
  });
});

describe('error types', () => {
  test('default and ranges are typed as any status', () => {
    const code = generateErrorType(
      {
        ...deletePet,
        errors: [
          { status: 404, schema: { type: 'object', name: 'NotFound' } },
          { status: null, schema: { type: 'object', name: 'Problem' } },
        ],
      },
      [
        { type: 'object', name: 'NotFound' },
        { type: 'object', name: 'Problem' },
      ],
    );

    expect(code).toContain('| { status: 404; body: NotFound }');
    expect(code).toContain('| { status: number; body: Problem }');
    expect(code).not.toContain('NaN');
  });
});

const getPet = makeOperation({
  id: 'getPet',
  path: '/pets',
  response: { type: 'object', name: 'Pet' },
});
const petSchemas = [{ type: 'object' as const, name: 'Pet' }];
const withClient = (config: Partial<ZvyappyConfig>, client?: HttpClients) => ({
  ...baseConfig,
  ...config,
  ...(client
    ? { httpClient: { name: client, path: './client', export: 'api' } }
    : {}),
});

describe('apiLogging', () => {
  const clients = [undefined, 'axios', 'ky', 'ofetch', 'wretch'] as const;

  test('logs the value where it is returned, for every client and mode', () => {
    for (const client of clients) {
      for (const mode of [{}, { rawResponse: true }]) {
        const code = generateFunction(
          getPet,
          petSchemas,
          client ? 'api' : '',
          '',
          withClient({ apiLogging: true, ...mode }, client),
        );
        const lines = code.split('\n');
        const log = lines.findIndex((l) => l.includes("console.log('getPet'"));

        expect(log).toBeGreaterThan(-1);
        // declared on the line above and returned on the line below — inside
        // the same block, so a `try` cannot put `response` out of scope
        expect(lines[log - 1]).toMatch(/^\s*const response = /);
        expect(lines[log + 1]!.trim()).toBe('return response;');
        expect(lines[log - 1]!.match(/^\s*/)![0]).toBe(
          lines[log + 1]!.match(/^\s*/)![0],
        );
      }
    }
  });

  test('a bodiless response is logged without a value', () => {
    const code = generate({ apiLogging: true });
    expect(code).toContain("  console.log('deletePet');");
    expect(code).not.toContain('response');
  });
});

describe('ky error body', () => {
  test('reads what ky 2 already parsed, falling back for ky 1', () => {
    for (const mode of [{}, { rawResponse: true }]) {
      const code = generateFunction(
        getPet,
        petSchemas,
        'api',
        '',
        withClient(mode, 'ky'),
      );
      expect(code).toContain(
        "'data' in err ? err.data : await err.response.json().catch(() => undefined)",
      );
    }
  });
});

describe('multipart', () => {
  const upload = makeOperation({
    id: 'upload',
    method: HTTP_METHODS.POST,
    path: '/upload',
    params: {
      path: [],
      query: [{ name: 'sort', required: false, type: 'string' }],
      header: [],
    },
    body: {
      contentType: 'multipart',
      required: true,
      schema: {
        type: 'object',
        properties: [
          {
            name: 'file',
            required: true,
            type: 'string',
            schema: { type: 'string', format: 'binary' },
          },
          { name: 'created-at', required: false, type: 'string' },
        ],
      },
    },
    response: { type: 'object', name: 'Pet' },
  });
  const gen = (config: Partial<ZvyappyConfig> = {}, client?: HttpClients) =>
    generateFunction(upload, petSchemas, client ? 'api' : '', '', {
      ...withClient(config, client),
    });

  test('a field that is no identifier is posted under its own name', () => {
    const code = gen();
    expect(code).toContain('createdAt?: string');
    expect(code).toContain(
      "if (createdAt !== undefined) _fd.append('created-at', createdAt);",
    );
  });

  test('the status is checked, as for a JSON request', () => {
    expect(gen()).toContain('if (!r.ok) throw new ZvyappyError');
    expect(gen({ errorHandling: false })).not.toContain('ZvyappyError');
  });

  test('rawResponse wraps the result', () => {
    expect(gen({ rawResponse: true })).toContain(
      'return { body: data, status: r.status, headers: r.headers };',
    );
  });

  test('it goes through fetch whatever the client', () => {
    expect(gen({}, 'axios')).toContain('fetch(`/upload${toQuery(params)}`');
  });
});

describe('config.ts helpers for a multipart request', () => {
  const ir = {
    schemas: [],
    operations: [
      makeOperation({
        params: {
          path: [],
          query: [{ name: 'q', required: false, type: 'string' }],
          header: [],
        },
        body: {
          contentType: 'multipart',
          required: true,
          schema: { type: 'object', properties: [] },
        },
      }),
    ],
  };
  const axios = withClient({}, 'axios');

  test('are emitted for a client that would not otherwise need them', () => {
    expect(needsQueryHelper(ir, axios)).toBe(true);
    expect(needsParseErrorHelper(ir, axios, true)).toBe(true);
    expect(needsParseErrorHelper(ir, axios, false)).toBe(false);
  });

  test('are not emitted for that client without one', () => {
    const plain = {
      ...ir,
      operations: [{ ...ir.operations[0]!, body: null }],
    };
    expect(needsQueryHelper(plain, axios)).toBe(false);
    expect(needsParseErrorHelper(plain, axios, true)).toBe(false);
  });
});
