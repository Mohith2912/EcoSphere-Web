const crypto = require('node:crypto');

function idempotencyKey() { return crypto.randomUUID(); }

module.exports = { idempotencyKey };
