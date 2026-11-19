# Copa com Dados: data contract (schemaVersion 1)

This document is for the **modeling team**. The website reads everything from Cloud Firestore (project `copa-com-dados`). Write documents in exactly this format and the site picks them up on the next page load, with no frontend deploy needed.

The machine-checkable version of this contract is in two places:

- `model/schema.py`: Python validator. Run `validate_dataset()` before writing.
- `web/src/types/schema.ts`: the zod schemas the frontend uses to parse every document.

If a document doesn't match, the affected screen shows an error card instead of wrong numbers.

## Golden rules

1. **Probabilities are numbers in `[0, 1]`.** Write `0.136`, not `13.6` and not `"13.6%"`. The site formats them.
2. **Score matrices are flat lists of 25 cells**, because Firestore cannot store nested arrays:
   ```json
   [{ "home": 0, "away": 0, "p": 0.072 }, { "home": 0, "away": 1, "p": 0.088 }, ...]
   ```
   `home` and `away` are goal counts from 0 to 4. Order doesn't matter, but every `(home, away)` pair must appear exactly once.
3. **`probs.home + probs.draw + probs.away = 1`** (±0.01).
4. **Team codes are 3 uppercase letters** (`BRA`, `ESP`…). Every code used in `matches` or `matchups` must exist in `teams`.
5. **Writes go through the Admin SDK only.** Browsers have read-only access (`firestore.rules`). Use a batch so the site never shows half an update.
6. **Derived numbers are computed by the site, not stored.** Get the matrix, `probs`, `titleProb` and the rounds right and everything else follows. See [What the site computes by itself](#what-the-site-computes-by-itself).
7. **Every match belongs to a round** (`matches.round`), and the rounds of the tournament are listed in `meta/model.rounds`. See [Rounds](#rounds-rodadas).

## Collections

### `teams/{CODE}`
One document per team. The doc id must equal `code`.

| field | type | notes |
|---|---|---|
| `code` | string | `"BRA"` |
| `name` | string | Full name, used in the simulator: `"Estados Unidos"` |
| `shortName` | string | Compact name for cards: `"EUA"` |
| `flag` | string | Emoji flag: `"🇧🇷"` |
| `group` | string | `"A"` |
| `isHost` | bool | Shows the "Anfitrião" label |
| `rank` | int ≥ 1 | Display order in selectors |
| `titleProb` | number 0–1 | **Model output.** Chance of winning the cup. The home page ranks **all** teams by it (top 3 highlighted, the rest listed below). Should sum to ~1 over all teams |
| `rating` | `{off, def}` | Optional model diagnostics (not displayed) |

### `matches/{slug}`
Fixtures shown on **Previsões** and featured on **Início**. The doc id is a unique lowercase slug, e.g. `bra-fra`. Group-stage pairs never repeat, so `home-away` works. For knockout games prefix the round, e.g. `oitavas-bra-ger`.

| field | type | notes |
|---|---|---|
| `order` | number | Carousel order inside its round (ascending) |
| `round` | int | **Which round this prediction is for.** Must be one of the `round` numbers in `meta/model.rounds` |
| `stageLabel` | string | Short label shown on the match card: `"Grupo A"`, `"Oitavas de final"`… |
| `kickoff` | ISO string \| null | Optional |
| `home` / `away` | `{code, role}` | `role` is a display label (`"Mandante"` / `"Visitante"`) |
| `iterations` | int | Number of simulations behind the numbers (shown as "10.000 simulações") |
| `probs` | `{home, draw, away}` | **Model output.** 1X2 probabilities from the *full* distribution |
| `matrix` | 25 cells | **Model output.** **Exact** score probabilities for 0–4 goals. Mass above 4 goals is dropped, so the cells sum to slightly less than 1 |

### `matchups/{HOME}_{AWAY}`
Head-to-head results for the **Simulador**. The simulator lets visitors pick *any* two teams, so write **every ordered pair** of teams in `teams`. For 32 teams that's 32 × 31 = 992 docs. Doc id example: `BRA_ESP` (home first).

| field | type | notes |
|---|---|---|
| `home`, `away` | string | Team codes (must differ) |
| `iterations` | int | Shown as "10.000 iterações" |
| `probs` | `{home, draw, away}` | **Model output** |
| `matrix` | 25 cells | **Model output.** **Bucketed**: goals 0, 1, 2, 3 and **4+** (row or column 4 aggregates everything ≥ 4). Cells sum to 1 |
| `topScores` | 3 × `{home, away, p, label}` | Top 3 most likely scores, most likely first. `label` is a short caption (`"Maior densidade"`, `"Fator mando"`…) |

### `meta/model`
| field | type | notes |
|---|---|---|
| `version` | string | Your model version, e.g. `"dc-bayes-1.2.0"` |
| `source` | `"fake"` \| `"model"` | **Set to `"model"`** when real numbers go in |
| `runNumber` | int | Run identifier (not displayed) |
| `iterations` | int | Total simulations in this run |
| `rounds` | list of `{round, label, stage}` | **The whole tournament calendar**, including rounds you haven't predicted yet. `round` is a unique int (1, 2, 3…), `label` is what the round picker shows (`"Rodada 1"`, `"Oitavas de final"`), `stage` is the subtitle (`"Fase de grupos"`, `"Mata-mata"`) |
| `currentRound` | int | The round **Previsões** opens on, and where the home page takes its featured match from. Must have at least one match |

## Rounds (rodadas)

The **Previsões** page has a round picker. It lists every entry of `meta/model.rounds`:

- a round **with** at least one document in `matches` is clickable;
- a round **without** matches is shown greyed out as "em breve".

So "publishing a round" just means writing its matches. A typical tournament:

| round | label | stage | when to publish |
|---|---|---|---|
| 1 | Rodada 1 | Fase de grupos | before the World Cup starts |
| 2 | Rodada 2 | Fase de grupos | before the World Cup, or updated after round 1 |
| 3 | Rodada 3 | Fase de grupos | same |
| 4 | Oitavas de final | Mata-mata | once the group stage is over and the pairings are known |
| 5 | Quartas de final | Mata-mata | … |
| 6 | Semifinais | Mata-mata | … |
| 7 | Final e 3º lugar | Mata-mata | … |

**To publish the next round:** write the new round's `matches` (with `round` set), keep the matches of earlier rounds so they stay browsable, re-write `teams` with the updated `titleProb`, and move `meta/model.currentRound` forward. With the fake model that's `PUBLISHED_ROUNDS` and `CURRENT_ROUND` in `model/fake_model.py`.

## What the site computes by itself

So that the site never shows something stale or contradictory, nothing below is stored. It all follows from the model output:

| on the site | derived from |
|---|---|
| Favorites ranking (top 3 cards plus the full list) | `teams.titleProb`, sorted |
| "Atualizado em …" | `meta/model.updatedAt` (stamped by the writer) |
| Featured match on Início | The host team's match in `currentRound`. If the host doesn't play that round, the round's first match (`order`). An editor can force one with `content/home.featuredMatchId`. If that id doesn't exist, the site silently falls back to the automatic pick |
| Most likely score, top-3 cells, heatmap colors | the match's `matrix` |
| Round picker (which rounds are clickable) | `meta/model.rounds` and the `round` of each match |

### `content/*`: editorial copy (owned by the frontend/editorial team)
`content/site`, `content/home`, `content/predictions`, `content/simulator` and `content/methodology` hold all the text, the YouTube video id and the methodology steps. `content/home.featuredMatchId` is optional (see above). The source of truth is `model/content_seed.py`; edit there and run `python seed.py --only content`. Modelers normally don't touch these.

### `people/{auto-id}`: "Quem faz o projeto" (edited in the site's `/admin` page)
Fields: `name`, `kind` (`"coordinator"` | `"student"`), `title`, `subtitle`, `tag` (e.g. a cohort), `photo` (a small JPEG data URL created by the admin page), `order`, `visible`. Nobody needs to touch this from code. Use **https://copacomdados.web.app/admin**, signed in with an allowlisted Google account. `seed.py` never overwrites it.

The home page's "Atualizado em …" date comes from `meta/model.updatedAt`, which the writer stamps automatically.

The writer adds two fields to every document automatically: `schemaVersion: 1` and `updatedAt` (a server timestamp).

## Example: one `matches` document

```json
{
  "order": 101,
  "round": 1,
  "stageLabel": "Grupo A",
  "kickoff": null,
  "home": { "code": "BRA", "role": "Mandante" },
  "away": { "code": "FRA", "role": "Visitante" },
  "iterations": 10000,
  "probs": { "home": 0.47, "draw": 0.251, "away": 0.279 },
  "matrix": [
    { "home": 0, "away": 0, "p": 0.0601 },
    { "home": 0, "away": 1, "p": 0.0593 },
    "... 23 more cells ..."
  ]
}
```

## How to publish real numbers

```bash
cd model
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
# put the service-account key at model/service-account.json (never commit it)
.venv/bin/python seed.py --dry-run   # validate + write JSON to model/out/ for inspection
.venv/bin/python seed.py             # publish
```

To plug in the real model, replace `FakeModel` in `model/fake_model.py` with your own code that returns the same `{collection: {doc_id: data}}` dict. Or write your own exporter that produces the documents above and calls `validate_dataset()` before writing. Keep `seed.py`'s batching. Firestore allows at most 500 writes per batch. See [model/README.md](../model/README.md) for a walkthrough of the scripts.

`teams`, `matches` and `matchups` are **replaced** on every run. `seed.py` deletes documents in those collections that the new run didn't produce. So always write the full set (all published rounds), not just the new matches.

### Example: `meta/model`

```json
{
  "version": "dc-bayes-1.2.0",
  "source": "model",
  "runNumber": 3,
  "iterations": 10000,
  "currentRound": 1,
  "rounds": [
    { "round": 1, "label": "Rodada 1", "stage": "Fase de grupos" },
    { "round": 2, "label": "Rodada 2", "stage": "Fase de grupos" },
    { "round": 3, "label": "Rodada 3", "stage": "Fase de grupos" },
    { "round": 4, "label": "Oitavas de final", "stage": "Mata-mata" },
    { "round": 5, "label": "Quartas de final", "stage": "Mata-mata" },
    { "round": 6, "label": "Semifinais", "stage": "Mata-mata" },
    { "round": 7, "label": "Final e 3º lugar", "stage": "Mata-mata" }
  ]
}
```
