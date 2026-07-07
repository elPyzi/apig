import { type IROperation } from '@models';

export const buildMultipartBody = (operation: IROperation): string => {
  const schema = operation.body!.schema;
  const lines: string[] = ['  const _fd = new FormData();'];

  if (schema.type === 'object' && schema.properties) {
    const sorted = [...schema.properties].sort(
      (a, b) => Number(b.required) - Number(a.required),
    );
    for (const prop of sorted) {
      if (prop.required) {
        lines.push(`  _fd.append('${prop.name}', ${prop.name});`);
      } else {
        lines.push(`  if (${prop.name} !== undefined) _fd.append('${prop.name}', ${prop.name});`);
      }
    }
  } else {
    lines.push("  if (file !== undefined) _fd.append('file', file);");
  }

  return lines.join('\n');
};
