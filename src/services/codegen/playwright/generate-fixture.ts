import type { PlaywrightAuthStrategy } from '@models';
import type { PlaywrightNames } from './utils';

export const AUTH_PAYLOAD_CONST = 'authPayload';

export interface ResolvedAuth {
  /** Client method that performs the login. */
  loginMethod: string;
  /** Name of the generated authenticated fixture. */
  fixtureName: string;
  strategy: PlaywrightAuthStrategy;
  /** Expression holding the login payload — a local const or an imported name. */
  payloadExpr: string;
  /** Property of the login response holding the token. Bearer only. */
  tokenPath: string;
  /** Header the token is sent in. Bearer only. */
  header: string;
  /** Whether the login call resolves to a raw `APIResponse`. */
  rawResponse: boolean;
}

/**
 * A cookie needs no handling at all: an `APIRequestContext` owns a cookie jar,
 * so the `Set-Cookie` from the login call is replayed on every later request
 * through the same context — httpOnly cookies included.
 */
const buildCookieFixture = (
  names: PlaywrightNames,
  auth: ResolvedAuth,
): string[] => [
  `  ${auth.fixtureName}: async ({ request }, use) => {`,
  `    const client = ${names.factory}(request);`,
  `    await client.${auth.loginMethod}(${auth.payloadExpr});`,
  `    await use(client);`,
  `  },`,
];

/**
 * A bearer token has to be attached by hand, and Playwright fixes default
 * headers when a context is created — so the authenticated client gets its own
 * context. `baseURL` is threaded through from the project config, which a
 * hand-made context does not inherit.
 */
const buildBearerFixture = (
  names: PlaywrightNames,
  auth: ResolvedAuth,
): string[] => [
  `  ${auth.fixtureName}: async ({ playwright, baseURL, request }, use) => {`,
  `    const res = await ${names.factory}(request).${auth.loginMethod}(${auth.payloadExpr});`,
  auth.rawResponse
    ? `    const body = (await res.json()) as Record<string, unknown>;`
    : `    const body = res as unknown as Record<string, unknown>;`,
  `    const token = String(body['${auth.tokenPath}'] ?? '');`,
  ``,
  `    const ctx = await playwright.request.newContext({`,
  `      baseURL,`,
  `      extraHTTPHeaders: { '${auth.header}': \`Bearer \${token}\` },`,
  `    });`,
  ``,
  `    await use(${names.factory}(ctx));`,
  `    await ctx.dispose();`,
  `  },`,
];

/**
 * The exported `test`, extended with a fixture holding the bound client.
 *
 * `request` backs the default fixture, so the client is a standalone HTTP
 * client with no browser attached. A test that needs the browser's session
 * instead builds one from `page.request` with the exported factory.
 */
export const generatePlaywrightFixture = (
  names: PlaywrightNames,
  fixtureName: string,
  auth: ResolvedAuth | null,
): string => {
  const fixtureTypes = [
    `${fixtureName}: ${names.clientType}`,
    ...(auth ? [`${auth.fixtureName}: ${names.clientType}`] : []),
  ].join('; ');

  const lines: string[] = [
    `export const ${names.test} = base.extend<{ ${fixtureTypes} }>({`,
    `  ${fixtureName}: async ({ request }, use) => {`,
    `    await use(${names.factory}(request));`,
    `  },`,
  ];

  if (auth) {
    lines.push(
      ...(auth.strategy === 'bearer'
        ? buildBearerFixture(names, auth)
        : buildCookieFixture(names, auth)),
    );
  }

  lines.push('});');

  return lines.join('\n');
};
