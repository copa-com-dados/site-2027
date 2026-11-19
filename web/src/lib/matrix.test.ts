import { describe, expect, it } from 'vitest';
import { heat, rankCells, sameCell, toGrid, topCell } from './matrix';

const cells = [
  { home: 0, away: 0, p: 0.07 },
  { home: 2, away: 1, p: 0.136 },
  { home: 1, away: 1, p: 0.131 },
];

describe('matrix', () => {
  it('builds a 5x5 grid filling gaps with zero', () => {
    const g = toGrid(cells);
    expect(g).toHaveLength(5);
    expect(g[2]![1]!.p).toBe(0.136);
    expect(g[4]![4]!.p).toBe(0);
  });
  it('ranks cells', () => {
    expect(topCell(cells)).toEqual({ home: 2, away: 1, p: 0.136 });
    expect(rankCells(cells).map((c) => c.p)).toEqual([0.136, 0.131, 0.07]);
  });
  it('compares cells', () => {
    expect(sameCell(cells[0], { home: 0, away: 0, p: 1 })).toBe(true);
    expect(sameCell(null, cells[0])).toBe(false);
  });
  it('scales heat continuously with probability', () => {
    const top = heat(0.14, 0.14, 'green');
    const mid = heat(0.07, 0.14, 'green');
    const low = heat(0.01, 0.14, 'green');
    const alpha = (h: { backgroundColor: string }) =>
      Number(h.backgroundColor.match(/[\d.]+\)$/)![0].slice(0, -1));
    expect(alpha(top)).toBeGreaterThan(alpha(mid));
    expect(alpha(mid)).toBeGreaterThan(alpha(low));
    expect(top.strong).toBe(true);
    expect(top.color).toBe('#ffffff');
    expect(low.strong).toBe(false);
  });
});
