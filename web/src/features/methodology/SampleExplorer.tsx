import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import type { MethodologyContent, OutcomeProbs } from '../../types/schema';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Didactic demo: draws a random 1.000-iteration "sample" between two fictitious
 * teams in the browser. Intentionally client-side — it illustrates sampling
 * noise, not a model prediction.
 */
function randomSample(): OutcomeProbs {
  const home = clamp(48 + Math.random() * 14, 15, 80) / 100;
  const draw = clamp(18 + Math.random() * 10, 10, 45) / 100;
  return { home, draw, away: 1 - home - draw };
}

export function SampleExplorer({ explorer }: { explorer: MethodologyContent['explorer'] }) {
  const [sample, setSample] = useState<OutcomeProbs>(explorer.default);
  const [busy, setBusy] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const f = (p: number) => (p * 100).toFixed(1);

  const resimulate = () => {
    setBusy(true);
    timer.current = window.setTimeout(() => {
      setSample(randomSample());
      setBusy(false);
    }, 300);
  };

  return (
    <section className="bg-surface-container-low rounded-xl p-space-md shadow-sm">
      <div className="flex items-center justify-between mb-space-xs">
        <span className="font-title-md text-[16px] font-semibold text-on-surface">{explorer.title}</span>
        <Icon name="casino" className="text-primary text-[20px]" />
      </div>
      <p className="font-body-sm text-[13px] text-on-surface-variant">{explorer.body}</p>

      <div className="mt-space-md bg-surface-container-lowest rounded-lg p-space-sm flex flex-col gap-2" aria-live="polite">
        <div className="flex items-center justify-between text-[13px]">
          <span className="font-medium text-on-surface">Vitória Mandante</span>
          <span className="font-tabular-stat text-[16px] text-primary font-bold">{f(sample.home)}%</span>
        </div>
        <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden flex">
          <div className="bg-primary h-full transition-all duration-500" style={{ width: `${f(sample.home)}%` }} />
          <div className="bg-outline-variant h-full transition-all duration-500" style={{ width: `${f(sample.draw)}%` }} />
          <div className="bg-secondary h-full transition-all duration-500" style={{ width: `${f(sample.away)}%` }} />
        </div>
        <div className="flex justify-between font-label-sm text-[11px] text-outline">
          <span>
            Empate: <b className="text-on-surface">{f(sample.draw)}%</b>
          </span>
          <span>
            Vitória Visitante: <b className="text-on-surface">{f(sample.away)}%</b>
          </span>
        </div>
      </div>

      <button
        onClick={resimulate}
        disabled={busy}
        className="mt-space-md w-full py-2.5 px-space-md bg-primary hover:bg-primary-container text-on-primary rounded-full font-label-md text-[13px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm"
        type="button"
      >
        <Icon name="replay" className={`text-[18px] ${busy ? 'animate-spin' : ''}`} />
        <span>{busy ? 'Processando Amostra...' : explorer.button}</span>
      </button>
    </section>
  );
}
