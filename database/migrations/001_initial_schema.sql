CREATE DATABASE IF NOT EXISTS ecosphere
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE ecosphere;

CREATE TABLE organizations (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  code VARCHAR(50) NOT NULL,
  domain VARCHAR(190) NULL,
  verification_status ENUM('PENDING','VERIFIED','REJECTED','SUSPENDED') NOT NULL DEFAULT 'PENDING',
  status ENUM('ACTIVE','INACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  environmental_weight DECIMAL(5,4) NOT NULL DEFAULT 0.4000,
  social_weight DECIMAL(5,4) NOT NULL DEFAULT 0.3000,
  governance_weight DECIMAL(5,4) NOT NULL DEFAULT 0.3000,
  auto_emission_calculation BOOLEAN NOT NULL DEFAULT TRUE,
  evidence_requirement BOOLEAN NOT NULL DEFAULT TRUE,
  badge_auto_award BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_organizations_code (code),
  UNIQUE KEY uq_organizations_domain (domain),
  CONSTRAINT chk_organization_weights CHECK (
    environmental_weight >= 0 AND social_weight >= 0 AND governance_weight >= 0
    AND environmental_weight + social_weight + governance_weight = 1.0000
  )
) ENGINE=InnoDB;

CREATE TABLE departments (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  parent_department_id CHAR(36) NULL,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) NOT NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_departments_org_code (organization_id, code),
  UNIQUE KEY uq_departments_org_name (organization_id, name),
  KEY idx_departments_parent (parent_department_id),
  CONSTRAINT fk_departments_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_departments_parent FOREIGN KEY (parent_department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  department_id CHAR(36) NULL,
  employee_id VARCHAR(80) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  status ENUM('INVITED','ACTIVE','SUSPENDED','INACTIVE') NOT NULL DEFAULT 'INVITED',
  email_verified_at DATETIME(3) NULL,
  last_login_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_users_org_employee (organization_id, employee_id),
  UNIQUE KEY uq_users_org_email (organization_id, email),
  KEY idx_users_department (organization_id, department_id),
  CONSTRAINT fk_users_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

ALTER TABLE departments ADD COLUMN head_user_id CHAR(36) NULL AFTER parent_department_id;
ALTER TABLE departments ADD KEY idx_departments_head (head_user_id);
ALTER TABLE departments ADD CONSTRAINT fk_departments_head FOREIGN KEY (head_user_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE roles (
  id CHAR(36) PRIMARY KEY,
  role_key VARCHAR(80) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(500) NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_roles_key (role_key)
) ENGINE=InnoDB;

CREATE TABLE permissions (
  id CHAR(36) PRIMARY KEY,
  permission_key VARCHAR(120) NOT NULL,
  description VARCHAR(500) NULL,
  UNIQUE KEY uq_permissions_key (permission_key)
) ENGINE=InnoDB;

CREATE TABLE role_permissions (
  role_id CHAR(36) NOT NULL,
  permission_id CHAR(36) NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE user_roles (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  role_id CHAR(36) NOT NULL,
  scope_type ENUM('OWN','DEPARTMENT','ORGANIZATION') NOT NULL DEFAULT 'OWN',
  department_id CHAR(36) NULL,
  assigned_by CHAR(36) NULL,
  assigned_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  revoked_by CHAR(36) NULL,
  revoked_at DATETIME(3) NULL,
  UNIQUE KEY uq_active_user_role_scope (organization_id, user_id, role_id, scope_type, department_id, revoked_at),
  KEY idx_user_roles_lookup (organization_id, user_id, revoked_at),
  CONSTRAINT fk_user_roles_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
  CONSTRAINT fk_user_roles_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  CONSTRAINT fk_user_roles_assigner FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_user_roles_revoker FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_department_scope CHECK (
    (scope_type = 'DEPARTMENT' AND department_id IS NOT NULL)
    OR (scope_type <> 'DEPARTMENT' AND department_id IS NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE categories (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  name VARCHAR(120) NOT NULL,
  category_type ENUM('CSR_ACTIVITY','CHALLENGE','CARBON_ACTIVITY','OTHER') NOT NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_by CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_categories_org_type_name (organization_id, category_type, name),
  CONSTRAINT fk_categories_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_categories_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE evidence_files (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  uploaded_by CHAR(36) NOT NULL,
  storage_provider ENUM('LOCAL','CLOUDINARY','OBJECT_STORAGE') NOT NULL,
  storage_key VARCHAR(500) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT UNSIGNED NOT NULL,
  checksum_sha256 CHAR(64) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_evidence_org_uploader (organization_id, uploaded_by),
  CONSTRAINT fk_evidence_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_evidence_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE emission_factors (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  activity_type VARCHAR(120) NOT NULL,
  name VARCHAR(180) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  factor_kg_co2e DECIMAL(20,8) NOT NULL,
  source VARCHAR(500) NOT NULL,
  valid_from DATE NOT NULL,
  valid_to DATE NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_by CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_emission_factor_version (organization_id, activity_type, unit, valid_from),
  KEY idx_emission_factor_lookup (organization_id, activity_type, status, valid_from, valid_to),
  CONSTRAINT fk_emission_factors_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_emission_factors_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_emission_factor_positive CHECK (factor_kg_co2e >= 0),
  CONSTRAINT chk_emission_factor_dates CHECK (valid_to IS NULL OR valid_to >= valid_from)
) ENGINE=InnoDB;

CREATE TABLE carbon_transactions (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  department_id CHAR(36) NOT NULL,
  emission_factor_id CHAR(36) NOT NULL,
  source_type ENUM('PURCHASE','MANUFACTURING','EXPENSE','FLEET','MANUAL','OTHER') NOT NULL,
  source_reference VARCHAR(190) NULL,
  activity_amount DECIMAL(20,6) NOT NULL,
  activity_unit VARCHAR(50) NOT NULL,
  factor_snapshot DECIMAL(20,8) NOT NULL,
  calculated_co2e_kg DECIMAL(20,6) NOT NULL,
  occurred_at DATETIME(3) NOT NULL,
  verification_status ENUM('AUTO_VERIFIED','MANAGER_VERIFIED','AUDITOR_VERIFIED','PENDING','REJECTED','FLAGGED') NOT NULL DEFAULT 'PENDING',
  created_by CHAR(36) NOT NULL,
  approved_by CHAR(36) NULL,
  approved_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_carbon_source (organization_id, source_type, source_reference),
  KEY idx_carbon_org_date (organization_id, occurred_at),
  KEY idx_carbon_department_date (organization_id, department_id, occurred_at),
  CONSTRAINT fk_carbon_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_carbon_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  CONSTRAINT fk_carbon_factor FOREIGN KEY (emission_factor_id) REFERENCES emission_factors(id) ON DELETE RESTRICT,
  CONSTRAINT fk_carbon_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_carbon_approver FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_carbon_values CHECK (activity_amount >= 0 AND factor_snapshot >= 0 AND calculated_co2e_kg >= 0)
) ENGINE=InnoDB;

CREATE TABLE environmental_goals (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  department_id CHAR(36) NULL,
  title VARCHAR(200) NOT NULL,
  metric_key VARCHAR(120) NOT NULL,
  baseline_value DECIMAL(20,6) NULL,
  target_value DECIMAL(20,6) NOT NULL,
  current_value DECIMAL(20,6) NULL,
  unit VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  target_date DATE NOT NULL,
  status ENUM('DRAFT','ACTIVE','COMPLETED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  created_by CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_goals_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_goals_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  CONSTRAINT fk_goals_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_goal_dates CHECK (target_date >= start_date)
) ENGINE=InnoDB;

CREATE TABLE product_esg_profiles (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  product_code VARCHAR(100) NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  sustainability_classification VARCHAR(120) NULL,
  carbon_footprint_kg DECIMAL(20,6) NULL,
  environmental_attributes JSON NULL,
  esg_metadata JSON NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_by CHAR(36) NOT NULL,
  updated_by CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_product_profile_code (organization_id, product_code),
  CONSTRAINT fk_product_profiles_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_product_profiles_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_product_profiles_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_product_carbon CHECK (carbon_footprint_kg IS NULL OR carbon_footprint_kg >= 0)
) ENGINE=InnoDB;

CREATE TABLE csr_activities (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  category_id CHAR(36) NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255) NULL,
  starts_at DATETIME(3) NOT NULL,
  ends_at DATETIME(3) NOT NULL,
  capacity INT UNSIGNED NULL,
  points_award INT UNSIGNED NOT NULL DEFAULT 0,
  evidence_required BOOLEAN NOT NULL DEFAULT TRUE,
  status ENUM('DRAFT','PUBLISHED','COMPLETED','CANCELLED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  created_by CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_csr_org_status_date (organization_id, status, starts_at),
  CONSTRAINT fk_csr_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_csr_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_csr_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_csr_dates CHECK (ends_at >= starts_at)
) ENGINE=InnoDB;

CREATE TABLE csr_participations (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  activity_id CHAR(36) NOT NULL,
  employee_id CHAR(36) NOT NULL,
  department_id CHAR(36) NULL,
  evidence_id CHAR(36) NULL,
  status ENUM('JOINED','PENDING_APPROVAL','APPROVED','REJECTED','WITHDRAWN') NOT NULL DEFAULT 'JOINED',
  completion_date DATETIME(3) NULL,
  review_note VARCHAR(1000) NULL,
  reviewed_by CHAR(36) NULL,
  reviewed_at DATETIME(3) NULL,
  points_earned INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_csr_participant (activity_id, employee_id),
  KEY idx_csr_approval_queue (organization_id, department_id, status),
  CONSTRAINT fk_csr_part_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_csr_part_activity FOREIGN KEY (activity_id) REFERENCES csr_activities(id) ON DELETE RESTRICT,
  CONSTRAINT fk_csr_part_employee FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_csr_part_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  CONSTRAINT fk_csr_part_evidence FOREIGN KEY (evidence_id) REFERENCES evidence_files(id) ON DELETE SET NULL,
  CONSTRAINT fk_csr_part_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_csr_no_self_review CHECK (reviewed_by IS NULL OR reviewed_by <> employee_id)
) ENGINE=InnoDB;

CREATE TABLE diversity_metrics (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  department_id CHAR(36) NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metric_key VARCHAR(120) NOT NULL,
  metric_value DECIMAL(20,6) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  source VARCHAR(255) NOT NULL,
  verification_status ENUM('AUTO_VERIFIED','MANAGER_VERIFIED','AUDITOR_VERIFIED','PENDING','REJECTED','FLAGGED') NOT NULL DEFAULT 'PENDING',
  created_by CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_diversity_metric_period (organization_id, department_id, metric_key, period_start, period_end),
  CONSTRAINT fk_diversity_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_diversity_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  CONSTRAINT fk_diversity_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_diversity_dates CHECK (period_end >= period_start)
) ENGINE=InnoDB;

CREATE TABLE training_records (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  employee_id CHAR(36) NOT NULL,
  department_id CHAR(36) NULL,
  training_key VARCHAR(120) NOT NULL,
  training_title VARCHAR(200) NOT NULL,
  status ENUM('ASSIGNED','IN_PROGRESS','COMPLETED','EXPIRED') NOT NULL DEFAULT 'ASSIGNED',
  assigned_at DATETIME(3) NOT NULL,
  due_at DATETIME(3) NULL,
  completed_at DATETIME(3) NULL,
  source VARCHAR(255) NOT NULL,
  UNIQUE KEY uq_training_employee_assignment (organization_id, employee_id, training_key, assigned_at),
  KEY idx_training_department_status (organization_id, department_id, status),
  CONSTRAINT fk_training_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_training_employee FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_training_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE policies (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  title VARCHAR(220) NOT NULL,
  version VARCHAR(40) NOT NULL,
  content LONGTEXT NOT NULL,
  status ENUM('DRAFT','PUBLISHED','RETIRED') NOT NULL DEFAULT 'DRAFT',
  published_at DATETIME(3) NULL,
  created_by CHAR(36) NOT NULL,
  updated_by CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_policy_version (organization_id, title, version),
  CONSTRAINT fk_policies_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_policies_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_policies_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE policy_assignments (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  policy_id CHAR(36) NOT NULL,
  employee_id CHAR(36) NOT NULL,
  assigned_by CHAR(36) NOT NULL,
  assigned_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  due_at DATETIME(3) NULL,
  UNIQUE KEY uq_policy_assignment (policy_id, employee_id),
  CONSTRAINT fk_policy_assign_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_policy_assign_policy FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE RESTRICT,
  CONSTRAINT fk_policy_assign_employee FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_policy_assign_actor FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE policy_acknowledgements (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  assignment_id CHAR(36) NOT NULL,
  employee_id CHAR(36) NOT NULL,
  policy_id CHAR(36) NOT NULL,
  policy_version VARCHAR(40) NOT NULL,
  acknowledged_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_policy_ack_assignment (assignment_id),
  KEY idx_policy_ack_org_employee (organization_id, employee_id, acknowledged_at),
  CONSTRAINT fk_policy_ack_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_policy_ack_assignment FOREIGN KEY (assignment_id) REFERENCES policy_assignments(id) ON DELETE RESTRICT,
  CONSTRAINT fk_policy_ack_employee FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_policy_ack_policy FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE audits (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  department_id CHAR(36) NULL,
  title VARCHAR(220) NOT NULL,
  scope TEXT NOT NULL,
  status ENUM('PLANNED','IN_PROGRESS','UNDER_REVIEW','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PLANNED',
  lead_auditor_id CHAR(36) NOT NULL,
  starts_on DATE NOT NULL,
  ends_on DATE NULL,
  created_by CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_audits_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_audits_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  CONSTRAINT fk_audits_lead FOREIGN KEY (lead_auditor_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_audits_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_audit_dates CHECK (ends_on IS NULL OR ends_on >= starts_on)
) ENGINE=InnoDB;

CREATE TABLE compliance_issues (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  audit_id CHAR(36) NULL,
  department_id CHAR(36) NULL,
  severity ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
  description TEXT NOT NULL,
  owner_id CHAR(36) NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('OPEN','IN_PROGRESS','RESOLVED','CLOSED') NOT NULL DEFAULT 'OPEN',
  resolved_at DATETIME(3) NULL,
  created_by CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_compliance_overdue (organization_id, status, due_date),
  KEY idx_compliance_owner (organization_id, owner_id, status),
  CONSTRAINT fk_compliance_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_compliance_audit FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE SET NULL,
  CONSTRAINT fk_compliance_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  CONSTRAINT fk_compliance_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_compliance_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE audit_findings (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  audit_id CHAR(36) NOT NULL,
  title VARCHAR(220) NOT NULL,
  description TEXT NOT NULL,
  severity ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
  evidence_id CHAR(36) NULL,
  status ENUM('OPEN','ACCEPTED','REMEDIATED','CLOSED') NOT NULL DEFAULT 'OPEN',
  created_by CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_audit_findings_audit (organization_id, audit_id, status),
  CONSTRAINT fk_audit_findings_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_audit_findings_audit FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE RESTRICT,
  CONSTRAINT fk_audit_findings_evidence FOREIGN KEY (evidence_id) REFERENCES evidence_files(id) ON DELETE SET NULL,
  CONSTRAINT fk_audit_findings_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE OR REPLACE VIEW compliance_issue_status AS
SELECT ci.*,
  CASE
    WHEN ci.status NOT IN ('RESOLVED','CLOSED') AND CURRENT_DATE() > ci.due_date THEN TRUE
    ELSE FALSE
  END AS is_overdue
FROM compliance_issues ci;

CREATE TABLE challenges (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  category_id CHAR(36) NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  xp_award INT UNSIGNED NOT NULL,
  points_award INT UNSIGNED NOT NULL DEFAULT 0,
  difficulty ENUM('EASY','MEDIUM','HARD') NOT NULL,
  evidence_required BOOLEAN NOT NULL DEFAULT TRUE,
  deadline DATETIME(3) NULL,
  status ENUM('DRAFT','ACTIVE','UNDER_REVIEW','COMPLETED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  created_by CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_challenges_org_status (organization_id, status, deadline),
  CONSTRAINT fk_challenges_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_challenges_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_challenges_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE challenge_participations (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  challenge_id CHAR(36) NOT NULL,
  employee_id CHAR(36) NOT NULL,
  department_id CHAR(36) NULL,
  evidence_id CHAR(36) NULL,
  progress_percent TINYINT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('JOINED','IN_PROGRESS','PENDING_APPROVAL','APPROVED','REJECTED','WITHDRAWN') NOT NULL DEFAULT 'JOINED',
  submitted_at DATETIME(3) NULL,
  reviewed_by CHAR(36) NULL,
  reviewed_at DATETIME(3) NULL,
  review_note VARCHAR(1000) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_challenge_participant (challenge_id, employee_id),
  KEY idx_challenge_approval_queue (organization_id, department_id, status),
  CONSTRAINT fk_challenge_part_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_challenge_part_challenge FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE RESTRICT,
  CONSTRAINT fk_challenge_part_employee FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_challenge_part_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  CONSTRAINT fk_challenge_part_evidence FOREIGN KEY (evidence_id) REFERENCES evidence_files(id) ON DELETE SET NULL,
  CONSTRAINT fk_challenge_part_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_challenge_progress CHECK (progress_percent <= 100),
  CONSTRAINT chk_challenge_no_self_review CHECK (reviewed_by IS NULL OR reviewed_by <> employee_id)
) ENGINE=InnoDB;

CREATE TABLE point_ledger (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  employee_id CHAR(36) NOT NULL,
  points_delta INT NOT NULL,
  xp_delta INT NOT NULL DEFAULT 0,
  event_type ENUM('CSR_APPROVED','CHALLENGE_APPROVED','REWARD_REDEEMED','ADMIN_ADJUSTMENT') NOT NULL,
  source_id CHAR(36) NOT NULL,
  description VARCHAR(500) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_point_event (organization_id, employee_id, event_type, source_id),
  KEY idx_point_ledger_rank (organization_id, employee_id, created_at),
  CONSTRAINT fk_point_ledger_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_point_ledger_employee FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE OR REPLACE VIEW employee_balances AS
SELECT organization_id, employee_id,
  COALESCE(SUM(points_delta), 0) AS points_balance,
  COALESCE(SUM(xp_delta), 0) AS xp_total
FROM point_ledger
GROUP BY organization_id, employee_id;

CREATE TABLE badges (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  name VARCHAR(160) NOT NULL,
  description VARCHAR(500) NOT NULL,
  icon_url VARCHAR(500) NULL,
  unlock_metric ENUM('XP_TOTAL','POINTS_BALANCE','CSR_APPROVALS','CHALLENGE_APPROVALS') NOT NULL,
  unlock_threshold INT UNSIGNED NOT NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_by CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_badges_org_name (organization_id, name),
  CONSTRAINT fk_badges_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_badges_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE user_badges (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  employee_id CHAR(36) NOT NULL,
  badge_id CHAR(36) NOT NULL,
  source_event_id CHAR(36) NULL,
  awarded_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_user_badge (employee_id, badge_id),
  CONSTRAINT fk_user_badges_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_user_badges_employee FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_user_badges_badge FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE rewards (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  name VARCHAR(180) NOT NULL,
  description VARCHAR(500) NOT NULL,
  points_required INT UNSIGNED NOT NULL,
  stock INT UNSIGNED NOT NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_by CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_rewards_org_name (organization_id, name),
  CONSTRAINT fk_rewards_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_rewards_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE reward_redemptions (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  employee_id CHAR(36) NOT NULL,
  reward_id CHAR(36) NOT NULL,
  points_spent INT UNSIGNED NOT NULL,
  status ENUM('REQUESTED','FULFILLED','CANCELLED') NOT NULL DEFAULT 'REQUESTED',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  fulfilled_at DATETIME(3) NULL,
  KEY idx_redemptions_employee (organization_id, employee_id, created_at),
  CONSTRAINT fk_redemptions_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_redemptions_employee FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_redemptions_reward FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE role_requests (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  requester_id CHAR(36) NOT NULL,
  requested_role_id CHAR(36) NOT NULL,
  evidence_id CHAR(36) NOT NULL,
  requested_scope ENUM('DEPARTMENT','ORGANIZATION') NOT NULL,
  department_id CHAR(36) NULL,
  status ENUM('PENDING','APPROVED','REJECTED','REVOKED') NOT NULL DEFAULT 'PENDING',
  review_note VARCHAR(1000) NULL,
  reviewed_by CHAR(36) NULL,
  reviewed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_role_requests_queue (organization_id, status, created_at),
  CONSTRAINT fk_role_requests_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_role_requests_requester FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_role_requests_role FOREIGN KEY (requested_role_id) REFERENCES roles(id) ON DELETE RESTRICT,
  CONSTRAINT fk_role_requests_evidence FOREIGN KEY (evidence_id) REFERENCES evidence_files(id) ON DELETE RESTRICT,
  CONSTRAINT fk_role_requests_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  CONSTRAINT fk_role_requests_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_role_request_scope CHECK (
    (requested_scope = 'DEPARTMENT' AND department_id IS NOT NULL)
    OR (requested_scope = 'ORGANIZATION' AND department_id IS NULL)
  ),
  CONSTRAINT chk_role_request_no_self_review CHECK (reviewed_by IS NULL OR reviewed_by <> requester_id)
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  recipient_id CHAR(36) NOT NULL,
  notification_type ENUM('COMPLIANCE_ISSUE','CSR_APPROVED','CSR_REJECTED','CHALLENGE_APPROVED','CHALLENGE_REJECTED','POLICY_REMINDER','BADGE_UNLOCKED','REWARD_REDEEMED','ROLE_REQUEST') NOT NULL,
  title VARCHAR(200) NOT NULL,
  message VARCHAR(1000) NOT NULL,
  entity_type VARCHAR(80) NULL,
  entity_id CHAR(36) NULL,
  read_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_notifications_unread (organization_id, recipient_id, read_at, created_at),
  CONSTRAINT fk_notifications_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE esg_scores (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  department_id CHAR(36) NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  environmental_score DECIMAL(5,2) NOT NULL,
  social_score DECIMAL(5,2) NOT NULL,
  governance_score DECIMAL(5,2) NOT NULL,
  overall_score DECIMAL(5,2) NOT NULL,
  environmental_weight DECIMAL(5,4) NOT NULL,
  social_weight DECIMAL(5,4) NOT NULL,
  governance_weight DECIMAL(5,4) NOT NULL,
  calculation_details JSON NOT NULL,
  calculated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_esg_score_period (organization_id, department_id, period_start, period_end),
  CONSTRAINT fk_esg_scores_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_esg_scores_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  CONSTRAINT chk_esg_score_values CHECK (
    environmental_score BETWEEN 0 AND 100 AND social_score BETWEEN 0 AND 100
    AND governance_score BETWEEN 0 AND 100 AND overall_score BETWEEN 0 AND 100
  ),
  CONSTRAINT chk_esg_score_dates CHECK (period_end >= period_start),
  CONSTRAINT chk_esg_score_weights CHECK (
    environmental_weight + social_weight + governance_weight = 1.0000
  )
) ENGINE=InnoDB;

CREATE TABLE audit_events (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  actor_id CHAR(36) NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id CHAR(36) NULL,
  before_data JSON NULL,
  after_data JSON NULL,
  ip_address VARCHAR(45) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_audit_events_org_time (organization_id, created_at),
  KEY idx_audit_events_entity (organization_id, entity_type, entity_id),
  CONSTRAINT fk_audit_events_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_audit_events_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
