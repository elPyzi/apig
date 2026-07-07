export const buildJsDoc = (opts: {
  description?: string;
  deprecated?: boolean;
  params?: { name: string; description?: string }[];
}): string => {
  const lines: string[] = [];

  if (opts.description) {
    for (const line of opts.description.split('\n')) {
      lines.push(` * ${line}`);
    }
  }

  if (opts.params?.length) {
    if (lines.length) lines.push(' *');
    for (const p of opts.params) {
      lines.push(
        p.description
          ? ` * @param ${p.name} — ${p.description}`
          : ` * @param ${p.name}`,
      );
    }
  }

  if (opts.deprecated) {
    if (lines.length) lines.push(' *');
    lines.push(' * @deprecated');
  }

  if (lines.length === 0) return '';
  return `/**\n${lines.join('\n')}\n */\n`;
};
