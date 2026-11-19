"""Data contract for the Copa com Dados Firestore database (schemaVersion 1).

This module mirrors `web/src/types/schema.ts`. Any writer (the fake model in
this folder, or the real modeling pipeline) should run `validate_dataset()`
before committing to Firestore. See `docs/DATA_CONTRACT.md` for prose docs.

Conventions
-----------
* Probabilities are floats in [0, 1] (never strings, never percentages).
* Score matrices are FLAT lists of 25 cells ``{"home": i, "away": j, "p": x}``
  for i, j in 0..4 (Firestore cannot store nested arrays).
  - ``matches``  : exact goals 0..4 (cells need not sum to 1; mass above 4 is dropped)
  - ``matchups`` : buckets 0, 1, 2, 3, 4+ (cells sum to ~1)
* Team codes are 3-letter uppercase (FIFA style), e.g. ``BRA``.
"""

from __future__ import annotations

import math
import re
from typing import Any, Dict, Iterable, List, Mapping

SCHEMA_VERSION = 1
MATRIX_SIZE = 5
TEAM_CODE_RE = re.compile(r"^[A-Z]{3}$")
SLUG_RE = re.compile(r"^[a-z0-9-]+$")

# Collections the frontend reads (and the security rules allow).
COLLECTIONS = ("teams", "matches", "matchups", "content", "meta", "people")


class ValidationError(ValueError):
    """Raised when a document does not follow the data contract."""


def _fail(path: str, msg: str) -> None:
    raise ValidationError(f"{path}: {msg}")


def _require(doc: Mapping[str, Any], path: str, keys: Iterable[str]) -> None:
    missing = [k for k in keys if k not in doc]
    if missing:
        _fail(path, f"missing field(s) {missing}")


def _prob(value: Any, path: str) -> None:
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        _fail(path, f"expected number in [0,1], got {value!r}")
    if math.isnan(value) or value < 0 or value > 1:
        _fail(path, f"probability out of range: {value}")


def _str(value: Any, path: str, allow_empty: bool = False) -> None:
    if not isinstance(value, str) or (not allow_empty and not value.strip()):
        _fail(path, f"expected non-empty string, got {value!r}")


def validate_probs(probs: Mapping[str, Any], path: str) -> None:
    _require(probs, path, ("home", "draw", "away"))
    for k in ("home", "draw", "away"):
        _prob(probs[k], f"{path}.{k}")
    total = probs["home"] + probs["draw"] + probs["away"]
    if abs(total - 1) > 0.01:
        _fail(path, f"home+draw+away must be 1 (±0.01), got {total:.4f}")


def validate_matrix(matrix: Any, path: str, must_sum_to_one: bool) -> None:
    if not isinstance(matrix, list) or len(matrix) != MATRIX_SIZE * MATRIX_SIZE:
        _fail(path, f"expected a flat list of {MATRIX_SIZE * MATRIX_SIZE} cells")
    seen = set()
    total = 0.0
    for i, cell in enumerate(matrix):
        cpath = f"{path}[{i}]"
        _require(cell, cpath, ("home", "away", "p"))
        h, a = cell["home"], cell["away"]
        if not (isinstance(h, int) and isinstance(a, int) and 0 <= h < MATRIX_SIZE and 0 <= a < MATRIX_SIZE):
            _fail(cpath, f"home/away must be ints in 0..{MATRIX_SIZE - 1}")
        if (h, a) in seen:
            _fail(cpath, f"duplicate cell {h}x{a}")
        seen.add((h, a))
        _prob(cell["p"], f"{cpath}.p")
        total += cell["p"]
    if total > 1.005:  # allow rounding error
        _fail(path, f"cells sum to {total:.4f} (> 1)")
    if must_sum_to_one and abs(total - 1) > 0.01:
        _fail(path, f"bucketed matrix must sum to 1 (±0.01), got {total:.4f}")


def validate_team(doc_id: str, d: Mapping[str, Any]) -> None:
    p = f"teams/{doc_id}"
    _require(d, p, ("code", "name", "shortName", "flag", "group", "isHost", "rank", "titleProb", "rating"))
    if not TEAM_CODE_RE.match(doc_id) or d["code"] != doc_id:
        _fail(p, "doc id must equal `code` and be 3 uppercase letters")
    for k in ("name", "shortName", "flag", "group"):
        _str(d[k], f"{p}.{k}")
    if not isinstance(d["isHost"], bool):
        _fail(f"{p}.isHost", "expected bool")
    if not isinstance(d["rank"], int) or d["rank"] < 1:
        _fail(f"{p}.rank", "expected int >= 1")
    _prob(d["titleProb"], f"{p}.titleProb")
    _require(d["rating"], f"{p}.rating", ("off", "def"))


def _side(side: Mapping[str, Any], path: str, team_codes: set) -> None:
    _require(side, path, ("code", "role"))
    if side["code"] not in team_codes:
        _fail(path, f"unknown team code {side['code']!r} (add it to `teams` first)")
    _str(side["role"], f"{path}.role")


def validate_match(doc_id: str, d: Mapping[str, Any], team_codes: set) -> None:
    p = f"matches/{doc_id}"
    _require(d, p, ("order", "round", "stageLabel", "home", "away", "iterations", "probs", "matrix"))
    if not SLUG_RE.match(doc_id):
        _fail(p, "doc id must be a lowercase slug, e.g. 'bra-fra'")
    if not isinstance(d["round"], int) or isinstance(d["round"], bool) or d["round"] < 1:
        _fail(f"{p}.round", "expected int >= 1 (a `round` listed in meta/model.rounds)")
    if d["home"].get("code") == d["away"].get("code"):
        _fail(p, "home and away must differ")
    _side(d["home"], f"{p}.home", team_codes)
    _side(d["away"], f"{p}.away", team_codes)
    _str(d["stageLabel"], f"{p}.stageLabel")
    if not isinstance(d["iterations"], int) or d["iterations"] <= 0:
        _fail(f"{p}.iterations", "expected positive int")
    validate_probs(d["probs"], f"{p}.probs")
    validate_matrix(d["matrix"], f"{p}.matrix", must_sum_to_one=False)


def validate_matchup(doc_id: str, d: Mapping[str, Any], team_codes: set) -> None:
    p = f"matchups/{doc_id}"
    _require(d, p, ("home", "away", "iterations", "probs", "matrix", "topScores"))
    if doc_id != f"{d['home']}_{d['away']}":
        _fail(p, "doc id must be '<HOME>_<AWAY>', e.g. 'BRA_ESP'")
    if d["home"] == d["away"]:
        _fail(p, "home and away must differ")
    for k in ("home", "away"):
        if d[k] not in team_codes:
            _fail(f"{p}.{k}", f"unknown team code {d[k]!r}")
    validate_probs(d["probs"], f"{p}.probs")
    validate_matrix(d["matrix"], f"{p}.matrix", must_sum_to_one=True)
    tops = d["topScores"]
    if not isinstance(tops, list) or len(tops) != 3:
        _fail(f"{p}.topScores", "expected exactly 3 entries")
    for i, t in enumerate(tops):
        _require(t, f"{p}.topScores[{i}]", ("home", "away", "p", "label"))
        _prob(t["p"], f"{p}.topScores[{i}].p")
        _str(t["label"], f"{p}.topScores[{i}].label")


PERSON_KINDS = ("coordinator", "student")
MAX_PHOTO_CHARS = 700_000  # Firestore docs are capped at 1 MiB


def validate_person(doc_id: str, d: Mapping[str, Any]) -> None:
    p = f"people/{doc_id}"
    _require(d, p, ("name", "kind", "title", "order", "visible"))
    _str(d["name"], f"{p}.name")
    if d["kind"] not in PERSON_KINDS:
        _fail(f"{p}.kind", f"must be one of {PERSON_KINDS}")
    if len(d.get("photo") or "") > MAX_PHOTO_CHARS:
        _fail(f"{p}.photo", "photo too large (resize it to ~320px)")


def validate_dataset(dataset: Mapping[str, Mapping[str, Dict[str, Any]]]) -> None:
    """Validate a full ``{collection: {doc_id: data}}`` payload."""
    unknown = set(dataset) - set(COLLECTIONS)
    if unknown:
        raise ValidationError(f"unknown collection(s): {sorted(unknown)}")

    teams = dataset.get("teams", {})
    for doc_id, d in teams.items():
        validate_team(doc_id, d)
    codes = set(teams)

    for doc_id, d in dataset.get("matches", {}).items():
        validate_match(doc_id, d, codes)
    for doc_id, d in dataset.get("matchups", {}).items():
        validate_matchup(doc_id, d, codes)

    for doc_id, d in dataset.get("people", {}).items():
        validate_person(doc_id, d)

    content = dataset.get("content", {})
    for required in ("site", "home", "predictions", "simulator", "methodology"):
        if content and required not in content:
            raise ValidationError(f"content/{required} is required")
    matches = dataset.get("matches", {})
    home = content.get("home")
    featured = home.get("featuredMatchId") if home else None
    if featured and matches and featured not in matches:
        raise ValidationError("content/home.featuredMatchId must point to an existing match (or be removed)")

    meta = dataset.get("meta", {}).get("model")
    if meta is not None:
        validate_model_meta(meta)
        if matches:
            validate_rounds_vs_matches(meta, matches)


def validate_model_meta(meta: Mapping[str, Any]) -> None:
    p = "meta/model"
    _require(meta, p, ("version", "source", "runNumber", "iterations", "rounds", "currentRound", "schemaVersion"))
    if meta["source"] not in ("fake", "model"):
        _fail(f"{p}.source", "must be 'fake' or 'model'")
    rounds = meta["rounds"]
    if not isinstance(rounds, list) or not rounds:
        _fail(f"{p}.rounds", "expected a non-empty list of {round, label, stage}")
    seen = set()
    for i, r in enumerate(rounds):
        rp = f"{p}.rounds[{i}]"
        _require(r, rp, ("round", "label", "stage"))
        if not isinstance(r["round"], int) or r["round"] < 1 or r["round"] in seen:
            _fail(f"{rp}.round", "expected a unique int >= 1")
        seen.add(r["round"])
        _str(r["label"], f"{rp}.label")
        _str(r["stage"], f"{rp}.stage")
    if meta["currentRound"] not in seen:
        _fail(f"{p}.currentRound", f"{meta['currentRound']!r} is not one of the rounds {sorted(seen)}")


def validate_rounds_vs_matches(meta: Mapping[str, Any], matches: Mapping[str, Mapping[str, Any]]) -> None:
    known = {r["round"] for r in meta["rounds"]}
    for doc_id, m in matches.items():
        if m["round"] not in known:
            raise ValidationError(f"matches/{doc_id}.round={m['round']} is not listed in meta/model.rounds")
    if not any(m["round"] == meta["currentRound"] for m in matches.values()):
        raise ValidationError(
            f"meta/model.currentRound={meta['currentRound']} has no matches; publish its matches first"
        )


def cells(matrix: List[List[float]]) -> List[Dict[str, Any]]:
    """Flatten a 5x5 nested list (rows = home goals) into the Firestore cell format."""
    return [
        {"home": i, "away": j, "p": round(float(matrix[i][j]), 4)}
        for i in range(MATRIX_SIZE)
        for j in range(MATRIX_SIZE)
    ]
