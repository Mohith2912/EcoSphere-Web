const { AppError } = require('./AppError');

function scopeWhere(auth, permission, { userField = 'userId', departmentField = 'departmentId' } = {}) {
  const scopes = auth.permissions[permission] || [];
  if (scopes.includes('ORGANIZATION')) return {};
  const alternatives = [];
  if (scopes.includes('OWN')) alternatives.push({ [userField]: auth.userId });
  if (scopes.includes('DEPARTMENT') && auth.departmentId) alternatives.push({ [departmentField]: auth.departmentId });
  if (!alternatives.length) throw AppError.forbidden('Your role does not include a usable data scope.');
  return alternatives.length === 1 ? alternatives[0] : { OR: alternatives };
}

function asNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw AppError.badRequest(`${field} must be a non-negative number.`);
  return number;
}

function sum(rows, field) { return rows.reduce((total, row) => total + Number(row[field] || 0), 0); }

function isOverdue(issue, now = new Date()) {
  return Boolean(issue.dueDate && new Date(issue.dueDate) < now && !['RESOLVED', 'CLOSED'].includes(issue.status));
}

module.exports = { scopeWhere, asNumber, sum, isOverdue };
