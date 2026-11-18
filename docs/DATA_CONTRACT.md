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
6. **Derived numbers are computed by the site, not stored.** That covers the most likely score, the top 3 cells of a match, and the "#1 Favorito" ordering. Get the matrix and `probs` right and everything else follows.

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
| `titleProb` | number 0–1 | **Model output.** Chance of winning the cup. Top 3 appear on the home page |
| `rating` | `{off, def}` | Optional model diagnostics (not displayed) |

### `matches/{slug}`
Scheduled fixtures shown on **Previsões** and featured on **Início**. The doc id is a lowercase slug, e.g. `bra-fra`.

| field | type | notes |
|---|---|---|
| `order` | number | Carousel order (ascending) |
| `round` | int | Round number |
| `stageLabel` | string | `"Fase de Grupos"`, `"Oitavas de Final"`… |
| `kickoff` | ISO string \| null | Optional |
| `home` / `away` | `{code, role}` | `role` is a display label (`"Mandante"` / `"Visitante"`) |
| `iterations` | int | Number of simulations behind the numbers (shown as "10.000 simulações") |
| `probs` | `{home, draw, away}` | **Model output.** 1X2 probabilities from the *full* distribution |
| `matrix` | 25 cells | **Model output.** **Exact** score probabilities for 0–4 goals. Mass above 4 goals is dropped, so the cells sum to slightly less than 1 |

### `matchups/{HOME}_{AWAY}`
Head-to-head results for the **Simulador**. The simulator lets visitors pick *any* two teams, so write **every ordered pair** of teams in `teams`. For 8 teams that's 8 × 7 = 56 docs. Doc id example: `BRA_ESP` (home first).

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

### `content/*`: editorial copy (owned by the frontend/editorial team)
`content/site`, `content/home`, `content/predictions`, `content/simulator` and `content/methodology` hold all the text, the YouTube video id, the featured match (`content/home.featuredMatchId` must point to an existing `matches` doc) and the methodology steps. The source of truth is `model/content_seed.py`; edit there and run `python seed.py --only content`. Modelers normally don't touch these.

### `people/{auto-id}`: "Quem faz o projeto" (edited in the site's `/admin` page)
Fields: `name`, `kind` (`"coordinator"` | `"student"`), `title`, `subtitle`, `tag` (e.g. a cohort), `photo` (a small JPEG data URL created by the admin page), `order`, `visible`. Nobody needs to touch this from code. Use **https://copacomdados.web.app/admin**, signed in with an allowlisted Google account. `seed.py` never overwrites it.

The home page's "Atualizado em …" date comes from `meta/model.updatedAt`, which the writer stamps automatically.

The writer adds two fields to every document automatically: `schemaVersion: 1` and `updatedAt` (a server timestamp).

## Example: one `matches` document

```json
{
  "order": 1,
  "round": 1,
  "stageLabel": "Fase de Grupos",
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

To plug in the real model, replace `FakeModel` in `model/fake_model.py` with your own code that returns the same `{collection: {doc_id: data}}` dict. Or write your own exporter (R, Python…) that produces the documents above and calls `validate_dataset()` before writing. Keep `seed.py`'s batching. Firestore allows at most 500 writes per batch.
