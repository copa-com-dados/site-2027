import { describe, expect, it } from 'vitest';
import { count, initials, pct, pctInt, roundTo100, score } from './format';

describe('format', () => {
  it('formats percentages with a dot decimal', () => {
    expect(pct(0.136)).toBe('13.6%');
    expect(pct(0.001)).toBe('0.1%');
    expect(pctInt(0.476)).toBe('48%');
  });
  it('formats counts in pt-BR', () => {
    expect(count(10000)).toBe('10.000');
    expect(count(14280)).toBe('14.280');
  });
  it('formats scores', () => {
    expect(score(2, 1)).toBe('2 × 1');
    expect(score(4, 0, '×', 4)).toBe('4+ × 0');
  });
  it('rounds to exactly 100', () => {
    expect(roundTo100([0.475, 0.265, 0.26]).reduce((a, b) => a + b)).toBe(100);
    expect(roundTo100([1 / 3, 1 / 3, 1 / 3])).toEqual([34, 33, 33]);
  });
  it('builds initials', () => {
    expect(initials('Prof. Marcelo Gomes')).toBe('MG');
    expect(initials('Clara Yoshida')).toBe('CY');
  });
});
