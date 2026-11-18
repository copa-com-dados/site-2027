import { useEffect, useRef, useState } from 'react';
import { AsyncView } from '../../components/ui/AsyncView';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { useMatchup, useSimulatorContent, useTeams } from '../../hooks/useData';
import { combine } from '../../hooks/useQuery';
import { count } from '../../lib/format';
import { indexTeams, teamOf } from '../../lib/teams';
import type { SimulatorContent, Team } from '../../types/schema';
import { MiniMatrix, OutcomeCard, TopScores } from './SimulationResults';
import { TeamPicker } from './TeamPicker';

/** Brief visual feedback when the matchup changes (results are usually cached and instant). */
const FEEDBACK_MS = 300;

function Simulator({ content, teams }: { content: SimulatorContent; teams: Team[] }) {
  const index = indexTeams(teams);
  const fallbackHome = index.has(content.defaultHome) ? content.defaultHome : teams[0]!.code;
  const fallbackAway =
    index.has(content.defaultAway) && content.defaultAway !== fallbackHome
      ? content.defaultAway
      : teams.find((t) => t.code !== fallbackHome)!.code;

  const [homeCode, setHomeCode] = useState(fallbackHome);
  const [awayCode, setAwayCode] = useState(fallbackAway);
  const [changing, setChanging] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const result = useMatchup(homeCode, awayCode);
  const home = teamOf(index, homeCode);
  const away = teamOf(index, awayCode);

  const flash = () => {
    window.clearTimeout(timer.current);
    setChanging(true);
    timer.current = window.setTimeout(() => setChanging(false), FEEDBACK_MS);
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
          <p className="font-body-md text-[15px] leading-[24px] text-on-surface-variant">{content.subtitle}</p>
        </div>

        <TeamPicker home={home} away={away} teams={teams} onPick={pick} onSwap={swap} />
        <p className="font-label-sm text-[11px] text-on-surface-variant text-center -mt-1">
          Toque em uma seleção para trocá-la, ou em VS para inverter o mando.
        </p>
      </div>

      <div className="flex flex-col space-y-space-md" aria-live="polite" aria-busy={changing || result.status === 'loading'}>
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
            <div className={`flex flex-col space-y-space-md transition-opacity duration-200 ${changing ? 'opacity-50' : ''}`}>
              <OutcomeCard result={result.data} home={home} away={away} />
              <TopScores result={result.data} />
              <MiniMatrix result={result.data} home={home} away={away} />
            </div>
            <p className="text-center py-2 font-label-sm text-[11px] text-outline">
              Estimativas do modelo a partir de {count(result.data.iterations)} simulações deste confronto.
            </p>
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
          <ErrorState title="Seleções indisponíveis" message="Ainda não há seleções suficientes cadastradas." />
        ) : (
          <Simulator content={content} teams={[...teams].sort((a, b) => a.rank - b.rank)} />
        )
      }
    </AsyncView>
  );
}
