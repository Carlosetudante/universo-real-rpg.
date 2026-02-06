const fetch = require('node-fetch');

// Tente obter das env vars do servidor, senão utiliza fallback do cliente (ruim para produção)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tufcnxbveupoqrgdabfg.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1ZmNueGJ2ZXVwb3FyZ2RhYmZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NzE2NzcsImV4cCI6MjA4NTA0NzY3N30.gYn4KDSBjuzt0yYo8_ha4W3AJnvwP_xSwblmL0wvG_4';

const REST_BASE = SUPABASE_URL.replace(/\/$/, '') + '/rest/v1';

async function insertPending(session, questions, original, ctx = {}) {
  const url = `${REST_BASE}/oracle_pending`;
  const body = [{ session, questions, original, ctx }];
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`insertPending failed: ${resp.status} ${txt}`);
  }
  const data = await resp.json();
  return data[0];
}

async function getPending(session) {
  const url = `${REST_BASE}/oracle_pending?session=eq.${encodeURIComponent(session)}`;
  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`getPending failed: ${resp.status} ${txt}`);
  }
  const data = await resp.json();
  return (data && data.length > 0) ? data[0] : null;
}

async function deletePending(session) {
  const url = `${REST_BASE}/oracle_pending?session=eq.${encodeURIComponent(session)}`;
  const resp = await fetch(url, {
    method: 'DELETE',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`deletePending failed: ${resp.status} ${txt}`);
  }
  return true;
}

module.exports = { insertPending, getPending, deletePending };
