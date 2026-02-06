// Consulta rápida de memórias em oracle_memory para um termo (ex: joao)
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TARGET_USER_ID = process.env.TARGET_USER_ID;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}
if (!TARGET_USER_ID) {
  console.error('Configure TARGET_USER_ID no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function buildVariants(term) {
  // pequenas heurísticas para gerar variantes acentuadas e capitalizadas
  const t = term || '';
  const lower = t.toLowerCase();
  const variants = new Set();
  variants.add(lower);
  variants.add(lower.charAt(0).toUpperCase() + lower.slice(1));

  // mapeamentos comuns portugueses
  const map = {
    'joao': 'joão',
    'sao': 'são',
    'santo': 'santo'
  };

  Object.keys(map).forEach(k => {
    if (lower.includes(k)) {
      variants.add(lower.replace(k, map[k]));
      const cap = (lower.replace(k, map[k])).charAt(0).toUpperCase() + lower.replace(k, map[k]).slice(1);
      variants.add(cap);
    }
  });

  // também tente forma sem acento (útil se usuário já passou acento)
  try {
    const deburr = lower.normalize('NFD').replace(/\p{Diacritic}/gu, '');
    variants.add(deburr);
    variants.add(deburr.charAt(0).toUpperCase() + deburr.slice(1));
  } catch (e) {
    // normalization pode falhar em ambientes antigos, ignore
  }

  return Array.from(variants);
}

async function run(term = 'joao') {
  const variants = buildVariants(term);
  const resultsMap = new Map();

  for (const v of variants) {
    const q = `%${v}%`;
    const { data, error } = await supabase
      .from('oracle_memory')
      .select('id, title, fact, tags, importance, created_at')
      .eq('user_id', TARGET_USER_ID)
      .or(`fact.ilike.${q},title.ilike.${q}`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Erro ao consultar oracle_memory (variante', v, '):', error);
      continue;
    }

    if (!data || data.length === 0) {
      console.log(`Variante '${v}': 0 registros`);
      continue;
    }

    console.log(`Variante '${v}': encontrados ${data.length} registros`);

    data.forEach(r => {
      if (!resultsMap.has(r.id)) resultsMap.set(r.id, r);
    });
  }

  const all = Array.from(resultsMap.values()).slice(0, 10);
  console.log(`\nTotal unificado: ${all.length} registros (máx 10):`);

  all.forEach((r, i) => {
    console.log(`\n[${i+1}] ID: ${r.id}`);
    console.log(`Title: ${r.title}`);
    console.log(`Created: ${r.created_at}`);
    console.log(`Importance: ${r.importance}`);
    console.log(`Fact (preview): ${r.fact.slice(0,200)}${r.fact.length>200? '...':''}`);
  });
}

const term = process.argv[2] || 'joao';
run(term).catch(e => { console.error(e); process.exit(1); });
