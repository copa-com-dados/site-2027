import { SectionHeader } from '../../components/ui/SectionHeader';
import { pct } from '../../lib/format';
import type { HomeContent, Team } from '../../types/schema';

const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' });

interface FavoritesProps {
  content: HomeContent;
  teams: readonly Team[];
  /** When the model last published numbers (meta/model.updatedAt). */
  updatedAt?: Date;
}

export function Favorites({ content, teams, updatedAt }: FavoritesProps) {
  const top3 = [...teams].sort((a, b) => b.titleProb - a.titleProb).slice(0, 3);
  return (
    <section className="flex flex-col space-y-2.5">
      <SectionHeader
        icon="trophy"
        iconClassName="text-tertiary"
        title={content.favoritesTitle}
        aside={
          updatedAt && (
            <span className="font-label-sm text-[11px] text-on-surface-variant">
              Atualizado em {dateFmt.format(updatedAt).replace('.', '')}
            </span>
          )
        }
      />
      <div className="grid grid-cols-3 gap-2">
        {top3.map((team, i) => {
          const first = i === 0;
          return (
            <div
              key={team.code}
              className="bg-surface-container-lowest rounded-xl p-3 lg:py-4 shadow-sm flex flex-col items-center text-center space-y-1.5"
            >
              <span
                className={`font-label-sm text-[11px] font-bold ${first ? 'text-secondary' : 'text-on-surface-variant'}`}
              >
                {i + 1}º
              </span>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-[20px] shadow-sm ${
                  first ? 'bg-secondary-container' : 'bg-surface-container-high'
                }`}
              >
                {team.flag}
              </div>
              <span className="font-title-md text-[15px] font-semibold text-on-surface">{team.shortName}</span>
              <span
                className={`font-tabular-stat text-[22px] font-bold leading-none ${first ? 'text-secondary' : 'text-on-surface'}`}
              >
                {pct(team.titleProb)}
              </span>
              <span className="font-label-sm text-[10px] text-on-surface-variant">chance de título</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
