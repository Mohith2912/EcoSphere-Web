const { createPrismaClient } = require('./infrastructure/prisma');
const { makeRepositories } = require('./infrastructure/repositories');
const { AuditLogService } = require('./modules/audit/audit-log.service');
const { NotificationService } = require('./modules/notifications/notification.service');
const { EnvironmentService } = require('./modules/environment/environment.service');
const { GamificationService } = require('./modules/gamification/gamification.service');
const { SocialService } = require('./modules/social/social.service');
const { GovernanceService } = require('./modules/governance/governance.service');
const { ReportService } = require('./modules/reports/report.service');
const { AuthService } = require('./modules/auth/auth.service');
const { UsersService } = require('./modules/users/users.service');
const { SettingsService } = require('./modules/settings/settings.service');

function createContainer({ prisma = createPrismaClient() } = {}) {
  const repositories = makeRepositories(prisma);
  const auditLog = new AuditLogService(repositories);
  const notifications = new NotificationService(repositories);
  const environment = new EnvironmentService(repositories, auditLog);
  const gamification = new GamificationService(repositories, auditLog, notifications);
  const social = new SocialService(repositories, auditLog, gamification);
  const governance = new GovernanceService(repositories, auditLog, notifications);
  return {
    prisma, repositories, auth: new AuthService(repositories), users: new UsersService(repositories, auditLog, notifications),
    environment, social, governance, gamification, notifications, settings: new SettingsService(repositories, auditLog),
    reports: new ReportService(repositories, environment, social, governance)
  };
}

module.exports = { createContainer };
