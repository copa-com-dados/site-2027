import type { ScoreCell } from '../types/schema';

export const MATRIX_SIZE = 5;

/** Turns the flat Firestore list into rows[home][away]. Missing cells become p = 0. */
export function toGrid(cells: readonly ScoreCell[]): ScoreCell[][] {
  const grid: ScoreCell[][] = Array.from({ length: MATRIX_SIZE }, (_, home) =>
    Array.from({ length: MATRIX_SIZE }, (_, away) => ({ home, away, p: 0 })),
  );
  for (const c of cells) {
    if (c.home < MATRIX_SIZE && c.away < MATRIX_SIZE) grid[c.home]![c.away] = c;
  }
  return grid;
}

/** Cells sorted by probability, most likely first. */
export function rankCells(cells: readonly ScoreCell[]): ScoreCell[] {
  return [...cells].sort((a, b) => b.p - a.p || a.home + a.away - (b.home + b.away));
}

export function topCell(cells: readonly ScoreCell[]): ScoreCell | undefined {
  return rankCells(cells)[0];
}

export function sameCell(a: ScoreCell | null | undefined, b: ScoreCell | null | undefined): boolean {
  return !!a && !!b && a.home === b.home && a.away === b.away;
}

export type HeatHue = 'green' | 'blue';

// RGB of the design tokens `secondary` (#006c4a) and `primary` (#004ac6).
const HUES: Record<HeatHue, readonly [number, number, number]> = {
  green: [0, 108, 74],
  blue: [0, 74, 198],
};

export interface Heat {
  backgroundColor: string;
  color: string;
  /** True when the cell is dark enough to need light text. */
  strong: boolean;
}

/**
 * Continuous heatmap color: opacity grows with p relative to the most likely
 * cell (gamma < 1 spreads the mid-range so 3% and 6% look clearly different).
 */
export function heat(p: number, max: number, hue: HeatHue): Heat {
  const t = max > 0 ? Math.min(1, Math.max(0, p / max)) : 0;
  const alpha = 0.05 + 0.87 * Math.pow(t, 0.7);
  const [r, g, b] = HUES[hue];
  const strong = alpha >= 0.5;
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`,
    color: strong ? '#ffffff' : t < 0.12 ? '#737686' : '#0d1c2f',
    strong,
  };
}

/** CSS gradient used by the heatmap legends. */
export function heatLegend(hue: HeatHue): string {
  const [r, g, b] = HUES[hue];
  return `linear-gradient(to right, rgba(${r}, ${g}, ${b}, 0.05), rgba(${r}, ${g}, ${b}, 0.92))`;
}
