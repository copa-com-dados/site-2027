"""Editorial copy for the website (Firestore collection `content`).

Every piece of text the site shows lives here, so wording can change without
redeploying the frontend. Edit the dicts and run `python seed.py --only content`.

People in "Quem faz o projeto" are NOT here: they live in the `people`
collection and are edited through the site's /admin page.

Do NOT mention partner institutions by name anywhere (legal request).
"""

from __future__ import annotations

from typing import Any, Dict

YOUTUBE_PLACEHOLDER = "dQw4w9WgXcQ"  # TODO: replace with the real explainer video id

SITE: Dict[str, Any] = {
    "competitionLabel": "Copa do Mundo Feminina 2027",
    "footer": {
        "line1": "Projeto acadêmico sem fins comerciais",
    },
}

HOME: Dict[str, Any] = {
    "title": "Previsões da Copa do Mundo Feminina 2027, explicadas com dados.",
    "subtitle": (
        "Um projeto acadêmico de ciência de dados que estima as chances de cada jogo e de "
        "cada seleção, e mostra passo a passo como chegamos a cada número."
    ),
    "video": {
        "youtubeId": YOUTUBE_PLACEHOLDER,
        "duration": "1:30 min",
        "title": "Entenda o modelo em 1 minuto",
        "subtitle": "Como usamos dados históricos para estimar probabilidades",
    },
    "featuredTitle": "Jogo em destaque",
    # The featured match is picked automatically: the host's match in the
    # current round (or its first match). To force one, add
    # "featuredMatchId": "<matches doc id>".
    "favoritesTitle": "Favoritas ao título",
    "funFact": {
        "title": "Como ler as probabilidades",
        "body": (
            "Uma chance de 25% não é pouca: é o que acontece, em média, uma vez a cada quatro "
            "jogos. Probabilidade não é palpite de resultado, é uma medida da incerteza."
        ),
    },
}

PREDICTIONS: Dict[str, Any] = {
    "heading": "Previsões",
}

SIMULATOR: Dict[str, Any] = {
    "title": "Simulador de confrontos",
    "subtitle": "Escolha duas seleções e veja o que o modelo espera desse jogo.",
    "defaultHome": "BRA",
    "defaultAway": "ESP",
}

METHODOLOGY: Dict[str, Any] = {
    "title": "Como funciona o modelo",
    "intro": (
        "Um resumo, sem jargão, de quais dados usamos, como estimamos a força de cada seleção "
        "e como isso vira as probabilidades que você vê no site."
    ),
    "pipeline": {
        "title": "Distribuição de placares",
        "caption": "Exemplo de distribuição para um jogo",
        "rho": -0.13,
        "bars": [
            {"label": "0x0", "height": 0.28, "highlight": False},
            {"label": "1x0", "height": 0.52, "highlight": False},
            {"label": "2x1", "height": 0.94, "highlight": True},
            {"label": "1x1", "height": 0.68, "highlight": False},
            {"label": "2x0", "height": 0.42, "highlight": False},
            {"label": "3+", "height": 0.22, "highlight": False},
        ],
    },
    "steps": [
        {
            "label": "Passo 01",
            "variant": "data",
            "icon": "database",
            "title": "Dados históricos de seleções",
            "body": (
                "Reunimos resultados de jogos oficiais de seleções femininas. Partidas recentes e "
                "de grandes competições (Copa do Mundo, Olimpíadas e torneios continentais) têm "
                "mais peso."
            ),
            "footIcon": "check_circle",
            "footnote": "Somente jogos oficiais entre seleções",
        },
        {
            "label": "Passo 02",
            "variant": "model",
            "icon": "functions",
            "title": "Força de ataque e de defesa",
            "body": (
                "Cada seleção recebe uma força de ataque e uma de defesa. Com elas, um modelo de "
                "Poisson estima quantos gols cada time deve marcar, com a correção de Dixon-Coles "
                "para placares baixos (0x0, 1x0, 1x1)."
            ),
            "footIcon": "insights",
            "footnote": "Inclui o efeito de jogar em casa",
        },
        {
            "label": "Passo 03",
            "variant": "simulation",
            "icon": "all_inclusive",
            "title": "Simulação de Monte Carlo",
            "body": (
                "Simulamos cada partida milhares de vezes em Python. A frequência de cada resultado "
                "nas simulações é a probabilidade que você vê no site."
            ),
            "footIcon": "memory",
            "footnote": "10.000 simulações por confronto",
        },
    ],
    "explorer": {
        "title": "Explorador de simulações",
        "body": (
            "Gere uma amostra de 1.000 jogos entre duas seleções fictícias e veja como o resultado "
            "varia de uma amostra para outra:"
        ),
        "default": {"home": 0.542, "draw": 0.231, "away": 0.227},
        "button": "Gerar nova amostra",
    },
    "team": {
        "title": "Quem faz o projeto",
        "subtitle": "Estudantes e orientação do projeto",
        "studentsTitle": "Estudantes",
    },
    "repo": {
        # TODO: point to the real repository
        "url": "https://github.com",
        "title": "Código aberto no GitHub",
        "subtitle": "Modelo, simulações e documentação, tudo em Python",
    },
    "ethics": {
        "title": "Projeto acadêmico, sem fins comerciais",
        "body": (
            "Este é um projeto científico e educacional. Nosso compromisso é com a divulgação "
            "científica e com a estatística no esporte feminino."
        ),
    },
}

CONTENT: Dict[str, Dict[str, Any]] = {
    "site": SITE,
    "home": HOME,
    "predictions": PREDICTIONS,
    "simulator": SIMULATOR,
    "methodology": METHODOLOGY,
}

# Initial placeholder people (only written by `seed.py --only people` when the
# collection is empty). After that, manage them in the site's /admin page.
PLACEHOLDER_PEOPLE = [
    {
        "name": "Nome do Orientador",
        "kind": "coordinator",
        "title": "Orientação do projeto",
        "subtitle": "Edite em /admin",
        "tag": "",
        "photo": "",
        "order": 1,
        "visible": True,
    },
    {
        "name": "Nome da Estudante",
        "kind": "student",
        "title": "Modelagem e simulações em Python",
        "subtitle": "",
        "tag": "Turma 2026",
        "photo": "",
        "order": 2,
        "visible": True,
    },
]
