import { pct, score } from '../../lib/format';
import { topCell } from '../../lib/matrix';
import { teamOf, type TeamIndex } from '../../lib/teams';
import type { Match } from '../../types/schema';

interface MatchCarouselProps {
  matches: readonly Match[];
  teams: TeamIndex;
  selectedId: string;
  onSelect: (id: string) => void;
}

export function MatchCarousel({ matches, teams, selectedId, onSelect }: MatchCarouselProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto py-1 -mx-gutter-mobile px-gutter-mobile lg:mx-0 lg:px-0 lg:flex-wrap"
      role="tablist"
      aria-label="Jogos da rodada"
    >
      {matches.map((m) => {
        const active = m.id === selectedId;
        const a = teamOf(teams, m.home.code);
        const b = teamOf(teams, m.away.code);
        const top = topCell(m.matrix);
        return (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={`${a.name} × ${b.name}`}
            onClick={() => onSelect(m.id)}
            className={`flex-shrink-0 p-3 rounded-xl shadow-sm transition-all duration-200 flex flex-col gap-1.5 text-left w-[164px] ${
              active
                ? 'bg-primary text-on-primary ring-2 ring-primary'
                : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
            }`}
          >
            <div
              className="flex items-center justify-between gap-1.5 font-label-md text-[13px]"
              title={`${a.name} × ${b.name}`}
            >
              <span className="text-sm">{a.flag}</span>
              <span className="font-semibold tracking-wide">
                {a.code} × {b.code}
              </span>
              <span className="text-sm">{b.flag}</span>
            </div>
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span
                className={`text-[10px] uppercase font-bold tracking-wider ${active ? 'opacity-80' : 'text-on-surface-variant'}`}
              >
                Provável
              </span>
              {top && (
                <span
                  className={`px-2 py-0.5 rounded-full font-semibold font-tabular-stat text-[11px] leading-none ${
                    active ? 'bg-surface-container-lowest/20' : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  {score(top.home, top.away)} ({pct(top.p)})
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
