import { describe, test, expect } from 'bun:test';
import { playwright, generatePlaywright } from '../playwright';
import { faker } from '../faker';
import {
  baseConfig,
  emptyIR,
  makeIR,
  makeOperation,
  makeProp,
  makeSchema,
} from './fixtures';
import { HTTP_METHODS, type ApigConfig, type IROperation } from '@models';

const petSchema = makeSchema({ name: 'Pet' });
const inputSchema = makeSchema({ name: 'CreatePetInput' });

const getPets = (overrides: Partial<IROperation> = {}): IROperation =>
  makeOperation({
    id: 'listPets',
    method: HTTP_METHODS.GET,
    path: '/pets',
    tag: 'pets',
    response: petSchema,
    ...overrides,
  });

const createPet = (overrides: Partial<IROperation> = {}): IROperation =>
  makeOperation({
    id: 'createPet',
    method: HTTP_METHODS.POST,
    path: '/pets',
    tag: 'pets',
    body: { required: true, schema: inputSchema },
    response: petSchema,
    ...overrides,
  });

const login = (): IROperation =>
  makeOperation({
    id: 'login',
    method: HTTP_METHODS.POST,
    path: '/auth/login',
    tag: 'auth',
    body: { required: true, schema: makeSchema({ name: 'LoginInput' }) },
    response: makeSchema({ name: 'LoginResult' }),
  });

const irWith = (...operations: IROperation[]) =>
  makeIR(operations, [petSchema, inputSchema]);

describe('playwright', () => {
  describe('factory', () => {
    test('returns a plugin with the right metadata', () => {
      const plugin = playwright();
      expect(plugin.name).toBe('playwright');
      expect(plugin.fileName).toBe('playwright');
      expect(plugin.scope).toBe('operations');
    });

    test('is operation-scoped so groupBy splits its output', () => {
      expect(playwright().scope).toBe('operations');
    });
  });

  describe('empty IR', () => {
    test('emits the banner and the Playwright imports', () => {
      const { code } = generatePlaywright(emptyIR, baseConfig);
      expect(code).toContain('auto-generated');
      expect(code).toContain("import { test as base } from '@playwright/test'");
      expect(code).toContain('APIRequestContext');
    });

    test('emits an empty client factory and the fixture', () => {
      const { code } = generatePlaywright(emptyIR, baseConfig);
      expect(code).toContain(
        'export const createApiClient = (ctx: APIRequestContext) => ({',
      );
      expect(code).toContain('export const apigPlaywrightTest = base.extend');
    });
  });

  describe('methods', () => {
    test('maps the HTTP method onto the request context', () => {
      const { code } = generatePlaywright(irWith(getPets()), baseConfig);
      expect(code).toContain('ctx.get(`/pets`)');
    });

    test('sends a JSON body as `data`', () => {
      const { code } = generatePlaywright(irWith(createPet()), baseConfig);
      expect(code).toContain('ctx.post(`/pets`, { data: body })');
      expect(code).toContain('body: CreatePetInput');
    });

    test('interpolates path parameters into the URL', () => {
      const ir = irWith(
        getPets({
          path: '/pets/{id}',
          params: { path: [makeProp('id')], query: [], header: [] },
        }),
      );
      expect(generatePlaywright(ir, baseConfig).code).toContain(
        'ctx.get(`/pets/${id}`)',
      );
    });

    test('returns the parsed body typed from the response schema', () => {
      const { code } = generatePlaywright(irWith(getPets()), baseConfig);
      expect(code).toContain('Promise<Pet>');
      expect(code).toContain('return r.json() as Promise<Pet>;');
    });

    test('an operation without a response returns void and parses nothing', () => {
      const ir = irWith(
        getPets({
          id: 'deletePet',
          method: HTTP_METHODS.DELETE,
          response: null,
        }),
      );
      const { code } = generatePlaywright(ir, baseConfig);
      expect(code).toContain('Promise<void>');
      expect(code).not.toContain('return r.json()');
    });

    test('does not bind an unused response when there is nothing to check or return', () => {
      const ir = irWith(
        getPets({ id: 'ping', method: HTTP_METHODS.DELETE, response: null }),
      );
      const config: ApigConfig = { ...baseConfig, errorHandling: false };
      const { code } = generatePlaywright(ir, config);
      expect(code).toContain('await ctx.delete(`/pets`);');
      expect(code).not.toContain('const r = await');
    });

    test('carries the JSDoc summary over from the spec', () => {
      const ir = irWith(getPets({ summary: 'List all pets' }));
      expect(generatePlaywright(ir, baseConfig).code).toContain(
        'List all pets',
      );
    });
  });

  describe('query parameters', () => {
    const withQuery = () =>
      irWith(
        getPets({
          params: {
            path: [],
            query: [makeProp('limit', 'number', false)],
            header: [],
          },
        }),
      );

    test('passes them through the toParams helper', () => {
      const { code } = generatePlaywright(withQuery(), baseConfig);
      expect(code).toContain('{ params: toParams(params) }');
    });

    test('emits the helper only when an operation has query parameters', () => {
      expect(generatePlaywright(withQuery(), baseConfig).code).toContain(
        'const toParams =',
      );
      expect(
        generatePlaywright(irWith(getPets()), baseConfig).code,
      ).not.toContain('const toParams =');
    });

    test('serializes through URLSearchParams so arrays can repeat a key', () => {
      expect(generatePlaywright(withQuery(), baseConfig).code).toContain(
        'new URLSearchParams()',
      );
    });
  });

  describe('header parameters', () => {
    const withHeader = () =>
      irWith(
        getPets({
          params: {
            path: [],
            query: [],
            header: [makeProp('X-Trace', 'string', false)],
          },
        }),
      );

    test('stringifies them through the toHeaders helper', () => {
      const { code } = generatePlaywright(withHeader(), baseConfig);
      expect(code).toContain('headers: toHeaders(headers)');
      expect(code).toContain('const toHeaders =');
    });

    test('emits no helper when no operation takes headers', () => {
      expect(
        generatePlaywright(irWith(getPets()), baseConfig).code,
      ).not.toContain('const toHeaders =');
    });
  });

  describe('multipart bodies', () => {
    const multipartIR = () =>
      irWith(
        createPet({
          body: {
            required: true,
            contentType: 'multipart',
            schema: makeSchema({
              name: 'Upload',
              properties: [
                {
                  name: 'file',
                  required: true,
                  type: 'string',
                  schema: { type: 'string', format: 'binary' },
                },
                makeProp('caption', 'string', false),
              ],
            }),
          },
        }),
      );

    test('types a binary field the way Playwright accepts it', () => {
      expect(generatePlaywright(multipartIR(), baseConfig).code).toContain(
        'file: { name: string; mimeType: string; buffer: Buffer }',
      );
    });

    test('drops undefined optional fields through the toMultipart helper', () => {
      const { code } = generatePlaywright(multipartIR(), baseConfig);
      expect(code).toContain('multipart: toMultipart({ file, caption })');
      expect(code).toContain('const toMultipart =');
    });
  });

  describe('base URL', () => {
    test('prefixes every path with the top-level baseUrl', () => {
      const config: ApigConfig = {
        ...baseConfig,
        baseUrl: 'https://api.example.com',
      };
      expect(generatePlaywright(irWith(getPets()), config).code).toContain(
        'ctx.get(`https://api.example.com/pets`)',
      );
    });

    test('the plugin option wins over the top-level baseUrl', () => {
      const config: ApigConfig = {
        ...baseConfig,
        baseUrl: 'https://api.example.com',
      };
      const { code } = generatePlaywright(irWith(getPets()), config, {
        baseUrl: 'https://staging.example.com',
      });
      expect(code).toContain('ctx.get(`https://staging.example.com/pets`)');
    });

    test('leaves paths relative when neither is set, for playwright.config baseURL', () => {
      expect(generatePlaywright(irWith(getPets()), baseConfig).code).toContain(
        'ctx.get(`/pets`)',
      );
    });
  });

  describe('error handling', () => {
    test('throws ApigError on a non-2xx response by default', () => {
      const { code } = generatePlaywright(irWith(getPets()), baseConfig);
      expect(code).toContain(
        'if (!r.ok()) throw new ApigError(r.status(), await parseApiError(r));',
      );
      expect(code).toContain("import { ApigError } from './config'");
    });

    test('uses a local parser because APIResponse is not a fetch Response', () => {
      const { code } = generatePlaywright(irWith(getPets()), baseConfig);
      expect(code).toContain('const parseApiError =');
      expect(code).toContain('response: APIResponse');
    });

    test('throws nothing when errorHandling is off', () => {
      const config: ApigConfig = { ...baseConfig, errorHandling: false };
      const { code } = generatePlaywright(irWith(getPets()), config);
      expect(code).not.toContain('throw new');
      expect(code).not.toContain('const parseApiError =');
    });

    test('honours a custom error class', () => {
      const config: ApigConfig = {
        ...baseConfig,
        errorHandling: { path: './errors', export: 'MyError' },
      };
      const { code } = generatePlaywright(irWith(getPets()), config);
      expect(code).toContain('throw new MyError(');
      expect(code).toContain("import { MyError } from './errors'");
    });

    test('emits the shared config.ts holding ApigError', () => {
      const files = playwright().generateRootFiles!(
        irWith(getPets()),
        baseConfig,
      );
      expect(files).toHaveLength(1);
      expect(files[0]!.fileName).toBe('config.ts');
      expect(files[0]!.code).toContain('class ApigError');
    });
  });

  describe('rawResponse', () => {
    const rawConfig: ApigConfig = { ...baseConfig, rawResponse: true };

    test('hands back the Playwright APIResponse untouched', () => {
      const { code } = generatePlaywright(irWith(getPets()), rawConfig);
      expect(code).toContain('Promise<APIResponse>');
      expect(code).not.toContain('r.json() as Promise<Pet>');
    });

    test('leaves the status check to the test', () => {
      expect(
        generatePlaywright(irWith(getPets()), rawConfig).code,
      ).not.toContain('throw new ApigError');
    });

    test('does not import response types it no longer uses', () => {
      const { code } = generatePlaywright(irWith(getPets()), rawConfig);
      expect(code).not.toContain('import type { Pet }');
    });
  });

  describe('naming options', () => {
    test('renames the exported test', () => {
      const { code, exports } = generatePlaywright(emptyIR, baseConfig, {
        testName: 'apiTest',
      });
      expect(code).toContain('export const apiTest = base.extend');
      expect(exports).toContain('apiTest');
    });

    test('renames the fixture a test destructures', () => {
      const { code } = generatePlaywright(emptyIR, baseConfig, {
        fixtureName: 'requests',
      });
      expect(code).toContain('base.extend<{ requests: ApiClient }>');
      expect(code).toContain('requests: async ({ request }, use) => {');
    });
  });

  describe('groupBy', () => {
    test('prefixes exports with the tag so the barrel file stays unique', () => {
      const config: ApigConfig = { ...baseConfig, groupBy: 'tags' };
      const { code, exports, typeExports } = generatePlaywright(
        irWith(getPets()),
        config,
      );
      expect(code).toContain('export const createPetsApiClient');
      expect(exports).toContain('createPetsApiClient');
      expect(exports).toContain('petsApigPlaywrightTest');
      expect(typeExports).toContain('PetsApiClient');
    });

    test('prefixes with the operation id when grouping by operations', () => {
      const config: ApigConfig = { ...baseConfig, groupBy: 'operations' };
      const { exports } = generatePlaywright(irWith(getPets()), config);
      expect(exports).toContain('createListPetsApiClient');
    });

    test('keeps the plain names when output is not grouped', () => {
      const { exports, typeExports } = generatePlaywright(
        irWith(getPets()),
        baseConfig,
      );
      expect(exports).toContain('createApiClient');
      expect(typeExports).toContain('ApiClient');
    });

    test('climbs back to the output root for shared imports', () => {
      const config: ApigConfig = { ...baseConfig, groupBy: 'tags' };
      expect(generatePlaywright(irWith(getPets()), config).code).toContain(
        "from '../types'",
      );
    });
  });

  describe('withFaker', () => {
    const fakerConfig: ApigConfig = { ...baseConfig, plugins: [faker()] };

    test('throws when the faker plugin is missing', () => {
      expect(() =>
        generatePlaywright(irWith(createPet()), baseConfig, {
          withFaker: true,
        }),
      ).toThrow('requires faker plugin');
    });

    test('aliases the body factory after the operation', () => {
      const { code, exports } = generatePlaywright(
        irWith(createPet()),
        fakerConfig,
        { withFaker: true },
      );
      expect(code).toContain(
        'export const sampleCreatePet = generateCreatePetInput;',
      );
      expect(code).toContain(
        "import { generateCreatePetInput } from './faker'",
      );
      expect(exports).toContain('sampleCreatePet');
    });

    test('skips operations that have no request body', () => {
      const { code } = generatePlaywright(irWith(getPets()), fakerConfig, {
        withFaker: true,
      });
      expect(code).not.toContain('sampleListPets');
    });

    test('emits nothing extra when the option is off', () => {
      expect(
        generatePlaywright(irWith(createPet()), fakerConfig).code,
      ).not.toContain('sampleCreatePet');
    });
  });

  describe('authFixture', () => {
    const cookieAuth = {
      login: 'login',
      payload: '{ user: "u" }',
    } as const;

    test('logs in and reuses the same context, so the cookie rides along', () => {
      const { code } = generatePlaywright(irWith(login()), baseConfig, {
        authFixture: { ...cookieAuth, strategy: 'cookie' },
      });
      expect(code).toContain('authedApi: async ({ request }, use) => {');
      expect(code).toContain('await client.login(authPayload);');
      expect(code).toContain('await use(client);');
    });

    test('defaults to the cookie strategy', () => {
      const { code } = generatePlaywright(irWith(login()), baseConfig, {
        authFixture: cookieAuth,
      });
      expect(code).toContain('await client.login(authPayload);');
      expect(code).not.toContain('extraHTTPHeaders');
    });

    test('inlines a string payload as an expression', () => {
      const { code } = generatePlaywright(irWith(login()), baseConfig, {
        authFixture: { login: 'login', payload: '{ user: process.env.U }' },
      });
      expect(code).toContain('const authPayload = { user: process.env.U };');
    });

    test('imports a payload the user keeps in their own file', () => {
      const { code } = generatePlaywright(irWith(login()), baseConfig, {
        authFixture: {
          login: 'login',
          payload: { import: 'creds', from: '../auth.config' },
        },
      });
      expect(code).toContain("import { creds } from '../auth.config'");
      expect(code).toContain('await client.login(creds);');
      expect(code).not.toContain('const authPayload =');
    });

    test('builds a header-carrying context for the bearer strategy', () => {
      const { code } = generatePlaywright(irWith(login()), baseConfig, {
        authFixture: { ...cookieAuth, strategy: 'bearer' },
      });
      expect(code).toContain('playwright.request.newContext({');
      expect(code).toContain(
        "extraHTTPHeaders: { 'Authorization': `Bearer ${token}` }",
      );
      expect(code).toContain('await ctx.dispose();');
    });

    test('threads baseURL through, which a hand-made context does not inherit', () => {
      const { code } = generatePlaywright(irWith(login()), baseConfig, {
        authFixture: { ...cookieAuth, strategy: 'bearer' },
      });
      expect(code).toContain('async ({ playwright, baseURL, request }, use)');
      expect(code).toContain('baseURL,');
    });

    test('reads the token from the configured property', () => {
      const { code } = generatePlaywright(irWith(login()), baseConfig, {
        authFixture: {
          ...cookieAuth,
          strategy: 'bearer',
          tokenPath: 'accessToken',
        },
      });
      expect(code).toContain("body['accessToken']");
    });

    test('parses the login body when responses come back raw', () => {
      const config: ApigConfig = { ...baseConfig, rawResponse: true };
      const { code } = generatePlaywright(irWith(login()), config, {
        authFixture: { ...cookieAuth, strategy: 'bearer' },
      });
      expect(code).toContain('(await res.json())');
    });

    test('renames the authenticated fixture', () => {
      const { code } = generatePlaywright(irWith(login()), baseConfig, {
        authFixture: { ...cookieAuth, fixtureName: 'authed' },
      });
      expect(code).toContain('authed: async ({ request }, use) => {');
    });

    test('throws when the login operationId is not in an ungrouped spec', () => {
      expect(() =>
        generatePlaywright(irWith(getPets()), baseConfig, {
          authFixture: { login: 'nope', payload: '{}' },
        }),
      ).toThrow('is not an operationId');
    });

    test('is skipped in groups that do not hold the login operation', () => {
      const config: ApigConfig = { ...baseConfig, groupBy: 'tags' };
      const { code } = generatePlaywright(irWith(getPets()), config, {
        authFixture: { login: 'login', payload: '{}' },
      });
      expect(code).not.toContain('authedApi');
      expect(code).toContain('api: async ({ request }, use) => {');
    });

    test('emits no fixture at all when the option is unset', () => {
      expect(
        generatePlaywright(irWith(login()), baseConfig).code,
      ).not.toContain('authedApi');
    });
  });

  describe('result', () => {
    test('exports the factory and the test, and the client type separately', () => {
      const { exports, typeExports } = generatePlaywright(
        irWith(getPets()),
        baseConfig,
      );
      expect(exports).toEqual(['createApiClient', 'apigPlaywrightTest']);
      expect(typeExports).toEqual(['ApiClient']);
    });
  });
});
