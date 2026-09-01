const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
const { createContainer } = require('../src/container');

test('critical ESG workflows persist, automate side effects, reject duplicates, and return to zero state', async () => {
  const container = createContainer();
  const server = createApp(container).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const call = async (path, { token, method = 'GET', body } = {}) => {
    const response = await fetch(`${baseUrl}${path}`, { method, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'content-type': 'application/json' } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { response, payload: await response.json().catch(() => null) };
  };
  const login = async (email, password) => (await call('/api/auth/login', { method: 'POST', body: { email, password } })).payload.data.accessToken;
  const adminToken = await login('admin@ecosphere.local', 'Admin@1234');
  const employeeToken = await login('employee@ecosphere.local', 'Employee@1234');
  const employee = await container.prisma.user.findFirstOrThrow({ where: { email: 'employee@ecosphere.local' } });
  const organizationId = employee.organizationId;
  const suffix = Date.now().toString();

  try {
    const factor = await call('/api/environment/emission-factors', { token: adminToken, method: 'POST', body: { activityType: `DIESEL_${suffix}`, unit: 'litre', co2ePerUnit: 2.68, source: 'QA test' } });
    assert.equal(factor.response.status, 201);
    const carbonBody = { emissionFactorId: factor.payload.data.id, activityAmount: 100, reference: `QA-${suffix}` };
    const carbon = await call('/api/environment/carbon-transactions', { token: adminToken, method: 'POST', body: carbonBody });
    assert.equal(carbon.response.status, 201);
    assert.equal(Number(carbon.payload.data.calculatedCo2e), 268);
    const duplicate = await call('/api/environment/carbon-transactions', { token: adminToken, method: 'POST', body: carbonBody });
    assert.equal(duplicate.response.status, 409);
    const environmental = await call('/api/environment/dashboard', { token: adminToken });
    assert.ok(environmental.payload.data.carbonTransactionCount >= 1);

    const csr = await call('/api/social/csr-activities', { token: adminToken, method: 'POST', body: { title: `QA CSR ${suffix}`, description: 'Integration workflow', evidenceRequired: true, xpAward: 5, pointsAward: 10, status: 'ACTIVE' } });
    const csrParticipation = await call(`/api/social/csr-activities/${csr.payload.data.id}/participations`, { token: employeeToken, method: 'POST', body: { evidenceUrl: 'https://example.com/evidence.pdf' } });
    const csrReview = await call(`/api/social/participations/${csrParticipation.payload.data.id}/review`, { token: adminToken, method: 'PATCH', body: { decision: 'APPROVED' } });
    assert.equal(csrReview.payload.data.status, 'APPROVED');

    const policy = await call('/api/governance/policies', { token: adminToken, method: 'POST', body: { title: `QA Policy ${suffix}`, content: 'QA policy content', version: '1.0', status: 'PUBLISHED' } });
    const acknowledgement = await call(`/api/governance/policies/${policy.payload.data.id}/acknowledgements`, { token: employeeToken, method: 'POST' });
    assert.equal(acknowledgement.response.status, 201);

    const badge = await call('/api/gamification/badges', { token: adminToken, method: 'POST', body: { name: `QA Badge ${suffix}`, description: 'QA unlock', unlockRule: { minXp: 1 }, status: 'ACTIVE' } });
    assert.equal(badge.response.status, 201);
    const challenge = await call('/api/gamification/challenges', { token: adminToken, method: 'POST', body: { title: `QA Challenge ${suffix}`, description: 'Integration challenge', xp: 5, points: 5, evidenceRequired: true, status: 'ACTIVE' } });
    const joined = await call(`/api/gamification/challenges/${challenge.payload.data.id}/participations`, { token: employeeToken, method: 'POST' });
    await call(`/api/gamification/participations/${joined.payload.data.id}/submit`, { token: employeeToken, method: 'PATCH', body: { evidenceUrl: 'https://example.com/challenge.jpg' } });
    const challengeReview = await call(`/api/gamification/participations/${joined.payload.data.id}/review`, { token: adminToken, method: 'PATCH', body: { decision: 'APPROVED' } });
    assert.equal(challengeReview.payload.data.status, 'APPROVED');
    const progress = await call('/api/gamification/my-progress', { token: employeeToken });
    assert.equal(Number(progress.payload.data.xp), 10);
    assert.equal(progress.payload.data.badges.length, 1);
    const leaderboard = await call('/api/gamification/leaderboard?type=employee', { token: employeeToken });
    assert.equal(leaderboard.payload.data.empty, false);

    const reward = await call('/api/gamification/rewards', { token: adminToken, method: 'POST', body: { name: `QA Reward ${suffix}`, description: 'QA reward', pointsRequired: 1, stock: 1, status: 'ACTIVE' } });
    const redemption = await call(`/api/gamification/rewards/${reward.payload.data.id}/redemptions`, { token: employeeToken, method: 'POST' });
    assert.equal(redemption.response.status, 201);

    const issue = await call('/api/governance/compliance-issues', { token: adminToken, method: 'POST', body: { title: `QA Issue ${suffix}`, description: 'QA overdue issue', ownerId: employee.id, dueDate: '2020-01-01', severity: 'HIGH' } });
    assert.equal(issue.response.status, 201);
    const refreshed = await call('/api/governance/compliance-issues/refresh-overdue', { token: adminToken, method: 'POST' });
    assert.ok(refreshed.payload.data.some((item) => item.id === issue.payload.data.id && item.status === 'OVERDUE'));
  } finally {
    await container.prisma.$transaction([
      container.prisma.notification.deleteMany({ where: { organizationId } }),
      container.prisma.rewardRedemption.deleteMany({ where: { organizationId } }),
      container.prisma.userBadge.deleteMany({ where: { organizationId } }),
      container.prisma.xpLedger.deleteMany({ where: { organizationId } }),
      container.prisma.challengeParticipation.deleteMany({ where: { organizationId } }),
      container.prisma.challenge.deleteMany({ where: { organizationId } }),
      container.prisma.csrParticipation.deleteMany({ where: { organizationId } }),
      container.prisma.csrActivity.deleteMany({ where: { organizationId } }),
      container.prisma.policyAcknowledgement.deleteMany({ where: { organizationId } }),
      container.prisma.policy.deleteMany({ where: { organizationId } }),
      container.prisma.complianceIssue.deleteMany({ where: { organizationId } }),
      container.prisma.reward.deleteMany({ where: { organizationId } }),
      container.prisma.badge.deleteMany({ where: { organizationId } }),
      container.prisma.carbonTransaction.deleteMany({ where: { organizationId } }),
      container.prisma.emissionFactor.deleteMany({ where: { organizationId } }),
      container.prisma.auditLog.deleteMany({ where: { organizationId } })
    ]);
    await new Promise((resolve) => server.close(resolve));
    await container.prisma.$disconnect();
  }
});
