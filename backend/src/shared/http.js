const { ZodError } = require('zod');
const { AppError } = require('./AppError');
const { Prisma } = require('@prisma/client');

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function validate(schema) {
  return (req, _res, next) => {
    try {
      req.validated = schema.parse({ body: req.body, params: req.params, query: req.query });
      next();
    } catch (error) { next(error); }
  };
}

function notFoundHandler(req, _res, next) {
  next(new AppError(404, 'ROUTE_NOT_FOUND', `No route matches ${req.method} ${req.originalUrl}.`));
}

function errorHandler(error, _req, res, _next) {
  if (error instanceof ZodError) {
    return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Request validation failed.', details: error.flatten() } });
  }
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: { code: error.code, message: error.message, details: error.details } });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return res.status(409).json({ error: { code: 'DUPLICATE_RECORD', message: 'A record with the same unique reference already exists.' } });
    if (error.code === 'P2003') return res.status(409).json({ error: { code: 'RELATED_RECORD_CONFLICT', message: 'This record is still referenced by another resource.' } });
    if (error.code === 'P2025') return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'The requested record was not found.' } });
  }
  console.error(error);
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } });
}

module.exports = { asyncHandler, validate, notFoundHandler, errorHandler };
