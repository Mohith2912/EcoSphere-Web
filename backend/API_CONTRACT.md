# EcoSphere REST API Contract

Base URL: `/api`. Protected endpoints require `Authorization: Bearer <accessToken>`. Successful responses use `{ "data": ... }`; failures use `{ "error": { "code", "message", "details?" } }`.

## Authentication and organization

| Method | Path | Permission | Purpose |
|---|---|---|---|
| POST | `/auth/login` | Public | `{email,password,organizationCode?}` → token, user profile, and default portal route |
| GET | `/auth/me` | Authenticated | Current verified profile, roles, and effective permissions |
| GET | `/users` | `users.manage` | Organization-scoped users, without password hashes |
| GET/POST | `/users/departments` | `users.manage` | List or create departments |
| PATCH | `/users/departments/:id` | `users.manage` | Update a department |
| POST | `/users/role-requests` | Authenticated | Request a privileged role with optional evidence |
| GET | `/users/role-requests` | `roles.approve` | Pending role requests |
| PATCH | `/users/role-requests/:id/review` | `roles.approve` | Approve/reject a request; approval creates a role assignment |

There is intentionally no self-service admin registration endpoint. An organization owner must be seeded/invited through the database/integration flow.

## Environmental

| Method | Path | Permission |
|---|---|---|
| GET | `/environment/dashboard` | `environment.view` |
| GET/POST | `/environment/emission-factors` | `environment.manage` |
| PATCH | `/environment/emission-factors/:id` | `environment.manage` |
| GET/POST | `/environment/carbon-transactions` | view/manage |
| POST | `/environment/operational-events/carbon` | `environment.manage` — automatic source |
| GET/PATCH | `/environment/settings/auto-calculation` | `environment.manage` — organization scope required |
| GET/POST | `/environment/goals` | view/manage |
| PATCH | `/environment/goals/:id` | `environment.manage` |
| GET/POST | `/environment/product-esg-profiles` | view/manage |
| PATCH | `/environment/product-esg-profiles/:id` | `environment.manage` |

Carbon creation expects `emissionFactorId`, `activityAmount`, and optional matching `unit`; the server calculates `calculatedCo2e = activityAmount × co2ePerUnit`.
`POST /environment/operational-events/carbon` only runs after an authorized user enables auto calculation through the setting endpoint.

## Social

| Method | Path | Permission |
|---|---|---|
| GET | `/social/dashboard` | `social.view` |
| GET | `/social/csr-activities` | `social.participate` — active activities only |
| GET | `/social/csr-activities/manage` | `social.manage` — all statuses |
| POST/PATCH | `/social/csr-activities[/:id]` | `social.manage` |
| POST | `/social/csr-activities/:id/participations` | `social.participate` |
| GET | `/social/my-participations` | `social.participate` |
| PATCH | `/social/participations/:id/review` | `social.approve` |

Participation review accepts `APPROVED` or `REJECTED`. Rejection needs a note. Approval requires evidence when its CSR activity requires evidence, then writes legitimate XP/points ledger entries.

## Governance

| Method | Path | Permission |
|---|---|---|
| GET | `/governance/dashboard` | `governance.view` |
| GET | `/governance/policies/assigned` | `governance.view` |
| GET | `/governance/policies/manage` | `governance.manage` |
| POST/PATCH | `/governance/policies[/:id]` | `governance.manage` |
| POST | `/governance/policies/:id/acknowledgements` | `governance.acknowledge` |
| GET | `/governance/my-acknowledgements` | `governance.acknowledge` |
| GET/POST/PATCH | `/governance/audits[/:id]` | `governance.audit` |
| GET/POST/PATCH | `/governance/compliance-issues[/:id]` | view/manage |
| POST | `/governance/compliance-issues/refresh-overdue` | `governance.manage` |

Every compliance issue requires `ownerId`, `dueDate`, `severity`, and `description`. List/dashboard responses calculate overdue status live; the refresh endpoint persists `OVERDUE` and notifies owners.

## Gamification

| Method | Path | Permission |
|---|---|---|
| GET | `/gamification/challenges` | `gamification.participate` |
| GET | `/gamification/challenges/manage` | `gamification.manage` |
| POST/PATCH | `/gamification/challenges[/:id]` | `gamification.manage` |
| POST | `/gamification/challenges/:id/participations` | `gamification.participate` |
| PATCH | `/gamification/participations/:id/submit` | `gamification.participate` |
| PATCH | `/gamification/participations/:id/review` | `gamification.approve` |
| GET | `/gamification/my-progress` | `gamification.view` |
| GET | `/gamification/leaderboard?type=employee|department` | `gamification.view` |
| GET/POST | `/gamification/badges` | view/manage |
| GET/POST | `/gamification/rewards` | view/manage |
| POST | `/gamification/rewards/:id/redemptions` | `gamification.participate` |

The leaderboard has no seeded rows: its empty response includes `No rankings available yet.` Reward redemption atomically verifies status, stock, and points, then deducts points and stock.

## Notifications, overview, and reports

- `GET /notifications?unreadOnly=true` and `PATCH /notifications/:id/read` are private to the authenticated recipient.
- `GET /overview` returns only modules the current role can view and returns an unavailable ESG score without a scoring configuration.
- `GET/PATCH /settings/esg-scoring` requires `settings.manage`; its weights must total exactly 100. The setting never manufactures module scores.
- `GET /reports/:type?scope=PERSONAL|DEPARTMENT|ORGANIZATION`, where type is `ENVIRONMENTAL`, `SOCIAL`, `GOVERNANCE`, or `ESG_SUMMARY`.
- `GET /reports/:type/export.csv?scope=...` streams a CSV of authorized persisted records. PDF/XLSX rendering can be added by Poshika during integration without changing report authorization or service data.
