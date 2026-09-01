const express = require('express');
const crypto = require('node:crypto');
const { env } = require('./config/env');
const { authenticate, authorize } = require('./middleware/auth');
const { errorHandler, notFoundHandler, asyncHandler } = require('./shared/http');
const { authRoutes } = require('./routes/auth.routes');
const { usersRoutes } = require('./routes/users.routes');
const { environmentRoutes } = require('./routes/environment.routes');
const { socialRoutes } = require('./routes/social.routes');
const { governanceRoutes } = require('./routes/governance.routes');
const { gamificationRoutes } = require('./routes/gamification.routes');
const { notificationsRoutes } = require('./routes/notifications.routes');
const { reportsRoutes } = require('./routes/reports.routes');
const { settingsRoutes } = require('./routes/settings.routes');

function createApp(container) {
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    const origin = req.headers.origin;
    if (origin && env.corsOrigin.split(',').map((item) => item.trim()).includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Request-Id');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  });
  app.use(express.json({ limit: '1mb' }));
  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok', service: 'ecosphere-backend', database: 'not_checked' }));

  const auth = authenticate(container.repositories);
  const permit = (permission) => authorize(permission);
  app.use('/api/auth', authRoutes(container, auth));
  app.use('/api/users', usersRoutes(container, auth, permit));
  app.use('/api/environment', environmentRoutes(container, auth, permit));
  app.use('/api/social', socialRoutes(container, auth, permit));
  app.use('/api/governance', governanceRoutes(container, auth, permit));
  app.use('/api/gamification', gamificationRoutes(container, auth, permit));
  app.use('/api/notifications', notificationsRoutes(container, auth));
  app.use('/api/reports', reportsRoutes(container, auth));
  app.use('/api/settings', settingsRoutes(container, auth, permit));
  app.get('/api/overview', auth, asyncHandler(async (req, res) => {
    const data = {};
    if (req.auth.permissions['environment.view']?.length) data.environment = await container.environment.dashboard(req.auth);
    if (req.auth.permissions['social.view']?.length) data.social = await container.social.dashboard(req.auth);
    if (req.auth.permissions['governance.view']?.length) data.governance = await container.governance.dashboard(req.auth);
    if (req.auth.permissions['gamification.view']?.length) data.gamification = await container.gamification.myProgress(req.auth);
    res.json({ data: { ...data, esg: { overallScore: null, status: 'NOT_CALCULATED', message: 'Not Calculated — module scores or approved scoring weights are unavailable.' } } });
  }));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
