import type { IROperation } from '@models';
import type { ZvyappyConfig } from '@models';

export const renameOperations = (
  operations: IROperation[],
  config: ZvyappyConfig,
): IROperation[] => {
  if (!config.rename) return operations;

  return operations.map((op) => {
    const newId = config.rename![op.id];
    if (!newId) return op;
    return { ...op, id: newId };
  });
};
