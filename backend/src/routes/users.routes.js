const express = require('express');
const { z } = require('zod');
const { asyncHandler, validate } = require('../shared/http');

const idParams = z.object({ params: z.object({ id: z.string().min(1) }) });
const department = z.object({ name: z.string().min(2), code: z.string().min(2).max(30), parentDepartmentId: z.string().min(1).nullable().optional(), headUserId: z.string().min(1).nullable().optional(), status: z.enum(['ACTIVE', 'INACTIVE']).optional() });

function usersRoutes(container, authenticate, authorize) {
  const router = express.Router();
  router.use(authenticate);
  router.get('/', authorize('users.manage'), asyncHandler(async (req, res) => res.json({ data: await container.users.listUsers(req.auth) })));
  router.get('/departments', authorize('users.manage'), asyncHandler(async (req, res) => res.json({ data: await container.users.listDepartments(req.auth) })));
  router.post('/departments', authorize('users.manage'), validate(z.object({ body: department })), asyncHandler(async (req, res) => res.status(201).json({ data: await container.users.createDepartment(req.auth, req.validated.body) })));
  router.patch('/departments/:id', authorize('users.manage'), validate(idParams.merge(z.object({ body: department.partial() }))), asyncHandler(async (req, res) => res.json({ data: await container.users.updateDepartment(req.auth, req.validated.params.id, req.validated.body) })));
  router.post('/role-requests', validate(z.object({ body: z.object({ requestedRoleCode: z.string().min(2), evidenceUrl: z.string().url().optional(), justification: z.string().max(2000).optional() }) })), asyncHandler(async (req, res) => res.status(201).json({ data: await container.users.requestRole(req.auth, req.validated.body) })));
  router.get('/role-requests', authorize('roles.approve'), asyncHandler(async (req, res) => res.json({ data: await container.users.listRoleRequests(req.auth) })));
  router.patch('/role-requests/:id/review', authorize('roles.approve'), validate(idParams.merge(z.object({ body: z.object({ decision: z.enum(['APPROVED', 'REJECTED']), reviewNote: z.string().max(2000).optional(), scope: z.enum(['OWN', 'DEPARTMENT', 'ORGANIZATION']).optional() }) }))), asyncHandler(async (req, res) => res.json({ data: await container.users.reviewRoleRequest(req.auth, req.validated.params.id, req.validated.body) })));
  return router;
}

module.exports = { usersRoutes };
