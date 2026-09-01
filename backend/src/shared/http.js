const { ZodError } = require('zod');
const { AppError } = require('./AppError');

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
  console.error(error);
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } });
}

module.exports = { asyncHandler, validate, notFoundHandler, errorHandler };
