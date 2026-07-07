export const getUrl = (path: string, baseUrl: string): string => {
  const fullPath = baseUrl ? `${baseUrl}${path}` : path;
  return '`' + fullPath.replace(/\{(\w+)\}/g, '${$1}') + '`';
};
