# model/: fake model and Firestore writer

This folder produces **every number the website shows** and writes it to Firestore. Today the numbers come from a **fake model** (`fake_model.py`). The modeling team's job is to replace it with the real model while keeping the output format. The site then needs no change at all.

The exact format of each document is in [`docs/DATA_CONTRACT.md`](../docs/DATA_CONTRACT.md). This file explains how the scripts fit together.

## The pipeline

```
fake_model.py  ──►  dataset dict  ──►  schema.validate_dataset()  ──►  seed.py writes to Firestore
(FakeModel.run)     {collection: {doc_id: doc}}     (fails loudly)          (batched, stamps updatedAt)
content_seed.py ─┘  (site copy, merged in by seed.py)
```

| file | what it does |
|---|---|
| `fake_model.py` | Builds the model output: `teams`, `matches`, `matchups`, `meta/model`. **This is the file the real model replaces.** |
| `content_seed.py` | All site text (titles, video id, methodology steps). Not model output. |
| `schema.py` | Validator for the data contract, mirrored by `web/src/types/schema.ts`. Run it before any write. |
| `seed.py` | CLI: builds the dataset, validates it, writes it to Firestore (or to `out/*.json` with `--dry-run`). |
| `admins.py` | Manages who can log in to the site's `/admin` page. |

## What the model must output

`FakeModel(seed).run(run_number)` returns:

```python
{
  "teams":    {"BRA": {...}, "ESP": {...}, ...},          # one per team, with titleProb
  "matches":  {"bra-fra": {...}, ...},                    # fixtures of every PUBLISHED round
  "matchups": {"BRA_ESP": {...}, "ESP_BRA": {...}, ...},  # every ordered pair (simulator)
  "meta":     {"model": {..., "rounds": [...], "currentRound": 1}},
}
```

Your real model can be any code, as long as it returns this same dict (or writes the same documents).

## Rounds

The tournament calendar is the `ROUNDS` list in `fake_model.py`, written to `meta/model.rounds`. Each match has a `round` field saying which round its prediction is for. On the site:

- **Previsões** has a round picker. Rounds with matches are clickable; the others show "em breve".
- **Previsões** opens on `meta/model.currentRound`.
- **Início** features the host's (Brazil's) match of `currentRound`.

To publish a new round with the fake model, add the round's number to `PUBLISHED_ROUNDS` and update `CURRENT_ROUND`. The fake model only knows group-stage fixtures (rounds 1–3); knockout fixtures will come from the real bracket. With the real model, output the matches of **all** rounds published so far (earlier rounds stay browsable), update `teams[*].titleProb`, and set `currentRound`.

Important: each run **replaces** `teams`, `matches` and `matchups`. Documents the new run didn't produce are deleted, so a partial run would remove earlier rounds.

## Commands

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python seed.py --dry-run          # validate + write out/*.json to inspect (no credentials)
.venv/bin/python seed.py                    # validate + publish everything
.venv/bin/python seed.py --only content     # only the site copy
.venv/bin/python seed.py --only teams matches matchups meta   # only model output
```

Publishing needs `model/service-account.json` (Firebase console → Project settings → Service accounts). It's gitignored. **Never commit it.**

## How the fake model works (for reference)

- Each team has an attack and defense rating (invented, jittered by the random seed).
- Goals: independent Poisson with the Dixon-Coles correction for low scores (`RHO`). Only the host gets a home advantage at the World Cup. The simulator's "Mandante" always gets it.
- `matches[*].matrix`: exact probabilities for 0–4 goals. `matchups[*].matrix`: 0–4+ buckets.
- `titleProb`: Monte Carlo of the whole tournament (groups with top 2 advancing, then a 16-team knockout), `ITERATIONS` times.
- Everything for one match comes from one score distribution, so the 1X2 odds, the most likely score and the heatmap always agree.
