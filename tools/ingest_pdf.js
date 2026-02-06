// Script simples para extrair texto de um PDF e inserir em oracle_memory (Supabase)
// Uso: node tools/ingest_pdf.js path/to/file.pdf --title "Título" --user USER_ID

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { file: null, title: process.env.IMPORT_TITLE || 'PDF Import', user: process.env.TARGET_USER_ID, batch: parseInt(process.env.BATCH_SIZE || '50', 10) };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!out.file && !a.startsWith('--')) {
      out.file = a;
      continue;
    }
    if (a === '--title' && args[i+1]) { out.title = args[i+1]; i++; }
    if ((a === '--user' || a === '--user-id') && args[i+1]) { out.user = args[i+1]; i++; }
    if (a === '--batch' && args[i+1]) { out.batch = parseInt(args[i+1], 10); i++; }
  }
  return out;
}

async function main() {
  const { file, title, user, batch } = parseArgs();
  if (!file) {
    console.error('Erro: informe o caminho para o PDF. Ex: node tools/ingest_pdf.js biblia.pdf --user <USER_ID> --title "Meu Título"');
    process.exit(1);
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Erro: configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
    process.exit(1);
  }
  if (!user) {
    console.error('Erro: TARGET_USER_ID não fornecido (via --user ou .env TARGET_USER_ID)');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const buffer = fs.readFileSync(path.resolve(file));
  console.log('Lendo PDF:', file);

  const data = await pdf(buffer);
  const text = data.text || '';

  // Heurística simples: separar por parágrafos (duas quebras de linha) e limpar
  const paras = text.split(/\r?\n\s*\r?\n/).map(p => p.trim()).filter(p => p.length > 80);
  console.log(`Extraídos ${paras.length} parágrafos (>=80 chars). Preparando para inserir...`);

  const records = paras.map(p => ({
    user_id: user,
    title: title,
    fact: p.slice(0, 1000), // limite de tamanho
    tags: [],
    importance: 5
  }));

  // Inserir em batches
  for (let i = 0; i < records.length; i += batch) {
    const chunk = records.slice(i, i + batch);
    console.log(`Inserindo registros ${i + 1}..${i + chunk.length} ...`);
    const { data: res, error } = await supabase.from('oracle_memory').insert(chunk).select();
    if (error) {
      console.error('Erro ao inserir chunk:', error.message || error);
      // não abortar, continuar
    } else {
      console.log(`Inseridos ${res.length} registros.`);
    }
  }

  console.log('Importação concluída.');
}

main().catch(e => { console.error('Erro inesperado:', e); process.exit(1); });
