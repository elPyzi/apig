import {
  type IR,
  type IRSchema,
  type ApigConfig,
  type ApigPlugin,
  type PluginResult,
  type RhfOptions,
  type RhfResolver,
  banner,
} from '@models';
import { toPascalCase, toCamelCase } from '../libs';

const RESOLVER_META: Record<RhfResolver, { pkg: string; fn: string }> = {
  zod: { pkg: '@hookform/resolvers/zod', fn: 'zodResolver' },
  valibot: { pkg: '@hookform/resolvers/valibot', fn: 'valibotResolver' },
  yup: { pkg: '@hookform/resolvers/yup', fn: 'yupResolver' },
};

export const generateRhf = (
  ir: IR,
  _config: ApigConfig,
  opts: Required<RhfOptions>,
): PluginResult => {
  const meta = RESOLVER_META[opts.resolver];
  const suffix = opts.schemaSuffix;
  const schemasPath = opts.schemasImportPath;

  const schemas = ir.schemas.filter((s): s is IRSchema & { name: string } =>
    Boolean(s.name),
  );

  const schemaNames = schemas.map((s) => `${toPascalCase(s.name)}${suffix}`);

  const lines: string[] = [
    banner,
    '',
    `import { ${meta.fn} } from '${meta.pkg}';`,
    `import { ${schemaNames.join(', ')} } from '${schemasPath}';`,
    '',
  ];

  const exports: string[] = [];

  for (const schema of schemas) {
    const pascal = toPascalCase(schema.name);
    const camel = toCamelCase(schema.name);
    const resolverName = `${camel}Resolver`;
    lines.push(
      `export const ${resolverName} = ${meta.fn}(${pascal}${suffix});`,
    );
    exports.push(resolverName);
  }

  lines.push('');

  return {
    code: lines.join('\n'),
    exports,
    typeExports: [],
  };
};

/**
 * Generates React Hook Form resolvers from validation schemas.
 *
 * Produces a `rhf.ts` file with typed resolvers for each schema.
 * Requires `react-hook-form` and `@hookform/resolvers` as peer dependencies.
 * @example rhf({ resolver: "zod" })
 */
export const rhf = (options: RhfOptions): ApigPlugin => {
  const opts: Required<RhfOptions> = {
    resolver: options.resolver,
    schemaSuffix: options.schemaSuffix ?? 'Schema',
    schemasImportPath: options.schemasImportPath ?? `./${options.resolver}`,
  };

  return {
    name: 'rhf',
    fileName: 'rhf',
    scope: 'root',
    generate: (ir, config) => generateRhf(ir, config, opts),
  };
};
