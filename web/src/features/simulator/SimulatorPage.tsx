import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { AsyncView } from '../../components/ui/AsyncView';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { useMatchup, useSimulatorContent, useTeams } from '../../hooks/useData';
import { combine } from '../../hooks/useQuery';
import { count } from '../../lib/format';
import { burstFrom, launchGoals, prefersReducedMotion } from '../../lib/goalFx';
import { indexTeams, teamOf } from '../../lib/teams';
import type { SimulatorContent, Team } from '../../types/schema';
import { MiniMatrix, OutcomeCard, TopScores } from './SimulationResults';
import { TeamPicker } from './TeamPicker';

/** Length of the "simulating" animation. The numbers are precomputed; this is pure theatre. */
const RUN_MS = 1700;

function Simulator({ content, teams }: { content: SimulatorContent; teams: Team[] }) {
  const index = indexTeams(teams);
  const fallbackHome = index.has(content.defaultHome) ? content.defaultHome : teams[0]!.code;
  const fallbackAway =
    index.has(content.defaultAway) && content.defaultAway !== fallbackHome
      ? content.defaultAway
      : teams.find((t) => t.code !== fallbackHome)!.code;

  const [homeCode, setHomeCode] = useState(fallbackHome);
  const [awayCode, setAwayCode] = useState(fallbackAway);
  // Every matchup change (and the first visit) plays a short "simulation" run.
  const [runId, setRunId] = useState(1);
  const [progress, setProgress] = useState(() => (prefersReducedMotion() ? 1 : 0));
  const outcomeRef = useRef<HTMLDivElement>(null);

  const result = useMatchup(homeCode, awayCode);
  const home = teamOf(index, homeCode);
  const away = teamOf(index, awayCode);
  const ready = result.status === 'success';
  const probsRef = useRef(result.data?.probs);
  probsRef.current = result.data?.probs;

  useEffect(() => {
    if (!ready || prefersReducedMotion()) return;
    const stopBalls = launchGoals(probsRef.current!, RUN_MS);
    const start = performance.now();
    let raf = requestAnimationFrame(function step(now) {
      const p = Math.min(1, (now - start) / RUN_MS);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(step);
      else burstFrom(outcomeRef.current);
    });
    return () => {
      cancelAnimationFrame(raf);
      stopBalls();
    };
  }, [runId, ready]);

  const flash = () => {
    setRunId((r) => r + 1);
    if (!prefersReducedMotion()) setProgress(0);
  };
  const swap = () => {
    setHomeCode(awayCode);
    setAwayCode(homeCode);
    flash();
  };
  // Picking the team already on the other side swaps them, so a team never plays itself.
  const pick = (side: 'home' | 'away', code: string) => {
    if (code === (side === 'home' ? awayCode : homeCode)) return swap();
    if (side === 'home') setHomeCode(code);
    else setAwayCode(code);
    flash();
  };

  return (
    <div className="flex flex-col w-full pb-6 space-y-space-md lg:grid lg:grid-cols-[1fr_1.15fr] lg:gap-8 lg:space-y-0 lg:items-start">
      <div className="flex flex-col space-y-space-md lg:sticky lg:top-24">
        <div className="flex flex-col space-y-space-xs mt-space-xs">
          <h1 className="font-headline-xl-mobile text-[28px] leading-[36px] lg:text-[40px] lg:leading-[48px] text-on-surface font-normal">
            {content.title}
          </h1>
          <p className="font-body-md text-[15px] leading-[24px] text-on-surface-variant">
            {content.subtitle}
          </p>
        </div>

        <TeamPicker home={home} away={away} teams={teams} onPick={pick} onSwap={swap} />
        <p className="font-label-sm text-[11px] text-on-surface-variant text-center -mt-1">
          Toque em uma seleção para trocá-la, ou em VS para inverter o mando.
        </p>
      </div>

      <div
        className="flex flex-col space-y-space-md"
        aria-live="polite"
        aria-busy={progress < 1 || result.status === 'loading'}
      >
        {result.status === 'error' ? (
          <ErrorState
            title="Confronto ainda não simulado"
            message={`Ainda não temos a simulação de ${home.name} × ${away.name}. Tente outro confronto.`}
          />
        ) : result.status === 'loading' ? (
          <>
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-72" />
          </>
        ) : (
          <>
            <div className="flex flex-col space-y-space-md">
              <OutcomeCard
                ref={outcomeRef}
                result={result.data}
                home={home}
                away={away}
                progress={progress}
                runId={runId}
              />
              {/* Remounted when a run ends so the results pop in again. */}
              <div
                key={progress < 1 ? 'running' : `done-${runId}`}
                className={`flex flex-col space-y-space-md transition-all duration-300 ${
                  progress < 1 ? 'opacity-25 blur-[3px] pointer-events-none select-none' : ''
                }`}
              >
                <TopScores result={result.data} />
                <MiniMatrix result={result.data} home={home} away={away} />
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 py-2">
              <button
                type="button"
                onClick={flash}
                disabled={progress < 1}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface-container-lowest shadow-sm text-primary font-label-md text-[13px] font-semibold hover:bg-surface-container-low transition-all active:scale-95 disabled:opacity-50"
              >
                <Icon name="replay" className="text-[18px]" />
                Simular de novo
              </button>
              <p className="text-center font-label-sm text-[11px] text-outline">
                Estimativas do modelo a partir de {count(result.data.iterations)} simulações deste confronto.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SimulatorPage() {
  const state = combine(useSimulatorContent(), useTeams());
  return (
    <AsyncView state={state}>
      {([content, teams]) =>
        teams.length < 2 ? (
          <ErrorState
            title="Seleções indisponíveis"
            message="Ainda não há seleções suficientes cadastradas."
          />
        ) : (
          <Simulator content={content} teams={[...teams].sort((a, b) => a.rank - b.rank)} />
        )
      }
    </AsyncView>
  );
}
