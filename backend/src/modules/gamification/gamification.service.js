const { AppError } = require('../../shared/AppError');
const { asNumber, scopeWhere, sum } = require('../../shared/scoping');
const { assertScopedAccess } = require('../../middleware/auth');

class GamificationService {
  constructor(repositories, auditLog, notifications) {
    this.repositories = repositories;
    this.auditLog = auditLog;
    this.notifications = notifications;
  }

  async createChallenge(context, input) {
    const challenge = await this.repositories.challenges.create(context, {
      ...input, xp: asNumber(input.xp, 'xp'), points: asNumber(input.points ?? input.xp, 'points'),
      status: input.status || 'DRAFT', evidenceRequired: Boolean(input.evidenceRequired), createdById: context.userId
    });
    await this.auditLog.record(context, { action: 'CHALLENGE_CREATED', entityType: 'CHALLENGE', entityId: challenge.id, after: challenge });
    return challenge;
  }

  async updateChallenge(context, id, input) {
    const before = await this.repositories.challenges.findById(context, id);
    const challenge = await this.repositories.challenges.update(context, id, {
      ...input, ...(input.xp !== undefined ? { xp: asNumber(input.xp, 'xp') } : {}), ...(input.points !== undefined ? { points: asNumber(input.points, 'points') } : {}), updatedById: context.userId
    });
    await this.auditLog.record(context, { action: 'CHALLENGE_UPDATED', entityType: 'CHALLENGE', entityId: id, before, after: challenge });
    return challenge;
  }

  async listChallenges(context, includeDrafts = false) {
    return this.repositories.challenges.findMany(context, {
      where: includeDrafts ? {} : { status: 'ACTIVE' }, orderBy: { deadline: 'asc' }
    });
  }

  async joinChallenge(context, challengeId) {
    const challenge = await this.repositories.challenges.findById(context, challengeId);
    if (challenge.status !== 'ACTIVE') throw AppError.conflict('Only active challenges can be joined.');
    if (challenge.deadline && new Date(challenge.deadline) < new Date()) throw AppError.conflict('This challenge has passed its deadline.');
    const existing = await this.repositories.challengeParticipations.findFirst(context, { where: { challengeId, userId: context.userId } });
    if (existing) return existing;
    return this.repositories.challengeParticipations.create(context, {
      challengeId, userId: context.userId, departmentId: context.departmentId || null, status: 'JOINED', joinedAt: new Date()
    });
  }

  async submitChallenge(context, participationId, input) {
    const participation = await this.repositories.challengeParticipations.findById(context, participationId, { include: { challenge: true } });
    if (participation.userId !== context.userId) throw AppError.forbidden('You can only submit your own challenge participation.');
    if (['APPROVED', 'REJECTED'].includes(participation.status)) throw AppError.conflict('This participation has already been reviewed.');
    if (participation.challenge.evidenceRequired && !input.evidenceUrl) throw AppError.badRequest('Evidence is required for this challenge.');
    return this.repositories.challengeParticipations.update(context, participationId, {
      evidenceUrl: input.evidenceUrl || null, notes: input.notes || null, submittedAt: new Date(), status: 'PENDING_REVIEW'
    });
  }

  async reviewChallenge(context, participationId, { decision, reviewNote }) {
    const participation = await this.repositories.challengeParticipations.findById(context, participationId, { include: { challenge: true } });
    assertScopedAccess(context, participation, { permission: 'gamification.approve', ownFields: [] });
    if (participation.userId === context.userId) throw AppError.forbidden('You cannot approve or reject your own participation.');
    if (participation.status !== 'PENDING_REVIEW') throw AppError.conflict('Only submitted participations can be reviewed.');
    if (!['APPROVED', 'REJECTED'].includes(decision)) throw AppError.badRequest('Decision must be APPROVED or REJECTED.');
    if (decision === 'REJECTED' && !reviewNote) throw AppError.badRequest('A rejection note is required.');

    let reviewed;
    await this.repositories.transaction(async (tx) => {
      reviewed = await tx.challengeParticipations.update(context, participationId, {
        status: decision, reviewNote: reviewNote || null, reviewedById: context.userId, reviewedAt: new Date(), completedAt: decision === 'APPROVED' ? new Date() : null
      });
      if (decision === 'APPROVED') {
        await this.awardWithin(tx, context, {
          userId: participation.userId, departmentId: participation.departmentId, sourceType: 'CHALLENGE', sourceId: participation.id,
          xpAmount: Number(participation.challenge.xp), pointsAmount: Number(participation.challenge.points)
        });
      }
      await tx.notifications.create(context, {
        userId: participation.userId,
        type: decision === 'APPROVED' ? 'CHALLENGE_APPROVED' : 'CHALLENGE_REJECTED',
        title: `Challenge submission ${decision.toLowerCase()}`,
        body: participation.challenge.title, resourceType: 'CHALLENGE_PARTICIPATION', resourceId: participation.id, readAt: null
      });
    });
    await this.auditLog.record(context, { action: `CHALLENGE_PARTICIPATION_${decision}`, entityType: 'CHALLENGE_PARTICIPATION', entityId: participationId, after: reviewed });
    return reviewed;
  }

  async awardWithin(repositories, context, award) {
    const existing = await repositories.xpLedger.findFirst(context, { where: { sourceType: award.sourceType, sourceId: String(award.sourceId), userId: award.userId } });
    if (existing) return { ledger: existing, badges: [] };
    const ledger = await repositories.xpLedger.create(context, {
      userId: award.userId, departmentId: award.departmentId || null, sourceType: award.sourceType, sourceId: String(award.sourceId),
      xpAmount: asNumber(award.xpAmount, 'xpAmount'), pointsAmount: asNumber(award.pointsAmount, 'pointsAmount'), awardedById: context.userId
    });
    const badges = await this.evaluateBadgesWithin(repositories, context, award.userId, award.departmentId);
    return { ledger, badges };
  }

  async evaluateBadgesWithin(repositories, context, userId, departmentId) {
    const [ledgerEntries, approvedParticipations, badges] = await Promise.all([
      repositories.xpLedger.findMany(context, { where: { userId } }),
      repositories.challengeParticipations.findMany(context, { where: { userId, status: 'APPROVED' } }),
      repositories.badges.findMany(context, { where: { status: 'ACTIVE' } })
    ]);
    const totalXp = sum(ledgerEntries, 'xpAmount');
    const unlocked = [];
    for (const badge of badges) {
      const rule = badge.unlockRule || {};
      const requiredXp = Number(rule.minXp || 0);
      const requiredChallenges = Number(rule.completedChallenges || 0);
      if (totalXp < requiredXp || approvedParticipations.length < requiredChallenges) continue;
      const existing = await repositories.userBadges.findFirst(context, { where: { userId, badgeId: badge.id } });
      if (existing) continue;
      const userBadge = await repositories.userBadges.create(context, { userId, badgeId: badge.id, departmentId: departmentId || null, awardedAt: new Date(), awardedById: context.userId });
      await repositories.notifications.create(context, { userId, type: 'BADGE_UNLOCKED', title: 'Badge unlocked', body: badge.name, resourceType: 'BADGE', resourceId: badge.id, readAt: null });
      unlocked.push(userBadge);
    }
    return unlocked;
  }

  async createBadge(context, input) {
    return this.repositories.badges.create(context, { ...input, unlockRule: input.unlockRule, status: input.status || 'ACTIVE', createdById: context.userId });
  }

  async listBadges(context) { return this.repositories.badges.findMany(context, { where: { status: 'ACTIVE' }, orderBy: { name: 'asc' } }); }

  async createReward(context, input) {
    return this.repositories.rewards.create(context, {
      ...input, pointsRequired: asNumber(input.pointsRequired, 'pointsRequired'), stock: asNumber(input.stock, 'stock'), status: input.status || 'ACTIVE', createdById: context.userId
    });
  }

  async listRewards(context) { return this.repositories.rewards.findMany(context, { where: { status: 'ACTIVE' }, orderBy: { pointsRequired: 'asc' } }); }

  async redeemReward(context, rewardId) {
    let redemption;
    await this.repositories.transaction(async (tx) => {
      const reward = await tx.rewards.findById(context, rewardId);
      if (reward.status !== 'ACTIVE') throw AppError.conflict('This reward is not active.');
      if (Number(reward.stock) < 1) throw AppError.conflict('This reward is out of stock.');
      const ledger = await tx.xpLedger.findMany(context, { where: { userId: context.userId } });
      const pointsBalance = sum(ledger, 'pointsAmount');
      if (pointsBalance < Number(reward.pointsRequired)) throw AppError.conflict('You do not have enough points for this reward.');
      await tx.rewards.update(context, rewardId, { stock: Number(reward.stock) - 1, updatedById: context.userId });
      redemption = await tx.rewardRedemptions.create(context, {
        rewardId, userId: context.userId, departmentId: context.departmentId || null, pointsSpent: Number(reward.pointsRequired), status: 'REQUESTED', redeemedAt: new Date()
      });
      await tx.xpLedger.create(context, {
        userId: context.userId, departmentId: context.departmentId || null, sourceType: 'REWARD_REDEMPTION', sourceId: String(redemption.id), xpAmount: 0, pointsAmount: -Number(reward.pointsRequired), awardedById: context.userId
      });
      await tx.notifications.create(context, { userId: context.userId, type: 'REWARD_REDEEMED', title: 'Reward redemption received', body: reward.name, resourceType: 'REWARD_REDEMPTION', resourceId: redemption.id, readAt: null });
    });
    await this.auditLog.record(context, { action: 'REWARD_REDEEMED', entityType: 'REWARD_REDEMPTION', entityId: redemption.id, after: redemption });
    return redemption;
  }

  async myProgress(context) {
    const [ledger, badges, participations] = await Promise.all([
      this.repositories.xpLedger.findMany(context, { where: { userId: context.userId } }),
      this.repositories.userBadges.findMany(context, { where: { userId: context.userId }, include: { badge: true } }),
      this.repositories.challengeParticipations.findMany(context, { where: { userId: context.userId }, include: { challenge: true }, orderBy: { joinedAt: 'desc' } })
    ]);
    return { xp: sum(ledger, 'xpAmount'), points: sum(ledger, 'pointsAmount'), badges, participations };
  }

  async leaderboard(context, type = 'employee') {
    const visible = scopeWhere(context, 'gamification.view');
    const ledger = await this.repositories.xpLedger.findMany(context, { where: visible });
    const key = type === 'department' ? 'departmentId' : 'userId';
    const totals = new Map();
    for (const entry of ledger) {
      if (!entry[key]) continue;
      totals.set(entry[key], (totals.get(entry[key]) || 0) + Number(entry.xpAmount || 0));
    }
    const rows = [...totals.entries()].map(([id, xp]) => ({ [key]: id, xp })).sort((a, b) => b.xp - a.xp).map((row, index) => ({ ...row, rank: index + 1 }));
    return { type, entries: rows, empty: rows.length === 0, emptyMessage: rows.length ? null : 'No rankings available yet.' };
  }
}

module.exports = { GamificationService };
