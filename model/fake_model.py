"""A deliberately simple *fake* model that produces data in the real contract.

It is a stand-in until the modeling team plugs in the real model. The maths is
plausible (independent Poisson goals + Dixon-Coles low-score correction, plus
a Monte Carlo knockout for title odds), but the team ratings are hand-picked
and jittered with random noise, so the numbers carry NO predictive value.

Everything shown for a match on the website is derived from ONE score matrix,
so 1X2 odds, the most likely score and the heatmap always agree.

What `FakeModel.run()` returns (and what the real model must return too) is a
dict ``{collection: {doc_id: document}}``:

* ``teams``    one doc per team, incl. ``titleProb`` (chance of winning the cup)
* ``matches``  the fixtures of every PUBLISHED round, each tagged with ``round``
* ``matchups`` every ordered pair of teams, for the simulator
* ``meta``     ``meta/model``: model version, the full list of ``rounds`` of the
               tournament and ``currentRound`` (the round the site opens on)

Rounds: the tournament calendar lives in ``ROUNDS`` below. Only rounds listed
in ``PUBLISHED_ROUNDS`` get matches; the others show up on the site as
"em breve". To publish the next round, add its fixtures and its number to
``PUBLISHED_ROUNDS`` and move ``CURRENT_ROUND`` forward.
See docs/DATA_CONTRACT.md for the field-by-field format.
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


# 32 teams in 8 groups of 4 (2027 format). Ratings are invented.
TEAMS: Tuple[TeamSeed, ...] = (
    # Group A
    TeamSeed("BRA", "Brasil", "Brasil", "🇧🇷", "A", 1.50, 0.97, is_host=True),
    TeamSeed("FRA", "França", "França", "🇫🇷", "A", 1.75, 0.90),
    TeamSeed("NZL", "Nova Zelândia", "N. Zelândia", "🇳🇿", "A", 1.10, 1.25),
    TeamSeed("MAR", "Marrocos", "Marrocos", "🇲🇦", "A", 1.05, 1.20),
    # Group B
    TeamSeed("ESP", "Espanha", "Espanha", "🇪🇸", "B", 1.95, 0.78),
    TeamSeed("SWE", "Suécia", "Suécia", "🇸🇪", "B", 1.55, 0.88),
    TeamSeed("NGA", "Nigéria", "Nigéria", "🇳🇬", "B", 1.20, 1.10),
    TeamSeed("CRC", "Costa Rica", "Costa Rica", "🇨🇷", "B", 0.95, 1.35),
    # Group C
    TeamSeed("USA", "Estados Unidos", "EUA", "🇺🇸", "C", 1.90, 0.80),
    TeamSeed("JPN", "Japão", "Japão", "🇯🇵", "C", 1.65, 0.92),
    TeamSeed("COL", "Colômbia", "Colômbia", "🇨🇴", "C", 1.30, 1.05),
    TeamSeed("PHI", "Filipinas", "Filipinas", "🇵🇭", "C", 0.85, 1.45),
    # Group D
    TeamSeed("GER", "Alemanha", "Alemanha", "🇩🇪", "D", 1.70, 0.95),
    TeamSeed("ENG", "Inglaterra", "Inglaterra", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "D", 1.80, 0.85),
    TeamSeed("KOR", "Coreia do Sul", "Coreia do Sul", "🇰🇷", "D", 1.20, 1.15),
    TeamSeed("JAM", "Jamaica", "Jamaica", "🇯🇲", "D", 1.05, 1.25),
    # Group E
    TeamSeed("NED", "Países Baixos", "Holanda", "🇳🇱", "E", 1.60, 0.95),
    TeamSeed("CAN", "Canadá", "Canadá", "🇨🇦", "E", 1.50, 0.92),
    TeamSeed("ARG", "Argentina", "Argentina", "🇦🇷", "E", 1.15, 1.15),
    TeamSeed("ZAM", "Zâmbia", "Zâmbia", "🇿🇲", "E", 1.10, 1.35),
    # Group F
    TeamSeed("AUS", "Austrália", "Austrália", "🇦🇺", "F", 1.55, 0.98),
    TeamSeed("NOR", "Noruega", "Noruega", "🇳🇴", "F", 1.45, 1.00),
    TeamSeed("IRL", "Irlanda", "Irlanda", "🇮🇪", "F", 1.05, 1.15),
    TeamSeed("VIE", "Vietnã", "Vietnã", "🇻🇳", "F", 0.75, 1.55),
    # Group G
    TeamSeed("DEN", "Dinamarca", "Dinamarca", "🇩🇰", "G", 1.45, 0.98),
    TeamSeed("ITA", "Itália", "Itália", "🇮🇹", "G", 1.40, 1.00),
    TeamSeed("MEX", "México", "México", "🇲🇽", "G", 1.15, 1.15),
    TeamSeed("RSA", "África do Sul", "África do Sul", "🇿🇦", "G", 1.00, 1.30),
    # Group H
    TeamSeed("CHN", "China", "China", "🇨🇳", "H", 1.30, 1.05),
    TeamSeed("SUI", "Suíça", "Suíça", "🇨🇭", "H", 1.30, 1.08),
    TeamSeed("POR", "Portugal", "Portugal", "🇵🇹", "H", 1.25, 1.10),
    TeamSeed("HAI", "Haiti", "Haiti", "🇭🇹", "H", 0.85, 1.45),
)

GROUPS: Dict[str, List[str]] = {}
for _t in TEAMS:
    GROUPS.setdefault(_t.group, []).append(_t.code)

# Tournament calendar (written to meta/model.rounds). `round` is the key that
# every match document points to.
ROUNDS: Tuple[Dict[str, Any], ...] = (
    {"round": 1, "label": "Rodada 1", "stage": "Fase de grupos"},
    {"round": 2, "label": "Rodada 2", "stage": "Fase de grupos"},
    {"round": 3, "label": "Rodada 3", "stage": "Fase de grupos"},
    {"round": 4, "label": "Oitavas de final", "stage": "Mata-mata"},
    {"round": 5, "label": "Quartas de final", "stage": "Mata-mata"},
    {"round": 6, "label": "Semifinais", "stage": "Mata-mata"},
    {"round": 7, "label": "Final e 3º lugar", "stage": "Mata-mata"},
)
PUBLISHED_ROUNDS: Tuple[int, ...] = (1,)  # rounds that already have predictions
CURRENT_ROUND = 1  # round the "Previsões" page opens on

# Group-stage pairings by round, as indexes into each group's 4 teams.
GROUP_SCHEDULE: Dict[int, Tuple[Tuple[int, int], ...]] = {
    1: ((0, 1), (2, 3)),
    2: ((0, 2), (3, 1)),
    3: ((3, 0), (1, 2)),
}


def group_fixtures(rnd: int) -> List[Tuple[str, str, str, str]]:
    """(match id, home, away, group) for one group-stage round."""
    out = []
    for g, members in GROUPS.items():
        for i, j in GROUP_SCHEDULE[rnd]:
            h, a = members[i], members[j]
            out.append((f"{h}-{a}".lower(), h, a, g))
    return out


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

    def match_doc(self, order: int, rnd: int, home: str, away: str, stage_label: str) -> Dict[str, Any]:
        # World Cup games are on neutral ground except for the host.
        dist = score_distribution(*self._neutral(home, away))
        return {
            "order": order,
            "round": rnd,
            "stageLabel": stage_label,
            "kickoff": None,
            "home": {"code": home, "role": "Mandante"},
            "away": {"code": away, "role": "Visitante"},
            "iterations": ITERATIONS,
            "probs": outcome_probs(dist),
            "matrix": cells(exact_5x5(dist)),
        }

    def match_docs(self) -> Dict[str, Dict[str, Any]]:
        docs: Dict[str, Dict[str, Any]] = {}
        for rnd in PUBLISHED_ROUNDS:
            if rnd not in GROUP_SCHEDULE:
                raise NotImplementedError("the fake model only knows group-stage fixtures")
            for order, (mid, h, a, g) in enumerate(group_fixtures(rnd), start=1):
                docs[mid] = self.match_doc(rnd * 100 + order, rnd, h, a, f"Grupo {g}")
        return docs

    def title_odds(self, n: int = ITERATIONS) -> Dict[str, float]:
        """Monte Carlo of the whole tournament: groups (top 2 advance), then a 16-team knockout."""
        codes = [t.code for t in TEAMS]
        probs = {
            (a, b): outcome_probs(score_distribution(*self._neutral(a, b)))
            for a in codes
            for b in codes
            if a != b
        }
        letters = sorted(GROUPS)
        wins = {c: 0 for c in codes}
        for _ in range(n):
            table: Dict[str, List[str]] = {}
            for g in letters:
                members = GROUPS[g]
                pts = {c: float(self.rng.random()) * 0.1 for c in members}  # random tie-break
                for i in range(4):
                    for j in range(i + 1, 4):
                        a, b = members[i], members[j]
                        o, r = probs[(a, b)], self.rng.random()
                        if r < o["home"]:
                            pts[a] += 3
                        elif r < o["home"] + o["draw"]:
                            pts[a] += 1
                            pts[b] += 1
                        else:
                            pts[b] += 3
                table[g] = sorted(members, key=pts.get, reverse=True)
            # Round of 16: A1-B2, C1-D2, ... then B1-A2, D1-C2, ...
            alive: List[str] = []
            for x, y in zip(letters[::2], letters[1::2]):
                alive += [table[x][0], table[y][1]]
            for x, y in zip(letters[::2], letters[1::2]):
                alive += [table[y][0], table[x][1]]
            while len(alive) > 1:
                nxt = []
                for a, b in zip(alive[::2], alive[1::2]):
                    o = probs[(a, b)]
                    nxt.append(a if self.rng.random() < o["home"] + o["draw"] / 2 else b)  # penalties = coin flip
                alive = nxt
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
            "matches": self.match_docs(),
            "matchups": {f"{h}_{a}": self.matchup_doc(h, a) for h in codes for a in codes if h != a},
            "meta": {
                "model": {
                    "version": "fake-0.2.0",
                    "source": "fake",
                    "runNumber": run_number,
                    "iterations": ITERATIONS,
                    "rounds": [dict(r) for r in ROUNDS],
                    "currentRound": CURRENT_ROUND,
                    "schemaVersion": SCHEMA_VERSION,
                }
            },
        }
