// server/oracleRoute.js
// Exemplo de endpoint Express para /api/oracle (server-side)
const express = require('express');
const fetch = require('node-fetch');
const { createParser } = require('./parsers/dateParser');
const { extractAmounts } = require('./parsers/moneyParser');
const { validateAndEnrichActions } = require('./actions/validator');

const router = express.Router();

const { insertPending, getPending, deletePending } = require('./supabaseServer');
// Em-memory pending slots por session (fallback)
const pendingSlots = new Map();

// System prompt otimizado
const SYSTEM_PROMPT = `Você é o Oráculo, um assistente de produtividade gamificado. Responda SEMPRE com JSON válido seguindo o esquema: {"intent":"string","entities":{},"confidence":0.0,"reply":"string","questions":[],"actions":[]}.
Regras: se faltar dado para executar ação, preencha "questions" (máx 2) e NÃO crie action. Confiança < 0.6 => intent: "desconhecido".`;

function isValidOracleResponse(obj) {
  return obj && typeof obj.intent === 'string' && typeof obj.reply === 'string' && Array.isArray(obj.actions);
}

router.post('/api/oracle', async (req, res) => {
  const startTime = Date.now();
  try {
    const { message = '', memories = [], context = {} } = req.body || {};

    // Monta o prompt com RAG
    const ragText = (memories || []).slice(0, 8).map(m => `- ${m.content || m}`).join('\n');
    const userBlock = `MEMÓRIAS RELEVANTES:\n${ragText}\n\nMENSAGEM DO USUÁRIO:\n${message}`;

    // Chama o provider LLM (config via env)
    const llmUrl = process.env.LLM_ENDPOINT;
    const llmKey = process.env.LLM_API_KEY;
    const llmConfigured = llmUrl && llmKey;

    // Extração server-side de entidades básicas
    const dateParser = createParser();
    const extractedDates = dateParser.extractAll(message || '');
    const monetary = extractAmounts(message || '');

    const body = {
      system: SYSTEM_PROMPT,
      user: userBlock,
      temperature: 0.2,
      max_tokens: 500
    };

    let parsed = null;
    if (llmConfigured) {
      const llmResp = await fetch(llmUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${llmKey}`
        },
        body: JSON.stringify(body)
      });

      const text = await llmResp.text();

      // Tenta extrair JSON puro da resposta
      const first = text.indexOf('{');
      const last = text.lastIndexOf('}');
      if (first === -1 || last === -1) throw new Error('Resposta LLM sem JSON');
      const rawJson = text.slice(first, last + 1);
      try {
        parsed = JSON.parse(rawJson);
      } catch (e) {
        throw new Error('Falha ao parsear JSON do LLM: ' + e.message);
      }

      if (!isValidOracleResponse(parsed)) {
        // keep going and fallback later
        parsed = null;
      }
    }

    // Se LLM não configurado ou parse falhou, montar fallback seguro
    if (!parsed) {
      parsed = {
        intent: 'desconhecido',
        entities: {},
        confidence: 0.0,
        reply: 'LLM não disponível; usando heurísticas locais.',
        questions: [],
        actions: []
      };
    }

    // Sempre anexa heurísticas extraídas em entities para ajudar clientes
    parsed.entities = parsed.entities || {};
    parsed.entities.extracted = parsed.entities.extracted || {};
    parsed.entities.extracted.dates = extractedDates;
    parsed.entities.extracted.monetary = monetary;
    // expõe amount de forma direta quando possível (útil para testes simples)
    if ((!parsed.entities.amount || parsed.entities.amount == null) && Array.isArray(monetary) && monetary.length > 0) {
      parsed.entities.amount = monetary[0].normalized;
    }

    // Anexa entidades extraídas
    parsed.entities = parsed.entities || {};
    parsed.entities.extracted = parsed.entities.extracted || {};
    parsed.entities.extracted.dates = extractedDates;
    parsed.entities.extracted.monetary = monetary;

    // Valida/enriquece actions se existirem
    if (Array.isArray(parsed.actions) && parsed.actions.length > 0) {
      try {
        const originalCount = parsed.actions.length;
        const enriched = await validateAndEnrichActions(parsed.actions, context);
        parsed.actions = enriched;
        parsed._meta = parsed._meta || {};
        parsed._meta.dropped = Math.max(0, originalCount - enriched.length);
        parsed._meta.keptActions = enriched.map(a => a.type);
      } catch (e) {
        console.warn('[oracleRoute] validateAndEnrichActions falhou:', e);
      }
    }

    // Enriquecer resposta com metadata básica
    parsed._meta = parsed._meta || {};
    parsed._meta.source = parsed._meta.source || 'llm_endpoint';
    parsed._meta.processingMs = Date.now() - startTime;

    // Se LLM retornou perguntas para slot-filling, persiste temporariamente por sessão
    try {
      const sessionKey = (context && (context.session || context.sessionId)) || null;
      if (Array.isArray(parsed.questions) && parsed.questions.length > 0 && sessionKey) {
        try {
          // tenta persistir no Supabase; se falhar, salva em memória
          await insertPending(sessionKey, parsed.questions.slice(0,2), parsed, context);
          parsed._meta.pendingSaved = true;
        } catch (e) {
          console.warn('[oracleRoute] insertPending failed, falling back to memory:', e.message);
          pendingSlots.set(sessionKey, {
            questions: parsed.questions.slice(0, 2),
            original: parsed,
            createdAt: Date.now(),
            ctx: context
          });
          parsed._meta.pendingSaved = true;
        }
      }
    } catch (e) {
      console.warn('[oracleRoute] failed to save pending slots:', e);
    }

    return res.json(parsed);
  } catch (err) {
    console.error('[/api/oracle] error:', err);
    return res.status(500).json({ intent: 'error', entities: {}, confidence: 0.0, reply: 'Erro interno no Oráculo.', questions: [], actions: [] });
  }
});

module.exports = router;

// Endpoint para verificar pending por session
router.get('/api/oracle/pending', async (req, res) => {
  try {
    const sessionKey = req.query.session || req.query.sessionId;
    if (!sessionKey) return res.status(400).json({ error: 'session required' });
    // tenta recuperar do Supabase
    try {
      const p = await getPending(sessionKey);
      if (!p) return res.json({ pending: null });
      return res.json({ pending: { questions: p.questions, createdAt: p.created_at, id: p.id } });
    } catch (e) {
      // fallback para memória
      const p = pendingSlots.get(sessionKey);
      if (!p) return res.json({ pending: null });
      return res.json({ pending: { questions: p.questions, createdAt: p.createdAt } });
    }
  } catch (e) {
    return res.status(500).json({ error: 'internal' });
  }
});

// Endpoint para preencher pending slots: { session, answers: [..] }
router.post('/api/oracle/pending/fill', async (req, res) => {
  try {
    const { session, answers = [] } = req.body || {};
    if (!session) return res.status(400).json({ error: 'session required' });

    // tenta recuperar do Supabase primeiro
    let p = null;
    try {
      p = await getPending(session);
    } catch (e) {
      // ignore, fallback to memory
    }

    if (!p) p = pendingSlots.get(session);
    if (!p) return res.status(404).json({ error: 'no pending for session' });

    const original = p.original || p;

    // Tenta aplicar respostas nas actions (heurística simples)
    const out = JSON.parse(JSON.stringify(original));
    if (Array.isArray(out.actions) && out.actions.length > 0) {
      const a = out.actions[0];
      a.payload = a.payload || {};
      // atribui as respostas em ordem às chaves faltantes do payload
      const keys = Object.keys(a.payload).filter(k => a.payload[k] == null || a.payload[k] === '');
      for (let i = 0; i < answers.length; i++) {
        const key = keys[i] || `answer_${i}`;
        a.payload[key] = answers[i];
      }
    } else {
      out.entities = out.entities || {};
      out.entities.filledAnswers = answers;
    }

    // valida/enriquece actions novamente
    if (Array.isArray(out.actions) && out.actions.length > 0) {
      const enriched = await validateAndEnrichActions(out.actions, p.ctx || {});
      out.actions = enriched;
      out._meta = out._meta || {};
      out._meta.dropped = Math.max(0, (original.actions || []).length - enriched.length);
      out._meta.keptActions = enriched.map(a => a.type);
    }

    // remove pending do Supabase (se existir) e da memória
    try { await deletePending(session); } catch (e) { /* ignore */ }
    pendingSlots.delete(session);

    return res.json({ result: out });
  } catch (e) {
    console.error('[pending/fill] error', e);
    return res.status(500).json({ error: 'internal' });
  }
});
