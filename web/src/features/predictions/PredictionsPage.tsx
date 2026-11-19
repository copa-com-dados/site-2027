import { useSearchParams } from 'react-router-dom';
import { AsyncView } from '../../components/ui/AsyncView';
import { ErrorState } from '../../components/ui/ErrorState';
import {
  useMatches,
  useModelMeta,
  usePredictionsContent,
  useSiteContent,
  useTeams,
} from '../../hooks/useData';
import { combine } from '../../hooks/useQuery';
import { topCell } from '../../lib/matrix';
import { pickRound, roundViews } from '../../lib/rounds';
import { indexTeams, teamOf } from '../../lib/teams';
import { MatchCard, TopOutcome } from './MatchSummary';
import { MatchCarousel } from './MatchCarousel';
import { RoundPicker } from './RoundPicker';
import { ScoreMatrix } from './ScoreMatrix';

export default function PredictionsPage() {
  const [params, setParams] = useSearchParams();
  const state = combine(usePredictionsContent(), useSiteContent(), useMatches(), useTeams(), useModelMeta());

  return (
    <AsyncView state={state}>
      {([content, site, matches, teamList, meta]) => {
        const rounds = roundViews(meta, matches);
        const requested = Number(params.get('rodada')) || undefined;
        const round = pickRound(rounds, meta.currentRound, requested, params.get('jogo'));
        if (!round) {
          return (
            <ErrorState
              title="Nenhum jogo publicado ainda"
              message="As previsões aparecerão aqui em breve."
            />
          );
        }
        const teams = indexTeams(teamList);
        const active = round.matches.find((m) => m.id === params.get('jogo')) ?? round.matches[0]!;
        const home = teamOf(teams, active.home.code);
        const away = teamOf(teams, active.away.code);
        const top = topCell(active.matrix)!;

        return (
          <div className="flex flex-col w-full pb-6 space-y-4 lg:space-y-6">
            <section className="flex flex-col gap-2 pt-1">
              <div>
                <div>
                  <span className="font-label-sm text-[11px] text-secondary uppercase font-bold tracking-wider">
                    {site.competitionLabel}
                  </span>
                  <h2 className="font-headline-md text-[24px] lg:text-[36px] text-on-surface leading-tight font-medium">
                    {content.heading}
                  </h2>
                </div>
              </div>

              <RoundPicker
                rounds={rounds}
                selected={round}
                onSelect={(r) => setParams({ rodada: String(r) }, { replace: true })}
              />

              <MatchCarousel
                matches={round.matches}
                teams={teams}
                selectedId={active.id}
                onSelect={(id) => setParams({ rodada: String(round.round), jogo: id }, { replace: true })}
              />
            </section>

            <div className="flex flex-col space-y-4 lg:grid lg:grid-cols-[1fr_1.25fr] lg:gap-6 lg:space-y-0 lg:items-start">
              <div className="flex flex-col space-y-4">
                <MatchCard match={active} home={home} away={away} />
                <TopOutcome match={active} top={top} />
              </div>
              {/* key resets the selected cell when the match changes */}
              <ScoreMatrix key={active.id} match={active} home={home} away={away} />
            </div>
          </div>
        );
      }}
    </AsyncView>
  );
}
