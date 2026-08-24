import {
  NAMING_CASES,
  type ApigConfig,
  type IROperation,
  type IRSchema,
} from '@models';
import { CaseFns } from '@libs/string';
import { getArgs } from '@services/codegen/common/get-args';
import { buildInputSchema } from './input-schema';

/** MCP tool names are restricted to word characters and dashes. */
export const toToolName = (id: string): string =>
  id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);

/**
 * The model chooses a tool by its description, so an operation without a
 * summary falls back to its method and path rather than to nothing at all.
 */
const toolDescription = (operation: IROperation): string => {
  const text =
    operation.summary ??
    operation.description ??
    `${operation.method} ${operation.path}`;
  return text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ');
};

export const generateMcpTool = (
  operation: IROperation,
  allSchemas: IRSchema[],
  config: ApigConfig,
  schemaSuffix: string,
): string => {
  const fnName = CaseFns[config?.functionNaming ?? NAMING_CASES.CAMEL](
    operation.id,
  );
  const inputSchema = buildInputSchema(operation, allSchemas, schemaSuffix);
  // the input shape mirrors the SDK signature, so the arguments forward as-is
  const args = getArgs(operation);
  const destructured = args.map((a) => a.name).join(', ');
  const callArgs = args.map((a) => a.name).join(', ');
  const handlerArg = args.length > 0 ? `{ ${destructured} }` : '';

  return [
    `server.registerTool(`,
    `  '${toToolName(operation.id)}',`,
    `  {`,
    `    description: '${toolDescription(operation)}',`,
    `    inputSchema: ${inputSchema},`,
    `  },`,
    `  async (${handlerArg}) => {`,
    `    try {`,
    `      const data = await ${fnName}(${callArgs});`,
    `      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };`,
    `    } catch (error: unknown) {`,
    `      const message = error instanceof Error ? error.message : String(error);`,
    `      return {`,
    `        isError: true,`,
    `        content: [{ type: 'text' as const, text: message }],`,
    `      };`,
    `    }`,
    `  },`,
    `);`,
  ].join('\n');
};
