import type { IROperation } from '@models';
import { logger } from '@libs/logger';

/**
 * What an `operationId` reduces to once a naming convention is applied.
 *
 * `getUser`, `get_user` and `get-user` all become the same identifier whatever
 * the convention, so they are the same name as far as the generated code is
 * concerned.
 */
const canonical = (id: string): string => id.toLowerCase().replace(/\W|_/g, '');

/**
 * Makes `operationId`s unique after normalization.
 *
 * Two ids that differ only in separators collapse into one function name, and
 * the generated file then declares it twice — or, under `groupBy`, writes both
 * operations into the same directory and silently keeps only the last. The
 * suffix is applied to the id itself so that every name derived from it — the
 * function, the directory, the query key, the MCP tool — stays in agreement.
 */
export const dedupeOperationIds = (
  operations: IROperation[],
): IROperation[] => {
  const taken = new Set<string>();

  return operations.map((op) => {
    const key = canonical(op.id);
    if (!taken.has(key)) {
      taken.add(key);
      return op;
    }

    let suffix = 2;
    while (taken.has(canonical(`${op.id}_${suffix}`))) suffix++;

    const id = `${op.id}_${suffix}`;
    taken.add(canonical(id));

    logger.warn(
      `operationId "${op.id}" collides with an earlier one once normalized — generating it as "${id}"`,
    );

    return { ...op, id };
  });
};
