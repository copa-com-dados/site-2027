# Copa com Dados 2027

The public website for the Copa com Dados project: probabilities and predictions for the 2027 Women's World Cup.

- **Live:** https://copacomdados.web.app
- **Backend:** Firebase (Cloud Firestore in `southamerica-east1` + Hosting), project `copa-com-dados`

```
web/      React 19 + TypeScript + Vite + Tailwind 3 frontend (reads Firestore, read-only)
model/    Python fake model + validator + Firestore writer (Admin SDK)
docs/     DATA_CONTRACT.md — the Firestore format the modeling team must write
firebase.json / firestore.rules / .firebaserc — Firebase config
```

## Frontend

```bash
cd web
cp .env.example .env        # fill with: firebase apps:sdkconfig WEB --project copa-com-dados
npm install
npm run dev                 # http://localhost:5173
npm run lint && npm test && npm run build
```

Layout of `web/src`:

| path | what |
|---|---|
| `app/` | router, app root, error boundary |
| `components/layout` | header, mobile bottom nav, desktop top nav, shell |
| `components/ui` | shared UI (icons, skeletons, error state, YouTube card, avatar…) |
| `features/<screen>/` | one folder per screen: `home`, `predictions`, `simulator`, `methodology` |
| `services/` | typed Firestore reads (`api.ts`) |
| `hooks/` | data hooks with caching and loading/error states |
| `types/schema.ts` | zod schemas = the data contract on the frontend side |
| `lib/` | formatting, matrix helpers, Firebase init |

Every number and every piece of copy comes from Firestore (text in `model/content_seed.py` → `seed.py --only content`). The only exception is the didactic "Explorador de Simulações" on Metodologia, which draws random samples in the browser on purpose.

Mobile (< 1024px) reproduces the reference design. Desktop gets a top nav and multi-column layouts.

## Data / fake model

```bash
cd model
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python seed.py --dry-run     # validate, write JSON to model/out/
.venv/bin/python seed.py               # write to Firestore (needs model/service-account.json)
.venv/bin/python seed.py --only content
```

The service-account key comes from Firebase console → Project settings → Service accounts → *Generate new private key*. It is gitignored. **Never commit it.**

See **[docs/DATA_CONTRACT.md](docs/DATA_CONTRACT.md)** for the format (including rounds) and **[model/README.md](model/README.md)** for how the scripts work.

## Editing the team ("Quem faz o projeto")

Go to **https://copacomdados.web.app/admin** and sign in with Google. There you can add, edit, reorder and hide people and upload photos (photos are cropped and resized in the browser). Changes are live immediately.

Only allowlisted accounts can edit. To manage the list (needs `model/service-account.json`):

```bash
cd model
.venv/bin/python admins.py add someone@gmail.com
.venv/bin/python admins.py list
.venv/bin/python admins.py remove someone@gmail.com
```

## Logo

The header shows `web/public/brand/logo.svg` (a placeholder). To use the final logo, drop e.g. `logo.png` into `web/public/brand/`, update `web/src/config/brand.ts`, and deploy.

## Deploy

```bash
firebase deploy --only firestore:rules,firestore:indexes   # rules (public read, no client writes)
cd web && npm run deploy                                   # build + hosting
```
