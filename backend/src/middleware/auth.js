const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { AppError } = require('../shared/AppError');
const { asyncHandler } = require('../shared/http');

function normalizeAuthorization(user) {
  const grants = {};
  const roles = [];
  for (const assignment of user.userRoles || []) {
    const role = assignment.role;
    if (!role) continue;
    roles.push({ id: role.id, code: role.code, name: role.name });
    for (const rolePermission of role.rolePermissions || []) {
      const code = rolePermission.permission?.code;
      if (!code) continue;
      const scope = rolePermission.scope || assignment.scope || 'ORGANIZATION';
      grants[code] = [...new Set([...(grants[code] || []), scope])];
    }
  }
  return { roles, grants };
}

function authenticate(repositories) {
  return asyncHandler(async (req, _res, next) => {
    const value = req.headers.authorization;
    if (!value?.startsWith('Bearer ')) throw AppError.unauthorized('A bearer token is required.');
    let claims;
    try { claims = jwt.verify(value.slice(7), env.jwtSecret); } catch { throw AppError.unauthorized('The access token is invalid or expired.'); }
    const user = await repositories.users.findAuthById(claims.sub);
    if (user.organization?.status && user.organization.status !== 'ACTIVE') throw AppError.forbidden('This organization is not active.');
    const authorization = normalizeAuthorization(user);
    req.auth = {
      userId: user.id,
      organizationId: user.organizationId,
      departmentId: user.departmentId || null,
      email: user.email,
      roles: authorization.roles,
      permissions: authorization.grants,
      user
    };
    next();
  });
}

function authorize(permission) {
  return (req, _res, next) => {
    if (!req.auth) return next(AppError.unauthorized());
    if (!(req.auth.permissions[permission] || []).length) return next(AppError.forbidden(`Missing required permission: ${permission}.`));
    return next();
  };
}

function assertScopedAccess(auth, record, { permission, ownFields = ['userId', 'employeeId', 'createdById'], departmentField = 'departmentId' } = {}) {
  if (!record || record.organizationId !== auth.organizationId) throw AppError.notFound('Resource');
  const scopes = permission ? (auth.permissions[permission] || []) : Object.values(auth.permissions).flat();
  if (scopes.includes('ORGANIZATION')) return;
  if (scopes.includes('DEPARTMENT') && auth.departmentId && record[departmentField] === auth.departmentId) return;
  if (scopes.includes('OWN') && ownFields.some((field) => record[field] === auth.userId)) return;
  throw AppError.forbidden('Your role does not cover this record.');
}

module.exports = { authenticate, authorize, assertScopedAccess, normalizeAuthorization };
