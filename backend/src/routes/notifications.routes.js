const express = require('express');
const { z } = require('zod');
const { asyncHandler, validate } = require('../shared/http');

function notificationsRoutes(container, authenticate) {
  const router = express.Router();
  router.use(authenticate);
  router.get('/', validate(z.object({ query: z.object({ unreadOnly: z.enum(['true', 'false']).optional() }) })), asyncHandler(async (req, res) => res.json({ data: await container.notifications.list(req.auth, req.validated.query.unreadOnly === 'true') })));
  router.patch('/:id/read', validate(z.object({ params: z.object({ id: z.string().min(1) }) })), asyncHandler(async (req, res) => res.json({ data: await container.notifications.markRead(req.auth, req.validated.params.id) })));
  return router;
}

module.exports = { notificationsRoutes };
