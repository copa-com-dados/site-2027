/** Typed read API over Firestore. The UI only talks to these functions. */
import {
  HomeContentSchema,
  MatchSchema,
  MatchupSchema,
  MethodologyContentSchema,
  PersonSchema,
  ModelMetaSchema,
  PredictionsContentSchema,
  SimulatorContentSchema,
  SiteContentSchema,
  TeamSchema,
  type Match,
  type Person,
  type Team,
} from '../types/schema';
import { fetchCollection, fetchDoc, orderBy } from './firestore';

export const api = {
  site: () => fetchDoc(SiteContentSchema, 'content', 'site'),
  home: () => fetchDoc(HomeContentSchema, 'content', 'home'),
  predictions: () => fetchDoc(PredictionsContentSchema, 'content', 'predictions'),
  simulator: () => fetchDoc(SimulatorContentSchema, 'content', 'simulator'),
  methodology: () => fetchDoc(MethodologyContentSchema, 'content', 'methodology'),
  modelMeta: () => fetchDoc(ModelMetaSchema, 'meta', 'model'),

  teams: async (): Promise<Team[]> => fetchCollection(TeamSchema, 'teams', orderBy('rank')),
  matches: async (): Promise<Match[]> => fetchCollection(MatchSchema, 'matches', orderBy('order')),
  matchup: (home: string, away: string) => fetchDoc(MatchupSchema, 'matchups', `${home}_${away}`),
  /** Visible people, ordered. Filtering is client-side to avoid a composite index. */
  people: async (): Promise<Person[]> =>
    (await fetchCollection(PersonSchema, 'people', orderBy('order'))).filter((p) => p.visible),
};

export type Api = typeof api;
