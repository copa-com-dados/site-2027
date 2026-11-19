import { describe, expect, it } from 'vitest';
import type { Match, ModelMeta, Team } from '../types/schema';
import { pickFeatured, pickRound, roundViews } from './rounds';

const match = (id: string, round: number, order: number, home: string, away: string) =>
  ({ id, round, order, home: { code: home, role: '' }, away: { code: away, role: '' } }) as Match;

const meta = {
  rounds: [
    { round: 1, label: 'Rodada 1', stage: 'Grupos' },
    { round: 2, label: 'Rodada 2', stage: 'Grupos' },
    { round: 3, label: 'Rodada 3', stage: 'Grupos' },
  ],
  currentRound: 2,
} as ModelMeta;

const matches = [
  match('esp-swe', 1, 1, 'ESP', 'SWE'),
  match('fra-bra', 1, 2, 'FRA', 'BRA'),
  match('usa-jpn', 2, 1, 'USA', 'JPN'),
  match('bra-ger', 2, 2, 'BRA', 'GER'),
];
const teams = [{ code: 'BRA', isHost: true } as Team, { code: 'ESP', isHost: false } as Team];

describe('rounds', () => {
  it('marks rounds without matches as unpublished', () => {
    const views = roundViews(meta, matches);
    expect(views.map((r) => r.published)).toEqual([true, true, false]);
    expect(views[1]!.matches.map((m) => m.id)).toEqual(['usa-jpn', 'bra-ger']);
  });

  it('picks the round of the requested match, then the requested round, then the current one', () => {
    const views = roundViews(meta, matches);
    expect(pickRound(views, 2, undefined, 'fra-bra')!.round).toBe(1);
    expect(pickRound(views, 2, 1)!.round).toBe(1);
    expect(pickRound(views, 2, 3)!.round).toBe(2); // round 3 has no matches
    expect(pickRound(views, 2)!.round).toBe(2);
  });

  it('features the host match of the current round unless overridden', () => {
    expect(pickFeatured(meta, matches, teams)!.id).toBe('bra-ger');
    expect(pickFeatured(meta, matches, teams, 'esp-swe')!.id).toBe('esp-swe');
    expect(pickFeatured(meta, matches, teams, 'missing')!.id).toBe('bra-ger');
    expect(pickFeatured(meta, matches, [])!.id).toBe('usa-jpn');
  });
});
