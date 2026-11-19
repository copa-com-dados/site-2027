import { api } from '../services/api';
import { useQuery } from './useQuery';

export const useSiteContent = () => useQuery('content:site', api.site);
export const useHomeContent = () => useQuery('content:home', api.home);
export const usePredictionsContent = () => useQuery('content:predictions', api.predictions);
export const useSimulatorContent = () => useQuery('content:simulator', api.simulator);
export const useMethodologyContent = () => useQuery('content:methodology', api.methodology);
export const useModelMeta = () => useQuery('meta:model', api.modelMeta);
export const useTeams = () => useQuery('teams', api.teams);
export const useMatches = () => useQuery('matches', api.matches);
export const useMatchup = (home: string, away: string, enabled = true) =>
  useQuery(`matchup:${home}_${away}`, () => api.matchup(home, away), { enabled: enabled && home !== away });
export const usePeople = () => useQuery('people', api.people);
