import { capitalize } from '@libs/string/capitalize';

export const toPascalCase = (str: string): string => {
  return str
    .split(/[-_\/\s]+/)
    .map(capitalize)
    .join('');
};
