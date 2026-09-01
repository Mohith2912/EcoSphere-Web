const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { env } = require('../../config/env');
const { AppError } = require('../../shared/AppError');
const { normalizeAuthorization } = require('../../middleware/auth');

function publicUser(user) {
  const authorization = normalizeAuthorization(user);
  return {
    id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, employeeId: user.employeeId,
    organization: user.organization, department: user.department, roles: authorization.roles, permissions: authorization.grants
  };
}

class AuthService {
  constructor(repositories) { this.repositories = repositories; }

  async login({ email, password, organizationCode }) {
    if (!env.jwtSecret) throw new Error('JWT_SECRET must be configured before login can be used.');
    const user = await this.repositories.users.findByEmail(email.toLowerCase(), organizationCode);
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw AppError.unauthorized('Invalid email, password, or organization.');
    const token = jwt.sign({ sub: user.id, organizationId: user.organizationId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
    const roles = normalizeAuthorization(user).roles;
    const hasOrganizationRole = roles.some((role) => !['EMPLOYEE', 'STANDARD_EMPLOYEE'].includes(role.code));
    return { accessToken: token, tokenType: 'Bearer', expiresIn: env.jwtExpiresIn, user: publicUser(user), defaultRoute: hasOrganizationRole ? '/org/dashboard' : '/app/dashboard' };
  }

  profile(auth) { return publicUser(auth.user); }
}

module.exports = { AuthService, publicUser };
