const { AppError } = require('../../shared/AppError');

const DEFAULT_WEIGHTS = Object.freeze({ environmental: 40, social: 30, governance: 30 });

class SettingsService {
  constructor(repositories, auditLog) {
    this.repositories = repositories;
    this.auditLog = auditLog;
  }

  async scoringWeights(context) {
    const setting = await this.repositories.settings.findFirst(context, { where: { key: 'esg.scoringWeights' } });
    return setting?.value || DEFAULT_WEIGHTS;
  }

  async updateScoringWeights(context, weights) {
    const values = ['environmental', 'social', 'governance'].map((key) => Number(weights[key]));
    if (values.some((value) => !Number.isFinite(value) || value < 0) || values.reduce((sum, value) => sum + value, 0) !== 100) {
      throw AppError.badRequest('ESG scoring weights must be non-negative and total exactly 100.');
    }
    const current = await this.repositories.settings.findFirst(context, { where: { key: 'esg.scoringWeights' } });
    const setting = current
      ? await this.repositories.settings.update(context, current.id, { value: weights, updatedById: context.userId })
      : await this.repositories.settings.create(context, { key: 'esg.scoringWeights', value: weights, createdById: context.userId });
    await this.auditLog.record(context, { action: 'ESG_SCORING_WEIGHTS_UPDATED', entityType: 'SETTING', entityId: setting.id, after: setting });
    return setting.value;
  }

  calculateOverall(moduleScores, weights) {
    const scores = ['environmental', 'social', 'governance'].map((key) => moduleScores[key]);
    if (scores.some((score) => score === null || score === undefined || !Number.isFinite(Number(score)))) return null;
    return Number((Number(moduleScores.environmental) * Number(weights.environmental) / 100 + Number(moduleScores.social) * Number(weights.social) / 100 + Number(moduleScores.governance) * Number(weights.governance) / 100).toFixed(2));
  }
}

module.exports = { SettingsService, DEFAULT_WEIGHTS };
