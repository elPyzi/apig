const DURATION_RE = /^(\d+)(s|m|h|d)$/;

const UNIT_MS = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
} as const;

export const DURATION_UNITS = Object.keys(UNIT_MS) as (keyof typeof UNIT_MS)[];

/**
 * A duration written as an amount and a unit — `30s`, `15m`, `12h`, `7d`.
 *
 * Returns milliseconds, or `null` when the string is not one of those. `0` is
 * rejected along with the rest: an entry that expires the instant it is written
 * is a disabled cache spelled confusingly.
 */
export const parseDuration = (value: string): number | null => {
  const match = DURATION_RE.exec(value.trim());
  if (!match) return null;

  const amount = Number(match[1]);
  if (amount <= 0) return null;

  return amount * UNIT_MS[match[2] as keyof typeof UNIT_MS];
};

export const isValidDuration = (value: string): boolean =>
  parseDuration(value) !== null;
