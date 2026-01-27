// ===========================================
// SUPABASE - CONFIGURAÇÃO E SERVIÇOS
// ===========================================
// 
// COMO CONFIGURAR:
// 1. Crie uma conta em https://supabaseClient.com
// 2. Crie um novo projeto
// 3. Vá em Project Settings > API
// 4. Copie a "Project URL" e a "anon public" key
// 5. Cole abaixo nas variáveis SUPABASE_URL e SUPABASE_ANON_KEY
//
// ===========================================

// ⚠️ CONFIGURE AQUI COM SUAS CREDENCIAIS DO SUPABASE ⚠️
const SUPABASE_URL = 'https://tufcnxbveupoqrgdabfg.supabaseClient.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1ZmNueGJ2ZXVwb3FyZ2RhYmZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NzE2NzcsImV4cCI6MjA4NTA0NzY3N30.gYn4KDSBjuzt0yYo8_ha4W3AJnvwP_xSwblmL0wvG_4';

// Importação do Supabase Client (via CDN)
// Adicionado no index.html: <script src="https://unpkg.com/@supabase/supabase-js@2"></script>

let supabaseClient = null;
let currentUser = null;

// Inicializa o cliente Supabase
function initSupabase() {
  console.log('🔄 Tentando inicializar supabaseClient...');
  
  // Verifica se o objeto supabase está disponível globalmente
  if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase inicializado com sucesso!');
    console.log('📡 URL:', SUPABASE_URL);
    
    // Teste de conexão
    testConnection();
    
    return true;
  } else {
    console.error('❌ Supabase JS NÃO carregado!');
    console.error('Verifique se o script está no index.html:');
    console.error('<script src="https://unpkg.com/@supabase/supabase-js@2"></script>');
    console.log('window.supabase =', typeof window.supabase);
    return false;
  }
}

// Testa a conexão com o Supabase
async function testConnection() {
  try {
    const { data, error } = await supabaseClient.from('profiles').select('count').limit(1);
    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.error('❌ TABELAS NÃO CRIADAS! Execute o database-schema.sql no supabaseClient.');
        console.error('📋 Vá em: Supabase Dashboard > SQL Editor > New Query > Cole o conteúdo de database-schema.sql');
      } else {
        console.warn('⚠️ Erro ao testar conexão:', error.message);
      }
    } else {
      console.log('✅ Conexão com Supabase OK - Tabelas existem');
    }
  } catch (e) {
    console.error('❌ Erro de conexão:', e);
  }
}

// Verifica se está configurado corretamente
function isSupabaseConfigured() {
  return SUPABASE_URL !== 'https://SEU-PROJETO.supabase.co' && 
         SUPABASE_ANON_KEY !== 'SUA-ANON-KEY-AQUI' &&
         supabaseClient !== null;
}

// ===========================================
// AUTENTICAÇÃO
// ===========================================

// Registrar novo usuário
async function supabaseSignUp(email, password, characterData) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase não configurado. Configure as credenciais em supabaseClient.js');
  }

  const { data, error } = await supabaseClient.auth.signUp({
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
    throw new Error('Supabase não configurado. Configure as credenciais em supabaseClient.js');
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({
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

  const { error } = await supabaseClient.auth.signOut();
  if (error) throw error;

  currentUser = null;
}

// Verifica sessão atual
async function supabaseGetSession() {
  if (!isSupabaseConfigured()) return null;

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    currentUser = session.user;
  }
  return session;
}

// Listener de mudança de auth
function onAuthStateChange(callback) {
  if (!isSupabaseConfigured()) return;

  supabaseClient.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;
    callback(event, session);
  });
}

// ===========================================
// PERFIL DO USUÁRIO
// ===========================================

async function createProfile(userId, characterData) {
  const { error } = await supabaseClient.from('profiles').insert({
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

    // Carrega TODOS os dados do usuário
    const [tasks, finances, workSessions, oracleMemories] = await Promise.all([
      getTasks().catch(() => []),
      getFinances().catch(() => []),
      getWorkSessions().catch(() => []),
      getOracleMemories().catch(() => [])
    ]);

    // Converte tarefas do formato Supabase para formato local
    const localTasks = tasks.map(t => ({
      id: t.id,
      text: t.title,
      completed: t.status === 'completed',
      date: t.created_at,
      completedAt: t.completed_at,
      dueDate: t.due_date,
      xpReward: t.xp_reward,
      category: t.category
    }));

    // Converte finanças do formato Supabase para formato local
    const localFinances = finances.map(f => ({
      id: f.id,
      desc: f.description,
      value: f.amount,
      type: f.type,
      category: f.category,
      date: f.created_at
    }));

    // Converte sessões de trabalho
    const localWorkLog = workSessions.map(w => ({
      id: w.id,
      date: w.session_date,
      startTime: w.start_time,
      endTime: w.end_time,
      duration: w.duration,
      production: w.production,
      money: w.earnings
    }));

    // Converte memórias do oráculo
    const localOracleMemory = {
      learned: oracleMemories.map(m => ({
        text: m.fact,
        date: m.created_at,
        tags: m.tags
      })),
      profile: {}
    };

    // Extrai informações de perfil das memórias
    oracleMemories.forEach(m => {
      if (m.title && m.title !== 'memory') {
        localOracleMemory.profile[m.title] = m.fact;
      }
    });

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
      attributes: profile.attributes || {},
      achievements: profile.achievements || [],
      inventory: profile.inventory || [],
      lastClaim: profile.last_claim,
      playTime: profile.play_time,
      // Dados adicionais
      dailyTasks: localTasks,
      finances: localFinances,
      workLog: localWorkLog,
      oracleMemory: localOracleMemory
    };
  } catch (error) {
    console.error('❌ Erro ao carregar da nuvem:', error);
    return null;
  }
}

// Sincroniza TUDO para a nuvem
async function syncAllToCloud(localData) {
  if (!isSupabaseConfigured() || !currentUser) return false;

  try {
    // 1. Atualiza perfil
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

    // 2. Sincroniza tarefas (apenas novas, não sobrescreve tudo)
    if (localData.dailyTasks && localData.dailyTasks.length > 0) {
      const existingTasks = await getTasks();
      const existingIds = new Set(existingTasks.map(t => t.id));
      
      for (const task of localData.dailyTasks) {
        // Se é uma tarefa nova (id numérico local, não UUID)
        if (typeof task.id === 'number' && !existingIds.has(task.id)) {
          await addTask({
            title: task.text,
            status: task.completed ? 'completed' : 'pending',
            xpReward: task.xpReward || 10,
            dueDate: task.dueDate
          });
        }
      }
    }

    // 3. Sincroniza finanças
    if (localData.finances && localData.finances.length > 0) {
      const existingFinances = await getFinances();
      const existingIds = new Set(existingFinances.map(f => f.id));
      
      for (const fin of localData.finances) {
        if (typeof fin.id === 'number' && !existingIds.has(fin.id)) {
          await addFinance({
            type: fin.type,
            category: fin.category,
            amount: fin.value,
            description: fin.desc
          });
        }
      }
    }

    // 4. Sincroniza memórias do oráculo
    if (localData.oracleMemory) {
      const existingMemories = await getOracleMemories();
      const existingFacts = new Set(existingMemories.map(m => m.fact));
      
      // Salva informações de perfil
      if (localData.oracleMemory.profile) {
        for (const [key, value] of Object.entries(localData.oracleMemory.profile)) {
          if (value && !existingFacts.has(value)) {
            await saveOracleMemory(key, value, ['profile'], 10);
          }
        }
      }
      
      // Salva memórias aprendidas
      if (localData.oracleMemory.learned) {
        for (const memory of localData.oracleMemory.learned) {
          if (!existingFacts.has(memory.text)) {
            await saveOracleMemory('memory', memory.text, memory.tags || [], 5);
          }
        }
      }
    }

    console.log('✅ Todos os dados sincronizados com a nuvem');
    return true;
  } catch (error) {
    console.error('❌ Erro ao sincronizar:', error);
    return false;
  }
}

// Exporta funções para uso global
window.SupabaseService = {
  init: initSupabase,
  isConfigured: isSupabaseConfigured,
  getCurrentUser: () => currentUser,
  
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
  syncCloudToLocal,
  syncAllToCloud
};

console.log('📦 Supabase Service carregado');
