// brain.js
// Núcleo de entendimento leve para o Oráculo (browser-friendly)
(function () {
  function normalize(text = "") {
    return String(text)
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Prompt base (System) do Oráculo
  const systemPrompt = `Você é o Oráculo, um assistente de evolução pessoal gamificada.
Sua saída DEVE ser sempre um JSON válido com:
intent: string
entities: object
confidence: number (0 a 1)
reply: string (resposta ao usuário)
questions: array (0-2 perguntas, se necessário)

Regras do cérebro do Oráculo:
- Sempre retorne apenas o JSON pedido.
- Se estiver vago, faça no máximo 2 perguntas.
- Se for uma ação (tarefa/meta/xp), peça o mínimo que falta para executar.
- Respostas curtas e diretas.
- Se for perigoso/ilegal, recuse e ofereça alternativa segura.`;

  // Fallback simples quando não houver LLM
  function keywordFallback(message) {
    const t = normalize(message);

    if (/(oi|ola|eai|bom dia|boa tarde|boa noite)/i.test(t)) {
      return { intent: 'saudacao', entities: {}, confidence: 0.65, reply: 'Fala! Quer criar uma tarefa, meta ou ver seu status?', questions: [] };
    }

    if (/(cria|criar|adiciona|adicionar).*(tarefa)/i.test(t) || /(preciso|tenho que).*(fazer|comprar|ir)/i.test(t)) {
      const entities = {};
      if (t.includes('amanha') || t.includes('amanhã')) entities.data = 'amanhã';

      // tenta extrair título simples
      const title = message
        .replace(/cria(r)?/i, '')
        .replace(/tarefa/ig, '')
        .replace(/pra|para|amanhã|amanha/ig, '')
        .trim() || null;
      entities.titulo = title;

      const questions = [];
      if (!entities.titulo) questions.push('Qual é o título da tarefa?');
      if (!entities.data) questions.push('Para quando é? (ex: hoje, amanhã, 10/02)');

      return {
        intent: 'criar_tarefa',
        entities,
        confidence: 0.55,
        reply: questions.length ? 'Beleza. Só me diga:' : `Fechado ✅ Vou criar a tarefa: "${entities.titulo}" para ${entities.data}.`,
        questions
      };
    }

    if (/(listar|ver).*(tarefas)/i.test(t)) {
      return { intent: 'listar_tarefas', entities: {}, confidence: 0.6, reply: 'Certo. Quer ver as tarefas de hoje, amanhã ou todas?', questions: [] };
    }

    return { intent: 'desconhecido', entities: {}, confidence: 0.3, reply: 'Não entendi 100%. Você quer criar tarefa, meta, registrar XP ou ver status?', questions: [] };
  }

  async function understand(message, { useLLM = false } = {}) {
    if (!useLLM) return keywordFallback(message);

    try {
      // Placeholder para chamada ao LLM do servidor ou cliente.
      // Integre aqui com sua API (OpenAI, etc.). Exemplo esperado:
      // const result = await callLLM(systemPrompt, message);
      // const parsed = JSON.parse(result);
      // return parsed;

      throw new Error('LLM não configurado');
    } catch (err) {
      return keywordFallback(message);
    }
  }

  // Expõe para o app (browser)
  window.OracleBrain = {
    understand,
    keywordFallback,
    normalize,
    systemPrompt
  };
})();
