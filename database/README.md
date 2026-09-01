# EcoSphere Database

> Integration update: `backend/prisma/schema.prisma` is now the canonical executable schema used by Mohith's backend. The SQL in `database/migrations/001_initial_schema.sql` documents Poshika's original relational design and is retained for contribution history; do not apply it after Prisma initialization.

This directory is owned by Poshika and contains the MySQL database foundation for EcoSphere.

## Requirements

- MySQL 8.0.16 or newer (CHECK constraints are enforced from 8.0.16)
- A MySQL account allowed to create a database, tables, indexes, triggers, and views

## Initialize locally

For the integrated application, configure `backend/.env`, then run:

```powershell
cd backend
npm install
npm run db:generate
npm run db:push
npm run db:seed
```

The seed creates development identity/RBAC configuration only and no ESG transactions or metrics.

## Legacy SQL initialization

From PowerShell, run the interactive initializer (it prompts securely for the MySQL password):

```powershell
./database/init.ps1
```

The migration creates the `ecosphere` database. The seed inserts only system roles, permissions, and role-permission mappings. It deliberately creates no organization, user, ESG activity, score, leaderboard entry, or other business transaction.

If your administrative MySQL username is not `root`, use `./database/init.ps1 -MySqlUser your_user`.

## Integration contract

- Every organization-owned query must filter by `organization_id`.
- Department-scoped authorization is represented by `user_roles.scope_type` and `user_roles.department_id`.
- Password hashes belong in `users.password_hash`; plaintext passwords are forbidden.
- Point balances must be derived from `point_ledger`, never edited directly on a user.
- Carbon totals derive from `carbon_transactions.calculated_co2e_kg`.
- ESG results remain absent until sufficient source metrics exist; do not create placeholder score rows.
- Evidence files are stored externally or locally by the backend; `evidence_files` stores metadata and a storage reference only.
- Application services should wrap reward redemption, approvals, and resulting ledger/notification writes in database transactions.

## Migration ownership

SQL migrations are canonical database artifacts owned here. Mohith can mirror this design in Prisma, while schema-changing pull requests should be coordinated with Poshika to keep SQL constraints and Prisma migrations aligned.
