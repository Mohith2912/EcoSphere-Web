const express = require('express');
const { z } = require('zod');
const { asyncHandler, validate } = require('../shared/http');

const idParams = z.object({ params: z.object({ id: z.string().min(1) }) });
const factor = z.object({ activityType: z.string().min(2), unit: z.string().min(1), co2ePerUnit: z.coerce.number().nonnegative(), source: z.string().min(2).optional(), effectiveFrom: z.string().optional(), effectiveTo: z.string().nullable().optional(), status: z.enum(['ACTIVE', 'INACTIVE']).optional() });
const transaction = z.object({ emissionFactorId: z.string().min(1), activityAmount: z.coerce.number().nonnegative(), unit: z.string().min(1).optional(), departmentId: z.string().min(1).nullable().optional(), occurredAt: z.string().optional(), evidenceUrl: z.string().url().optional(), reference: z.string().max(200).optional() });
const goal = z.object({ title: z.string().min(2), metric: z.string().min(1), targetValue: z.coerce.number().nonnegative(), currentValue: z.coerce.number().nonnegative().optional(), targetDate: z.string().optional(), departmentId: z.string().min(1).nullable().optional(), status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED']).optional() });
const productProfile = z.object({ productName: z.string().min(2), productReference: z.string().max(100).optional(), classification: z.string().max(100).optional(), calculatedCo2e: z.coerce.number().nonnegative().optional(), environmentalAttributes: z.record(z.unknown()).optional(), metadata: z.record(z.unknown()).optional(), status: z.enum(['ACTIVE', 'INACTIVE']).optional() });
const autoCalculation = z.object({ enabled: z.boolean() });

function environmentRoutes(container, authenticate, authorize) {
  const router = express.Router();
  router.use(authenticate);
  router.get('/dashboard', authorize('environment.view'), asyncHandler(async (req, res) => res.json({ data: await container.environment.dashboard(req.auth) })));
  router.get('/emission-factors', authorize('environment.manage'), asyncHandler(async (req, res) => res.json({ data: await container.environment.listFactors(req.auth, req.query) })));
  router.post('/emission-factors', authorize('environment.manage'), validate(z.object({ body: factor })), asyncHandler(async (req, res) => res.status(201).json({ data: await container.environment.createFactor(req.auth, req.validated.body) })));
  router.patch('/emission-factors/:id', authorize('environment.manage'), validate(idParams.merge(z.object({ body: factor.partial() }))), asyncHandler(async (req, res) => res.json({ data: await container.environment.updateFactor(req.auth, req.validated.params.id, req.validated.body) })));
  router.get('/carbon-transactions', authorize('environment.view'), asyncHandler(async (req, res) => res.json({ data: await container.environment.listTransactions(req.auth, req.query) })));
  router.post('/carbon-transactions', authorize('environment.manage'), validate(z.object({ body: transaction })), asyncHandler(async (req, res) => res.status(201).json({ data: await container.environment.createCarbonTransaction(req.auth, req.validated.body) })));
  router.get('/settings/auto-calculation', authorize('environment.manage'), asyncHandler(async (req, res) => res.json({ data: await container.environment.autoCalculationSetting(req.auth) })));
  router.patch('/settings/auto-calculation', authorize('environment.manage'), validate(z.object({ body: autoCalculation })), asyncHandler(async (req, res) => res.json({ data: await container.environment.updateAutoCalculationSetting(req.auth, req.validated.body.enabled) })));
  router.post('/operational-events/carbon', authorize('environment.manage'), validate(z.object({ body: transaction })), asyncHandler(async (req, res) => res.status(201).json({ data: await container.environment.processOperationalCarbonEvent(req.auth, req.validated.body) })));
  router.get('/goals', authorize('environment.view'), asyncHandler(async (req, res) => res.json({ data: await container.environment.listGoals(req.auth) })));
  router.post('/goals', authorize('environment.manage'), validate(z.object({ body: goal })), asyncHandler(async (req, res) => res.status(201).json({ data: await container.environment.upsertGoal(req.auth, req.validated.body) })));
  router.patch('/goals/:id', authorize('environment.manage'), validate(idParams.merge(z.object({ body: goal.partial() }))), asyncHandler(async (req, res) => res.json({ data: await container.environment.upsertGoal(req.auth, req.validated.body, req.validated.params.id) })));
  router.get('/product-esg-profiles', authorize('environment.view'), asyncHandler(async (req, res) => res.json({ data: await container.environment.listProductProfiles(req.auth) })));
  router.post('/product-esg-profiles', authorize('environment.manage'), validate(z.object({ body: productProfile })), asyncHandler(async (req, res) => res.status(201).json({ data: await container.environment.upsertProductProfile(req.auth, req.validated.body) })));
  router.patch('/product-esg-profiles/:id', authorize('environment.manage'), validate(idParams.merge(z.object({ body: productProfile.partial() }))), asyncHandler(async (req, res) => res.json({ data: await container.environment.upsertProductProfile(req.auth, req.validated.body, req.validated.params.id) })));
  return router;
}

module.exports = { environmentRoutes };
