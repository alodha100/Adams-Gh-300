const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../server');

let server;
let baseUrl;
before(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve) => server.close(resolve)));

function register(data, headers = { 'Content-Type': 'application/json' }) {
  return fetch(`${baseUrl}/api/registrations`, {
    method: 'POST', headers, body: JSON.stringify(data),
  });
}

test('serves the training page and frontend assets', async () => {
  for (const [path, type] of [['/', 'text/html'], ['/app.js', 'text/javascript'], ['/styles.css', 'text/css']]) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, 200);
    assert.ok(response.headers.get('content-type').startsWith(type));
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    if (path === '/') assert.match(await response.text(), /GH-300 training/);
  }
});

test('lists unique topics with the fields needed by the frontend', async () => {
  const response = await fetch(`${baseUrl}/api/topics`);
  assert.equal(response.status, 200);
  const topics = await response.json();
  assert.equal(topics.length, 6);
  assert.equal(new Set(topics.map((topic) => topic.id)).size, topics.length);
  for (const topic of topics) {
    for (const field of ['id', 'title', 'description', 'duration']) {
      assert.equal(typeof topic[field], 'string');
      assert.ok(topic[field].length);
    }
    assert.equal(topic.capacity, 30);
    assert.equal(topic.registrationCount, 0);
  }
});

test('reports per-topic registration counts without enforcing the displayed capacity', async () => {
  const data = { name: 'Demo Learner', email: 'counts@example.com', topicId: 'testing-debugging' };
  for (let index = 0; index < 31; index += 1) {
    assert.equal((await register({ ...data, email: `counts${index}@example.com` })).status, 201);
  }
  assert.equal((await register({ ...data, topicId: 'hands-on-lab' })).status, 201);
  const response = await fetch(`${baseUrl}/api/topics`);
  assert.equal(response.status, 200);
  const topics = await response.json();
  for (const topic of topics) {
    const expected = topic.id === 'testing-debugging' ? 31 : topic.id === 'hands-on-lab' ? 1 : 0;
    assert.equal(topic.registrationCount, expected);
    assert.equal(topic.capacity, 30);
    assert.deepEqual(Object.keys(topic).sort(),
      ['id', 'title', 'description', 'duration', 'capacity', 'registrationCount'].sort());
  }
  assert.ok(!JSON.stringify(topics).includes('counts@example.com'));
});

test('registers, normalizes details, and prevents duplicate email/topic pairs', async () => {
  const data = { name: ' Demo Learner ', email: ' Learner@Example.com ', topicId: 'copilot-fundamentals' };
  const response = await register(data);
  assert.equal(response.status, 201);
  const result = await response.json();
  assert.equal(result.registration.name, 'Demo Learner');
  assert.equal(result.registration.email, 'learner@example.com');
  assert.ok(result.registration.id);
  assert.match(result.message, /GitHub Copilot fundamentals/);
  assert.equal((await register({ ...data, email: 'learner@example.com' })).status, 409);
  assert.equal((await register({ ...data, topicId: 'effective-prompts' })).status, 201);
});

test('rejects missing, invalid, and overlong registration fields', async () => {
  const valid = { name: 'Demo', email: 'demo@example.com', topicId: 'copilot-chat' };
  for (const invalid of [
    null, [], {}, { ...valid, name: ' ' }, { ...valid, name: 123 },
    { ...valid, name: 'a'.repeat(101) }, { ...valid, email: 'invalid' },
    { ...valid, email: 'a'.repeat(250) + '@example.com' },
    { ...valid, topicId: 'unknown' },
  ]) {
    const response = await register(invalid);
    assert.equal(response.status, 400);
    assert.ok((await response.json()).error);
  }
});

test('rejects malformed JSON, oversized bodies, and unsupported content types', async () => {
  const response = await fetch(`${baseUrl}/api/registrations`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{',
  });
  assert.equal(response.status, 400);
  assert.equal((await register({ name: 'a'.repeat(9000) })).status, 413);
  assert.equal((await register({}, { 'Content-Type': 'text/plain' })).status, 415);
});

test('does not expose registrations, source files, or arbitrary paths', async () => {
  for (const path of ['/api/registrations', '/server.js', '/package.json', '/unknown']) {
    assert.equal((await fetch(`${baseUrl}${path}`)).status, 404);
  }
});
