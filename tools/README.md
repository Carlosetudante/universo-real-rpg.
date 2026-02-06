Ingestão de PDF -> oracle_memory

Passos:

1) Copie `.env.example` para `.env` e preencha:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (service role key para inserções server-side)
   - `TARGET_USER_ID` (UUID do usuário que receberá as memórias)
   - opcional: `IMPORT_TITLE`, `BATCH_SIZE`

2) Instale dependências:

```bash
npm install
# UI Test Tools

Scripts:

- `node tools/ui_test.js`
   - Faz um teste rápido (pergunta única) e salva o resultado em `tools/ui_test_result.json`.

- `node tools/ui_test_batch.js`
   - Executa um batch simples de perguntas e salva em `tools/ui_test_batch_result.json`.

- `node tools/ui_test_refined.js`
   - Executa o batch refinado (perguntas mais fortes). Ao finalizar, aciona automaticamente o pipeline de retry.
   - Gera `tools/ui_test_refined_result.json` e, em seguida, `tools/ui_test_pipeline_result.json` (consolidado).

- `node tools/ui_test_hebrew_retry.js`
   - Reenvia apenas as perguntas de nome hebraico previamente identificadas como com falha.

- `node tools/ui_test_pipeline.js`
   - Lê `tools/ui_test_refined_result.json`, detecta entradas com `status !== 'ok'` (ou mensagens de "Não encontrei"/timeouts), reenvia apenas essas perguntas e grava o resultado consolidado em `tools/ui_test_pipeline_result.json`.

Notas:
- Os scripts usam Puppeteer com `headless: "new"`. Se o seu ambiente não suportar, altere para `headless: true`.
- Cada resultado inclui o campo `status` com valores: `ok`, `not_found`, `timeout`.
- Para aumentar robustez, o pipeline prioriza o campo `status` para detectar falhas.

Execução sugerida (Windows PowerShell):

```powershell
node tools/ui_test_refined.js
# aguarde; o pipeline será executado automaticamente ao final

# ou executar manualmente
node tools/ui_test_pipeline.js
```

Se quiser ajustar as perguntas, edite o array `questions` em `tools/ui_test_refined.js`.

---

Ingestão de PDF -> oracle_memory

Passos rápidos para ingestão de PDFs (ferramenta separada):

1) Copie `.env.example` para `.env` e preencha:
    - `SUPABASE_URL`
    - `SUPABASE_SERVICE_ROLE_KEY` (service role key para inserções server-side)
    - `TARGET_USER_ID` (UUID do usuário que receberá as memórias)
    - opcional: `IMPORT_TITLE`, `BATCH_SIZE`

2) Instale dependências:

```bash
npm install
```

3) Rodar ingestão:

```bash
node tools/ingest_pdf.js path/to/biblia_de_estudo_de_genebra.pdf --user <TARGET_USER_ID> --title "Bíblia - Estudo de Genebra"
```

Observações:
- O script usa heurística simples (parágrafos). Você pode ajustar filtros e extração conforme necessário.
- Use a `SUPABASE_SERVICE_ROLE_KEY` com cuidado (não a comite em repositórios públicos).
