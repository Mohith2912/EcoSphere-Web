const { AppError } = require('../../shared/AppError');
const { isOverdue, scopeWhere } = require('../../shared/scoping');
const { assertScopedAccess } = require('../../middleware/auth');

class GovernanceService {
  constructor(repositories, auditLog, notifications) {
    this.repositories = repositories;
    this.auditLog = auditLog;
    this.notifications = notifications;
  }

  async createPolicy(context, input) {
    const policy = await this.repositories.policies.create(context, {
      ...input, departmentId: input.departmentId || null, version: input.version || '1.0', status: input.status || 'DRAFT', publishedAt: input.status === 'PUBLISHED' ? new Date() : null, createdById: context.userId
    });
    await this.auditLog.record(context, { action: 'POLICY_CREATED', entityType: 'POLICY', entityId: policy.id, after: policy });
    return policy;
  }

  async updatePolicy(context, id, input) {
    const before = await this.repositories.policies.findById(context, id);
    const publishing = input.status === 'PUBLISHED' && before.status !== 'PUBLISHED';
    const policy = await this.repositories.policies.update(context, id, { ...input, ...(publishing ? { publishedAt: new Date() } : {}), updatedById: context.userId });
    await this.auditLog.record(context, { action: publishing ? 'POLICY_PUBLISHED' : 'POLICY_UPDATED', entityType: 'POLICY', entityId: id, before, after: policy });
    return policy;
  }

  async listPolicies(context, manage = false) {
    if (manage) return this.repositories.policies.findMany(context, { orderBy: { updatedAt: 'desc' } });
    const assignedDepartments = [{ departmentId: null }];
    if (context.departmentId) assignedDepartments.push({ departmentId: context.departmentId });
    return this.repositories.policies.findMany(context, {
      where: { status: 'PUBLISHED', OR: assignedDepartments }, orderBy: { publishedAt: 'desc' }
    });
  }

  async acknowledgePolicy(context, policyId) {
    const policy = await this.repositories.policies.findById(context, policyId);
    if (policy.status !== 'PUBLISHED') throw AppError.conflict('Only published policies can be acknowledged.');
    if (policy.departmentId && policy.departmentId !== context.departmentId) throw AppError.forbidden('This policy is not assigned to your department.');
    const existing = await this.repositories.policyAcknowledgements.findFirst(context, { where: { policyId, userId: context.userId, policyVersion: policy.version } });
    if (existing) return existing;
    const acknowledgement = await this.repositories.policyAcknowledgements.create(context, {
      policyId, userId: context.userId, policyVersion: policy.version, acknowledgedAt: new Date()
    });
    await this.auditLog.record(context, { action: 'POLICY_ACKNOWLEDGED', entityType: 'POLICY_ACKNOWLEDGEMENT', entityId: acknowledgement.id, after: acknowledgement });
    return acknowledgement;
  }

  async acknowledgementHistory(context) {
    return this.repositories.policyAcknowledgements.findMany(context, { where: { userId: context.userId }, include: { policy: true }, orderBy: { acknowledgedAt: 'desc' } });
  }

  async createAudit(context, input) {
    const audit = await this.repositories.audits.create(context, {
      ...input, departmentId: input.departmentId || null, status: input.status || 'PLANNED', createdById: context.userId
    });
    await this.auditLog.record(context, { action: 'AUDIT_CREATED', entityType: 'AUDIT', entityId: audit.id, after: audit });
    return audit;
  }

  async updateAudit(context, id, input) {
    const before = await this.repositories.audits.findById(context, id);
    assertScopedAccess(context, before, { permission: 'governance.audit', ownFields: ['createdById'] });
    const audit = await this.repositories.audits.update(context, id, { ...input, updatedById: context.userId });
    await this.auditLog.record(context, { action: 'AUDIT_UPDATED', entityType: 'AUDIT', entityId: id, before, after: audit });
    return audit;
  }

  async listAudits(context) {
    return this.repositories.audits.findMany(context, { where: scopeWhere(context, 'governance.audit', { userField: 'createdById' }), orderBy: { createdAt: 'desc' } });
  }

  async createComplianceIssue(context, input) {
    if (!input.ownerId || !input.dueDate) throw AppError.badRequest('Every compliance issue requires an owner and due date.');
    if (new Date(input.dueDate).toString() === 'Invalid Date') throw AppError.badRequest('dueDate must be a valid date.');
    if (input.auditId) await this.repositories.audits.findById(context, input.auditId);
    const issue = await this.repositories.complianceIssues.create(context, {
      ...input, departmentId: input.departmentId || null, status: input.status || 'OPEN', dueDate: new Date(input.dueDate), createdById: context.userId
    });
    await this.notifications.create(context, {
      userId: input.ownerId, type: 'COMPLIANCE_ISSUE_ASSIGNED', title: 'New compliance issue assigned', body: issue.title || issue.description,
      resourceType: 'COMPLIANCE_ISSUE', resourceId: issue.id
    });
    await this.auditLog.record(context, { action: 'COMPLIANCE_ISSUE_CREATED', entityType: 'COMPLIANCE_ISSUE', entityId: issue.id, after: issue });
    return issue;
  }

  async updateComplianceIssue(context, id, input) {
    const before = await this.repositories.complianceIssues.findById(context, id);
    assertScopedAccess(context, before, { permission: 'governance.manage', ownFields: ['ownerId'] });
    if (input.dueDate && new Date(input.dueDate).toString() === 'Invalid Date') throw AppError.badRequest('dueDate must be a valid date.');
    const issue = await this.repositories.complianceIssues.update(context, id, { ...input, ...(input.dueDate ? { dueDate: new Date(input.dueDate) } : {}), updatedById: context.userId });
    await this.auditLog.record(context, { action: 'COMPLIANCE_ISSUE_UPDATED', entityType: 'COMPLIANCE_ISSUE', entityId: id, before, after: issue });
    return issue;
  }

  async listComplianceIssues(context) {
    const visible = scopeWhere(context, 'governance.view', { userField: 'ownerId' });
    const issues = await this.repositories.complianceIssues.findMany(context, { where: visible, orderBy: { dueDate: 'asc' } });
    return issues.map((issue) => ({ ...issue, isOverdue: isOverdue(issue), displayStatus: isOverdue(issue) ? 'OVERDUE' : issue.status }));
  }

  async refreshOverdue(context, now = new Date()) {
    const candidates = await this.repositories.complianceIssues.findMany(context, { where: { dueDate: { lt: now }, status: { in: ['OPEN', 'IN_PROGRESS'] } } });
    const updated = [];
    for (const issue of candidates) {
      const record = await this.repositories.complianceIssues.update(context, issue.id, { status: 'OVERDUE', overdueAt: now, updatedById: context.userId });
      if (issue.ownerId) await this.notifications.create(context, { userId: issue.ownerId, type: 'COMPLIANCE_OVERDUE', title: 'Compliance issue overdue', body: issue.title || issue.description, resourceType: 'COMPLIANCE_ISSUE', resourceId: issue.id });
      updated.push(record);
    }
    return updated;
  }

  async dashboard(context) {
    const visible = scopeWhere(context, 'governance.view', { userField: 'ownerId' });
    const [policies, issues] = await Promise.all([
      this.repositories.policies.findMany(context, { where: { status: 'PUBLISHED' } }),
      this.repositories.complianceIssues.findMany(context, { where: visible })
    ]);
    return {
      publishedPolicyCount: policies.length,
      complianceIssueCount: issues.length,
      overdueComplianceCount: issues.filter((issue) => isOverdue(issue)).length,
      governanceScore: null,
      scoreStatus: 'NOT_CALCULATED',
      scoreMessage: 'Not Calculated — sufficient governance scoring configuration is not available.'
    };
  }
}

module.exports = { GovernanceService };
