import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { count, pct, pctInt, roundTo100, score } from '../../lib/format';
import { rankCells } from '../../lib/matrix';
import { teamOf, type TeamIndex } from '../../lib/teams';
import type { HomeContent, Match } from '../../types/schema';

interface FeaturedMatchProps {
  content: HomeContent;
  match: Match;
  teams: TeamIndex;
}

export function FeaturedMatch({ content, match, teams }: FeaturedMatchProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const home = teamOf(teams, match.home.code);
  const away = teamOf(teams, match.away.code);
  const [pH, pD, pA] = roundTo100([match.probs.home, match.probs.draw, match.probs.away]);
  const ranked = rankCells(match.matrix);
  const top = ranked[0]!;
  // Most likely score in the middle, runner-ups on each side (as in the design).
  const quick = [ranked[1], ranked[0], ranked[2]].filter(Boolean) as typeof ranked;

  return (
    <section className="flex flex-col space-y-2.5">
      <SectionHeader
        icon="verified"
        title={content.featuredTitle}
        aside={<span className="font-label-sm text-[11px] text-on-surface-variant">{match.stageLabel}</span>}
      />

      <div className="bg-surface-container-lowest rounded-xl p-4 lg:p-5 shadow-sm flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-title-md text-[16px] shadow-sm">
              {home.flag}
            </div>
            <div className="flex flex-col">
              <span className="font-title-md text-[16px] font-semibold text-on-surface leading-none">
                {home.shortName}
              </span>
              <span
                className={`font-label-sm text-[11px] mt-1 ${home.isHost ? 'text-secondary font-semibold' : 'text-on-surface-variant'}`}
              >
                {home.isHost ? 'Anfitrião' : `Grupo ${home.group}`}
              </span>
            </div>
          </div>
          <span className="font-headline-md text-[24px] text-outline-variant font-light">vs</span>
          <div className="flex items-center gap-2.5 flex-row-reverse text-right">
            <div className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center font-title-md text-[16px] shadow-sm">
              {away.flag}
            </div>
            <div className="flex flex-col">
              <span className="font-title-md text-[16px] font-semibold text-on-surface leading-none">
                {away.shortName}
              </span>
              <span
                className={`font-label-sm text-[11px] mt-1 ${away.isHost ? 'text-secondary font-semibold' : 'text-on-surface-variant'}`}
              >
                {away.isHost ? 'Anfitrião' : `Grupo ${away.group}`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-1.5">
          <div className="flex justify-between font-label-md text-[13px]">
            <span className="text-primary font-bold">
              {home.shortName} {pH}%
            </span>
            <span className="text-on-surface-variant font-medium">Empate {pD}%</span>
            <span className="text-tertiary-container font-bold">
              {away.shortName} {pA}%
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-surface-container overflow-hidden flex shadow-inner">
            <div
              className="h-full bg-primary rounded-l-full transition-all duration-700"
              style={{ width: `${pH}%` }}
              title={`Vitória: ${home.name} (${pH}%)`}
            />
            <div
              className="h-full bg-surface-variant"
              style={{ width: `${pD}%` }}
              title={`Empate (${pD}%)`}
            />
            <div
              className="h-full bg-tertiary-container rounded-r-full transition-all duration-700"
              style={{ width: `${pA}%` }}
              title={`Vitória: ${away.name} (${pA}%)`}
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low">
          <div className="flex items-center gap-2">
            <Icon name="sports_score" className="text-primary text-[20px]" />
            <div className="flex flex-col">
              <span className="font-label-sm text-[11px] text-on-surface-variant">Placar mais cotado</span>
              <span className="font-title-md text-[16px] text-on-surface font-bold">
                {score(top.home, top.away, 'x')}
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface font-label-sm text-[11px] font-semibold">
            {pctInt(top.p)} de chance
          </span>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="w-full py-2.5 px-4 rounded-full bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-[0.99]"
          type="button"
        >
          <span>{open ? 'Ocultar matriz de resultados' : 'Ver matriz rápida de probabilidades'}</span>
          <Icon name={open ? 'expand_less' : 'arrow_forward'} className="text-[18px]" />
        </button>

        {open && (
          <div className="flex flex-col space-y-2 pt-2 animate-fadeIn">
            <p className="font-label-sm text-[11px] text-on-surface-variant leading-relaxed">
              Os placares mais prováveis em {count(match.iterations)} simulações desta partida.
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {quick.map((c) => {
                const isTop = c === top;
                return (
                  <div
                    key={`${c.home}-${c.away}`}
                    className={`p-2 rounded-lg ${isTop ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-surface-container-low'}`}
                  >
                    <span
                      className={`font-label-sm text-[11px] block ${isTop ? 'font-semibold' : 'text-on-surface-variant'}`}
                    >
                      {score(c.home, c.away, 'x')}
                    </span>
                    <span
                      className={`font-tabular-stat text-[16px] font-bold ${isTop ? '' : 'text-on-surface'}`}
                    >
                      {pct(c.p)}
                    </span>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => navigate(`/previsoes?jogo=${encodeURIComponent(match.id)}`)}
              className="mt-2 text-primary text-center font-label-sm text-[12px] font-semibold underline block"
            >
              Abrir matriz 5x5 completa de {home.shortName} × {away.shortName} &rarr;
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
