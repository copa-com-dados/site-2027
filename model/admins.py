#!/usr/bin/env python3
"""Manage who can edit the site's /admin page (Firestore collection `admins`).

    python admins.py list
    python admins.py add someone@gmail.com
    python admins.py remove someone@gmail.com

The e-mail must be the Google account the person uses to sign in on /admin.
"""

from __future__ import annotations

import argparse
import sys

from seed import DEFAULT_KEY, PROJECT_ID


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("action", choices=["list", "add", "remove"])
    parser.add_argument("email", nargs="?")
    args = parser.parse_args()
    if args.action != "list" and not args.email:
        sys.exit("Informe o e-mail.")

    import firebase_admin
    from firebase_admin import credentials, firestore

    firebase_admin.initialize_app(credentials.Certificate(str(DEFAULT_KEY)), {"projectId": PROJECT_ID})
    admins = firestore.client().collection("admins")

    if args.action == "list":
        for doc in admins.stream():
            print(doc.id)
    elif args.action == "add":
        email = args.email.strip().lower()
        admins.document(email).set({"addedAt": firestore.SERVER_TIMESTAMP})
        print(f"{email} agora pode editar o site em /admin")
    else:
        admins.document(args.email.strip().lower()).delete()
        print(f"{args.email} removido")


if __name__ == "__main__":
    main()
