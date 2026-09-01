const { sum, isOverdue, scopeWhere } = require('../../shared/scoping');
const { AppError } = require('../../shared/AppError');

function csv(rows) {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return [keys.join(','), ...rows.map((row) => keys.map((key) => escape(row[key])).join(','))].join('\n');
}

class ReportService {
  constructor(repositories, environment, social, governance) {
    this.repositories = repositories;
    this.environment = environment;
    this.social = social;
    this.governance = governance;
  }

  requiredPermission(scope) {
    return scope === 'PERSONAL' ? 'reports.personal' : scope === 'DEPARTMENT' ? 'reports.department' : 'reports.organization';
  }

  async generate(context, type, scope = 'ORGANIZATION') {
    const permission = this.requiredPermission(scope);
    if (!(context.permissions[permission] || []).length) throw AppError.forbidden(`Missing required permission: ${permission}.`);
    if (type === 'ENVIRONMENTAL') {
      const transactions = await this.repositories.carbonTransactions.findMany(context, { where: scopeWhere(context, permission, { userField: 'createdById' }), orderBy: { occurredAt: 'asc' } });
      return { type, generatedAt: new Date(), summary: { carbonTransactionCount: transactions.length, totalEmissionsKgCo2e: sum(transactions, 'calculatedCo2e') }, rows: transactions };
    }
    if (type === 'SOCIAL') {
      const rows = await this.repositories.csrParticipations.findMany(context, { where: scoped, orderBy: { submittedAt: 'asc' } });
      return { type, generatedAt: new Date(), summary: { participationCount: rows.length, approvedParticipationCount: rows.filter((row) => row.status === 'APPROVED').length }, rows };
    }
    if (type === 'GOVERNANCE') {
      const rows = await this.repositories.complianceIssues.findMany(context, { where: scopeWhere(context, permission, { userField: 'ownerId' }), orderBy: { dueDate: 'asc' } });
      return { type, generatedAt: new Date(), summary: { complianceIssueCount: rows.length, overdueComplianceCount: rows.filter((row) => isOverdue(row)).length }, rows: rows.map((row) => ({ ...row, isOverdue: isOverdue(row) })) };
    }
    if (type === 'ESG_SUMMARY') {
      const [environmental, social, governance] = await Promise.all([this.environment.dashboard(context), this.social.dashboard(context), this.governance.dashboard(context)]);
      return {
        type, generatedAt: new Date(), summary: { environmental, social, governance, overallEsgScore: null, scoreStatus: 'NOT_CALCULATED', scoreMessage: 'Not Calculated — module scores or approved scoring weights are unavailable.' }, rows: []
      };
    }
    throw AppError.badRequest('Unknown report type.');
  }

  async exportCsv(context, type, scope) {
    const report = await this.generate(context, type, scope);
    return { filename: `ecosphere-${type.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`, body: csv(report.rows) };
  }
}

module.exports = { ReportService };
