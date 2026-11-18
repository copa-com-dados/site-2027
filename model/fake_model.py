"""A deliberately simple *fake* model that produces data in the real contract.

It is a stand-in until the modeling team plugs in the real model. The maths is
plausible (independent Poisson goals + Dixon-Coles low-score correction, plus
a Monte Carlo knockout for title odds), but the team ratings are hand-picked
and jittered with random noise, so the numbers carry NO predictive value.

Everything shown for a match on the website is derived from ONE score matrix,
so 1X2 odds, the most likely score and the heatmap always agree.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any, Dict, List, Tuple

import numpy as np

from schema import SCHEMA_VERSION, cells

MAX_GOALS = 10  # truncation for the full distribution
RHO = -0.13  # Dixon-Coles low-score dependence
HOME_ADVANTAGE = 1.15
BASE_RATE = 1.0
ITERATIONS = 10_000


@dataclass(frozen=True)
class TeamSeed:
    code: str
    name: str
    short_name: str
    flag: str
    group: str
    off: float  # attacking strength (higher = scores more)
    deff: float  # defensive vulnerability (higher = concedes more)
    is_host: bool = False


TEAMS: Tuple[TeamSeed, ...] = (
    TeamSeed("BRA", "Brasil", "Brasil", "🇧🇷", "A", 1.85, 0.82, is_host=True),
    TeamSeed("ESP", "Espanha", "Espanha", "🇪🇸", "B", 1.95, 0.78),
    TeamSeed("USA", "Estados Unidos", "EUA", "🇺🇸", "C", 1.90, 0.80),
    TeamSeed("ENG", "Inglaterra", "Inglaterra", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "D", 1.80, 0.85),
    TeamSeed("FRA", "França", "França", "🇫🇷", "A", 1.75, 0.90),
    TeamSeed("GER", "Alemanha", "Alemanha", "🇩🇪", "E", 1.70, 0.95),
    TeamSeed("SWE", "Suécia", "Suécia", "🇸🇪", "B", 1.55, 0.88),
    TeamSeed("JPN", "Japão", "Japão", "🇯🇵", "C", 1.65, 0.92),
)

# Round-1 fixtures shown on the "Previsões" screen: (id, home, away).
FIXTURES: Tuple[Tuple[str, str, str], ...] = (
    ("bra-fra", "BRA", "FRA"),
    ("esp-swe", "ESP", "SWE"),
    ("usa-jpn", "USA", "JPN"),
    ("ger-eng", "GER", "ENG"),
)


def _poisson_pmf(lam: float, n: int) -> np.ndarray:
    k = np.arange(n + 1)
    return np.exp(-lam) * np.power(lam, k) / np.array([math.factorial(int(i)) for i in k])


def score_distribution(lam_home: float, lam_away: float) -> np.ndarray:
    """Full (MAX_GOALS+1)^2 joint distribution with the Dixon-Coles correction."""
    m = np.outer(_poisson_pmf(lam_home, MAX_GOALS), _poisson_pmf(lam_away, MAX_GOALS))
    m[0, 0] *= 1 - lam_home * lam_away * RHO
    m[0, 1] *= 1 + lam_home * RHO
    m[1, 0] *= 1 + lam_away * RHO
    m[1, 1] *= 1 - RHO
    return m / m.sum()


def outcome_probs(dist: np.ndarray) -> Dict[str, float]:
    home = float(np.tril(dist, -1).sum())
    draw = float(np.trace(dist))
    away = float(np.triu(dist, 1).sum())
    # Round to 3 decimals and push rounding error into the draw so they sum to 1.
    h, a = round(home, 3), round(away, 3)
    return {"home": h, "draw": round(1 - h - a, 3), "away": a}


def exact_5x5(dist: np.ndarray) -> List[List[float]]:
    return dist[:5, :5].tolist()


def bucketed_5x5(dist: np.ndarray) -> List[List[float]]:
    """0,1,2,3,4+ buckets on both axes (sums to 1)."""
    out = np.zeros((5, 5))
    for i in range(dist.shape[0]):
        for j in range(dist.shape[1]):
            out[min(i, 4), min(j, 4)] += dist[i, j]
    return out.tolist()


def score_label(rank: int, h: int, a: int) -> str:
    if rank == 0:
        return "Maior densidade"
    if h == a:
        return "Empate técnico" if h > 0 else "Jogo truncado"
    if h > a:
        return "Fator mando" if h - a == 1 else "Ataque superior"
    return "Contra-ataque letal" if a - h == 1 else "Controle visitante"


class FakeModel:
    def __init__(self, seed: int = 2027) -> None:
        self.rng = np.random.default_rng(seed)
        # Jitter ratings so each run looks like a "new model fit".
        self.ratings: Dict[str, Tuple[float, float]] = {
            t.code: (
                t.off * float(self.rng.normal(1, 0.03)),
                t.deff * float(self.rng.normal(1, 0.03)),
            )
            for t in TEAMS
        }

    def lambdas(self, home: str, away: str) -> Tuple[float, float]:
        (oh, dh), (oa, da) = self.ratings[home], self.ratings[away]
        return BASE_RATE * oh * da * HOME_ADVANTAGE, BASE_RATE * oa * dh

    def distribution(self, home: str, away: str) -> np.ndarray:
        return score_distribution(*self.lambdas(home, away))

    # ---- documents -------------------------------------------------------

    def matchup_doc(self, home: str, away: str) -> Dict[str, Any]:
        dist = self.distribution(home, away)
        flat = [(dist[i, j], i, j) for i in range(5) for j in range(5)]
        flat.sort(reverse=True)
        top = [
            {"home": i, "away": j, "p": round(float(p), 4), "label": score_label(r, i, j)}
            for r, (p, i, j) in enumerate(flat[:3])
        ]
        return {
            "home": home,
            "away": away,
            "iterations": ITERATIONS,
            "probs": outcome_probs(dist),
            "matrix": cells(bucketed_5x5(dist)),
            "topScores": top,
        }

    def match_doc(self, order: int, home: str, away: str) -> Dict[str, Any]:
        dist = self.distribution(home, away)
        return {
            "order": order,
            "round": 1,
            "stageLabel": "Fase de Grupos",
            "kickoff": None,
            "home": {"code": home, "role": "Mandante"},
            "away": {"code": away, "role": "Visitante"},
            "iterations": ITERATIONS,
            "probs": outcome_probs(dist),
            "matrix": cells(exact_5x5(dist)),
        }

    def title_odds(self, n: int = ITERATIONS) -> Dict[str, float]:
        """Monte Carlo of an 8-team knockout bracket with random draws each run."""
        codes = [t.code for t in TEAMS]
        win_p: Dict[Tuple[str, str], float] = {}
        for a in codes:
            for b in codes:
                if a != b:
                    o = outcome_probs(score_distribution(*self._neutral(a, b)))
                    win_p[(a, b)] = o["home"] + o["draw"] / 2  # penalties = coin flip
        wins = {c: 0 for c in codes}
        for _ in range(n):
            alive = list(self.rng.permutation(codes))
            while len(alive) > 1:
                alive = [
                    a if self.rng.random() < win_p[(a, b)] else b
                    for a, b in zip(alive[::2], alive[1::2])
                ]
            wins[alive[0]] += 1
        return {c: wins[c] / n for c in codes}

    def _neutral(self, a: str, b: str) -> Tuple[float, float]:
        (oa, da), (ob, db) = self.ratings[a], self.ratings[b]
        host = {t.code for t in TEAMS if t.is_host}
        ha = HOME_ADVANTAGE if a in host else 1.0
        hb = HOME_ADVANTAGE if b in host else 1.0
        return BASE_RATE * oa * db * ha, BASE_RATE * ob * da * hb

    def team_docs(self) -> Dict[str, Dict[str, Any]]:
        odds = self.title_odds()
        ranked = sorted(odds, key=odds.get, reverse=True)
        docs = {}
        for t in TEAMS:
            off, deff = self.ratings[t.code]
            docs[t.code] = {
                "code": t.code,
                "name": t.name,
                "shortName": t.short_name,
                "flag": t.flag,
                "group": t.group,
                "isHost": t.is_host,
                "rank": ranked.index(t.code) + 1,
                "titleProb": round(odds[t.code], 4),
                "rating": {"off": round(off, 3), "def": round(deff, 3)},
            }
        return docs

    def run(self, run_number: int) -> Dict[str, Dict[str, Dict[str, Any]]]:
        codes = [t.code for t in TEAMS]
        return {
            "teams": self.team_docs(),
            "matches": {mid: self.match_doc(i + 1, h, a) for i, (mid, h, a) in enumerate(FIXTURES)},
            "matchups": {f"{h}_{a}": self.matchup_doc(h, a) for h in codes for a in codes if h != a},
            "meta": {
                "model": {
                    "version": "fake-0.1.0",
                    "source": "fake",
                    "runNumber": run_number,
                    "iterations": ITERATIONS,
                    "schemaVersion": SCHEMA_VERSION,
                }
            },
        }
