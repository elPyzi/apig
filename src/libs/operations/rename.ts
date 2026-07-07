import type { IROperation } from '@models';
import type { ApigConfig } from '@models';

export const renameOperations = (
  operations: IROperation[],
  config: ApigConfig,
): IROperation[] => {
  if (!config.rename) return operations;

  return operations.map((op) => {
    const newId = config.rename![op.id];
    if (!newId) return op;
    return { ...op, id: newId };
  });
};
