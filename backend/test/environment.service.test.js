const test = require('node:test');
const assert = require('node:assert/strict');
const { EnvironmentService } = require('../src/modules/environment/environment.service');

function repository(items = []) {
  return {
    items,
    async findById(_context, id) {
      const record = items.find((item) => item.id === id);
      if (!record) throw new Error('not found');
      return record;
    },
    async create(context, data) {
      const created = { id: String(items.length + 1), organizationId: context.organizationId, ...data };
      items.push(created);
      return created;
    },
    async findMany(_context, _args) { return items; }
  };
}

const context = {
  userId: 'user-1', organizationId: 'org-1', departmentId: 'department-1',
  permissions: { 'environment.manage': ['ORGANIZATION'], 'environment.view': ['ORGANIZATION'] }
};

test('carbon emissions are calculated from amount times configured factor', async () => {
  const factors = repository([{ id: 'factor-1', organizationId: 'org-1', activityType: 'DIESEL', unit: 'litre', co2ePerUnit: 2.68, status: 'ACTIVE' }]);
  const transactions = repository();
  const service = new EnvironmentService({ emissionFactors: factors, carbonTransactions: transactions, environmentalGoals: repository() }, { record: async () => undefined });

  const result = await service.createCarbonTransaction(context, { emissionFactorId: 'factor-1', activityAmount: 100, unit: 'litre' });

  assert.equal(result.calculatedCo2e, 268);
  assert.equal(result.activityType, 'DIESEL');
  assert.equal(result.organizationId, 'org-1');
});

test('environment dashboard leaves ESG score uncalculated without a documented scoring configuration', async () => {
  const service = new EnvironmentService({ carbonTransactions: repository(), environmentalGoals: repository() }, { record: async () => undefined });
  const dashboard = await service.dashboard(context);
  assert.equal(dashboard.totalEmissions, 0);
  assert.equal(dashboard.environmentalScore, null);
  assert.equal(dashboard.scoreStatus, 'NOT_CALCULATED');
});
