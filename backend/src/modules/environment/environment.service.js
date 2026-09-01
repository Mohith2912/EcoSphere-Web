const { AppError } = require('../../shared/AppError');
const { asNumber, scopeWhere, sum } = require('../../shared/scoping');

function requireOrganizationScope(context, permission) {
  if (!(context.permissions[permission] || []).includes('ORGANIZATION')) throw AppError.forbidden('This configuration action requires organization-wide authority.');
}

class EnvironmentService {
  constructor(repositories, auditLog) {
    this.repositories = repositories;
    this.auditLog = auditLog;
  }

  async listFactors(context, query = {}) {
    return this.repositories.emissionFactors.findMany(context, {
      where: { status: 'ACTIVE', ...(query.activityType ? { activityType: query.activityType } : {}) },
      orderBy: { activityType: 'asc' }
    });
  }

  async createFactor(context, input) {
    requireOrganizationScope(context, 'environment.manage');
    const factor = await this.repositories.emissionFactors.create(context, {
      ...input, co2ePerUnit: asNumber(input.co2ePerUnit, 'co2ePerUnit'), status: input.status || 'ACTIVE', createdById: context.userId
    });
    await this.auditLog.record(context, { action: 'EMISSION_FACTOR_CREATED', entityType: 'EMISSION_FACTOR', entityId: factor.id, after: factor });
    return factor;
  }

  async updateFactor(context, id, input) {
    requireOrganizationScope(context, 'environment.manage');
    const before = await this.repositories.emissionFactors.findById(context, id);
    const factor = await this.repositories.emissionFactors.update(context, id, {
      ...input, ...(input.co2ePerUnit !== undefined ? { co2ePerUnit: asNumber(input.co2ePerUnit, 'co2ePerUnit') } : {}), updatedById: context.userId
    });
    await this.auditLog.record(context, { action: 'EMISSION_FACTOR_UPDATED', entityType: 'EMISSION_FACTOR', entityId: id, before, after: factor });
    return factor;
  }

  async createCarbonTransaction(context, input, source = 'MANUAL') {
    const scopes = context.permissions['environment.manage'] || [];
    if (!scopes.includes('ORGANIZATION') && input.departmentId && input.departmentId !== context.departmentId) throw AppError.forbidden('You can only create carbon records for your department.');
    const activityAmount = asNumber(input.activityAmount, 'activityAmount');
    const factor = await this.repositories.emissionFactors.findById(context, input.emissionFactorId);
    if (factor.status !== 'ACTIVE') throw AppError.conflict('The selected emission factor is not active.');
    if (input.unit && factor.unit !== input.unit) throw AppError.badRequest('The activity unit does not match the emission factor unit.');
    const calculatedCo2e = Number((activityAmount * Number(factor.co2ePerUnit)).toFixed(6));
    const transaction = await this.repositories.carbonTransactions.create(context, {
      departmentId: input.departmentId || context.departmentId || null,
      emissionFactorId: factor.id,
      activityType: factor.activityType,
      unit: factor.unit,
      activityAmount,
      calculatedCo2e,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
      source,
      verificationStatus: source === 'AUTOMATED' ? 'AUTO_VERIFIED' : 'PENDING',
      createdById: context.userId,
      evidenceUrl: input.evidenceUrl || null,
      reference: input.reference || null
    });
    await this.auditLog.record(context, { action: 'CARBON_TRANSACTION_CREATED', entityType: 'CARBON_TRANSACTION', entityId: transaction.id, after: transaction });
    return transaction;
  }

  async processOperationalCarbonEvent(context, input) {
    const setting = await this.repositories.settings.findFirst(context, { where: { key: 'environment.autoCalculation' } });
    if (setting?.value?.enabled !== true) throw AppError.conflict('Auto emission calculation is disabled for this organization.');
    return this.createCarbonTransaction(context, input, 'AUTOMATED');
  }

  async autoCalculationSetting(context) {
    const setting = await this.repositories.settings.findFirst(context, { where: { key: 'environment.autoCalculation' } });
    return { enabled: setting?.value?.enabled === true };
  }

  async updateAutoCalculationSetting(context, enabled) {
    requireOrganizationScope(context, 'environment.manage');
    const current = await this.repositories.settings.findFirst(context, { where: { key: 'environment.autoCalculation' } });
    const setting = current
      ? await this.repositories.settings.update(context, current.id, { value: { enabled: Boolean(enabled) }, updatedById: context.userId })
      : await this.repositories.settings.create(context, { key: 'environment.autoCalculation', value: { enabled: Boolean(enabled) }, createdById: context.userId });
    await this.auditLog.record(context, { action: 'AUTO_EMISSION_CALCULATION_SETTING_UPDATED', entityType: 'SETTING', entityId: setting.id, after: setting });
    return { enabled: setting.value.enabled };
  }

  async listTransactions(context, query = {}) {
    const visible = scopeWhere(context, 'environment.view', { userField: 'createdById' });
    return this.repositories.carbonTransactions.findMany(context, {
      where: { ...visible, ...(query.departmentId ? { departmentId: query.departmentId } : {}) },
      orderBy: { occurredAt: 'desc' }
    });
  }

  async upsertGoal(context, input, id) {
    const existing = id ? await this.repositories.environmentalGoals.findById(context, id) : null;
    const data = {
      ...input,
      targetValue: asNumber(input.targetValue ?? existing?.targetValue, 'targetValue'),
      currentValue: asNumber(input.currentValue ?? existing?.currentValue ?? 0, 'currentValue'),
      updatedById: context.userId
    };
    const goal = id
      ? await this.repositories.environmentalGoals.update(context, id, data)
      : await this.repositories.environmentalGoals.create(context, { ...data, status: input.status || 'ACTIVE', createdById: context.userId });
    await this.auditLog.record(context, { action: id ? 'ENVIRONMENTAL_GOAL_UPDATED' : 'ENVIRONMENTAL_GOAL_CREATED', entityType: 'ENVIRONMENTAL_GOAL', entityId: goal.id, after: goal });
    return goal;
  }

  async listGoals(context) {
    return this.repositories.environmentalGoals.findMany(context, { where: { status: 'ACTIVE' }, orderBy: { createdAt: 'desc' } });
  }

  async listProductProfiles(context) {
    return this.repositories.productEsgProfiles.findMany(context, { orderBy: { productName: 'asc' } });
  }

  async upsertProductProfile(context, input, id) {
    requireOrganizationScope(context, 'environment.manage');
    const data = { ...input, updatedById: context.userId };
    const profile = id
      ? await this.repositories.productEsgProfiles.update(context, id, data)
      : await this.repositories.productEsgProfiles.create(context, { ...data, createdById: context.userId });
    await this.auditLog.record(context, { action: id ? 'PRODUCT_ESG_PROFILE_UPDATED' : 'PRODUCT_ESG_PROFILE_CREATED', entityType: 'PRODUCT_ESG_PROFILE', entityId: profile.id, after: profile });
    return profile;
  }

  async dashboard(context) {
    const visible = scopeWhere(context, 'environment.view', { userField: 'createdById' });
    const [transactions, goals] = await Promise.all([
      this.repositories.carbonTransactions.findMany(context, { where: visible }),
      this.repositories.environmentalGoals.findMany(context, { where: { status: 'ACTIVE' } })
    ]);
    const totalEmissions = sum(transactions, 'calculatedCo2e');
    return {
      carbonTransactionCount: transactions.length,
      totalEmissions,
      unit: 'kgCO2e',
      goals: goals.map((goal) => ({ ...goal, progressPercent: goal.targetValue > 0 ? Number(((Number(goal.currentValue || 0) / Number(goal.targetValue)) * 100).toFixed(2)) : null })),
      environmentalScore: null,
      scoreStatus: 'NOT_CALCULATED',
      scoreMessage: 'Not Calculated — insufficient ESG data.'
    };
  }
}

module.exports = { EnvironmentService };
