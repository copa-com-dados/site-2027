import { Icon } from '../../components/ui/Icon';
import { count, pct, roundTo100, score } from '../../lib/format';
import type { ScoreCell, Match, Team } from '../../types/schema';

interface Props {
  match: Match;
  home: Team;
  away: Team;
  top: ScoreCell;
}

export function MatchCard({ match, home, away }: Omit<Props, 'top'>) {
  const [pH, pD, pA] = roundTo100([match.probs.home, match.probs.draw, match.probs.away]);
  return (
    <section className="rounded-xl bg-surface-container-lowest p-4 lg:p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between text-on-surface">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl">{home.flag}</span>
          <div className="flex flex-col min-w-0">
            <span className="font-title-md text-[16px] font-semibold truncate">{home.shortName}</span>
            <span className="font-label-sm text-[11px] text-on-surface-variant">{match.home.role}</span>
          </div>
        </div>
        <span className="font-label-sm text-[11px] text-on-surface-variant text-center px-1">
          {match.stageLabel}
        </span>
        <div className="flex items-center gap-2 min-w-0 justify-end text-right">
          <div className="flex flex-col min-w-0">
            <span className="font-title-md text-[16px] font-semibold truncate">{away.shortName}</span>
            <span className="font-label-sm text-[11px] text-on-surface-variant">{match.away.role}</span>
          </div>
          <span className="text-2xl">{away.flag}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between font-label-sm text-[11px] text-on-surface-variant px-0.5">
          <span className="font-semibold text-secondary">
            Vitória {home.code} {pH}%
          </span>
          <span className="text-on-surface-variant font-medium">Empate {pD}%</span>
          <span className="font-semibold text-primary">
            Vitória {away.code} {pA}%
          </span>
        </div>
        <div className="h-2.5 w-full bg-surface-container-high rounded-full overflow-hidden flex">
          <div
            className="bg-secondary-fixed-dim h-full transition-all duration-500"
            style={{ width: `${pH}%` }}
          />
          <div
            className="bg-surface-variant h-full transition-all duration-500"
            style={{ width: `${pD}%` }}
          />
          <div
            className="bg-primary-fixed-dim h-full transition-all duration-500"
            style={{ width: `${pA}%` }}
          />
        </div>
      </div>
    </section>
  );
}

export function TopOutcome({ match, top }: Pick<Props, 'match' | 'top'>) {
  return (
    <section className="rounded-xl bg-secondary-container text-on-secondary-container p-3.5 lg:p-5 shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-container-lowest/80 flex items-center justify-center text-secondary shadow-sm">
          <Icon name="stars" filled className="text-[20px]" />
        </div>
        <div>
          <span className="font-label-sm text-[11px] block opacity-90 font-medium">Placar Mais Provável</span>
          <span className="font-headline-md text-[24px] tracking-tight leading-none font-bold">
            {score(top.home, top.away)}
          </span>
        </div>
      </div>
      <div className="text-right">
        <span className="px-2.5 py-1 rounded-full bg-surface-container-lowest/90 text-secondary font-tabular-stat text-[16px] font-bold leading-none inline-block">
          {pct(top.p)}
        </span>
        <span className="block font-label-sm text-[11px] mt-1 opacity-80">
          {count(match.iterations)} simulações
        </span>
      </div>
    </section>
  );
}
