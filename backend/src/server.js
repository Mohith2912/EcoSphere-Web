const { env } = require('./config/env');
const { createContainer } = require('./container');
const { createApp } = require('./app');

const container = createContainer();
const app = createApp(container);
const server = app.listen(env.port, () => console.warn(`EcoSphere backend listening on port ${env.port}`));

async function shutdown(signal) {
  console.warn(`${signal} received; shutting down EcoSphere backend.`);
  server.close(async () => {
    await container.prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
