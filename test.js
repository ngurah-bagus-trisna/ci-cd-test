const test = require('node:test');
const assert = require('node:assert');
const { app, resetData } = require('./index');

let server;

test.beforeEach(() => {
  resetData();
  server = app.listen(0);
});

test.afterEach(() => {
  server.close();
});

test('GET /api/transactions returns empty array', async () => {
  const base = `http://localhost:${server.address().port}`;
  const res = await fetch(base + '/api/transactions');
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.deepStrictEqual(body, []);
});

test('CRUD flow', async () => {
  const base = `http://localhost:${server.address().port}`;
  let res = await fetch(base + '/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description: 'test', amount: 10 })
  });
  assert.strictEqual(res.status, 201);
  const created = await res.json();
  const id = created.id;

  res = await fetch(base + `/api/transactions/${id}`);
  assert.strictEqual(res.status, 200);
  let body = await res.json();
  assert.strictEqual(body.description, 'test');

  res = await fetch(base + `/api/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 20 })
  });
  assert.strictEqual(res.status, 200);
  body = await res.json();
  assert.strictEqual(body.amount, 20);

  res = await fetch(base + '/api/transactions');
  body = await res.json();
  assert.strictEqual(body.length, 1);

  res = await fetch(base + `/api/transactions/${id}`, { method: 'DELETE' });
  assert.strictEqual(res.status, 204);

  res = await fetch(base + '/api/transactions');
  body = await res.json();
  assert.deepStrictEqual(body, []);
});

test('missing transaction returns 404', async () => {
  const base = `http://localhost:${server.address().port}`;
  const res = await fetch(base + '/api/transactions/999');
  assert.strictEqual(res.status, 404);
});
