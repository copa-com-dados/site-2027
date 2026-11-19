import type { Match, ModelMeta, Round, Team } from '../types/schema';

export interface RoundView extends Round {
  matches: Match[];
  /** True when the model has published predictions for this round. */
  published: boolean;
}

/** Every round of the calendar, in order, with its published matches. */
export function roundViews(meta: ModelMeta, matches: readonly Match[]): RoundView[] {
  return [...meta.rounds]
    .sort((a, b) => a.round - b.round)
    .map((r) => {
      const ms = matches.filter((m) => m.round === r.round).sort((a, b) => a.order - b.order);
      return { ...r, matches: ms, published: ms.length > 0 };
    });
}

/**
 * Round to show: the one that contains `matchId`, else `requested`, else the
 * model's current round, else the first round with matches.
 */
export function pickRound(
  rounds: readonly RoundView[],
  currentRound: number,
  requested?: number,
  matchId?: string | null,
): RoundView | undefined {
  const published = rounds.filter((r) => r.published);
  return (
    (matchId ? published.find((r) => r.matches.some((m) => m.id === matchId)) : undefined) ??
    published.find((r) => r.round === requested) ??
    published.find((r) => r.round === currentRound) ??
    published[0]
  );
}

/**
 * Featured match on the home page: the editorial override if it exists,
 * otherwise the host nation's match in the current round, otherwise that
 * round's first match.
 */
export function pickFeatured(
  meta: ModelMeta,
  matches: readonly Match[],
  teams: readonly Team[],
  overrideId?: string | null,
): Match | undefined {
  const override = overrideId ? matches.find((m) => m.id === overrideId) : undefined;
  if (override) return override;
  const round = pickRound(roundViews(meta, matches), meta.currentRound);
  if (!round) return undefined;
  const hosts = new Set(teams.filter((t) => t.isHost).map((t) => t.code));
  return round.matches.find((m) => hosts.has(m.home.code) || hosts.has(m.away.code)) ?? round.matches[0];
}
