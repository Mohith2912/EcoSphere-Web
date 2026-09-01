const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
const { createContainer } = require('../src/container');

let server;
let baseUrl;
let container;

test.before(async () => {
  container = createContainer();
  server = createApp(container).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await container.prisma.$disconnect();
});

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

async function login(email, password) {
  return request('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
}

test('health endpoint starts without authentication', async () => {
  const { response, payload } = await request('/health');
  assert.equal(response.status, 200);
  assert.equal(payload.status, 'ok');
});

test('login validates empty and incorrect credentials', async () => {
  const empty = await login('', '');
  assert.equal(empty.response.status, 422);
  assert.equal(empty.payload.error.code, 'VALIDATION_ERROR');
  const incorrect = await login('admin@ecosphere.local', 'Incorrect@123');
  assert.equal(incorrect.response.status, 401);
  assert.equal(incorrect.payload.error.code, 'UNAUTHORIZED');
});

test('admin login, profile, and database-backed overview succeed', async () => {
  const auth = await login('admin@ecosphere.local', 'Admin@1234');
  assert.equal(auth.response.status, 200);
  assert.equal(auth.payload.data.defaultRoute, '/org/dashboard');
  const headers = { authorization: `Bearer ${auth.payload.data.accessToken}` };
  const me = await request('/api/auth/me', { headers });
  assert.equal(me.response.status, 200);
  assert.equal(me.payload.data.email, 'admin@ecosphere.local');
  const overview = await request('/api/overview', { headers });
  assert.equal(overview.response.status, 200);
  assert.equal(overview.payload.data.environment.carbonTransactionCount, 0);
  assert.equal(overview.payload.data.esg.status, 'NOT_CALCULATED');
});

test('employee routes correctly and RBAC rejects management actions', async () => {
  const auth = await login('employee@ecosphere.local', 'Employee@1234');
  assert.equal(auth.response.status, 200);
  assert.equal(auth.payload.data.defaultRoute, '/app/dashboard');
  const denied = await request('/api/environment/emission-factors', { method: 'POST', headers: { authorization: `Bearer ${auth.payload.data.accessToken}`, 'content-type': 'application/json' }, body: '{}' });
  assert.equal(denied.response.status, 403);
  assert.equal(denied.payload.error.code, 'FORBIDDEN');
});

test('unknown API route returns structured 404', async () => {
  const missing = await request('/api/not-a-route');
  assert.equal(missing.response.status, 404);
  assert.equal(missing.payload.error.code, 'ROUTE_NOT_FOUND');
});
