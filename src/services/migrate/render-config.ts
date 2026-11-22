import { DOCS_BASE } from '@constants';
import type { MigratedProject, PluginCall } from './types';

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

const literal = (value: unknown, indent: string): string => {
  if (typeof value === 'string')
    return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  if (Array.isArray(value))
    return `[${value.map((v) => literal(v, indent)).join(', ')}]`;
  if (value && typeof value === 'object') {
    const inner = `${indent}  `;
    const entries = Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .map(
        ([k, v]) =>
          `${inner}${IDENTIFIER.test(k) ? k : literal(k, inner)}: ${literal(v, inner)},`,
      );
    return entries.length ? `{\n${entries.join('\n')}\n${indent}}` : '{}';
  }
  return 'undefined';
};

const pluginCall = (plugin: PluginCall): string => {
  const options = Object.entries(plugin.options ?? {})
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}: ${literal(v, '')}`);
  return options.length
    ? `${plugin.factory}({ ${options.join(', ')} })`
    : `${plugin.factory}()`;
};

const renderProject = (project: MigratedProject, indent: string): string => {
  const pad = `${indent}  `;
  const lines: string[] = [];

  for (const note of project.notes)
    lines.push(`${pad}// TODO(migrate): ${note}`);

  const field = (key: string, value: unknown) => {
    if (value !== undefined)
      lines.push(`${pad}${key}: ${literal(value, pad)},`);
  };

  field('name', project.name);
  field('input', project.input);
  field('output', project.output);
  field('baseUrl', project.baseUrl);
  lines.push(`${pad}plugins: [`);
  for (const plugin of project.plugins)
    lines.push(`${pad}  ${pluginCall(plugin)},`);
  lines.push(`${pad}],`);
  field('groupBy', project.groupBy);
  field('enumStyle', project.enumStyle);
  field('typeStyle', project.typeStyle);
  field('fileNaming', project.fileNaming);
  field('formatter', project.formatter);
  field('index', project.index);
  field('rawResponse', project.rawResponse);
  field('filter', project.filter);
  field('hooks', project.hooks);

  return `{\n${lines.join('\n')}\n${indent}}`;
};

export const renderConfig = (
  projects: MigratedProject[],
  source: string,
): string => {
  const factories = [
    ...new Set(projects.flatMap((p) => p.plugins.map((pl) => pl.factory))),
  ];

  const body =
    projects.length === 1
      ? renderProject(projects[0]!, '')
      : `[\n${projects.map((p) => `  ${renderProject(p, '  ')}`).join(',\n')},\n]`;

  return [
    `// @travjek/apig — ${DOCS_BASE}`,
    `// Migrated from ${source}. Values were resolved when the migration ran:`,
    `// anything that came from an environment variable is now a literal.`,
    `import { defineConfig, ${factories.join(', ')} } from '@travjek/apig';`,
    ``,
    `export default defineConfig(${body});`,
    ``,
  ].join('\n');
};
