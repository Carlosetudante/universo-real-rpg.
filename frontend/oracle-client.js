// frontend/oracle-client.js
// Funções cliente para decisão híbrida (NLU local + fallback + RAG + LLM)
(function () {
  async function searchMemories(text) {
    if (typeof searchOracleMemory === 'function') {
      try {
        const hits = await searchOracleMemory(text);
        return (hits || []).slice(0, 8).map(h => ({ content: h.fact || h.text || h.title || '' }));
      } catch (e) {
        console.warn('searchOracleMemory erro', e);
        return [];
      }
    }
    return [];
  }

  function isValidOracleResponse(obj) {
    return obj && typeof obj.intent === 'string' && typeof obj.reply === 'string' && Array.isArray(obj.actions);
  }

  function makeSessionId() {
    return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
  }

  async function getPending(session) {
    try {
      const resp = await fetch(`/api/oracle/pending?session=${encodeURIComponent(session)}`);
      if (!resp.ok) return null;
      return await resp.json();
    } catch (e) { return null; }
  }

  async function fillPending(session, answers = []) {
    try {
      const resp = await fetch('/api/oracle/pending/fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session, answers })
      });
      if (!resp.ok) throw new Error('fill failed');
      return await resp.json();
    } catch (e) {
      console.warn('fillPending failed', e);
      return null;
    }
  }

  async function understandWithRAG(message, context = {}, options = {}) {
    const DECISION_THRESHOLD = 0.75;
    const FALLBACK_THRESHOLD = 0.70;

    const cfg = window.OracleConfig || {};
    const useLLM = options.useLLM ?? cfg.useLLM ?? false;

    // Ensure we send a session id so server can persist pending slot-fills
    let sessionKey = null;
    if (context) {
      if (typeof context === 'string') sessionKey = context;
      else if (context.session) sessionKey = (typeof context.session === 'string') ? context.session : context.session.id || null;
    }
    if (!sessionKey) {
      sessionKey = makeSessionId();
      try { if (context && typeof context === 'object') context.session = sessionKey; } catch (e) {}
    }

    // 1) NLU local
    let localResult = { intent: 'unknown', confidence: 0.0 };
    try { if (window.OracleNLU && typeof window.OracleNLU.detectIntent === 'function') localResult = window.OracleNLU.detectIntent(message); } catch (e) {}
    if (localResult && localResult.confidence >= DECISION_THRESHOLD) return { ...localResult, source: 'nlu_local' };

    // 2) Fallback leve
    let fast = { intent: 'desconhecido', confidence: 0.0 };
    try { if (window.OracleBrain && typeof window.OracleBrain.keywordFallback === 'function') fast = window.OracleBrain.keywordFallback(message); } catch (e) {}
    if (fast && fast.confidence >= FALLBACK_THRESHOLD) return { ...fast, source: 'keyword_fallback' };

    // 3) RAG
    const memories = await searchMemories(message);

    // 4) LLM via endpoint seguro (opcional)
    if (useLLM) {
      try {
        const resp = await fetch('/api/oracle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, memories, ctx: context })
        });
        if (resp.ok) {
          const data = await resp.json();
          window.OracleTelemetry?.log('llm_used', { ok: true, intent: data.intent, confidence: data.confidence });
          const safeReturn = (obj) => ({
            intent: obj?.intent || 'desconhecido',
            entities: obj?.entities || {},
            confidence: typeof obj?.confidence === 'number' ? obj.confidence : 0,
            reply: obj?.reply || '',
            questions: Array.isArray(obj?.questions) ? obj.questions.slice(0,2) : [],
            actions: Array.isArray(obj?.actions) ? obj.actions : [],
            source: 'llm',
            session: context && (context.session || context.sessionId) ? (context.session || context.sessionId) : sessionKey
          });
          return safeReturn(data);
        }
        window.OracleTelemetry?.log('llm_used', { ok: false, status: resp.status });
      } catch (e) {
        console.warn('understandWithRAG LLM falhou:', e);
        window.OracleTelemetry?.log('llm_error', { msg: String(e?.message || e) });
      }
    }

    // fallback final
    return fast || localResult || { intent: 'desconhecido', entities: {}, confidence: 0.2, reply: 'Não entendi. Quer criar tarefa, finanças, XP ou status?', questions: [], actions: [], source: 'fallback_final', session: sessionKey };
  }

  window.OracleClient = {
    understandWithRAG,
    searchMemories,
    getPending,
    fillPending
  };

})();
