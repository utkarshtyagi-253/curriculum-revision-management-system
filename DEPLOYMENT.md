# Render free demo

The repository's `render.yaml` deploys the React frontend and Express API as one free Node web service. Render generates the JWT secret automatically. The database is seeded on the first start of an empty database.

## Deploy

Connect your Render account and create a Blueprint from this repository:

https://github.com/utkarshtyagi-253/curriculum-revision-management-system

Select branch `main` and use the root `render.yaml`. Review that the service uses the **Free** plan, then deploy. The service URL is assigned by Render; `/api/health` verifies the API.

If deploying a web service directly instead of a Blueprint, use:

- Runtime: Node
- Root directory: repository root (leave blank)
- Build command: `npm ci --prefix client --include=dev && npm run build --prefix client && npm ci --prefix server --omit=dev`
- Start command: `npm start --prefix server`
- Health check: `/api/health`
- Environment: `NODE_ENV=production`, `DB_PATH=/tmp/crms/curriculum_revision.db`, and a randomly generated `JWT_SECRET`

## Demo limits

The free service uses ephemeral storage. Proposals, uploaded documents, decisions, and milestones created online can be lost when the service restarts, redeploys, or spins down. The seeded demo accounts are publicly documented and suitable only for demonstration data. Do not enter confidential academic records.

https://render.com/docs/free

For persistent storage, use a paid service with a disk and set `DB_PATH` to a database file under its mount path. That option is not enabled by this configuration.
