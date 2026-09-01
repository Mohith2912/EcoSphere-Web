const express = require('express');
const { z } = require('zod');
const { asyncHandler, validate } = require('../shared/http');

const idParams = z.object({ params: z.object({ id: z.string().min(1) }) });
const challenge = z.object({ title: z.string().min(2), categoryId: z.string().min(1).nullable().optional(), description: z.string().min(2), xp: z.coerce.number().nonnegative(), points: z.coerce.number().nonnegative().optional(), difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(), evidenceRequired: z.boolean().optional(), deadline: z.string().optional(), status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional() });
const submission = z.object({ evidenceUrl: z.string().url().optional(), notes: z.string().max(2000).optional() });
const review = z.object({ decision: z.enum(['APPROVED', 'REJECTED']), reviewNote: z.string().max(2000).optional() });
const badge = z.object({ name: z.string().min(2), description: z.string().min(2), iconUrl: z.string().url().optional(), unlockRule: z.object({ minXp: z.coerce.number().nonnegative().optional(), completedChallenges: z.coerce.number().int().nonnegative().optional() }), status: z.enum(['ACTIVE', 'INACTIVE']).optional() });
const reward = z.object({ name: z.string().min(2), description: z.string().min(2), pointsRequired: z.coerce.number().nonnegative(), stock: z.coerce.number().int().nonnegative(), imageUrl: z.string().url().optional(), status: z.enum(['ACTIVE', 'INACTIVE']).optional() });

function gamificationRoutes(container, authenticate, authorize) {
  const router = express.Router();
  router.use(authenticate);
  router.get('/challenges', authorize('gamification.participate'), asyncHandler(async (req, res) => res.json({ data: await container.gamification.listChallenges(req.auth) })));
  router.get('/challenges/manage', authorize('gamification.manage'), asyncHandler(async (req, res) => res.json({ data: await container.gamification.listChallenges(req.auth, true) })));
  router.post('/challenges', authorize('gamification.manage'), validate(z.object({ body: challenge })), asyncHandler(async (req, res) => res.status(201).json({ data: await container.gamification.createChallenge(req.auth, req.validated.body) })));
  router.patch('/challenges/:id', authorize('gamification.manage'), validate(idParams.merge(z.object({ body: challenge.partial() }))), asyncHandler(async (req, res) => res.json({ data: await container.gamification.updateChallenge(req.auth, req.validated.params.id, req.validated.body) })));
  router.post('/challenges/:id/participations', authorize('gamification.participate'), validate(idParams), asyncHandler(async (req, res) => res.status(201).json({ data: await container.gamification.joinChallenge(req.auth, req.validated.params.id) })));
  router.patch('/participations/:id/submit', authorize('gamification.participate'), validate(idParams.merge(z.object({ body: submission }))), asyncHandler(async (req, res) => res.json({ data: await container.gamification.submitChallenge(req.auth, req.validated.params.id, req.validated.body) })));
  router.patch('/participations/:id/review', authorize('gamification.approve'), validate(idParams.merge(z.object({ body: review }))), asyncHandler(async (req, res) => res.json({ data: await container.gamification.reviewChallenge(req.auth, req.validated.params.id, req.validated.body) })));
  router.get('/my-progress', authorize('gamification.view'), asyncHandler(async (req, res) => res.json({ data: await container.gamification.myProgress(req.auth) })));
  router.get('/leaderboard', authorize('gamification.view'), validate(z.object({ query: z.object({ type: z.enum(['employee', 'department']).optional() }) })), asyncHandler(async (req, res) => res.json({ data: await container.gamification.leaderboard(req.auth, req.validated.query.type) })));
  router.get('/badges', authorize('gamification.view'), asyncHandler(async (req, res) => res.json({ data: await container.gamification.listBadges(req.auth) })));
  router.post('/badges', authorize('gamification.manage'), validate(z.object({ body: badge })), asyncHandler(async (req, res) => res.status(201).json({ data: await container.gamification.createBadge(req.auth, req.validated.body) })));
  router.get('/rewards', authorize('gamification.view'), asyncHandler(async (req, res) => res.json({ data: await container.gamification.listRewards(req.auth) })));
  router.post('/rewards', authorize('gamification.manage'), validate(z.object({ body: reward })), asyncHandler(async (req, res) => res.status(201).json({ data: await container.gamification.createReward(req.auth, req.validated.body) })));
  router.post('/rewards/:id/redemptions', authorize('gamification.participate'), validate(idParams), asyncHandler(async (req, res) => res.status(201).json({ data: await container.gamification.redeemReward(req.auth, req.validated.params.id) })));
  return router;
}

module.exports = { gamificationRoutes };
