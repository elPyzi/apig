import {
  type IR,
  type IROperation,
  type ApigConfig,
  type ApigPlugin,
  type PluginResult,
  type McpOptions,
  NAMING_CASES,
  DEFAULTS,
  banner,
} from '@models';
import {
  CaseFns,
  logger,
  getRootPluginImport,
  findPlugin,
  generateMcpTool,
  operationSchemaRefs,
  toPascalCase,
} from '../libs';

/** A file upload cannot travel through an MCP tool call. */
const isSupported = (operation: IROperation): boolean =>
  operation.body?.contentType !== 'multipart';

/**
 * Generates an MCP server exposing every operation as a tool.
 *
 * Produces an `mcp.ts` file that wraps the generated request functions, so an AI
 * assistant can call the API directly. Requires the `requests()` and `zod()` plugins,
 * plus `@modelcontextprotocol/sdk` and `zod` at runtime.
 * @example mcp({ name: "petstore", version: "1.0.0" })
 */
export const mcp = (options: McpOptions = {}): ApigPlugin => {
  const opts = {
    name: options.name ?? DEFAULTS.PLUGINS.MCP.name,
    version: options.version ?? DEFAULTS.PLUGINS.MCP.version,
  };

  return {
    name: 'mcp',
    fileName: 'mcp',
    scope: 'root',
    generate: (ir, config) => generateMcp(ir, config, opts),
  };
};

export const generateMcp = (
  ir: IR,
  config: ApigConfig,
  opts: Required<McpOptions> = {
    name: DEFAULTS.PLUGINS.MCP.name,
    version: DEFAULTS.PLUGINS.MCP.version,
  },
): PluginResult => {
  logger.plugin('mcp', 'Generating tools...');

  const requestsPlugin = findPlugin(config, 'requests');
  if (!requestsPlugin) {
    throw new Error(
      'mcp plugin requires requests plugin — add requests() to plugins',
    );
  }

  const zodPlugin = findPlugin(config, 'zod');
  if (!zodPlugin) {
    throw new Error('mcp plugin requires zod plugin — add zod() to plugins');
  }

  const schemaSuffix =
    zodPlugin.schemaSuffix ?? DEFAULTS.PLUGINS.ZOD.schemaSuffix;

  const operations = ir.operations.filter(isSupported);
  const skipped = ir.operations.length - operations.length;
  if (skipped > 0) {
    logger.warn(
      `mcp: skipped ${skipped} multipart operation(s) — file uploads cannot be expressed as MCP tool input`,
    );
  }

  const fnNaming = CaseFns[config?.functionNaming ?? NAMING_CASES.CAMEL];
  const requestsFns = operations.map((op) => fnNaming(op.id));

  const schemaRefs = new Set<string>();
  for (const op of operations) operationSchemaRefs(op, ir.schemas, schemaRefs);

  const lines: string[] = [
    banner,
    '// Runtime requirements: @modelcontextprotocol/sdk, zod',
    '//',
    '// Register with an MCP client, e.g. in .mcp.json:',
    '//   { "mcpServers": { "' +
      opts.name +
      '": { "command": "bun", "args": ["<path to this file>"] } } }',
    '//',
    '// stdout carries the MCP protocol — anything else printed there breaks it.',
    '',
    "import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';",
    "import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';",
    "import { z } from 'zod';",
  ];

  if (requestsFns.length > 0) {
    lines.push(
      `import { ${requestsFns.join(', ')} } from '${getRootPluginImport(config, 'requests', 'root')}';`,
    );
  }

  if (schemaRefs.size > 0) {
    const names = [...schemaRefs]
      .map((name) => `${toPascalCase(name)}${schemaSuffix}`)
      .join(', ');
    lines.push(
      `import { ${names} } from '${getRootPluginImport(config, 'zod', 'root')}';`,
    );
  }

  lines.push('');
  lines.push(
    `export const server = new McpServer({ name: '${opts.name}', version: '${opts.version}' });`,
  );
  lines.push('');

  for (const operation of operations) {
    lines.push(generateMcpTool(operation, ir.schemas, config, schemaSuffix));
    lines.push('');
  }

  lines.push('const transport = new StdioServerTransport();');
  lines.push('await server.connect(transport);');
  lines.push('');

  // An optional peer dependency produces no install-time warning, and a missing
  // one surfaces only as the MCP client dropping the connection with no reason.
  logger.warn(
    'mcp: the generated server needs @modelcontextprotocol/sdk and zod installed where it runs',
  );

  logger.plugin('mcp', `Done — ${operations.length} tools`);

  return {
    code: lines.join('\n'),
    exports: ['server'],
    typeExports: [],
  };
};
