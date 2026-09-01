const dotenv = require('dotenv');

dotenv.config();

const requiredInProduction = ['DATABASE_URL', 'JWT_SECRET'];

function getEnv() {
  const env = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 4000),
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    organizationBootstrapSecret: process.env.ORGANIZATION_BOOTSTRAP_SECRET || null
  };

  if (env.nodeEnv === 'production') {
    for (const key of requiredInProduction) {
      if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
    }
  }
  return env;
}

module.exports = { env: getEnv() };
