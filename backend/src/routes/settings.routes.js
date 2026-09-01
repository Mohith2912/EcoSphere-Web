const express = require('express');
const { z } = require('zod');
const { asyncHandler, validate } = require('../shared/http');

const weights = z.object({ environmental: z.coerce.number().nonnegative(), social: z.coerce.number().nonnegative(), governance: z.coerce.number().nonnegative() });

function settingsRoutes(container, authenticate, authorize) {
  const router = express.Router();
  router.use(authenticate, authorize('settings.manage'));
  router.get('/esg-scoring', asyncHandler(async (req, res) => res.json({ data: await container.settings.scoringWeights(req.auth) })));
  router.patch('/esg-scoring', validate(z.object({ body: weights })), asyncHandler(async (req, res) => res.json({ data: await container.settings.updateScoringWeights(req.auth, req.validated.body) })));
  return router;
}

module.exports = { settingsRoutes };
