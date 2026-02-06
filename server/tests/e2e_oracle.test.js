
❌°°₢�° eradocprdocexectoolm₢₢°// server/tests/e2e_oracle.test.js
// roda com: node tests/e2e_oracle.test.js
const assert = require('assert');
const fetch = require('node-fetch');

const BASE = process.env.TEST_BASE || 'http://localhost:8787';

async function post(path, body) {
  const resp = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = await resp.json();
  return { status: resp.status, json };
}

function validateSchema(j) {
  assert.equal(typeof j.intent, 'string', 'intent deve ser string');
  assert.equal(typeof j.entities, 'object', 'entities deve ser objeto');
  assert.equal(typeof j.confidence, 'number', 'confidence deve ser number');
  assert.equal(typeof j.reply, 'string', 'reply deve ser string');
  assert.ok(Array.isArray(j.questions), 'questions deve ser array');
  assert.ok(Array.isArray(j.actions), 'actions deve ser array');
}

(async () => {
  try {
    console.log('[E2E] health...');
    const health = await fetch(`${BASE}/health`);
    assert.equal(health.status, 200);

    console.log('[E2E] task prompt...');
    const { status, json } = await post('/api/oracle', {
      message: 'cria uma tarefa pra amanhã comprar pão',
      memories: ['Usuário prefere respostas curtas'],
      ctx: {}
    });

    assert.equal(status, 200);
    validateSchema(json);

    const action = json.actions.find(a => a.type === 'task.add');
    if (action) {
      assert.equal(typeof action.payload, 'object');
      assert.ok(action.payload.title, 'title deve existir');
    }

    console.log('[E2E] finance prompt...');
    const r2 = await post('/api/oracle', {
      message: 'gastei 50 no almoço',
      memories: [],
      ctx: {}
    });

    assert.equal(r2.status, 200);
    validateSchema(r2.json);

    const hasAmount =
      (r2.json.entities && typeof r2.json.entities.amount === 'number') ||
      r2.json.actions.some(a => a.type === 'finance.add' && typeof (a.payload && a.payload.amount) === 'number');

    assert.ok(hasAmount, 'deve detectar amount (50) em entities ou action payload');

    console.log('✅ E2E OK');
    process.exit(0);
  } catch (err) {
    console.error('❌ E2E FAIL:', err);
    process.exit(1);
  }
})();
