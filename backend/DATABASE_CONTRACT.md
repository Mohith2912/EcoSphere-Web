# Database Contract for Poshika

This backend assumes Prisma delegates named in lower camel case. Poshika owns the Prisma schema, migrations, MySQL database, and generated client; do not add migrations from the backend branch without her ownership.

## Required common fields

All tenant business entities listed below require `id`, `organizationId`, `createdAt`, and `updatedAt`. `organizationId` must reference `Organization`; index it with the entity's common filters. IDs may be UUID/CUID strings.

`Organization`: `id`, `name`, `code` (unique), `status`. `Department`: `organizationId`, `name`, `code`, `parentDepartmentId?`, `headUserId?`, `status`. Its code should be unique per organization.

`User`: `organizationId`, `departmentId?`, `email`, `passwordHash`, `firstName`, `lastName`, `employeeId?`, `status`; unique `(organizationId,email)`. Relations: `organization`, `department`, `userRoles`.

## RBAC models

`Role`: `organizationId`, `code`, `name`, `status`; unique `(organizationId,code)`.

`Permission`: `organizationId`, `code`, `name`; seed the codes from `src/config/permissions.js` for each organization, or make this global and adapt the repository contract consistently.

`RolePermission`: `roleId`, `permissionId`, `scope` (`OWN|DEPARTMENT|ORGANIZATION`), relation names `rolePermissions` on Role and `permission` on RolePermission.

`UserRole`: `organizationId`, `userId`, `roleId`, `scope`, `status`, `assignedById?`, `assignedAt?`; relation name `userRoles` on User and `role` on UserRole.

`RoleRequest`: `organizationId`, `userId`, `requestedRoleCode`, `evidenceUrl?`, `justification?`, `status`, `requestedAt`, `reviewedById?`, `reviewedAt?`, `reviewNote?`.

## Environmental models

- `EmissionFactor`: `activityType`, `unit`, `co2ePerUnit` (Decimal), `source?`, `effectiveFrom?`, `effectiveTo?`, `status`, `createdById?`, `updatedById?`.
- `CarbonTransaction`: `departmentId?`, `emissionFactorId`, `activityType`, `unit`, `activityAmount` (Decimal), `calculatedCo2e` (Decimal), `occurredAt`, `source`, `verificationStatus`, `createdById`, `evidenceUrl?`, `reference?`.
- `EnvironmentalGoal`: `title`, `metric`, `targetValue` (Decimal), `currentValue` (Decimal), `targetDate?`, `departmentId?`, `status`, `createdById?`, `updatedById?`.
- `ProductEsgProfile`: `productName`, `productReference?`, `classification?`, `calculatedCo2e?` (Decimal), `environmentalAttributes?` (JSON), `metadata?` (JSON), `status?`, audit user IDs.

## Social models

- `CsrActivity`: `title`, `description`, `categoryId?`, `departmentId?`, `startsAt?`, `endsAt?`, `location?`, `evidenceRequired`, `xpAward` (Decimal/default 0), `pointsAward` (Decimal/default 0), `status`, `createdById?`, `updatedById?`.
- `CsrParticipation`: `activityId`, `userId`, `departmentId?`, `evidenceUrl?`, `notes?`, `status`, `submittedAt`, `reviewedById?`, `reviewedAt?`, `reviewNote?`, `completionDate?`; relation name `activity`. Unique `(organizationId,activityId,userId)`.

## Governance models

- `Policy`: `title`, `content`, `version`, `departmentId?`, `status`, `publishedAt?`, creator/updater IDs.
- `PolicyAcknowledgement`: `policyId`, `userId`, `policyVersion`, `acknowledgedAt`; relation name `policy`; unique `(organizationId,policyId,userId,policyVersion)`.
- `Audit`: `title`, `scope`, `departmentId?`, `scheduledAt?`, `completedAt?`, `status`, `evidenceUrl?`, `findings?`, creator/updater IDs.
- `ComplianceIssue`: `title`, `description`, `auditId?`, `ownerId`, `departmentId?`, `dueDate`, `severity`, `status`, `evidenceUrl?`, `overdueAt?`, creator/updater IDs. Index `(organizationId,status,dueDate)`.

## Gamification models

- `Challenge`: `title`, `categoryId?`, `description`, `xp` (Decimal), `points` (Decimal), `difficulty?`, `evidenceRequired`, `deadline?`, `status`, audit user IDs.
- `ChallengeParticipation`: `challengeId`, `userId`, `departmentId?`, `status`, `joinedAt`, `evidenceUrl?`, `notes?`, `submittedAt?`, `reviewedById?`, `reviewedAt?`, `reviewNote?`, `completedAt?`; relation name `challenge`; unique `(organizationId,challengeId,userId)`.
- `XpLedger`: `userId`, `departmentId?`, `sourceType`, `sourceId`, `xpAmount` (Decimal), `pointsAmount` (Decimal; permits negatives), `awardedById?`; unique `(organizationId,userId,sourceType,sourceId)`. Never expose a user-write endpoint for this model.
- `Badge`: `name`, `description`, `iconUrl?`, `unlockRule` (JSON with optional `minXp` and `completedChallenges`), `status`.
- `UserBadge`: `userId`, `badgeId`, `departmentId?`, `awardedAt`, `awardedById?`; relation name `badge`; unique `(organizationId,userId,badgeId)`.
- `Reward`: `name`, `description`, `pointsRequired` (Decimal), `stock` (Int), `imageUrl?`, `status`, creator/updater IDs.
- `RewardRedemption`: `rewardId`, `userId`, `departmentId?`, `pointsSpent` (Decimal), `status`, `redeemedAt`.

## Shared supporting models

- `Notification`: `userId`, `type`, `title`, `body`, `resourceType?`, `resourceId?`, `readAt?`; index `(organizationId,userId,readAt,createdAt)`.
- `AuditLog`: `actorId`, `action`, `entityType`, `entityId`, `before?` (JSON), `after?` (JSON).
- `Category`: `name`, `type`, `status` with unique `(organizationId,type,name)`.
- `Setting`: `key` (unique per organization), `value` (JSON), audit user IDs. Required keys are `environment.autoCalculation` with `{ "enabled": boolean }` and `esg.scoringWeights` with `{ "environmental": number, "social": number, "governance": number }`. Until persisted module scores have a separately approved formula/source, dashboards return a null ESG score rather than inventing one.

## Transaction and relation requirements

The backend uses `prisma.$transaction` for CSR approval, challenge approval, role approval, and reward redemption. Relations required by backend includes are: `User.department`, `User.organization`, `User.userRoles → UserRole.role → Role.rolePermissions → RolePermission.permission`, `CsrParticipation.activity`, `ChallengeParticipation.challenge`, `PolicyAcknowledgement.policy`, and `UserBadge.badge`.

Use Decimal-compatible values; services convert them with `Number(...)` for calculation and API output. Keep all timestamps in UTC. The initial business data must be empty/zero—only static RBAC/configuration seed data is permitted.
