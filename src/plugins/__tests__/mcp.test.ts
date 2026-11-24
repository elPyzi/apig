import { describe, test, expect } from 'bun:test';
import { mcp, generateMcp } from '../mcp';
import { requests } from '../requests';
import { zod } from '../zod';
import { typescript } from '../typescript';
import {
  baseConfig,
  emptyIR,
  makeOperation,
  makeIR,
  makeSchema,
} from './fixtures';
import { HTTP_METHODS, type ZvyappyConfig } from '@models';

const withDeps = (overrides: Partial<ZvyappyConfig> = {}): ZvyappyConfig => ({
  ...baseConfig,
  plugins: [typescript(), requests(), zod()],
  ...overrides,
});

describe('mcp', () => {
  describe('factory', () => {
    test('returns a plugin with the right metadata', () => {
      const plugin = mcp();
      expect(plugin.name).toBe('mcp');
      expect(plugin.fileName).toBe('mcp');
      expect(plugin.scope).toBe('root');
    });
  });

  describe('plugin dependencies', () => {
    test('throws without the requests plugin', () => {
      const config = { ...baseConfig, plugins: [zod()] };
      expect(() => generateMcp(emptyIR, config)).toThrow(
        'mcp plugin requires requests plugin',
      );
    });

    test('throws without the zod plugin', () => {
      const config = { ...baseConfig, plugins: [requests()] };
      expect(() => generateMcp(emptyIR, config)).toThrow(
        'mcp plugin requires zod plugin',
      );
    });

    test('does not throw when both are present', () => {
      expect(() => generateMcp(emptyIR, withDeps())).not.toThrow();
    });
  });

  describe('empty IR', () => {
    test('contains the banner and the MCP imports', () => {
      const code = generateMcp(emptyIR, withDeps()).code;
      expect(code).toContain('auto-generated');
      expect(code).toContain(
        "import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'",
      );
      expect(code).toContain('StdioServerTransport');
    });

    test('still creates and connects a server', () => {
      const code = generateMcp(emptyIR, withDeps()).code;
      expect(code).toContain('new McpServer(');
      expect(code).toContain('await server.connect(transport)');
    });

    test('exports the server', () => {
      expect(generateMcp(emptyIR, withDeps()).exports).toEqual(['server']);
    });
  });

  describe('tools', () => {
    const ir = makeIR([
      makeOperation({
        id: 'getUsers',
        method: HTTP_METHODS.GET,
        path: '/users',
        summary: 'List all users',
      }),
    ]);

    test('registers one tool per operation', () => {
      expect(generateMcp(ir, withDeps()).code).toContain(
        "server.registerTool(\n  'getUsers',",
      );
    });

    test('the summary becomes the tool description', () => {
      expect(generateMcp(ir, withDeps()).code).toContain(
        "description: 'List all users'",
      );
    });

    test('an operation without a summary falls back to method and path', () => {
      const bare = makeIR([
        makeOperation({
          id: 'ping',
          method: HTTP_METHODS.GET,
          path: '/ping',
          summary: undefined,
          description: undefined,
        }),
      ]);
      expect(generateMcp(bare, withDeps()).code).toContain(
        "description: 'GET /ping'",
      );
    });

    test('the handler calls the matching request function', () => {
      const code = generateMcp(ir, withDeps()).code;
      expect(code).toContain('const data = await getUsers()');
      expect(code).toContain("from './requests'");
    });

    test('API failures come back as tool errors, not crashes', () => {
      expect(generateMcp(ir, withDeps()).code).toContain('isError: true');
    });
  });

  describe('input schema', () => {
    test('a path parameter becomes a top-level field', () => {
      const ir = makeIR([
        makeOperation({
          id: 'getUser',
          path: '/users/{id}',
          params: {
            path: [{ name: 'id', required: true, type: 'string' }],
            query: [],
            header: [],
          },
        }),
      ]);
      expect(generateMcp(ir, withDeps()).code).toContain('inputSchema: { id:');
    });

    test('query parameters are grouped under params, mirroring the request function call', () => {
      const ir = makeIR([
        makeOperation({
          id: 'search',
          params: {
            path: [],
            query: [
              {
                name: 'limit',
                required: false,
                type: 'number',
                schema: { type: 'number' },
              },
            ],
            header: [],
          },
        }),
      ]);
      const code = generateMcp(ir, withDeps()).code;
      expect(code).toContain('params: z.object({ limit:');
      expect(code).toContain('.optional()');
    });

    test('a referenced body schema is imported instead of inlined', () => {
      const ir = makeIR(
        [
          makeOperation({
            id: 'createUser',
            method: HTTP_METHODS.POST,
            body: {
              required: true,
              contentType: 'json',
              schema: { type: 'unknown', name: 'User' },
            },
          }),
        ],
        [makeSchema({ name: 'User', type: 'object', properties: [] })],
      );
      const code = generateMcp(ir, withDeps()).code;
      expect(code).toContain('body: UserSchema');
      expect(code).toContain("import { UserSchema } from './zod'");
    });

    test('a custom schemaSuffix on zod is honoured', () => {
      const ir = makeIR(
        [
          makeOperation({
            id: 'createUser',
            method: HTTP_METHODS.POST,
            body: {
              required: true,
              contentType: 'json',
              schema: { type: 'unknown', name: 'User' },
            },
          }),
        ],
        [makeSchema({ name: 'User', type: 'object', properties: [] })],
      );
      const config = {
        ...baseConfig,
        plugins: [requests(), zod({ schemaSuffix: 'Zod' })],
      };
      expect(generateMcp(ir, config).code).toContain('body: UserZod');
    });
  });

  describe('multipart operations', () => {
    test('are skipped — a file upload cannot be an MCP tool input', () => {
      const ir = makeIR([
        makeOperation({
          id: 'upload',
          method: HTTP_METHODS.POST,
          body: {
            required: true,
            contentType: 'multipart',
            schema: { type: 'object', properties: [] },
          },
        }),
      ]);
      expect(generateMcp(ir, withDeps()).code).not.toContain("'upload'");
    });
  });

  describe('options', () => {
    test('name and version reach the server constructor', () => {
      const plugin = mcp({ name: 'petstore', version: '2.1.0' });
      const code = plugin.generate(emptyIR, withDeps()).code;
      expect(code).toContain(
        "new McpServer({ name: 'petstore', version: '2.1.0' })",
      );
    });
  });

  describe('parameter names', () => {
    test('a hyphenated path parameter is keyed like the handler destructures it', () => {
      const op = makeOperation({
        id: 'getMap',
        path: '/maps/{structure-type}',
        params: {
          path: [
            {
              name: 'structure-type',
              required: true,
              type: 'string',
              schema: { type: 'string' },
            },
          ],
          query: [],
          header: [],
        },
      });
      const code = generateMcp(makeIR([op]), withDeps()).code;

      expect(code).toContain('inputSchema: { structureType: z.string() }');
      expect(code).toContain('async ({ structureType }) =>');
    });

    test('a content-encoded parameter is a string, as in the request function', () => {
      const op = makeOperation({
        id: 'search',
        params: {
          path: [],
          query: [{ name: 'filter', required: true, type: '' as never }],
          header: [],
        },
      });

      expect(generateMcp(makeIR([op]), withDeps()).code).toContain(
        'params: z.object({ filter: z.string() })',
      );
    });
  });

  describe('groupBy', () => {
    const ir = makeIR([
      makeOperation({ id: 'listPets', tag: 'pets', path: '/pets' }),
      makeOperation({ id: 'getPet', tag: 'pets', path: '/pets/1' }),
      makeOperation({ id: 'listOrders', tag: 'store.orders', path: '/orders' }),
    ]);

    test('without it, request functions come from the root file', () => {
      expect(generateMcp(ir, withDeps()).code).toContain(
        "import { listPets, getPet, listOrders } from './requests';",
      );
    });

    test('each function comes from the file of its group', () => {
      const tags = generateMcp(ir, withDeps({ groupBy: 'tags' })).code;
      expect(tags).toContain(
        "import { listPets, getPet } from './pets/pets.requests';",
      );
      expect(tags).toContain(
        "import { listOrders } from './store.orders/store.orders.requests';",
      );
      expect(tags).not.toContain("from './requests'");

      const ops = generateMcp(
        ir,
        withDeps({ groupBy: 'operations', fileNaming: 'PascalCase' }),
      ).code;
      expect(ops).toContain(
        "import { listPets } from './ListPets/ListPets.requests';",
      );

      const endpoints = generateMcp(
        ir,
        withDeps({ groupBy: 'endpoints' }),
      ).code;
      expect(endpoints).toContain(
        "import { getPet } from './pets/get-pet/get-pet.requests';",
      );
    });
  });
});
