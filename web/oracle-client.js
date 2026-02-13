// oracle-client.js (duplicado da pasta frontend)
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

  function normalizeOracleResult(obj, source, sessionKey, context) {
    return {
      intent: obj?.intent || 'desconhecido',
      entities: obj?.entities || {},
      confidence: typeof obj?.confidence === 'number' ? obj.confidence : 0,
      reply: obj?.reply || '',
      questions: Array.isArray(obj?.questions) ? obj.questions.slice(0, 2) : [],
      actions: Array.isArray(obj?.actions) ? obj.actions : [],
      source,
      session: context && (context.session || context.sessionId) ? (context.session || context.sessionId) : sessionKey
    };
  }

  async function callMiniMaxDirect({ message, memories, model, apiKey, baseUrl, sessionKey, context }) {
    const endpoint = `${String(baseUrl || 'https://api.minimax.io/v1').replace(/\/+$/, '')}/chat/completions`;
    const memoryText = (memories || [])
      .map((m, i) => `${i + 1}. ${String(m?.content || '').trim()}`)
      .filter(Boolean)
      .join('\n');

    const systemPrompt = [
      'Você é o Oráculo do app Universo Real.',
      'Responda em português (pt-BR).',
      'Retorne EXATAMENTE um JSON válido com chaves: intent, entities, confidence, reply, questions, actions.',
      'questions deve ser array curto (máximo 2). actions deve ser array.',
      'confidence entre 0 e 1.'
    ].join(' ');

    const userPrompt = [
      `Mensagem do usuário: ${message}`,
      memoryText ? `Memórias úteis:\n${memoryText}` : 'Memórias úteis: nenhuma.'
    ].join('\n\n');

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'MiniMax-M1',
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!resp.ok) {
      throw new Error(`MiniMax HTTP ${resp.status}`);
    }

    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content || '';
    if (!text) throw new Error('MiniMax sem conteúdo');

    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      const match = String(text).match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('MiniMax não retornou JSON de resposta válido');
    }

    return normalizeOracleResult(parsed, 'llm_minimax', sessionKey, context);
  }

  async function callRapidApiChatbot({ message, apiKey, endpoint, host, sessionKey, context, cfg }) {
    const apiEndpoint = endpoint || 'https://chatgpt-ai-chat-bot.p.rapidapi.com/ask';
    const apiHost = host || 'chatgpt-ai-chat-bot.p.rapidapi.com';
    const lowerEndpoint = String(apiEndpoint).toLowerCase();
    let requestBody = { query: message };

    if (lowerEndpoint.includes('/adultgpt') || apiHost.includes('adult-gpt')) {
      requestBody = {
        messages: [{ role: 'user', content: message }],
        genere: cfg?.rapidapiAdultGenre || 'ai-gay-1',
        bot_name: '',
        temperature: Number(cfg?.rapidapiTemperature ?? 0.9),
        top_k: Number(cfg?.rapidapiTopK ?? 10),
        top_p: Number(cfg?.rapidapiTopP ?? 0.9),
        max_tokens: Number(cfg?.rapidapiMaxTokens ?? 200)
      };
    } else if (lowerEndpoint.includes('/conversationllama')) {
      requestBody = {
        messages: [{ role: 'user', content: message }],
        web_access: false
      };
    }

    const resp = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': apiHost
      },
      body: JSON.stringify(requestBody)
    });

    if (!resp.ok) {
      let details = '';
      try { details = await resp.text(); } catch (e) {}
      const err = new Error(`RapidAPI HTTP ${resp.status}${details ? `: ${details.slice(0, 120)}` : ''}`);
      err.status = resp.status;
      throw err;
    }

    const data = await resp.json();
    if (data && typeof data.intent === 'string') {
      return normalizeOracleResult(data, 'llm_rapidapi_chatbot', sessionKey, context);
    }

    const reply =
      data?.reply ||
      data?.response ||
      data?.output ||
      data?.answer ||
      data?.result ||
      data?.message ||
      data?.data?.response ||
      data?.choices?.[0]?.message?.content ||
      '';

    return normalizeOracleResult({
      intent: 'general.chat',
      entities: {},
      confidence: 0.7,
      reply: String(reply || 'Não consegui interpretar a resposta do provedor.'),
      questions: [],
      actions: []
    }, 'llm_rapidapi_chatbot', sessionKey, context);
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
    const llmProvider = String(options.provider ?? cfg.llmProvider ?? 'server').toLowerCase();
    const llmModel = options.model ?? cfg.llmModel ?? 'MiniMax-M1';
    const minimaxApiKey = options.minimaxApiKey ?? cfg.minimaxApiKey ?? '';
    const minimaxBaseUrl = options.minimaxBaseUrl ?? cfg.minimaxBaseUrl ?? 'https://api.minimax.io/v1';
    const rapidapiKey = options.rapidapiKey ?? cfg.rapidapiKey ?? '';
    const rapidapiHost = options.rapidapiHost ?? cfg.rapidapiHost ?? 'chatgpt-ai-chat-bot.p.rapidapi.com';
    const rapidapiEndpoint = options.rapidapiEndpoint ?? cfg.rapidapiEndpoint ?? 'https://chatgpt-ai-chat-bot.p.rapidapi.com/ask';

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
        if (llmProvider === 'minimax' && minimaxApiKey) {
          const direct = await callMiniMaxDirect({
            message,
            memories,
            model: llmModel,
            apiKey: minimaxApiKey,
            baseUrl: minimaxBaseUrl,
            sessionKey,
            context
          });
          window.OracleTelemetry?.log('llm_used', {
            ok: true,
            provider: 'minimax',
            model: llmModel,
            confidence: direct?.confidence
          });
          return direct;
        }

        if (llmProvider === 'rapidapi_chatbot' && rapidapiKey) {
          const rapid = await callRapidApiChatbot({
            message,
            apiKey: rapidapiKey,
            endpoint: rapidapiEndpoint,
            host: rapidapiHost,
            sessionKey,
            context,
            cfg
          });
          window.OracleTelemetry?.log('llm_used', {
            ok: true,
            provider: 'rapidapi_chatbot',
            endpoint: rapidapiEndpoint
          });
          return rapid;
        }

        const resp = await fetch('/api/oracle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            memories,
            ctx: context,
            llm: {
              provider: llmProvider,
              model: llmModel
            }
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          window.OracleTelemetry?.log('llm_used', { ok: true, intent: data.intent, confidence: data.confidence });
          return normalizeOracleResult(data, `llm_${llmProvider || 'server'}`, sessionKey, context);
        }
        window.OracleTelemetry?.log('llm_used', { ok: false, status: resp.status, provider: llmProvider });
      } catch (e) {
        console.warn('understandWithRAG LLM falhou:', e);
        window.OracleTelemetry?.log('llm_error', { provider: llmProvider, msg: String(e?.message || e) });
        // Se a cota da API externa acabar, mantém o Oráculo funcional pelo fallback local.
        if (llmProvider === 'rapidapi_chatbot' && (e?.status === 429 || e?.status === 402 || String(e?.message || '').includes('quota'))) {
          return fast || localResult || {
            intent: 'desconhecido',
            entities: {},
            confidence: 0.2,
            reply: 'A IA externa atingiu o limite agora. O Oráculo continua funcionando no modo local. ✅',
            questions: [],
            actions: [],
            source: 'quota_fallback_local',
            session: sessionKey
          };
        }
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
