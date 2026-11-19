import { AsyncView } from '../../components/ui/AsyncView';
import { SiteFooter } from '../../components/ui/SiteFooter';
import { YouTubeCard } from '../../components/ui/YouTubeCard';
import { useHomeContent, useMatches, useModelMeta, useSiteContent, useTeams } from '../../hooks/useData';
import { combine } from '../../hooks/useQuery';
import { pickFeatured } from '../../lib/rounds';
import { indexTeams } from '../../lib/teams';
import { Favorites } from './Favorites';
import { FeaturedMatch } from './FeaturedMatch';
import { FunFact } from './FunFact';
import { HomeHero } from './HomeHero';

export default function HomePage() {
  const state = combine(useHomeContent(), useSiteContent(), useModelMeta(), useTeams(), useMatches());

  return (
    <AsyncView state={state}>
      {([content, site, meta, teams, matches]) => {
        // Derived from the model output, so it follows the current round automatically.
        const featured = pickFeatured(meta, matches, teams, content.featuredMatchId);
        return (
          <div className="flex flex-col w-full pb-6 space-y-5 lg:space-y-8">
            <HomeHero content={content} />

            <div className="flex flex-col space-y-5 lg:grid lg:grid-cols-[1.15fr_1fr] lg:gap-8 lg:space-y-0 lg:items-start">
              <div className="flex flex-col space-y-5 lg:space-y-6">
                <section className="flex flex-col">
                  <YouTubeCard video={content.video} />
                </section>
                {featured && <FeaturedMatch content={content} match={featured} teams={indexTeams(teams)} />}
              </div>
              <div className="flex flex-col space-y-5 lg:space-y-6">
                <Favorites content={content} teams={teams} updatedAt={meta.updatedAt} />
                <FunFact fact={content.funFact} />
              </div>
            </div>

            <SiteFooter site={site} />
          </div>
        );
      }}
    </AsyncView>
  );
}
