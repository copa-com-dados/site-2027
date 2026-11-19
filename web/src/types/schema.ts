/**
 * Firestore data contract (schemaVersion 1). Mirrors model/schema.py and
 * docs/DATA_CONTRACT.md. Every document read by the app is parsed with these
 * schemas, so malformed data surfaces as a clear error state instead of a crash.
 */
import { z } from 'zod';

const prob = z.number().min(0).max(1);
const text = z.string().min(1);

export const ScoreCellSchema = z.object({
  home: z.number().int().min(0),
  away: z.number().int().min(0),
  p: prob,
});

export const OutcomeProbsSchema = z.object({ home: prob, draw: prob, away: prob });

export const TeamSchema = z.object({
  code: z.string().regex(/^[A-Z]{3}$/),
  name: text,
  shortName: text,
  flag: text,
  group: text,
  isHost: z.boolean(),
  rank: z.number().int().min(1),
  titleProb: prob,
  rating: z.object({ off: z.number(), def: z.number() }),
});

/** Firestore Timestamp (or anything with toDate()) → Date. */
const timestamp = z
  .custom<{ toDate: () => Date }>((v) => typeof (v as { toDate?: unknown })?.toDate === 'function')
  .transform((v) => v.toDate());

const MatchSideSchema = z.object({ code: z.string(), role: text });

export const MatchSchema = z.object({
  order: z.number(),
  /** Key into meta/model.rounds. */
  round: z.number().int().min(1),
  stageLabel: text,
  kickoff: z.string().nullable().optional(),
  home: MatchSideSchema,
  away: MatchSideSchema,
  iterations: z.number().int().positive(),
  probs: OutcomeProbsSchema,
  matrix: z.array(ScoreCellSchema).length(25),
});

export const MatchupSchema = z.object({
  home: z.string(),
  away: z.string(),
  iterations: z.number().int().positive(),
  probs: OutcomeProbsSchema,
  matrix: z.array(ScoreCellSchema).length(25),
  topScores: z
    .array(ScoreCellSchema.extend({ label: text }))
    .min(1)
    .max(3),
});

export const RoundSchema = z.object({
  round: z.number().int().min(1),
  label: text,
  stage: text,
});

export const ModelMetaSchema = z.object({
  version: text,
  source: z.enum(['fake', 'model']),
  runNumber: z.number().int(),
  iterations: z.number().int().positive(),
  /** Full tournament calendar; rounds without matches are shown as "em breve". */
  rounds: z.array(RoundSchema).min(1),
  /** Round the "Previsões" page opens on (and where the featured match comes from). */
  currentRound: z.number().int(),
  updatedAt: timestamp.optional(),
});

export const SiteContentSchema = z.object({
  competitionLabel: text,
  footer: z.object({ line1: text, line2: z.string().optional() }),
});

export const HomeContentSchema = z.object({
  title: text,
  subtitle: text,
  video: z.object({
    youtubeId: z.string().regex(/^[\w-]{6,20}$/),
    duration: text,
    title: text,
    subtitle: text,
  }),
  featuredTitle: text,
  /** Optional editorial override; by default the featured match is picked automatically. */
  featuredMatchId: z.string().nullable().optional(),
  favoritesTitle: text,
  funFact: z.object({ title: text, body: text }),
});

export const PredictionsContentSchema = z.object({ heading: text });

export const SimulatorContentSchema = z.object({
  title: text,
  subtitle: text,
  defaultHome: text,
  defaultAway: text,
});

export const MethodologyContentSchema = z.object({
  title: text,
  intro: text,
  pipeline: z.object({
    title: text,
    caption: text,
    rho: z.number(),
    bars: z.array(z.object({ label: text, height: prob, highlight: z.boolean() })).min(1),
  }),
  steps: z
    .array(
      z.object({
        label: text,
        variant: z.enum(['data', 'model', 'simulation']),
        icon: text,
        title: text,
        body: text,
        footIcon: text,
        footnote: text,
      }),
    )
    .min(1),
  explorer: z.object({ title: text, body: text, button: text, default: OutcomeProbsSchema }),
  team: z.object({ title: text, subtitle: text, studentsTitle: text }),
  repo: z.object({ url: z.string().url(), title: text, subtitle: text }),
  ethics: z.object({ title: text, body: text }),
});

export const PERSON_KINDS = ['coordinator', 'student'] as const;

/**
 * People shown in "Quem faz o projeto" (collection `people`, edited in /admin).
 * `photo` is a small JPEG data URL produced by the admin page, or an https URL.
 */
export const PersonSchema = z.object({
  name: text.max(80),
  kind: z.enum(PERSON_KINDS),
  title: z.string().max(120).default(''),
  subtitle: z.string().max(160).default(''),
  tag: z.string().max(40).default(''),
  photo: z.string().default(''),
  order: z.number().default(0),
  visible: z.boolean().default(true),
});

export type ScoreCell = z.infer<typeof ScoreCellSchema>;
export type OutcomeProbs = z.infer<typeof OutcomeProbsSchema>;
export type Team = z.infer<typeof TeamSchema>;
export type Match = z.infer<typeof MatchSchema> & { id: string };
export type Matchup = z.infer<typeof MatchupSchema>;
export type Round = z.infer<typeof RoundSchema>;
export type ModelMeta = z.infer<typeof ModelMetaSchema>;
export type SiteContent = z.infer<typeof SiteContentSchema>;
export type HomeContent = z.infer<typeof HomeContentSchema>;
export type PredictionsContent = z.infer<typeof PredictionsContentSchema>;
export type SimulatorContent = z.infer<typeof SimulatorContentSchema>;
export type MethodologyContent = z.infer<typeof MethodologyContentSchema>;
export type Person = z.infer<typeof PersonSchema> & { id: string };
export type PersonInput = z.input<typeof PersonSchema>;
