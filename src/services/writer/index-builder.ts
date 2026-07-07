import { join } from 'path';
import type { ApigConfig, ApigPlugin, PluginResult } from '@models';
import type { IR, IROperation } from '@models';
import { applyNaming } from '@libs/string';
import { banner } from '@constants';

const pushExports = (
  lines: string[],
  result: PluginResult | undefined,
  from: string,
): void => {
  if (!result) return;
  if (result.exports.length)
    lines.push(`export { ${result.exports.join(', ')} } from '${from}';`);
  if (result.typeExports.length)
    lines.push(
      `export type { ${result.typeExports.join(', ')} } from '${from}';`,
    );
};

export const buildIndexNone = (
  plugins: ApigPlugin[],
  results: Record<string, PluginResult>,
): string => {
  const lines: string[] = [banner, ''];
  for (const plugin of plugins) {
    pushExports(lines, results[plugin.name], `./${plugin.fileName}`);
  }
  lines.push('');
  return lines.join('\n');
};

const buildIndexRootSection = (
  plugins: ApigPlugin[],
  results: Record<string, PluginResult>,
  lines: string[],
): void => {
  for (const plugin of plugins) {
    if (plugin.scope === 'root') {
      pushExports(lines, results[plugin.name], `./${plugin.fileName}`);
    }
  }
};

export const buildIndexTags = (
  plugins: ApigPlugin[],
  results: Record<string, PluginResult>,
  tagMap: Map<string, IROperation[]>,
  config: ApigConfig,
): string => {
  const naming = config.fileNaming ?? 'kebab-case';
  const lines: string[] = [banner, ''];

  buildIndexRootSection(plugins, results, lines);

  for (const [tag] of tagMap) {
    const tagName = applyNaming(tag, naming);
    for (const plugin of plugins) {
      if (plugin.scope !== 'operations') continue;
      pushExports(
        lines,
        results[`${plugin.name}_${tag}`],
        `./${tagName}/${tagName}.${plugin.fileName}`,
      );
    }
  }

  lines.push('');
  return lines.join('\n');
};

export const buildIndexEndpoints = (
  ir: IR,
  plugins: ApigPlugin[],
  results: Record<string, PluginResult>,
  config: ApigConfig,
): string => {
  const naming = config.fileNaming ?? 'kebab-case';
  const lines: string[] = [banner, ''];

  buildIndexRootSection(plugins, results, lines);

  for (const op of ir.operations) {
    const tagDirName = applyNaming(op.tag ?? 'default', naming);
    const opDirName = applyNaming(op.id, naming);
    for (const plugin of plugins) {
      if (plugin.scope !== 'operations') continue;
      pushExports(
        lines,
        results[`${plugin.name}_${op.id}`],
        `./${tagDirName}/${opDirName}/${opDirName}.${plugin.fileName}`,
      );
    }
  }

  lines.push('');
  return lines.join('\n');
};

export const buildIndexOperations = (
  ir: IR,
  plugins: ApigPlugin[],
  results: Record<string, PluginResult>,
  config: ApigConfig,
): string => {
  const naming = config.fileNaming ?? 'kebab-case';
  const lines: string[] = [banner, ''];

  buildIndexRootSection(plugins, results, lines);

  for (const op of ir.operations) {
    const opDirName = applyNaming(op.id, naming);
    for (const plugin of plugins) {
      if (plugin.scope !== 'operations') continue;
      pushExports(
        lines,
        results[`${plugin.name}_${op.id}`],
        `./${opDirName}/${opDirName}.${plugin.fileName}`,
      );
    }
  }

  lines.push('');
  return lines.join('\n');
};
