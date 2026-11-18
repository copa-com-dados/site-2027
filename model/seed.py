#!/usr/bin/env python3
"""Generate fake model output + site content, validate it, and write it to Firestore.

Usage
-----
    python seed.py --dry-run            # validate + write JSON to model/out/ (no credentials needed)
    python seed.py                      # validate + write everything to Firestore
    python seed.py --only content       # only (re)write the `content` collection
    python seed.py --seed 7 --run 14281 # different random draw / run number

Credentials: a service-account key at model/service-account.json, or set
GOOGLE_APPLICATION_CREDENTIALS. Never commit the key.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict

from content_seed import CONTENT, PLACEHOLDER_PEOPLE
from fake_model import FakeModel
from schema import SCHEMA_VERSION, ValidationError, validate_dataset

HERE = Path(__file__).resolve().parent
DEFAULT_KEY = HERE / "service-account.json"
PROJECT_ID = "copa-com-dados"
BATCH_LIMIT = 450  # Firestore hard limit is 500 writes per batch

Dataset = Dict[str, Dict[str, Dict[str, Any]]]


def build_dataset(seed: int, run_number: int) -> Dataset:
    data = FakeModel(seed=seed).run(run_number)
    data["content"] = {k: dict(v) for k, v in CONTENT.items()}
    return data


def write_json(data: Dataset, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    for collection, docs in data.items():
        path = out_dir / f"{collection}.json"
        path.write_text(json.dumps(docs, ensure_ascii=False, indent=2))
    print(f"Wrote JSON to {out_dir}")


def write_firestore(data: Dataset) -> None:
    import firebase_admin
    from firebase_admin import credentials, firestore

    key = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") or str(DEFAULT_KEY)
    if not Path(key).exists():
        sys.exit(
            f"No credentials found at {key}.\n"
            "Generate one in Firebase console > Project settings > Service accounts,\n"
            "save it as model/service-account.json (gitignored) and run again."
        )
    firebase_admin.initialize_app(credentials.Certificate(key), {"projectId": PROJECT_ID})
    db = firestore.client()

    if "people" in data and any(True for _ in db.collection("people").limit(1).stream()):
        print("people/ already has documents; skipping placeholders (manage them in /admin)")
        data = {k: v for k, v in data.items() if k != "people"}

    ops = [(c, doc_id, doc) for c, docs in data.items() for doc_id, doc in docs.items()]
    for start in range(0, len(ops), BATCH_LIMIT):
        batch = db.batch()
        for collection, doc_id, doc in ops[start : start + BATCH_LIMIT]:
            payload = dict(doc, schemaVersion=SCHEMA_VERSION, updatedAt=firestore.SERVER_TIMESTAMP)
            batch.set(db.collection(collection).document(doc_id), payload)
        batch.commit()
    counts = ", ".join(f"{c}={len(d)}" for c, d in data.items())
    print(f"Committed {len(ops)} docs to Firestore ({counts})")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true", help="validate and write JSON only")
    parser.add_argument(
        "--only",
        nargs="+",
        choices=["teams", "matches", "matchups", "content", "meta", "people"],
        help="'people' writes placeholder people ONLY if the collection is empty",
    )
    parser.add_argument("--seed", type=int, default=2027, help="random seed for the fake model")
    parser.add_argument("--run", type=int, default=14280, help="run number shown on the home page")
    args = parser.parse_args()

    data = build_dataset(args.seed, args.run)
    # People are managed in the site's /admin page. They are never written by a
    # normal run, so re-seeding can't wipe the team's edits.
    if args.only and "people" in args.only:
        data["people"] = {f"placeholder-{i + 1}": p for i, p in enumerate(PLACEHOLDER_PEOPLE)}
    try:
        validate_dataset(data)
    except ValidationError as exc:
        sys.exit(f"Validation failed: {exc}")
    print("Dataset is valid against schemaVersion", SCHEMA_VERSION)

    if args.only:
        data = {k: v for k, v in data.items() if k in args.only}

    if args.dry_run:
        write_json(data, HERE / "out")
    else:
        write_firestore(data)


if __name__ == "__main__":
    main()
