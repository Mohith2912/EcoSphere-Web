const express = require('express');
const { z } = require('zod');
const { asyncHandler, validate } = require('../shared/http');

const idParams = z.object({ params: z.object({ id: z.string().min(1) }) });
const policy = z.object({ title: z.string().min(2), content: z.string().min(2), version: z.string().min(1).optional(), departmentId: z.string().min(1).nullable().optional(), status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional() });
const audit = z.object({ title: z.string().min(2), scope: z.string().min(2), departmentId: z.string().min(1).nullable().optional(), scheduledAt: z.string().optional(), completedAt: z.string().optional(), status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(), evidenceUrl: z.string().url().optional(), findings: z.string().max(10000).optional() });
const issue = z.object({ title: z.string().min(2), description: z.string().min(2), auditId: z.string().min(1).nullable().optional(), ownerId: z.string().min(1), departmentId: z.string().min(1).nullable().optional(), dueDate: z.string().min(1), severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']), status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'OVERDUE']).optional(), evidenceUrl: z.string().url().optional() });

function governanceRoutes(container, authenticate, authorize) {
  const router = express.Router();
  router.use(authenticate);
  router.get('/dashboard', authorize('governance.view'), asyncHandler(async (req, res) => res.json({ data: await container.governance.dashboard(req.auth) })));
  router.get('/policies/assigned', authorize('governance.view'), asyncHandler(async (req, res) => res.json({ data: await container.governance.listPolicies(req.auth) })));
  router.get('/policies/manage', authorize('governance.manage'), asyncHandler(async (req, res) => res.json({ data: await container.governance.listPolicies(req.auth, true) })));
  router.post('/policies', authorize('governance.manage'), validate(z.object({ body: policy })), asyncHandler(async (req, res) => res.status(201).json({ data: await container.governance.createPolicy(req.auth, req.validated.body) })));
  router.patch('/policies/:id', authorize('governance.manage'), validate(idParams.merge(z.object({ body: policy.partial() }))), asyncHandler(async (req, res) => res.json({ data: await container.governance.updatePolicy(req.auth, req.validated.params.id, req.validated.body) })));
  router.post('/policies/:id/acknowledgements', authorize('governance.acknowledge'), validate(idParams), asyncHandler(async (req, res) => res.status(201).json({ data: await container.governance.acknowledgePolicy(req.auth, req.validated.params.id) })));
  router.get('/my-acknowledgements', authorize('governance.acknowledge'), asyncHandler(async (req, res) => res.json({ data: await container.governance.acknowledgementHistory(req.auth) })));
  router.get('/audits', authorize('governance.audit'), asyncHandler(async (req, res) => res.json({ data: await container.governance.listAudits(req.auth) })));
  router.post('/audits', authorize('governance.audit'), validate(z.object({ body: audit })), asyncHandler(async (req, res) => res.status(201).json({ data: await container.governance.createAudit(req.auth, req.validated.body) })));
  router.patch('/audits/:id', authorize('governance.audit'), validate(idParams.merge(z.object({ body: audit.partial() }))), asyncHandler(async (req, res) => res.json({ data: await container.governance.updateAudit(req.auth, req.validated.params.id, req.validated.body) })));
  router.get('/compliance-issues', authorize('governance.view'), asyncHandler(async (req, res) => res.json({ data: await container.governance.listComplianceIssues(req.auth) })));
  router.post('/compliance-issues', authorize('governance.manage'), validate(z.object({ body: issue })), asyncHandler(async (req, res) => res.status(201).json({ data: await container.governance.createComplianceIssue(req.auth, req.validated.body) })));
  router.patch('/compliance-issues/:id', authorize('governance.manage'), validate(idParams.merge(z.object({ body: issue.partial() }))), asyncHandler(async (req, res) => res.json({ data: await container.governance.updateComplianceIssue(req.auth, req.validated.params.id, req.validated.body) })));
  router.post('/compliance-issues/refresh-overdue', authorize('governance.manage'), asyncHandler(async (req, res) => res.json({ data: await container.governance.refreshOverdue(req.auth), meta: { processedAt: new Date().toISOString() } })));
  return router;
}

module.exports = { governanceRoutes };
