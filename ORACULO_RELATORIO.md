# ORÁCULO — Relatório Técnico e Plano de Evolução

## 1. Visão Geral

O Oráculo é um assistente embutido no app que combina UI de chat, NLU local, memória (curta e longa), ações automatizadas (tarefas, finanças, XP) e suporte para RAG (memórias ingeridas no Supabase).

Componentes principais:
- UI do Oráculo: modal de chat, input, botões rápidos, seletor de personalidade e indicador de memória.
- NLU local: `OracleNLU` (regex/regras) para decisões rápidas e determinísticas.
- Fallback leve: `brain.js` (exposto como `window.OracleBrain`) que devolve JSON padrão.
- Memória: `OracleMemory` (localStorage) + sincronização com Supabase (`oracle_memory`).
- Persistência: `supabase.js` contém helpers para mensagens, memórias, tarefas, finanças e XP.
- Processador de Ações: `processOracleActions(actions)` que realiza `task.add`, `finance.add`, `memory.save`, `xp.add`.
- Ingestão / RAG: scripts em `tools/` (ex: `ingest_pdf.js`) para popular `oracle_memory`.

## 2. Contrato do "Cérebro"

O Oráculo deve consumir/produzir JSON padronizado para decisões automatizadas:

```json
{
  "intent": "string",
  "entities": { },
  "confidence": 0.0,
  "reply": "string",
  "questions": ["max 2 perguntas"],
  "actions": [{ "type": "task.add", "payload": {} }]
}
```

Sugestão: tornar `actions[]` campo obrigatório na resposta do LLM (pode ser vazia), facilita automação.

## 3. Fluxo Atual

1. Input do usuário (texto/voz) → `processMessage()`
2. Checagem de scripts e comandos customizados
3. Verificação de ações pendentes / modo conversa
4. `OracleNLU` (regex)
5. Handlers (tarefas, finanças, memória)
6. Fallback (`brain.js`) e resposta

Integração adicionada: `brain.js` é carregado antes de `app.js` e fornece `keywordFallback` para decisões rápidas.

## 4. Limitações

- LLM não configurado por padrão; `brain.js` contém placeholder que cai em fallback.
- Extração de entidades é heurística (datas/horas/valores frágil).
- RAG parcial: memórias estão no Supabase, mas não são injetadas automaticamente no prompt do LLM.
- Falta de testes E2E e telemetria de NLU.

## 5. Plano de Evolução (priorizado)

### Fase 1 — Inteligente e Seguro (alto impacto, baixo risco)
- Objetivo: LLM + RAG sem vazar chave.
- Entregáveis:
  - Endpoint server-side seguro `/api/oracle` (Express ou serverless).
  - `understandWithRAG()` no frontend que decide: NLU local → fallback → RAG + LLM.
  - Padronizar JSON do LLM (incluir `actions[]`).

### Fase 2 — Extração forte de entidades
- Integrar `chrono-node` (datas) e parser monetário.
- Implementar slot-filling multi-turno (session manager).

### Fase 3 — Observabilidade e testes
- Telemetria (intent, confidence, fallback usado).
- Testes unitários (`OracleNLU`, `brain.js`) e E2E (criar tarefa → salvar → listar → concluir).

## 6. Implementação LLM + RAG (resumo técnico)

- Regra de ouro: nunca coloque chave do LLM no front.
- Arquitetura: Frontend → `/api/oracle` (server) → LLM provider.
- Pipeline: buscar memórias relevantes via `searchOracleMemory(message)` → construir prompt (system + RAG + contexto) → chamar LLM → validar JSON → executar `processOracleActions`.

## 7. Próximos passos recomendados

1. Criar `/api/oracle` (serverless/Express) e mover chaves pra `.env`.
2. Implementar `understandWithRAG()` e integrar em `generateResponse()`.
3. Adicionar `chrono-node` e parser monetário no servidor.
4. Padronizar `processOracleActions` para aceitar `actions[]` e retornar resultados.
5. Adicionar testes e métricas.

---

Arquivo gerado automaticamente a partir da análise do repositório. Use este documento como base para `ORACULO_RELATORIO.md` e para o roteiro de implementação.
