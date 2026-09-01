const express = require('express');
const { z } = require('zod');
const { asyncHandler, validate } = require('../shared/http');

const reportQuery = z.object({ params: z.object({ type: z.enum(['ENVIRONMENTAL', 'SOCIAL', 'GOVERNANCE', 'ESG_SUMMARY']) }), query: z.object({ scope: z.enum(['PERSONAL', 'DEPARTMENT', 'ORGANIZATION']).default('ORGANIZATION') }) });

function reportsRoutes(container, authenticate) {
  const router = express.Router();
  router.use(authenticate);
  router.get('/:type', validate(reportQuery), asyncHandler(async (req, res) => res.json({ data: await container.reports.generate(req.auth, req.validated.params.type, req.validated.query.scope) })));
  router.get('/:type/export.csv', validate(reportQuery), asyncHandler(async (req, res) => {
    const file = await container.reports.exportCsv(req.auth, req.validated.params.type, req.validated.query.scope);
    res.attachment(file.filename).type('text/csv').send(file.body);
  }));
  return router;
}

module.exports = { reportsRoutes };
