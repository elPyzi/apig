import { type IROperation } from '@models';
import { toParamName, toStringLiteral } from '@libs/string';

export const buildMultipartBody = (operation: IROperation): string => {
  const schema = operation.body!.schema;
  const lines: string[] = ['  const _fd = new FormData();'];

  if (schema.type === 'object' && schema.properties) {
    const sorted = [...schema.properties].sort(
      (a, b) => Number(b.required) - Number(a.required),
    );
    for (const prop of sorted) {
      const field = toStringLiteral(prop.name);
      const arg = toParamName(prop.name);
      if (prop.required) {
        lines.push(`  _fd.append(${field}, ${arg});`);
      } else {
        lines.push(`  if (${arg} !== undefined) _fd.append(${field}, ${arg});`);
      }
    }
  } else {
    lines.push("  if (file !== undefined) _fd.append('file', file);");
  }

  return lines.join('\n');
};
