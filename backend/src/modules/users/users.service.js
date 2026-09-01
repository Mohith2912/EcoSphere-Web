const { AppError } = require('../../shared/AppError');
const { scopeWhere } = require('../../shared/scoping');
const { SCOPES } = require('../../config/permissions');

class UsersService {
  constructor(repositories, auditLog, notifications) {
    this.repositories = repositories;
    this.auditLog = auditLog;
    this.notifications = notifications;
  }

  async listUsers(context) {
    const users = await this.repositories.users.findMany(context, { where: scopeWhere(context, 'users.manage', { userField: 'id' }), include: { department: true, userRoles: { include: { role: true } } }, orderBy: { createdAt: 'asc' } });
    return users.map(({ passwordHash: _passwordHash, ...user }) => user);
  }

  async listDepartments(context) { return this.repositories.departments.findMany(context, { where: { status: 'ACTIVE' }, orderBy: { name: 'asc' } }); }

  async createDepartment(context, input) {
    const department = await this.repositories.departments.create(context, { ...input, status: input.status || 'ACTIVE', createdById: context.userId });
    await this.auditLog.record(context, { action: 'DEPARTMENT_CREATED', entityType: 'DEPARTMENT', entityId: department.id, after: department });
    return department;
  }

  async updateDepartment(context, id, input) {
    const before = await this.repositories.departments.findById(context, id);
    const department = await this.repositories.departments.update(context, id, { ...input, updatedById: context.userId });
    await this.auditLog.record(context, { action: 'DEPARTMENT_UPDATED', entityType: 'DEPARTMENT', entityId: id, before, after: department });
    return department;
  }

  async requestRole(context, input) {
    const existing = await this.repositories.roleRequests.findFirst(context, { where: { userId: context.userId, requestedRoleCode: input.requestedRoleCode, status: 'PENDING' } });
    if (existing) throw AppError.conflict('A request for this role is already pending.');
    const request = await this.repositories.roleRequests.create(context, {
      userId: context.userId, requestedRoleCode: input.requestedRoleCode, evidenceUrl: input.evidenceUrl || null, justification: input.justification || null, status: 'PENDING', requestedAt: new Date()
    });
    await this.auditLog.record(context, { action: 'ROLE_REQUESTED', entityType: 'ROLE_REQUEST', entityId: request.id, after: request });
    return request;
  }

  async listRoleRequests(context) {
    return this.repositories.roleRequests.findMany(context, {
      where: { status: 'PENDING' },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, employeeId: true, departmentId: true } } },
      orderBy: { requestedAt: 'asc' }
    });
  }

  async reviewRoleRequest(context, requestId, input) {
    const request = await this.repositories.roleRequests.findById(context, requestId);
    if (request.userId === context.userId) throw AppError.forbidden('You cannot review your own role request.');
    if (request.status !== 'PENDING') throw AppError.conflict('This role request has already been reviewed.');
    if (!['APPROVED', 'REJECTED'].includes(input.decision)) throw AppError.badRequest('Decision must be APPROVED or REJECTED.');
    if (input.decision === 'REJECTED' && !input.reviewNote) throw AppError.badRequest('A rejection note is required.');
    let reviewed;
    await this.repositories.transaction(async (tx) => {
      reviewed = await tx.roleRequests.update(context, requestId, { status: input.decision, reviewNote: input.reviewNote || null, reviewedById: context.userId, reviewedAt: new Date() });
      if (input.decision === 'APPROVED') {
        const role = await tx.roles.findFirst(context, { where: { code: request.requestedRoleCode, status: 'ACTIVE' } });
        if (!role) throw AppError.badRequest('Requested role is not configured for this organization.');
        const existingAssignment = await tx.userRoles.findFirst(context, { where: { userId: request.userId, roleId: role.id, status: 'ACTIVE' } });
        if (!existingAssignment) await tx.userRoles.create(context, { userId: request.userId, roleId: role.id, scope: input.scope || SCOPES.ORGANIZATION, status: 'ACTIVE', assignedById: context.userId, assignedAt: new Date() });
      }
      await tx.notifications.create(context, { userId: request.userId, type: input.decision === 'APPROVED' ? 'ROLE_REQUEST_APPROVED' : 'ROLE_REQUEST_REJECTED', title: `Role request ${input.decision.toLowerCase()}`, body: request.requestedRoleCode, resourceType: 'ROLE_REQUEST', resourceId: request.id, readAt: null });
    });
    await this.auditLog.record(context, { action: `ROLE_REQUEST_${input.decision}`, entityType: 'ROLE_REQUEST', entityId: requestId, after: reviewed });
    return reviewed;
  }
}

module.exports = { UsersService };
