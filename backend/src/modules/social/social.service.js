const { AppError } = require('../../shared/AppError');
const { scopeWhere } = require('../../shared/scoping');
const { assertScopedAccess } = require('../../middleware/auth');

class SocialService {
  constructor(repositories, auditLog, gamification) {
    this.repositories = repositories;
    this.auditLog = auditLog;
    this.gamification = gamification;
  }

  async createActivity(context, input) {
    const activity = await this.repositories.csrActivities.create(context, {
      ...input, departmentId: input.departmentId || null, evidenceRequired: Boolean(input.evidenceRequired), status: input.status || 'DRAFT', createdById: context.userId
    });
    await this.auditLog.record(context, { action: 'CSR_ACTIVITY_CREATED', entityType: 'CSR_ACTIVITY', entityId: activity.id, after: activity });
    return activity;
  }

  async updateActivity(context, id, input) {
    const before = await this.repositories.csrActivities.findById(context, id);
    const activity = await this.repositories.csrActivities.update(context, id, { ...input, updatedById: context.userId });
    await this.auditLog.record(context, { action: 'CSR_ACTIVITY_UPDATED', entityType: 'CSR_ACTIVITY', entityId: id, before, after: activity });
    return activity;
  }

  async listActivities(context, manage = false) {
    return this.repositories.csrActivities.findMany(context, { where: manage ? {} : { status: 'ACTIVE' }, orderBy: { startsAt: 'asc' } });
  }

  async participate(context, activityId, input) {
    const activity = await this.repositories.csrActivities.findById(context, activityId);
    if (activity.status !== 'ACTIVE') throw AppError.conflict('This CSR activity is not active.');
    if (activity.departmentId && activity.departmentId !== context.departmentId) throw AppError.forbidden('This CSR activity is not available to your department.');
    if (activity.evidenceRequired && !input.evidenceUrl) throw AppError.badRequest('Evidence is required for this CSR activity.');
    const existing = await this.repositories.csrParticipations.findFirst(context, { where: { activityId, userId: context.userId } });
    if (existing) throw AppError.conflict('You already have a participation record for this activity.');
    return this.repositories.csrParticipations.create(context, {
      activityId, userId: context.userId, departmentId: context.departmentId || null, evidenceUrl: input.evidenceUrl || null, notes: input.notes || null,
      status: 'PENDING', submittedAt: new Date()
    });
  }

  async reviewParticipation(context, participationId, { decision, reviewNote }) {
    const participation = await this.repositories.csrParticipations.findById(context, participationId, { include: { activity: true } });
    assertScopedAccess(context, participation, { permission: 'social.approve', ownFields: [] });
    if (participation.userId === context.userId) throw AppError.forbidden('You cannot approve or reject your own CSR participation.');
    if (participation.status !== 'PENDING') throw AppError.conflict('Only pending CSR participations can be reviewed.');
    if (!['APPROVED', 'REJECTED'].includes(decision)) throw AppError.badRequest('Decision must be APPROVED or REJECTED.');
    if (participation.activity.evidenceRequired && !participation.evidenceUrl) throw AppError.badRequest('Evidence is required before this participation can be approved.');
    if (decision === 'REJECTED' && !reviewNote) throw AppError.badRequest('A rejection note is required.');
    let reviewed;
    await this.repositories.transaction(async (tx) => {
      reviewed = await tx.csrParticipations.update(context, participationId, {
        status: decision, reviewNote: reviewNote || null, reviewedById: context.userId, reviewedAt: new Date(), completionDate: decision === 'APPROVED' ? new Date() : null
      });
      if (decision === 'APPROVED') {
        await this.gamification.awardWithin(tx, context, {
          userId: participation.userId, departmentId: participation.departmentId, sourceType: 'CSR_PARTICIPATION', sourceId: participation.id,
          xpAmount: Number(participation.activity.xpAward || 0), pointsAmount: Number(participation.activity.pointsAward || 0)
        });
      }
      await tx.notifications.create(context, {
        userId: participation.userId, type: decision === 'APPROVED' ? 'CSR_APPROVED' : 'CSR_REJECTED',
        title: `CSR participation ${decision.toLowerCase()}`, body: participation.activity.title,
        resourceType: 'CSR_PARTICIPATION', resourceId: participation.id, readAt: null
      });
    });
    await this.auditLog.record(context, { action: `CSR_PARTICIPATION_${decision}`, entityType: 'CSR_PARTICIPATION', entityId: participationId, after: reviewed });
    return reviewed;
  }

  async myParticipations(context) {
    return this.repositories.csrParticipations.findMany(context, { where: { userId: context.userId }, include: { activity: true }, orderBy: { submittedAt: 'desc' } });
  }

  async dashboard(context) {
    const visible = scopeWhere(context, 'social.view');
    const participations = await this.repositories.csrParticipations.findMany(context, { where: visible });
    const approved = participations.filter((item) => item.status === 'APPROVED');
    return {
      csrParticipationCount: participations.length,
      approvedParticipationCount: approved.length,
      pendingApprovalCount: participations.filter((item) => item.status === 'PENDING').length,
      socialScore: null,
      scoreStatus: 'NOT_CALCULATED',
      scoreMessage: 'Not Calculated — sufficient social scoring configuration is not available.'
    };
  }
}

module.exports = { SocialService };
