/**
 * Number formatting that matches the reference design:
 * percentages use a dot decimal ("13.6%"), counts use pt-BR grouping ("10.000").
 */

/** 0.136 → "13.6%" */
export function pct(p: number, digits = 1): string {
  return `${(p * 100).toFixed(digits)}%`;
}

/** 0.4712 → "47%" */
export function pctInt(p: number): string {
  return `${Math.round(p * 100)}%`;
}

/** 10000 → "10.000" */
export function count(n: number): string {
  return new Intl.NumberFormat('pt-BR').format(n);
}

/** (2, 1) → "2 × 1" */
export function score(home: number, away: number, sep = '×', plusFrom?: number): string {
  const fmt = (g: number) => (plusFrom !== undefined && g >= plusFrom ? `${g}+` : String(g));
  return `${fmt(home)} ${sep} ${fmt(away)}`;
}

/**
 * Rounds three probabilities to integer percentages that still add up to 100
 * (largest-remainder method), so the 1X2 labels never read 48/27/26 = 101.
 */
export function roundTo100(values: readonly number[]): number[] {
  const raw = values.map((v) => v * 100);
  const floored = raw.map(Math.floor);
  let rest = 100 - floored.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) {
    if (rest <= 0) break;
    floored[i] += 1;
    rest -= 1;
  }
  return floored;
}

export function initials(name: string): string {
  return name
    .replace(/^Prof\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}
