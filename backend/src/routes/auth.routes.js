const express = require('express');
const { z } = require('zod');
const { asyncHandler, validate } = require('../shared/http');

function authRoutes(container, authenticate) {
  const router = express.Router();
  router.post('/login', validate(z.object({ body: z.object({ email: z.string().email(), password: z.string().min(8), organizationCode: z.string().min(2).optional() }) })), asyncHandler(async (req, res) => {
    res.json({ data: await container.auth.login(req.validated.body) });
  }));
  router.get('/me', authenticate, (req, res) => res.json({ data: container.auth.profile(req.auth) }));
  return router;
}

module.exports = { authRoutes };
