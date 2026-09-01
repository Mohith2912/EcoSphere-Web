class AuditLogService {
  constructor(repositories) { this.repositories = repositories; }

  async record(context, { action, entityType, entityId, before, after, actorId }) {
    return this.repositories.auditLogs.create(context, {
      action, entityType, entityId: String(entityId), actorId: actorId || context.userId,
      before: before || null, after: after || null
    });
  }
}

module.exports = { AuditLogService };
