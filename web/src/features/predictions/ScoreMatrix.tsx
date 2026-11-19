import { useState } from 'react';
import { pct } from '../../lib/format';
import { MATRIX_SIZE, heat, heatLegend, sameCell, toGrid, topCell } from '../../lib/matrix';
import type { Match, ScoreCell, Team } from '../../types/schema';

interface ScoreMatrixProps {
  match: Match;
  home: Team;
  away: Team;
}

const label = (c: ScoreCell) => `${c.home}×${c.away}`;

export function ScoreMatrix({ match, home, away }: ScoreMatrixProps) {
  const [selected, setSelected] = useState<ScoreCell | null>(null);
  const grid = toGrid(match.matrix);
  const top = topCell(match.matrix);
  // Scale the rest against the runner-up, so the top cell (drawn in green) doesn't flatten the gradient.
  const restMax = Math.max(0, ...match.matrix.filter((c) => !sameCell(c, top)).map((c) => c.p));
  const goals = Array.from({ length: MATRIX_SIZE }, (_, i) => i);

  return (
    <section className="rounded-xl bg-surface-container-lowest p-3.5 lg:p-5 shadow-sm flex flex-col space-y-2.5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-title-md text-[16px] font-semibold text-on-surface">
            Distribuição de Probabilidades
          </h3>
          <p className="font-label-sm text-[11px] text-on-surface-variant">
            Linhas: {home.shortName} (gols) • Colunas: {away.shortName} (gols)
          </p>
        </div>
        <div className="flex items-center gap-1.5 font-label-sm text-[10px] text-on-surface-variant shrink-0">
          <span>menos</span>
          <span className="w-10 h-2 rounded-full" style={{ backgroundImage: heatLegend('blue') }} />
          <span>mais</span>
          <span className="w-2.5 h-2.5 rounded-sm bg-secondary-container ml-1.5" />
          <span>★ top</span>
        </div>
      </div>

      {selected && (
        <div
          className="p-2 rounded-lg bg-surface-container-high flex items-center justify-between animate-fadeIn text-primary font-label-sm text-[12px]"
          aria-live="polite"
        >
          <span className="font-semibold">Placar selecionado: {label(selected)}</span>
          <span className="font-bold">{pct(selected.p)}</span>
        </div>
      )}

      <div className="w-full" role="grid" aria-label={`Matriz de placares ${home.name} × ${away.name}`}>
        <div className="grid grid-cols-6 gap-1 lg:gap-1.5 mb-1 items-center text-center" role="row">
          <div className="text-on-surface-variant font-label-sm text-[11px] font-bold flex items-center justify-center">
            {home.code}\{away.code}
          </div>
          {goals.map((g) => (
            <div
              key={g}
              className="text-on-surface-variant font-label-sm text-[11px] font-semibold"
              role="columnheader"
            >
              {g}
            </div>
          ))}
        </div>

        <div className="space-y-1 lg:space-y-1.5">
          {grid.map((row, r) => (
            <div key={r} className="grid grid-cols-6 gap-1 lg:gap-1.5 items-center" role="row">
              <div
                className="text-center font-label-sm text-[11px] font-semibold text-on-surface-variant"
                role="rowheader"
              >
                {r}
              </div>
              {row.map((cell) => {
                const isTop = sameCell(cell, top);
                const isSelected = sameCell(cell, selected);
                const h = heat(cell.p, restMax, 'blue');
                return (
                  <button
                    type="button"
                    role="gridcell"
                    aria-selected={isSelected}
                    key={cell.away}
                    onClick={() => setSelected(cell)}
                    style={isTop ? undefined : { backgroundColor: h.backgroundColor, color: h.color }}
                    className={`cursor-pointer rounded-lg p-1 lg:py-2 text-center transition-all active:scale-95 ${
                      isTop ? 'bg-secondary-container text-on-secondary-container' : ''
                    } ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                  >
                    <div className="font-label-sm text-[10px] leading-tight opacity-75">
                      {label(cell)} {isTop ? '★' : ''}
                    </div>
                    <div
                      className={`font-tabular-stat text-[12px] lg:text-[13px] ${isTop ? 'font-bold' : 'font-semibold'}`}
                    >
                      {pct(cell.p)}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
