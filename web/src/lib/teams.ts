import type { Team } from '../types/schema';

export type TeamIndex = ReadonlyMap<string, Team>;

export function indexTeams(teams: readonly Team[]): TeamIndex {
  return new Map(teams.map((t) => [t.code, t]));
}

/** Looks a team up, falling back to a neutral placeholder so a bad code never crashes a page. */
export function teamOf(index: TeamIndex, code: string): Team {
  return (
    index.get(code) ?? {
      code,
      name: code,
      shortName: code,
      flag: '🏳️',
      group: '?',
      isHost: false,
      rank: 99,
      titleProb: 0,
      rating: { off: 0, def: 0 },
    }
  );
}
