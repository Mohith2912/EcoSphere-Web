const { AppError } = require('../shared/AppError');

class PrismaRepository {
  constructor(prisma, model, { tenantScoped = true } = {}) {
    this.prisma = prisma;
    this.model = model;
    this.tenantScoped = tenantScoped;
  }

  get delegate() {
    const delegate = this.prisma[this.model];
    if (!delegate) throw new Error(`Prisma model delegate '${this.model}' is missing. Check backend/DATABASE_CONTRACT.md.`);
    return delegate;
  }

  whereFor(context, where = {}) {
    if (!this.tenantScoped) return where;
    if (!context?.organizationId) throw AppError.unauthorized('Organization context is required.');
    return { ...where, organizationId: context.organizationId };
  }

  async findMany(context, args = {}) {
    return this.delegate.findMany({ ...args, where: this.whereFor(context, args.where) });
  }

  async findFirst(context, args = {}) {
    return this.delegate.findFirst({ ...args, where: this.whereFor(context, args.where) });
  }

  async findById(context, id, args = {}) {
    const item = await this.findFirst(context, { ...args, where: { ...args.where, id } });
    if (!item) throw AppError.notFound(this.model);
    return item;
  }

  async create(context, data, args = {}) {
    const tenantData = this.tenantScoped ? { ...data, organizationId: context.organizationId } : data;
    return this.delegate.create({ ...args, data: tenantData });
  }

  async update(context, id, data, args = {}) {
    await this.findById(context, id);
    return this.delegate.update({ ...args, where: { id }, data });
  }

  async remove(context, id) {
    await this.findById(context, id);
    return this.delegate.delete({ where: { id } });
  }

  async count(context, where = {}) { return this.delegate.count({ where: this.whereFor(context, where) }); }
}

class UserRepository extends PrismaRepository {
  constructor(prisma) { super(prisma, 'user'); }

  async findByEmail(email, organizationCode) {
    const user = await this.delegate.findFirst({
      where: { email, status: 'ACTIVE', ...(organizationCode ? { organization: { code: organizationCode } } : {}) },
      include: authInclude()
    });
    if (!user) throw AppError.unauthorized('Invalid email, password, or organization.');
    return user;
  }

  async findAuthById(id) {
    const user = await this.delegate.findFirst({ where: { id, status: 'ACTIVE' }, include: authInclude() });
    if (!user) throw AppError.unauthorized('Your account is inactive or no longer exists.');
    return user;
  }
}

function authInclude() {
  return {
    department: { select: { id: true, name: true, code: true } },
    organization: { select: { id: true, name: true, code: true, status: true } },
    userRoles: {
      where: { status: 'ACTIVE' },
      include: { role: { include: { rolePermissions: { include: { permission: true } } } } }
    }
  };
}

function makeRepositories(prisma) {
  const modelMap = {
    organizations: 'organization', departments: 'department', categories: 'category',
    emissionFactors: 'emissionFactor', carbonTransactions: 'carbonTransaction', environmentalGoals: 'environmentalGoal', productEsgProfiles: 'productEsgProfile',
    csrActivities: 'csrActivity', csrParticipations: 'csrParticipation',
    policies: 'policy', policyAcknowledgements: 'policyAcknowledgement', audits: 'audit', complianceIssues: 'complianceIssue',
    challenges: 'challenge', challengeParticipations: 'challengeParticipation', badges: 'badge', userBadges: 'userBadge', rewards: 'reward', rewardRedemptions: 'rewardRedemption', xpLedger: 'xpLedger',
    notifications: 'notification', auditLogs: 'auditLog', roleRequests: 'roleRequest', userRoles: 'userRole', roles: 'role', permissions: 'permission', settings: 'setting'
  };
  const repositories = { users: new UserRepository(prisma) };
  for (const [key, model] of Object.entries(modelMap)) repositories[key] = new PrismaRepository(prisma, model);
  repositories.transaction = async (operation) => prisma.$transaction(async (tx) => operation(makeRepositories(tx)));
  return repositories;
}

module.exports = { PrismaRepository, UserRepository, makeRepositories };
