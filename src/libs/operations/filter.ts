import type { IROperation } from '@models';
import type { ApigConfig } from '@models';

export const filterOperations = (
  operations: IROperation[],
  config: ApigConfig,
): IROperation[] => {
  if (!config.filter) return operations;

  let result = [...operations];
  const { tags, exclude, deprecated } = config.filter;

  if (tags && tags.length > 0) {
    result = result.filter((op) => tags.includes(op.tag ?? 'default'));
  }

  if (exclude && exclude.length > 0) {
    result = result.filter((op) => !exclude.includes(op.tag ?? 'default'));
  }

  if (deprecated === false || deprecated === undefined) {
    result = result.filter((op) => !op.deprecated);
  }

  return result;
};
