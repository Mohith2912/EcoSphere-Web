# EcoSphere Backend

Backend-only implementation for EcoSphere. It is a Node.js + Express modular monolith with Prisma-facing repositories. It deliberately contains no Prisma schema or migration files: Poshika owns database schema, migrations, and final integration.

## Run locally

1. Copy `.env.example` to `.env` and supply `DATABASE_URL` and a long `JWT_SECRET`.
2. Once Poshika has supplied the Prisma schema and generated client, run `npm install`.
3. Run `npm run dev` for development, or `npm start` for production-style startup.

Checks:

```text
npm test
npm run check
npm run lint
```

The API listens on `PORT` (default `4000`) and exposes a no-database-readiness endpoint at `GET /health`.

## Security and data rules

- Every protected request authenticates a JWT, loads the active user and role grants from the database, and scopes every tenant repository query by `organizationId`.
- Permissions are enforced server-side. Role grants carry `OWN`, `DEPARTMENT`, or `ORGANIZATION` scope.
- Employees cannot approve their own CSR or challenge submissions; evidence is checked before approval when required.
- XP, points, badges, stock changes, redemptions, notifications, and approvals are all server-side workflows. Redemption and approval side effects use Prisma transactions.
- Reports and dashboards use persisted records only. Scores remain `NOT_CALCULATED` until Poshika provides approved scoring configuration; no business metrics are seeded or fabricated.

Read [API_CONTRACT.md](API_CONTRACT.md) for the frontend-facing endpoints and [DATABASE_CONTRACT.md](DATABASE_CONTRACT.md) for the required Prisma/MySQL contract.
