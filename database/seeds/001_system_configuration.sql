-- Static authorization configuration only. No business or transactional data.

INSERT INTO permissions (id, permission_key, description) VALUES
('00000000-0000-0000-0001-000000000001','environment.view','View permitted environmental analytics'),
('00000000-0000-0000-0001-000000000002','environment.manage','Manage environmental configuration and records'),
('00000000-0000-0000-0001-000000000003','social.view','View social activities and metrics'),
('00000000-0000-0000-0001-000000000004','social.participate','Participate in CSR activities'),
('00000000-0000-0000-0001-000000000005','social.approve','Review eligible social submissions'),
('00000000-0000-0000-0001-000000000006','social.manage','Manage social activities and configuration'),
('00000000-0000-0000-0001-000000000007','governance.view','View assigned governance content'),
('00000000-0000-0000-0001-000000000008','governance.acknowledge','Acknowledge assigned policies'),
('00000000-0000-0000-0001-000000000009','governance.audit','Manage permitted audits and findings'),
('00000000-0000-0000-0001-000000000010','governance.manage','Manage governance configuration and records'),
('00000000-0000-0000-0001-000000000011','gamification.view','View challenges, balances, rewards and rankings'),
('00000000-0000-0000-0001-000000000012','gamification.participate','Participate in challenges and redeem rewards'),
('00000000-0000-0000-0001-000000000013','gamification.approve','Review eligible challenge submissions'),
('00000000-0000-0000-0001-000000000014','gamification.manage','Manage challenges, badges and rewards'),
('00000000-0000-0000-0001-000000000015','reports.personal','Access personal reports'),
('00000000-0000-0000-0001-000000000016','reports.department','Access permitted department reports'),
('00000000-0000-0000-0001-000000000017','reports.organization','Access organization reports'),
('00000000-0000-0000-0001-000000000018','users.manage','Manage organization users'),
('00000000-0000-0000-0001-000000000019','roles.assign','Assign approved roles'),
('00000000-0000-0000-0001-000000000020','roles.approve','Approve or reject privileged role requests'),
('00000000-0000-0000-0001-000000000021','settings.manage','Manage organization settings')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO roles (id, role_key, name, description, is_system) VALUES
('00000000-0000-0000-0002-000000000001','EMPLOYEE','Employee','Standard employee portal access',TRUE),
('00000000-0000-0000-0002-000000000002','DEPARTMENT_MANAGER','Department Manager','Department-scoped management and approvals',TRUE),
('00000000-0000-0000-0002-000000000003','ESG_OFFICER','ESG Officer','Organization ESG program management',TRUE),
('00000000-0000-0000-0002-000000000004','COMPLIANCE_OFFICER','Compliance Officer','Governance and compliance management',TRUE),
('00000000-0000-0000-0002-000000000005','AUDITOR','Auditor','Audit and governance verification access',TRUE),
('00000000-0000-0000-0002-000000000006','ADMIN','Admin','Organization administration access',TRUE),
('00000000-0000-0000-0002-000000000007','ORGANIZATION_OWNER','Organization Owner','Verified primary organization owner',TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0002-000000000001', id FROM permissions
WHERE permission_key IN ('environment.view','social.view','social.participate','governance.view','governance.acknowledge','gamification.view','gamification.participate','reports.personal');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0002-000000000002', id FROM permissions
WHERE permission_key IN ('environment.view','social.view','social.participate','social.approve','governance.view','governance.acknowledge','gamification.view','gamification.participate','gamification.approve','reports.personal','reports.department');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0002-000000000003', id FROM permissions
WHERE permission_key IN ('environment.view','environment.manage','social.view','social.approve','social.manage','governance.view','gamification.view','gamification.approve','gamification.manage','reports.personal','reports.department','reports.organization');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0002-000000000004', id FROM permissions
WHERE permission_key IN ('governance.view','governance.audit','governance.manage','reports.personal','reports.department','reports.organization');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0002-000000000005', id FROM permissions
WHERE permission_key IN ('environment.view','social.view','governance.view','governance.audit','reports.personal','reports.department','reports.organization');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT role_id, id FROM permissions
JOIN (SELECT '00000000-0000-0000-0002-000000000006' AS role_id UNION ALL SELECT '00000000-0000-0000-0002-000000000007') privileged_roles;

