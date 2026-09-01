const express = require('express');
const { z } = require('zod');
const { asyncHandler, validate } = require('../shared/http');

const idParams = z.object({ params: z.object({ id: z.string().min(1) }) });
const activity = z.object({ title: z.string().min(2), description: z.string().min(2), categoryId: z.string().min(1).nullable().optional(), departmentId: z.string().min(1).nullable().optional(), startsAt: z.string().optional(), endsAt: z.string().optional(), location: z.string().max(200).optional(), evidenceRequired: z.boolean().optional(), xpAward: z.coerce.number().nonnegative().optional(), pointsAward: z.coerce.number().nonnegative().optional(), status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional() });
const participation = z.object({ evidenceUrl: z.string().url().optional(), notes: z.string().max(2000).optional() });
const review = z.object({ decision: z.enum(['APPROVED', 'REJECTED']), reviewNote: z.string().max(2000).optional() });

function socialRoutes(container, authenticate, authorize) {
  const router = express.Router();
  router.use(authenticate);
  router.get('/dashboard', authorize('social.view'), asyncHandler(async (req, res) => res.json({ data: await container.social.dashboard(req.auth) })));
  router.get('/csr-activities', authorize('social.participate'), asyncHandler(async (req, res) => res.json({ data: await container.social.listActivities(req.auth) })));
  router.get('/csr-activities/manage', authorize('social.manage'), asyncHandler(async (req, res) => res.json({ data: await container.social.listActivities(req.auth, true) })));
  router.post('/csr-activities', authorize('social.manage'), validate(z.object({ body: activity })), asyncHandler(async (req, res) => res.status(201).json({ data: await container.social.createActivity(req.auth, req.validated.body) })));
  router.patch('/csr-activities/:id', authorize('social.manage'), validate(idParams.merge(z.object({ body: activity.partial() }))), asyncHandler(async (req, res) => res.json({ data: await container.social.updateActivity(req.auth, req.validated.params.id, req.validated.body) })));
  router.post('/csr-activities/:id/participations', authorize('social.participate'), validate(idParams.merge(z.object({ body: participation }))), asyncHandler(async (req, res) => res.status(201).json({ data: await container.social.participate(req.auth, req.validated.params.id, req.validated.body) })));
  router.get('/my-participations', authorize('social.participate'), asyncHandler(async (req, res) => res.json({ data: await container.social.myParticipations(req.auth) })));
  router.patch('/participations/:id/review', authorize('social.approve'), validate(idParams.merge(z.object({ body: review }))), asyncHandler(async (req, res) => res.json({ data: await container.social.reviewParticipation(req.auth, req.validated.params.id, req.validated.body) })));
  return router;
}

module.exports = { socialRoutes };
