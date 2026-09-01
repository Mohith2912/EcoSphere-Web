USE ecosphere;

-- These should all return zero immediately after migration + configuration seed.
SELECT COUNT(*) AS organizations FROM organizations;
SELECT COUNT(*) AS users FROM users;
SELECT COUNT(*) AS carbon_transactions FROM carbon_transactions;
SELECT COUNT(*) AS product_esg_profiles FROM product_esg_profiles;
SELECT COUNT(*) AS csr_activities FROM csr_activities;
SELECT COUNT(*) AS csr_participations FROM csr_participations;
SELECT COUNT(*) AS diversity_metrics FROM diversity_metrics;
SELECT COUNT(*) AS training_records FROM training_records;
SELECT COUNT(*) AS policies FROM policies;
SELECT COUNT(*) AS audits FROM audits;
SELECT COUNT(*) AS audit_findings FROM audit_findings;
SELECT COUNT(*) AS compliance_issues FROM compliance_issues;
SELECT COUNT(*) AS challenges FROM challenges;
SELECT COUNT(*) AS reward_redemptions FROM reward_redemptions;
SELECT COUNT(*) AS notifications FROM notifications;
SELECT COUNT(*) AS esg_scores FROM esg_scores;

-- Static configuration counts are expected to be non-zero.
SELECT COUNT(*) AS system_roles FROM roles WHERE is_system = TRUE;
SELECT COUNT(*) AS permissions FROM permissions;
