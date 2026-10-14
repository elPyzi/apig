import { describe, test, expect } from 'bun:test';
import { parseDuration, isValidDuration } from '@libs/duration';

describe('parseDuration', () => {
  test('reads every unit', () => {
    expect(parseDuration('30s')).toBe(30_000);
    expect(parseDuration('15m')).toBe(900_000);
    expect(parseDuration('12h')).toBe(43_200_000);
    expect(parseDuration('7d')).toBe(604_800_000);
  });

  test('ignores surrounding whitespace', () => {
    expect(parseDuration('  7d  ')).toBe(604_800_000);
  });

  test('rejects zero, which is a disabled cache spelled confusingly', () => {
    expect(parseDuration('0d')).toBeNull();
  });

  test('rejects anything that is not an amount and a unit', () => {
    for (const bad of ['7', 'd', '7 d', '7 дней', '7w', '-1d', '1.5h', '']) {
      expect(parseDuration(bad)).toBeNull();
    }
  });

  test('isValidDuration mirrors it', () => {
    expect(isValidDuration('7d')).toBe(true);
    expect(isValidDuration('7w')).toBe(false);
  });
});
