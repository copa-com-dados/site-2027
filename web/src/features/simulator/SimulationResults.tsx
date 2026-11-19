import { forwardRef, useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { count, pct, score } from '../../lib/format';
import { MATRIX_SIZE, heat, heatLegend, rankCells, toGrid } from '../../lib/matrix';
import type { Matchup, Team } from '../../types/schema';

interface Props {
  result: Matchup;
  home: Team;
  away: Team;
}

/** Deterministic pseudo-random number in [0, 1) for a given seed (keeps render pure). */
const noise = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * While a run is in progress, the estimates wander and converge to the model's
 * numbers, like a Monte Carlo estimate as the number of simulated games grows.
 */
function liveProbs(final: Matchup['probs'], progress: number, runId: number) {
  if (progress >= 1) return final;
  const step = Math.floor(progress * 22); // new estimate ~every 70ms
  const spread = 0.45 * Math.pow(1 - progress, 1.3);
  const raw = [final.home, final.draw, final.away].map((p, i) =>
    Math.max(0.02, p + (noise(runId * 97 + step * 7 + i) - 0.5) * spread),
  );
  const sum = raw[0]! + raw[1]! + raw[2]!;
  return { home: raw[0]! / sum, draw: raw[1]! / sum, away: raw[2]! / sum };
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

interface OutcomeProps extends Props {
  /** 0..1 while the simulation animation runs, 1 when done. */
  progress: number;
  runId: number;
}

export const OutcomeCard = forwardRef<HTMLDivElement, OutcomeProps>(function OutcomeCard(
  { result, home, away, progress, runId },
  ref,
) {
  const running = progress < 1;
  const probs = liveProbs(result.probs, progress, runId);
  const games = Math.round(easeInOut(progress) * result.iterations);
  const bar = running ? '' : 'transition-all duration-500';
  return (
    <div
      ref={ref}
      className={`bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-sm transition-shadow duration-300 ${
        running ? 'ring-2 ring-primary/30 shadow-md' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="block font-label-md text-[13px] font-semibold text-on-surface">
          {running ? 'Simulando jogos…' : 'Probabilidade de desfecho'}
        </span>
        <span
          className={`flex items-center gap-1.5 font-tabular-stat text-[11px] ${running ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}
        >
          <span
            className={`text-[13px] leading-none inline-block ${running ? 'animate-spin' : ''}`}
            aria-hidden
          >
            ⚽
          </span>
          {count(running ? games : result.iterations)} jogos
        </span>
      </div>
      <div className="h-4 w-full rounded-full overflow-hidden flex bg-surface-container">
        <div className={`h-full bg-primary ${bar}`} style={{ width: pct(probs.home) }} />
        <div className={`h-full bg-surface-variant ${bar}`} style={{ width: pct(probs.draw) }} />
        <div className={`h-full bg-tertiary-container ${bar}`} style={{ width: pct(probs.away) }} />
      </div>
      {running && (
        <div className="h-0.5 w-full rounded-full bg-surface-container overflow-hidden" aria-hidden>
          <div className="h-full bg-primary/60" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
      <div className="grid grid-cols-3 gap-1 pt-1 text-center">
        <div className="flex flex-col items-center">
          <span className="font-label-sm text-[11px] text-primary flex items-center gap-1 font-semibold">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="truncate max-w-[70px] lg:max-w-[120px]">{home.name}</span>
          </span>
          <span
            key={`h${running}`}
            className={`font-tabular-stat text-[18px] font-bold ${running ? 'text-on-surface-variant' : 'text-on-surface animate-popIn'}`}
          >
            {pct(probs.home)}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-label-sm text-[11px] text-on-surface-variant flex items-center gap-1 font-medium">
            <span className="w-2 h-2 rounded-full bg-outline-variant" />
            Empate
          </span>
          <span
            key={`d${running}`}
            className={`font-tabular-stat text-[18px] font-bold ${running ? 'text-on-surface-variant' : 'text-on-surface animate-popIn'}`}
          >
            {pct(probs.draw)}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-label-sm text-[11px] text-tertiary-container flex items-center gap-1 font-semibold">
            <span className="w-2 h-2 rounded-full bg-tertiary-container" />
            <span className="truncate max-w-[70px] lg:max-w-[120px]">{away.name}</span>
          </span>
          <span
            key={`a${running}`}
            className={`font-tabular-stat text-[18px] font-bold ${running ? 'text-on-surface-variant' : 'text-on-surface animate-popIn'}`}
          >
            {pct(probs.away)}
          </span>
        </div>
      </div>
    </div>
  );
});

export function TopScores({ result }: Pick<Props, 'result'>) {
  return (
    <div className="space-y-space-xs">
      <div className="flex items-center justify-between px-1">
        <span className="font-title-md text-[16px] font-semibold text-on-surface">
          Placares mais prováveis
        </span>
        <span className="font-label-sm text-[11px] text-on-surface-variant">
          Top {result.topScores.length} cenários
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {result.topScores.map((top, idx) => (
          <div
            key={`${top.home}-${top.away}`}
            style={{ animationDelay: `${idx * 110}ms` }}
            className="bg-surface-container-lowest rounded-xl p-space-sm flex flex-col items-center justify-center shadow-sm relative overflow-hidden animate-popIn"
          >
            <div
              className={`absolute top-0 right-0 px-1.5 py-0.5 rounded-bl-md font-label-sm text-[9px] font-bold ${
                idx === 0 ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              {idx + 1}º
            </div>
            <span
              className={`font-tabular-stat text-[18px] font-bold tracking-tight ${idx === 0 ? 'text-primary' : 'text-on-surface'}`}
            >
              {score(top.home, top.away)}
            </span>
            <span className="font-label-md text-[13px] text-on-surface font-semibold mt-0.5">
              {pct(top.p)}
            </span>
            <span className="font-label-sm text-[10px] text-on-surface-variant mt-0.5 text-center">
              {top.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const goalLabel = (g: number) => (g === MATRIX_SIZE - 1 ? `${g}+` : String(g));

export function MiniMatrix({ result, home, away }: Props) {
  const [open, setOpen] = useState(true);
  const grid = toGrid(result.matrix);
  const ranked = rankCells(result.matrix);
  const max = ranked[0]?.p ?? 0;
  const goals = Array.from({ length: MATRIX_SIZE }, (_, i) => i);

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col space-y-space-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center justify-between cursor-pointer select-none text-left w-full"
      >
        <div className="flex items-center gap-2">
          <Icon name="grid_on" className="text-primary text-[20px]" />
          <div>
            <span className="font-title-md text-[16px] font-semibold text-on-surface block leading-tight">
              Matriz de Gols 5×5
            </span>
            <span className="font-label-sm text-[11px] text-on-surface-variant">
              Mapa de calor Poisson (0 a 4+ gols)
            </span>
          </div>
        </div>
        <span className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant">
          <Icon
            name="expand_less"
            className={`text-[18px] transition-transform duration-300 ${open ? 'rotate-0' : 'rotate-180'}`}
          />
        </span>
      </button>

      {open && (
        <div className="overflow-x-auto pt-1 transition-all">
          <div className="min-w-[280px]">
            <div className="text-center font-label-sm text-[11px] text-on-surface-variant pb-1 flex items-center justify-center gap-1 font-medium">
              <span>
                Gols: {away.name} {away.flag}
              </span>
              <Icon name="arrow_forward" className="text-[14px]" />
            </div>

            <div className="grid grid-cols-6 gap-1 text-center font-label-sm text-[11px]">
              <div className="h-7 flex items-center justify-center text-[10px] text-on-surface-variant font-bold">
                {home.code} ↓
              </div>
              {goals.map((g) => (
                <div
                  key={`h${g}`}
                  className="h-7 flex items-center justify-center rounded bg-surface-container-low font-bold text-on-surface"
                >
                  {goalLabel(g)}
                </div>
              ))}
              {grid.map((row, h) => [
                <div
                  key={`r${h}`}
                  className="h-8 flex items-center justify-center rounded bg-surface-container-low font-bold text-on-surface"
                >
                  {goalLabel(h)}
                </div>,
                ...row.map((cell) => {
                  const c = heat(cell.p, max, 'blue');
                  return (
                    <div
                      key={`${h}-${cell.away}`}
                      title={`${goalLabel(h)} × ${goalLabel(cell.away)}: ${pct(cell.p)}`}
                      style={{
                        backgroundColor: c.backgroundColor,
                        color: c.color,
                        animationDelay: `${(h + cell.away) * 35}ms`, // diagonal wave
                      }}
                      className={`h-8 flex items-center justify-center rounded animate-popIn ${c.strong ? 'font-bold' : 'font-medium'}`}
                    >
                      {pct(cell.p)}
                    </div>
                  );
                }),
              ])}
            </div>

            <div className="flex items-center justify-between mt-3 text-[11px] text-on-surface-variant font-label-sm">
              <span>Mais improvável</span>
              <span className="w-24 h-2.5 rounded-full" style={{ backgroundImage: heatLegend('blue') }} />
              <span>Mais provável</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
