const SCOPES = Object.freeze({ OWN: 'OWN', DEPARTMENT: 'DEPARTMENT', ORGANIZATION: 'ORGANIZATION' });

const PERMISSIONS = Object.freeze([
  'environment.view', 'environment.manage',
  'social.view', 'social.participate', 'social.approve', 'social.manage',
  'governance.view', 'governance.acknowledge', 'governance.audit', 'governance.manage',
  'gamification.view', 'gamification.participate', 'gamification.approve', 'gamification.manage',
  'reports.personal', 'reports.department', 'reports.organization',
  'users.manage', 'roles.assign', 'roles.approve', 'settings.manage'
]);

module.exports = { SCOPES, PERMISSIONS };
