import { NAMING_CASES, type ApigConfig, type IROperation } from '@models';
import { CaseFns, escapeReservedWord } from '@libs/string';

/**
 * The name an operation's request function is declared and called under.
 *
 * Every plugin that emits or references that function has to agree on it, so
 * the case transform and the reserved-word escape live here rather than at each
 * call site — `operationId: "delete"` otherwise declares `export const delete`,
 * which does not parse.
 */
export const getFunctionName = (
  operation: IROperation,
  // required on purpose: an optional config silently fell back to camelCase, so
  // a plugin honouring `functionNaming` and a generator ignoring it produced
  // names that did not match
  config: ApigConfig | undefined,
): string =>
  escapeReservedWord(
    CaseFns[config?.functionNaming ?? NAMING_CASES.CAMEL](operation.id),
  );
