function createPrismaClient() {
  // Kept here so service tests can run without a database or generated Prisma client.
  const { PrismaClient } = require('@prisma/client');
  return new PrismaClient();
}

module.exports = { createPrismaClient };
