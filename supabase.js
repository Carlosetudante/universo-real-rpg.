// ===========================================
// SUPABASE - CONFIGURAÇÃO E SERVIÇOS
// ===========================================
// 
// COMO CONFIGURAR:
// 1. Crie uma conta em https://supabase.com
// 2. Crie um novo projeto
// 3. Vá em Project Settings > API
// 4. Copie a "Project URL" e a "anon public" key
// 5. Cole abaixo nas variáveis SUPABASE_URL e SUPABASE_ANON_KEY
//
// ===========================================

// ⚠️ CONFIGURE AQUI COM SUAS CREDENCIAIS DO SUPABASE ⚠️
const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'SUA-ANON-KEY-AQUI';

// Importação do Supabase Client (via CDN)
// Adicionado no index.html: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

let supabase = null;
let currentUser = null;

// Inicializa o cliente Supabase
function initSupabase() {
  if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase inicializado');
    return true;
  } else {
    console.warn('⚠️ Supabase JS não carregado. Usando modo offline (localStorage).');
    return false;
  }
}

// Verifica se está configurado corretamente
function isSupabaseConfigured() {
  return SUPABASE_URL !== 'https://SEU-PROJETO.supabase.co' && 
         SUPABASE_ANON_KEY !== 'SUA-ANON-KEY-AQUI' &&
         supabase !== null;
}

// ===========================================
// AUTENTICAÇÃO
// ===========================================

// Registrar novo usuário
async function supabaseSignUp(email, password, characterData) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase não configurado. Configure as credenciais em supabase.js');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        character_name: characterData.name,
        character_class: characterData.race
      }
    }
  });

  if (error) throw error;

  // Cria o perfil inicial
  if (data.user) {
    await createProfile(data.user.id, characterData);
  }

  return data;
}

// Login
async function supabaseSignIn(email, password) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase não configurado. Configure as credenciais em supabase.js');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;

  currentUser = data.user;
  return data;
}

// Logout
async function supabaseSignOut() {
  if (!isSupabaseConfigured()) return;

  const { error } = await supabase.auth.signOut();
  if (error) throw error;

  currentUser = null;
}

// Verifica sessão atual
async function supabaseGetSession() {
  if (!isSupabaseConfigured()) return null;

  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    currentUser = session.user;
  }
  return session;
}

// Listener de mudança de auth
function onAuthStateChange(callback) {
  if (!isSupabaseConfigured()) return;

  supabase.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;
    callback(event, session);
  });
}

// ===========================================
// PERFIL DO USUÁRIO
// ===========================================

async function createProfile(userId, characterData) {
  const { error } = await supabase.from('profiles').insert({
    id: userId,
    character_name: characterData.name,
    character_class: characterData.race,
    title: characterData.title || 'Viajante',
    aura_color: characterData.auraColor || '#ffdd57',
    level: 1,
    xp: 0,
    streak: 0,
    skill_points: 0,
    attributes: characterData.attributes || {},
    achievements: [],
    inventory: [],
    last_claim: null,
    play_time: 0
  });

  if (error) throw error;
}

async function getProfile() {
  if (!currentUser) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (error) throw error;
  return data;
}

async function updateProfile(updates) {
  if (!currentUser) return;

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', currentUser.id);

  if (error) throw error;
}

// ===========================================
// TAREFAS (TASKS)
// ===========================================

async function getTasks() {
  if (!currentUser) return [];

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function addTask(task) {
  if (!currentUser) return null;

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: currentUser.id,
      title: task.title,
      status: task.status || 'pending',
      xp_reward: task.xpReward || 10,
      due_date: task.dueDate || null,
      category: task.category || 'geral'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateTask(taskId, updates) {
  if (!currentUser) return;

  const { error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .eq('user_id', currentUser.id);

  if (error) throw error;
}

async function deleteTask(taskId) {
  if (!currentUser) return;

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', currentUser.id);

  if (error) throw error;
}

// ===========================================
// FINANÇAS (FINANCE TRANSACTIONS)
// ===========================================

async function getFinances(filters = {}) {
  if (!currentUser) return [];

  let query = supabase
    .from('finance_transactions')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });

  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

async function addFinance(transaction) {
  if (!currentUser) return null;

  const { data, error } = await supabase
    .from('finance_transactions')
    .insert({
      user_id: currentUser.id,
      type: transaction.type, // 'income' ou 'expense'
      category: transaction.category,
      amount: transaction.amount,
      description: transaction.description || ''
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteFinance(transactionId) {
  if (!currentUser) return;

  const { error } = await supabase
    .from('finance_transactions')
    .delete()
    .eq('id', transactionId)
    .eq('user_id', currentUser.id);

  if (error) throw error;
}

// ===========================================
// SESSÕES DE TRABALHO (WORK SESSIONS)
// ===========================================

async function getWorkSessions(filters = {}) {
  if (!currentUser) return [];

  let query = supabase
    .from('work_sessions')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('start_at', { ascending: false });

  if (filters.startDate) {
    query = query.gte('start_at', filters.startDate);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

async function addWorkSession(session) {
  if (!currentUser) return null;

  const { data, error } = await supabase
    .from('work_sessions')
    .insert({
      user_id: currentUser.id,
      start_at: session.startAt,
      end_at: session.endAt,
      total_seconds: session.totalSeconds,
      activity_type: session.activityType || 'work'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ===========================================
// XP EVENTS (HISTÓRICO DE XP)
// ===========================================

async function addXpEvent(deltaXp, reason) {
  if (!currentUser) return null;

  const { data, error } = await supabase
    .from('xp_events')
    .insert({
      user_id: currentUser.id,
      delta_xp: deltaXp,
      reason: reason
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getXpHistory(limit = 50) {
  if (!currentUser) return [];

  const { data, error } = await supabase
    .from('xp_events')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ===========================================
// ORÁCULO - MENSAGENS E MEMÓRIA
// ===========================================

async function saveOracleMessage(role, content, meta = {}) {
  if (!currentUser) return null;

  const { data, error } = await supabase
    .from('oracle_messages')
    .insert({
      user_id: currentUser.id,
      role: role, // 'user' ou 'assistant'
      content: content,
      meta: meta
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getOracleMessages(limit = 50) {
  if (!currentUser) return [];

  const { data, error } = await supabase
    .from('oracle_messages')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).reverse(); // Retorna em ordem cronológica
}

async function saveOracleMemory(title, fact, tags = [], importance = 5) {
  if (!currentUser) return null;

  const { data, error } = await supabase
    .from('oracle_memory')
    .insert({
      user_id: currentUser.id,
      title: title,
      fact: fact,
      tags: tags,
      importance: importance
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getOracleMemories(searchTags = null) {
  if (!currentUser) return [];

  let query = supabase
    .from('oracle_memory')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('importance', { ascending: false });

  if (searchTags && searchTags.length > 0) {
    query = query.overlaps('tags', searchTags);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

// ===========================================
// ORÁCULO - PROCESSADOR DE AÇÕES
// ===========================================

// Processa as ações retornadas pelo Oráculo
async function processOracleActions(actions) {
  const results = [];

  for (const action of actions) {
    try {
      switch (action.type) {
        case 'finance.add':
          const financeResult = await addFinance({
            type: action.amount > 0 ? 'income' : 'expense',
            category: action.category || 'Outros',
            amount: Math.abs(action.amount),
            description: action.description || ''
          });
          results.push({ success: true, action: 'finance.add', data: financeResult });
          break;

        case 'task.add':
          const taskResult = await addTask({
            title: action.title,
            xpReward: action.xp || 10,
            dueDate: action.due_date || null
          });
          results.push({ success: true, action: 'task.add', data: taskResult });
          break;

        case 'task.complete':
          await updateTask(action.task_id, { 
            status: 'completed',
            completed_at: new Date().toISOString()
          });
          results.push({ success: true, action: 'task.complete' });
          break;

        case 'memory.save':
          const memoryResult = await saveOracleMemory(
            action.title,
            action.fact,
            action.tags || [],
            action.importance || 5
          );
          results.push({ success: true, action: 'memory.save', data: memoryResult });
          break;

        case 'xp.add':
          await addXpEvent(action.amount, action.reason || 'Bônus do Oráculo');
          results.push({ success: true, action: 'xp.add', amount: action.amount });
          break;

        default:
          results.push({ success: false, action: action.type, error: 'Ação desconhecida' });
      }
    } catch (error) {
      results.push({ success: false, action: action.type, error: error.message });
    }
  }

  return results;
}

// ===========================================
// UTILIDADES
// ===========================================

// Sincroniza dados locais com o Supabase
async function syncLocalToCloud(localData) {
  if (!isSupabaseConfigured() || !currentUser) return false;

  try {
    // Atualiza perfil
    await updateProfile({
      character_name: localData.name,
      character_class: localData.race,
      title: localData.title,
      aura_color: localData.auraColor,
      level: localData.level,
      xp: localData.xp,
      streak: localData.streak,
      skill_points: localData.skillPoints || 0,
      attributes: localData.attributes,
      achievements: localData.achievements,
      inventory: localData.inventory
    });

    console.log('✅ Dados sincronizados com a nuvem');
    return true;
  } catch (error) {
    console.error('❌ Erro ao sincronizar:', error);
    return false;
  }
}

// Carrega dados da nuvem para local
async function syncCloudToLocal() {
  if (!isSupabaseConfigured() || !currentUser) return null;

  try {
    const profile = await getProfile();
    if (!profile) return null;

    return {
      username: currentUser.email,
      name: profile.character_name,
      race: profile.character_class,
      title: profile.title,
      auraColor: profile.aura_color,
      level: profile.level,
      xp: profile.xp,
      streak: profile.streak,
      skillPoints: profile.skill_points,
      attributes: profile.attributes,
      achievements: profile.achievements,
      inventory: profile.inventory,
      lastClaim: profile.last_claim,
      playTime: profile.play_time
    };
  } catch (error) {
    console.error('❌ Erro ao carregar da nuvem:', error);
    return null;
  }
}

// Exporta funções para uso global
window.SupabaseService = {
  init: initSupabase,
  isConfigured: isSupabaseConfigured,
  
  // Auth
  signUp: supabaseSignUp,
  signIn: supabaseSignIn,
  signOut: supabaseSignOut,
  getSession: supabaseGetSession,
  onAuthStateChange,
  
  // Profile
  getProfile,
  updateProfile,
  
  // Tasks
  getTasks,
  addTask,
  updateTask,
  deleteTask,
  
  // Finance
  getFinances,
  addFinance,
  deleteFinance,
  
  // Work
  getWorkSessions,
  addWorkSession,
  
  // XP
  addXpEvent,
  getXpHistory,
  
  // Oracle
  saveOracleMessage,
  getOracleMessages,
  saveOracleMemory,
  getOracleMemories,
  processOracleActions,
  
  // Sync
  syncLocalToCloud,
  syncCloudToLocal
};

console.log('📦 Supabase Service carregado');
