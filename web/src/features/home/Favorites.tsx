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
  const ranked = [...teams].sort((a, b) => b.titleProb - a.titleProb);
  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);
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
              <span className="font-title-md text-[15px] font-semibold text-on-surface">
                {team.shortName}
              </span>
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

      {rest.length > 0 && (
        <ol
          start={4}
          aria-label="Demais seleções"
          className="bg-surface-container-lowest rounded-xl shadow-sm p-1.5 columns-2 gap-x-2 [column-rule:1px_solid_theme(colors.surface-container)]"
        >
          {rest.map((team, i) => (
            <li
              key={team.code}
              title={team.name}
              className={`break-inside-avoid flex items-center gap-1 px-1 py-1.5 rounded-lg font-label-sm text-[12px] ${
                team.isHost ? 'bg-secondary-container/50 font-semibold' : ''
              }`}
            >
              <span className="w-5 shrink-0 text-right text-[10px] text-on-surface-variant font-tabular-stat">
                {i + 4}º
              </span>
              <span className="text-[14px] leading-none">{team.flag}</span>
              <span className="truncate text-on-surface">{team.shortName}</span>
              <span className="ml-auto pl-1 shrink-0 text-[11px] font-tabular-stat text-on-surface-variant">
                {team.titleProb < 0.001 ? '<0.1%' : pct(team.titleProb)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
