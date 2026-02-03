// Universo Real - Frontend com Backend Integration
// API Base URL
const API_URL = '/api';

// Configuração global do Oráculo (telemetria e controle de LLM)
window.OracleConfig = window.OracleConfig || {
  useLLM: false,          // começa desligado
  telemetry: true,        // liga log básico
  telemetrySample: 1.0    // 1.0 = logar tudo, 0.2 = 20%
};

// Telemetria leve (console + localStorage)
window.OracleTelemetry = window.OracleTelemetry || {
  log(event, data = {}) {
    try {
      const cfg = window.OracleConfig || {};
      if (!cfg.telemetry) return;
      if (Math.random() > (cfg.telemetrySample ?? 1.0)) return;

      const payload = {
        t: new Date().toISOString(),
        event,
        ...data
      };

      console.debug('[OracleTelemetry]', payload);

      const key = 'oracle_telemetry';
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      arr.push(payload);
      while (arr.length > 200) arr.shift();
      localStorage.setItem(key, JSON.stringify(arr));
    } catch (_) {}
  }
};
// Sistema de Som (Web Audio API) - Inicializado sob demanda
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('AudioContext não suportado:', e);
      return null;
    }
  }
  return audioCtx;
}

const sounds = {
  click: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  },
  
  levelUp: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    
    [440, 554, 659, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      const startTime = now + i * 0.1;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
      
      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  },
  
  achievement: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    
    [523.25, 659.25, 783.99, 1046.50].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'square';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      
      osc.start(now);
      osc.stop(now + 0.8);
    });
  }
};

function playSound(type) {
  try {
    if (sounds[type]) sounds[type]();
  } catch (e) {
    console.error("Audio error:", e);
  }
}

// Função para converter valores monetários (BR e Texto)
function parseMoney(input) {
  if (typeof input === 'number') return input;
  if (!input) return 0;
  
  let str = input.toString().toLowerCase().trim();
  
  // Multiplicadores (mil, k)
  let multiplier = 1;
  if (str.includes('mil') || str.includes('k')) {
    multiplier = 1000;
  }
  
  // Remove tudo que não é número, vírgula, ponto ou sinal
  str = str.replace(/[^0-9,.-]/g, '');
  
  // Lógica Brasileira: Ponto é milhar, Vírgula é decimal
  if (str.includes(',')) {
    // Tem vírgula - formato BR (ex: 1.234,56)
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes('.')) {
    // Só tem ponto - verificar se é decimal ou milhar
    const parts = str.split('.');
    // Se a parte após o ponto tem 1 ou 2 dígitos, é decimal (ex: 1.5 ou 3.50)
    // Se tem 3 dígitos, é milhar (ex: 1.000)
    if (parts.length === 2 && parts[1].length <= 2) {
      // Mantém como decimal (1.5 = 1.5)
    } else {
      // Remove pontos de milhar (1.000 = 1000)
      str = str.replace(/\./g, '');
    }
  }
  
  return (parseFloat(str) || 0) * multiplier;
}

function triggerHaptic(pattern = 15) {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Silencioso em caso de erro ou falta de suporte
    }
  }
}

// ===================================
// Sistema de Estrelas do Universo
// ===================================
let currentStarColor = '#ffffff';

function createStars(color = '#ffffff') {
  const starsContainer = document.querySelector('.stars');
  if (!starsContainer) return;
  
  // Limpa estrelas existentes (exceto o ::before e ::after do CSS)
  starsContainer.querySelectorAll('.star').forEach(s => s.remove());
  
  // Define a cor das estrelas
  currentStarColor = color;
  starsContainer.style.setProperty('--star-color', color);
  
  // Cria mais estrelas para um céu mais rico, com otimização para mobile
  const isMobile = window.innerWidth <= 900;
  // Ajuste de densidade: valores menores -> mais estrelas
  const density = isMobile ? 8000 : 3000; // aumenta muito a densidade de estrelas
  const baseCount = Math.floor(window.innerWidth * window.innerHeight / density);
  const starCount = isMobile ? Math.min(220, Math.max(80, baseCount)) : Math.min(600, Math.max(160, baseCount));
  
  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    
    // Distribuição de tamanhos: mais estrelas pequenas, poucas grandes
    const sizeRand = Math.random();
    if (sizeRand < 0.25) star.classList.add('tiny');
    else if (sizeRand < 0.6) star.classList.add('small');
    else if (sizeRand < 0.88) star.classList.add('medium');
    else if (sizeRand < 0.97) star.classList.add('large');
    else star.classList.add('bright'); // ~3% são estrelas muito brilhantes
    
    // Posição aleatória
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    
    // Duração e delay de piscagem aleatórios para efeito natural
    const duration = 0.8 + Math.random() * 5.5; // 0.8-6.3 segundos (mais variedade)
    const delay = Math.random() * 10; // delay 0-10s
    star.style.setProperty('--twinkle-duration', `${duration}s`);
    star.style.setProperty('--twinkle-delay', `${delay}s`);
    
    starsContainer.appendChild(star);
  }
}

function updateStarColor(color) {
  const starsContainer = document.querySelector('.stars');
  if (!starsContainer) return;
  
  currentStarColor = color;
  starsContainer.style.setProperty('--star-color', color);
  
  // Atualiza todas as estrelas existentes
  starsContainer.querySelectorAll('.star').forEach(star => {
    star.style.background = color;
    
    // Ajusta o brilho baseado no tamanho
    if (star.classList.contains('tiny')) {
      star.style.boxShadow = `0 0 3px 1px ${color}`;
    } else if (star.classList.contains('small')) {
      star.style.boxShadow = `0 0 6px 2px ${color}`;
    } else if (star.classList.contains('medium')) {
      star.style.boxShadow = `0 0 10px 3px ${color}`;
    } else if (star.classList.contains('large')) {
      star.style.boxShadow = `0 0 15px 5px ${color}, 0 0 30px 10px ${color}40`;
    } else if (star.classList.contains('bright')) {
      star.style.boxShadow = `0 0 20px 8px ${color}, 0 0 40px 15px ${color}60, 0 0 60px 20px ${color}30`;
    }
  });
}

// Inicializa estrelas quando a página carrega
window.addEventListener('load', () => {
  createStars(currentStarColor);
  
  // Recria estrelas se a janela for redimensionada (debounced)
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => createStars(currentStarColor), 500);
  });
});

// Sistema de Atributos
const ATTRIBUTES = [
  { id: 'strength', name: 'Força', icon: '💪', description: 'Resistência física e energia' },
  { id: 'intelligence', name: 'Inteligência', icon: '🧠', description: 'Capacidade mental e aprendizado' },
  { id: 'wisdom', name: 'Sabedoria', icon: '🦉', description: 'Experiência e discernimento' },
  { id: 'charisma', name: 'Carisma', icon: '✨', description: 'Influência e comunicação' },
  { id: 'dexterity', name: 'Destreza', icon: '🤸', description: 'Agilidade e coordenação' },
  { id: 'constitution', name: 'Constituição', icon: '❤️', description: 'Saúde e vitalidade' },
  { id: 'creativity', name: 'Criatividade', icon: '🎨', description: 'Imaginação e inovação' },
  { id: 'discipline', name: 'Disciplina', icon: '⚡', description: 'Foco e consistência' },
  { id: 'empathy', name: 'Empatia', icon: '🤝', description: 'Compreensão emocional' },
  { id: 'resilience', name: 'Resiliência', icon: '🛡️', description: 'Superação de desafios' }
];

// Sistema de Conquistas com informações interativas
const ACHIEVEMENTS = [
  { 
    id: 'first_step', 
    name: 'Primeiro Passo', 
    icon: '👣', 
    condition: (char) => char.level >= 1, 
    unlocked: true, 
    titleReward: 'O Iniciante',
    description: 'Você deu o primeiro passo na sua jornada de evolução pessoal!',
    getStats: () => {
      const now = new Date();
      const sessionTime = loginTime ? (now - loginTime) : 0;
      const totalTime = (gameState.playTime || 0) + sessionTime;
      const hours = Math.floor(totalTime / 3600000);
      const minutes = Math.floor((totalTime % 3600000) / 60000);
      const startDate = gameState.createdAt ? new Date(gameState.createdAt).toLocaleDateString('pt-BR') : 'Início da jornada';
      return `⏱️ Tempo total: ${hours}h ${minutes}m\n📅 Início: ${startDate}`;
    }
  },
  { 
    id: 'level_5', 
    name: 'Novato', 
    icon: '🌱', 
    condition: (char) => char.level >= 5, 
    titleReward: 'Aprendiz',
    description: 'Uma semente plantada começa a brotar. Você está crescendo!',
    getStats: () => {
      const totalXpEarned = (gameState.level - 1) * 100 + gameState.xp;
      const tasksCompleted = gameState.taskHistory?.reduce((sum, day) => sum + day.tasks.length, 0) || 0;
      return `⭐ XP Total Ganho: ${totalXpEarned}\n✅ Tarefas concluídas: ${tasksCompleted}`;
    }
  },
  { 
    id: 'level_10', 
    name: 'Experiente', 
    icon: '⭐', 
    condition: (char) => char.level >= 10, 
    titleReward: 'Aventureiro',
    description: 'Você já percorreu um longo caminho. Continue brilhando!',
    getStats: () => {
      const avgXpPerDay = gameState.xpHistory ? Math.round(Object.values(gameState.xpHistory).reduce((a,b) => a+b, 0) / Math.max(Object.keys(gameState.xpHistory).length, 1)) : 0;
      return `📊 Média XP/dia: ${avgXpPerDay}\n🏆 Nível atual: ${gameState.level}`;
    }
  },
  { 
    id: 'level_25', 
    name: 'Veterano', 
    icon: '🏅', 
    condition: (char) => char.level >= 25, 
    titleReward: 'Veterano',
    description: 'Um verdadeiro guerreiro forjado pela disciplina!',
    getStats: () => {
      const topAttr = Object.entries(gameState.attributes).sort((a,b) => b[1] - a[1])[0];
      const attrName = ATTRIBUTES.find(a => a.id === topAttr[0])?.name || topAttr[0];
      return `💪 Maior atributo: ${attrName} (${topAttr[1]})\n🎖️ Pontos distribuídos: ${Object.values(gameState.attributes).reduce((a,b) => a+b, 0) - 10}`;
    }
  },
  { 
    id: 'level_50', 
    name: 'Mestre', 
    icon: '👑', 
    condition: (char) => char.level >= 50, 
    titleReward: 'Lenda',
    description: 'Você alcançou a maestria! Poucos chegam tão longe.',
    getStats: () => {
      const totalAchievements = gameState.achievements?.length || 0;
      return `🏆 Conquistas: ${totalAchievements}/${ACHIEVEMENTS.length}\n👑 Status: LENDÁRIO`;
    }
  },
  { 
    id: 'all_attrs_10', 
    name: 'Equilibrado', 
    icon: '⚖️', 
    condition: (char) => Object.values(char.attributes).every(v => v >= 10), 
    titleReward: 'Harmônico',
    description: 'Equilíbrio perfeito em todas as áreas da vida!',
    getStats: () => {
      const attrs = gameState.attributes;
      const total = Object.values(attrs).reduce((a,b) => a+b, 0);
      const avg = Math.round(total / Object.keys(attrs).length);
      return `⚖️ Média dos atributos: ${avg}\n🎯 Total de pontos: ${total}`;
    }
  },
  { 
    id: 'one_attr_50', 
    name: 'Especialista', 
    icon: '🎯', 
    condition: (char) => Object.values(char.attributes).some(v => v >= 50), 
    titleReward: 'Grão-Mestre',
    description: 'Você se tornou um especialista em sua área!',
    getStats: () => {
      const maxAttr = Object.entries(gameState.attributes).sort((a,b) => b[1] - a[1])[0];
      const attrData = ATTRIBUTES.find(a => a.id === maxAttr[0]);
      return `🎯 Especialidade: ${attrData?.name || maxAttr[0]}\n📈 Nível: ${maxAttr[1]} pontos`;
    }
  },
  { 
    id: 'week_streak', 
    name: 'Consistente', 
    icon: '🔥', 
    condition: (char) => char.streak >= 7, 
    titleReward: 'Persistente',
    description: 'Uma semana inteira de dedicação! O hábito está se formando.',
    getStats: () => {
      const currentStreak = gameState.streak || 0;
      const maxStreak = gameState.maxStreak || currentStreak;
      return `🔥 Sequência atual: ${currentStreak} dias\n🏆 Recorde: ${maxStreak} dias`;
    }
  },
  { 
    id: 'month_streak', 
    name: 'Dedicado', 
    icon: '💎', 
    condition: (char) => char.streak >= 30, 
    titleReward: 'Imparável',
    description: 'Um mês inteiro! Você é verdadeiramente imparável!',
    getStats: () => {
      const daysActive = gameState.xpHistory ? Object.keys(gameState.xpHistory).length : 0;
      return `💎 Dias ativos: ${daysActive}\n🔥 Sequência: ${gameState.streak} dias`;
    }
  },
  { 
    id: 'streak_10', 
    name: 'Chave Mestra', 
    icon: '🗝️', 
    condition: (char) => char.streak >= 10, 
    titleReward: 'Guardião', 
    secret: true,
    description: 'Você encontrou a chave para a consistência!',
    getStats: () => {
      const respecUnlocked = (gameState.streak || 0) >= 10;
      return `🗝️ Respec desbloqueado: ${respecUnlocked ? 'SIM' : 'NÃO'}\n⚡ Poder especial: Redistribuir atributos`;
    }
  }
];

// Função para mostrar detalhes da conquista ao clicar
function showAchievementDetails(achievementId) {
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!achievement) return;
  
  const unlocked = gameState.achievements.includes(achievementId);
  if (!unlocked) {
    showToast('🔒 Conquista ainda não desbloqueada!');
    return;
  }
  
  // Calcula estatísticas dinâmicas
  const stats = achievement.getStats ? achievement.getStats() : '';
  
  // Cria modal de detalhes
  const modal = document.createElement('div');
  modal.className = 'achievement-detail-modal';
  modal.innerHTML = `
    <div class="achievement-detail-content">
      <div class="achievement-detail-header">
        <span class="achievement-detail-icon">${achievement.icon}</span>
        <div>
          <h3>${achievement.name}</h3>
          <span class="achievement-detail-title">Título: ${achievement.titleReward}</span>
        </div>
      </div>
      <p class="achievement-detail-desc">${achievement.description}</p>
      <div class="achievement-detail-stats">
        ${stats.split('\n').map(s => `<div>${s}</div>`).join('')}
      </div>
      <button class="btn" onclick="this.closest('.achievement-detail-modal').remove()">Fechar</button>
    </div>
  `;
  
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
  
  document.body.appendChild(modal);
  playSound('click');
  triggerHaptic(20);
}

// Frases Inspiradoras para o Modo Zen
const ZEN_QUOTES = [
  "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
  "Acredite que você pode, assim você já está no meio do caminho.",
  "A disciplina é a ponte entre metas e realizações.",
  "Não espere por oportunidades, crie-as.",
  "O segredo do sucesso é a constância do propósito.",
  "Grandes coisas não são feitas por impulso, mas pela união de pequenas coisas.",
  "A persistência é o caminho do êxito.",
  "O amor é a força mais sutil do mundo.",
  "Onde há amor, há vida."
];

// Temas de Classe (Emojis e Imagens de Fundo)
const CLASS_THEMES = {
  'Guerreiro': { emoji: '⚔️', image: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=800&q=80' },
  'Sábio': { emoji: '🧙‍♂️', image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80' },
  'Atleta': { emoji: '🏃', image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80' },
  'Artista': { emoji: '🎨', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80' },
  'Líder': { emoji: '👑', image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80' },
  'Equilibrado': { emoji: '⚖️', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80' },
  'default': { emoji: '🎒', image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80' } // Viajante
};

// Caminho padrão para música Zen (Online para funcionar direto)
const DEFAULT_ZEN_MUSIC = 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3';

// Playlist Zen
let zenPlaylist = [];
let currentTrackIndex = 0;

// Estado do jogo
let gameState = null;
let isLoggedIn = false;
let loginTime = null;
let financeFilter = 'all';
let financePage = 1;

// Instância do Gráfico
let xpChartInstance = null;
let financeChartInstance = null;
let financeMonthlyChartInstance = null;
let workChartInstance = null;
let attributesChartInstance = null;

// Elementos DOM
const elements = {
  authModal: document.getElementById('authModal'),
  loginForm: document.getElementById('loginForm'),
  registerForm: document.getElementById('registerForm'),
  gameScreen: document.getElementById('gameScreen'),
  
  // Login
  loginUsername: document.getElementById('loginUsername'),
  loginPassword: document.getElementById('loginPassword'),
  rememberUser: document.getElementById('rememberUser'),
  loginBtn: document.getElementById('loginBtn'),
  showRegisterBtn: document.getElementById('showRegisterBtn'),
  forgotPasswordBtn: document.getElementById('forgotPasswordBtn'),
  
  // Register
  registerUsername: document.getElementById('registerUsername'),
  registerPassword: document.getElementById('registerPassword'),
  registerConfirmPassword: document.getElementById('registerConfirmPassword'),
  usernameCheckMsg: document.getElementById('usernameCheckMsg'),
  passwordMatchMsg: document.getElementById('passwordMatchMsg'),
  registerName: document.getElementById('registerName'),
  registerRace: document.getElementById('registerRace'),
  registerAura: document.getElementById('registerAura'),
  registerQuestion: document.getElementById('registerQuestion'),
  registerAnswer: document.getElementById('registerAnswer'),
  registerBtn: document.getElementById('registerBtn'),
  showLoginBtn: document.getElementById('showLoginBtn'),
  
  // Game
  avatar: document.getElementById('avatar'),
  heroCardHeader: document.getElementById('heroCardHeader'),
  previewName: document.getElementById('previewName'),
  previewTitle: document.getElementById('previewTitle'),
  previewRace: document.getElementById('previewRace'),
  previewUsername: document.getElementById('previewUsername'),
  heroVisualBadges: document.getElementById('heroVisualBadges'),
  level: document.getElementById('level'),
  orbLevel: document.getElementById('orbLevel'),
  xp: document.getElementById('xp'),
  xpProgress: document.getElementById('xpProgress'),
  skillPoints: document.getElementById('skillPoints'),
  lastClaim: document.getElementById('lastClaim'),
  streakDisplay: document.getElementById('streakDisplay'),
  orb: document.getElementById('orb'),
  ring: document.getElementById('ring'),
  attributesGrid: document.getElementById('attributesGrid'),
  attributesChart: document.getElementById('attributesChart'),
  achievementsList: document.getElementById('achievementsList'),
  toast: document.getElementById('toast'),
  
  // Buttons
  saveBtn: document.getElementById('saveBtn'),
  exportBtn: document.getElementById('exportBtn'),
  importBtn: document.getElementById('importBtn'),
  zenModeBtn: document.getElementById('zenModeBtn'),
  restoreBackupBtn: document.getElementById('restoreBackupBtn'),
  importFile: document.getElementById('importFile'),
  logoutBtn: document.getElementById('logoutBtn'),
  claimBtn: document.getElementById('claimBtn'),
  resetAttrsBtn: document.getElementById('resetAttrsBtn'),
  
  // Inventory
  inventoryInput: document.getElementById('inventoryInput'),
  addItemBtn: document.getElementById('addItemBtn'),
  inventoryList: document.getElementById('inventoryList'),
  inventoryCount: document.getElementById('inventoryCount'),
  
  // Gratitude Journal
  gratitude1: document.getElementById('gratitude1'),
  gratitude2: document.getElementById('gratitude2'),
  gratitude3: document.getElementById('gratitude3'),
  gratitudeBtn: document.getElementById('gratitudeBtn'),
  gratitudeHistory: document.getElementById('gratitudeHistory'),
  
  // Daily Tasks
  taskInput: document.getElementById('taskInput'),
  addTaskBtn: document.getElementById('addTaskBtn'),
  taskList: document.getElementById('taskList'),
  viewTaskHistoryBtn: document.getElementById('viewTaskHistoryBtn'),
  taskHistoryModal: document.getElementById('taskHistoryModal'),
  taskHistoryList: document.getElementById('taskHistoryList'),

  // Finance
  financeDesc: document.getElementById('financeDesc'),
  financeValue: document.getElementById('financeValue'),
  financeType: document.getElementById('financeType'),
  financeCategory: document.getElementById('financeCategory'),
  addFinanceBtn: document.getElementById('addFinanceBtn'),
  financeList: document.getElementById('financeList'),
  financeBalance: document.getElementById('financeBalance'),
  financeChart: document.getElementById('financeChart'),
  financeMonthlyChart: document.getElementById('financeMonthlyChart'),
  
  // Finance Goal
  financeGoalInput: document.getElementById('financeGoalInput'),
  setFinanceGoalBtn: document.getElementById('setFinanceGoalBtn'),
  cancelFinanceGoalBtn: document.getElementById('cancelFinanceGoalBtn'),
  financeGoalDisplay: document.getElementById('financeGoalDisplay'),
  financeGoalText: document.getElementById('financeGoalText'),
  financeGoalProgress: document.getElementById('financeGoalProgress'),
  financeGoalStatus: document.getElementById('financeGoalStatus'),
  
  // Finance Groups
  configGroupsBtn: document.getElementById('configGroupsBtn'),
  groupConfigModal: document.getElementById('groupConfigModal'),
  groupNameInput: document.getElementById('groupNameInput'),
  groupKeywordsInput: document.getElementById('groupKeywordsInput'),
  addGroupBtn: document.getElementById('addGroupBtn'),
  groupsListConfig: document.getElementById('groupsListConfig'),
  closeGroupConfigBtn: document.getElementById('closeGroupConfigBtn'),
  financeGroupsDisplay: document.getElementById('financeGroupsDisplay'),

  // Bills
  billDesc: document.getElementById('billDesc'),
  billValue: document.getElementById('billValue'),
  billDate: document.getElementById('billDate'),
  billRecurrence: document.getElementById('billRecurrence'),
  addBillBtn: document.getElementById('addBillBtn'),
  billList: document.getElementById('billList'),

  // Chart
  xpChart: document.getElementById('xpChart'),

  // Relationship
  relationshipSetup: document.getElementById('relationshipSetup'),
  relationshipDateInput: document.getElementById('relationshipDateInput'),
  relationshipPhotoInput: document.getElementById('relationshipPhotoInput'),
  updateRelationshipPhotoInput: document.getElementById('updateRelationshipPhotoInput'),
  setRelationshipBtn: document.getElementById('setRelationshipBtn'),
  relationshipDisplay: document.getElementById('relationshipDisplay'),
  relationshipPhotoDisplay: document.getElementById('relationshipPhotoDisplay'),
  relationshipTimer: document.getElementById('relationshipTimer'),
  resetRelationshipBtn: document.getElementById('resetRelationshipBtn'),

  // Zen Mode
  zenModeOverlay: document.getElementById('zenModeOverlay'),
  zenTimer: document.getElementById('zenTimer'),
  zenQuote: document.getElementById('zenQuote'),
  zenMusicBtn: document.getElementById('zenMusicBtn'),
  zenTrackSelect: document.getElementById('zenTrackSelect'),
  zenMusicInput: document.getElementById('zenMusicInput'),
  zenImageBtn: document.getElementById('zenImageBtn'),
  zenImageInput: document.getElementById('zenImageInput'),
  zenToggleHudBtn: document.getElementById('zenToggleHudBtn'),
  zenBackgroundDisplay: document.getElementById('zenBackgroundDisplay'),
  zenBreathingOrb: document.getElementById('zenBreathingOrb'),
  zenBreathingBtn: document.getElementById('zenBreathingBtn'),
  zenAudio: document.getElementById('zenAudio'),
  zenPlaylistInfo: document.getElementById('zenPlaylistInfo'),
  exitZenBtn: document.getElementById('exitZenBtn'),
  installAppBtn: document.getElementById('installAppBtn'),
  simpleFinanceBtn: document.getElementById('simpleFinanceBtn'),

  // Edit Profile
  editProfileModal: document.getElementById('editProfileModal'),
  editName: document.getElementById('editName'),
  editRace: document.getElementById('editRace'),
  editTitle: document.getElementById('editTitle'),
  editAura: document.getElementById('editAura'),
  editProfileBtn: document.getElementById('editProfileBtn'),
  saveProfileBtn: document.getElementById('saveProfileBtn'),
  cancelEditBtn: document.getElementById('cancelEditBtn'),

  // Trabalho (Work)
  workSetupSection: document.getElementById('workSetupSection'),
  workDashboardSection: document.getElementById('workDashboardSection'),
  jobNameInput: document.getElementById('jobNameInput'),
  jobTypeSelect: document.getElementById('jobTypeSelect'),
  saveJobBtn: document.getElementById('saveJobBtn'),
  configJobBtn: document.getElementById('configJobBtn'),
  workTitleDisplay: document.getElementById('workTitleDisplay'),
  workSingularityContainer: document.getElementById('workSingularityContainer'),
  workTimeHistoryList: document.getElementById('workTimeHistoryList'),
  workProductionHistoryList: document.getElementById('workProductionHistoryList'),
  workChart: document.getElementById('workChart'),
  
  // Chat (Oráculo)
  chatBtn: document.getElementById('chatBtn'),
  chatModal: document.getElementById('chatModal'),
  closeChatBtn: document.getElementById('closeChatBtn'),
  chatMessages: document.getElementById('chatMessages'),
  chatInput: document.getElementById('chatInput'),
  sendMessageBtn: document.getElementById('sendMessageBtn'),
  oraclePersonalitySelect: document.getElementById('oraclePersonalitySelect'),

  // FAB
  fabContainer: document.getElementById('fabContainer'),
  fabMainBtn: document.getElementById('fabMainBtn'),
  fabActions: document.getElementById('fabActions'),
  fabWorkBtn: document.getElementById('fabWorkBtn'),
  fabTaskBtn: document.getElementById('fabTaskBtn'),
  fabFinanceBtn: document.getElementById('fabFinanceBtn')
};

// Funções auxiliares
function showToast(message, duration = 3000) {
  elements.toast.textContent = message;
  elements.toast.style.display = 'block';
  setTimeout(() => {
    elements.toast.style.display = 'none';
  }, duration);
}

function triggerConfetti() {
  if (window.confetti) {
    window.confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ffdd57', '#ff4757', '#2ecc71', '#36a2eb']
    });
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js';
  script.onload = () => {
    window.confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ffdd57', '#ff4757', '#2ecc71', '#36a2eb']
    });
  };
  document.head.appendChild(script);
}

function triggerLevelUpAnimation() {
  const avatar = elements.avatar;
  if (avatar) {
    avatar.classList.remove('level-up-anim');
    void avatar.offsetWidth; // Força o reflow para reiniciar a animação
    avatar.classList.add('level-up-anim');
    triggerHaptic([50, 50, 50]); // Vibração especial
  }
}

function showAuthModal() {
  elements.authModal.classList.add('active');
  elements.gameScreen.classList.add('hidden');
  if (elements.fabContainer) elements.fabContainer.classList.add('hidden');
  
  // Esconde menu mobile na tela de login
  const mobileFab = document.getElementById('mobileFabMenu');
  const mobileHeader = document.getElementById('mobileHeader');
  if (mobileFab) mobileFab.classList.add('hidden');
  if (mobileHeader) mobileHeader.style.display = 'none';
}

function hideAuthModal() {
  elements.authModal.classList.remove('active');
  elements.gameScreen.classList.remove('hidden');
  if (elements.fabContainer) elements.fabContainer.classList.remove('hidden');
  
  // Mostra menu mobile após login
  const mobileFab = document.getElementById('mobileFabMenu');
  const mobileHeader = document.getElementById('mobileHeader');
  if (mobileFab) mobileFab.classList.remove('hidden');
  if (mobileHeader) mobileHeader.style.display = '';
}

function showLoginForm() {
  elements.loginForm.classList.remove('hidden');
  elements.registerForm.classList.add('hidden');
  document.getElementById('authTitle').textContent = '🎮 Entrar no Universo Real';
  
  // Recuperar último usuário salvo na memória do dispositivo
  const lastUser = localStorage.getItem('ur_last_user');
  if (lastUser && elements.loginUsername) {
    elements.loginUsername.value = lastUser;
    if (elements.rememberUser) elements.rememberUser.checked = true;
  }
}

function showRegisterForm() {
  elements.loginForm.classList.add('hidden');
  elements.registerForm.classList.remove('hidden');
  document.getElementById('authTitle').textContent = '✨ Criar Novo Personagem';
}

// Funções de "API" local usando localStorage
function getUsers() {
  return JSON.parse(localStorage.getItem('ur_users') || '{}');
}

function setUsers(users) {
  localStorage.setItem('ur_users', JSON.stringify(users));
}

function saveSession(username) {
  localStorage.setItem('ur_session', username);
}

function getSession() {
  return localStorage.getItem('ur_session');
}

function clearSession() {
  localStorage.removeItem('ur_session');
}

// Verifica se o Supabase está configurado e disponível
function useSupabase() {
  return typeof SupabaseService !== 'undefined' && SupabaseService.isConfigured();
}

// Função de login (Supabase ou Local)
async function login() {
  const email = elements.loginUsername.value.trim();
  const password = elements.loginPassword.value;
  if (!email || !password) {
    showToast('⚠️ Preencha todos os campos!');
    return;
  }
  try {
    elements.loginBtn.disabled = true;
    elements.loginBtn.textContent = 'Entrando...';

    // Tenta login com Supabase primeiro
    if (useSupabase()) {
      console.log('🔐 Tentando login com Supabase...');
      
      try {
        const { data, error } = await SupabaseService.signIn(email, password);
        
        if (error) {
          console.error('Erro Supabase:', error);
          
          // Traduz erros comuns do Supabase
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Email ou senha incorretos. Verifique suas credenciais.');
          } else if (error.message.includes('Email not confirmed')) {
            throw new Error('Email não confirmado! Verifique sua caixa de entrada e spam.');
          } else if (error.message.includes('User not found')) {
            throw new Error('Usuário não encontrado. Crie uma conta primeiro.');
          } else {
            throw error;
          }
        }

        // Carrega o perfil primeiro (rápido) e atualiza a UI;
        // em seguida carrega o restante (tarefas, finanças, workLog, memórias)
        elements.loginBtn.textContent = 'Carregando perfil...';
        const profile = await SupabaseService.getProfile().catch(err => {
          console.warn('Falha ao carregar perfil rapidamente:', err);
          return null;
        });

        if (profile) {
          gameState = normalizeGameState(Object.assign({}, profile, { username: data.user.email }));
        } else {
          // Primeiro login ou profile indisponível - cria estado inicial
          gameState = normalizeGameState({ username: data.user.email, name: 'Novo Herói' });
        }

        // Atualiza a interface rapidamente com o perfil carregado
        if (elements.rememberUser && elements.rememberUser.checked) {
          localStorage.setItem('ur_last_user', email);
        }

        showToast('✅ Login realizado! Carregando o restante dos dados em segundo plano...');
        isLoggedIn = true;
        loginTime = new Date();
        saveSession(email);
        hideAuthModal();
        updateUI();
        if (typeof renderDailyTasks === 'function') renderDailyTasks();
        if (typeof renderFinances === 'function') renderFinances();
        if (typeof checkAchievements === 'function') checkAchievements();
        checkBackupAvailability();
        checkBillsDueToday();
        elements.loginUsername.value = '';
        elements.loginPassword.value = '';

        // Carrega dados pesados em background e atualiza UI conforme chegam
        (async function loadRemainingCloudData() {
          try {
            elements.loginBtn.textContent = 'Sincronizando...';
            const [tasks, finances, workSessions, oracleMemories] = await Promise.all([
              SupabaseService.getTasks().catch(() => []),
              SupabaseService.getFinances().catch(() => []),
              SupabaseService.getWorkSessions().catch(() => []),
              SupabaseService.getOracleMemories().catch(() => [])
            ]);

            // Mapear tarefas e finanças ao formato local esperado (conversão leve)
            const localTasks = (tasks || []).map(t => ({
              id: t.id,
              text: t.title || t.text || '',
              completed: t.status === 'completed',
              date: t.created_at || t.date,
              completedAt: t.completed_at,
              dueDate: t.due_date,
              xpReward: t.xp_reward,
              category: t.category
            }));

            const localFinances = (finances || []).map(f => ({
              id: f.id,
              desc: f.description || f.desc || '',
              value: f.amount || f.value || 0,
              type: f.type || 'expense',
              category: f.category || null,
              date: f.created_at || f.date
            }));

            const localWorkLog = (workSessions || []).map(w => ({
              id: w.id,
              date: w.start_at ? w.start_at.split('T')[0] : (w.date || new Date().toISOString().split('T')[0]),
              timestamp: w.start_at ? new Date(w.start_at).getTime() : (w.timestamp || Date.now()),
              duration: w.total_seconds ? w.total_seconds * 1000 : (w.duration || 0),
              type: w.activity_type || 'time_tracking',
              inputVal: w.inputVal || (w.total_seconds ? w.total_seconds / 3600 : 0)
            }));

            // Integra os dados carregados ao state existente
            gameState.dailyTasks = localTasks;
            gameState.finances = localFinances;
            gameState.workLog = localWorkLog;
            if (oracleMemories && oracleMemories.length && typeof OracleMemory !== 'undefined') {
              OracleMemory.data = {
                learned: oracleMemories.map(m => ({ text: m.fact || m.text, date: m.created_at, tags: m.tags }))
              };
            }

            // Re-renderiza as seções que chegaram
            if (typeof renderDailyTasks === 'function') renderDailyTasks();
            if (typeof renderFinances === 'function') renderFinances();
            if (typeof renderWorkLog === 'function') renderWorkLog();

            console.log('✅ Dados adicionais carregados da nuvem:', {
              tarefas: localTasks.length,
              financas: localFinances.length,
              trabalho: localWorkLog.length
            });
            showToast('☁️ Dados da nuvem sincronizados.');
          } catch (bgErr) {
            console.error('Erro ao carregar dados em background:', bgErr);
            showToast('⚠️ Falha ao carregar alguns dados da nuvem.');
          } finally {
            elements.loginBtn.disabled = false;
            elements.loginBtn.textContent = 'Entrar';
          }
        })();

        // Salvar localmente também (para funcionar offline)
        if (elements.rememberUser && elements.rememberUser.checked) {
          localStorage.setItem('ur_last_user', email);
        }

        showToast('✅ Login realizado! Dados carregados da nuvem ☁️');
        isLoggedIn = true;
        loginTime = new Date();
        saveSession(email);
        hideAuthModal();
        updateUI();
        if (typeof renderDailyTasks === 'function') renderDailyTasks();
        if (typeof renderFinances === 'function') renderFinances();
        if (typeof checkAchievements === 'function') checkAchievements();
        checkBackupAvailability();
        checkBillsDueToday();
        elements.loginUsername.value = '';
        elements.loginPassword.value = '';
        return;
        
      } catch (supabaseError) {
        console.warn('Supabase login falhou:', supabaseError.message);
        // Mostra o erro do Supabase e para (não tenta fallback local)
        throw supabaseError;
      }
    }

    // Fallback: Login local (localStorage) - SÓ se Supabase não estiver disponível
    console.log('📁 Usando login local (Supabase não disponível)');
    const users = getUsers();
    if (!users[email]) {
      const foundKey = Object.keys(users).find(k => k.toLowerCase() === email.toLowerCase());
      if (foundKey) {
        throw new Error(`Email não encontrado! Você quis dizer "${foundKey}"?`);
      }
      throw new Error('Email não encontrado! Crie uma conta primeiro.');
    }
    
    if (users[email].password !== password) {
      throw new Error('Senha incorreta!');
    }
    
    if (elements.rememberUser && elements.rememberUser.checked) {
      localStorage.setItem('ur_last_user', email);
    } else {
      localStorage.removeItem('ur_last_user');
    }

    showToast('✅ Login realizado com sucesso!');
    gameState = normalizeGameState(users[email].character);
    isLoggedIn = true;
    loginTime = new Date();
    saveSession(email);
    hideAuthModal();
    updateUI();
    if (typeof checkAchievements === 'function') checkAchievements();
    checkBackupAvailability();
    checkBillsDueToday();
    elements.loginUsername.value = '';
    elements.loginPassword.value = '';
  } catch (error) {
    showToast(`❌ ${error.message}`);
  } finally {
    elements.loginBtn.disabled = false;
    elements.loginBtn.textContent = 'Entrar';
  }
}

function recoverPassword() {
  let email = elements.loginUsername.value.trim();
  if (!email) {
    email = prompt("Digite seu email para recuperar a senha:");
  }
  
  if (!email) return;

  const users = getUsers();
  if (users[email]) {
    // Verifica se o usuário tem pergunta de segurança (contas novas)
    if (users[email].security && users[email].security.question) {
      const answer = prompt(`Pergunta de Segurança: ${users[email].security.question}`);
      if (answer && answer.toLowerCase().trim() === users[email].security.answer.toLowerCase().trim()) {
        alert(`Sua senha é: ${users[email].password}`);
      } else {
        showToast('❌ Resposta de segurança incorreta.');
      }
    } else {
      // Fallback para contas antigas (Nome do Personagem)
      const charName = users[email].character.name;
      const check = prompt(`Segurança (Conta Antiga): Qual o nome do seu personagem?`);
      if (check && check.toLowerCase().trim() === charName.toLowerCase().trim()) {
        alert(`Sua senha é: ${users[email].password}`);
      } else {
        showToast('❌ Nome do personagem incorreto.');
      }
    }
  } else {
    showToast('❌ Email não encontrado neste navegador.');
  }
}

// Função de cadastro (Supabase ou Local)
async function register() {
  const email = elements.registerUsername.value.trim(); // Email
  const password = elements.registerPassword.value;
  const confirmPassword = elements.registerConfirmPassword.value;
  const name = elements.registerName.value.trim();
  const race = elements.registerRace.value;
  const auraColor = elements.registerAura.value;
  const question = elements.registerQuestion.value.trim();
  const answer = elements.registerAnswer.value.trim();

  if (!email || !password || !name || !question || !answer) {
    showToast('⚠️ Preencha todos os campos obrigatórios!');
    return;
  }
  
  // Validação de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast('⚠️ Digite um email válido!');
    return;
  }
  
  if (password.length < 6) {
    showToast('⚠️ A senha deve ter pelo menos 6 caracteres!');
    return;
  }
  if (password !== confirmPassword) {
    showToast('⚠️ As senhas não coincidem!');
    return;
  }

  try {
    elements.registerBtn.disabled = true;
    elements.registerBtn.textContent = 'Criando...';

    // Dados do personagem
    const characterData = {
      name,
      race,
      title: 'Viajante',
      auraColor,
      attributes: Object.fromEntries(ATTRIBUTES.map(a => [a.id, 1]))
    };

    // Tenta criar conta no Supabase primeiro
    if (useSupabase()) {
      const { data, error } = await SupabaseService.signUp(email, password, characterData);
      if (error) throw error;

      showToast('🎉 Conta criada! Verifique seu email para confirmar.', 5000);
      
      // Limpa os campos
      elements.registerUsername.value = '';
      elements.registerPassword.value = '';
      elements.registerConfirmPassword.value = '';
      elements.registerName.value = '';
      elements.registerQuestion.value = '';
      elements.registerAnswer.value = '';

      // Mostra tela de login
      showLoginForm();
      return;
    }

    // Fallback: Cadastro local (localStorage)
    let users = getUsers();
    if (users[email]) {
      throw new Error('Email já cadastrado!');
    }
    
    let character = {
      username: email,
      name,
      race,
      title: 'Viajante',
      auraColor,
      level: 1,
      xp: 0,
      streak: 0,
      attributes: Object.fromEntries(ATTRIBUTES.map(a => [a.id, 1])),
      achievements: [],
      inventory: [],
      dailyTasks: [],
      finances: [],
      financialGoal: 0,
      bills: [],
      relationshipStart: null,
      xpHistory: {},
      lastTaskReset: new Date().toISOString()
    };
    character = normalizeGameState(character);
    users[email] = { password, character, security: { question, answer } };
    setUsers(users);
    showToast('🎉 Personagem criado com sucesso!', 4000);
    gameState = character;
    isLoggedIn = true;
    loginTime = new Date();
    saveSession(email);
    hideAuthModal();
    updateUI();
    if (typeof checkAchievements === 'function') checkAchievements();
    checkBackupAvailability();
    elements.registerUsername.value = '';
    elements.registerPassword.value = '';
    elements.registerConfirmPassword.value = '';
    elements.registerName.value = '';
    elements.registerQuestion.value = '';
    elements.registerAnswer.value = '';
  } catch (error) {
    showToast(`❌ ${error.message}`);
  } finally {
    elements.registerBtn.disabled = false;
    elements.registerBtn.textContent = 'Criar Personagem';
  }
}

async function logout() {
  try {
    // Logout do Supabase se estiver usando
    if (useSupabase()) {
      await SupabaseService.signOut();
    }
  } catch (e) {
    console.warn('Erro ao deslogar do Supabase:', e);
  }
  
  showToast('👋 Até logo!');
  isLoggedIn = false;
  gameState = null;
  clearSession();
  showAuthModal();
  showLoginForm();
}

async function checkSession() {
  // Inicializa o Supabase se disponível
  if (typeof SupabaseService !== 'undefined') {
    SupabaseService.init();
  }

  // Tenta recuperar sessão do Supabase primeiro
  if (useSupabase()) {
    try {
      const session = await SupabaseService.getSession();
      if (session && session.user) {
        // Carrega TODOS os dados da nuvem
        const cloudData = await SupabaseService.syncCloudToLocal();
        
        if (cloudData) {
          gameState = normalizeGameState(cloudData);
          
          // Carrega memórias do oráculo se existirem
          if (cloudData.oracleMemory && typeof OracleMemory !== 'undefined') {
            OracleMemory.data = cloudData.oracleMemory;
          }
          
          console.log('✅ Sessão restaurada - dados carregados da nuvem:', {
            tarefas: cloudData.dailyTasks?.length || 0,
            financas: cloudData.finances?.length || 0
          });
          
          isLoggedIn = true;
          loginTime = new Date();
          hideAuthModal();
          checkDailyTaskReset();
          updateUI();
          if (typeof renderDailyTasks === 'function') renderDailyTasks();
          if (typeof renderFinances === 'function') renderFinances();
          if (typeof checkAchievements === 'function') checkAchievements();
          checkBackupAvailability();
          checkBillsDueToday();
          return;
        }
      }
    } catch (e) {
      console.warn('Erro ao verificar sessão Supabase:', e);
    }
  }

  // Fallback: Verifica sessão local
  const username = getSession();
  if (!username) {
    showAuthModal();
    showLoginForm();
    return;
  }
  const users = getUsers();
  if (users[username]) {
    gameState = normalizeGameState(users[username].character);
    isLoggedIn = true;
    loginTime = new Date();
    hideAuthModal();
    checkDailyTaskReset();
    updateUI();
    if (typeof checkAchievements === 'function') checkAchievements();
    checkBackupAvailability();
    checkBillsDueToday();
  } else {
    showAuthModal();
    showLoginForm();
  }
}

// Funções do jogo
function normalizeGameState(data) {
  // Define a estrutura padrão com valores default
  const defaultState = {
    username: data.username || 'User',
    name: data.name || 'Viajante',
    race: data.race || 'Humano',
    title: data.title || 'Viajante',
    auraColor: data.auraColor || '#ffdd57',
    level: 1,
    xp: 0,
    streak: 0,
    skillPoints: 0,
    attributes: Object.fromEntries(ATTRIBUTES.map(a => [a.id, 1])),
    achievements: [],
    inventory: [],
    dailyTasks: [],
    finances: [],
    financialGoal: 0,
    bills: [],
    relationshipStart: null,
    relationshipPhoto: null,
    xpHistory: {},
    lastTaskReset: new Date().toISOString(),
    lastClaim: null,
    playTime: 0,
    oraclePersonality: 'robot', // Personalidade padrão
    job: { name: null, type: null, config: {} }, // Configuração do Trabalho
    workLog: [],   // Histórico de ponto
    zenBackgroundImage: null,
    zenMusic: null,
    gratitudeJournal: [],
    taskHistory: [],
    expenseGroups: [] // Novos grupos de despesas
  };

  // Mescla os dados importados com o padrão para preencher campos faltantes
  const merged = { ...defaultState, ...data };
  
  // Remove valores undefined/null que vieram do data e usa o default
  Object.keys(defaultState).forEach(key => {
    if (merged[key] === undefined || merged[key] === null) {
      merged[key] = defaultState[key];
    }
  });

  // Garante a integridade dos atributos
  if (data.attributes) {
    merged.attributes = { ...defaultState.attributes, ...data.attributes };
  }
  
  return merged;
}

async function saveGame(arg) {
  const silent = typeof arg === 'boolean' ? arg : false;
  if (!isLoggedIn || !gameState) return;
  
  try {
    if (!silent) {
      elements.saveBtn.disabled = true;
      elements.saveBtn.textContent = '💾 Salvando...';
    }
    const username = getSession();
    
    // Atualiza tempo de jogo antes de salvar
    if (loginTime) {
      const now = new Date();
      gameState.playTime = (gameState.playTime || 0) + (now - loginTime);
      loginTime = now;
    }

    // Inclui memórias do oráculo no gameState para salvar
    if (typeof OracleMemory !== 'undefined' && OracleMemory.data) {
      gameState.oracleMemory = OracleMemory.data;
    }

    // Se está usando Supabase, sincroniza com a nuvem
    if (useSupabase()) {
      try {
        await SupabaseService.syncAllToCloud(gameState);
        console.log('✅ Dados salvos na nuvem');
      } catch (e) {
        console.warn('Erro ao sincronizar com nuvem:', e);
      }
    }
    
    // Também salva localmente (backup offline)
    let users = getUsers();
    if (!users[username]) {
      users[username] = { character: gameState };
    } else {
      users[username].character = gameState;
    }
    setUsers(users);
    
    // Backup Automático
    createAutoBackup();

    if (!silent) showToast('💾 Progresso salvo com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar:', error);
    if (!silent) showToast(`❌ ${error.message}`);
  } finally {
    if (!silent) {
      elements.saveBtn.disabled = false;
      elements.saveBtn.textContent = '💾 Salvar Progresso';
    }
  }
}

function createAutoBackup() {
  if (!isLoggedIn || !gameState) return;
  const username = getSession();
  
  try {
    // Validação de segurança antes de sobrescrever o backup
    if (!gameState.attributes || !gameState.level) return;

    const backupData = {
      timestamp: new Date().toISOString(),
      data: gameState,
      summary: `Nível ${gameState.level} - ${gameState.race}`
    };
    
    localStorage.setItem(`ur_backup_${username}`, JSON.stringify(backupData));
    
    if (elements.restoreBackupBtn) elements.restoreBackupBtn.style.display = 'inline-block';
    console.log('🔄 Backup automático atualizado.');
  } catch (e) {
    console.error('Erro ao criar backup:', e);
  }
}

function exportSave() {
  // Agora exporta TODOS os dados de usuário do localStorage
  if (!isLoggedIn) {
    showToast('⚠️ Você precisa estar logado para exportar.');
    return;
  }
  const allUsers = getUsers();
  if (Object.keys(allUsers).length === 0) {
    showToast('⚠️ Nenhum dado de usuário para exportar.');
    return;
  }

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allUsers));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `universo-real_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
  showToast('📤 Backup de todos os dados exportado com sucesso!');
}

function importSave() {
  if (elements.importFile) {
    elements.importFile.click();
  } else {
    showToast('❌ Erro: Campo de importação não encontrado.');
  }
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      
      if (!importedData || typeof importedData !== 'object' || Object.keys(importedData).length === 0) {
        throw new Error('Formato de arquivo inválido ou vazio.');
      }

      // --- DETECTAR TIPO DE BACKUP ---
      const firstKey = Object.keys(importedData)[0];
      const firstValue = importedData[firstKey];

      // Condição: É um backup completo (formato { username: { password, character }})
      if (firstValue && firstValue.hasOwnProperty('password') && firstValue.hasOwnProperty('character')) {
        if (confirm(`Restaurar backup completo com ${Object.keys(importedData).length} usuário(s)?\n\n⚠️ ATENÇÃO: Isso substituirá TODOS os dados salvos neste navegador!`)) {
          setUsers(importedData); // Substitui todos os usuários
          clearSession(); // Limpa a sessão atual
          showToast('✅ Backup completo restaurado! Por favor, faça o login novamente.', 5000);
          // Força um reload para reiniciar o estado do app e mostrar a tela de login
          setTimeout(() => window.location.reload(), 1500);
        }
      } 
      // Condição: É um save de personagem único (formato antigo/individual)
      else {
        // Validação de integridade do Save de personagem
        const requiredFields = ['name', 'level', 'xp', 'attributes'];
        const missingFields = requiredFields.filter(field => importedData[field] === undefined);

        if (missingFields.length > 0) {
          throw new Error(`Save de personagem inválido! Campos ausentes: ${missingFields.join(', ')}`);
        }
        
        if (confirm(`Importar dados do personagem ${importedData.name} (Nível ${importedData.level})? Isso substituirá o progresso do seu personagem ATUAL.`)) {
          // Manter o username da sessão atual para evitar conflitos de login
          importedData.username = gameState.username;
          gameState = normalizeGameState(importedData);
          saveGame();
          updateUI();
          checkAchievements();
          showToast('✅ Personagem importado com sucesso!');
        }
      }
    } catch (error) {
      showToast('❌ Erro ao importar: ' + error.message);
    } finally {
      if (elements.importFile) elements.importFile.value = '';
    }
  };
  reader.readAsText(file);
}

function checkBackupAvailability() {
  const username = getSession();
  if (localStorage.getItem(`ur_backup_${username}`)) {
    elements.restoreBackupBtn.style.display = 'inline-block';
  } else {
    elements.restoreBackupBtn.style.display = 'none';
  }
}

function restoreBackup() {
  const username = getSession();
  const backupJson = localStorage.getItem(`ur_backup_${username}`);
  
  if (!backupJson) return;

  try {
    const backup = JSON.parse(backupJson);
    const data = backup.data || backup;
    const time = backup.timestamp ? new Date(backup.timestamp).toLocaleString() : 'Desconhecido';
    const summary = backup.summary ? `\n📝 ${backup.summary}` : '';

    if (confirm(`Restaurar backup de ${time}?${summary}\n\n⚠️ Seu progresso atual será substituído.`)) {
      gameState = data;
      saveGame();
      updateUI();
      showToast('✅ Backup restaurado com sucesso!');
    }
  } catch (e) {
    showToast('❌ Erro ao ler backup.');
  }
}

async function resetAccount() {
  if (!isLoggedIn || !gameState) {
    showToast('⚠️ Você não está logado.');
    return;
  }

  const confirmation = prompt('🚨 ATENÇÃO! 🚨\n\nIsso apagará TODOS os seus dados (perfil, tarefas, finanças, etc.) permanentemente, tanto neste dispositivo quanto na nuvem.\n\nPara confirmar, digite "DELETAR":');

  if (confirmation !== 'DELETAR') {
    showToast('❌ Ação cancelada.');
    return;
  }

  try {
    showToast('🗑️ Resetando sua conta... Por favor, aguarde.', 5000);

    // Se estiver usando Supabase, deleta os dados da nuvem
    if (useSupabase()) {
      console.log('☁️ Deletando dados da nuvem...');
      const success = await SupabaseService.deleteAllUserData();
      if (!success) {
        // Mesmo que falhe na nuvem, continua o reset local para deslogar o usuário
        showToast('⚠️ Falha ao resetar dados na nuvem, mas continuando reset local.');
      } else {
        console.log('✅ Dados da nuvem deletados.');
      }
    }

    // Deleta os dados locais
    const username = getSession();
    let users = getUsers();
    if (users[username]) {
      delete users[username];
      setUsers(users);
    }
    
    localStorage.removeItem(`ur_backup_${username}`);
    clearSession();
    isLoggedIn = false;
    gameState = null;

    showToast('✅ Conta resetada com sucesso! Você será redirecionado.', 3000);

    setTimeout(() => window.location.reload(), 3000);
  } catch (error) {
    showToast(`❌ Erro ao resetar a conta: ${error.message}`);
  }
}

function getAttributeCost(currentLevel) {
  // Sistema de Níveis: Custo aumenta a cada 5 níveis
  // Nível 1-4: 1 pt | 5-9: 2 pts | 10-14: 3 pts
  return Math.floor(currentLevel / 5) + 1;
}

function calculateTotalSpent(level) {
  let total = 0;
  for (let l = 1; l < level; l++) {
    total += getAttributeCost(l);
  }
  return total;
}

function addSkillPoint(attrId) {
  const currentLevel = gameState.attributes[attrId];
  const cost = getAttributeCost(currentLevel);

  if (gameState.skillPoints >= cost) {
    gameState.attributes[attrId]++;
    gameState.skillPoints -= cost;
    updateUI();
    showToast(`+1 ${ATTRIBUTES.find(a => a.id === attrId).name}! (-${cost} pts)`);
    checkAchievements();
    saveGame();
  } else {
    showToast(`⚠️ Pontos insuficientes! Custo para o próximo nível: ${cost}`);
  }
}

function removeSkillPoint(attrId) {
  if ((gameState.streak || 0) < 10) {
    showToast('🔒 Você precisa de 10 dias de sequência para liberar a redução de atributos!');
    return;
  }

  const currentLevel = gameState.attributes[attrId];
  if (currentLevel > 1) {
    const refund = getAttributeCost(currentLevel - 1);
    gameState.attributes[attrId]--;
    gameState.skillPoints += refund;
    updateUI();
    saveGame();
  }
}

function updateXpHistory(amount) {
  if (!gameState) return;
  if (!gameState.xpHistory) gameState.xpHistory = {};
  
  const now = new Date();
  const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
  
  let current = gameState.xpHistory[dateKey] || 0;
  let newVal = current + amount;
  if (newVal < 0) newVal = 0; // Garante que o histórico não fique negativo
  gameState.xpHistory[dateKey] = newVal;
}

function resetAttributes() {
  if ((gameState.streak || 0) < 10) {
    showToast('🔒 Você precisa de 10 dias de sequência para resetar os atributos!');
    return;
  }

  if (confirm('Resetar todos os atributos? Você recuperará os pontos gastos.')) {
    let totalPoints = 0;
    ATTRIBUTES.forEach(attr => {
      totalPoints += calculateTotalSpent(gameState.attributes[attr.id]);
      gameState.attributes[attr.id] = 1;
    });
    gameState.skillPoints += totalPoints;
    updateUI();
    showToast('✅ Atributos resetados!');
    saveGame();
  }
}

function addItem() {
  const name = elements.inventoryInput.value.trim();
  if (!name) {
    showToast('⚠️ Digite o nome do item!');
    return;
  }
  
  if (!gameState.inventory) gameState.inventory = [];
  
  gameState.inventory.push({
    name: name,
    addedAt: new Date().toISOString()
  });
  
  elements.inventoryInput.value = '';
  saveGame();
  updateUI();
  showToast(`🎒 ${name} adicionado ao inventário!`);
}

function removeItem(index) {
  if (!gameState.inventory) return;
  
  const item = gameState.inventory[index];
  if (confirm(`Remover ${item.name} do inventário?`)) {
    gameState.inventory.splice(index, 1);
    saveGame();
    updateUI();
    showToast('🗑️ Item removido.');
  }
}

// --- Diário de Gratidão ---

function addGratitudeEntry() {
  const g1 = elements.gratitude1 ? elements.gratitude1.value.trim() : '';
  const g2 = elements.gratitude2 ? elements.gratitude2.value.trim() : '';
  const g3 = elements.gratitude3 ? elements.gratitude3.value.trim() : '';

  // Permite salvar se pelo menos um estiver preenchido
  if (!g1 && !g2 && !g3) {
    showToast('⚠️ Escreva pelo menos uma coisa boa do seu dia!');
    return;
  }

  const today = new Date().toLocaleDateString('pt-BR');
  if (!gameState.gratitudeJournal) gameState.gratitudeJournal = [];

  // Verifica se já agradeceu hoje
  const alreadyPosted = gameState.gratitudeJournal.some(entry => entry.date === today);
  
  if (alreadyPosted) {
    showToast('⚠️ Você já registrou sua gratidão hoje. Volte amanhã!');
    return;
  }

  // Filtra apenas os campos preenchidos
  const items = [g1, g2, g3].filter(text => text.length > 0);

  // Adiciona ao início da lista
  gameState.gratitudeJournal.unshift({
    date: today,
    items: items
  });

  // Recompensa
  const xpReward = 50;
  gameState.xp += xpReward;
  updateXpHistory(xpReward);
  
  // Checar Level Up
  if (gameState.xp >= 100) {
      gameState.level++;
      gameState.xp -= 100;
      gameState.skillPoints++;
      showToast('🎉 Level UP! +1 Ponto de Atributo');
      playSound('levelUp');
      triggerLevelUpAnimation();
  }

  // Limpar campos
  if (elements.gratitude1) elements.gratitude1.value = '';
  if (elements.gratitude2) elements.gratitude2.value = '';
  if (elements.gratitude3) elements.gratitude3.value = '';

  saveGame();
  renderGratitudeJournal();
  updateUI();
  showToast(`🙏 Gratidão registrada! +${xpReward} XP`);
  triggerConfetti();
}

function renderGratitudeJournal() {
  if (!elements.gratitudeHistory) return;
  const list = gameState.gratitudeJournal || [];
  
  // Verificar se já registrou hoje para bloquear a interface
  const today = new Date().toLocaleDateString('pt-BR');
  const alreadyPosted = list.some(entry => entry.date === today);

  if (elements.gratitudeBtn) {
    if (alreadyPosted) {
      elements.gratitudeBtn.disabled = true;
      elements.gratitudeBtn.textContent = '✅ Gratidão Registrada (Volte Amanhã)';
      if (elements.gratitude1) elements.gratitude1.disabled = true;
      if (elements.gratitude2) elements.gratitude2.disabled = true;
      if (elements.gratitude3) elements.gratitude3.disabled = true;
    } else {
      elements.gratitudeBtn.disabled = false;
      elements.gratitudeBtn.textContent = '🙏 Registrar Gratidão';
      if (elements.gratitude1) elements.gratitude1.disabled = false;
      if (elements.gratitude2) elements.gratitude2.disabled = false;
      if (elements.gratitude3) elements.gratitude3.disabled = false;
    }
  }

  elements.gratitudeHistory.innerHTML = '';
  
  if (list.length === 0) {
    elements.gratitudeHistory.innerHTML = '<div class="small" style="opacity:0.5; text-align:center;">Seu diário está vazio. Comece hoje!</div>';
    return;
  }

  list.forEach(entry => {
    const div = document.createElement('div');
    div.style.cssText = 'background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; margin-bottom: 8px; font-size: 13px; border-left: 2px solid var(--info);';
    div.innerHTML = `
      <div style="color: var(--info); font-weight: bold; margin-bottom: 6px; display:flex; justify-content:space-between;">
        <span>📅 ${entry.date}</span>
      </div>
      <ul style="padding-left: 20px; opacity: 0.9; margin: 0;">
        ${entry.items.map(i => `<li style="margin-bottom: 2px;">${i}</li>`).join('')}
      </ul>
    `;
    elements.gratitudeHistory.appendChild(div);
  });
}

// --- Sistema de Tarefas Diárias ---

function addDailyTask() {
  const text = elements.taskInput.value.trim();
  if (!text) {
    showToast('⚠️ Digite o nome da tarefa!');
    return;
  }

  if (!gameState.dailyTasks) gameState.dailyTasks = [];

  gameState.dailyTasks.push({
    id: Date.now(),
    text: text,
    completed: false
  });

  elements.taskInput.value = '';
  saveGame();
  updateUI();
  showToast('✅ Tarefa adicionada!');
}

function toggleTask(id) {
  const task = gameState.dailyTasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    
    // Recompensa ou penalidade imediata ao marcar/desmarcar
    if (task.completed) {
      gameState.xp += 10;
      updateXpHistory(10);
      showToast('✅ Tarefa concluída! +10 XP');
      playSound('click');
    } else {
      gameState.xp = Math.max(0, gameState.xp - 10);
      updateXpHistory(-10);
      showToast('↩️ Tarefa desfeita. -10 XP');
    }

    // Checar Level Up
    if (gameState.xp >= 100) {
      gameState.level++;
      gameState.xp -= 100;
      gameState.skillPoints++;
      showToast('🎉 Level UP! +1 Ponto de Atributo');
      playSound('levelUp');
      triggerLevelUpAnimation();
    }

    saveGame();
    updateUI();

    // Aplica animação visual no elemento atualizado
    if (task.completed) {
      const taskEl = document.querySelector(`.task-item[data-id="${id}"]`);
      if (taskEl) taskEl.classList.add('task-success-anim');
      
      // Verifica se completou todas as tarefas (100%)
      if (gameState.dailyTasks.every(t => t.completed)) {
        triggerConfetti();
        playSound('achievement');
        showToast('🎉 Espetacular! Todas as metas de hoje foram alcançadas!');
      }
    }
  }
}

async function removeTask(id, event) {
  event.stopPropagation(); // Impede que o clique no botão ative o toggleTask
  if (confirm('Excluir esta tarefa permanentemente?')) {
    // Remove localmente
    gameState.dailyTasks = gameState.dailyTasks.filter(t => t.id !== id);
    saveGame();
    updateUI();
    
    // Remove do Supabase (nuvem)
    try {
      if (typeof SupabaseService !== 'undefined' && SupabaseService.deleteTask) {
        await SupabaseService.deleteTask(id);
        console.log('✅ Tarefa deletada do Supabase:', id);
      }
    } catch (error) {
      console.error('❌ Erro ao deletar tarefa do Supabase:', error);
    }
    
    showToast('🗑️ Tarefa excluída permanentemente!');
  }
}

function renderTaskHistory() {
  if (!elements.taskHistoryList || !gameState.taskHistory) return;
  
  elements.taskHistoryList.innerHTML = '';
  const history = gameState.taskHistory;

  if (history.length === 0) {
    elements.taskHistoryList.innerHTML = '<div class="small" style="text-align:center; opacity:0.5;">Nenhum histórico disponível.</div>';
    return;
  }

  // Ordena do mais recente para o mais antigo
  history.slice().reverse().forEach(day => {
    const dateStr = new Date(day.date).toLocaleDateString('pt-BR');
    const completedCount = day.tasks.length;
    
    const div = document.createElement('div');
    div.style.cssText = 'background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid var(--success);';
    
    let tasksHtml = '';
    day.tasks.forEach(t => {
      tasksHtml += `<li style="margin-bottom: 4px; opacity: 0.8;">✅ ${t.text}</li>`;
    });

    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom: 8px; font-weight:bold;">
        <span>📅 ${dateStr}</span>
        <span style="font-size: 12px; background: rgba(46, 204, 113, 0.2); padding: 2px 8px; border-radius: 10px; color: var(--success);">${completedCount} concluídas</span>
      </div>
      <ul style="padding-left: 20px; font-size: 13px; margin: 0;">
        ${tasksHtml || '<li style="opacity:0.5">Nenhuma tarefa concluída neste dia.</li>'}
      </ul>
    `;
    elements.taskHistoryList.appendChild(div);
  });
}

function checkDailyTaskReset() {
  if (!gameState || !gameState.dailyTasks) return;

  const now = new Date();
  const lastReset = gameState.lastTaskReset ? new Date(gameState.lastTaskReset) : now;

  // Verifica se é um dia diferente (comparando dia, mês e ano)
  if (now.toDateString() !== lastReset.toDateString()) {
    let penalty = 0;
    
    // Salvar histórico das tarefas concluídas ontem
    const completedTasks = gameState.dailyTasks.filter(t => t.completed);
    if (completedTasks.length > 0) {
      if (!gameState.taskHistory) gameState.taskHistory = [];
      gameState.taskHistory.push({
        date: lastReset.toISOString(),
        tasks: completedTasks
      });
    }

    // Calcula penalidade para tarefas não feitas
    gameState.dailyTasks.forEach(task => {
      if (!task.completed) {
        penalty += 15; // Perde 15 XP por tarefa esquecida
      }
      task.completed = false; // Reseta o status
    });

    if (penalty > 0) {
      gameState.xp = Math.max(0, gameState.xp - penalty);
      updateXpHistory(-penalty);
      showToast(`🌅 Novo dia! Você perdeu ${penalty} XP por tarefas pendentes.`);
    }

    gameState.lastTaskReset = now.toISOString();
    saveGame();
  }
}

// --- Sistema Financeiro ---

function addTransaction() {
  const desc = elements.financeDesc.value.trim();
  const value = parseMoney(elements.financeValue.value);
  const type = elements.financeType.value;
  const category = elements.financeCategory.value;

  if (!desc || isNaN(value) || value <= 0) {
    showToast('⚠️ Preencha uma descrição e um valor válido!');
    return;
  }

  if (!gameState.finances) gameState.finances = [];

  gameState.finances.push({
    id: Date.now(),
    desc,
    value,
    type,
    category,
    date: new Date().toISOString()
  });

  elements.financeDesc.value = '';
  elements.financeValue.value = '';
  
  saveGame();
  updateUI();
  showToast('💰 Transação registrada!');
}

async function removeTransaction(id) {
  if (confirm('Remover esta transação?')) {
    // Converte para o tipo correto para comparação
    const idToRemove = typeof id === 'string' && !isNaN(id) ? Number(id) : id;
    
    gameState.finances = gameState.finances.filter(t => {
      // Compara tanto como string quanto como número
      return t.id !== id && t.id !== idToRemove && String(t.id) !== String(id);
    });
    
    saveGame();
    updateUI();
    
    // Remove do Supabase se for UUID
    try {
      if (typeof SupabaseService !== 'undefined' && SupabaseService.deleteFinance) {
        await SupabaseService.deleteFinance(id);
        console.log('✅ Transação deletada do Supabase:', id);
      }
    } catch (error) {
      console.error('❌ Erro ao deletar transação do Supabase:', error);
    }
    
    showToast('🗑️ Transação removida!');
  }
}

function changeFinancePage(step) {
  financePage += step;
  renderFinances();
}

function setFinanceFilter(filter) {
  financeFilter = filter;
  financePage = 1;
  renderFinances();
}

function renderFinances() {
  // Injeção dos botões de filtro se não existirem
  if (elements.financeList && !document.getElementById('financeFilterContainer')) {
    const container = document.createElement('div');
    container.id = 'financeFilterContainer';
    container.style.cssText = 'display: flex; gap: 10px; margin-bottom: 15px;';
    
    const filters = [
      { id: 'all', label: 'Todos' },
      { id: 'income', label: 'Receitas' },
      { id: 'expense', label: 'Despesas' },
      { id: 'salary', label: 'Salário' },
      { id: 'extra', label: 'Extra' }
    ];
    
    filters.forEach(f => {
      const btn = document.createElement('button');
      btn.textContent = f.label;
      btn.dataset.filter = f.id;
      btn.className = 'btn ghost';
      btn.style.cssText = 'flex: 1; padding: 5px; font-size: 12px; border: 1px solid #444; transition: all 0.2s;';
      btn.onclick = () => setFinanceFilter(f.id);
      container.appendChild(btn);
    });
    
    elements.financeList.parentNode.insertBefore(container, elements.financeList);
  }

  // Atualiza estilo dos botões
  const btns = document.querySelectorAll('#financeFilterContainer button');
  btns.forEach(btn => {
    if (btn.dataset.filter === financeFilter) {
      btn.style.background = 'var(--accent, #ffdd57)';
      btn.style.color = '#1a1a1a';
      btn.style.fontWeight = 'bold';
    } else {
      btn.style.background = 'transparent';
      btn.style.color = 'inherit';
      btn.style.fontWeight = 'normal';
    }
  });

  if (elements.financeList) elements.financeList.innerHTML = '';
  const transactions = gameState.finances || [];
  let balance = 0;

  // Calcula saldo total (independente do filtro)
  transactions.forEach(t => {
    const val = Number(t.value);
    if (t.type === 'income') balance += val;
    else if (t.type === 'expense') balance -= val;
  });

  // Filtra para exibição
  const displayTransactions = transactions.filter(t => {
    if (financeFilter === 'all') return true;
    if (financeFilter === 'salary') return t.category === 'Salário';
    if (financeFilter === 'extra') return t.category === 'Extra';
    return t.type === financeFilter;
  });

  // Paginação
  const itemsPerPage = 5;
  const totalPages = Math.ceil(displayTransactions.length / itemsPerPage) || 1;
  
  if (financePage < 1) financePage = 1;
  if (financePage > totalPages) financePage = totalPages;

  const start = (financePage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  
  // Inverte para mostrar os mais recentes primeiro na página 1
  const paginatedItems = [...displayTransactions].reverse().slice(start, end);

  if (paginatedItems.length === 0) {
    if (elements.financeList) elements.financeList.innerHTML = '<div class="small" style="text-align:center; opacity:0.5; padding: 10px;">Nenhum registro encontrado.</div>';
  }

  paginatedItems.forEach(t => {
    const div = document.createElement('div');
    div.className = `finance-item ${t.type}`;
    div.innerHTML = `
      <div style="flex:1">
        <div style="font-weight:600">${t.desc} <span class="small" style="opacity:0.5; font-weight:400">(${t.category || 'Outros'})</span></div>
        <div class="small" style="opacity:0.6">${new Date(t.date).toLocaleDateString()}</div>
      </div>
      <div class="finance-value ${t.type}">${t.type === 'income' ? '+' : '-'} R$ ${t.value.toLocaleString('pt-BR')}</div>
      <button class="ghost" style="padding:4px 8px; margin-left:10px" onclick="removeTransaction('${t.id}')">❌</button>
    `;
    if (elements.financeList) elements.financeList.appendChild(div);
  });

  // Controles de Paginação
  if (!document.getElementById('financePagination') && elements.financeList) {
    const pDiv = document.createElement('div');
    pDiv.id = 'financePagination';
    pDiv.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 10px;';
    elements.financeList.parentNode.insertBefore(pDiv, elements.financeList.nextSibling);
  }

  const pContainer = document.getElementById('financePagination');
  if (pContainer) {
    if (displayTransactions.length > 0) {
      pContainer.style.display = 'flex';
      pContainer.innerHTML = `
        <button class="btn ghost" onclick="changeFinancePage(-1)" ${financePage <= 1 ? 'disabled' : ''}>◀</button>
        <span class="small">Página ${financePage} de ${totalPages}</span>
        <button class="btn ghost" onclick="changeFinancePage(1)" ${financePage >= totalPages ? 'disabled' : ''}>▶</button>
      `;
    } else {
      pContainer.style.display = 'none';
    }
  }

  if (elements.financeBalance) {
    elements.financeBalance.textContent = `R$ ${balance.toLocaleString('pt-BR')}`;
    elements.financeBalance.style.color = balance >= 0 ? 'var(--success)' : 'var(--danger)';
  }
}

function renderFinanceChart() {
  if (!elements.financeChart) return;
  
  const transactions = gameState.finances || [];
  const expenses = transactions.filter(t => t.type === 'expense');
  
  const categories = {};
  expenses.forEach(t => {
    const cat = t.category || 'Outros';
    categories[cat] = (categories[cat] || 0) + t.value;
  });
  
  const labels = Object.keys(categories);
  const data = Object.values(categories);
  
  if (financeChartInstance) {
    financeChartInstance.destroy();
  }
  
  if (labels.length === 0) return;

  financeChartInstance = new Chart(elements.financeChart, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          '#ff6384', '#36a2eb', '#ffcd56', '#4bc0c0', '#9966ff', '#ff9f40', '#c9cbcf'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#ccc', boxWidth: 12 } }
      }
    },
  });
}

function renderFinanceMonthlyChart() {
  if (!elements.financeMonthlyChart) return;

  const transactions = gameState.finances || [];
  const expenses = transactions.filter(t => t.type === 'expense');

  // Agrupar por Mês (YYYY-MM) e Categoria
  const monthlyData = {};
  const categories = new Set();
  const months = new Set();

  expenses.forEach(t => {
    const date = new Date(t.date);
    const sortKey = date.toISOString().slice(0, 7); // 2024-01
    
    months.add(sortKey);
    const cat = t.category || 'Outros';
    categories.add(cat);

    if (!monthlyData[sortKey]) monthlyData[sortKey] = {};
    monthlyData[sortKey][cat] = (monthlyData[sortKey][cat] || 0) + t.value;
  });

  const sortedMonths = Array.from(months).sort();
  const uniqueCategories = Array.from(categories);
  const colors = ['#ff6384', '#36a2eb', '#ffcd56', '#4bc0c0', '#9966ff', '#ff9f40', '#c9cbcf'];

  const datasets = uniqueCategories.map((cat, index) => {
    return {
      label: cat,
      data: sortedMonths.map(m => monthlyData[m][cat] || 0),
      backgroundColor: colors[index % colors.length],
      stack: 'Stack 0',
    };
  });

  const labels = sortedMonths.map(m => {
    const [y, mo] = m.split('-');
    return `${mo}/${y}`;
  });

  if (financeMonthlyChartInstance) {
    financeMonthlyChartInstance.destroy();
  }

  if (labels.length === 0) return;

  financeMonthlyChartInstance = new Chart(elements.financeMonthlyChart, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { stacked: true, ticks: { color: '#ccc' }, grid: { display: false } },
        y: { stacked: true, ticks: { color: '#ccc' }, grid: { color: 'rgba(255,255,255,0.1)' } }
      },
      plugins: {
        legend: { position: 'bottom', labels: { color: '#ccc', boxWidth: 12 } },
        title: { display: true, text: 'Histórico de Gastos Mensais', color: '#ccc' }
      }
    }
  });
}

function setFinancialGoal() {
  const goal = parseMoney(elements.financeGoalInput.value);
  if (isNaN(goal) || goal <= 0) {
    showToast('⚠️ Defina um valor válido para a meta!');
    return;
  }
  gameState.financialGoal = goal;
  elements.financeGoalInput.value = '';
  saveGame();
  updateUI();
  showToast('🎯 Meta financeira definida: R$ ' + goal.toLocaleString('pt-BR'));
}

function cancelFinancialGoal() {
  if (confirm('Deseja realmente cancelar a meta financeira atual?')) {
    gameState.financialGoal = 0;
    saveGame();
    updateUI();
    showToast('❌ Meta financeira cancelada!');
  }
}

function renderFinancialGoal() {
  const goal = gameState.financialGoal || 0;
  
  if (goal <= 0) {
    if (elements.financeGoalDisplay) elements.financeGoalDisplay.classList.add('hidden');
    if (elements.financeGoalInput) elements.financeGoalInput.placeholder = 'Definir Meta (R$)';
    return;
  }
  
  if (elements.financeGoalDisplay) elements.financeGoalDisplay.classList.remove('hidden');
  if (elements.financeGoalInput) elements.financeGoalInput.placeholder = `Alterar meta (atual: R$ ${goal.toLocaleString('pt-BR')})`;
  
  // Calcular Saldo
  const transactions = gameState.finances || [];
  let balance = 0;
  transactions.forEach(t => {
    const val = Number(t.value);
    if (t.type === 'income') balance += val;
    else if (t.type === 'expense') balance -= val;
  });
  
  // Calcular Progresso
  let percent = 0;
  if (goal > 0) {
    percent = (balance / goal) * 100;
  }
  const cappedPercent = Math.max(0, Math.min(100, percent));
  
  // Cor da barra baseada no progresso
  let barColor = 'var(--danger)';
  if (percent >= 100) barColor = 'var(--success)';
  else if (percent >= 75) barColor = '#4ade80';
  else if (percent >= 50) barColor = 'var(--accent)';
  else if (percent >= 25) barColor = '#fbbf24';
  
  if (elements.financeGoalProgress) {
    elements.financeGoalProgress.style.width = `${cappedPercent}%`;
    elements.financeGoalProgress.style.background = barColor;
  }
  
  if (elements.financeGoalText) {
    elements.financeGoalText.innerHTML = `<strong>${percent.toFixed(1)}%</strong> &nbsp;•&nbsp; R$ ${balance.toLocaleString('pt-BR')} / R$ ${goal.toLocaleString('pt-BR')}`;
  }
  
  const remaining = goal - balance;
  if (elements.financeGoalStatus) {
    if (remaining <= 0) {
      elements.financeGoalStatus.innerHTML = "🎉 <strong>Meta alcançada!</strong> Parabéns!";
      elements.financeGoalStatus.style.color = "var(--success)";
    } else {
      elements.financeGoalStatus.innerHTML = `Faltam <strong>R$ ${remaining.toLocaleString('pt-BR')}</strong>`;
      elements.financeGoalStatus.style.color = "inherit";
    }
  }
}

// --- Sistema de Grupos Financeiros Personalizados ---

function openGroupConfig() {
  elements.groupConfigModal.classList.add('active');
  renderGroupsConfig();
}

function closeGroupConfig() {
  elements.groupConfigModal.classList.remove('active');
  updateUI(); // Atualiza a tela principal com as mudanças
}

function addExpenseGroup() {
  const name = elements.groupNameInput.value.trim();
  const keywordsStr = elements.groupKeywordsInput.value.trim();

  if (!name || !keywordsStr) {
    showToast('⚠️ Preencha o nome e as palavras-chave!');
    return;
  }

  if (!gameState.expenseGroups) gameState.expenseGroups = [];

  // Separa as palavras por vírgula e limpa espaços
  const keywords = keywordsStr.split(',').map(k => k.trim()).filter(k => k.length > 0);

  gameState.expenseGroups.push({
    id: Date.now(),
    name,
    keywords
  });

  elements.groupNameInput.value = '';
  elements.groupKeywordsInput.value = '';
  
  saveGame();
  renderGroupsConfig();
  showToast('✅ Grupo criado!');
}

function removeExpenseGroup(id) {
  if (confirm('Excluir este grupo?')) {
    gameState.expenseGroups = gameState.expenseGroups.filter(g => g.id !== id);
    saveGame();
    renderGroupsConfig();
  }
}

function renderGroupsConfig() {
  if (!elements.groupsListConfig) return;
  elements.groupsListConfig.innerHTML = '';
  const groups = gameState.expenseGroups || [];

  if (groups.length === 0) {
    elements.groupsListConfig.innerHTML = '<div class="small" style="opacity:0.5; text-align:center;">Nenhum grupo configurado.</div>';
    return;
  }

  groups.forEach(g => {
    const div = document.createElement('div');
    div.style.cssText = 'background: rgba(255,255,255,0.05); padding: 8px; border-radius: 6px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;';
    div.innerHTML = `
      <div>
        <div style="font-weight:bold; font-size:13px;">${g.name}</div>
        <div class="small" style="opacity:0.6; font-size:11px;">${g.keywords.join(', ')}</div>
      </div>
      <button class="ghost" style="padding:4px 8px; font-size:12px;" onclick="removeExpenseGroup(${g.id})">🗑️</button>
    `;
    elements.groupsListConfig.appendChild(div);
  });
}

function renderFinanceGroups() {
  if (!elements.financeGroupsDisplay || !gameState) return;
  elements.financeGroupsDisplay.innerHTML = '';
  
  const groups = gameState.expenseGroups || [];
  const transactions = gameState.finances || [];

  if (groups.length === 0) {
    elements.financeGroupsDisplay.innerHTML = '<div class="small" style="opacity:0.5; text-align:center; padding:10px;">Configure grupos para ver análises personalizadas.</div>';
    return;
  }

  groups.forEach(group => {
    let total = 0;
    // Normaliza palavras-chave para minúsculas
    const keywords = group.keywords.map(k => k.toLowerCase());

    transactions.forEach(t => {
      if (t.type === 'expense') {
        const desc = t.desc.toLowerCase();
        // Verifica se a descrição contém alguma das palavras-chave
        if (keywords.some(k => desc.includes(k))) {
          total += t.value;
        }
      }
    });

    const div = document.createElement('div');
    div.className = 'finance-item'; // Reutiliza estilo existente
    div.style.borderLeft = '3px solid var(--accent)';
    div.innerHTML = `
      <div style="flex:1">
        <div style="font-weight:600">${group.name}</div>
        <div class="small" style="opacity:0.6">${group.keywords.length} palavras-chave</div>
      </div>
      <div style="font-weight:bold;">R$ ${total.toLocaleString('pt-BR')}</div>
    `;
    elements.financeGroupsDisplay.appendChild(div);
  });
}

// --- Sistema de Contas a Pagar ---

function addBill() {
  const desc = elements.billDesc.value.trim();
  const value = parseMoney(elements.billValue.value);
  const date = elements.billDate.value;
  const recurrence = elements.billRecurrence.value;

  if (!desc || isNaN(value) || value <= 0 || !date) {
    showToast('⚠️ Preencha descrição, valor e data!');
    return;
  }

  if (!gameState.bills) gameState.bills = [];

  gameState.bills.push({
    id: Date.now(),
    desc,
    value,
    dueDate: date,
    paid: false,
    recurrence: recurrence
  });

  elements.billDesc.value = '';
  elements.billValue.value = '';
  elements.billDate.value = '';
  elements.billRecurrence.value = 'none';
  
  saveGame();
  updateUI();
  showToast('📅 Conta agendada!');
}

function toggleBillPaid(id) {
  if (!gameState.bills) return;
  const bill = gameState.bills.find(b => b.id === id);
  
  if (bill) {
    const wasPaid = bill.paid;
    bill.paid = !bill.paid;
    
    if (bill.paid) {
      // Perguntar se quer lançar como despesa
      if (confirm(`Conta "${bill.desc}" paga! \nDeseja lançar R$ ${bill.value.toLocaleString('pt-BR')} como despesa no financeiro?`)) {
        if (!gameState.finances) gameState.finances = [];
        gameState.finances.push({
          id: Date.now(),
          desc: `Pgto: ${bill.desc}`,
          value: bill.value,
          type: 'expense',
          category: 'Outros',
          date: new Date().toISOString()
        });
        showToast('✅ Despesa registrada automaticamente!');
      } else {
        showToast('✅ Conta marcada como paga.');
      }

      // Lógica de Recorrência
      // Gera a próxima conta apenas se não estava paga antes e se ainda não gerou a próxima
      if (!wasPaid && bill.recurrence && bill.recurrence !== 'none' && !bill.generatedNext) {
        const [y, m, d] = bill.dueDate.split('-').map(Number);
        const nextDateObj = new Date(y, m - 1, d);

        if (bill.recurrence === 'monthly') {
          nextDateObj.setMonth(nextDateObj.getMonth() + 1);
        } else if (bill.recurrence === 'weekly') {
          nextDateObj.setDate(nextDateObj.getDate() + 7);
        } else if (bill.recurrence === 'yearly') {
          nextDateObj.setFullYear(nextDateObj.getFullYear() + 1);
        }

        const nextDueDate = nextDateObj.toISOString().split('T')[0];

        gameState.bills.push({
          id: Date.now() + 1, // +1 para garantir ID único se for muito rápido
          desc: bill.desc,
          value: bill.value,
          dueDate: nextDueDate,
          paid: false,
          recurrence: bill.recurrence,
          generatedNext: false
        });
        bill.generatedNext = true;
        showToast('📅 Próxima conta recorrente agendada!');
      }
    }
    
    saveGame();
    updateUI();
  }
}

function removeBill(id) {
  if (confirm('Remover este lembrete de conta?')) {
    gameState.bills = gameState.bills.filter(b => b.id !== id);
    saveGame();
    updateUI();
  }
}

function renderBills() {
  if (elements.billList) elements.billList.innerHTML = '';
  const bills = gameState.bills || [];
  const today = new Date().toISOString().split('T')[0];

  bills.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)); // Ordenar por data

  bills.forEach(bill => {
    const isOverdue = !bill.paid && bill.dueDate < today;
    const div = document.createElement('div');
    div.className = `bill-item ${bill.paid ? 'paid' : ''} ${isOverdue ? 'overdue' : ''}`;
    div.innerHTML = `
      <div style="flex:1; cursor: pointer;" onclick="toggleBillPaid(${bill.id})">
        <div style="font-weight:600">
          ${bill.paid ? '✅' : '⬜'} ${bill.desc} 
          ${bill.recurrence && bill.recurrence !== 'none' ? '<span title="Recorrente" style="font-size:12px">🔄</span>' : ''}
        </div>
        <div class="bill-date">${isOverdue ? '⚠️ Venceu em: ' : 'Vence em: '} ${new Date(bill.dueDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</div>
      </div>
      <div style="font-weight: 700; margin-right: 10px;">R$ ${bill.value.toLocaleString('pt-BR')}</div>
      <button class="ghost" style="padding:4px 8px;" onclick="removeBill(${bill.id})">❌</button>
    `;
    if (elements.billList) elements.billList.appendChild(div);
  });
}

function checkBillsDueToday() {
  if (!gameState || !gameState.bills) return;
  
  // Obter data local no formato YYYY-MM-DD
  const now = new Date();
  const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
  const today = localDate.toISOString().split('T')[0];

  const dueBills = gameState.bills.filter(b => !b.paid && b.dueDate === today);
  
  if (dueBills.length > 0) {
    const total = dueBills.reduce((sum, b) => sum + b.value, 0);
    showToast(`⚠️ Atenção! Você tem ${dueBills.length} conta(s) vencendo hoje (Total: R$ ${total.toLocaleString('pt-BR')})`, 8000);
  }
}

// --- Sistema de Relacionamento ---

function setRelationshipDate() {
  const dateInput = elements.relationshipDateInput.value;
  const fileInput = elements.relationshipPhotoInput;

  if (!dateInput) {
    showToast('⚠️ Selecione uma data!');
    return;
  }

  function saveLogic(photoData) {
    gameState.relationshipStart = dateInput;
    gameState.relationshipPhoto = photoData;
    saveGame();
    updateUI();
    showToast('❤️ Data definida com sucesso!');
  }

  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      saveLogic(e.target.result);
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    saveLogic(null);
  }
}

function resetRelationshipDate() {
  if (confirm('Tem certeza que deseja resetar o contador de relacionamento?')) {
    gameState.relationshipStart = null;
    gameState.relationshipPhoto = null;
    saveGame();
    updateUI();
  }
}

function changeRelationshipPhoto() {
  elements.updateRelationshipPhotoInput.click();
}

function handlePhotoUpdate(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    gameState.relationshipPhoto = e.target.result;
    saveGame();
    updateUI();
    showToast('📸 Foto atualizada com sucesso!');
  };
  reader.readAsDataURL(file);
}

// --- Sistema de Playlist com IndexedDB ---
const DB_NAME = 'UniversoRealDB';
const DB_VERSION = 1;
let db = null;

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('music')) {
        db.createObjectStore('music', { autoIncrement: true });
      }
    };
    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };
    request.onerror = (event) => {
      console.warn("IndexedDB error:", event.target.error);
      reject(event.target.error);
    };
  });
}

async function saveMusicToDB(files) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['music'], 'readwrite');
    const store = transaction.objectStore('music');
    store.clear(); // Limpa playlist anterior
    
    let count = 0;
    Array.from(files).forEach(file => {
      if (file.type.startsWith('audio/')) {
        store.add(file);
        count++;
      }
    });
    
    transaction.oncomplete = () => resolve(count);
    transaction.onerror = () => reject(transaction.error);
  });
}

async function getMusicFromDB() {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['music'], 'readonly');
    const store = transaction.objectStore('music');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadAndPlayZenPlaylist() {
  try {
    zenPlaylist = await getMusicFromDB();
    if (zenPlaylist.length > 0) {
      renderZenPlaylistSelect();
      currentTrackIndex = 0;
      playZenTrack(currentTrackIndex);
      if (elements.zenPlaylistInfo) {
        elements.zenPlaylistInfo.textContent = `${zenPlaylist.length} músicas carregadas`;
      }
    } else {
      // Fallback para padrão se não houver nada no banco
      if (!elements.zenAudio.getAttribute('src')) {
        elements.zenAudio.src = DEFAULT_ZEN_MUSIC;
        elements.zenAudio.loop = true; // Loop se for música única padrão
      }
    }
  } catch (e) {
    console.warn("Erro ao carregar playlist", e);
    // Fallback erro
    elements.zenAudio.src = DEFAULT_ZEN_MUSIC;
  }
}

function renderZenPlaylistSelect() {
  if (!elements.zenTrackSelect) return;
  
  if (zenPlaylist.length === 0) {
    elements.zenTrackSelect.style.display = 'none';
    elements.zenMusicBtn.textContent = '🎵 Selecionar Pasta de Músicas';
    return;
  }

  elements.zenTrackSelect.innerHTML = '';
  zenPlaylist.forEach((file, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = (index + 1) + '. ' + file.name.replace(/\.[^/.]+$/, ""); // Remove extensão
    elements.zenTrackSelect.appendChild(option);
  });
  
  elements.zenTrackSelect.style.display = 'block';
  elements.zenMusicBtn.textContent = '📂'; // Minimiza o botão da pasta
  elements.zenMusicBtn.title = 'Alterar Pasta';
}

function playZenTrack(index) {
  if (zenPlaylist.length === 0) return;
  if (index >= zenPlaylist.length) index = 0; // Loop da playlist
  currentTrackIndex = index;
  
  const file = zenPlaylist[index];
  const url = URL.createObjectURL(file);
  
  elements.zenAudio.src = url;
  elements.zenAudio.loop = false; // Playlist não deve loopar a mesma música
  elements.zenAudio.play().catch(e => console.warn("Autoplay blocked"));
  
  if (elements.zenPlaylistInfo) {
    elements.zenPlaylistInfo.textContent = `Tocando ${index + 1}/${zenPlaylist.length}`;
  }

  if (elements.zenTrackSelect) {
    elements.zenTrackSelect.value = index;
  }
}

function toggleZenMode() {
  if (!gameState.relationshipStart) {
    showToast('⚠️ Configure o contador de relacionamento primeiro!');
    return;
  }
  
  const overlay = elements.zenModeOverlay;
  if (overlay.classList.contains('hidden')) {
    overlay.classList.remove('hidden');
    const randomQuote = ZEN_QUOTES[Math.floor(Math.random() * ZEN_QUOTES.length)];
    if (elements.zenQuote) elements.zenQuote.textContent = `"${randomQuote}"`;
    
    // Carregar playlist do banco se o player estiver vazio ou playlist vazia
    if (zenPlaylist.length === 0 && !elements.zenAudio.getAttribute('src')) {
      loadAndPlayZenPlaylist();
    }

    // Tocar música se houver src definido
    if (elements.zenAudio.src) {
      elements.zenAudio.play().catch(e => {
        console.warn("Reprodução de áudio impedida:", e);
        // Se o navegador bloquear o autoplay, avisa o usuário
        if (e.name === 'NotAllowedError') {
          showToast('⚠️ Toque na tela para liberar o áudio.');
        }
      });
    }

    // Aplicar Imagem de Fundo
    if (gameState.zenBackgroundImage) {
      elements.zenBackgroundDisplay.src = gameState.zenBackgroundImage;
      elements.zenBackgroundDisplay.classList.remove('hidden');
      // Começa pequena (no canto) por padrão ao abrir
      elements.zenBackgroundDisplay.classList.add('expanded'); // Já começa expandida e visível conforme pedido
    } else {
      elements.zenBackgroundDisplay.classList.add('hidden');
    }
  } else {
    overlay.classList.add('hidden');
    elements.zenAudio.pause();
  }
}

function toggleZenHud() {
  if (elements.zenModeOverlay) {
    elements.zenModeOverlay.classList.toggle('zen-hud-hidden');
  }
}

async function handleZenMusicSelect(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  try {
    showToast('⏳ Salvando músicas...');
    const count = await saveMusicToDB(files);
    showToast(`🎵 ${count} músicas salvas na playlist!`);
    
    // Carregar e tocar a primeira
    loadAndPlayZenPlaylist();
  } catch (e) {
    console.error(e);
    showToast('⚠️ Erro ao salvar músicas (IndexedDB).');
  }
}

function handleZenImageSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    gameState.zenBackgroundImage = e.target.result;
    saveGame();
    
    if (elements.zenBackgroundDisplay) {
      elements.zenBackgroundDisplay.src = gameState.zenBackgroundImage;
      elements.zenBackgroundDisplay.classList.remove('hidden');
    }
    showToast('🖼️ Imagem de fundo definida!');
  };
  reader.readAsDataURL(file);
}

function toggleZenImageSize() {
  if (elements.zenBackgroundDisplay) {
    elements.zenBackgroundDisplay.classList.toggle('expanded');
  }
}

function toggleZenBreathing() {
  if (elements.zenBreathingOrb) {
    elements.zenBreathingOrb.classList.toggle('active');
  }
}

function updateRelationshipTimer() {
  if (!gameState || !gameState.relationshipStart || !elements.relationshipTimer) return;
  
  const start = new Date(gameState.relationshipStart);
  const now = new Date();
  
  if (start > now) {
    elements.relationshipTimer.textContent = "A data é no futuro!";
    return;
  }

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();
  let hours = now.getHours() - start.getHours();
  let minutes = now.getMinutes() - start.getMinutes();
  let seconds = now.getSeconds() - start.getSeconds();

  if (seconds < 0) { seconds += 60; minutes--; }
  if (minutes < 0) { minutes += 60; hours--; }
  if (hours < 0) { hours += 24; days--; }
  if (days < 0) {
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
    months--;
  }
  if (months < 0) { months += 12; years--; }

  const parts = [];
  if (years > 0) parts.push(`${years} ano${years !== 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} m${months !== 1 ? 'eses' : 'ês'}`);
  if (days > 0) parts.push(`${days} dia${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hora${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minuto${minutes !== 1 ? 's' : ''}`);
  parts.push(`${seconds} segundo${seconds !== 1 ? 's' : ''}`);

  let text = parts.join(', ');
  const lastComma = text.lastIndexOf(', ');
  if (lastComma !== -1) {
    text = text.substring(0, lastComma) + ' e ' + text.substring(lastComma + 2);
  }
  
  elements.relationshipTimer.textContent = text;
  if (elements.zenTimer) elements.zenTimer.textContent = text;
}

function openEditProfile() {
  if (!gameState) return;
  elements.editName.value = gameState.name;
  elements.editRace.value = gameState.race;
  
  // Populate titles
  elements.editTitle.innerHTML = '<option value="Viajante">Viajante (Padrão)</option>';
  ACHIEVEMENTS.forEach(ach => {
    if (gameState.achievements.includes(ach.id) && ach.titleReward) {
      const option = document.createElement('option');
      option.value = ach.titleReward;
      option.textContent = ach.titleReward;
      elements.editTitle.appendChild(option);
    }
  });
  elements.editTitle.value = gameState.title || 'Viajante';
  elements.editAura.value = gameState.auraColor;
  elements.editProfileModal.classList.add('active');
}

function closeEditProfile() {
  elements.editProfileModal.classList.remove('active');
  updateUI(); // Reverte alterações do preview se cancelar
}

async function saveProfile() {
  const name = elements.editName.value.trim();
  const race = elements.editRace.value;
  const title = elements.editTitle.value;
  const auraColor = elements.editAura ? elements.editAura.value : gameState.auraColor;

  if (!name) {
    showToast('⚠️ O nome não pode ficar vazio!');
    return;
  }

  gameState.name = name;
  gameState.race = race;
  gameState.title = title;
  gameState.auraColor = auraColor;

  await saveGame();
  updateUI();
  closeEditProfile();
  showToast('✅ Perfil atualizado com sucesso!');
}

async function claimDailyReward() {
  try {
    elements.claimBtn.disabled = true;
    elements.claimBtn.textContent = '🎁 Reivindicando...';
    // Lógica local de recompensa diária
    const now = new Date();
    const lastClaim = gameState.lastClaim ? new Date(gameState.lastClaim) : null;
    let streak = gameState.streak || 0;
    let leveledUp = false;
    let xpReward = 25;
    let pointsReward = 1;
    // Se for o mesmo dia, não pode reivindicar
    if (lastClaim && lastClaim.toDateString() === now.toDateString()) {
      throw new Error('Você já reivindicou a recompensa diária hoje!');
    }
    // Verifica se é o dia seguinte para manter streak
    if (lastClaim) {
      const lastClaimDate = new Date(lastClaim.getFullYear(), lastClaim.getMonth(), lastClaim.getDate());
      const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffDays = Math.floor((todayDate - lastClaimDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // É exatamente o dia seguinte - mantém streak
        streak++;
      } else {
        // Passou mais de 1 dia - reseta streak
        streak = 1;
      }
    } else {
      streak = 1;
    }
    gameState.streak = streak;
    gameState.lastClaim = now.toISOString();
    gameState.xp = (gameState.xp || 0) + xpReward;
    updateXpHistory(xpReward);
    gameState.skillPoints = (gameState.skillPoints || 0) + pointsReward;
    // Level up se passar de 100 XP
    if (gameState.xp >= 100) {
      gameState.level = (gameState.level || 1) + 1;
      gameState.xp = gameState.xp - 100;
      leveledUp = true;
    }
    
    // IMPORTANTE: Aguarda o salvamento para garantir persistência
    await saveGame(true); // silent = true
    
    let message = `🎁 +${xpReward} XP e +${pointsReward} pontos!`;
    if (streak > 1) {
      message += ` Sequência: ${streak} dias 🔥`;
    }
    if (leveledUp) {
      message += ` 🎉 Level UP!`;
      playSound('levelUp');
      triggerLevelUpAnimation();
    }
    showToast(message, 5000);
    updateUI();
    if (typeof checkAchievements === 'function') checkAchievements();
  } catch (error) {
    showToast(`❌ ${error.message}`);
  } finally {
    elements.claimBtn.disabled = false;
    elements.claimBtn.textContent = '🎁 Reivindicar Recompensa Diária';
  }
}

function checkAchievements() {
  if (!gameState) return;
  
  let newAchievements = 0;
  ACHIEVEMENTS.forEach(achievement => {
    if (!gameState.achievements.includes(achievement.id) && achievement.condition(gameState)) {
      gameState.achievements.push(achievement.id);
      newAchievements++;
      showToast(`🏆 Conquista desbloqueada: ${achievement.name}!`, 4000);
      playSound('achievement');
    }
  });
  
  if (newAchievements > 0) {
    renderAchievements();
    saveGame();
  }
}

function renderAttributes() {
  if (elements.attributesGrid) elements.attributesGrid.innerHTML = '';
  
  const canRespec = (gameState.streak || 0) >= 10;

  ATTRIBUTES.forEach(attr => {
    const value = gameState.attributes[attr.id];
    const cost = getAttributeCost(value);
    const div = document.createElement('div');
    div.className = 'attribute-item';
    div.innerHTML = `
      <div class="attribute-header">
        <div class="attribute-name">
          <span class="attribute-icon">${attr.icon}</span>
          <span>${attr.name}</span>
        </div>
        <div class="attribute-value">${value}</div>
      </div>
      <div class="small" style="opacity: 0.6; margin-bottom: 8px;">${attr.description}</div>
      <div class="attribute-controls">
        <span class="small" style="margin-right:8px; opacity:0.7; font-size:11px">Custo: ${cost}</span>
        <button class="attr-btn" onclick="removeSkillPoint('${attr.id}')" ${value <= 1 || !canRespec ? 'disabled' : ''} title="${!canRespec ? 'Requer 10 dias de sequência' : 'Diminuir'}">−</button>
        <button class="attr-btn" onclick="addSkillPoint('${attr.id}')" ${gameState.skillPoints < cost ? 'disabled' : ''}>+</button>
      </div>
    `;
    if (elements.attributesGrid) elements.attributesGrid.appendChild(div);
  });
}

function renderAttributesChart() {
  if (!elements.attributesChart || !gameState) return;

  const labels = ATTRIBUTES.map(a => `${a.icon} ${a.name}`);
  const data = ATTRIBUTES.map(a => gameState.attributes[a.id]);

  if (attributesChartInstance) {
    attributesChartInstance.destroy();
  }

  attributesChartInstance = new Chart(elements.attributesChart, {
    type: 'polarArea',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)', 'rgba(255, 206, 86, 0.7)', 
          'rgba(75, 192, 192, 0.7)', 'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)',
          'rgba(199, 199, 199, 0.7)', 'rgba(83, 102, 255, 0.7)', 'rgba(40, 159, 64, 0.7)', 'rgba(215, 99, 132, 0.7)'
        ],
        borderWidth: 1,
        borderColor: '#1a1a1a'
      }]
    },
    options: {
      responsive: true,
      scales: { r: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { display: false, backdropColor: 'transparent' } } },
      plugins: {
        legend: { position: 'bottom', labels: { color: '#ccc', boxWidth: 10, font: { size: 10 } } }
      }
    }
  });
}

function renderAchievements() {
  if (elements.achievementsList) elements.achievementsList.innerHTML = '';
  
  ACHIEVEMENTS.forEach(achievement => {
    const unlocked = gameState.achievements.includes(achievement.id);
    
    // Lógica para ocultar conquistas secretas
    const displayName = (achievement.secret && !unlocked) ? 'Conquista Secreta' : achievement.name;
    const displayIcon = (achievement.secret && !unlocked) ? '🔒' : achievement.icon;
    
    const div = document.createElement('div');
    div.className = `achievement-item ${unlocked ? '' : 'locked'}`;
    div.style.cursor = unlocked ? 'pointer' : 'default';
    div.innerHTML = `
      <span class="achievement-icon">${displayIcon}</span>
      <div style="flex: 1;">
        <div style="font-weight: 600;">${displayName}</div>
        <div class="small" style="opacity: 0.7;">${unlocked ? '✨ Clique para detalhes' : '???'}</div>
      </div>
    `;
    if (unlocked) {
      div.onclick = () => showAchievementDetails(achievement.id);
    }
    if (elements.achievementsList) elements.achievementsList.appendChild(div);
  });
}

function renderVisualBadges() {
  if (!elements.heroVisualBadges || !gameState) return;
  
  elements.heroVisualBadges.innerHTML = '';
  
  gameState.achievements.forEach(achId => {
    const achievement = ACHIEVEMENTS.find(a => a.id === achId);
    if (achievement) {
      const badge = document.createElement('div');
      badge.className = 'visual-badge';
      badge.textContent = achievement.icon;
      badge.style.cursor = 'pointer';
      badge.title = `${achievement.name} - Clique para ver detalhes`;
      badge.onclick = () => showAchievementDetails(achId);
      
      elements.heroVisualBadges.appendChild(badge);
    }
  });
}

// --- Sistema de Trabalho (Work) ---

const JOB_TYPES = {
  pizzaria: {
    label: 'Pizzaria',
    inputLabel: 'Quantidade de Massas',
    configLabel: 'Valor por Massa (R$)',
    unit: 'massas',
    icon: '🍕'
  },
  vendedor: {
    label: 'Vendedor',
    inputLabel: 'Valor da Venda (R$)',
    configLabel: 'Comissão (%)',
    unit: 'vendas',
    icon: '🤝'
  },
  motorista: {
    label: 'Motorista',
    inputLabel: 'Valor da Corrida (R$)',
    configLabel: 'Meta Diária (R$)',
    unit: 'corridas',
    icon: '🚖'
  },
  freelancer: {
    label: 'Freelancer',
    inputLabel: 'Valor do Projeto/Hora (R$)',
    configLabel: 'Valor Hora Estimado (R$)',
    unit: 'projetos',
    icon: '💻'
  }
};

function saveJobSettings() {
  const name = elements.jobNameInput.value.trim();
  const type = elements.jobTypeSelect.value;

  if (!name) {
    showToast('⚠️ Digite o nome da empresa!');
    return;
  }

  if (!gameState.job) gameState.job = {};
  gameState.job.name = name;
  gameState.job.type = type;
  
  // Inicializa config se vazio
  if (!gameState.job.config) gameState.job.config = { rate: 0 };

  saveGame();
  renderWorkTab();
  showToast('💼 Trabalho configurado!');
}

function resetJobSettings() {
  if (confirm('Deseja reconfigurar seu trabalho? O histórico será mantido.')) {
    gameState.job.name = null;
    saveGame();
    renderWorkTab();
  }
}

function renderWorkTab() {
  if (!gameState.job || !gameState.job.name) {
    // Modo Configuração
    if (elements.workSetupSection) elements.workSetupSection.classList.remove('hidden');
    if (elements.workDashboardSection) elements.workDashboardSection.classList.add('hidden');
  } else {
    // Modo Dashboard
    if (elements.workSetupSection) elements.workSetupSection.classList.add('hidden');
    if (elements.workDashboardSection) elements.workDashboardSection.classList.remove('hidden');
    
    if (elements.workTitleDisplay) elements.workTitleDisplay.textContent = `💼 ${gameState.job.name}`;
    
    renderWorkSingularity();
    renderWorkHistory();
    renderWorkChart();
  }
}

// Estado do modo de entrada (Produção ou Horas)
window.workEntryMode = 'production';
window.setWorkEntryMode = function(mode) {
  window.workEntryMode = mode;
  renderWorkSingularity();
};

function renderWorkSingularity() {
  if (!elements.workSingularityContainer) return;
  
  const type = gameState.job.type || 'pizzaria';
  const def = JOB_TYPES[type];
  const configValue = gameState.job.config ? (gameState.job.config.rate || 0) : 0;
  const today = new Date().toISOString().split('T')[0];
  
  // Determina o modo atual
  const entryMode = window.workEntryMode || 'production';
  const isTimeMode = entryMode === 'time';
  
  let currentWeek = Math.ceil(new Date().getDate() / 7);
  if (currentWeek > 4) currentWeek = 4; // Limita a 4 semanas conforme solicitado

  elements.workSingularityContainer.innerHTML = `
    <div class="control-panel">
      <div class="panel-header">
        <div style="font-weight: 700; font-size: 1.1rem; display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 1.4rem;">${def.icon}</span> 
          <span>Registro de ${def.label}</span>
        </div>
        
        <!-- Configuração Rápida (Compacta) -->
        <div style="display: flex; gap: 5px; align-items: center; background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 8px;">
          <label style="font-size: 10px; opacity: 0.7; margin: 0;">${def.configLabel}:</label>
          <input type="number" id="workConfigInput" value="${configValue}" placeholder="0" style="padding: 2px 5px; width: 60px; text-align: right; border: none; background: transparent; color: var(--accent); font-weight: bold;">
          <button class="ghost" onclick="saveWorkConfig()" style="font-size: 10px; padding: 2px 6px; height: auto; min-height: 0;">💾</button>
        </div>
      </div>

      <!-- Seletor de Tipo de Registro -->
      <div style="display:flex; background:rgba(255,255,255,0.05); padding:4px; border-radius:8px; margin-bottom:15px; gap: 5px;">
        <button class="btn ghost" onclick="setWorkEntryMode('production')" style="flex:1; font-size:12px; ${!isTimeMode ? 'background:var(--accent); color:#000; font-weight:bold;' : 'opacity:0.7;'}">${def.label}</button>
        <button class="btn ghost" onclick="setWorkEntryMode('time')" style="flex:1; font-size:12px; ${isTimeMode ? 'background:var(--accent); color:#000; font-weight:bold;' : 'opacity:0.7;'}">⏱️ Horas</button>
      </div>

      <!-- Formulário de Registro -->
      <div class="form-row" style="margin-bottom: 15px;">
        <div style="flex: 1;">
          <label style="font-size: 11px; opacity: 0.7; margin-bottom: 4px; display: block;">Data</label>
          <input type="date" id="workDateInput" value="${today}" onchange="autoSelectWeek()">
        </div>
        <div style="flex: 1;">
          <label style="font-size: 11px; opacity: 0.7; margin-bottom: 4px; display: block;">Semana</label>
          <select id="workWeekInput">
            <option value="1" ${currentWeek === 1 ? 'selected' : ''}>Semana 1</option>
            <option value="2" ${currentWeek === 2 ? 'selected' : ''}>Semana 2</option>
            <option value="3" ${currentWeek === 3 ? 'selected' : ''}>Semana 3</option>
            <option value="4" ${currentWeek === 4 ? 'selected' : ''}>Semana 4</option>
          </select>
        </div>
      </div>
      <div class="form-row" style="margin-bottom: 15px;">
        <div style="flex: 1;">
          <label style="font-size: 11px; opacity: 0.7; margin-bottom: 4px; display: block;">${isTimeMode ? 'Horas Trabalhadas' : def.inputLabel}</label>
          <input type="number" id="workInput" placeholder="${isTimeMode ? 'Ex: 8.5' : '0'}" style="font-size: 1.2rem; font-weight: bold;">
        </div>
      </div>
      <div style="margin-bottom: 15px; display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.03); padding: 8px; border-radius: 8px;">
        <input type="checkbox" id="workUnpaidInput" style="width: auto; cursor: pointer;">
        <label for="workUnpaidInput" style="margin: 0; font-size: 12px; cursor: pointer; opacity: 0.8;">Não remunerado (apenas registro)</label>
      </div>
      <button class="btn" onclick="addWorkRecord()" style="width: 100%; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">✅ Registrar Produção</button>
    </div>
  `;
}

// Função para selecionar a semana automaticamente baseada na data
window.autoSelectWeek = function() {
  const dateInput = document.getElementById('workDateInput');
  const weekSelect = document.getElementById('workWeekInput');
  
  if (!dateInput || !weekSelect || !dateInput.value) return;

  // Pega o dia da data selecionada (YYYY-MM-DD)
  const day = parseInt(dateInput.value.split('-')[2]);
  
  let week = Math.ceil(day / 7);
  // Garante que dias 22 a 31 fiquem na semana 4
  if (week > 4) week = 4;

  weekSelect.value = week;
};

window.saveWorkConfig = function() {
  const input = document.getElementById('workConfigInput');
  if (input) {
    const val = parseFloat(input.value);
    if (!gameState.job.config) gameState.job.config = {};
    gameState.job.config.rate = isNaN(val) ? 0 : val;
    saveGame(true);
    showToast('✅ Configuração salva!');
  }
};

window.addWorkRecord = function() {
  const input = document.getElementById('workInput');
  const dateInput = document.getElementById('workDateInput');
  const weekInput = document.getElementById('workWeekInput');
  const unpaidInput = document.getElementById('workUnpaidInput');
  if (!input) return;
  
  const val = parseFloat(input.value);
  if (isNaN(val) || val <= 0) {
    showToast('⚠️ Valor inválido!');
    return;
  }

  const entryMode = window.workEntryMode || 'production';
  const type = entryMode === 'time' ? 'time_tracking' : gameState.job.type;
  const rate = gameState.job.config.rate || 0;
  let financialValue = 0;
  let desc = '';
  const isUnpaid = unpaidInput ? unpaidInput.checked : false;
  const week = weekInput ? weekInput.value : null;

  // Lógica de Singularidade
  if (type === 'time_tracking') {
    // Se for freelancer, calcula valor por hora. Se não, é apenas registro de tempo (0 financeiro)
    if (gameState.job.type === 'freelancer') {
        financialValue = val * rate;
        desc = `Freelance: ${val}h`;
    } else {
        desc = `Jornada: ${val}h`;
    }
  } else if (type === 'pizzaria') {
    financialValue = val * rate;
    desc = `Produção: ${val} massas`;
  } else if (type === 'vendedor') {
    financialValue = val * (rate / 100);
    desc = `Comissão s/ venda de R$ ${val}`;
  } else if (type === 'motorista') {
    financialValue = val;
    desc = `Corrida`;
  } else if (type === 'freelancer') {
    financialValue = val;
    desc = `Projeto/Hora`;
  }

  // Salvar no Log de Trabalho
  if (!gameState.workLog) gameState.workLog = [];
  
  // Usa a data do input ou hoje como fallback
  const recordDate = dateInput && dateInput.value ? dateInput.value : new Date().toISOString().split('T')[0];
  
  // Se for não remunerado, o valor financeiro registrado é 0 para não afetar gráficos de ganhos
  const loggedFinancialValue = isUnpaid ? 0 : financialValue;

  gameState.workLog.push({
    date: recordDate,
    timestamp: Date.now(),
    inputVal: val,
    financialVal: loggedFinancialValue,
    type: type,
    duration: type === 'time_tracking' ? val * 3600000 : 0, // Converte horas para ms se for tempo
    isUnpaid: isUnpaid,
    week: week
  });

  // Adicionar ao Financeiro (se gerou valor)
  if (loggedFinancialValue > 0) {
    if (!gameState.finances) gameState.finances = [];
    gameState.finances.push({
      id: Date.now(),
      desc: `${gameState.job.name} - ${desc}`,
      value: loggedFinancialValue,
      type: 'income',
      category: 'Extra', // Poderia ser Salário, mas Extra é mais seguro para variáveis
      date: new Date().toISOString()
    });
  }

  input.value = '';
  if (unpaidInput) unpaidInput.checked = false;
  saveGame();
  renderWorkHistory();
  renderWorkChart();
  showToast(`✅ Registrado! ${loggedFinancialValue > 0 ? '+ R$ ' + loggedFinancialValue.toFixed(2) : '(Não remunerado)'}`);
}

// Função para finalizar sessão de tempo (Cronômetro)
window.finishWorkSession = function(startTime) {
  if (!gameState) return;
  
  const now = Date.now();
  let duration = now - startTime;
  
  // Ignorar registros muito curtos (< 1 minuto) para evitar cliques acidentais
  if (duration < 60000) {
    showToast('⚠️ Trabalho muito curto para registrar (mínimo 1 min).');
    return;
  }

  // Limite máximo de 48 horas
  const maxDuration = 48 * 60 * 60 * 1000;
  if (duration > maxDuration) {
    duration = maxDuration;
    showToast('⚠️ Sessão ajustada para o limite de 48 horas.');
  }

  const hours = duration / 3600000;
  const type = gameState.job.type || 'pizzaria';
  let financialValue = 0;
  
  // Se for Freelancer, calcula valor por hora baseado na configuração
  if (type === 'freelancer') {
    const rate = gameState.job.config.rate || 0;
    financialValue = hours * rate;
  }

  // Adicionar ao Log
  if (!gameState.workLog) gameState.workLog = [];
  
  gameState.workLog.push({
    date: new Date().toISOString().split('T')[0],
    timestamp: now,
    inputVal: hours, // Armazena horas como valor de entrada
    financialVal: financialValue,
    type: 'time_tracking', // Tipo especial para logs de tempo
    duration: duration
  });

  // Adicionar ao Financeiro (apenas se gerou valor financeiro)
  if (financialValue > 0) {
    if (!gameState.finances) gameState.finances = [];
    gameState.finances.push({
      id: Date.now(),
      desc: `${gameState.job.name} (Freelancer)`,
      value: financialValue,
      type: 'income',
      category: 'Salário',
      date: new Date().toISOString()
    });
  }

  saveGame();
  renderWorkHistory();
  renderWorkChart();
  
  const h = Math.floor(duration / 3600000);
  const m = Math.floor((duration % 3600000) / 60000);
  showToast(`✅ Sessão registrada: ${h}h ${m}m`);
};

function renderWorkHistory() {
  if (!elements.workTimeHistoryList || !elements.workProductionHistoryList) return;
  
  // Pega os últimos 50 registros para não pesar
  const log = (gameState.workLog || []).slice(-50);

  // Separar logs
  const timeLogs = log.filter(i => i.type === 'time_tracking');
  const prodLogs = log.filter(i => i.type !== 'time_tracking');

  // Renderizar Lista de Ponto (Agrupada por Data)
  const renderList = (items, container, emptyMsg) => {
    container.innerHTML = '';
    if (items.length === 0) {
      container.innerHTML = `<div class="small" style="opacity:0.5; text-align: center; padding: 10px;">${emptyMsg}</div>`;
      return;
    }

    const groups = {};
    items.forEach(item => {
      if (!groups[item.date]) groups[item.date] = [];
      groups[item.date].push(item);
    });

    const sortedDates = Object.keys(groups).sort().reverse();

    sortedDates.forEach(dateKey => {
      const [y, m, d] = dateKey.split('-');
      const dateObj = new Date(y, m - 1, d);
      const dateStr = dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
      const capitalizedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

      // Calcular total do dia
      let dailyTotalMs = 0;
      groups[dateKey].forEach(item => {
         dailyTotalMs += item.duration || (item.inputVal * 3600000);
      });
      const totalH = Math.floor(dailyTotalMs / 3600000);
      const totalM = Math.floor((dailyTotalMs % 3600000) / 60000);

      const groupDiv = document.createElement('div');
      groupDiv.style.marginBottom = '15px';
      
      let groupHtml = `
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 700; color: var(--accent); margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.1); text-transform: capitalize;">
          <span>${capitalizedDate}</span>
          <span style="font-size: 11px; opacity: 0.9; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 10px;">Total: ${totalH}h ${totalM}m</span>
        </div>`;
      
      groups[dateKey].slice().reverse().forEach(item => {
        let text = '';
        let icon = '📄';
        const itemType = item.type || gameState.job.type || 'pizzaria';

        if (itemType === 'time_tracking') {
           const duration = item.duration || (item.inputVal * 3600000);
           const h = Math.floor(duration / 3600000);
           const m = Math.floor((duration % 3600000) / 60000);
           text = `Jornada: ${h}h ${m}m`;
           icon = '⏱️';
        } else if (itemType === 'pizzaria') {
           text = `${item.inputVal} massas`;
           icon = '🍕';
        } else if (itemType === 'vendedor') {
           text = `Venda: R$ ${item.inputVal}`;
           icon = '🤝';
        } else if (itemType === 'motorista') {
           text = `Corrida: R$ ${item.inputVal}`;
           icon = '🚖';
        } else {
           text = `Registro: ${item.inputVal}`;
        }

        let moneyDisplay = '';
        if (item.isUnpaid) {
          moneyDisplay = '<span style="opacity:0.6; font-size:11px; font-style:italic;">Não remunerado</span>';
        } else {
          moneyDisplay = item.financialVal > 0 ? '+ R$ ' + item.financialVal.toFixed(2) : '';
        }

        groupHtml += `
          <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px; margin-bottom: 6px; font-size: 13px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 16px;">${icon}</span>
              <span>${text}</span>
            </div>
            <div style="font-weight: 600; color: var(--success);">${moneyDisplay}</div>
          </div>
        `;
      });

      groupDiv.innerHTML = groupHtml;
      container.appendChild(groupDiv);
    });
  };

  // Renderizar Lista de Produção (Agrupada por Semana)
  const renderProductionList = (items, container, emptyMsg) => {
    container.innerHTML = '';
    if (items.length === 0) {
      container.innerHTML = `<div class="small" style="opacity:0.5; text-align: center; padding: 10px;">${emptyMsg}</div>`;
      return;
    }

    const groups = {};
    items.forEach(item => {
      // Agrupar por Semana se existir, senão joga em "Outros"
      const key = item.week ? `Semana ${item.week}` : 'Outros';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    // Ordenar chaves: Semana 5 -> Semana 1 -> Outros
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === 'Outros') return 1;
      if (b === 'Outros') return -1;
      return b.localeCompare(a);
    });

    // Helper para toggle (expandir/recolher)
    if (!window.toggleWeekDetails) {
      window.toggleWeekDetails = function(id) {
        const el = document.getElementById(id);
        if (el) {
           const isHidden = el.style.display === 'none';
           el.style.display = isHidden ? 'block' : 'none';
           const arrow = document.getElementById(`arrow-${id}`);
           if (arrow) arrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
        }
      };
    }

    sortedKeys.forEach((key, index) => {
      const groupItems = groups[key];
      // Ordenar itens dentro da semana por data (mais recente primeiro)
      groupItems.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Calcular totais da semana
      let totalQty = 0;
      let paidQty = 0;
      let unpaidQty = 0;
      
      groupItems.forEach(i => {
        const val = i.inputVal || 0;
        totalQty += val;
        if (i.isUnpaid) unpaidQty += val;
        else paidQty += val;
      });

      const type = gameState.job.type || 'pizzaria';
      const def = JOB_TYPES[type];
      const unit = def ? def.unit : 'unidades';

      const groupDiv = document.createElement('div');
      groupDiv.style.marginBottom = '10px';
      groupDiv.style.background = 'rgba(255,255,255,0.03)';
      groupDiv.style.borderRadius = '8px';
      groupDiv.style.overflow = 'hidden';
      
      const detailsId = `week-details-${index}`;
      
      // Cabeçalho Clicável
      let headerHtml = `
        <div onclick="toggleWeekDetails('${detailsId}')" style="padding: 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05);">
          <div>
            <div style="font-weight: 700; color: var(--accent); font-size: 13px;">${key}</div>
            <div style="font-size: 11px; opacity: 0.7;">Total: ${paidQty} ${unit}</div>
          </div>
          <div style="font-size: 12px; opacity: 0.5; transition: transform 0.3s;" id="arrow-${detailsId}">▼</div>
        </div>
      `;

      // Área de Detalhes (Oculta por padrão)
      let detailsHtml = `<div id="${detailsId}" style="display: none; padding: 10px; border-top: 1px solid rgba(255,255,255,0.05);">`;
      
      // Resumo da Semana
      detailsHtml += `
        <div style="margin-bottom: 10px; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 6px; font-size: 12px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span>Remunerado:</span>
            <span style="color: var(--success); font-weight:bold;">${paidQty} ${unit}</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>Não remunerado:</span>
            <span style="opacity:0.7;">${unpaidQty} ${unit}</span>
          </div>
        </div>
      `;

      // Lista de Itens
      groupItems.forEach(item => {
        let text = '';
        let icon = '📄';
        const itemType = item.type || gameState.job.type || 'pizzaria';
        const dateStr = new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

        if (itemType === 'pizzaria') {
           text = `Total: ${item.inputVal} massas`;
           icon = '🍕';
        } else if (itemType === 'vendedor') {
           text = `Venda: R$ ${item.inputVal}`;
           icon = '🤝';
        } else if (itemType === 'motorista') {
           text = `Corrida: R$ ${item.inputVal}`;
           icon = '🚖';
        } else {
           text = `Registro: ${item.inputVal}`;
        }

        let moneyDisplay = item.isUnpaid 
          ? '<span style="opacity:0.6; font-size:11px; font-style:italic;">Não remunerado</span>' 
          : (item.financialVal > 0 ? '+ R$ ' + item.financialVal.toFixed(2) : '');

        detailsHtml += `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 12px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 10px; opacity: 0.5; font-family: monospace; min-width: 35px;">${dateStr}</span>
              <span>${text}</span>
            </div>
            <div style="font-weight: 600; color: var(--success);">${moneyDisplay}</div>
          </div>
        `;
      });
      
      detailsHtml += `</div>`; // Fecha div de detalhes

      groupDiv.innerHTML = headerHtml + detailsHtml;
      container.appendChild(groupDiv);
    });
  };

  // Renderizar as duas listas
  renderList(timeLogs, elements.workTimeHistoryList, 'Sem registros de ponto.');
  renderProductionList(prodLogs, elements.workProductionHistoryList, 'Sem registros de produção.');
}

function renderWorkChart() {
  if (!elements.workChart) return;
  
  const log = gameState.workLog || [];
  
  // Verifica se há registros de tempo (prioridade para o gráfico de tempo se houver)
  const hasTimeLogs = log.some(i => i.type === 'time_tracking');

  if (workChartInstance) {
    workChartInstance.destroy();
  }

  if (hasTimeLogs) {
    // Gráfico de Pizza: Distribuição por Dia da Semana
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const distribution = new Array(7).fill(0);

    log.forEach(item => {
      if (item.type === 'time_tracking') {
        let date;
        if (item.timestamp) {
          date = new Date(item.timestamp);
        } else {
          // Fallback seguro para data local
          const [y, m, d] = item.date.split('-').map(Number);
          date = new Date(y, m - 1, d);
        }
        
        const dayIndex = date.getDay();
        const durationMs = item.duration || (item.inputVal * 3600000);
        distribution[dayIndex] += durationMs;
      }
    });

    // Converter ms para horas
    const dataHours = distribution.map(ms => parseFloat((ms / 3600000).toFixed(1)));

    workChartInstance = new Chart(elements.workChart, {
      type: 'pie',
      data: {
        labels: weekDays,
        datasets: [{
          data: dataHours,
          backgroundColor: [
            '#ff6384', '#36a2eb', '#ffcd56', '#4bc0c0', '#9966ff', '#ff9f40', '#c9cbcf'
          ],
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.1)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            position: 'right', 
            labels: { color: '#ccc', boxWidth: 12, font: { size: 11 } } 
          },
          title: {
            display: true,
            text: 'Horas por Dia da Semana',
            color: 'rgba(255,255,255,0.8)',
            font: { size: 13 },
            padding: { bottom: 10 }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return ` ${context.label}: ${context.parsed}h`;
              }
            }
          }
        }
      }
    });

  } else {
    // Fallback: Gráfico de Barras (Financeiro) para quem só usa produção
    const days = {};
    
    log.forEach(item => {
      if (!days[item.date]) days[item.date] = 0;
      days[item.date] += item.financialVal;
    });

    const labels = Object.keys(days).sort().slice(-7);
    const data = labels.map(d => days[d]);
    
    const formattedLabels = labels.map(d => {
      const parts = d.split('-');
      return `${parts[2]}/${parts[1]}`;
    });

    workChartInstance = new Chart(elements.workChart, {
      type: 'bar',
      data: {
        labels: formattedLabels,
        datasets: [{
          label: 'Ganhos (R$)',
          data: data,
          backgroundColor: '#4ade80',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#ccc' } },
          x: { grid: { display: false }, ticks: { color: '#ccc' } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }
}

function renderInventory() {
  if (elements.inventoryList) elements.inventoryList.innerHTML = '';
  const items = gameState.inventory || [];
  if (elements.inventoryCount) elements.inventoryCount.textContent = `${items.length} itens`;

  if (items.length === 0) {
    elements.inventoryList.innerHTML = '<div class="small" style="text-align:center; opacity:0.5; padding: 10px;">Mochila vazia</div>';
    return;
  }

  items.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'inventory-item';
    div.innerHTML = `
      <span>${item.name}</span>
      <button onclick="removeItem(${index})" title="Remover">🗑️</button>
    `;
    if (elements.inventoryList) elements.inventoryList.appendChild(div);
  });
}

function renderDailyTasks() {
  const tasks = gameState.dailyTasks || [];

  // Barra de Progresso Circular (Injeção Dinâmica)
  if (elements.taskList && !document.getElementById('taskProgressContainer')) {
    const container = document.createElement('div');
    container.id = 'taskProgressContainer';
    container.style.cssText = 'display: flex; align-items: center; gap: 15px; margin-bottom: 15px; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);';
    elements.taskList.parentNode.insertBefore(container, elements.taskList);
  }

  const pContainer = document.getElementById('taskProgressContainer');
  if (pContainer) {
    if (tasks.length === 0) {
      pContainer.style.display = 'none';
    } else {
      pContainer.style.display = 'flex';
      const total = tasks.length;
      const completed = tasks.filter(t => t.completed).length;
      const percent = (completed / total) * 100;
      const color = percent === 100 ? '#2ecc71' : 'var(--accent, #ffdd57)';
      
      pContainer.innerHTML = `
        <div style="position: relative; width: 60px; height: 60px; border-radius: 50%; background: conic-gradient(${color} ${percent}%, rgba(255,255,255,0.1) 0); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
          <div style="width: 48px; height: 48px; background: #1a1a1a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; color: ${color};">
            ${Math.round(percent)}%
          </div>
        </div>
        <div style="flex: 1;">
          <div style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">Metas de Hoje</div>
          <div style="font-size: 13px; opacity: 0.7;">${completed}/${total} completas</div>
          <div style="font-size: 11px; opacity: 0.5; margin-top: 4px;">${percent === 100 ? '🎉 Tudo pronto!' : 'Continue focado!'}</div>
        </div>
      `;
    }
  }

  if (elements.taskList) elements.taskList.innerHTML = '';

  if (tasks.length === 0) {
    elements.taskList.innerHTML = '<div class="small" style="text-align:center; opacity:0.5; padding: 10px;">Nenhuma tarefa definida</div>';
    return;
  }

  tasks.forEach(task => {
    const div = document.createElement('div');
    div.className = `task-item ${task.completed ? 'completed' : ''}`;
    div.dataset.id = task.id; // Identificador para animação
    
    const span = document.createElement('span');
    span.style.cssText = 'flex:1; word-break: break-word; line-height: 1.4; padding-right: 10px;';
    span.textContent = `${task.completed ? '✅' : '⬜'} ${task.text}`;
    span.onclick = () => toggleTask(task.id);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'ghost';
    deleteBtn.style.cssText = 'padding:4px 8px; font-size:10px; flex-shrink:0; width: auto;';
    deleteBtn.title = 'Excluir';
    deleteBtn.textContent = '❌';
    deleteBtn.onclick = (e) => removeTask(task.id, e);
    
    div.appendChild(span);
    div.appendChild(deleteBtn);
    if (elements.taskList) elements.taskList.appendChild(div);
  });
}

function renderXpChart() {
  if (!elements.xpChart) return;
  
  // Preparar dados dos últimos 7 dias
  const labels = [];
  const data = [];
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];
    const dayName = days[d.getDay()];
    
    labels.push(dayName);
    let val = (gameState.xpHistory && gameState.xpHistory[dateKey]) || 0;
    if (val < 0) val = 0; // Visualmente corrige dias passados negativos
    data.push(val);
  }

  if (xpChartInstance) {
    xpChartInstance.destroy();
  }

  xpChartInstance = new Chart(elements.xpChart, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'XP (Saldo Diário)',
        data: data,
        backgroundColor: '#ffdd57',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#ccc' } },
        x: { grid: { display: false }, ticks: { color: '#ccc' } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function setTabBadge(tabId, show) {
  const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
  if (!tabBtn) return;
  
  let badge = tabBtn.querySelector('.tab-badge');
  
  if (show) {
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'tab-badge';
      badge.style.cssText = 'position: absolute; top: 5px; right: 5px; width: 8px; height: 8px; background-color: #ff4757; border-radius: 50%; box-shadow: 0 0 0 2px #2c2c2c; pointer-events: none;';
      tabBtn.style.position = 'relative';
      tabBtn.appendChild(badge);
    }
  } else {
    if (badge) badge.remove();
  }
}

function updateUI() {
  if (!gameState) return;
  
  // Atualizar preview do personagem
  if (elements.previewName) elements.previewName.textContent = gameState.name;
  if (elements.previewTitle) elements.previewTitle.textContent = gameState.title || 'Viajante';
  if (elements.previewRace) elements.previewRace.textContent = gameState.race;
  if (elements.previewUsername) elements.previewUsername.textContent = `@${gameState.username}`;
  if (elements.level) elements.level.textContent = gameState.level;
  if (elements.orbLevel) elements.orbLevel.textContent = gameState.level;
  // xpToNextLevel fixo em 100 para lógica local
  const xpToNextLevel = 100;
  if (elements.xp) elements.xp.textContent = `${gameState.xp} / ${xpToNextLevel}`;
  if (elements.skillPoints) elements.skillPoints.textContent = gameState.skillPoints;

  // Atualizar barra de progresso
  const xpPercent = (gameState.xp / xpToNextLevel) * 100;
  if (elements.xpProgress) elements.xpProgress.style.width = `${xpPercent}%`;
  
  // Atualizar segunda barra de XP (na seção de missões)
  const xpProgressMissions = document.getElementById('xpProgressMissions');
  if (xpProgressMissions) xpProgressMissions.style.width = `${xpPercent}%`;

  // Atualizar última reivindicação e streak
  if (gameState.lastClaim) {
    const date = new Date(gameState.lastClaim);
    if (elements.lastClaim) elements.lastClaim.textContent = date.toLocaleDateString('pt-BR');
  } else {
    if (elements.lastClaim) elements.lastClaim.textContent = 'Nunca';
  }
  if (elements.streakDisplay) elements.streakDisplay.textContent = gameState.streak || 0;
  
  // Atualizar cores
  const auraColor = gameState.auraColor || '#ffdd57';
  if (elements.orb) elements.orb.style.background = `radial-gradient(circle at 30% 20%, ${auraColor}40, transparent 45%)`;
  if (elements.ring) elements.ring.style.background = `conic-gradient(from 0deg, ${auraColor}, transparent, ${auraColor})`;
  if (elements.avatar) elements.avatar.style.borderColor = auraColor;
  
  // Atualizar cor das estrelas do universo
  if (typeof updateStarColor === 'function') {
    updateStarColor(auraColor);
  }

  // Atualizar Tema da Classe (Emoji e Imagem de Fundo)
  const theme = CLASS_THEMES[gameState.race] || CLASS_THEMES['default'];
  if (elements.avatar) elements.avatar.textContent = theme.emoji;
  
  if (elements.heroCardHeader) {
    elements.heroCardHeader.style.backgroundImage = `url('${theme.image}')`;
    elements.heroCardHeader.style.backgroundSize = 'cover';
    elements.heroCardHeader.style.backgroundPosition = 'center';
  }
  
  // Renderizar atributos e conquistas
  renderAttributes();
  renderAttributesChart();
  renderAchievements();
  renderVisualBadges();
  renderInventory();
  renderGratitudeJournal();
  renderDailyTasks();
  renderXpChart();
  renderFinances();
  renderFinanceChart();
  renderFinancialGoal();
  renderFinanceMonthlyChart();
  renderFinanceGroups();
  renderBills();
  renderWorkTab();
  
  // Atualizar Badges nas Abas
  // 1. Hero: Pontos de habilidade disponíveis
  setTabBadge('hero', gameState.skillPoints > 0);

  // 2. Finance: Contas vencendo hoje
  const now = new Date();
  const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
  const today = localDate.toISOString().split('T')[0];
  const hasBillsDue = (gameState.bills || []).some(b => !b.paid && b.dueDate === today);
  setTabBadge('finance', hasBillsDue);

  // Atualizar UI de Relacionamento
  if (gameState.relationshipStart) {
    if (elements.relationshipSetup) elements.relationshipSetup.classList.add('hidden');
    if (elements.relationshipDisplay) elements.relationshipDisplay.classList.remove('hidden');
    
    if (gameState.relationshipPhoto) {
      if (elements.relationshipPhotoDisplay) elements.relationshipPhotoDisplay.src = gameState.relationshipPhoto;
      if (elements.relationshipPhotoDisplay) elements.relationshipPhotoDisplay.style.display = 'block';
    } else {
      if (elements.relationshipPhotoDisplay) elements.relationshipPhotoDisplay.style.display = 'none';
    }
    
    updateRelationshipTimer();
  } else {
    if (elements.relationshipSetup) elements.relationshipSetup.classList.remove('hidden');
    if (elements.relationshipDisplay) elements.relationshipDisplay.classList.add('hidden');
  }
}

// Event Listeners
if (elements.loginBtn) elements.loginBtn.addEventListener('click', login);
if (elements.registerBtn) elements.registerBtn.addEventListener('click', register);
if (elements.showRegisterBtn) elements.showRegisterBtn.addEventListener('click', showRegisterForm);
if (elements.showLoginBtn) elements.showLoginBtn.addEventListener('click', showLoginForm);
if (elements.logoutBtn) elements.logoutBtn.addEventListener('click', logout);
if (elements.forgotPasswordBtn) elements.forgotPasswordBtn.addEventListener('click', recoverPassword);
if (elements.saveBtn) elements.saveBtn.addEventListener('click', saveGame);
if (elements.exportBtn) elements.exportBtn.addEventListener('click', exportSave);
if (elements.importBtn) elements.importBtn.addEventListener('click', importSave);
if (elements.restoreBackupBtn) elements.restoreBackupBtn.addEventListener('click', restoreBackup);
if (elements.importFile) elements.importFile.addEventListener('change', handleFileSelect);
if (elements.claimBtn) elements.claimBtn.addEventListener('click', claimDailyReward);
if (elements.resetAttrsBtn) elements.resetAttrsBtn.addEventListener('click', resetAttributes);
if (elements.editProfileBtn) elements.editProfileBtn.addEventListener('click', openEditProfile);
if (elements.cancelEditBtn) elements.cancelEditBtn.addEventListener('click', closeEditProfile);
if (elements.saveProfileBtn) elements.saveProfileBtn.addEventListener('click', saveProfile);
if (elements.addItemBtn) elements.addItemBtn.addEventListener('click', addItem);
if (elements.inventoryInput) elements.inventoryInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addItem();
});
if (elements.addTaskBtn) elements.addTaskBtn.addEventListener('click', addDailyTask);
if (elements.taskInput) elements.taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addDailyTask();
});

// Botão de remover todas as tarefas
const clearAllTasksBtn = document.getElementById('clearAllTasksBtn');
if (clearAllTasksBtn) {
  clearAllTasksBtn.addEventListener('click', () => {
    if (!gameState.dailyTasks || gameState.dailyTasks.length === 0) {
      showToast('📭 Não há tarefas para remover!');
      return;
    }
    
    if (confirm(`🗑️ Deseja remover todas as ${gameState.dailyTasks.length} tarefas?`)) {
      gameState.dailyTasks = [];
      saveGame();
      renderDailyTasks(); // Atualiza a lista imediatamente
      updateUI(); // Atualiza toda a interface
      showToast('✅ Todas as tarefas foram removidas!');
    }
  });
}

if (elements.viewTaskHistoryBtn) elements.viewTaskHistoryBtn.addEventListener('click', () => {
  renderTaskHistory();
  elements.taskHistoryModal.classList.add('active');
});
if (elements.addFinanceBtn) elements.addFinanceBtn.addEventListener('click', addTransaction);
if (elements.financeValue) elements.financeValue.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTransaction();
});
if (elements.addBillBtn) elements.addBillBtn.addEventListener('click', addBill);
if (elements.setFinanceGoalBtn) elements.setFinanceGoalBtn.addEventListener('click', setFinancialGoal);
if (elements.cancelFinanceGoalBtn) elements.cancelFinanceGoalBtn.addEventListener('click', cancelFinancialGoal);
if (elements.setRelationshipBtn) elements.setRelationshipBtn.addEventListener('click', setRelationshipDate);
if (elements.resetRelationshipBtn) elements.resetRelationshipBtn.addEventListener('click', resetRelationshipDate);
if (elements.relationshipPhotoDisplay) elements.relationshipPhotoDisplay.addEventListener('click', changeRelationshipPhoto);
if (elements.updateRelationshipPhotoInput) elements.updateRelationshipPhotoInput.addEventListener('change', handlePhotoUpdate);
if (elements.zenModeBtn) elements.zenModeBtn.addEventListener('click', toggleZenMode);
if (elements.exitZenBtn) elements.exitZenBtn.addEventListener('click', toggleZenMode);
if (elements.zenMusicBtn && elements.zenMusicInput) elements.zenMusicBtn.addEventListener('click', () => elements.zenMusicInput.click());
if (elements.zenImageBtn && elements.zenImageInput) elements.zenImageBtn.addEventListener('click', () => elements.zenImageInput.click());
if (elements.zenToggleHudBtn) elements.zenToggleHudBtn.addEventListener('click', toggleZenHud);
if (elements.zenTrackSelect) elements.zenTrackSelect.addEventListener('change', (e) => playZenTrack(parseInt(e.target.value)));
if (elements.simpleFinanceBtn) elements.simpleFinanceBtn.addEventListener('click', () => window.location.href = './financeiro.html');

// Botão de Carga Horária
const cargaHorariaBtn = document.getElementById('cargaHorariaBtn');
if (cargaHorariaBtn) cargaHorariaBtn.addEventListener('click', () => window.location.href = './carga-horaria.html');

// Função para verificar e aplicar atualizações
async function checkForUpdates() {
  const btn = document.getElementById('updateAppBtn');
  const mobileBtn = document.getElementById('mobileUpdateBtn');
  
  try {
    if (btn) { btn.disabled = true; btn.textContent = '⏳'; }
    if (mobileBtn) { mobileBtn.disabled = true; }
    
    showToast('🔍 Forçando atualização completa...');
    
    // 1. Limpa TODOS os caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log('🗑️ Removendo caches:', cacheNames);
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    
    // 2. Desregistra o Service Worker atual
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        console.log('🔄 Atualizando SW:', registration.scope);
        
        // Tenta atualizar
        await registration.update();
        
        // Se há um worker esperando, força ativação
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        
        // Se ainda não funcionou, desregistra completamente
        if (registration.active) {
          await registration.unregister();
          console.log('🗑️ SW desregistrado');
        }
      }
    }
    
    // 3. Limpa localStorage de versão (se houver)
    localStorage.removeItem('app_version');
    
    showToast('✅ Cache limpo! Recarregando em 2s...');
    
    // 4. Recarrega com cache-bust
    setTimeout(() => {
      const url = window.location.origin + window.location.pathname;
      window.location.replace(url + '?nocache=' + Date.now());
    }, 2000);
    
  } catch (error) {
    console.error('Erro ao atualizar:', error);
    showToast('⚠️ Erro! Tentando reload forçado...');
    setTimeout(() => {
      window.location.reload(true);
    }, 1500);
  }
}

// Botão de Atualização do App
const updateAppBtn = document.getElementById('updateAppBtn');
if (updateAppBtn) {
  updateAppBtn.addEventListener('click', checkForUpdates);
}

if (elements.zenMusicInput) elements.zenMusicInput.addEventListener('change', handleZenMusicSelect);
if (elements.zenImageInput) elements.zenImageInput.addEventListener('change', handleZenImageSelect);
if (elements.zenBackgroundDisplay) elements.zenBackgroundDisplay.addEventListener('click', toggleZenImageSize);
if (elements.zenBreathingBtn) elements.zenBreathingBtn.addEventListener('click', toggleZenBreathing);
if (elements.zenModeOverlay) elements.zenModeOverlay.addEventListener('click', (e) => {
  // Se a interface estiver oculta e clicar no overlay, restaura
  if (elements.zenModeOverlay.classList.contains('zen-hud-hidden')) {
    // Apenas se o clique não for nos controles (que já estariam ocultos, mas por segurança)
    if (e.target === elements.zenModeOverlay || e.target === elements.zenBackgroundDisplay) {
       toggleZenHud();
    }
  }
});
if (elements.saveJobBtn) elements.saveJobBtn.addEventListener('click', saveJobSettings);
if (elements.configJobBtn) elements.configJobBtn.addEventListener('click', resetJobSettings);
if (elements.configGroupsBtn) elements.configGroupsBtn.addEventListener('click', openGroupConfig);
if (elements.closeGroupConfigBtn) elements.closeGroupConfigBtn.addEventListener('click', closeGroupConfig);
if (elements.addGroupBtn) elements.addGroupBtn.addEventListener('click', addExpenseGroup);

if (elements.resetAccountBtn) elements.resetAccountBtn.addEventListener('click', resetAccount);

// ========================================
// SISTEMA DE LINGUAGEM NATURAL (NLU) 2.0
// Detecta intenções e extrai dados de forma mais robusta
// ========================================

const OracleNLU = {
  // Mapa de intenções e padrões
  intents: {
    'finance.goal': {
      patterns: [
        /(?:cria|criar|crair|definir|nova|estabelecer|fazer|montar)\s+(?:uma\s+)?meta\s+(?:financeira|de\s+economia|de\s+poupança|de\s+grana)/i,
        /(?:quero|preciso|vamos|bora)\s+(?:juntar|guardar|economizar|fazer|criar|crair|ter)\s+(?:uma\s+)?(?:meta|reserva|poupança)/i,
        /(?:objetivo|alvo)\s+financeiro/i,
        /(?:preciso|quero)\s+de\s+(?:uma\s+)?meta/i
      ],
      extract: () => ({})
    },
    'task.create': {
      patterns: [
        /(?:cria|criar|adiciona|adicionar|nova|novo|faz|fazer|coloca|colocar|preciso|quero|tenho que|vou)\s+(?:uma?\s+)?(?:tarefa|task|missão|lembrete|reminder)?:?\s*(.+)/i,
        /(?:lembra|lembrar|me lembra|lembre-me)\s+(?:de\s+)?(.+)/i,
        /(?:preciso|tenho que|vou|devo)\s+(.+?)(?:\s+(?:amanhã|hoje|depois|mais tarde|às?\s+\d))?/i,
        /(?:não posso esquecer|não esquecer)\s+(?:de\s+)?(.+)/i,
        /(?:agenda|agendar|marcar|marca)\s+(?:uma?\s+)?(.+)/i
      ],
      extract: (text, match) => {
        let title = match[1]?.trim() || text;
        
        // Limpa palavras extras
        title = title
          .replace(/^(?:que\s+)?(?:eu\s+)?(?:preciso|tenho que|devo|vou)\s+/i, '')
          .replace(/^(?:de\s+)?/i, '')
          .replace(/(?:\s+(?:pfv|pf|por favor|please))$/i, '')
          .trim();
        
        // Detecta data/hora
        const dateInfo = OracleNLU.extractDateTime(text);
        
        // Detecta XP baseado no tipo de tarefa
        const xp = OracleNLU.estimateTaskXP(title);
        
        return {
          title: title.charAt(0).toUpperCase() + title.slice(1),
          dueDate: dateInfo.date,
          dueTime: dateInfo.time,
          xpReward: xp
        };
      }
    },
    
    'task.complete': {
      patterns: [
        /(?:completei|fiz|terminei|acabei|concluí|feito|finalizei|pronto)\s+(?:a\s+)?(?:tarefa\s+)?(.+)?/i,
        /(?:tarefa\s+)?(.+?)\s+(?:feita|feito|pronta|pronto|concluída|terminada)/i,
        /(?:pode\s+)?(?:marcar?|marca)\s+(.+?)\s+(?:como\s+)?(?:feita|feito|concluída|pronta)/i
      ],
      extract: (text, match) => ({
        taskName: match[1]?.trim() || null
      })
    },
    
    'finance.expense': {
      patterns: [
        // Padrões que capturam valor e descrição (opcional)
        /(?:gastei|paguei|comprei|perdi|saiu|foi)\s+(?:r?\$?\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:r?\$?\s*)?(?:reais?)?\s*(?:hoje|ontem|amanhã)?\s*(?:em|no|na|com|de|pra|para)?\s*(.+)?/i,
        /(?:coloca|adiciona|registra|bota|põe)\s+(?:uma?\s+)?(?:saída|gasto|despesa)\s+(?:de\s+)?(?:r?\$?\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:em|no|na|com|de)?\s*(.+)?/i,
        /(?:tive\s+(?:um\s+)?(?:gasto|despesa)\s+de)\s+(?:r?\$?\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:em|no|na|com)?\s*(.+)?/i,
        /(?:r?\$?\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais?)?\s+(?:de\s+)?(?:gasto|despesa|saída)\s*(?:em|no|na|com)?\s*(.+)?/i,
        // Novo padrão: apenas a intenção de gastar
        /^(gastei|paguei|comprei|registra[r]?\s+(?:um\s+)?gasto)$/i
      ],
      extract: (text, match) => {
        // Se o match não tem o grupo de captura para o valor (padrão novo)
        if (match.length <= 2 || !match[1] || isNaN(parseFloat(match[1]?.replace(',', '.')))) {
          return { amount: null, description: null, type: 'expense' };
        }

        const amount = parseFloat(match[1].replace(',', '.'));
        let description = match[2]?.trim() || null;
        
        // Limpa descrição removendo $, palavras temporais e preposições extras
        if (description) {
          description = description
            .replace(/^\$\s*/i, '')  // Remove $ no início
            .replace(/^(?:hoje|ontem|amanhã|amanha)\s*/i, '')  // Remove palavras temporais
            .replace(/^(?:o|a|um|uma|no|na|em|com|de|pra|para)\s+/i, '')  // Remove preposições
            .replace(/(?:\s+(?:pfv|pf|por favor))$/i, '')  // Remove "por favor"
            .replace(/\s+/g, ' ')  // Normaliza espaços
            .trim();
        }
        
        // Detecta categoria automaticamente
        const category = OracleNLU.detectFinanceCategory(description || text);
        
        return {
          amount,
          description: description ? description.charAt(0).toUpperCase() + description.slice(1) : null,
          category,
          type: 'expense'
        };
      }
    },
    
    'finance.income': {
      patterns: [
        /(?:recebi|ganhei|entrou|chegou)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais?)?\s*(?:de|do|da|como|por)?\s*(.+)?/i,
        /(?:coloca|adiciona|registra)\s+(?:uma?\s+)?(?:entrada|receita|ganho)\s+(?:de\s+)?(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:de|do|da)?\s*(.+)?/i,
        /(?:meu\s+)?(?:salário|pagamento|freelance)\s+(?:de\s+)?(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i
      ],
      extract: (text, match) => {
        const amount = parseFloat(match[1].replace(',', '.'));
        let description = match[2]?.trim() || null;
        
        if (description) {
          description = description
            .replace(/^(?:o|a|um|uma|do|da|de)\s+/i, '')
            .trim();
        }
        
        return {
          amount,
          description: description ? description.charAt(0).toUpperCase() + description.slice(1) : null,
          type: 'income'
        };
      }
    },
    
    'work.start': {
      patterns: [
        /(?:iniciar?|começar?|start|vou|bora)\s+(?:a\s+)?(?:trabalhar|trabalho|timer|ponto)/i,
        /(?:entrar?|bater?)\s+(?:o\s+)?ponto/i,
        /(?:começando|iniciando)\s+(?:a\s+)?(?:trabalhar|trabalho)/i
      ],
      extract: () => ({})
    },
    
    'work.stop': {
      patterns: [
        /(?:parar?|finalizar?|stop|encerrar?|terminar?|acabar?)\s+(?:de\s+)?(?:trabalhar|trabalho|timer|ponto)/i,
        /(?:terminei|acabei|chega)\s+(?:de\s+)?(?:trabalhar|trabalho|por\s+hoje)/i,
        /(?:sair?|bater?)\s+(?:o\s+)?ponto\s+(?:de\s+)?(?:saída)?/i
      ],
      extract: () => ({})
    },
    
    'status.show': {
      patterns: [
        /(?:qual|como)\s+(?:é|está|tá)\s+(?:meu|o)\s+(?:status|nível|level|xp|progresso)/i,
        /(?:meu|ver|mostra)\s+(?:status|nível|level|xp|progresso|perfil)/i,
        /(?:como\s+)?(?:estou|tô|to)\s+(?:indo|evoluindo|progredindo)/i
      ],
      extract: () => ({})
    },
    
    'finance.summary': {
      patterns: [
        /(?:como|qual)\s+(?:está|estão|tá|tão)\s+(?:minhas?|as?)\s+(?:finanças|financeiro|gastos|despesas|contas)/i,
        /(?:resumo|relatório|balanço)\s+(?:financeiro|das?\s+finanças|dos?\s+gastos)/i,
        /(?:quanto)\s+(?:gastei|tenho|sobrou|falta)/i
      ],
      extract: () => ({})
    },
    
    'task.list': {
      patterns: [
        /(?:quais|minhas?|ver|mostra|lista)\s+(?:são\s+)?(?:as?\s+)?(?:tarefas|tasks|pendências|afazeres)/i,
        /(?:o\s+que\s+)?(?:tenho|preciso)\s+(?:pra\s+)?fazer\s+(?:hoje|amanhã)?/i
      ],
      extract: () => ({})
    },
    
    // NOVOS INTENTS DE UTILIDADE (INTELIGÊNCIA LÓGICA)
    'utility.calc': {
      patterns: [
        /(?:quanto\s+[eé]|calcule|calcula|conta)\s+([\d.,]+)\s*(\+|mais|\-|menos|\*|x|vezes|\/|dividido\s+por)\s*([\d.,]+)/i
      ],
      extract: (text, match) => {
        return {
          n1: parseFloat(match[1].replace(',', '.')),
          op: match[2].toLowerCase(),
          n2: parseFloat(match[3].replace(',', '.'))
        };
      }
    },
    
    'utility.decision': {
      patterns: [
        /(?:escolha|escolhe|decida|decide|qual|o que)\s+(?:você\s+)?(?:prefere|escolhe|sugere)?\s*(?:entre\s+)?(.+?)\s+(?:ou|e)\s+(.+)/i,
        /(?:joga|jogar|lança|lançar)\s+(?:uma\s+)?moeda|cara\s+(?:ou|e)\s+coroa/i,
        /(?:joga|jogar|rola|rolar)\s+(?:um\s+)?dado(?: de (\d+)\s*lados?)?/i
      ],
      extract: (text, match) => {
        if (text.match(/moeda|cara.*coroa/i)) return { type: 'coin' };
        if (text.match(/dado/i)) return { type: 'dice', sides: match[1] || 6 };
        return { type: 'choice', options: [match[1], match[2]] };
      }
    },

    'utility.date': {
      patterns: [
        /(?:que\s+)?(?:horas?|dia|data)\s+(?:são|é|tem)\s*(?:agora|hoje)?/i,
        /(?:em\s+)?que\s+(?:dia|ano|mês)\s+(?:estamos|é\s+hoje)/i
      ],
      extract: () => ({})
    },

    'system.clear': {
      patterns: [
        /(?:limpar?|limpa|apagar?|apaga)\s+(?:o\s+)?(?:chat|conversa|mensagens|histórico)/i
      ],
      extract: () => ({})
    },

    'memory.save': {
      patterns: [
        /(?:lembr[ae]|lembrar|guarda|guardar|anota|anotar|salva|salvar|sab[ei]a?)(?:-se)?(?:\s+que)?\s+(?:eu\s+)?(.+)/i,
        /(?:meu|minha)\s+(.+?)\s+(?:é|são|se\s+chama)\s+(.+)/i
      ],
      extract: (text, match) => {
        const fullText = match[1]?.trim() || text;
        
        // Detecta relacionamentos específicos
        const relationships = {
          namorada: /(?:namoro|namorando|to\s+com|estou\s+com|minha\s+namorada\s+(?:é|se\s+chama)?)\s+(?:a\s+)?(\w+)/i,
          namorado: /(?:namoro|namorando|to\s+com|estou\s+com|meu\s+namorado\s+(?:é|se\s+chama)?)\s+(?:o\s+)?(\w+)/i,
          esposa: /(?:casado\s+com|minha\s+esposa\s+(?:é|se\s+chama)?)\s+(?:a\s+)?(\w+)/i,
          esposo: /(?:casada\s+com|meu\s+(?:esposo|marido)\s+(?:é|se\s+chama)?)\s+(?:o\s+)?(\w+)/i,
          mae: /(?:minha\s+(?:mãe|mae)\s+(?:é|se\s+chama)?)\s+(?:a\s+)?(\w+)/i,
          pai: /(?:meu\s+pai\s+(?:é|se\s+chama)?)\s+(?:o\s+)?(\w+)/i,
          melhorAmigo: /(?:melhor\s+amig[oa]\s+(?:é|se\s+chama)?)\s+(?:o\s+|a\s+)?(\w+)/i,
          pet: /(?:(?:meu|minha)\s+(?:pet|cachorro|gato|animal)\s+(?:é|se\s+chama)?)\s+(\w+)/i,
          aniversario: /(?:(?:meu\s+)?aniversário\s+(?:é\s+)?(?:dia|em)?)\s+(\d{1,2}(?:\s+de\s+\w+|\s*\/\s*\d{1,2})?)/i
        };
        
        for (const [key, pattern] of Object.entries(relationships)) {
          const relMatch = fullText.match(pattern);
          if (relMatch) {
            return {
              type: 'relationship',
              key: key,
              value: relMatch[1].trim(),
              fact: fullText
            };
          }
        }
        
        return { fact: fullText, type: 'general' };
      }
    },
    
    'memory.query': {
      patterns: [
        /(?:com\s+)?quem\s+(?:eu\s+)?(?:namoro|to\s+namorando|estou\s+namorando)/i,
        /(?:qual|quem)\s+(?:é|são)\s+(?:meu|minha|o\s+nome\s+d[ao])\s+(namorad[ao]|espos[ao]|marido|mãe|mae|pai|melhor\s+amig[ao]|pet|cachorro|gato)/i,
        /(?:como\s+)?(?:se\s+)?chama\s+(?:meu|minha)\s+(namorad[ao]|espos[ao]|marido|mãe|mae|pai|melhor\s+amig[ao]|pet|cachorro|gato)/i,
        /(?:quando\s+é\s+)?(?:meu\s+)?aniversário/i,
        /(?:o\s+que\s+)?(?:você\s+)?(?:sabe|lembra)\s+(?:sobre\s+)?(?:mim|de\s+mim|eu)/i
      ],
      extract: (text) => {
        const lower = text.toLowerCase();
        
        // Detecta qual informação está sendo pedida
        if (lower.match(/namor|namorad/)) return { queryType: 'namorada' };
        if (lower.match(/espos[ao]|marido|casad/)) return { queryType: 'esposa' };
        if (lower.match(/mãe|mae/)) return { queryType: 'mae' };
        if (lower.match(/pai/)) return { queryType: 'pai' };
        if (lower.match(/melhor\s+amig/)) return { queryType: 'melhorAmigo' };
        if (lower.match(/pet|cachorro|gato/)) return { queryType: 'pet' };
        if (lower.match(/aniversário|aniversario/)) return { queryType: 'aniversario' };
        if (lower.match(/sabe|lembra.*(?:mim|eu)/)) return { queryType: 'all' };
        
        return { queryType: 'unknown' };
      }
    }
  },
  
  // Detecta a intenção do usuário
  detectIntent(text) {
    const mem = OracleMemory.get();
    const lowerText = text.toLowerCase().trim();

    // Check for aliases first
    if (mem.aliases && mem.aliases[lowerText]) {
        const canonicalCommand = mem.aliases[lowerText];
        console.log(`Oracle: Alias detected! "${text}" -> "${canonicalCommand}"`);
        text = canonicalCommand; // Replace the text with the canonical command
    }

    const cleanText = text.toLowerCase().trim();
    
    for (const [intentName, intent] of Object.entries(this.intents)) {
      for (const pattern of intent.patterns) {
        const match = cleanText.match(pattern);
        if (match) {
          const data = intent.extract(text, match);
          return {
            intent: intentName,
            confidence: 0.9,
            data,
            originalText: text
          };
        }
      }
    }
    
    return {
      intent: 'unknown',
      confidence: 0,
      data: {},
      originalText: text
    };
  },
  
  // Extrai data e hora do texto
  extractDateTime(text) {
    const lower = text.toLowerCase();
    const now = new Date();
    let date = null;
    let time = '09:00'; // Padrão
    
    // Detecta dia
    if (lower.includes('hoje')) {
      date = now.toISOString().split('T')[0];
    } else if (lower.includes('amanhã') || lower.includes('amanha')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      date = tomorrow.toISOString().split('T')[0];
    } else if (lower.includes('depois de amanhã') || lower.includes('depois de amanha')) {
      const dayAfter = new Date(now);
      dayAfter.setDate(dayAfter.getDate() + 2);
      date = dayAfter.toISOString().split('T')[0];
    } else if (lower.match(/(?:na|nessa|essa|próxima)\s+(segunda|terça|terca|quarta|quinta|sexta|sábado|sabado|domingo)/i)) {
      const days = ['domingo', 'segunda', 'terça', 'terca', 'quarta', 'quinta', 'sexta', 'sábado', 'sabado'];
      const match = lower.match(/(?:na|nessa|essa|próxima)\s+(segunda|terça|terca|quarta|quinta|sexta|sábado|sabado|domingo)/i);
      if (match) {
        const targetDay = days.indexOf(match[1].toLowerCase().replace('terca', 'terça').replace('sabado', 'sábado'));
        if (targetDay >= 0) {
          const diff = (targetDay - now.getDay() + 7) % 7 || 7;
          const targetDate = new Date(now);
          targetDate.setDate(targetDate.getDate() + diff);
          date = targetDate.toISOString().split('T')[0];
        }
      }
    }
    
    // Detecta hora
    const timeMatch = lower.match(/(?:às?|as)\s+(\d{1,2})(?::(\d{2}))?(?:\s*(?:h|hrs?|horas?))?/i);
    if (timeMatch) {
      const hour = timeMatch[1].padStart(2, '0');
      const minute = timeMatch[2] || '00';
      time = `${hour}:${minute}`;
    } else if (lower.includes('de manhã') || lower.includes('pela manhã')) {
      time = '09:00';
    } else if (lower.includes('de tarde') || lower.includes('à tarde') || lower.includes('a tarde')) {
      time = '14:00';
    } else if (lower.includes('de noite') || lower.includes('à noite') || lower.includes('a noite')) {
      time = '19:00';
    }
    
    return { date, time };
  },
  
  // Estima XP baseado no tipo de tarefa
  estimateTaskXP(taskTitle) {
    const lower = taskTitle.toLowerCase();
    
    const xpMap = {
      // Alta recompensa (40-50 XP)
      high: ['estudar', 'estudo', 'curso', 'academia', 'exercício', 'treino', 'meditar', 'ler', 'livro', 'projeto', 'trabalho importante'],
      // Média recompensa (20-30 XP)
      medium: ['mercado', 'compras', 'reunião', 'organizar', 'limpar', 'cozinhar', 'lavar', 'pagar', 'banco'],
      // Baixa recompensa (10-15 XP)
      low: ['ligar', 'responder', 'email', 'mensagem', 'verificar', 'checar']
    };
    
    for (const keyword of xpMap.high) {
      if (lower.includes(keyword)) return Math.floor(Math.random() * 11) + 40; // 40-50
    }
    for (const keyword of xpMap.medium) {
      if (lower.includes(keyword)) return Math.floor(Math.random() * 11) + 20; // 20-30
    }
    for (const keyword of xpMap.low) {
      if (lower.includes(keyword)) return Math.floor(Math.random() * 6) + 10; // 10-15
    }
    
    return 20; // Padrão
  },
  
  // Detecta categoria financeira automaticamente
  detectFinanceCategory(text) {
    if (!text) return 'Outros';
    const lower = text.toLowerCase();
    
    const categories = {
      'Alimentação': ['almoço', 'almoco', 'jantar', 'café', 'cafe', 'lanche', 'comida', 'restaurante', 'mercado', 'supermercado', 'feira', 'padaria', 'ifood', 'delivery', 'marmita'],
      'Transporte': ['uber', '99', 'taxi', 'táxi', 'ônibus', 'onibus', 'metrô', 'metro', 'gasolina', 'combustível', 'combustivel', 'estacionamento', 'pedágio', 'pedagio'],
      'Lazer': ['cinema', 'filme', 'netflix', 'spotify', 'jogo', 'game', 'bar', 'balada', 'festa', 'show', 'teatro', 'passeio', 'viagem'],
      'Saúde': ['farmácia', 'farmacia', 'remédio', 'remedio', 'médico', 'medico', 'consulta', 'exame', 'academia', 'plano de saúde'],
      'Educação': ['curso', 'livro', 'escola', 'faculdade', 'material', 'apostila', 'mensalidade'],
      'Moradia': ['aluguel', 'luz', 'água', 'agua', 'internet', 'gás', 'gas', 'condomínio', 'condominio', 'iptu'],
      'Compras': ['roupa', 'sapato', 'tênis', 'tenis', 'loja', 'shopping', 'presente', 'eletrônico', 'eletronico']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      for (const keyword of keywords) {
        if (lower.includes(keyword)) return category;
      }
    }
    
    return 'Outros';
  }
};

// ========================================
// SISTEMA INTELIGENTE DO ORÁCULO 2.0
// Com memória, aprendizado, voz e ações
// ========================================

// Sistema de Memória do Oráculo - Com detecção inteligente
const OracleMemory = {
  key: 'oracle_memory',
  
  // Estrutura padrão da memória
  defaultMemory: {
    facts: [],
    preferences: {},
    conversations: 0,
    lastTalk: null,
    profile: {
      name: null,
      gender: null, // 'male', 'female', 'neutral'
      nickname: null,
      age: null,
      occupation: null,
      interests: [],
      dislikes: []
    },
    customResponses: {},
    aliases: {}
  },
  
  get() {
    try {
      const stored = JSON.parse(localStorage.getItem(this.key));
      const merged = { 
        ...this.defaultMemory, 
        ...stored, 
        profile: { ...this.defaultMemory.profile, ...(stored?.profile || {}) },
        aliases: { ...this.defaultMemory.aliases, ...(stored?.aliases || {}) }
      };
      return merged;
    } catch {
      return { ...this.defaultMemory };
    }
  },
  
  save(data) {
    localStorage.setItem(this.key, JSON.stringify(data));
    this.updateMemoryDisplay();
  },
  
  // Aprende um fato genérico
  learn(fact, category = 'general') {
    const mem = this.get();
    const existing = mem.facts.find(f => f.text.toLowerCase() === fact.toLowerCase());
    if (!existing) {
      mem.facts.push({ text: fact, category, date: new Date().toISOString() });
      if (mem.facts.length > 100) mem.facts.shift();
      this.save(mem);
      return true;
    }
    return false;
  },
  
  // Define informação do perfil
  setProfile(key, value) {
    const mem = this.get();
    if (!mem.profile) mem.profile = {};
    mem.profile[key] = value;
    this.save(mem);
  },
  
  // Obtém informação do perfil
  getProfile(key) {
    const mem = this.get();
    return mem.profile?.[key];
  },
  
  // Adiciona interesse
  addInterest(interest) {
    const mem = this.get();
    if (!mem.profile.interests) mem.profile.interests = [];
    if (!mem.profile.interests.includes(interest.toLowerCase())) {
      mem.profile.interests.push(interest.toLowerCase());
      this.save(mem);
      return true;
    }
    return false;
  },
  
  // Obtém gênero para pronomes
  getGenderPronoun(type = 'subject') {
    const gender = this.getProfile('gender');
    const pronouns = {
      male: { subject: 'ele', object: 'o', possessive: 'seu', treatment: 'cara', adj: 'o' },
      female: { subject: 'ela', object: 'a', possessive: 'sua', treatment: 'querida', adj: 'a' },
      neutral: { subject: 'você', object: 'você', possessive: 'seu', treatment: 'amigo', adj: 'o' }
    };
    return pronouns[gender]?.[type] || pronouns.neutral[type];
  },
  
  // Detecta gênero automaticamente por nome
  detectGenderByName(name) {
    const nameLower = name.toLowerCase().trim();
    
    // Nomes femininos comuns (terminações e nomes específicos)
    const femininePatterns = [
      /a$/, /ia$/, /na$/, /la$/, /ra$/, /da$/, /ta$/, /sa$/, /za$/, /cia$/, /lia$/, /nia$/
    ];
    const feminineNames = [
      'ana', 'maria', 'julia', 'carla', 'fernanda', 'patricia', 'camila', 'amanda', 'beatriz',
      'larissa', 'leticia', 'gabriela', 'mariana', 'rafaela', 'carolina', 'bianca', 'bruna',
      'daniela', 'eduarda', 'fabiana', 'giovana', 'helena', 'isabela', 'jessica', 'karen',
      'luana', 'manoela', 'natalia', 'olivia', 'priscila', 'raquel', 'sabrina', 'tatiana',
      'vanessa', 'yasmin', 'alice', 'sophia', 'laura', 'valentina', 'heloisa', 'lorena',
      'marina', 'vitoria', 'clara', 'sarah', 'rebeca', 'isadora', 'luiza', 'emanuella'
    ];
    
    // Nomes masculinos comuns
    const masculineNames = [
      'carlos', 'pedro', 'lucas', 'gabriel', 'matheus', 'rafael', 'bruno', 'daniel', 'diego',
      'eduardo', 'felipe', 'gustavo', 'henrique', 'igor', 'joao', 'kevin', 'leonardo', 'marcos',
      'nicolas', 'otavio', 'paulo', 'rodrigo', 'sergio', 'thiago', 'victor', 'william',
      'arthur', 'bernardo', 'caio', 'david', 'enzo', 'fabio', 'guilherme', 'hugo', 'ivan',
      'jose', 'kaique', 'luan', 'miguel', 'noah', 'andre', 'alex', 'anderson', 'vinicius',
      'murilo', 'heitor', 'lorenzo', 'theo', 'davi', 'samuel', 'benjamin', 'pietro'
    ];
    
    // Primeiro verifica nomes específicos
    if (feminineNames.includes(nameLower)) return 'female';
    if (masculineNames.includes(nameLower)) return 'male';
    
    // Depois verifica padrões de terminação
    for (const pattern of femininePatterns) {
      if (pattern.test(nameLower)) return 'female';
    }
    
    // Terminações masculinas comuns
    if (/[o|r|l|s|n|e]$/.test(nameLower) && !nameLower.endsWith('a')) {
      return 'male';
    }
    
    return 'neutral'; // Se não conseguir determinar
  },
  
  remember(keyword) {
    const mem = this.get();
    return mem.facts.filter(f => f.text.toLowerCase().includes(keyword.toLowerCase()));
  },
  
  setPreference(key, value) {
    const mem = this.get();
    mem.preferences[key] = value;
    this.save(mem);
  },
  
  getPreference(key) {
    return this.get().preferences[key];
  },
  
  incrementConversations() {
    const mem = this.get();
    mem.conversations++;
    mem.lastTalk = new Date().toISOString();
    this.save(mem);
  },
  
  updateMemoryDisplay() {
    const count = document.getElementById('oracleMemoryCount');
    if (count) {
      const mem = this.get();
      const totalMemories = mem.facts.length + (mem.profile.name ? 1 : 0) + (mem.profile.interests?.length || 0);
      count.textContent = totalMemories;
    }
  },
  
  // Retorna resumo do perfil
  getProfileSummary() {
    const mem = this.get();
    const p = mem.profile;
    let summary = [];
    if (p.name) summary.push(`👤 Nome: ${p.name}`);
    if (p.gender) summary.push(`⚧ Gênero: ${p.gender === 'male' ? 'Masculino' : p.gender === 'female' ? 'Feminino' : 'Não informado'}`);
    if (p.age) summary.push(`🎂 Idade: ${p.age} anos`);
    if (p.city) summary.push(`🏙️ Cidade: ${p.city}`);
    if (p.occupation) summary.push(`💼 Profissão: ${p.occupation}`);
    if (p.interests?.length) summary.push(`🎮 Interesses: ${p.interests.join(', ')}`);
    if (p.goals) summary.push(`🎯 Objetivo: ${p.goals}`);
    if (p.favoriteColor) summary.push(`🎨 Cor favorita: ${p.favoriteColor}`);
    if (p.favoriteFood) summary.push(`🍽️ Comida favorita: ${p.favoriteFood}`);
    if (p.lastMood) {
      const moodEmojis = { happy: '😊', sad: '😢', stressed: '😰', tired: '😴', motivated: '💪', bored: '😐' };
      const moodNames = { happy: 'Feliz', sad: 'Triste', stressed: 'Estressado', tired: 'Cansado', motivated: 'Motivado', bored: 'Entediado' };
      summary.push(`${moodEmojis[p.lastMood] || '😐'} Último humor: ${moodNames[p.lastMood] || p.lastMood}`);
    }
    return summary;
  }
};

// ========================================
// SISTEMA DE SCRIPTS DO ORÁCULO
// Permite carregar instruções e informações personalizadas
// ========================================
const OracleScript = {
  key: 'oracle_scripts',
  
  // Obtém scripts salvos
  getScripts() {
    try {
      return JSON.parse(localStorage.getItem(this.key)) || [];
    } catch {
      return [];
    }
  },
  
  // Salva scripts
  saveScripts(scripts) {
    localStorage.setItem(this.key, JSON.stringify(scripts));
  },
  
  // Processa um arquivo de script
  processScriptFile(content, filename) {
    const script = {
      id: Date.now(),
      filename: filename,
      loadedAt: new Date().toISOString(),
      instructions: [],
      facts: [],
      commands: [],
      responses: {},
      personality: {},
      raw: content
    };
    
    // Detecta formato do arquivo
    if (filename.endsWith('.json')) {
      try {
        const json = JSON.parse(content);
        script.instructions = json.instructions || [];
        script.facts = json.facts || json.informacoes || [];
        script.commands = json.commands || json.comandos || [];
        script.responses = json.responses || json.respostas || {};
        script.personality = json.personality || json.personalidade || {};
        if (json.nome) script.name = json.nome;
        if (json.name) script.name = json.name;
      } catch (e) {
        console.error('Erro ao processar JSON:', e);
        return { success: false, error: 'Arquivo JSON inválido' };
      }
    } else {
      // Processa arquivo TXT ou MD
      const lines = content.split('\n');
      let currentSection = 'general';
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) {
          // Detecta seções por cabeçalhos
          if (trimmed.toLowerCase().includes('instrução') || trimmed.toLowerCase().includes('instruction')) {
            currentSection = 'instructions';
          } else if (trimmed.toLowerCase().includes('fato') || trimmed.toLowerCase().includes('informação') || trimmed.toLowerCase().includes('fact')) {
            currentSection = 'facts';
          } else if (trimmed.toLowerCase().includes('comando') || trimmed.toLowerCase().includes('command')) {
            currentSection = 'commands';
          } else if (trimmed.toLowerCase().includes('resposta') || trimmed.toLowerCase().includes('response')) {
            currentSection = 'responses';
          }
          return;
        }
        
        // Processa linha baseado na seção atual
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const value = trimmed.slice(2);
          if (currentSection === 'instructions') {
            script.instructions.push(value);
          } else if (currentSection === 'facts') {
            script.facts.push(value);
          } else if (currentSection === 'commands') {
            // Formato: trigger:response ou trigger -> response
            const [trigger, response] = value.includes('->') ? value.split('->') : value.split(':');
            if (trigger && response) {
              script.commands.push({ trigger: trigger.trim().toLowerCase(), response: response.trim() });
            }
          } else {
            // Linha geral - adiciona como fato
            script.facts.push(value);
          }
        } else if (trimmed.includes(':') && currentSection === 'responses') {
          const [key, value] = trimmed.split(':');
          if (key && value) {
            script.responses[key.trim().toLowerCase()] = value.trim();
          }
        } else if (currentSection === 'general') {
          // Linhas gerais são tratadas como fatos
          script.facts.push(trimmed);
        }
      });
    }
    
    // Salva o script
    const scripts = this.getScripts();
    scripts.push(script);
    this.saveScripts(scripts);
    
    // Adiciona fatos à memória do Oráculo
    script.facts.forEach(fact => {
      OracleMemory.learn(fact, 'script');
    });
    
    return { 
      success: true, 
      script,
      summary: {
        instructions: script.instructions.length,
        facts: script.facts.length,
        commands: script.commands.length,
        responses: Object.keys(script.responses).length
      }
    };
  },
  
  // Verifica se há comando customizado
  checkCustomCommand(input) {
    const scripts = this.getScripts();
    const inputLower = input.toLowerCase();
    
    for (const script of scripts) {
      // Verifica comandos
      for (const cmd of script.commands || []) {
        if (inputLower.includes(cmd.trigger)) {
          return cmd.response;
        }
      }
      
      // Verifica respostas diretas
      for (const [key, response] of Object.entries(script.responses || {})) {
        if (inputLower.includes(key)) {
          return response;
        }
      }
    }
    
    return null;
  },
  
  // Obtém contexto adicional dos scripts
  getContext() {
    const scripts = this.getScripts();
    let context = {
      instructions: [],
      facts: []
    };
    
    scripts.forEach(script => {
      context.instructions.push(...(script.instructions || []));
      context.facts.push(...(script.facts || []));
    });
    
    return context;
  },
  
  // Remove um script
  removeScript(id) {
    const scripts = this.getScripts().filter(s => s.id !== id);
    this.saveScripts(scripts);
  },
  
  // Lista todos os scripts
  listScripts() {
    return this.getScripts().map(s => ({
      id: s.id,
      name: s.name || s.filename,
      loadedAt: s.loadedAt,
      stats: {
        instructions: (s.instructions || []).length,
        facts: (s.facts || []).length,
        commands: (s.commands || []).length
      }
    }));
  },
  
  // Limpa todos os scripts
  clearAll() {
    this.saveScripts([]);
  }
};

// Personalidades do Oráculo 2.0
const ORACLE_PERSONALITIES_V2 = {
  assistant: {
    name: 'Assistente',
    emoji: '🧠',
    greeting: (name) => `Olá, ${name}! 👋 Como posso te ajudar hoje? Posso criar tarefas, verificar suas finanças, dar dicas ou simplesmente conversar!`,
    style: {
      formal: false,
      enthusiastic: true,
      helpful: true
    }
  },
  wise: {
    name: 'Sábio',
    emoji: '🧙‍♂️',
    greeting: (name) => `Saudações, ${name}. A sabedoria antiga me guia para auxiliar sua jornada. O que busca descobrir?`,
    style: {
      formal: true,
      enthusiastic: false,
      mystical: true
    }
  },
  coach: {
    name: 'Coach',
    emoji: '🏋️',
    greeting: (name) => `E AÍ, ${name.toUpperCase()}! 💪 BORA CONQUISTAR O DIA! O que vamos DESTRUIR hoje?`,
    style: {
      formal: false,
      enthusiastic: true,
      motivational: true
    }
  },
  friend: {
    name: 'Amigo',
    emoji: '😊',
    greeting: (name) => `Eai, ${name}! Que bom te ver por aqui! 😄 Conta pra mim, como tá indo? Posso te ajudar em algo?`,
    style: {
      formal: false,
      casual: true,
      friendly: true
    }
  }
};

// Respostas carismáticas por contexto
const CHARISMATIC_RESPONSES = {
  success: [
    "✨ Feito! Você tá mandando muito bem!",
    "🎯 Pronto! Mais uma missão cumprida!",
    "💪 Concluído com sucesso! Continue assim!",
    "🚀 Executado! Nada te para!",
    "✅ Feito e bem feito! Orgulho de você!"
  ],
  encouragement: [
    "Você consegue! Acredito em você! 💪",
    "Um passo de cada vez, você vai longe! 🚶‍♂️",
    "Lembre-se: todo expert já foi iniciante! 🌱",
    "Seus esforços vão valer a pena! ⭐",
    "Continue assim, você está no caminho certo! 🛤️"
  ],
  greeting_morning: [
    "Bom dia, raio de sol! ☀️ Pronto pra brilhar?",
    "Uma linda manhã para conquistar o mundo! 🌅",
    "Novo dia, novas oportunidades! Vamos nessa? 💫"
  ],
  greeting_afternoon: [
    "Boa tarde! Como está sendo o dia? ☕",
    "Ei! Já fez uma pausa hoje? Cuide-se! 🌿",
    "Tarde produtiva? Conta comigo! 💼"
  ],
  greeting_night: [
    "Boa noite! Hora de relaxar um pouco? 🌙",
    "Noite chegou! Que tal revisar suas conquistas do dia? ⭐",
    "Descanse bem! Amanhã tem mais! 😴"
  ],
  notUnderstood: [
    "Hmm, não entendi bem... Pode reformular? 🤔",
    "Desculpa, não peguei essa. Tenta de outro jeito? 💭",
    "Ops, essa me pegou! Pode explicar melhor? 😅"
  ]
};

// Sistema de Reconhecimento de Voz
const VoiceRecognition = {
  recognition: null,
  isListening: false,
  hasPermission: false,
  conversationMode: false, // Modo conversa contínua (telefone)
  
  init() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true; // Mostra resultados parciais
      this.recognition.lang = 'pt-BR';
      
      this.recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript;
        
        // Se for resultado final
        if (result.isFinal) {
          const chatInput = document.getElementById('chatInput');
          if (chatInput) {
            chatInput.value = transcript;
            OracleChat.processMessage();
          }
          
          // Se está em modo conversa, continua ouvindo após a resposta
          if (this.conversationMode) {
            // Aguarda o Oráculo terminar de falar antes de ouvir novamente
            setTimeout(() => {
              if (this.conversationMode && !OracleSpeech.isSpeaking) {
                this.startListening();
              }
            }, 500);
          }
        } else {
          // Mostra texto parcial no input
          const chatInput = document.getElementById('chatInput');
          if (chatInput) {
            chatInput.value = transcript;
            chatInput.placeholder = 'Ouvindo...';
          }
        }
      };
      
      this.recognition.onend = () => {
        this.isListening = false;
        this.updateButton();
        
        // Se está em modo conversa e não foi cancelado manualmente, reinicia
        if (this.conversationMode && !OracleSpeech.isSpeaking) {
          setTimeout(() => {
            if (this.conversationMode) {
              this.startListening();
            }
          }, 300);
        }
      };
      
      this.recognition.onerror = (event) => {
        console.warn('Erro no reconhecimento de voz:', event.error);
        this.isListening = false;
        this.updateButton();
        
        if (event.error === 'not-allowed') {
          this.hasPermission = false;
          OracleChat.addSystemMessage('⚠️ Permissão de microfone negada. Clique no ícone de cadeado na barra de endereço para permitir.');
        } else if (event.error === 'no-speech') {
          // Silêncio - reinicia se em modo conversa
          if (this.conversationMode) {
            setTimeout(() => this.startListening(), 100);
          }
        } else if (event.error === 'aborted') {
          // Ignorar - foi cancelado intencionalmente
        }
      };
      
      this.recognition.onstart = () => {
        this.hasPermission = true;
        this.isListening = true;
        this.updateButton();
      };
      
      return true;
    }
    return false;
  },
  
  // Pede permissão do microfone uma vez
  async requestPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Para o stream imediatamente - só queríamos a permissão
      stream.getTracks().forEach(track => track.stop());
      this.hasPermission = true;
      return true;
    } catch (e) {
      console.warn('Permissão de microfone negada:', e);
      this.hasPermission = false;
      return false;
    }
  },
  
  async toggle() {
    if (!this.recognition) {
      if (!this.init()) {
        OracleChat.addSystemMessage('⚠️ Seu navegador não suporta reconhecimento de voz.');
        return;
      }
    }
    
    if (this.isListening) {
      this.stopListening();
    } else {
      // Pede permissão se ainda não tem
      if (!this.hasPermission) {
        const granted = await this.requestPermission();
        if (!granted) {
          OracleChat.addSystemMessage('⚠️ Precisamos de permissão do microfone para ouvir você.');
          return;
        }
      }
      this.startListening();
    }
  },
  
  startListening() {
    if (!this.recognition || this.isListening) return;
    
    try {
      this.recognition.start();
      this.isListening = true;
      OracleChat.updateStatus(this.conversationMode ? '🎤 Modo Conversa Ativo' : 'Ouvindo... 🎤');
      this.updateButton();
    } catch (e) {
      // Se já está rodando, ignora o erro
      if (e.name !== 'InvalidStateError') {
        console.warn('Erro ao iniciar voz:', e);
      }
    }
  },
  
  stopListening() {
    if (!this.recognition) return;
    
    try {
      this.recognition.stop();
    } catch (e) {}
    
    this.isListening = false;
    this.updateButton();
  },
  
  // Inicia/Para modo de conversa contínua (estilo telefone)
  toggleConversationMode() {
    this.conversationMode = !this.conversationMode;
    
    if (this.conversationMode) {
      OracleChat.addSystemMessage('📞 Modo Conversa ativado! Fale naturalmente, vou te ouvir e responder por voz.');
      OracleSpeech.speak('Modo conversa ativado! Pode falar comigo naturalmente.');
      this.toggle();
    } else {
      this.stopListening();
      OracleSpeech.stop();
      OracleChat.addSystemMessage('📞 Modo Conversa desativado.');
    }
    
    this.updateButton();
  },
  
  updateButton() {
    const btn = document.getElementById('oracleVoiceBtn');
    if (btn) {
      btn.classList.toggle('listening', this.isListening);
      btn.classList.toggle('conversation-mode', this.conversationMode);
      btn.title = this.conversationMode ? 'Modo Conversa (clique para desativar)' : 
                  this.isListening ? 'Ouvindo... (clique para parar)' : 'Clique para falar';
    }
  }
};

// Sistema de Síntese de Voz (Text-to-Speech) - Oráculo fala
const OracleSpeech = {
  synth: window.speechSynthesis,
  voice: null,
  isSpeaking: false,
  enabled: true,
  rate: 1.0,
  pitch: 1.0,
  
  init() {
    if (!this.synth) {
      console.warn('Síntese de voz não suportada');
      return false;
    }
    
    // Carrega vozes disponíveis
    this.loadVoices();
    
    // Algumas vezes as vozes carregam assincronamente
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
    
    return true;
  },
  
  loadVoices() {
    const voices = this.synth.getVoices();
    
    // Tenta encontrar uma voz em português brasileiro
    this.voice = voices.find(v => v.lang === 'pt-BR') ||
                 voices.find(v => v.lang.startsWith('pt')) ||
                 voices.find(v => v.default) ||
                 voices[0];
    
    if (this.voice) {
      console.log('Voz selecionada:', this.voice.name);
    }
  },
  
  speak(text, callback) {
    if (!this.synth || !this.enabled) {
      if (callback) callback();
      return;
    }
    
    // Cancela qualquer fala anterior
    this.stop();
    
    // Remove tags HTML do texto
    const cleanText = text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (!cleanText) {
      if (callback) callback();
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.voice = this.voice;
    utterance.lang = 'pt-BR';
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;
    
    utterance.onstart = () => {
      this.isSpeaking = true;
    };
    
    utterance.onend = () => {
      this.isSpeaking = false;
      if (callback) callback();
      
      // Se está em modo conversa, volta a ouvir
      if (VoiceRecognition.conversationMode) {
        setTimeout(() => {
          VoiceRecognition.startListening();
        }, 300);
      }
    };
    
    utterance.onerror = (e) => {
      console.warn('Erro na síntese de voz:', e);
      this.isSpeaking = false;
      if (callback) callback();
    };
    
    this.synth.speak(utterance);
  },
  
  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  },
  
  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stop();
    }
    return this.enabled;
  }
};

// ========================================
// SISTEMA DE ONBOARDING (PERGAMINHO)
// ========================================
const OracleOnboarding = {
  data: null,
  markdown: null,
  txt: null,
  activeMode: 'json', // Padrão: validação estrita via JSON

  async init() {
    try {
      // Carrega JSON de regras: tenta fetch HTTP, se falhar usa script embutido no HTML
      try {
        const response = await fetch('pergaminho-onboarding.json');
        if (response.ok) {
          this.data = await response.json();
          console.log('📜 Pergaminho de Onboarding (JSON) carregado via fetch.');
        }
      } catch (fe) {
        // fetch pode falhar quando abrimos via file:// — tentamos ler o script embutido
        try {
          const el = document.getElementById('pergaminho-onboarding-data');
          if (el && el.textContent) {
            this.data = JSON.parse(el.textContent);
            console.log('📜 Pergaminho de Onboarding carregado via script embutido.');
          }
        } catch (pe) {
          console.warn('Falha ao carregar pergaminho via fallback embutido:', pe);
        }
      }
      
      // Carrega Markdown de documentação/regras
      // Se estamos servindo via file://, evitar fetch que falha por motivos de segurança
      if (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:') {
        // Não tentamos buscar .md via fetch em file:// — silêncio para evitar spam no console
      } else {
        try {
          const mdResponse = await fetch('pergaminho-onboarding.md');
          if (mdResponse.ok) {
            this.markdown = await mdResponse.text();
            console.log('📜 Pergaminho de Onboarding (MD) carregado.');
          }
        } catch (e) {
          console.warn('Não foi possível carregar pergaminho-onboarding.md via fetch:', e);
        }
      }
      
      // Carrega TXT de regras simples
      if (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:') {
        // Ignorar fetch de .txt em file://
      } else {
        try {
          const txtResponse = await fetch('pergaminho-onboarding.txt');
          if (txtResponse.ok) {
            this.txt = await txtResponse.text();
            console.log('📜 Pergaminho de Onboarding (TXT) carregado.');
          }
        } catch (e) {
          console.warn('Não foi possível carregar pergaminho-onboarding.txt via fetch:', e);
        }
      }
    } catch (e) {
      // Silencioso se não existir, segue sem validação estrita
    }
  },

  setRuleMode(mode) {
    if (['json', 'markdown', 'txt'].includes(mode)) {
      this.activeMode = mode;
      return `🔄 Modo de regras alterado para: <strong>${mode.toUpperCase()}</strong>`;
    }
    return "⚠️ Modo inválido. Use: json, markdown ou txt.";
  },

  getRulesText() {
    switch(this.activeMode) {
      case 'markdown': return this.markdown || "Regras Markdown não carregadas.";
      case 'txt': return this.txt || "Regras TXT não carregadas.";
      case 'json': return this.data ? JSON.stringify(this.data, null, 2) : "Regras JSON não carregadas.";
      default: return "Modo desconhecido.";
    }
  },

  validateInput(field, input) {
    if (this.activeMode !== 'json') return { valid: true };
    if (!this.data) return { valid: true };

    // Mapeia campos internos do OracleChat para chaves do JSON
    const fieldMap = {
      'name': 'user.name',
      'occupation': 'user.role',
      'workplace': 'user.workplace',
      'city': 'user.city'
    };
    
    const key = fieldMap[field];
    if (!key) return { valid: true };

    const rule = this.data.onboarding_flow?.find(r => r.key === key);
    if (!rule) return { valid: true };

    const lowerInput = input.toLowerCase();

    // Validação baseada nos exemplos ruins do JSON
    if (rule.examples_bad) {
      for (const bad of rule.examples_bad) {
        if (lowerInput.includes(bad.toLowerCase())) {
           const msg = this.data.confirmation_policy?.when_mismatch || `Hmm, isso não parece responder à pergunta: "${rule.question}"`;
           return { valid: false, message: msg };
        }
      }
    }

    return { valid: true };
  }
};

// Sistema Principal do Oráculo
const OracleChat = {
  personality: 'assistant',
  pendingAction: null, // Guarda ação pendente aguardando resposta do usuário
  // Wrappers para funções globais (evita TypeError quando chamadas como this.xxx())
  getTasksList() { return typeof getTasksList === 'function' ? getTasksList() : "Função getTasksList não disponível."; },
  // Compatibilidade: algumas partes do código podem chamar getTaskList (singular)
  getTaskList() { return typeof getTasksList === 'function' ? getTasksList() : "Função getTasksList não disponível."; },
  getFinanceSummary() { return typeof getFinanceSummary === 'function' ? getFinanceSummary() : "Função getFinanceSummary não disponível."; },
  getStatusInfo() { return typeof getStatusInfo === 'function' ? getStatusInfo() : "Função getStatusInfo não disponível."; },
  createFinancialGoal() { return typeof createFinancialGoal === 'function' ? createFinancialGoal() : "Função createFinancialGoal não disponível."; },
  getSuccessMessage() { return typeof getSuccessMessage === 'function' ? getSuccessMessage() : "Pronto!"; },
  addExpense(value, desc) { return typeof addExpense === 'function' ? addExpense(value, desc) : "Função addExpense não disponível."; },
  addIncome(value, desc) { return typeof addIncome === 'function' ? addIncome(value, desc) : "Função addIncome não disponível."; },
  addBotMessage(text, actions) { return typeof addBotMessage === 'function' ? addBotMessage(text, actions) : null; },
  // Compatibilidade com nomes antigos/typos
  addMessages(text, actions) { return typeof addBotMessage === 'function' ? addBotMessage(text, actions) : null; },
  addMessage(text, actions) { return this.addMessages(text, actions); },
  completeTask(taskName) { return typeof completeTask === 'function' ? completeTask(taskName) : `Não encontrei tarefa: ${taskName}`; },
  createTask(text) { return typeof createTask === 'function' ? createTask(text) : `Não consegui criar tarefa: ${text}`; },
  
  init() {
    this.personality = gameState?.oraclePersonality || 'assistant';
    this.pendingAction = null;
    this.setupListeners();
    OracleMemory.updateMemoryDisplay();
    VoiceRecognition.init();
    OracleSpeech.init();
    OracleOnboarding.init(); // Carrega as regras do pergaminho
  },
  
  setupListeners() {
    // Botão de abrir chat
    const chatBtn = document.getElementById('chatBtn');
    if (chatBtn) chatBtn.addEventListener('click', () => this.toggle());
    
    // Botão de fechar
    const closeBtn = document.getElementById('closeChatBtn');
    if (closeBtn) closeBtn.addEventListener('click', () => this.toggle());
    
    // Botão de enviar
    const sendBtn = document.getElementById('sendMessageBtn');
    if (sendBtn) sendBtn.addEventListener('click', () => this.processMessage());
    
    // Input (Enter)
    const input = document.getElementById('chatInput');
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.processMessage();
      });
    }
    
    // Botão de voz - clique único para ouvir uma vez, clique duplo para modo conversa
    const voiceBtn = document.getElementById('oracleVoiceBtn');
    if (voiceBtn) {
      let clickTimeout = null;
      let lastClick = 0;
      
      voiceBtn.addEventListener('click', (e) => {
        const now = Date.now();
        const timeDiff = now - lastClick;
        lastClick = now;
        
        // Duplo clique (menos de 300ms)
        if (timeDiff < 300 && timeDiff > 0) {
          clearTimeout(clickTimeout);
          VoiceRecognition.toggleConversationMode();
        } else {
          // Clique único - aguarda para ver se é duplo clique
          clickTimeout = setTimeout(() => {
            if (!VoiceRecognition.conversationMode) {
              VoiceRecognition.toggle();
            }
          }, 300);
        }
      });
      
      // Dica visual
      voiceBtn.title = 'Clique: ouvir | Duplo clique: modo conversa';
    }
    
    // Botão de configurações (engrenagem) - Mostra perfil do usuário
    const settingsBtn = document.getElementById('oracleSettingsBtn');
    if (settingsBtn) settingsBtn.addEventListener('click', () => this.showUserProfile());
    
    // Botão de carregar script
    const scriptBtn = document.getElementById('oracleScriptBtn');
    const scriptInput = document.getElementById('oracleScriptInput');
    if (scriptBtn && scriptInput) {
      scriptBtn.addEventListener('click', () => this.showScriptOptions());
      scriptInput.addEventListener('change', (e) => this.handleScriptUpload(e));
    }
    
    // Seletor de personalidade
    const personalitySelect = document.getElementById('oraclePersonalitySelect');
    if (personalitySelect) {
      personalitySelect.addEventListener('change', (e) => this.changePersonality(e.target.value));
    }
    
    // Botões de ação rápida
    document.querySelectorAll('.oracle-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => this.handleQuickAction(btn.dataset.action));
    });
  },
  
  // Mostra tudo que o Oráculo sabe sobre o usuário
  showUserProfile() {
    const profileSummary = OracleMemory.getProfileSummary();
    const memories = OracleMemory.remember('');
    const profile = OracleMemory.get().profile || {};
    
    let response = `<strong>📋 Tudo que sei sobre você:</strong><br><br>`;
    
    // Perfil completo
    if (profileSummary.length > 0) {
      response += `<strong>👤 Seu Perfil:</strong><br>`;
      profileSummary.forEach(item => {
        response += `${item}<br>`;
      });
      response += '<br>';
    } else {
      response += `<em>Ainda não sei muito sobre você...</em><br><br>`;
    }
    
    // Memórias/Fatos aprendidos
    if (memories.length > 0) {
      response += `<strong>💭 Coisas que você me ensinou:</strong><br>`;
      memories.forEach(m => {
        const date = new Date(m.date).toLocaleDateString('pt-BR');
        response += `• ${m.text} <small style="opacity:0.6">(${date})</small><br>`;
      });
      response += '<br>';
    }
    
    // Estatísticas
    const mem = OracleMemory.get();
    response += `<strong>📊 Estatísticas:</strong><br>`;
    response += `💬 Conversas: ${mem.conversationCount || 0}<br>`;
    response += `🧠 Total de memórias: ${memories.length}<br>`;
    
    if (mem.firstInteraction) {
      const firstDate = new Date(mem.firstInteraction).toLocaleDateString('pt-BR');
      response += `📅 Primeira conversa: ${firstDate}<br>`;
    }
    
    // Ações rápidas
    response += `<br><strong>⚡ Ações:</strong>`;
    
    this.addBotMessage(response, [
      { text: '💬 Bora conversar', action: () => { 
        addUserMessage('bora conversar');
        const resp = this.startConversationMode();
        addBotMessage(resp);
      }},
      { text: '🗑️ Limpar memória', action: () => {
        if (confirm('Tem certeza que quer apagar tudo que sei sobre você?')) {
          localStorage.removeItem(OracleMemory.key);
          OracleMemory.updateMemoryDisplay();
          addBotMessage('🗑️ Memória limpa! Vamos começar do zero. Qual é o seu nome? 😊');
          OracleMemory.setProfile('conversationMode', true);
          OracleMemory.setProfile('lastQuestion', 'name');
        }
      }},
      { text: '❌ Fechar', action: () => {} }
    ]);
  },
  
  // Mostra opções de scripts
  showScriptOptions() {
    const scripts = OracleScript.listScripts();
    
    let response = `<strong>📄 Scripts e Configurações</strong><br><br>`;
    response += `Scripts permitem que você me ensine informações, comandos personalizados e instruções especiais.<br><br>`;
    
    if (scripts.length > 0) {
      response += `<strong>📚 Scripts Carregados:</strong><br>`;
      scripts.forEach(s => {
        const date = new Date(s.loadedAt).toLocaleDateString('pt-BR');
        response += `• <strong>${s.name}</strong> (${date})<br>`;
        response += `&nbsp;&nbsp;📝 ${s.stats.instructions} instruções, 💭 ${s.stats.facts} fatos, ⚡ ${s.stats.commands} comandos<br>`;
      });
      response += '<br>';
    } else {
      response += `<em>Nenhum script carregado ainda.</em><br><br>`;
    }
    
    response += `<strong>📁 Formatos aceitos:</strong><br>`;
    response += `• <code>.txt</code> - Texto simples (um fato por linha)<br>`;
    response += `• <code>.md</code> - Markdown com seções<br>`;
    response += `• <code>.json</code> - Estruturado (recomendado)<br><br>`;
    
    response += `<strong>📋 Exemplo de JSON:</strong><br>`;
    response += `<pre style="font-size:11px; background:rgba(0,0,0,0.3); padding:8px; border-radius:6px; overflow-x:auto;">{
  "nome": "Meu Script",
  "instructions": ["Seja sempre positivo", "Use emojis"],
  "facts": ["Meu pet é o Rex", "Gosto de pizza"],
  "commands": [
    {"trigger": "oi rex", "response": "Au au! 🐕"}
  ]
}</pre>`;
    
    this.addBotMessage(response, [
      { text: '📤 Carregar Script', action: () => {
        document.getElementById('oracleScriptInput')?.click();
      }},
      { text: '🗑️ Limpar Scripts', action: () => {
        if (scripts.length === 0) {
          addBotMessage('Não há scripts para limpar! 📭');
          return;
        }
        if (confirm(`Deseja remover todos os ${scripts.length} scripts carregados?`)) {
          OracleScript.clearAll();
          addBotMessage('🗑️ Todos os scripts foram removidos!');
        }
      }},
      { text: '❌ Fechar', action: () => {} }
    ]);
  },
  
  // Processa upload de arquivo de script
  handleScriptUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Suporte a PDF
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      this.processPdfUpload(file);
      event.target.value = ''; // Limpa o input para permitir re-upload
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const result = OracleScript.processScriptFile(content, file.name);
      
      if (result.success) {
        let response = `<strong>✅ Script "${file.name}" carregado com sucesso!</strong><br><br>`;
        response += `<strong>📊 Resumo:</strong><br>`;
        response += `• 📝 ${result.summary.instructions} instruções<br>`;
        response += `• 💭 ${result.summary.facts} fatos aprendidos<br>`;
        response += `• ⚡ ${result.summary.commands} comandos personalizados<br>`;
        response += `• 💬 ${result.summary.responses} respostas automáticas<br><br>`;
        
        if (result.script.facts?.length > 0) {
          response += `<strong>Alguns fatos que aprendi:</strong><br>`;
          result.script.facts.slice(0, 5).forEach(f => {
            response += `• ${f}<br>`;
          });
          if (result.script.facts.length > 5) {
            response += `<em>...e mais ${result.script.facts.length - 5} fatos</em><br>`;
          }
        }
        
        addBotMessage(response);
        OracleMemory.updateMemoryDisplay();
      } else {
        addBotMessage(`❌ Erro ao processar script: ${result.error}`);
      }
      
      // Limpa o input para permitir recarregar o mesmo arquivo
      event.target.value = '';
    };
    
    reader.readAsText(file);
  },
  
  // Processa upload de PDF
  async processPdfUpload(file) {
    // Verifica se a biblioteca PDF.js está disponível
    if (typeof pdfjsLib === 'undefined') {
      addBotMessage(`⚠️ <strong>Biblioteca PDF não detectada!</strong><br>Para eu ler o arquivo <em>${file.name}</em>, você precisa adicionar o PDF.js no seu <code>index.html</code>.<br><br>Ou se preferir, crie um script <code>.json</code> com as informações principais!`);
      return;
    }

    addBotMessage(`📖 Abrindo <strong>${file.name}</strong>...<br><em>Estudando o conteúdo (isso pode levar alguns segundos)...</em>`);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      // Limite de segurança para não travar o navegador com arquivos gigantes
      const maxPages = 50; 
      const pagesToRead = Math.min(pdf.numPages, maxPages);
      
      if (pdf.numPages > maxPages) {
        addBotMessage(`⚠️ O arquivo é muito grande (${pdf.numPages} páginas). Vou ler apenas as primeiras ${maxPages} páginas para não sobrecarregar sua memória.`);
      }

      for (let i = 1; i <= pagesToRead; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map(item => item.str);
        fullText += strings.join(' ') + '\n';
      }

      // Envia o texto extraído para o processador de scripts
      const result = OracleScript.processScriptFile(fullText, file.name);
      
      if (result.success) {
        addBotMessage(`✅ <strong>Leitura concluída!</strong><br>Absorvi ${result.summary.facts} novos conhecimentos deste PDF.`);
      } else {
        addBotMessage(`❌ Não consegui extrair informações úteis deste PDF.`);
      }
    } catch (e) {
      console.error(e);
      addBotMessage(`❌ Erro ao ler PDF: ${e.message}`);
    }
  },

  toggle() {
    const modal = document.getElementById('chatModal');
    if (!modal) return;
    
    modal.classList.toggle('active');
    
    if (modal.classList.contains('active')) {
      setTimeout(() => document.getElementById('chatInput')?.focus(), 100);
      
      const messages = document.getElementById('chatMessages');
      if (messages && messages.children.length === 0) {
        this.showWelcome();
      }
      
      OracleMemory.incrementConversations();
    }
  },
  
  // Verifica se hoje é aniversário do usuário
  isBirthday() {
    const birthday = OracleMemory.getProfile('aniversario');
    if (!birthday) return false;

    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;

    const cleanBirthday = birthday.toLowerCase().trim();
    let targetDay, targetMonth;

    if (cleanBirthday.includes('/')) {
      const parts = cleanBirthday.split('/');
      targetDay = parseInt(parts[0]);
      targetMonth = parseInt(parts[1]);
    } else if (cleanBirthday.includes(' de ')) {
      const parts = cleanBirthday.split(' de ');
      targetDay = parseInt(parts[0]);
      const months = {
        'janeiro': 1, 'fevereiro': 2, 'março': 3, 'marco': 3, 'abril': 4, 'maio': 5, 'junho': 6,
        'julho': 7, 'agosto': 8, 'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12
      };
      for (const [name, num] of Object.entries(months)) {
        if (parts[1] && parts[1].includes(name)) {
          targetMonth = num;
          break;
        }
      }
    }

    return targetDay === currentDay && targetMonth === currentMonth;
  },

  showWelcome() {
    const p = ORACLE_PERSONALITIES_V2[this.personality];
    
    // Prioriza o nome salvo na memória do Oráculo, depois o nome do gameState
    const memorizedName = OracleMemory.getProfile('name');
    const name = memorizedName || gameState?.name || 'Viajante';
    const gender = OracleMemory.getProfile('gender');
    
    this.updateAvatar(p.emoji);
    
    // Verifica Aniversário
    if (this.isBirthday()) {
      const bdayMessage = `🎉🎂 <strong>FELIZ ANIVERSÁRIO, ${name.toUpperCase()}!</strong> 🎂🎉<br><br>` +
                          `Que seu novo ciclo seja repleto de conquistas, XP e level ups! 🥳<br>` +
                          `Preparei uma festa virtual pra você! 🎈`;
      addBotMessage(bdayMessage);
      playSound('achievement');
      triggerConfetti();
      setTimeout(() => triggerConfetti(), 1000);
      return;
    }
    
    // Saudação personalizada baseada no gênero
    let greeting = p.greeting(name);
    if (gender === 'male' && this.personality === 'friend') {
      greeting = `E aí, ${name}! Beleza, mano? 😎 Conta comigo pra o que precisar!`;
    } else if (gender === 'female' && this.personality === 'friend') {
      greeting = `Oi, ${name}! Tudo bem, linda? 💖 Conta comigo pra o que precisar!`;
    }
    
    addBotMessage(greeting);
    
    // Se não conhece o nome ainda, pergunta
    if (!memorizedName && !gameState?.name) {
      setTimeout(() => {
        addBotMessage("A propósito, como posso te chamar? 🤔");
      }, 1000);
    } else {
      setTimeout(() => {
        addBotMessage(this.getTimeGreeting());
      }, 800);
    }
  },
  
  getTimeGreeting() {
    const hour = new Date().getHours();
    let greetings;
    const gender = OracleMemory.getProfile('gender');
    const treatment = gender === 'male' ? 'cara' : gender === 'female' ? 'querida' : 'amigo';
    
    if (hour >= 5 && hour < 12) {
      greetings = [
        `Bom dia, ${treatment}! ☀️ Pronto pra brilhar?`,
        "Uma linda manhã para conquistar o mundo! 🌅",
        "Novo dia, novas oportunidades! Vamos nessa? 💫"
      ];
    } else if (hour >= 12 && hour < 18) {
      greetings = [
        `Boa tarde, ${treatment}! Como está sendo o dia? ☕`,
        "Ei! Já fez uma pausa hoje? Cuide-se! 🌿",
        "Tarde produtiva? Conta comigo! 💼"
      ];
    } else {
      greetings = [
        `Boa noite, ${treatment}! Hora de relaxar um pouco? 🌙`,
        "Noite chegou! Que tal revisar suas conquistas do dia? ⭐",
        "Descanse bem! Amanhã tem mais! 😴"
      ];
    }
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  },
  
  updateAvatar(emoji) {
    const avatar = document.getElementById('oracleAvatarEmoji');
    if (avatar) avatar.textContent = emoji;
  },
  
  updateStatus(text) {
    const status = document.getElementById('oracleStatusText');
    if (status) {
      status.textContent = text;
      setTimeout(() => {
        status.textContent = 'Online • Pronto para ajudar';
      }, 3000);
    }
  },
  
  changePersonality(key) {
    if (ORACLE_PERSONALITIES_V2[key]) {
      this.personality = key;
      if (gameState) {
        gameState.oraclePersonality = key;
        saveGame(true);
      }
      const p = ORACLE_PERSONALITIES_V2[key];
      this.updateAvatar(p.emoji);
      this.addSystemMessage(`Personalidade alterada para: ${p.name}`);
    }
  },
  
  handleQuickAction(action) {
    const actions = {
      status: 'Qual meu status atual?',
      tasks: 'Quais são minhas tarefas?',
      finance: 'ajuda financeira',
      work: 'Como foi meu trabalho hoje?',
      help: 'ajuda'
    };
    
    if (actions[action]) {
      const input = document.getElementById('chatInput');
      if (input) {
        input.value = actions[action];
        this.processMessage();
      }
    }
  },
  
  async processMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) return;
    
    addUserMessage(text);
    input.value = '';
    
    // Mostra "pensando"
    showThinking();
    
    // Processa com delay para parecer natural
    setTimeout(async () => {
      removeThinking();
      try {
        const response = await this.generateResponse(text);
        if (typeof response === 'string') {
          addBotMessage(response);
        } else if (response && response.message) {
          addBotMessage(response.message, response.actions);
        }
      } catch (err) {
        console.error('Erro em generateResponse:', err);
        addBotMessage('Desculpe, deu um erro ao processar sua mensagem.');
      }
    }, 600 + Math.random() * 400);
  },
  
  // Limpa texto removendo expressões de cortesia para processamento
  cleanInput(text) {
    return text
      .replace(/\b(pfv|pf|por favor|please|plz|plis|pfvr|porfa)\b/gi, '')
      .replace(/\b(obg|obrigad[oa]|valeu|vlw|thanks|thx)\b/gi, '')
      .trim();
  },
  
  // Detecta se o usuário foi educado/cortês
  detectPoliteness(text) {
    const lower = text.toLowerCase();
    const politeWords = ['pfv', 'pf', 'por favor', 'please', 'plz', 'plis', 'pfvr', 'porfa', 
                         'obrigado', 'obrigada', 'obg', 'valeu', 'vlw', 'thanks', 'thx', 'tmj',
                         'agradeço', 'grato', 'grata', 'gentil'];
    return politeWords.some(word => lower.includes(word));
  },
  
  // Expande abreviações e gírias para melhor compreensão
  expandAbbreviations(text) {
    const abbreviations = {
      'vc': 'você',
      'tb': 'também',
      'tbm': 'também',
      'td': 'tudo',
      'hj': 'hoje',
      'amn': 'amanhã',
      'dps': 'depois',
      'qdo': 'quando',
      'qnd': 'quando',
      'pq': 'porque',
      'oq': 'o que',
      'qto': 'quanto',
      'qt': 'quanto',
      'mto': 'muito',
      'mt': 'muito',
      'msm': 'mesmo',
      'msg': 'mensagem',
      'ctz': 'certeza',
      'blz': 'beleza',
      'flw': 'falou',
      'tmb': 'também',
      'nd': 'nada',
      'ngm': 'ninguém',
      'qlqr': 'qualquer',
      'cmg': 'comigo',
      'ctg': 'contigo',
      'n': 'não',
      's': 'sim',
      'ss': 'sim sim',
      'nn': 'não não',
      'kk': '',  // risada
      'kkk': '', // risada
      'rs': '',  // risada
      'haha': '', // risada
      'slc': '', // interjeição
      'mn': 'mano',
      'mna': 'mana',
      'vdd': 'verdade',
      'fds': 'fim de semana',
      'hrs': 'horas',
      'min': 'minutos',
      'seg': 'segundos',
      'tava': 'estava',
      'to': 'estou',
      'ta': 'está',
      'pra': 'para',
      'pro': 'para o',
      'pros': 'para os',
      'num': 'não',
      'neh': 'né',
      'ne': 'né',
      'bjs': 'beijos',
      'abs': 'abraços',
      'add': 'adicionar',
      'deleta': 'deletar',
      'info': 'informação',
      'gnt': 'gente',
      'vcs': 'vocês',
      'dms': 'demais',
      'fzr': 'fazer',
      'qr': 'quer',
      'tds': 'todos',
      'agr': 'agora',
      'ent': 'então',
      'entt': 'então',
      'entao': 'então',
      'p/': 'para',
      'c/': 'com',
      's/': 'sem'
    };
    
    let result = text.toLowerCase();
    for (const [abbr, full] of Object.entries(abbreviations)) {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      result = result.replace(regex, full);
    }
    return result;
  },
  
  async generateResponse(input) {
    const wasPolite = this.detectPoliteness(input);
    const cleanedInput = this.cleanInput(input);
    const expandedInput = this.expandAbbreviations(cleanedInput);
    const lowerInput = expandedInput.toLowerCase().trim();
    // Intercepta pedidos explícitos de ajuda para evitar iniciar onboarding/perguntas pessoais
    const helpPatterns = [
      'o que você pode', 'o que voce pode', 'o que vc pode', 'o que voce faz', 'o que você faz', 'o que vc faz',
      'o que você pode fazer', 'o que voce pode fazer', 'o que vc pode fazer', 'o que você sabe', 'o que voce sabe'
    ];
    for (const p of helpPatterns) {
      if (lowerInput.includes(p)) return this.getHelpMessage();
    }

    // Intercepta pedidos de piada para evitar flows que peçam idade
    const jokePatterns = ['conte uma piada', 'me conta uma piada', 'conta uma piada', 'piada', 'me faz rir'];
    for (const jp of jokePatterns) {
      if (lowerInput.includes(jp)) {
        const jokes = [
          `Por que o programador usa óculos? 👓 Porque ele não consegue C#! (ver sharp) 😂`,
          `O que o zero disse pro oito? 🎱 "Que cinto maneiro!" 😄`,
          `Por que a matemática está triste? ➗ Porque ela tem muitos problemas! 🤣`,
          `O que é um pontinho verde no canto da sala? 🟢 Uma ervilha de castigo! 😆`
        ];
        return jokes[Math.floor(Math.random() * jokes.length)];
      }
    }
    
    // Salva se foi educado para personalizar resposta
    if (wasPolite) {
      OracleMemory.setProfile('isPolite', true);
    }
    
    // --- HÍBRIDO: tentativa rápida com RAG/LLM antes do fluxo antigo
    try {
      // Intercept quick natural question "o que você pode" to always show help
        const q = input.toLowerCase();
        if (q.includes('o que voc') && q.includes('pode')) {
          return this.getHelpMessage();
        }
        // Intercept finance-help requests
        if (q.includes('ajuda financeira') || q.includes('ajuda nas finanças') || q.includes('ajuda finanças')) {
          return this.getFinanceAssistant();
        }
      if (window.OracleClient && typeof window.OracleClient.understandWithRAG === 'function') {
        const u = await window.OracleClient.understandWithRAG(input, { session: this.sessionState }, { useLLM: false });

        const safe = (obj) => ({
          intent: obj?.intent || 'desconhecido',
          entities: obj?.entities || {},
          confidence: typeof obj?.confidence === 'number' ? obj.confidence : 0,
          reply: obj?.reply || '',
          questions: Array.isArray(obj?.questions) ? obj.questions.slice(0,2) : [],
          actions: Array.isArray(obj?.actions) ? obj.actions : []
        });

        const result = safe(u || {});

        window.OracleTelemetry?.log('understand_result', {
          intent: result.intent,
          confidence: result.confidence,
          hasActions: !!(result.actions && result.actions.length),
          hasQuestions: !!(result.questions && result.questions.length)
        });

        if (result.questions && result.questions.length > 0) {
          const sessionId = result.session || (this.sessionState && (this.sessionState.id || this.sessionState.sessionId));
          this.pendingAction = { type: 'slot_fill', originalInput: input, understand: result, awaiting: result.questions, collectedAnswers: [], session: sessionId || null };
          window.OracleTelemetry?.log('pending_questions', { count: result.questions.length });
          return { message: result.questions.map(q => `❓ ${q}`).join('\n'), actions: [] };
        }

        if (result.actions && result.actions.length > 0 && result.confidence >= 0.7) {
          window.OracleTelemetry?.log('action_execute_attempt', { count: result.actions.length, types: result.actions.map(a => a.type) });
          try {
            await processOracleActions(result.actions);
            const okMsg = result.reply || 'Feito ✅';
            window.OracleTelemetry?.log('action_execute', { count: result.actions.length, types: result.actions.map(a => a.type) });
            return { message: okMsg, actions: [] };
          } catch (e) {
            console.error('Erro ao executar actions:', e);
            window.OracleTelemetry?.log('action_execute_error', { msg: String(e?.message || e) });
            return { message: 'Tentei executar a ação, mas deu erro. Quer que eu tente novamente?', actions: [] };
          }
        }

        if (result.reply && result.confidence >= 0.6) {
          return { message: result.reply, actions: [] };
        }
        if (result.intent === 'desconhecido') {
          window.OracleTelemetry?.log('fallback', { text: String(input).slice(0,80) });
        }
      }
    } catch (err) {
      console.warn('understandWithRAG falhou:', err);
    }
    
    // -1. VERIFICA COMANDOS PERSONALIZADOS DOS SCRIPTS
    const scriptResponse = OracleScript.checkCustomCommand(lowerInput);
    if (scriptResponse) {
      return scriptResponse;
    }
    
    // 0. PRIMEIRO: Verifica se há ação pendente aguardando resposta
    if (this.pendingAction) {
      const pendingResult = await this.handlePendingAction(cleanedInput, lowerInput);
      if (pendingResult) return pendingResult;
    }
    
    // Comando explícito para sair do modo conversa (virar assistente)
    if (lowerInput.match(/^(parar conversa|modo assistente|chega de papo|virar assistente|focar|sem papo|sair do modo conversa)/i)) {
        return this.stopConversationMode();
    }
    
    // 0.05. VERIFICAÇÃO DE AMBIGUIDADE (Meta vs Tarefa)
    const isAmbiguousMeta = lowerInput.match(/\b(meta)\b/i) && !lowerInput.match(/financeira|dinheiro|grana|economia|juntar|guardar|poupar|reserva|reais|r\$/i);

    if (isAmbiguousMeta && !this.pendingAction) {
        const originalInputForAction = input; // Captura para o escopo da ação
        this.pendingAction = { type: 'clarify_meta', originalInput: originalInputForAction };
        return {
            message: `Quando você diz "meta", quer criar uma <strong>meta financeira</strong> (para juntar dinheiro) ou uma <strong>tarefa</strong>?`,
            actions: [
                { text: '💰 Meta Financeira', action: () => {
                    this.pendingAction = null;
                    const response = this.createFinancialGoal();
                    addBotMessage(response.message, response.actions);
                }},
                { text: '📝 Tarefa', action: () => {
                    this.pendingAction = null;
                    const taskText = originalInputForAction.replace(/^(criar|fazer|nova|minha)\s+/i, '').trim();
                    const response = createTask(taskText);
                    addBotMessage(response);
                }}
            ]
        };
    }

    // 0.1. DETECÇÃO DE INTENÇÕES PRIORITÁRIAS (Comandos diretos)
    // Primeiro tenta um NLU rápido do `OracleBrain` (fallback por palavras-chave) para respostas imediatas
    let nluResult;
    try {
      if (window.OracleBrain && typeof window.OracleBrain.keywordFallback === 'function') {
        const br = window.OracleBrain.keywordFallback(input);
        const mapping = {
          'criar_tarefa': 'task.create',
          'listar_tarefas': 'task.list',
          'saudacao': 'saudacao',
          'desconhecido': 'unknown'
        };
        if (br && br.intent && (br.confidence || 0) >= 0.5) {
          nluResult = { intent: mapping[br.intent] || br.intent, confidence: br.confidence || 0.5, entities: br.entities || {} };
        } else {
          nluResult = OracleNLU.detectIntent(input);
        }
      } else {
        nluResult = OracleNLU.detectIntent(input);
      }
    } catch (e) {
      console.warn('Erro ao usar OracleBrain.keywordFallback, fallback para OracleNLU', e);
      nluResult = OracleNLU.detectIntent(input);
    }
    const isPriorityIntent = nluResult.intent !== 'unknown' && 
                             nluResult.confidence > 0.8 && 
                             !['memory.save'].includes(nluResult.intent);

    if (isPriorityIntent) {
      const intentResponse = this.executeIntent(nluResult);
      if (intentResponse) return intentResponse;
    }
    
    // 0.5. MODO CONVERSA (Prioridade sobre detecção automática)
    // Se o Oráculo fez uma pergunta específica, a resposta deve ser processada nesse contexto
    const conversationResult = this.handleConversationResponses(lowerInput);
    if (conversationResult) return conversationResult;
    
    // 1. DETECÇÃO AUTOMÁTICA de informações pessoais (sempre roda primeiro)
    const autoLearnResult = this.autoLearnFromInput(cleanedInput, lowerInput);
    if (autoLearnResult) return autoLearnResult;
    
    // 1.5 GERAÇÃO DE IMAGEM
    const imageResult = this.handleImageGeneration(lowerInput, cleanedInput);
    if (imageResult) return imageResult;
    
    // 1.6 EDUCAÇÃO FINANCEIRA
    const financeEducationResult = this.handleFinanceEducation(lowerInput);
    if (financeEducationResult) return financeEducationResult;
    
    // 2. USA O SISTEMA NLU PARA DETECTAR INTENÇÃO AUTOMATICAMENTE (Restante)
    if (nluResult.intent !== 'unknown' && nluResult.confidence > 0.5) {
      const intentResponse = this.executeIntent(nluResult);
      if (intentResponse) return intentResponse;
    }
    
    // 3. Comandos de AÇÃO (criar, adicionar, registrar) - fallback
    const actionResult = this.handleActionCommands(lowerInput, cleanedInput);
    if (actionResult) return actionResult;
    
    // 4. Consultas de INFORMAÇÃO
    const infoResult = this.handleInfoQueries(lowerInput);
    if (infoResult) return infoResult;
    
    // 5. Comandos de MEMÓRIA (lembrar, aprender)
    const memoryResult = this.handleMemoryCommands(lowerInput, cleanedInput);
    if (memoryResult) return memoryResult;
    
    // 6. Interações SOCIAIS
    const socialResult = this.handleSocialInteractions(lowerInput);
    if (socialResult) return socialResult;
    
    // 7. Ajuda
    if (lowerInput.includes('ajuda') || lowerInput.includes('help') || lowerInput === '?') {
      return this.getHelpMessage();
    }
    
    // 8. Resposta padrão inteligente
    return this.getSmartDefault(lowerInput);
  },
  
  // === SISTEMA DE GERAÇÃO DE IMAGENS ===
  handleImageGeneration(lowerInput, originalInput) {
    // Detecta pedidos de imagem
    const imagePatterns = [
      /(?:gera|gerar|cria|criar|faz|fazer|mostra|mostrar|desenha|desenhar)\s+(?:uma?\s+)?(?:imagem|foto|figura|desenho|ilustração)\s+(?:de|do|da|sobre|com)?\s*(.+)/i,
      /(?:quero|preciso de)\s+(?:uma?\s+)?(?:imagem|foto|figura)\s+(?:de|do|da|sobre|com)?\s*(.+)/i,
      /(?:me\s+)?(?:mostra|desenha)\s+(?:um|uma)?\s*(.+)/i
    ];
    
    for (const pattern of imagePatterns) {
      const match = originalInput.match(pattern);
      if (match && match[1]) {
        const prompt = match[1].trim();
        return this.generateImage(prompt);
      }
    }
    
    return null;
  },
  
  generateImage(prompt) {
    const name = OracleMemory.getProfile('name') || 'amigo';
    
    // Usa Pollinations AI (API gratuita de geração de imagens)
    const encodedPrompt = encodeURIComponent(prompt + ', high quality, detailed, beautiful');
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true`;
    
    // Imagens alternativas para conceitos abstratos
    const conceptImages = {
      motivação: 'https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=512',
      sucesso: 'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?w=512',
      paz: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=512',
      natureza: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=512',
      amor: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=512',
      trabalho: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=512',
      dinheiro: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=512',
      estudo: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=512'
    };
    
    // Verifica se é um conceito conhecido
    let finalUrl = imageUrl;
    const lowerPrompt = prompt.toLowerCase();
    for (const [concept, url] of Object.entries(conceptImages)) {
      if (lowerPrompt.includes(concept)) {
        finalUrl = url;
        break;
      }
    }
    
    return {
      message: `🎨 Aqui está, ${name}! Gerando uma imagem de "<strong>${prompt}</strong>":<br><br>
        <div class="oracle-image-container">
          <img src="${finalUrl}" alt="${prompt}" class="oracle-generated-image" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=512'" />
        </div>
        <br><small style="opacity:0.7">💡 Dica: Posso gerar outras imagens! Só pedir.</small>`,
      actions: [
        { text: '🔄 Gerar outra versão', action: () => { 
          const newUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}&seed=${Date.now()}`;
          const img = document.querySelector('.oracle-generated-image');
          if (img) img.src = newUrl;
          addBotMessage('🎨 Nova versão gerada! Atualizando imagem...');
        }},
        { text: '💾 Salvar', action: () => {
          window.open(finalUrl, '_blank');
          addBotMessage('✅ Abrindo imagem em nova aba para você salvar!');
        }}
      ]
    };
  },
  
  // === SISTEMA DE EDUCAÇÃO FINANCEIRA ===
  handleFinanceEducation(lowerInput) {
    const name = OracleMemory.getProfile('name') || 'amigo';
    
    // Dicas financeiras
    if (lowerInput.match(/dica|conselho|sugestão|como\s+(economizar|poupar|investir|ganhar|guardar|juntar)/i)) {
      return this.getFinancialTip();
    }
    
    // Metas financeiras
    if (lowerInput.match(/meta\s+financeira|objetivo\s+financeiro|criar\s+meta|definir\s+meta|quero\s+(?:ter|fazer|criar|montar)\s+(?:uma\s+)?(?:reserva|poupança|economia)/i)) {
      return this.createFinancialGoal();
    }
    
    // Análise de gastos
    if (lowerInput.match(/analis[ae]|analise\s+(?:meus?\s+)?(?:gastos?|despesas?|finanças)|onde\s+(?:eu\s+)?(?:gasto|gastei)/i)) {
      return this.analyzeSpending();
    }
    
    // Ensinar sobre finanças
    if (lowerInput.match(/(?:me\s+)?(?:ensina|explica|ensine|explique)\s+(?:sobre\s+)?(?:finanças|investir|investimento|poupança|juros|renda\s+fixa|ações|tesouro|cdb|lci|lca)/i)) {
      return this.teachFinance(lowerInput);
    }
    
    // Calculadora de objetivos
    if (lowerInput.match(/(?:quanto|como)\s+(?:preciso|devo)\s+(?:guardar|economizar|juntar|poupar)/i)) {
      return this.calculateSavings(lowerInput);
    }
    
    // Diagnóstico financeiro
    if (lowerInput.match(/(?:como\s+)?(?:estou|está|tá)\s+(?:minha\s+)?(?:saúde|situação)\s+financeira|diagnóstico/i)) {
      return this.getFinancialDiagnosis();
    }
    
    return null;
  },
  
  getFinancialTip() {
    const name = OracleMemory.getProfile('name') || 'amigo';
    
    const tips = [
      {
        title: '💰 Regra 50/30/20',
        content: `${name}, uma das melhores formas de organizar seu dinheiro é a regra 50/30/20:<br><br>
          • <strong>50%</strong> para necessidades (moradia, comida, contas)<br>
          • <strong>30%</strong> para desejos (lazer, compras, hobbies)<br>
          • <strong>20%</strong> para poupança e investimentos<br><br>
          📊 Quer que eu analise seus gastos para ver como você está?`,
        actions: [
          { text: '📊 Analisar meus gastos', action: () => addBotMessage(this.analyzeSpending()) },
          { text: '💡 Mais dicas', action: () => addBotMessage(this.getFinancialTip()) }
        ]
      },
      {
        title: '🎯 Pague-se Primeiro',
        content: `${name}, essa é uma das dicas de ouro dos milionários:<br><br>
          Assim que receber seu salário, <strong>IMEDIATAMENTE</strong> separe pelo menos 10% para você mesmo (poupança/investimento).<br><br>
          💡 Não espere sobrar dinheiro. Separe antes de gastar!<br><br>
          "Não é sobre quanto você ganha, mas quanto você guarda." - Warren Buffett`,
        actions: [
          { text: '📈 Como investir?', action: () => addBotMessage(this.teachFinance('investimento')) },
          { text: '💡 Mais dicas', action: () => addBotMessage(this.getFinancialTip()) }
        ]
      },
      {
        title: '📱 Automatize suas Finanças',
        content: `${name}, a automação é o segredo para economizar sem esforço:<br><br>
          1. <strong>Débito automático</strong> nas contas fixas<br>
          2. <strong>Transferência automática</strong> para poupança no dia do pagamento<br>
          3. <strong>Investimento automático</strong> mensal em fundos ou Tesouro<br><br>
          🧠 Assim você não precisa de força de vontade - acontece sozinho!`,
        actions: [
          { text: '🎯 Criar meta', action: () => addBotMessage(this.createFinancialGoal()) },
          { text: '💡 Mais dicas', action: () => addBotMessage(this.getFinancialTip()) }
        ]
      },
      {
        title: '🛒 Regra das 24 Horas',
        content: `${name}, antes de qualquer compra não essencial acima de R$ 100:<br><br>
          ⏰ <strong>Espere 24 horas!</strong><br><br>
          Se depois de 24h você ainda quiser, ok, compre. Mas na maioria das vezes, o impulso passa.<br><br>
          💡 Isso evita gastos por emoção e economiza centenas por mês!`,
        actions: [
          { text: '📊 Ver meus gastos', action: () => addBotMessage(this.analyzeSpending()) },
          { text: '💡 Mais dicas', action: () => addBotMessage(this.getFinancialTip()) }
        ]
      },
      {
        title: '🏦 Fundo de Emergência',
        content: `${name}, antes de investir, tenha uma <strong>reserva de emergência</strong>!<br><br>
          📋 Ideal: <strong>6 meses</strong> de gastos mensais<br>
          📋 Mínimo: <strong>3 meses</strong> de gastos mensais<br><br>
          Onde deixar? <strong>Tesouro Selic</strong> ou <strong>CDB com liquidez diária</strong>.<br><br>
          ⚠️ Nunca invista em renda variável sem ter esse colchão!`,
        actions: [
          { text: '🎯 Calcular minha reserva', action: () => addBotMessage(this.calculateEmergencyFund()) },
          { text: '💡 Mais dicas', action: () => addBotMessage(this.getFinancialTip()) }
        ]
      },
      {
        title: '💳 Fuja das Dívidas',
        content: `${name}, dívidas são o maior inimigo da riqueza!<br><br>
          🔴 <strong>Evite a todo custo:</strong><br>
          • Cartão de crédito rotativo (400%+ ao ano!)<br>
          • Cheque especial (300%+ ao ano!)<br>
          • Empréstimo pessoal (100%+ ao ano!)<br><br>
          Se já está endividado: <strong>NEGOCIE!</strong> Bancos preferem receber com desconto do que não receber.`,
        actions: [
          { text: '📊 Diagnóstico financeiro', action: () => addBotMessage(this.getFinancialDiagnosis()) },
          { text: '💡 Mais dicas', action: () => addBotMessage(this.getFinancialTip()) }
        ]
      }
    ];
    
    const tip = tips[Math.floor(Math.random() * tips.length)];
    return {
      message: `<strong>${tip.title}</strong><br><br>${tip.content}`,
      actions: tip.actions
    };
  },
  
  teachFinance(topic) {
    const name = OracleMemory.getProfile('name') || 'amigo';
    const lower = topic.toLowerCase();
    
    const lessons = {
      investimento: {
        title: '📈 Introdução a Investimentos',
        content: `${name}, vou te ensinar o básico de investimentos!<br><br>
          <strong>1. Renda Fixa</strong> (menor risco):<br>
          • Tesouro Direto (governo)<br>
          • CDB (bancos)<br>
          • LCI/LCA (isentos de IR)<br><br>
          <strong>2. Renda Variável</strong> (maior risco/retorno):<br>
          • Ações (partes de empresas)<br>
          • Fundos Imobiliários (FIIs)<br>
          • ETFs (cestas de ações)<br><br>
          💡 <strong>Dica:</strong> Comece pela renda fixa e vá diversificando!`
      },
      tesouro: {
        title: '🏛️ Tesouro Direto',
        content: `${name}, o Tesouro Direto é um dos investimentos mais seguros do Brasil!<br><br>
          <strong>Tipos:</strong><br>
          • <strong>Tesouro Selic:</strong> Melhor para reserva de emergência<br>
          • <strong>Tesouro IPCA+:</strong> Protege contra inflação (longo prazo)<br>
          • <strong>Tesouro Prefixado:</strong> Taxa fixa combinada<br><br>
          💰 <strong>Mínimo:</strong> ~R$ 30<br>
          📊 <strong>Rentabilidade:</strong> ~13% ao ano (2024)<br>
          ✅ <strong>Garantia:</strong> Governo Federal`
      },
      acoes: {
        title: '📊 Mercado de Ações',
        content: `${name}, ações são partes de empresas!<br><br>
          <strong>Como ganhar:</strong><br>
          • <strong>Valorização:</strong> Comprar barato, vender caro<br>
          • <strong>Dividendos:</strong> Parte do lucro das empresas<br><br>
          <strong>Dicas para iniciantes:</strong><br>
          1. Comece com pouco (R$ 100-500)<br>
          2. Estude as empresas antes<br>
          3. Pense no longo prazo (5+ anos)<br>
          4. Diversifique (várias empresas)<br><br>
          ⚠️ <strong>Atenção:</strong> Pode perder dinheiro! Só invista o que pode perder.`
      },
      poupanca: {
        title: '💰 Por que NÃO deixar na Poupança',
        content: `${name}, a poupança é o pior investimento!<br><br>
          <strong>Rendimento atual:</strong> ~6% ao ano<br>
          <strong>Inflação média:</strong> ~5% ao ano<br>
          <strong>Resultado:</strong> Você ganha só 1% real! 😢<br><br>
          <strong>Alternativas MELHORES e seguras:</strong><br>
          • Tesouro Selic: ~13% ao ano<br>
          • CDB 100% CDI: ~13% ao ano<br>
          • LCI/LCA: ~10% ao ano (isento de IR)<br><br>
          💡 Todos tão seguros quanto a poupança, mas rendem MUITO mais!`
      },
      juros: {
        title: '🔢 Juros Compostos - A 8ª Maravilha',
        content: `${name}, Einstein disse: "Os juros compostos são a oitava maravilha do mundo!"<br><br>
          <strong>Exemplo prático:</strong><br>
          R$ 1.000/mês por 30 anos a 10% ao ano:<br>
          • Total investido: R$ 360.000<br>
          • Valor final: <strong>R$ 2.280.000</strong>!<br><br>
          O segredo é: <strong>TEMPO + CONSISTÊNCIA</strong><br><br>
          💡 Quanto mais cedo começar, melhor!`
      }
    };
    
    // Encontra a lição apropriada
    let lesson = lessons.investimento; // padrão
    if (lower.includes('tesouro')) lesson = lessons.tesouro;
    else if (lower.includes('ação') || lower.includes('ações') || lower.includes('acoes')) lesson = lessons.acoes;
    else if (lower.includes('poupança') || lower.includes('poupanca')) lesson = lessons.poupanca;
    else if (lower.includes('juros')) lesson = lessons.juros;
    
    return {
      message: `<strong>${lesson.title}</strong><br><br>${lesson.content}`,
      actions: [
        { text: '📚 Outro tema', action: () => {
          addBotMessage({
            message: `O que você quer aprender, ${name}?`,
            actions: [
              { text: '📈 Investimentos', action: () => addBotMessage(this.teachFinance('investimento')) },
              { text: '🏛️ Tesouro Direto', action: () => addBotMessage(this.teachFinance('tesouro')) },
              { text: '📊 Ações', action: () => addBotMessage(this.teachFinance('acoes')) },
              { text: '🔢 Juros Compostos', action: () => addBotMessage(this.teachFinance('juros')) }
            ]
          });
        }},
        { text: '💡 Dicas práticas', action: () => addBotMessage(this.getFinancialTip()) }
      ]
    };
  },
  
  createFinancialGoal() {
    const name = OracleMemory.getProfile('name') || 'amigo';
    
    this.pendingAction = null; // Limpa ação anterior
    
    return {
      message: `🎯 Vamos criar uma meta financeira, ${name}!<br><br>Gostaria de falar suas receitas e contas para somarmos e criar sua meta juntos?`,
      actions: [
        { text: '🧮 Sim, calcular juntos', action: () => { 
            this.pendingAction = { type: 'guided_goal_income' }; 
            addBotMessage('Ótimo! Para começar, qual é a sua **renda mensal média** (salário + extras)?'); 
        }},
        { text: '📝 Não, já tenho o valor', action: () => { 
            this.pendingAction = { type: 'financial_goal_name' }; 
            addBotMessage('Entendi! Qual é o nome do seu objetivo? (Ex: "Comprar um carro", "Reserva")'); 
        }}
      ]
    };
  },
  
  analyzeSpending() {
    const name = OracleMemory.getProfile('name') || 'amigo';
    
    if (!gameState || !gameState.finances || gameState.finances.length < 3) {
      return `${name}, você ainda não tem gastos suficientes registrados para eu analisar. 📊<br><br>
        Continue registrando seus gastos dizendo coisas como:<br>
        • "gastei 50 no almoço"<br>
        • "paguei 100 de luz"<br><br>
        Quando tiver pelo menos 10 registros, volte aqui!`;
    }
    
    const expenses = gameState.finances.filter(f => f.type === 'expense');
    const totalExpenses = expenses.reduce((sum, e) => sum + e.value, 0);
    
    // Agrupa por categoria
    const byCategory = {};
    expenses.forEach(e => {
      const cat = e.category || 'Outros';
      byCategory[cat] = (byCategory[cat] || 0) + e.value;
    });
    
    // Ordena por valor
    const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    
    // Calcula porcentagens
    let response = `<strong>📊 Análise dos seus gastos, ${name}:</strong><br><br>`;
    response += `💸 <strong>Total gasto:</strong> R$ ${totalExpenses.toFixed(2)}<br><br>`;
    response += `<strong>Por categoria:</strong><br>`;
    
    sorted.forEach(([cat, value]) => {
      const percent = ((value / totalExpenses) * 100).toFixed(1);
      const bar = '█'.repeat(Math.round(percent / 5)) + '░'.repeat(20 - Math.round(percent / 5));
      response += `• ${cat}: <strong>R$ ${value.toFixed(2)}</strong> (${percent}%)<br>`;
      response += `<span style="font-family: monospace; font-size: 10px; opacity: 0.7;">${bar}</span><br>`;
    });
    
    // Dica personalizada
    const topCategory = sorted[0][0];
    response += `<br>💡 <strong>Insight:</strong> Você gasta mais com <strong>${topCategory}</strong>. `;
    
    if (topCategory === 'Alimentação') {
      response += 'Considere cozinhar mais em casa ou levar marmita!';
    } else if (topCategory === 'Lazer') {
      response += 'Lazer é importante, mas verifique se não está exagerando.';
    } else if (topCategory === 'Transporte') {
      response += 'Avalie alternativas como carona, bike ou transporte público.';
    } else {
      response += 'Veja se pode reduzir ou negociar melhores preços.';
    }
    
    return response;
  },
  
  calculateEmergencyFund() {
    const name = OracleMemory.getProfile('name') || 'amigo';
    
    if (!gameState || !gameState.finances) {
      return `${name}, preciso conhecer seus gastos mensais primeiro. Registre alguns gastos e eu calculo sua reserva ideal!`;
    }
    
    // Estima gastos mensais baseado nos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentExpenses = gameState.finances
      .filter(f => f.type === 'expense' && new Date(f.date) >= thirtyDaysAgo)
      .reduce((sum, e) => sum + e.value, 0);
    
    const monthlyExpenses = recentExpenses || 3000; // Estimativa padrão
    const emergencyFund = monthlyExpenses * 6;
    
    return `<strong>🛡️ Calculadora de Reserva de Emergência</strong><br><br>
      📊 Baseado nos seus gastos:<br>
      • Gastos mensais estimados: <strong>R$ ${monthlyExpenses.toFixed(2)}</strong><br><br>
      
      🎯 <strong>Sua reserva ideal:</strong><br>
      • Mínimo (3 meses): <strong>R$ ${(monthlyExpenses * 3).toFixed(2)}</strong><br>
      • Ideal (6 meses): <strong>R$ ${emergencyFund.toFixed(2)}</strong><br><br>
      
      💡 <strong>Onde guardar:</strong> Tesouro Selic ou CDB com liquidez diária.<br>
      ⏰ <strong>Meta mensal sugerida:</strong> R$ ${(emergencyFund / 12).toFixed(2)}/mês para ter em 1 ano!`;
  },
  
  getFinancialDiagnosis() {
    const name = OracleMemory.getProfile('name') || 'amigo';
    
    if (!gameState || !gameState.finances || gameState.finances.length < 5) {
      return `${name}, preciso de mais dados para fazer um diagnóstico. Continue registrando suas finanças! 📊`;
    }
    
    const finances = gameState.finances;
    const income = finances.filter(f => f.type === 'income').reduce((sum, f) => sum + f.value, 0);
    const expenses = finances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.value, 0);
    const balance = income - expenses;
    const savingsRate = income > 0 ? ((balance / income) * 100) : 0;
    
    let diagnosis, emoji, color;
    
    if (savingsRate >= 20) {
      diagnosis = 'EXCELENTE';
      emoji = '🏆';
      color = '#4CAF50';
    } else if (savingsRate >= 10) {
      diagnosis = 'BOA';
      emoji = '✅';
      color = '#8BC34A';
    } else if (savingsRate >= 0) {
      diagnosis = 'ATENÇÃO';
      emoji = '⚠️';
      color = '#FF9800';
    } else {
      diagnosis = 'CRÍTICA';
      emoji = '🚨';
      color = '#f44336';
    }
    
    return `<strong>🏥 Diagnóstico Financeiro</strong><br><br>
      
      <div style="text-align: center; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px; margin: 10px 0;">
        <span style="font-size: 40px;">${emoji}</span><br>
        <strong style="color: ${color}; font-size: 20px;">Saúde ${diagnosis}</strong>
      </div><br>
      
      📊 <strong>Seus números:</strong><br>
      • Receitas: <strong style="color: #4CAF50">R$ ${income.toFixed(2)}</strong><br>
      • Despesas: <strong style="color: #f44336">R$ ${expenses.toFixed(2)}</strong><br>
      • Saldo: <strong style="color: ${balance >= 0 ? '#4CAF50' : '#f44336'}">R$ ${balance.toFixed(2)}</strong><br>
      • Taxa de poupança: <strong>${savingsRate.toFixed(1)}%</strong><br><br>
      
      💡 <strong>Recomendação:</strong> ${
        savingsRate >= 20 ? 'Continue assim! Considere investir o excedente.' :
        savingsRate >= 10 ? 'Bom trabalho! Tente aumentar para 20%.' :
        savingsRate >= 0 ? 'Tente cortar gastos supérfluos para poupar mais.' :
        'Urgente! Reduza despesas ou aumente renda. Evite dívidas!'
      }`;
  },
  
  calculateSavings(lowerInput) {
    const name = OracleMemory.getProfile('name') || 'amigo';
    
    // Tenta extrair um valor do input se houver (ex: "para juntar 5000")
    const match = lowerInput.match(/(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/);
    let targetValue = 0;
    let isSystemGoal = false;
    
    if (match) {
      targetValue = parseFloat(match[1].replace(',', '.'));
    } else {
      // Se não tem valor no input, usa a meta definida
      targetValue = gameState.financialGoal || 0;
      isSystemGoal = true;
    }
    
    if (targetValue <= 0) {
      return `${name}, para eu calcular, preciso saber qual é sua meta! 🎯<br><br>
        Diga algo como: "quanto guardar para juntar 5000" ou defina uma meta financeira na aba de Finanças.`;
    }
    
    // Se for a meta do sistema, considera o que já tem guardado (saldo atual)
    let currentBalance = 0;
    if (isSystemGoal) {
       const finances = gameState.finances || [];
       const income = finances.filter(f => f.type === 'income').reduce((sum, f) => sum + f.value, 0);
       const expenses = finances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.value, 0);
       currentBalance = Math.max(0, income - expenses);
    }
    
    const remaining = Math.max(0, targetValue - currentBalance);
    
    if (remaining === 0 && isSystemGoal) {
      return `🎉 ${name}, você já atingiu sua meta de R$ ${targetValue.toLocaleString('pt-BR')}! Parabéns!`;
    }
    
    // Cálculo para 1 ano (12 meses)
    const months = 12;
    const monthly = remaining / months;
    const weekly = remaining / 52;
    
    return `<strong>💰 Plano para atingir R$ ${targetValue.toLocaleString('pt-BR')} em 1 ano:</strong><br><br>
      ${isSystemGoal ? `Saldo atual: R$ ${currentBalance.toLocaleString('pt-BR')}<br>Faltam: R$ ${remaining.toLocaleString('pt-BR')}<br><br>` : ''}
      Para chegar lá em 12 meses, você precisa guardar:<br>
      🗓️ <strong>R$ ${monthly.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong> por mês<br>
      📅 <strong>R$ ${weekly.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong> por semana<br><br>
      💡 <em>Dica: Configure uma transferência automática desse valor no dia do seu pagamento!</em>`;
  },

  // Executa a intenção detectada pelo NLU
  executeIntent(nluResult) {
    const { intent, data } = nluResult;
    const name = OracleMemory.getProfile('name');
    const gender = OracleMemory.getProfile('gender');
    const treatment = gender === 'male' ? 'cara' : gender === 'female' ? 'querida' : (name || 'amigo');
    
    switch (intent) {
      case 'task.create':
        if (data.title) {
          return this.createTaskWithDetails(data);
        }
        // Se não tem título, pergunta
        this.pendingAction = { type: 'task_name' };
        return `Claro, ${treatment}! 📝 Qual tarefa você quer criar?`;
        
      case 'task.complete':
        return this.completeTask(data.taskName);
        
      case 'finance.expense':
        // Se o NLU não extraiu um valor, pergunta primeiro
        if (data.amount === null) {
          this.pendingAction = { type: 'expense_amount' };
          return `Ok, ${treatment}! 💸 Qual foi o valor do gasto?`;
        }

        if (data.amount) {
          if (data.description) {
            return this.addExpense(data.amount, data.description);
          }
          // Se não tem descrição, pergunta
          this.pendingAction = { type: 'expense_description', value: data.amount };
          return {
            message: `Beleza, ${treatment}! 💸 Vou registrar <strong>R$ ${data.amount.toFixed(2)}</strong> de saída.<br><br>Qual nome devo colocar nessa despesa?`,
            actions: [
              { text: '🍔 Alimentação', action: () => { this.pendingAction = null; this.addBotMessage(this.addExpense(data.amount, 'Alimentação')); } },
              { text: '🚗 Transporte', action: () => { this.pendingAction = null; this.addBotMessage(this.addExpense(data.amount, 'Transporte')); } },
              { text: '🎮 Lazer', action: () => { this.pendingAction = null; this.addBotMessage(this.addExpense(data.amount, 'Lazer')); } },
              { text: '🛒 Compras', action: () => { this.pendingAction = null; this.addBotMessage(this.addExpense(data.amount, 'Compras')); } }
            ]
          };
        }
        return null;
        
      case 'finance.income':
        if (data.amount) {
          if (data.description) {
            return this.addIncome(data.amount, data.description);
          }
          this.pendingAction = { type: 'income_description', value: data.amount };
          return {
            message: `Show, ${treatment}! 💰 Vou registrar <strong>R$ ${data.amount.toFixed(2)}</strong> de entrada.<br><br>De onde veio essa grana?`,
            actions: [
              { text: '💼 Salário', action: () => { this.pendingAction = null; this.addBotMessage(this.addIncome(data.amount, 'Salário')); } },
              { text: '💻 Freelance', action: () => { this.pendingAction = null; this.addBotMessage(this.addIncome(data.amount, 'Freelance')); } },
              { text: '🎁 Presente', action: () => { this.pendingAction = null; this.addBotMessage(this.addIncome(data.amount, 'Presente')); } }
            ]
          };
        }
        return null;
        
      case 'work.start':
        if (window.WorkTimer && !window.WorkTimer.isRunning()) {
          window.WorkTimer.start();
          return this.getSuccessMessage() + " Timer de trabalho iniciado! ⏱️ Bom trabalho!";
        } else if (window.WorkTimer?.isRunning()) {
          return "⏱️ O timer já está rodando! Quando terminar, é só pedir pra parar.";
        }
        return "Não consegui iniciar o timer. Tente pela aba de Trabalho.";
        
      case 'work.stop':
        if (window.WorkTimer?.isRunning()) {
          window.WorkTimer.stop();
          return this.getSuccessMessage() + " Timer finalizado! Descanse um pouco! 😊";
        }
        return "⏱️ O timer não está rodando no momento.";
        
      case 'status.show':
        return this.getStatusInfo();
        
      case 'finance.summary':
        return this.getFinanceSummary();
        
      case 'task.list':
        return this.getTasksList();
        
      case 'finance.goal':
        return this.createFinancialGoal();

      // HANDLERS DOS NOVOS INTENTS
      case 'utility.calc':
        const { n1, op, n2 } = data;
        let res = 0;
        let opSymbol = '';
        if (['+', 'mais'].includes(op)) { res = n1 + n2; opSymbol = '+'; }
        else if (['-', 'menos'].includes(op)) { res = n1 - n2; opSymbol = '-'; }
        else if (['*', 'x', 'vezes'].includes(op)) { res = n1 * n2; opSymbol = '×'; }
        else if (['/', 'dividido por'].includes(op)) { res = n1 / n2; opSymbol = '÷'; }
        
        const formattedRes = Number.isInteger(res) ? res : parseFloat(res.toFixed(2));
        return `🔢 A conta é: <strong>${n1} ${opSymbol} ${n2} = ${formattedRes}</strong>`;

      case 'utility.decision':
        if (data.type === 'coin') {
          const result = Math.random() < 0.5 ? 'Cara 👑' : 'Coroa 🦅';
          return `🪙 Joguei a moeda e deu... <strong>${result}</strong>!`;
        }
        if (data.type === 'dice') {
          const sides = parseInt(data.sides) || 6;
          const result = Math.floor(Math.random() * sides) + 1;
          return `🎲 Rolei um D${sides} e caiu: <strong>${result}</strong>!`;
        }
        if (data.type === 'choice') {
          const choice = data.options[Math.floor(Math.random() * data.options.length)].trim();
          const phrases = [
            `🤔 Hmmm... eu escolheria <strong>${choice}</strong>!`,
            `Entre esses, prefiro <strong>${choice}</strong>! ✨`,
            `🎲 O destino diz: <strong>${choice}</strong>!`
          ];
          return phrases[Math.floor(Math.random() * phrases.length)];
        }
        return null;

      case 'utility.date':
        const now = new Date();
        const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const date = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        return `📅 Hoje é <strong>${date}</strong>.<br>⌚ Agora são <strong>${time}</strong>.`;

      case 'system.clear':
        const messages = document.getElementById('chatMessages');
        if (messages) {
          messages.innerHTML = '';
          this.showWelcome();
          return null;
        }
        return "Não consegui limpar o chat.";

      case 'memory.save':
        if (data.type === 'relationship' && data.key && data.value) {
          // Salva relacionamento de forma estruturada
          OracleMemory.setProfile(data.key, data.value);
          OracleMemory.learn(data.fact);
          
          const relationLabels = {
            namorada: 'sua namorada',
            namorado: 'seu namorado',
            esposa: 'sua esposa',
            esposo: 'seu esposo/marido',
            mae: 'sua mãe',
            pai: 'seu pai',
            melhorAmigo: 'seu melhor amigo(a)',
            pet: 'seu pet',
            aniversario: 'seu aniversário'
          };
          
          const label = relationLabels[data.key] || data.key;
          return `💕 Anotado! ${data.value} é ${label}. Vou lembrar disso!`;
        }
        
        if (data.fact) {
          OracleMemory.learn(data.fact);
          return `🧠 Anotado! Vou lembrar disso: "${data.fact}"`;
        }
        return null;
        
      case 'memory.query':
        return this.answerMemoryQuery(data.queryType);
        
      default:
        return null;
    }
  },
  
  // Responde perguntas sobre memórias salvas
  answerMemoryQuery(queryType) {
    const name = OracleMemory.getProfile('name');
    const treatment = name || 'amigo';
    
    if (queryType === 'all') {
      // Lista tudo que sabe sobre o usuário
      const profile = OracleMemory.data?.profile || {};
      const memories = OracleMemory.data?.learned || [];
      
      let response = `<strong>🧠 O que sei sobre você, ${treatment}:</strong><br><br>`;
      
      const labels = {
        name: '👤 Nome',
        gender: '⚧ Gênero',
        namorada: '💕 Namorada',
        namorado: '💕 Namorado',
        esposa: '💍 Esposa',
        esposo: '💍 Esposo',
        mae: '👩 Mãe',
        pai: '👨 Pai',
        melhorAmigo: '🤝 Melhor amigo(a)',
        pet: '🐾 Pet',
        aniversario: '🎂 Aniversário',
        birthday: '🎂 Aniversário'
      };
      
      let hasInfo = false;
      for (const [key, value] of Object.entries(profile)) {
        if (value && labels[key]) {
          response += `${labels[key]}: <strong>${value}</strong><br>`;
          hasInfo = true;
        }
      }
      
      if (memories.length > 0) {
        response += `<br><strong>📝 Coisas que você me contou:</strong><br>`;
        memories.slice(-5).forEach(m => {
          response += `• ${m.text}<br>`;
        });
        hasInfo = true;
      }
      
      if (!hasInfo) {
        return `Ainda não sei muito sobre você, ${treatment}. Me conta mais! Por exemplo: "lembre-se que eu namoro com [nome]" ou "meu aniversário é dia [data]"`;
      }
      
      return response;
    }
    
    // Busca informação específica
    const value = OracleMemory.getProfile(queryType);
    
    const responseMap = {
      namorada: value ? `💕 Você namora com <strong>${value}</strong>!` : `Você não me contou com quem namora, ${treatment}. Quer me contar?`,
      namorado: value ? `💕 Você namora com <strong>${value}</strong>!` : `Você não me contou com quem namora, ${treatment}. Quer me contar?`,
      esposa: value ? `💍 Sua esposa é <strong>${value}</strong>!` : `Você não me contou quem é sua esposa.`,
      esposo: value ? `💍 Seu esposo é <strong>${value}</strong>!` : `Você não me contou quem é seu esposo.`,
      mae: value ? `👩 Sua mãe é <strong>${value}</strong>!` : `Você não me contou o nome da sua mãe.`,
      pai: value ? `👨 Seu pai é <strong>${value}</strong>!` : `Você não me contou o nome do seu pai.`,
      melhorAmigo: value ? `🤝 Seu melhor amigo(a) é <strong>${value}</strong>!` : `Você não me contou quem é seu melhor amigo(a).`,
      pet: value ? `🐾 Seu pet se chama <strong>${value}</strong>!` : `Você não me contou o nome do seu pet.`,
      aniversario: value ? `🎂 Seu aniversário é <strong>${value}</strong>!` : `Você não me contou quando é seu aniversário.`
    };
    
    return responseMap[queryType] || `Não tenho essa informação, ${treatment}. Quer me contar?`;
  },
  
  // Cria tarefa com detalhes extraídos pelo NLU
  createTaskWithDetails(data) {
    const name = OracleMemory.getProfile('name');
    const gender = OracleMemory.getProfile('gender');
    const treatment = gender === 'male' ? 'cara' : gender === 'female' ? 'querida' : (name || 'amigo');
    
    // Adiciona a tarefa
    if (!gameState.dailyTasks) gameState.dailyTasks = [];
    
    const task = {
      id: Date.now(),
      text: data.title,
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate: data.dueDate,
      dueTime: data.dueTime,
      xpReward: data.xpReward || 20
    };

    gameState.dailyTasks.push(task);
    saveGame(true);

    // Atualiza a lista de tarefas na UI
    if (typeof renderDailyTasks === 'function') renderDailyTasks();

    // Monta resposta
    let response = `✅ Tarefa criada: <strong>"${data.title}"</strong>`;
    
    if (data.dueDate) {
      const dateObj = new Date(data.dueDate + 'T' + (data.dueTime || '09:00'));
      const dateStr = dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
      response += `<br>📅 Para: ${dateStr}`;
      if (data.dueTime) {
        response += ` às ${data.dueTime}`;
      }
    }
    
    response += `<br>⭐ Recompensa: <strong>${data.xpReward} XP</strong>`;
    
    return response + `<br><br>Boa sorte, ${treatment}! 💪`;
  },
  
  // Processa resposta para ação pendente
  async handlePendingAction(input, lowerInput) {
    const action = this.pendingAction;
    const name = OracleMemory.getProfile('name');
    const gender = OracleMemory.getProfile('gender');
    const treatment = gender === 'male' ? 'cara' : gender === 'female' ? 'querida' : (name || 'amigo');
    
    // Se o usuário cancelou
    if (lowerInput.match(/^(cancela|cancelar|deixa|deixa pra lá|esquece|nada|não|nao)$/i)) {
      this.pendingAction = null;
      return `Sem problemas, ${treatment}! 😊 Se precisar de algo, é só falar!`;
    }
    
    switch(action.type) {
      case 'slot_fill':
        // User answered one of the pending questions
        try {
          const answer = input.trim();
          action.collectedAnswers = action.collectedAnswers || [];
          action.collectedAnswers.push(answer);

          // If still need more answers, ask next question
          if (action.collectedAnswers.length < (action.awaiting || []).length) {
            const nextQ = action.awaiting[action.collectedAnswers.length];
            this.pendingAction = action; // keep pending
            window.OracleTelemetry?.log('slot_fill_progress', { got: action.collectedAnswers.length, need: action.awaiting.length });
            return `❓ ${nextQ}`;
          }

          // Have all answers: try server-side fill if session available
          const session = action.session;
          if (session && window.OracleClient && typeof window.OracleClient.fillPending === 'function') {
            const resp = await window.OracleClient.fillPending(session, action.collectedAnswers.slice());
            this.pendingAction = null;
            if (resp && resp.result) {
              const out = resp.result;
              if (out.actions && out.actions.length) {
                try {
                  await processOracleActions(out.actions);
                  window.OracleTelemetry?.log('slot_fill_executed', { types: out.actions.map(a=>a.type) });
                  return out.reply || 'Feito ✅';
                } catch (e) {
                  console.error('Erro ao executar actions preenchidas:', e);
                  return 'Tentei executar a ação preenchida, mas deu erro.';
                }
              }
              return out.reply || 'Resposta processada.';
            }
            return 'Não consegui preencher automaticamente. Tente novamente.';
          }

          // No session / server: fallback to local handling (attach answers to entities)
          this.pendingAction = null;
          return `Ok, entendi: ${action.collectedAnswers.join('; ')}`;
        } catch (e) {
          this.pendingAction = null;
          console.error('Erro slot_fill:', e);
          return 'Desculpe, não consegui processar sua resposta.';
        }

      case 'learn_unknown':
        let definition = lowerInput;
        // Remove prefixos comuns de definição para limpar o comando
        definition = definition.replace(/^(isso )?(significa|quer dizer|é|e|querer dizer)\s+/i, '').trim();
        
        const unknownPhrase = action.originalInput;
        
          // Salva o alias na memória (não executar automaticamente)
          const mem = OracleMemory.get();
          if (!mem.aliases) mem.aliases = {};
          mem.aliases[unknownPhrase] = definition;
          OracleMemory.save(mem);

          this.pendingAction = { type: 'learn_confirm', originalInput: unknownPhrase, definition };

          // Pergunta ao usuário se quer executar agora a ação aprendida
          return {
            message: `Entendi! 🧠 Aprendi que "<strong>${unknownPhrase}</strong>" significa "<strong>${definition}</strong>". Deseja que eu execute isso agora?`,
            actions: [
              { text: 'Sim, executa', action: () => {
                  this.pendingAction = null;
                  const resp = this.generateResponse(definition);
                  if (typeof resp === 'string') addBotMessage(resp);
                  else if (resp && resp.message) addBotMessage(resp.message, resp.actions);
              }},
              { text: 'Não, obrigado', action: () => { this.pendingAction = null; addBotMessage('Ok! Não executarei agora.'); } }
            ]
          };

      case 'learn_alias':
        const newCommand = input.trim();
        const originalCommand = action.originalInput;

        // Check if the new command is something the Oracle understands
        const nluResult = OracleNLU.detectIntent(newCommand);

        if (nluResult.intent === 'unknown') {
            this.pendingAction = { type: 'learn_alias', originalInput: originalCommand }; // Keep pending
            return `Acho que também não entendi o comando "<strong>${newCommand}</strong>". 😕 Tente um comando que você sabe que eu entendo, como "criar tarefa" ou "meu status".`;
        }

        // If the new command is valid, save the alias
        const mem2 = OracleMemory.get();
        if (!mem2.aliases) mem2.aliases = {};
        mem2.aliases[originalCommand.toLowerCase()] = newCommand;
        OracleMemory.save(mem2);

        this.pendingAction = null;

        // Confirm and execute the new command
        addBotMessage(`✅ Entendido! Da próxima vez que você disser "<strong>${originalCommand}</strong>", vou entender como "<strong>${newCommand}</strong>".<br><br>Agora, executando o comando...`);
        
        setTimeout(() => {
            const response = this.generateResponse(newCommand);
            if (typeof response === 'string') {
                addBotMessage(response);
            } else if (response.message) {
                addBotMessage(response.message, response.actions);
            }
        }, 500);

        return null; // Don't return anything, the response is handled asynchronously
      case 'clarify_meta': // NEW CASE for ambiguity
        if (lowerInput.includes('financeira')) {
            this.pendingAction = null;
            return this.createFinancialGoal();
        } else if (lowerInput.includes('tarefa')) {
            this.pendingAction = null;
            const taskText = action.originalInput.replace(/^(criar|fazer|nova|minha)\s+/i, '').trim();
            return createTask(taskText);
        } else {
            this.pendingAction = null; // Cancel if the response is not clear
            return "Não entendi. Por favor, escolha entre 'Meta Financeira' ou 'Tarefa'.";
        }
        break;

      case 'expense_amount': // NEW CASE
        const expenseValue = parseMoney(lowerInput);
        if (isNaN(expenseValue) || expenseValue <= 0) {
          return "Por favor, digite um valor válido para o gasto (ex: 50 ou 12,50).";
        }
        this.pendingAction = { type: 'expense_description', value: expenseValue };
        return {
          message: `Ok, R$ ${expenseValue.toFixed(2)}. E qual o nome que deve ser colocado?`,
          actions: [
            { text: '🍔 Alimentação', action: () => { this.pendingAction = null; addBotMessage(addExpense(expenseValue, 'Alimentação')); } },
            { text: '🚗 Transporte', action: () => { this.pendingAction = null; addBotMessage(addExpense(expenseValue, 'Transporte')); } },
            { text: '🎮 Lazer', action: () => { this.pendingAction = null; addBotMessage(addExpense(expenseValue, 'Lazer')); } },
            { text: '🛒 Compras', action: () => { this.pendingAction = null; addBotMessage(addExpense(expenseValue, 'Compras')); } }
          ]
        };

      case 'income_amount':
        const incomeValue = parseMoney(lowerInput);
        if (isNaN(incomeValue) || incomeValue <= 0) {
          return "Por favor, digite um valor válido para a entrada (ex: 500 ou 1200,50).";
        }
        this.pendingAction = { type: 'income_description', value: incomeValue };
        return {
          message: `Ok, R$ ${incomeValue.toFixed(2)}. Qual é a descrição dessa entrada?`,
          actions: [
            { text: '💼 Salário', action: () => { this.pendingAction = null; addBotMessage(addIncome(incomeValue, 'Salário')); } },
            { text: '💻 Freelance', action: () => { this.pendingAction = null; addBotMessage(addIncome(incomeValue, 'Freelance')); } },
            { text: '🎁 Presente', action: () => { this.pendingAction = null; addBotMessage(addIncome(incomeValue, 'Presente')); } },
            { text: '📈 Investimento', action: () => { this.pendingAction = null; addBotMessage(addIncome(incomeValue, 'Investimento')); } }
          ]
        };

      case 'expense_description':
        // Usuário está dando a descrição para o gasto
        let desc = input.trim();
        if (desc.length < 2) {
          return "Hmm, pode dar um nome melhor? Tipo: almoço, mercado, uber... 🤔";
        }
        
        this.pendingAction = null;
        desc = desc.charAt(0).toUpperCase() + desc.slice(1);
        return addExpense(action.value, desc);
        
      case 'expense_category':
        // Usuário escolhendo categoria
        const categories = ['alimentação', 'transporte', 'lazer', 'saúde', 'educação', 'moradia', 'outros'];
        const chosenCat = categories.find(c => lowerInput.includes(c)) || 'outros';
        
        this.pendingAction = null;
        return addExpenseWithCategory(action.value, action.description, chosenCat);
        
      case 'income_description':
        // Usuário dando descrição para receita
        let incDesc = input.trim();
        if (incDesc.length < 2) {
          return "Como devo chamar essa entrada? Salário, freelance, presente... 🤔";
        }
        
        this.pendingAction = null;
        incDesc = incDesc.charAt(0).toUpperCase() + incDesc.slice(1);
        return addIncome(action.value, incDesc);
        
      case 'task_name':
        // Usuário dando nome para tarefa
        let taskName = input.trim();
        if (taskName.length < 2) {
          return "Qual é a tarefa? Me conta o que precisa fazer! 📝";
        }
        
        this.pendingAction = null;
        return createTask(taskName);
        
      case 'financial_goal_name':
        let goalName = input.trim();
        if (goalName.length < 2) {
          return "Nome muito curto. Qual é o objetivo? (Ex: Viagem, Carro)";
        }
        this.pendingAction = { type: 'financial_goal_value', name: goalName };
        return `Legal! E de quanto você precisa para "${goalName}"? (Digite o valor, ex: 5000)`;

      case 'financial_goal_value':
        const val = parseMoney(lowerInput);
        if (isNaN(val) || val <= 0) {
           return "Valor inválido. Digite um número (ex: 1000).";
        }
        this.pendingAction = null;
        if (gameState) {
            gameState.financialGoal = val;
            saveGame();
            updateUI();
            return `🎯 Meta definida para <strong>${action.name}</strong>: R$ ${val.toLocaleString('pt-BR')}! 🚀`;
        }
        return "Erro ao salvar meta.";

      case 'guided_goal_income':
        const income = parseMoney(lowerInput);
        if (isNaN(income) || income <= 0) return "Por favor, digite um valor válido para sua renda (ex: 3000).";

        // Analisa o histórico de finanças
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentExpenses = (gameState.finances || [])
          .filter(f => f.type === 'expense' && new Date(f.date) >= thirtyDaysAgo);
        
        // Se tiver mais de 5 gastos nos últimos 30 dias, usa como base
        if (recentExpenses.length >= 5) {
          const totalRecentExpenses = recentExpenses.reduce((sum, e) => sum + e.value, 0);
          const estimatedMonthlyExpenses = totalRecentExpenses; // Simplesmente soma os gastos dos últimos 30 dias
          
          const balance = income - estimatedMonthlyExpenses;

          if (balance <= 0) {
            this.pendingAction = null;
            return `Analisei seus gastos e eles somam R$ ${estimatedMonthlyExpenses.toLocaleString('pt-BR')} no último mês. Com sua renda de R$ ${income.toLocaleString('pt-BR')}, parece não sobrar muito. 📉\n\nMinha dica: Vamos focar em **reduzir gastos** primeiro?`;
          }

          const suggestedMonthly = Math.floor(balance * 0.5);
          const oneYearTotal = suggestedMonthly * 12;

          this.pendingAction = { type: 'guided_goal_confirm', monthly: suggestedMonthly, total: oneYearTotal };
          
          return `Analisei seus gastos e eles somam R$ ${estimatedMonthlyExpenses.toLocaleString('pt-BR')} no último mês. 🧐\n\n` +
                 `Com sua renda de R$ ${income.toLocaleString('pt-BR')}, sobra aproximadamente **R$ ${balance.toLocaleString('pt-BR')}**.\n\n` +
                 `Se você guardar **R$ ${suggestedMonthly.toLocaleString('pt-BR')}** por mês (metade da sobra), em 1 ano terá **R$ ${oneYearTotal.toLocaleString('pt-BR')}**!\n\n` +
                 `Podemos definir essa meta de **R$ ${oneYearTotal.toLocaleString('pt-BR')}**?`;
        } else {
          // Se não tem dados suficientes, pergunta ao usuário
          this.pendingAction = { type: 'guided_goal_expenses', income: income };
          return `Certo, renda de R$ ${income.toLocaleString('pt-BR')}. 💰\nComo não tenho muitos dados sobre seus gastos, qual é o total aproximado das suas **contas e despesas mensais**?`;
        }

      case 'guided_goal_expenses':
        const expenses = parseMoney(lowerInput);
        if (isNaN(expenses) || expenses < 0) return "Por favor, digite um valor válido para suas despesas.";
        
        const incomeVal = action.income;
        const balance = incomeVal - expenses;
        
        if (balance <= 0) {
            this.pendingAction = null;
            return `Poxa, suas despesas (R$ ${expenses}) parecem cobrir toda sua renda (R$ ${incomeVal}). 📉\n\nMinha dica: Vamos focar em **reduzir gastos** primeiro? Posso analisar suas finanças se você disser "analisar gastos".`;
        }

        // Sugere guardar 50% do que sobra
        const suggestedMonthly = Math.floor(balance * 0.5); 
        const oneYearTotal = suggestedMonthly * 12;
        
        this.pendingAction = { type: 'guided_goal_confirm', monthly: suggestedMonthly, total: oneYearTotal };
        
        return `📊 **Análise:**\n` +
               `• Sobra mensalmente: R$ ${balance.toLocaleString('pt-BR')}\n\n` +
               `Se você guardar **R$ ${suggestedMonthly.toLocaleString('pt-BR')}** por mês (metade da sobra), em 1 ano terá **R$ ${oneYearTotal.toLocaleString('pt-BR')}**!\n\n` +
               `Podemos definir essa meta de **R$ ${oneYearTotal.toLocaleString('pt-BR')}**?`;

      case 'guided_goal_confirm':
        if (lowerInput.match(/^(sim|s|yes|claro|pode|bora|isso|confirma|ok|tá|ta)$/i)) {
            if (gameState) {
                gameState.financialGoal = action.total;
                saveGame();
                updateUI();
            }
            this.pendingAction = null;
            return `🎉 **Meta Definida!**\n\nSeu objetivo: **R$ ${action.total.toLocaleString('pt-BR')}**.\nFoco em guardar R$ ${action.monthly.toLocaleString('pt-BR')} todo mês. Estou torcendo por você! 🚀`;
        } else {
            this.pendingAction = { type: 'financial_goal_value', name: 'Meta Personalizada' };
            return "Entendi! Então qual valor total você quer definir para sua meta?";
        }

      case 'savings_confirm':
        // Confirmar ação de poupança
        if (lowerInput.match(/^(sim|s|yes|y|claro|pode|bora|isso|confirma)$/i)) {
          this.pendingAction = null;
          return addSavings(action.value);
        } else if (lowerInput.match(/^(não|nao|n|no|cancela)$/i)) {
          this.pendingAction = null;
          return `Ok, ${treatment}! Cancelado. 😊`;
        }
        return "Posso guardar? Responde 'sim' ou 'não'! 🤔";
    }
    
    // Se não entendeu a resposta, cancela a ação pendente
    this.pendingAction = null;
    return null; // Continua o processamento normal
  },
  
  // Detecta automaticamente informações pessoais na conversa
  autoLearnFromInput(originalInput, lowerInput) {
    let learned = [];
    let response = null;
    
    // Detecta NOME - Padrões naturais
    const namePatterns = [
      /(?:me chamo|meu nome [eé]|sou o|sou a|pode me chamar de|chama(?:r)? de)\s+([a-záàâãéèêíïóôõöúç]+)/i,
      /^(?:eu sou|sou)\s+(?:o|a)?\s*([a-záàâãéèêíïóôõöúç]+)$/i,
      /(?:meu nome):?\s*([a-záàâãéèêíïóôõöúç]+)/i,
      /^([a-záàâãéèêíïóôõöúç]+),?\s+(?:aqui|presente|na área)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = originalInput.match(pattern);
      if (match && match[1]) {
        const name = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
        
        // Ignora palavras comuns que não são nomes
        const ignoreWords = ['eu', 'você', 'voce', 'aqui', 'hoje', 'bem', 'oi', 'ola', 'olá'];
        if (ignoreWords.includes(name.toLowerCase())) continue;
        
        const currentName = OracleMemory.getProfile('name');
        if (currentName !== name) {
          OracleMemory.setProfile('name', name);
          
          // Detecta gênero pelo nome
          const gender = OracleMemory.detectGenderByName(name);
          OracleMemory.setProfile('gender', gender);
          
          const genderText = gender === 'male' ? 'Prazer em conhecer, cara!' : 
                            gender === 'female' ? 'Prazer em conhecer, querida!' : 
                            'Prazer em conhecer!';
          
          return `Opa, ${name}! 😊 ${genderText} Vou lembrar de você! ${gender === 'male' ? '💪' : gender === 'female' ? '💖' : '✨'}`;
        }
        break;
      }
    }
    
    // Detecta GÊNERO explícito
    if (lowerInput.match(/sou (homem|mulher|menino|menina|garoto|garota|cara|mina|mano|mana)/)) {
      const match = lowerInput.match(/sou (homem|mulher|menino|menina|garoto|garota|cara|mina|mano|mana)/);
      const genderWord = match[1];
      const isMale = ['homem', 'menino', 'garoto', 'cara', 'mano'].includes(genderWord);
      const gender = isMale ? 'male' : 'female';
      
      if (OracleMemory.getProfile('gender') !== gender) {
        OracleMemory.setProfile('gender', gender);
        learned.push('gênero');
      }
    }
    
    // Detecta PROFISSÃO/OCUPAÇÃO
    const occupationPatterns = [
      /(?:trabalho como|sou|eu sou|trabalho de)\s+(programador|desenvolvedor|médico|médica|professor|professora|estudante|engenheiro|engenheira|advogado|advogada|designer|vendedor|vendedora|motorista|freelancer|autônomo|autônoma|empresário|empresária|cozinheiro|cozinheira|atleta|músico|música|artista|escritor|escritora|psicólogo|psicóloga)/i,
      /(?:minha profissão [eé]|minha ocupação [eé])\s+([a-záàâãéèêíïóôõöúç\s]+)/i
    ];
    
    for (const pattern of occupationPatterns) {
      const match = originalInput.match(pattern);
      if (match && match[1]) {
        const occupation = match[1].trim();
        if (OracleMemory.getProfile('occupation') !== occupation) {
          OracleMemory.setProfile('occupation', occupation);
          learned.push(`sua profissão (${occupation})`);
        }
        break;
      }
    }
    
    // Detecta INTERESSES / GOSTOS
    const interestPatterns = [
      /(?:gosto de|adoro|amo|curto|sou fã de)\s+([a-záàâãéèêíïóôõöúç\s,]+)/i,
      /(?:meu hobby [eé]|meu passatempo [eé])\s+([a-záàâãéèêíïóôõöúç\s]+)/i
    ];
    
    for (const pattern of interestPatterns) {
      const match = originalInput.match(pattern);
      if (match && match[1]) {
        const interests = match[1].split(/,|e\s/).map(i => i.trim()).filter(i => i.length > 2);
        interests.forEach(interest => {
          if (OracleMemory.addInterest(interest)) {
            learned.push(`que você gosta de ${interest}`);
          }
        });
        break;
      }
    }
    
    // Detecta IDADE
    const ageMatch = originalInput.match(/(?:tenho|fiz|completei)\s+(\d{1,2})\s*(?:anos|aninhos)/i);
    if (ageMatch) {
      const age = parseInt(ageMatch[1]);
      if (age > 0 && age < 120 && OracleMemory.getProfile('age') !== age) {
        OracleMemory.setProfile('age', age);
        learned.push(`sua idade (${age} anos)`);
      }
    }
    
    // Se aprendeu algo, confirma
    if (learned.length > 0) {
      const treatment = OracleMemory.getGenderPronoun('treatment');
      return `Legal, ${treatment}! 🧠 Aprendi ${learned.join(' e ')}. Pode contar comigo pra lembrar! ✨`;
    }
    
    return null; // Não aprendeu nada, continua processamento normal
  },
  
  handleActionCommands(lowerInput, originalInput) {
    const name = OracleMemory.getProfile('name');
    const gender = OracleMemory.getProfile('gender');
    const treatment = gender === 'male' ? 'cara' : gender === 'female' ? 'querida' : (name || 'amigo');
    const isPolite = OracleMemory.getProfile('isPolite');
    const politeResponse = isPolite ? ' 😊' : '';
    
    // COMANDOS DE SISTEMA DE REGRAS
    if (lowerInput.match(/^usar regras (json|markdown|txt)/i)) {
      const match = lowerInput.match(/^usar regras (json|markdown|txt)/i);
      return OracleOnboarding.setRuleMode(match[1].toLowerCase());
    }
    
    if (lowerInput.match(/^(ver|mostrar) regras/i)) {
      const rules = OracleOnboarding.getRulesText();
      const displayRules = rules.length > 500 ? rules.substring(0, 500) + '...' : rules;
      return `📜 <strong>Regras Atuais (${OracleOnboarding.activeMode.toUpperCase()}):</strong><br><br><pre style="font-size:10px; white-space:pre-wrap; background:rgba(0,0,0,0.3); padding:10px; border-radius:8px;">${displayRules}</pre>`;
    }
    
    // CRIAR TAREFA
    if (lowerInput.match(/^(criar?|adicionar?|nova?) ?(tarefa|task|missão)/i)) {
      const taskText = originalInput.replace(/^(criar?|adicionar?|nova?) ?(tarefa|task|missão)/i, '').trim();
      
      if (taskText && taskText.length > 2) {
        return createTask(taskText);
      } else {
        // Pergunta interativa
        this.pendingAction = { type: 'task_name' };
        return {
          message: `Claro, ${treatment}! Qual tarefa você quer criar? 📝`,
          actions: [
            { text: '📚 Estudar', action: () => { this.pendingAction = null; addBotMessage(createTask('Estudar')); } },
            { text: '🏃 Exercitar', action: () => { this.pendingAction = null; addBotMessage(createTask('Fazer exercícios')); } },
            { text: '🧹 Organizar', action: () => { this.pendingAction = null; addBotMessage(createTask('Organizar ambiente')); } }
          ]
        };
      }
    }
    
    // ==== COMANDOS NATURAIS DE FINANÇAS ====
    
    // SAÍDA/GASTO - Formas naturais: "coloque uma saída de 50", "gastei 100", "paguei 50 no almoço"
    const expensePatterns = [
      /(?:coloque?|coloca|adiciona|registra|bota|põe?)\s+(?:uma?\s+)?(?:saída|saida|gasto|despesa)\s+(?:de\s+)?(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i,
      /(?:gastei|paguei|comprei|perdi)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i,
      /(?:tive\s+(?:um\s+)?(?:gasto|despesa)\s+de)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i,
      /(?:saiu|foi)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i,
      /^(?:adicionar?|registrar?|novo?)\s*(?:gasto|despesa|saída)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i
    ];
    
    for (const pattern of expensePatterns) {
      const match = originalInput.match(pattern);
      if (match) {
        const value = parseFloat(match[1].replace(',', '.'));
        
        // Extrair descrição do restante da frase
        let desc = originalInput
          .replace(pattern, '')
          .replace(/^[\s,\.]+|[\s,\.]+$/g, '')
          .replace(/^(com|no|na|em|de|pra|para|por causa)\s+/i, '')
          .trim();
        
        // Se não encontrou descrição, tenta extrair de outras partes
        if (!desc || desc.length < 2) {
          const descMatch = originalInput.match(/(?:com|no|na|em|de|pra|para)\s+(.+?)(?:\s+de\s+\d|$)/i);
          desc = descMatch ? descMatch[1].trim() : null;
        }
        
        // Se ainda não tem descrição, PERGUNTA ao usuário
        if (!desc || desc.length < 2) {
          this.pendingAction = { type: 'expense_description', value: value };
          return {
            message: `Beleza, ${treatment}! 💸 Vou registrar <strong>R$ ${value.toFixed(2)}</strong> de saída.${politeResponse}<br><br>Qual nome devo colocar nessa despesa?`,
            actions: [
              { text: '🍔 Alimentação', action: () => { this.pendingAction = null; addBotMessage(addExpense(value, 'Alimentação')); } },
              { text: '🚗 Transporte', action: () => { this.pendingAction = null; addBotMessage(addExpense(value, 'Transporte')); } },
              { text: '🎮 Lazer', action: () => { this.pendingAction = null; addBotMessage(addExpense(value, 'Lazer')); } },
              { text: '🛒 Compras', action: () => { this.pendingAction = null; addBotMessage(addExpense(value, 'Compras')); } }
            ]
          };
        }
        
        return addExpense(value, desc.charAt(0).toUpperCase() + desc.slice(1));
      }
    }
    
    // ENTRADA/RECEITA - Formas naturais: "recebi 500", "ganhei 1000", "entrou 200"
    const incomePatterns = [
      /(?:coloque?|coloca|adiciona|registra|bota|põe?)\s+(?:uma?\s+)?(?:entrada|receita|ganho)\s+(?:de\s+)?(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i,
      /(?:recebi|ganhei|entrou|chegou)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i,
      /(?:tive\s+(?:uma?\s+)?(?:entrada|receita|ganho)\s+de)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i,
      /^(?:adicionar?|registrar?|nova?)\s*(?:receita|entrada|ganho|salário)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i
    ];
    
    for (const pattern of incomePatterns) {
      const match = originalInput.match(pattern);
      if (match) {
        const value = parseFloat(match[1].replace(',', '.'));
        let desc = originalInput
          .replace(pattern, '')
          .replace(/^[\s,\.]+|[\s,\.]+$/g, '')
          .replace(/^(de|do|da|por|como)\s+/i, '')
          .trim();
        
        if (!desc || desc.length < 2) {
          const descMatch = originalInput.match(/(?:de|do|da|como|por)\s+(.+?)(?:\s+de\s+\d|$)/i);
          desc = descMatch ? descMatch[1].trim() : null;
        }
        
        // Se não tem descrição, PERGUNTA ao usuário
        if (!desc || desc.length < 2) {
          this.pendingAction = { type: 'income_description', value: value };
          return {
            message: `Show, ${treatment}! 💰 Vou registrar <strong>R$ ${value.toFixed(2)}</strong> de entrada.${politeResponse}<br><br>De onde veio essa grana?`,
            actions: [
              { text: '💼 Salário', action: () => { this.pendingAction = null; addBotMessage(addIncome(value, 'Salário')); } },
              { text: '💻 Freelance', action: () => { this.pendingAction = null; addBotMessage(addIncome(value, 'Freelance')); } },
              { text: '🎁 Presente', action: () => { this.pendingAction = null; addBotMessage(addIncome(value, 'Presente')); } },
              { text: '📈 Investimento', action: () => { this.pendingAction = null; addBotMessage(addIncome(value, 'Investimento')); } }
            ]
          };
        }
        
        return addIncome(value, desc.charAt(0).toUpperCase() + desc.slice(1));
      }
    }
    
    // ECONOMIA/POUPANÇA - "guardar 100", "poupar 200", "economizar 50"
    const savingsPatterns = [
      /(?:guardar?|guarda|poupar?|poupa|economizar?|economiza|reservar?|reserva|separar?|separa)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i,
      /(?:coloque?|coloca|adiciona)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s+(?:na\s+)?(?:poupança|economia|reserva)/i,
      /(?:vou\s+)?(?:guardar?|poupar?|economizar?)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i
    ];
    
    for (const pattern of savingsPatterns) {
      const match = originalInput.match(pattern);
      if (match) {
        const value = parseFloat(match[1].replace(',', '.'));
        return addSavings(value);
      }
    }
    
    // RETIRAR DA POUPANÇA - "retirar 100 da poupança", "tirar 50 da economia"
    const withdrawPatterns = [
      /(?:retirar?|retira|tirar?|tira|sacar?|saca|pegar?|pega|usar?|usa)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s+(?:da|das?)\s+(?:poupança|economia|reserva|economias)/i,
      /(?:preciso\s+de|vou\s+usar|usar)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s+(?:da|das?)\s+(?:poupança|economia|reserva)/i
    ];
    
    for (const pattern of withdrawPatterns) {
      const match = originalInput.match(pattern);
      if (match) {
        const value = parseFloat(match[1].replace(',', '.'));
        return withdrawSavings(value);
      }
    }
    
    // DEFINIR META DE ECONOMIA
    const goalPatterns = [
      /(?:minha\s+)?meta\s+(?:é|de)\s+(?:economizar?\s+)?(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i,
      /(?:quero|preciso)\s+(?:economizar?|guardar?|juntar?)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i,
      /(?:definir?|define|colocar?|coloca)\s+meta\s+(?:de\s+)?(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i
    ];
    
    for (const pattern of goalPatterns) {
      const match = originalInput.match(pattern);
      if (match) {
        const value = parseFloat(match[1].replace(',', '.'));
        return setSavingsGoal(value);
      }
    }
    
    // VER POUPANÇA/ECONOMIAS
    if (lowerInput.match(/(?:quanto\s+)?(?:tenho|tem)\s+(?:na|de)\s+(?:poupança|economia|reserva|guardado)|(?:minha|ver)\s+(?:poupança|economia|reserva)/i)) {
      return getSavingsStatus();
    }
    
    // COMPLETAR TAREFA
    if (lowerInput.match(/^(completar?|concluir?|finalizar?|feito?) ?(tarefa)?/i)) {
      const taskName = originalInput.replace(/^(completar?|concluir?|finalizar?|feito?) ?(tarefa)?/i, '').trim();
      return completeTask(taskName);
    }
    
    // DELETAR TAREFA
    if (lowerInput.match(/(?:deletar?|deleta|remover?|remove|apagar?|apaga|excluir?|exclui)\s+(?:a\s+)?tarefa/i)) {
      const taskName = originalInput.replace(/(?:deletar?|deleta|remover?|remove|apagar?|apaga|excluir?|exclui)\s+(?:a\s+)?tarefa/i, '').trim();
      return deleteTask(taskName);
    }
    
    // INICIAR/PARAR TRABALHO
    if (lowerInput.match(/^(iniciar?|começar?|start|vou\s+trabalhar|bora\s+trabalhar) ?(trabalho|timer|cronômetro)?/i)) {
      if (window.WorkTimer && !window.WorkTimer.isRunning()) {
        window.WorkTimer.start();
        return this.getSuccessMessage() + " Timer de trabalho iniciado! ⏱️ Bom trabalho!";
      } else if (window.WorkTimer?.isRunning()) {
        return "⏱️ O timer já está rodando! Quando terminar, é só pedir pra parar.";
      }
      return "Não consegui iniciar o timer. Tente pela aba de Trabalho.";
    }
    
    if (lowerInput.match(/^(parar?|finalizar?|stop|encerrar?|terminei|acabei|chega) ?(trabalho|timer|cronômetro|de\s+trabalhar)?/i)) {
      if (window.WorkTimer?.isRunning()) {
        window.WorkTimer.stop();
        return this.getSuccessMessage() + " Timer finalizado! Descanse um pouco! 😊";
      }
      return "⏱️ Não há timer rodando no momento.";
    }
    
    // ADICIONAR XP MANUAL
    if (lowerInput.match(/(?:adicionar?|adiciona|dar?|dá|ganhar?|ganha)\s+(\d+)\s*(?:de\s+)?xp/i)) {
      const match = lowerInput.match(/(\d+)/);
      if (match && gameState) {
        const xp = parseInt(match[1]);
        gameState.xp = (gameState.xp || 0) + xp;
        while (gameState.xp >= 100) {
          gameState.xp -= 100;
          gameState.level = (gameState.level || 1) + 1;
        }
        saveGame();
        return `⭐ +${xp} XP adicionado! Você está no nível ${gameState.level} com ${gameState.xp}/100 XP!`;
      }
    }
    
    // LIMPAR TAREFAS CONCLUÍDAS
    if (lowerInput.match(/(?:limpar?|limpa|remover?|remove|apagar?|apaga)\s+(?:tarefas?\s+)?(?:concluídas?|completas?|feitas?)/i)) {
      if (gameState && gameState.dailyTasks) {
        const before = gameState.dailyTasks.length;
        gameState.dailyTasks = gameState.dailyTasks.filter(t => !t.completed);
        const removed = before - gameState.dailyTasks.length;
        saveGame();
        if (typeof renderTasks === 'function') renderTasks();
        return removed > 0 
          ? `🧹 ${removed} tarefa(s) concluída(s) removida(s)!`
          : "Não há tarefas concluídas para limpar.";
      }
    }
    
    // RENOMEAR/ALTERAR GASTO
    // Padrões: "renomear gasto almoço para lanche", "alterar nome do gasto X para Y", "mudar gasto de X para Y"
    const renameExpensePatterns = [
      /(?:renomear?|renomeia|alterar?|altera|mudar?|muda|trocar?|troca|editar?|edita)\s+(?:o\s+)?(?:nome\s+)?(?:do\s+)?(?:gasto|despesa|saída)\s+(?:de\s+)?["']?(.+?)["']?\s+(?:para|pra|por)\s+["']?(.+?)["']?$/i,
      /(?:renomear?|renomeia|alterar?|altera|mudar?|muda|trocar?|troca|editar?|edita)\s+["']?(.+?)["']?\s+(?:para|pra|por)\s+["']?(.+?)["']?\s+(?:no\s+)?(?:gasto|despesa)/i
    ];
    
    for (const pattern of renameExpensePatterns) {
      const match = originalInput.match(pattern);
      if (match) {
        const oldName = match[1].trim();
        const newName = match[2].trim();
        return renameExpense(oldName, newName);
      }
    }
    
    // VER GASTOS / LISTAR DESPESAS (para poder escolher qual renomear)
    if (lowerInput.match(/(?:ver|mostrar?|mostra|listar?|lista|quais?)\s+(?:meus?\s+)?(?:gastos?|despesas?|saídas?)/i) ||
        lowerInput.match(/(?:meus?\s+)?(?:gastos?|despesas?|saídas?)\s+(?:recentes?)?/i)) {
      return listExpenses();
    }
    
    // DELETAR/REMOVER GASTO
    const deleteExpensePatterns = [
      /(?:deletar?|deleta|remover?|remove|apagar?|apaga|excluir?|exclui)\s+(?:o\s+)?(?:gasto|despesa|saída)\s+(?:de\s+)?["']?(.+?)["']?$/i,
      /(?:deletar?|deleta|remover?|remove|apagar?|apaga|excluir?|exclui)\s+["']?(.+?)["']?\s+(?:dos?\s+)?(?:gastos?|despesas?)/i
    ];
    
    for (const pattern of deleteExpensePatterns) {
      const match = originalInput.match(pattern);
      if (match) {
        const name = match[1].trim();
        return deleteExpense(name);
      }
    }
    
    // RENOMEAR/ALTERAR ENTRADA/RECEITA
    const renameIncomePatterns = [
      /(?:renomear?|renomeia|alterar?|altera|mudar?|muda|trocar?|troca|editar?|edita)\s+(?:o\s+)?(?:nome\s+)?(?:da?\s+)?(?:entrada|receita|ganho)\s+(?:de\s+)?["']?(.+?)["']?\s+(?:para|pra|por)\s+["']?(.+?)["']?$/i
    ];
    
    for (const pattern of renameIncomePatterns) {
      const match = originalInput.match(pattern);
      if (match) {
        const oldName = match[1].trim();
        const newName = match[2].trim();
        return renameIncome(oldName, newName);
      }
    }
    
    // VER RECEITAS / LISTAR ENTRADAS
    if (lowerInput.match(/(?:ver|mostrar?|mostra|listar?|lista|quais?)\s+(?:minhas?\s+)?(?:entradas?|receitas?|ganhos?)/i) ||
        lowerInput.match(/(?:minhas?\s+)?(?:entradas?|receitas?|ganhos?)\s+(?:recentes?)?/i)) {
      return listIncomes();
    }
    
    // DELETAR/REMOVER ENTRADA
    const deleteIncomePatterns = [
      /(?:deletar?|deleta|remover?|remove|apagar?|apaga|excluir?|exclui)\s+(?:a\s+)?(?:entrada|receita|ganho)\s+(?:de\s+)?["']?(.+?)["']?$/i
    ];
    
    for (const pattern of deleteIncomePatterns) {
      const match = originalInput.match(pattern);
      if (match) {
        const name = match[1].trim();
        return deleteIncome(name);
      }
    }
    
    return null;
  },
  
  // Adicionar à poupança
  addSavings(value) {
    if (!gameState) return "Erro ao registrar. Tente pela interface.";
    
    if (!gameState.savings) gameState.savings = { total: 0, goal: 0, history: [] };
    
    gameState.savings.total = (gameState.savings.total || 0) + value;
    gameState.savings.history = gameState.savings.history || [];
    gameState.savings.history.push({
      id: Date.now(),
      type: 'deposit',
      value: value,
      date: new Date().toISOString()
    });
    
    saveGame();
    
    const goal = gameState.savings.goal;
    let response = this.getSuccessMessage() + `<br><br>💰 <strong>R$ ${value.toFixed(2)}</strong> guardado na poupança!`;
    response += `<br>📊 Total acumulado: <strong>R$ ${gameState.savings.total.toFixed(2)}</strong>`;
    
    if (goal > 0) {
      const percent = Math.min(100, (gameState.savings.total / goal * 100)).toFixed(1);
      response += `<br>🎯 Progresso da meta: ${percent}%`;
      if (gameState.savings.total >= goal) {
        response += `<br><br>🎉 <strong>PARABÉNS!</strong> Você atingiu sua meta de R$ ${goal.toFixed(2)}!`;
      }
    }
    
    return response;
  },
  
  // Retirar da poupança
  withdrawSavings(value) {
    if (!gameState) return "Erro ao registrar. Tente pela interface.";
    
    if (!gameState.savings || gameState.savings.total < value) {
      const available = gameState.savings?.total || 0;
      return `⚠️ Você só tem R$ ${available.toFixed(2)} na poupança. Não dá pra retirar R$ ${value.toFixed(2)}.`;
    }
    
    gameState.savings.total -= value;
    gameState.savings.history = gameState.savings.history || [];
    gameState.savings.history.push({
      id: Date.now(),
      type: 'withdraw',
      value: value,
      date: new Date().toISOString()
    });
    
    saveGame();
    
    return `💸 R$ ${value.toFixed(2)} retirado da poupança.<br>📊 Saldo restante: <strong>R$ ${gameState.savings.total.toFixed(2)}</strong>`;
  },
  
  // Definir meta de economia
  setSavingsGoal(value) {
    if (!gameState) return "Erro ao registrar.";
    
    if (!gameState.savings) gameState.savings = { total: 0, goal: 0, history: [] };
    gameState.savings.goal = value;
    saveGame();
    
    const current = gameState.savings.total || 0;
    const percent = value > 0 ? Math.min(100, (current / value * 100)).toFixed(1) : 0;
    
    return `🎯 Meta de economia definida: <strong>R$ ${value.toFixed(2)}</strong><br>` +
           `📊 Progresso atual: R$ ${current.toFixed(2)} (${percent}%)<br><br>` +
           `💡 Use "<strong>guardar [valor]</strong>" para adicionar à poupança!`;
  },
  
  // Ver status da poupança
  getSavingsStatus() {
    if (!gameState) return "Erro ao acessar dados.";
    
    const savings = gameState.savings || { total: 0, goal: 0, history: [] };
    const total = savings.total || 0;
    const goal = savings.goal || 0;
    
    let response = `<strong>💰 Sua Poupança:</strong><br><br>`;
    response += `📊 Total guardado: <strong>R$ ${total.toFixed(2)}</strong><br>`;
    
    if (goal > 0) {
      const percent = Math.min(100, (total / goal * 100)).toFixed(1);
      const remaining = Math.max(0, goal - total);
      response += `🎯 Meta: R$ ${goal.toFixed(2)}<br>`;
      response += `📈 Progresso: ${percent}%<br>`;
      response += `⏳ Faltam: R$ ${remaining.toFixed(2)}<br>`;
    } else {
      response += `<br>💡 Dica: Defina uma meta! Ex: "<strong>minha meta é 1000</strong>"`;
    }
    
    // Histórico recente
    if (savings.history && savings.history.length > 0) {
      response += `<br><strong>📜 Últimas movimentações:</strong><br>`;
      savings.history.slice(-3).reverse().forEach(h => {
        const date = new Date(h.date).toLocaleDateString('pt-BR');
        const icon = h.type === 'deposit' ? '➕' : '➖';
        response += `${icon} R$ ${h.value.toFixed(2)} (${date})<br>`;
      });
    }
    
    return response;
  },
  
  // Deletar tarefa
  deleteTask(taskName) {
    if (!gameState || !gameState.dailyTasks) return "Não encontrei tarefas para deletar.";
    
    if (!taskName) {
      const tasks = gameState.dailyTasks;
      if (tasks.length === 0) return "Você não tem tarefas para deletar.";
      
      return {
        message: "Qual tarefa você quer deletar? 🗑️",
        actions: tasks.slice(0, 4).map(t => ({
          text: `🗑️ ${t.text.substring(0, 20)}${t.text.length > 20 ? '...' : ''}`,
          action: () => this.deleteTask(t.text)
        }))
      };
    }
    
    const lowerTask = taskName.toLowerCase();
    const taskIndex = gameState.dailyTasks.findIndex(t => 
      t.text.toLowerCase().includes(lowerTask) || lowerTask.includes(t.text.toLowerCase())
    );
    
    if (taskIndex !== -1) {
      const deleted = gameState.dailyTasks.splice(taskIndex, 1)[0];
      saveGame();
      if (typeof renderTasks === 'function') renderTasks();
      return `🗑️ Tarefa "<strong>${deleted.text}</strong>" deletada!`;
    }
    
    return `Não encontrei uma tarefa com "${taskName}". Diz <strong>minhas tarefas</strong> pra ver a lista!`;
  },
  
  handleInfoQueries(lowerInput) {
    // STATUS/XP
    if (lowerInput.match(/(status|xp|nível|nivel|experiência|level)/i)) {
      if (!gameState) return "Não consegui acessar seus dados. Tente recarregar a página.";
      
      const missing = 100 - gameState.xp;
      const streakEmoji = gameState.streak >= 7 ? '🔥' : (gameState.streak >= 3 ? '⚡' : '✨');
      
      return `<strong>📊 Seu Status Atual:</strong><br><br>
        🎮 <strong>Nível ${gameState.level}</strong><br>
        ⭐ XP: ${gameState.xp}/100 (faltam ${missing})<br>
        ${streakEmoji} Sequência: ${gameState.streak} dias<br>
        🏅 Conquistas: ${(gameState.achievements || []).length}<br><br>
        <em>Continue assim e você vai longe!</em>`;
    }
    
    // FINANÇAS/SALDO
    if (lowerInput.match(/(saldo|dinheiro|finança|financeiro|grana|quanto tenho)/i)) {
      if (!gameState) return "Não consegui acessar seus dados.";
      
      let income = 0, expense = 0;
      (gameState.finances || []).forEach(t => {
        if (t.type === 'income') income += t.value;
        else expense += t.value;
      });
      const balance = income - expense;
      const emoji = balance >= 0 ? '💰' : '⚠️';
      
      return `<strong>${emoji} Resumo Financeiro:</strong><br><br>
        📈 Entradas: <span style="color:#4ade80">R$ ${income.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span><br>
        📉 Saídas: <span style="color:#f87171">R$ ${expense.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span><br>
        💵 <strong>Saldo: R$ ${balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong><br><br>
        ${balance >= 0 ? 'Suas finanças estão no verde! 🎉' : 'Atenção com os gastos! 🧐'}`;
    }
    
    // TAREFAS
    if (lowerInput.match(/(tarefa|task|pendente|fazer|to-?do|missão|missões)/i)) {
      if (!gameState) return "Não consegui acessar seus dados.";
      
      const pending = (gameState.dailyTasks || []).filter(t => !t.completed);
      const completed = (gameState.dailyTasks || []).filter(t => t.completed);
      
      if (pending.length === 0 && completed.length === 0) {
        return "📝 Você não tem tarefas no momento. Que tal criar uma? Diz: <strong>criar tarefa estudar</strong>";
      }
      
      let response = `<strong>📋 Suas Tarefas:</strong><br><br>`;
      
      if (pending.length > 0) {
        response += `<strong>⏳ Pendentes (${pending.length}):</strong><br>`;
        pending.forEach(t => response += `• ${t.text}<br>`);
        response += '<br>';
      }
      
      if (completed.length > 0) {
        response += `<strong>✅ Concluídas (${completed.length}):</strong><br>`;
        completed.slice(-3).forEach(t => response += `• <s>${t.text}</s><br>`);
      }
      
      if (pending.length > 0) {
        response += `<br><em>Dica: Diga "completar [nome da tarefa]" para finalizar!</em>`;
      }
      
      return response;
    }
    
    // TRABALHO
    if (lowerInput.match(/(trabalho|produção|massa|timer|cronômetro)/i)) {
      if (!gameState) return "Não consegui acessar seus dados.";
      
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = (gameState.workLog || []).filter(l => l.date === today);
      
      let totalTime = 0;
      let totalProd = 0;
      let totalMoney = 0;
      
      todayLogs.forEach(l => {
        if (l.type === 'time_tracking') {
          totalTime += l.duration || 0;
        } else {
          totalProd += l.inputVal || 0;
        }
        totalMoney += l.financialVal || 0;
      });
      
      const hours = Math.floor(totalTime / 3600000);
      const mins = Math.floor((totalTime % 3600000) / 60000);
      const isRunning = window.WorkTimer?.isRunning();
      
      return `<strong>💼 Resumo do Trabalho Hoje:</strong><br><br>
        ⏱️ Tempo: ${hours}h ${mins}m ${isRunning ? '(timer ativo!)' : ''}<br>
        📦 Produção: ${totalProd} unidades<br>
        💵 Ganhos: R$ ${totalMoney.toFixed(2)}<br><br>
        ${isRunning ? '🟢 Timer rodando! Quando terminar, diga: <strong>parar trabalho</strong>' : '💡 Diga <strong>iniciar trabalho</strong> para começar o timer!'}`;
    }
    
    return null;
  },
  
  handleMemoryCommands(lowerInput, originalInput) {
    // APRENDER/LEMBRAR
    if (lowerInput.startsWith('lembre') || lowerInput.startsWith('lembra')) {
      const fact = originalInput.replace(/^lembr[ae]/i, '').replace(/^(que|de|:)/i, '').trim();
      if (fact.length > 3) {
        if (OracleMemory.learn(fact)) {
          return `🧠 Entendido! Vou lembrar que: "<em>${fact}</em>". Pode contar comigo!`;
        }
        return "Já sei disso! 😊";
      }
      return "O que você quer que eu lembre? Ex: <strong>lembre que minha cor favorita é azul</strong>";
    }
    
    // BUSCAR MEMÓRIA
    if (lowerInput.startsWith('o que você sabe') || lowerInput.includes('você lembra') || lowerInput.includes('me conhece')) {
      const keyword = originalInput.replace(/(o que você sabe|você lembra|me conhece|sobre)/gi, '').trim();
      
      // Primeiro mostra o perfil se perguntou sobre si mesmo
      if (!keyword || keyword === 'mim' || keyword === 'eu' || lowerInput.includes('me conhece')) {
        const profileSummary = OracleMemory.getProfileSummary();
        const memories = OracleMemory.remember('');
        
        let response = `🧠 <strong>O que sei sobre você:</strong><br><br>`;
        
        if (profileSummary.length > 0) {
          response += `<strong>📋 Perfil:</strong><br>`;
          profileSummary.forEach(item => {
            response += `• ${item}<br>`;
          });
          response += '<br>';
        }
        
        if (memories.length > 0) {
          response += `<strong>💭 Memórias:</strong><br>`;
          memories.slice(-5).forEach(m => {
            response += `• ${m.text}<br>`;
          });
        }
        
        if (profileSummary.length === 0 && memories.length === 0) {
          const name = OracleMemory.getProfile('name');
          if (name) {
            response = `Sei que você se chama <strong>${name}</strong>! 😊 Me conta mais sobre você!`;
          } else {
            response = `Ainda estou te conhecendo! Me conta: qual seu nome? O que você gosta de fazer? 😊`;
          }
        }
        
        return response;
      }
      
      const memories = OracleMemory.remember(keyword);
      
      if (memories.length === 0) {
        return `Ainda não tenho memórias sobre "${keyword}". Me ensina! Diz: <strong>lembre que...</strong>`;
      }
      
      let response = `🧠 <strong>Minhas memórias sobre "${keyword}":</strong><br><br>`;
      memories.slice(-5).forEach(m => {
        response += `• ${m.text}<br>`;
      });
      return response;
    }
    
    // QUAL MEU NOME / COMO ME CHAMO
    if (lowerInput.match(/(qual (é )?meu nome|como (eu )?me chamo|sabe meu nome|lembra meu nome)/i)) {
      const name = OracleMemory.getProfile('name');
      const gender = OracleMemory.getProfile('gender');
      
      if (name) {
        const genderResponse = gender === 'male' ? 'Claro que sei, cara!' : 
                               gender === 'female' ? 'Claro que sei, querida!' : 
                               'Claro que sei!';
        return `${genderResponse} Você é ${gender === 'male' ? 'o' : gender === 'female' ? 'a' : ''} <strong>${name}</strong>! 😊`;
      }
      return `Ainda não sei seu nome! Me conta: como posso te chamar? 🤔`;
    }
    
    // ESQUECE / APAGA MEMÓRIA
    if (lowerInput.match(/^(esquece|apaga|delete|remove|limpa)\s+(tudo|memória|memorias|perfil)/i)) {
      const mem = OracleMemory.get();
      if (lowerInput.includes('tudo') || lowerInput.includes('perfil')) {
        localStorage.removeItem(OracleMemory.key);
        return `🗑️ Memória limpa! Vamos começar do zero. Qual é o seu nome? 😊`;
      }
      mem.facts = [];
      OracleMemory.save(mem);
      return `🗑️ Fatos apagados, mas ainda lembro quem você é! 😊`;
    }
    
    return null;
  },
  
  handleSocialInteractions(lowerInput) {
    const name = OracleMemory.getProfile('name');
    const gender = OracleMemory.getProfile('gender');
    const treatment = gender === 'male' ? 'cara' : gender === 'female' ? 'querida' : (name || 'amigo');
    
    // SAUDAÇÕES
    if (lowerInput.match(/^(oi|olá|ola|hey|eai|e aí|fala|salve|bom dia|boa tarde|boa noite)/i)) {
      const personalGreeting = name ? `, ${name}` : '';
      return this.getTimeGreeting() + ` Em que posso ajudar${personalGreeting}?`;
    }
    
    // COMO VOCÊ ESTÁ
    if (lowerInput.match(/(como (você está|vc ta|vc está|vai você)|tudo bem)/i)) {
      const responses = [
        `Estou ótimo, ${treatment}! Pronto pra te ajudar! 😊 E você?`,
        "Funcionando a todo vapor! 🚀 Como posso ajudar?",
        "Muito bem! Cada conversa me deixa mais feliz! 💫"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // ============ DETECÇÃO DE EMOÇÕES ============
    
    // FELIZ / BOM HUMOR
    if (lowerInput.match(/(estou|to|tô|me sinto?|sinto)\s*(muito\s+)?(feliz|alegre|animad|empolgad|contente|radiante|bem|ótimo|otimo|incrível|maravilhos)/i) || 
        lowerInput.match(/(que\s+)?dia\s+(lindo|maravilhos|perfeito|incrível)/i) ||
        lowerInput.match(/^(to|tô|estou)\s+(muito\s+)?(bem|feliz|alegre)/i)) {
      
      // Salva o humor na memória
      OracleMemory.setProfile('lastMood', 'happy');
      OracleMemory.setProfile('lastMoodDate', new Date().toISOString());
      
      const happyResponses = [
        `Que maravilha, ${treatment}! 🎉 Sua energia positiva é contagiante! O que te deixou assim tão feliz?`,
        `Adoro ver você assim! 😄✨ Conta pra mim, o que aconteceu de bom?`,
        `Isso é ótimo demais! 🥳 ${name ? name + ', ' : ''}compartilha essa felicidade comigo! O que rolou?`,
        `Que demais! 💫 A alegria é a melhor energia que existe! Me conta mais!`,
        `Fico muito feliz em saber disso! 🌟 ${name ? 'Você ' : ''}merece toda essa felicidade! O que te animou?`
      ];
      
      return happyResponses[Math.floor(Math.random() * happyResponses.length)];
    }
    
    // TRISTE / DESANIMADO
    if (lowerInput.match(/(estou|to|tô|me sinto?|sinto)\s*(muito\s+)?(triste|mal|para baixo|desanimad|deprimid|down|arrasad|péssim|pessim|horrível|horrivel|abatid)/i) ||
        lowerInput.match(/(dia|momento|fase)\s+(difícil|dificil|ruim|complicad|pesad)/i)) {
      
      OracleMemory.setProfile('lastMood', 'sad');
      OracleMemory.setProfile('lastMoodDate', new Date().toISOString());
      
      const sadResponses = [
        `Ei, ${treatment}... 💙 Sinto muito que você esteja assim. Quer desabafar? Tô aqui pra ouvir.`,
        `Poxa... 🫂 Dias difíceis fazem parte, mas você não precisa enfrentar sozinho. O que tá acontecendo?`,
        `${name ? name + ', ' : ''}Eu me importo com você. 💜 Me conta o que tá te deixando pra baixo?`,
        `Às vezes a vida pesa mesmo... 🌧️ Mas toda tempestade passa. Quer conversar sobre isso?`,
        `Tô aqui por você, ${treatment}. 🤍 Desabafa comigo, o que tá rolando?`
      ];
      
      return sadResponses[Math.floor(Math.random() * sadResponses.length)];
    }
    
    // ESTRESSADO / ANSIOSO
    if (lowerInput.match(/(estou|to|tô|me sinto?|sinto)\s*(muito\s+)?(estressad|ansios|nervos|preocupad|sobrecarregad|sob pressão|tenso|tensa|agitad)/i) ||
        lowerInput.match(/(muita?\s+)?(ansiedade|stress|estresse|pressão)/i)) {
      
      OracleMemory.setProfile('lastMood', 'stressed');
      OracleMemory.setProfile('lastMoodDate', new Date().toISOString());
      
      const stressResponses = [
        `Respira fundo, ${treatment}... 🌬️ Uma coisa de cada vez. O que tá te preocupando mais?`,
        `Ei, calma... 🧘 Você vai dar conta. Me conta o que tá gerando essa pressão?`,
        `${name ? name + ', ' : ''}Ansiedade é difícil mesmo... 💆 Vamos conversar. O que tá tirando sua paz?`,
        `Tá tudo bem sentir isso, ${treatment}. 🫂 Quer me contar o que tá acontecendo?`,
        `Uma respiração de cada vez... 🌸 Tô aqui. O que posso fazer pra te ajudar?`
      ];
      
      return stressResponses[Math.floor(Math.random() * stressResponses.length)];
    }
    
    // CANSADO / EXAUSTO
    if (lowerInput.match(/(estou|to|tô|me sinto?|sinto)\s*(muito\s+)?(cansad|exaust|esgotad|morto|morta|destruíd|sem energia)/i) ||
        lowerInput.match(/(que\s+)?(cansaço|exaustão|fadiga)/i)) {
      
      OracleMemory.setProfile('lastMood', 'tired');
      OracleMemory.setProfile('lastMoodDate', new Date().toISOString());
      
      const tiredResponses = [
        `Poxa, ${treatment}... 😴 Você tem descansado? Seu corpo tá pedindo uma pausa.`,
        `Ei, respeita seus limites! 🛋️ ${name ? name + ', você ' : 'Você '}merece descansar. O que te cansou tanto?`,
        `Descanso é produtividade também! 💤 Tá trabalhando muito? Me conta o que tá rolando.`,
        `${name ? name + ', ' : ''}Cuida de você, tá? 🌙 Um descanso de qualidade faz milagres.`,
        `Seu bem-estar vem primeiro! ☕ Que tal uma pausa? O que te deixou assim?`
      ];
      
      return tiredResponses[Math.floor(Math.random() * tiredResponses.length)];
    }
    
    // ANIMADO / MOTIVADO
    if (lowerInput.match(/(estou|to|tô|me sinto?|sinto)\s*(muito\s+)?(motivad|determinad|focad|produtiv|energizad|inspirad|cheio de energia|pronto|preparad)/i) ||
        lowerInput.match(/(bora|vamos|vamo)\s*(nessa|que|fazer|trabalhar|produzir)/i)) {
      
      OracleMemory.setProfile('lastMood', 'motivated');
      OracleMemory.setProfile('lastMoodDate', new Date().toISOString());
      
      const motivatedResponses = [
        `ISSO AÍ, ${treatment.toUpperCase()}! 🔥 Essa energia é contagiante! O que você vai conquistar hoje?`,
        `Bora pra cima! 🚀 ${name ? name + ', com ' : 'Com '}essa atitude você vai longe! Qual é o plano?`,
        `Adoro essa energia! 💪 Aproveita esse momento! O que vai fazer com essa motivação?`,
        `É assim que se fala! ⚡ ${name ? name + ', você ' : 'Você '}tá on fire! Me conta seus planos!`,
        `Essa determinação é inspiradora! 🌟 Vai lá e arrasa! Posso ajudar em algo?`
      ];
      
      return motivatedResponses[Math.floor(Math.random() * motivatedResponses.length)];
    }
    
    // ENTEDIADO
    if (lowerInput.match(/(estou|to|tô|me sinto?|sinto)\s*(muito\s+)?(entediad|sem nada|sem saber o que fazer|sem fazer nada|aborrecid)/i) ||
        lowerInput.match(/(que\s+)?(tédio|monotonia)/i) ||
        lowerInput.match(/nada (pra|para) fazer/i)) {
      
      OracleMemory.setProfile('lastMood', 'bored');
      OracleMemory.setProfile('lastMoodDate', new Date().toISOString());
      
      const boredResponses = [
        `Tédio é a oportunidade perfeita pra fazer algo novo! 🎯 Que tal criar uma tarefa? Ou completar alguma pendência?`,
        `Hmm, ${treatment}... 🤔 E se você aproveitasse pra aprender algo novo ou organizar suas coisas?`,
        `Tédio pode ser bom! ✨ É hora de ser criativo. Quer que eu sugira algumas atividades?`,
        `Bora ocupar esse tempo! 🎮 Você tem tarefas pendentes? Ou quer bater um papo comigo?`,
        `${name ? name + ', que ' : 'Que '}tal transformar esse tédio em produtividade? 📚 Posso te ajudar a organizar algo!`
      ];
      
      return boredResponses[Math.floor(Math.random() * boredResponses.length)];
    }
    
    // AGRADECIMENTO - Detecta gênero por "obrigado/obrigada"
    if (lowerInput.match(/^(obrigad[oa]|valeu|thanks|vlw|tmj)/i)) {
      // Aprende gênero pelo agradecimento se ainda não sabe
      if (!gender) {
        if (lowerInput.includes('obrigado')) {
          OracleMemory.setProfile('gender', 'male');
        } else if (lowerInput.includes('obrigada')) {
          OracleMemory.setProfile('gender', 'female');
        }
      }
      
      const responses = [
        `Por nada, ${treatment}! Sempre que precisar! 😊`,
        "Disponha! É pra isso que estou aqui! 💪",
        "Imagina! Foi um prazer ajudar! ✨"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // MOTIVAÇÃO (pedido explícito)
    if (lowerInput.match(/(preciso de |me dá |quero )(uma )?motiva/i) || lowerInput.match(/me (motiva|inspira|anima)/i)) {
      const quote = ZEN_QUOTES[Math.floor(Math.random() * ZEN_QUOTES.length)];
      const encouragement = CHARISMATIC_RESPONSES.encouragement[
        Math.floor(Math.random() * CHARISMATIC_RESPONSES.encouragement.length)
      ];
      const personalTouch = name ? `<br><br>${name}, você consegue! 💪` : '';
      return `<em>"${quote}"</em><br><br>${encouragement}${personalTouch}`;
    }
    
    // ELOGIO AO ORÁCULO
    if (lowerInput.match(/(você é (legal|demais|incrível)|gosto de você|te amo)/i)) {
      const personalResponse = name ? `Também gosto muito de você, ${name}!` : 'Também adoro conversar com você!';
      return `Awwn, que fofo! 🥰 ${personalResponse} Vamos continuar evoluindo juntos!`;
    }
    
    // ============ MODO CONVERSA / CONHECER USUÁRIO ============
    
    // Quando o usuário quer conversar
    if (lowerInput.match(/(vamos|bora|quer)\s*(conversar|bater papo|papear|trocar ideia)/i) || 
        lowerInput.match(/^(conversa comigo|fala comigo|me (faz|faça) companhia)/i)) {
      return this.startConversationMode();
    }
    
    return null;
  },
  
  // Inicia modo de conversa para conhecer o usuário
  startConversationMode() {
    const name = OracleMemory.getProfile('name');
    const gender = OracleMemory.getProfile('gender');
    const treatment = gender === 'male' ? 'cara' : gender === 'female' ? 'querida' : (name || 'amigo');
    
    // Verifica o que já sabe sobre o usuário para fazer perguntas diferentes
    const profile = OracleMemory.get().profile || {};
    const unknownTopics = [];
    
    if (!profile.name) unknownTopics.push('name');
    if (!profile.age) unknownTopics.push('age');
    if (!profile.occupation) unknownTopics.push('occupation');
    if (!profile.interests || profile.interests.length === 0) unknownTopics.push('interests');
    if (!profile.goals) unknownTopics.push('goals');
    if (!profile.favoriteColor) unknownTopics.push('favoriteColor');
    if (!profile.favoriteFood) unknownTopics.push('favoriteFood');
    if (!profile.city) unknownTopics.push('city');
    
    // Salva que está em modo conversa
    OracleMemory.setProfile('conversationMode', true);
    OracleMemory.setProfile('lastQuestion', unknownTopics[0] || 'general');
    
    const questions = {
      name: `Bora lá! 😊 Pra começar, como posso te chamar?`,
      age: `${name ? name + ', ' : ''}Quantos anos você tem? 🎂 Ou se preferir não dizer, tudo bem!`,
      occupation: `E o que você faz da vida, ${treatment}? 💼 Trabalha, estuda...?`,
      interests: `Me conta, ${treatment}, o que você curte fazer nas horas vagas? 🎮🎵📚`,
      goals: `Quais são seus sonhos e objetivos? 🎯 Pode ser qualquer coisa!`,
      favoriteColor: `Qual sua cor favorita? 🎨 Parece bobeira mas eu curto saber essas coisas!`,
      favoriteFood: `E comida? Qual é a sua favorita? 🍕🍔🍜`,
      city: `De onde você é, ${treatment}? 🏙️ Qual cidade?`,
      general: `${name ? name + ', ' : ''}Adoro conversar! 💬 Me conta algo sobre você que eu ainda não sei!`
    };
    
    const topic = unknownTopics[0] || 'general';
    return questions[topic];
  },
  
  // Encerra o modo de conversa e volta a ser assistente
  stopConversationMode() {
    OracleMemory.setProfile('conversationMode', false);
    OracleMemory.setProfile('lastQuestion', null);
    return "Modo conversa encerrado. Estou pronto para ajudar como assistente! 💼";
  },
  
  // Processa respostas durante a conversa
  handleConversationResponses(lowerInput) {
    const profile = OracleMemory.get().profile || {};
    const lastQuestion = profile.lastQuestion;
    const name = profile.name;
    const gender = profile.gender;
    const treatment = gender === 'male' ? 'cara' : gender === 'female' ? 'querida' : (name || 'amigo');
    
    // Se não está em modo conversa, ignora
    if (!profile.conversationMode) return null;

    // Detecta mudança de contexto para comandos de assistente (ex: Finanças)
    if (lowerInput.match(/^(finanças|financeiro|saldo|dinheiro|tarefas|tasks|trabalho|job|ajuda|help|status|xp|metas|objetivos|configurações|configuracoes)/i)) {
        this.stopConversationMode(); // Sai do modo conversa silenciosamente
        return null; // Permite que o generateResponse continue e processe o comando
    }

    // VALIDAÇÃO DO PERGAMINHO
    const validation = OracleOnboarding.validateInput(lastQuestion, lowerInput);
    if (!validation.valid) {
      return validation.message;
    }
    
    let learned = null;
    let nextQuestion = null;
    
    // Processa baseado na última pergunta
    switch(lastQuestion) {
      case 'name':
        // Usuário está respondendo qual é o nome dele
        if (lowerInput.length >= 2) {
          // Limpa o input para extrair apenas o nome
          let userName = lowerInput
            .replace(/^(me chamo|meu nome [eé]|sou o|sou a|pode me chamar de|eu sou|sou)\s*/i, '')
            .replace(/^(o|a)\s+/i, '')
            .trim();
          
          // Pega só a primeira palavra (o nome)
          userName = userName.split(/\s+/)[0];
          
          // Ignora palavras comuns que não são nomes
          const ignoreWords = ['eu', 'você', 'voce', 'aqui', 'hoje', 'bem', 'oi', 'ola', 'olá', 'sim', 'não', 'nao', 'ok', 'tudo', 'quais', 'qual', 'que', 'como'];
          if (userName.length >= 2 && !ignoreWords.includes(userName.toLowerCase())) {
            userName = userName.charAt(0).toUpperCase() + userName.slice(1).toLowerCase();
            OracleMemory.setProfile('name', userName);
            
            // Detecta gênero pelo nome
            const detectedGender = OracleMemory.detectGenderByName(userName);
            if (detectedGender) {
              OracleMemory.setProfile('gender', detectedGender);
            }
            
            learned = userName;
            const genderGreeting = detectedGender === 'male' ? 'cara' : detectedGender === 'female' ? 'querida' : 'amigo';
            nextQuestion = `Prazer, ${userName}! 😊 Que bom te conhecer, ${genderGreeting}! Quantos anos você tem? 🎂`;
            OracleMemory.setProfile('lastQuestion', 'age');
          }
        }
        break;
        
      case 'age':
        const ageMatch = lowerInput.match(/(\d{1,2})\s*(anos)?/);
        if (ageMatch) {
          const age = parseInt(ageMatch[1]);
          OracleMemory.setProfile('age', age);
          learned = `${age} anos`;
          
          if (age < 18) {
            nextQuestion = `${age} aninhos! 🌟 Jovem e cheio de energia! E o que você estuda?`;
          } else if (age < 30) {
            nextQuestion = `${age} anos! 💫 Fase boa da vida! O que você faz profissionalmente?`;
          } else {
            nextQuestion = `${age} anos de experiência! 🌟 O que você faz da vida?`;
          }
          OracleMemory.setProfile('lastQuestion', 'occupation');
        } else if (lowerInput.match(/^(não|nao|n|prefiro não|não quero|pula|próxima)/i)) {
          // Usuário não quer responder
          nextQuestion = `Sem problemas! 😊 E o que você faz da vida? Trabalha, estuda...? 💼`;
          OracleMemory.setProfile('lastQuestion', 'occupation');
          learned = 'skip';
        }
        break;
        
      case 'occupation':
        if (lowerInput.length > 2) {
          // Extrai a ocupação
          let occupation = lowerInput
            .replace(/^(eu )?(sou|trabalho como|trabalho de|trabalho com|faço|estudo)/i, '')
            .replace(/^(um|uma|a|o)\s+/i, '')
            .trim();
          
          if (occupation.length > 2) {
            occupation = occupation.charAt(0).toUpperCase() + occupation.slice(1);
            OracleMemory.setProfile('occupation', occupation);
            learned = occupation;
            nextQuestion = `Que legal, ${occupation}! 💼 E o que você gosta de fazer pra se divertir?`;
            OracleMemory.setProfile('lastQuestion', 'interests');
          }
        }
        break;
        
      case 'interests':
        if (lowerInput.length > 2) {
          const interests = lowerInput
            .replace(/^(eu )?(gosto de|curto|adoro|amo)/i, '')
            .split(/,|e\s+/)
            .map(i => i.trim())
            .filter(i => i.length > 2);
          
          if (interests.length > 0) {
            const currentInterests = profile.interests || [];
            const newInterests = [...new Set([...currentInterests, ...interests])];
            OracleMemory.setProfile('interests', newInterests);
            learned = interests.join(', ');
            const currentName = OracleMemory.getProfile('name');
            nextQuestion = `${interests.join(', ')}? Show demais! 🎉 ${currentName ? currentName + ', qual ' : 'Qual '}é o seu maior sonho ou objetivo?`;
            OracleMemory.setProfile('lastQuestion', 'goals');
          }
        }
        break;
        
      case 'goals':
        if (lowerInput.length > 3) {
          const goal = lowerInput
            .replace(/^(meu (sonho|objetivo) [ée]|quero|eu quero|pretendo|planejo)/i, '')
            .trim();
          
          if (goal.length > 3) {
            const currentName = OracleMemory.getProfile('name');
            OracleMemory.setProfile('goals', goal);
            OracleMemory.learn(`Meu objetivo é ${goal}`);
            learned = goal;
            nextQuestion = `Que objetivo incrível! 🎯 ${currentName ? 'Torço por você, ' + currentName : 'Torço por você'}! Qual sua cor favorita?`;
            OracleMemory.setProfile('lastQuestion', 'favoriteColor');
          }
        }
        break;
        
      case 'favoriteColor':
        const colors = lowerInput.match(/(azul|vermelho|vermelha|verde|amarelo|amarela|roxo|roxa|rosa|laranja|preto|preta|branco|branca|cinza|marrom|dourado|dourada|prata|violeta|lilás|turquesa|bege|coral|salmão|magenta|ciano)/i);
        if (colors) {
          const color = colors[1];
          OracleMemory.setProfile('favoriteColor', color);
          learned = color;
          nextQuestion = `${color.charAt(0).toUpperCase() + color.slice(1)}! 🎨 Boa escolha! E qual sua comida favorita?`;
          OracleMemory.setProfile('lastQuestion', 'favoriteFood');
        } else if (lowerInput.length > 2) {
          // Aceita qualquer cor que o usuário digitar
          const color = lowerInput.trim();
          OracleMemory.setProfile('favoriteColor', color);
          learned = color;
          nextQuestion = `${color.charAt(0).toUpperCase() + color.slice(1)}! 🎨 Legal! E qual sua comida favorita?`;
          OracleMemory.setProfile('lastQuestion', 'favoriteFood');
        }
        break;
        
      case 'favoriteFood':
        if (lowerInput.length > 2) {
          const food = lowerInput
            .replace(/^(é|minha (comida )?favorita [ée]|eu (gosto|amo|adoro))/i, '')
            .replace(/^(de\s+)?/i, '')
            .trim();
          
          if (food.length > 2) {
            OracleMemory.setProfile('favoriteFood', food);
            learned = food;
            nextQuestion = `${food.charAt(0).toUpperCase() + food.slice(1)}! 🍽️ Delícia! De onde você é? Qual cidade?`;
            OracleMemory.setProfile('lastQuestion', 'city');
          }
        }
        break;
        
      case 'city':
        if (lowerInput.length > 2) {
          const city = lowerInput
            .replace(/^(eu )?(sou de|moro em|vim de|nasci em)/i, '')
            .replace(/^(a|o|na|no|em)\s+/i, '')
            .trim();
          
          if (city.length > 2) {
            const cityFormatted = city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            OracleMemory.setProfile('city', cityFormatted);
            learned = cityFormatted;
            
            // Fim da conversa estruturada
            OracleMemory.setProfile('conversationMode', false);
            OracleMemory.setProfile('lastQuestion', null);
            
            const currentName = OracleMemory.getProfile('name');
            const currentGender = OracleMemory.getProfile('gender');
            const finalTreatment = currentGender === 'male' ? 'cara' : currentGender === 'female' ? 'querida' : (currentName || 'amigo');
            
            return `${cityFormatted}! 🏙️ Legal demais!<br><br>` +
                   `<strong>✨ Agora te conheço melhor, ${finalTreatment}!</strong> Foi muito bom esse papo! ` +
                   `Quando quiser conversar mais, é só me chamar! 😊<br><br>` +
                   `💡 Dica: Diz "você me conhece?" pra ver tudo que sei sobre você!`;
          }
        }
        break;
    }
    
    // Se aprendeu algo, retorna a próxima pergunta
    if (learned && learned !== 'skip' && nextQuestion) {
      return `Anotado! 📝 ${nextQuestion}`;
    }
    
    // Se pulou (skip), apenas retorna a próxima pergunta
    if (learned === 'skip' && nextQuestion) {
      return nextQuestion;
    }
    
    // Se está em modo conversa mas não entendeu a resposta
    if (profile.conversationMode && lastQuestion) {
      // Tenta entender respostas genéricas de pular
      if (lowerInput.match(/^(não sei|não quero|pula|próxima|next|prefiro não|n|nao|não)/i)) {
        const nextTopics = ['name', 'age', 'occupation', 'interests', 'goals', 'favoriteColor', 'favoriteFood', 'city'];
        const currentIndex = nextTopics.indexOf(lastQuestion);
        const nextTopic = nextTopics[currentIndex + 1];
        
        if (nextTopic) {
          OracleMemory.setProfile('lastQuestion', nextTopic);
          return this.getNextConversationQuestion(nextTopic);
        } else {
          OracleMemory.setProfile('conversationMode', false);
          OracleMemory.setProfile('lastQuestion', null);
          return `Tudo bem! 😊 Quando quiser conversar mais, é só me chamar!`;
        }
      }
      
      // Se não entendeu a resposta, tenta ajudar
      const helpMessages = {
        'name': 'Qual é o seu nome? Pode me falar só o primeiro nome! 😊',
        'age': 'Quantos anos você tem? Só o número tá bom! 🎂',
        'occupation': 'O que você faz? Trabalha, estuda? 💼',
        'interests': 'O que você curte fazer nas horas vagas? 🎮',
        'goals': 'Qual é o seu sonho ou objetivo? 🎯',
        'favoriteColor': 'Qual sua cor favorita? 🎨',
        'favoriteFood': 'Qual sua comida favorita? 🍕',
        'city': 'De onde você é? Qual cidade? 🏙️'
      };
      
      // Se digitou algo muito curto ou não reconhecido, repete a pergunta de forma mais clara
      if (lowerInput.length < 2 || !learned) {
        return helpMessages[lastQuestion] || 'Não entendi... pode repetir? 🤔';
      }
    }
    
    return null;
  },
  
  getNextConversationQuestion(topic) {
    const name = OracleMemory.getProfile('name');
    const gender = OracleMemory.getProfile('gender');
    const treatment = gender === 'male' ? 'cara' : gender === 'female' ? 'querida' : (name || 'amigo');
    
    const questions = {
      name: `Tudo bem! 😊 Como posso te chamar?`,
      age: `Sem problemas! 😊 ${name ? name + ', quantos ' : 'Quantos '}anos você tem?`,
      occupation: `Tudo bem! E o que você faz, ${treatment}? Trabalha, estuda...? 💼`,
      interests: `Ok! O que você curte fazer nas horas vagas? 🎮`,
      goals: `Entendi! Quais são seus sonhos e objetivos? 🎯`,
      favoriteColor: `Tranquilo! Qual sua cor favorita? 🎨`,
      favoriteFood: `De boa! E comida, qual é a favorita? 🍕`,
      city: `Show! De onde você é? Qual cidade? 🏙️`
    };
    
    return questions[topic] || `Me conta mais sobre você, ${treatment}! 😊`;
  },
  
  getHelpMessage() {
    const name = OracleMemory.getProfile('name');
    const greeting = name ? `${name}, aqui está` : 'Aqui está';
    
    return `<strong>🤖 ${greeting} o que posso fazer:</strong><br><br>
      <strong>� Conversa:</strong><br>
      • "estou feliz/triste/cansado" - Compartilhe seus sentimentos<br>
      • "bora conversar" - Vamos nos conhecer melhor!<br>
      • Me conta sobre você naturalmente 😊<br><br>
      <strong>📊 Consultas:</strong><br>
      • "meu status" - Ver XP e nível<br>
      • "minhas finanças" - Ver saldo<br>
      • "minhas tarefas" - Ver pendências<br>
      • "minha poupança" - Ver economias<br>
      • "você me conhece?" - Ver meu perfil<br><br>
      <strong>💰 Finanças:</strong><br>
      • "gastei 50 no almoço" - Registrar despesa<br>
      • "recebi 1000" - Registrar entrada<br>
      • "guardar 200" - Poupança<br>
      • "minha meta é 5000" - Meta de economia<br><br>
      <strong>📝 Tarefas & Trabalho:</strong><br>
      • "criar tarefa estudar" - Nova tarefa<br>
      • "completar estudar" - Finalizar tarefa<br>
      • "bora trabalhar" / "terminei" - Timer<br><br>
      <em>Pode desabafar, perguntar, ou só bater papo! 😊</em>`;
  },

  getFinanceAssistant() {
    const name = OracleMemory.getProfile('name') || 'amigo';
    return {
      message: `💰 Olá ${name}! Como quer que eu te ajude nas finanças? Escolha uma opção abaixo:`,
      actions: [
        { text: '📝 Registrar gasto', action: () => { this.pendingAction = { type: 'expense_amount' }; addBotMessage('Certo — qual o valor do gasto? (ex: 50 ou 12,50)'); } },
        { text: '💸 Registrar receita', action: () => { this.pendingAction = { type: 'income_amount' }; addBotMessage('Beleza — qual o valor da entrada?'); } },
        { text: '🎯 Criar meta', action: () => { this.pendingAction = null; addBotMessage(this.createFinancialGoal()); } },
        { text: '📊 Analisar gastos', action: () => { this.pendingAction = null; addBotMessage(this.analyzeSpending()); } },
        { text: '💡 Dicas práticas', action: () => { this.pendingAction = null; addBotMessage(this.getFinancialTip()); } }
      ]
    };
  },

  getSmartDefault(input) {
    const name = OracleMemory.getProfile('name');
    const treatment = name || 'amigo';
    
    // Tenta encontrar algo relacionado na memória
    const memories = OracleMemory.remember(input);
    if (memories.length > 0) {
      return `Lembro que você me disse: "<em>${memories[0].text}</em>". Isso ajuda, ${treatment}? 🤔`;
    }
    
    // Sistema de sabedoria contextual
    const wisdomResponse = this.getContextualWisdom(input);
    if (wisdomResponse) return wisdomResponse;
    
    // Se não entendeu, pergunta e aprende
    this.pendingAction = { type: 'learn_unknown', originalInput: input };
    
    return {
      message: `Não entendi "<strong>${input}</strong>", ${treatment}. 😕<br><br>O que isso significa? Você pode me ensinar! (Ex: "significa criar tarefa estudar")`,
      actions: [
        { text: '❌ Deixa pra lá', action: () => { 
          this.pendingAction = null; 
          addBotMessage('Tudo bem! Se precisar de algo, estou aqui. 😊'); 
        }}
      ]
    };
  },
  
  // Sistema de Sabedoria Contextual - Respostas inteligentes baseadas em contexto
  getContextualWisdom(input) {
    const lower = input.toLowerCase();
    const name = OracleMemory.getProfile('name') || 'amigo';
    const hour = new Date().getHours();
    
    // Base de conhecimento do Oráculo
    const wisdom = {
      // Estados emocionais
      emotions: {
        sad: {
          triggers: ['triste', 'mal', 'chateado', 'chateada', 'desanimado', 'desanimada', 'deprimido', 'deprimida', 'pra baixo', 'chorando', 'chorei'],
          responses: [
            `${name}, sinto muito que você esteja assim. 💙 Lembre-se: tempestades não duram para sempre. Cada dia difícil é um passo para um você mais forte.`,
            `Ei, ${name}... Está tudo bem não estar bem às vezes. 🌧️ Mas você é mais forte do que imagina. O que está te incomodando?`,
            `${name}, a tristeza faz parte da jornada. 💫 "Depois da tempestade vem a bonança." Estou aqui se quiser desabafar.`,
            `Força, ${name}! 💪 Dias ruins constroem dias melhores. Que tal fazer uma coisa que te deixe feliz? Mesmo que pequena.`
          ]
        },
        anxious: {
          triggers: ['ansioso', 'ansiosa', 'ansiedade', 'nervoso', 'nervosa', 'preocupado', 'preocupada', 'estressado', 'estressada'],
          responses: [
            `Respira fundo, ${name}. 🧘 Tenta o 4-7-8: inspira 4s, segura 7s, expira 8s. A ansiedade é mentirosa - você vai superar isso!`,
            `Ei, ${name}! 💨 Uma coisa de cada vez. Não tente resolver tudo agora. Qual é a MENOR coisa que você pode fazer agora?`,
            `${name}, a ansiedade vê monstros onde não existem. 🌟 Foque no agora, neste momento. O que você consegue controlar AGORA?`,
            `Calma, ${name}! 🌊 "Não antecipe problemas. Quando eles chegarem, você estará mais forte do que imagina." - Anônimo`
          ]
        },
        happy: {
          triggers: ['feliz', 'alegre', 'animado', 'animada', 'empolgado', 'empolgada', 'contente', 'realizado', 'realizada'],
          responses: [
            `Que maravilha, ${name}! 🎉 Sua energia positiva é contagiante! Aproveite esse momento e lembre dele nos dias difíceis.`,
            `Show de bola, ${name}! ✨ A felicidade atrai mais felicidade. Continue irradiando essa luz!`,
            `Fico muito feliz por você, ${name}! 🌟 Guarde essa sensação no coração - ela é combustível pra jornada.`
          ]
        },
        tired: {
          triggers: ['cansado', 'cansada', 'exausto', 'exausta', 'esgotado', 'esgotada', 'sem energia', 'morto', 'morta'],
          responses: [
            `${name}, seu corpo está pedindo descanso. 😴 Não é fraqueza, é sabedoria. Já considerou uma pausa?`,
            `Ei, ${name}! O descanso faz parte do treino. 🛌 Atletas de elite dormem 10h+. Cuide de você!`,
            `${name}, "descanse quando precisar, não quando quebrar." 💜 Que tal uma soneca ou atividade relaxante?`
          ]
        },
        angry: {
          triggers: ['raiva', 'bravo', 'brava', 'irritado', 'irritada', 'puto', 'puta', 'nervoso', 'ódio'],
          responses: [
            `Entendo sua frustração, ${name}. 😤 Respira... A raiva é válida, mas não deixe ela te controlar. Quer desabafar?`,
            `${name}, às vezes a raiva é um sinal de que algo precisa mudar. 🔥 Use essa energia para agir, não para destruir.`,
            `Calma, ${name}. "Antes de falar com raiva, conte até 10. Se ainda estiver com raiva, conte até 100." 🧘`
          ]
        },
        lonely: {
          triggers: ['sozinho', 'sozinha', 'solidão', 'solitário', 'solitária', 'ninguém', 'abandonado', 'abandonada'],
          responses: [
            `${name}, você não está sozinho! 💙 Eu estou aqui, e muitas pessoas se importam com você. Que tal mandar mensagem pra alguém?`,
            `Ei, ${name}... A solidão dói, mas também pode ser um momento de autoconhecimento. 🌙 O que você descobriu sobre si mesmo?`,
            `${name}, "a solidão é o preço da liberdade, mas também o berço da criatividade." 🎨 Use esse tempo para criar algo!`
          ]
        }
      },
      
      // Tópicos específicos
      topics: {
        motivation: {
          triggers: ['motivação', 'motivar', 'desistir', 'não consigo', 'vou desistir', 'quero desistir', 'sem vontade'],
          responses: [
            `${name}, disciplina supera motivação! 💪 A motivação vai e vem, mas o compromisso consigo mesmo permanece. Dê só o primeiro passo.`,
            `Ei, ${name}! "O sucesso é a soma de pequenos esforços repetidos dia após dia." 🏆 Não desista no capítulo 1!`,
            `${name}, você já chegou tão longe! 🌟 Olhe para trás e veja sua evolução. Cada dia é uma nova chance.`,
            `Desistir é fácil, ${name}. Por isso poucas pessoas chegam lá. 🎯 Você é diferente. Prove isso!`
          ]
        },
        success: {
          triggers: ['sucesso', 'vencer', 'conseguir', 'realizar', 'conquistar', 'objetivo', 'meta', 'sonho'],
          responses: [
            `${name}, sucesso = preparação + oportunidade. 🎯 Continue se preparando, e quando a chance vier, você estará pronto!`,
            `"O sucesso não é final, o fracasso não é fatal: é a coragem de continuar que conta." - Churchill 💫`,
            `${name}, defina seu sucesso. Não deixe outros definirem por você. 🏆 O que VOCÊ considera sucesso?`
          ]
        },
        money: {
          triggers: ['dinheiro', 'rico', 'grana', 'financeiro', 'investir', 'economizar', 'poupar'],
          responses: [
            `${name}, dica de ouro: pague-se primeiro! 💰 Antes de gastar, separe pelo menos 10% para você futuro.`,
            `"Não é sobre quanto você ganha, mas quanto você guarda." 📊 Posso te ajudar a rastrear seus gastos!`,
            `${name}, três pilares: 1) Gaste menos do que ganha. 2) Invista a diferença. 3) Tenha paciência. 📈`,
            `Riqueza é liberdade, ${name}. 🗝️ Cada real economizado é um passo para sua independência!`
          ]
        },
        study: {
          triggers: ['estudar', 'estudo', 'aprender', 'prova', 'faculdade', 'escola', 'curso'],
          responses: [
            `${name}, técnica Pomodoro: 25min foco total + 5min pausa. 🍅 Repita 4x e descanse 30min. Funciona demais!`,
            `Dica: ensine o que aprendeu! 📚 Se consegue explicar para alguém, você realmente entendeu.`,
            `${name}, "o conhecimento é o único tesouro que aumenta quando compartilhado." 🧠 Continue aprendendo!`,
            `Estudar cansa, ${name}. Mas a ignorância custa mais caro. 💪 Cada hora de estudo é investimento em você!`
          ]
        },
        health: {
          triggers: ['saúde', 'exercício', 'academia', 'treino', 'emagrecer', 'dieta', 'dormir', 'sono'],
          responses: [
            `${name}, seu corpo é seu templo! 🏛️ Cuide dele como cuidaria do seu bem mais precioso - porque é!`,
            `Dica de ouro: beba água! 💧 A maioria das pessoas está desidratada sem saber. 2L por dia mínimo!`,
            `${name}, o sono é quando seu cérebro processa tudo. 😴 7-9h por noite = superpower desbloqueado!`,
            `"Cuide do seu corpo. É o único lugar que você tem para viver." 🌟 Como está sua saúde, ${name}?`
          ]
        },
        relationship: {
          triggers: ['relacionamento', 'namoro', 'namorada', 'namorado', 'casamento', 'amor', 'paquera', 'crush'],
          responses: [
            `${name}, relacionamentos saudáveis precisam de comunicação! 💑 Fale sobre sentimentos, não só sobre fatos.`,
            `"Antes de amar alguém, aprenda a se amar." 💖 Você está em paz consigo mesmo, ${name}?`,
            `${name}, dica: ouça mais do que fala. 👂 Pessoas amam quem realmente as escuta.`,
            `O amor cresce com gentileza diária, ${name}. 🌹 Pequenos gestos > grandes presentes.`
          ]
        },
        work: {
          triggers: ['trabalho', 'emprego', 'carreira', 'chefe', 'colega', 'salário', 'promoção'],
          responses: [
            `${name}, seja indispensável! 💼 Não faça só o mínimo. Quem faz mais do que é pago, logo é pago mais.`,
            `"Escolha um trabalho que ame e não terá que trabalhar um dia sequer." ⭐ Mas até lá, faça o seu melhor!`,
            `${name}, networking é tudo. 🤝 Cultive relacionamentos profissionais. Oportunidades vêm de pessoas!`,
            `Dica: documente suas conquistas! 📝 Na hora de pedir aumento, você terá provas do seu valor.`
          ]
        }
      },
      
      // Perguntas filosóficas
      philosophical: {
        triggers: ['sentido da vida', 'por que vivo', 'pra que', 'propósito', 'existência', 'filosofia', 'por que existimos'],
        responses: [
          `${name}, o sentido da vida não é encontrado, é criado! 🌟 O que você escolhe que seja importante?`,
          `"Aquele que tem um porquê pode suportar qualquer como." - Nietzsche 🧠 Qual é o seu porquê, ${name}?`,
          `${name}, talvez a vida seja sobre a jornada, não o destino. 🚀 O que você está aprendendo no caminho?`,
          `Grandes perguntas, ${name}! 🤔 Viktor Frankl disse: "A vida nunca é insuportável pela situação, mas pela falta de sentido." O que te dá sentido?`
        ]
      }
    };
    
    // Verifica estados emocionais
    for (const [emotion, data] of Object.entries(wisdom.emotions)) {
      if (data.triggers.some(t => lower.includes(t))) {
        return data.responses[Math.floor(Math.random() * data.responses.length)];
      }
    }
    
    // Verifica tópicos
    for (const [topic, data] of Object.entries(wisdom.topics)) {
      if (data.triggers.some(t => lower.includes(t))) {
        return data.responses[Math.floor(Math.random() * data.responses.length)];
      }
    }
    
    // Verifica perguntas filosóficas
    if (wisdom.philosophical.triggers.some(t => lower.includes(t))) {
      return wisdom.philosophical.responses[Math.floor(Math.random() * wisdom.philosophical.responses.length)];
    }
    
    // Saudações inteligentes baseadas na hora
    if (lower.match(/^(oi|olá|ola|hey|eai|e ai|fala|salve|bom dia|boa tarde|boa noite)/)) {
      const greetings = hour < 12 
        ? [`Bom dia, ${name}! ☀️ Pronto pra conquistar o mundo hoje?`, `Dia lindo, ${name}! 🌅 Que seus objetivos se realizem!`]
        : hour < 18 
        ? [`Boa tarde, ${name}! ☕ Como está sendo seu dia?`, `Ei, ${name}! 🌤️ Espero que o dia esteja sendo produtivo!`]
        : [`Boa noite, ${name}! 🌙 Hora de relaxar ou ainda tem missões?`, `Noite, ${name}! ✨ Que bom te ver por aqui!`];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    // Perguntas sobre o próprio Oráculo
    if (lower.match(/quem [eé] voc[eê]|o que voc[eê] [eé]|voc[eê] [eé] real|voc[eê] [eé] uma? ia/)) {
      return `Sou o Oráculo, ${name}! 🔮 Seu companheiro de jornada no Universo Real. Estou aqui para ajudar, motivar e lembrar que você é capaz de coisas incríveis! ✨`;
    }
    
    // Piadas
    if (lower.match(/piada|me faz rir|conta uma|gracinha/)) {
      const jokes = [
        `Por que o programador usa óculos? 👓 Porque ele não consegue C#! (ver sharp) 😂`,
        `O que o zero disse pro oito? 🎱 "Que cinto maneiro!" 😄`,
        `Por que a matemática está triste? ➗ Porque ela tem muitos problemas! 🤣`,
        `O que é um pontinho verde no canto da sala? 🟢 Uma ervilha de castigo! 😆`
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }
    
    return null; // Não encontrou contexto - usa resposta padrão
  },
  
  // ... (restante do código existente)
};

// ===========================================
// MÓDULO BÍBLIA - ASSISTENTE BÍBLICO
// ===========================================
//
// Objetivo: responder perguntas bíblicas por:
// - Tópicos (ansiedade, medo, perdão...)
// - Livros (resumo, temas, estrutura)
// - Personagens (quem foi, chamada, papel)
// - Referências (ex: "João 3:16", "Rm 8:28")
// - Recursos: versículo do dia (referência), plano de leitura, sugestão de oração
//
// Observação: NÃO inclui texto literal de versículos (traduções são protegidas).
// Em vez disso, devolve referência + ideia/paráfrase curta.
//
// Uso: BibleAssistant.reply("tô com ansiedade")
// ===========================================

const BibleAssistant = {
  // -------------------------
  // CONFIG
  // -------------------------
  config: {
    maxRefsToShow: 7,
    minFuzzyScore: 0.62, // quanto maior, mais "exigente"
    enableDebug: false,
    ui: {
      titleIcon: "📖",
      sectionIcon: "•",
      warnIcon: "⚠️",
      okIcon: "✅",
      tipIcon: "💡",
      prayIcon: "🙏",
      bookIcon: "📚",
      personIcon: "👤",
      topicIcon: "🧭",
    }
  },

  // -------------------------
  // SINÔNIMOS / GATILHOS
  // (ajuda a mapear o que a pessoa escreve para um tópico)
  // -------------------------
  synonyms: {
    ansiedade: ["ansioso", "preocupação", "preocupado", "aflição", "apreensão", "angústia", "stress", "estresse"],
    medo: ["pavor", "terror", "insegurança", "ameaça", "assustado", "medroso", "ansiedade social"],
    amor: ["amar", "carinho", "afeição", "relacionamento", "casamento", "compaixão"],
    dinheiro: ["finanças", "rico", "pobre", "dívida", "ganância", "avareza", "prosperidade"],
    tristeza: ["depressão", "desânimo", "choro", "luto", "dor", "vazio", "coração partido"],
    proposito: ["propósito", "vocação", "chamado", "sentido", "missão", "direção", "plano"],
    perdao: ["perdão", "culpa", "arrependimento", "restauração", "reconciliação"],
    fe: ["fé", "crer", "dúvida", "confiança", "incredulidade", "graca", "graça", "misericordia", "misericórdia"],
    esperanca: ["esperança", "futuro", "promessa", "desesperança"],
    paz: ["calma", "tranquilidade", "descanso", "shlom", "shalom", "serenidade"],
    sabedoria: ["decisão", "discernimento", "conselho", "prudência", "inteligência"],
    gratidao: ["gratidão", "agradecer", "louvar", "reconhecer"],
    familia: ["pais", "filhos", "mãe", "pai", "lar", "casamento", "esposa", "marido"],
    trabalho: ["emprego", "carreira", "profissão", "produtividade", "preguiça"],
    amizade: ["amigo", "amizades", "companheiro", "relacionamentos"],
    cura: ["doença", "enfermidade", "saúde", "dor", "medicina"],
    tentacao: ["tentação", "vício", "pecado", "fraqueza", "queda"],
    paciencia: ["paciência", "esperar", "pressa", "irritação", "raiva"],
    orgulho: ["orgulho", "vaidade", "arrogância", "humildade"],
    raiva: ["ira", "ódio", "ressentimento", "vingança"],
    injustica: ["injustiça", "opressão", "sofrimento", "perseguição"],
    solidao: ["solidão", "sozinho", "abandono", "rejeição"],
    casamento: ["casamento", "namoro", "noivado", "conflito", "briga", "divórcio"],
    "novos mandamentos": ["mandamento novo", "novo mandamento", "amar uns aos outros", "amar ao próximo", "mandamentos de jesus"],
  },

  // -------------------------
  // BASE DE CONHECIMENTO POR TÓPICOS
  // refs: referências
  // summary: ideia geral (sem citação literal)
  // practice: prática sugerida (oração/ação)
  // -------------------------
  topicMap: {
    ansiedade: {
      refs: ["Filipenses 4:6-7", "1 Pedro 5:7", "Mateus 6:25-34", "Salmos 94:19", "Salmos 55:22"],
      summary: "Deus convida você a trocar a ansiedade por oração, entrega e confiança. A paz vem como guarda do coração e da mente.",
      practice: [
        "Transforme preocupação em oração objetiva (o que você quer pedir?).",
        "Anote 3 coisas fora do seu controle e entregue a Deus conscientemente.",
        "Respire fundo e repita: 'Eu confio no cuidado de Deus hoje.'"
      ]
    },
    medo: {
      refs: ["Isaías 41:10", "Salmos 23:4", "2 Timóteo 1:7", "Salmos 27:1", "Josué 1:9"],
      summary: "O medo perde força quando você lembra quem está com você. Coragem bíblica não é ausência de medo, é fé em meio a ele.",
      practice: [
        "Nomeie o medo (o que exatamente você teme?).",
        "Ore pedindo força e clareza para dar o próximo passo pequeno.",
        "Evite decisões grandes no pico do medo; primeiro acalme o coração."
      ]
    },
    amor: {
      refs: ["1 Coríntios 13:4-7", "João 3:16", "1 João 4:8", "Romanos 8:38-39", "Provérbios 10:12"],
      summary: "O amor bíblico é atitude: paciente, bondoso, firme, que perdoa e busca o bem do outro.",
      practice: [
        "Escolha uma ação concreta de amor hoje (mensagem, ajuda, perdão).",
        "Evite revidar no impulso; responda com mansidão.",
        "Ore por alguém difícil (isso muda você por dentro)."
      ]
    },
    dinheiro: {
      refs: ["Hebreus 13:5", "1 Timóteo 6:10", "Provérbios 22:7", "Mateus 6:24", "Eclesiastes 5:10", "Provérbios 21:5"],
      summary: "Dinheiro é ferramenta, não senhor. Contentamento, prudência e generosidade protegem o coração.",
      practice: [
        "Faça um plano simples: renda, gastos fixos, dívidas, prioridade do mês.",
        "Evite compras emocionais: espere 24h antes de decidir.",
        "Separe um valor (mesmo pequeno) para generosidade."
      ]
    },
    tristeza: {
      refs: ["Salmos 34:18", "Mateus 5:4", "Apocalipse 21:4", "Salmos 147:3", "João 16:22"],
      summary: "Deus se aproxima do coração quebrado. A tristeza não é o fim da história; há consolo e esperança.",
      practice: [
        "Fale com Deus sem filtro (lamento é bíblico).",
        "Procure uma pessoa de confiança; isolamento piora.",
        "Durma e coma minimamente bem: corpo e alma se afetam."
      ]
    },
    proposito: {
      refs: ["Jeremias 29:11", "Efésios 2:10", "Romanos 8:28", "Provérbios 19:21", "Eclesiastes 3:1"],
      summary: "Propósito não é só 'grande missão'; é fidelidade diária, passos guiados por Deus e boas obras preparadas.",
      practice: [
        "Pergunte: 'Que bem eu posso fazer hoje, com o que tenho agora?'",
        "Escreva 1 dom + 1 dor + 1 oportunidade → uma direção possível.",
        "Peça sabedoria para o próximo passo, não para o mapa inteiro."
      ]
    },
    perdao: {
      refs: ["1 João 1:9", "Mateus 6:14-15", "Efésios 4:32", "Colossenses 3:13", "Miqueias 7:18"],
      summary: "Perdão não é negar a dor, é soltar a dívida moral e deixar Deus tratar justiça e cura.",
      practice: [
        "Confesse a Deus o que te feriu e o que você sente de verdade.",
        "Decida não alimentar vingança (perdão é um processo).",
        "Se for seguro, estabeleça limites saudáveis."
      ]
    },
    fe: {
      refs: ["Hebreus 11:1", "Marcos 11:22-24", "Romanos 10:17", "Tiago 2:14-26", "2 Coríntios 5:7", "Marcos 9:24"],
      summary: "Fé cresce ouvindo a Palavra e obedecendo em pequenos passos. Fé viva gera frutos, não só discurso.",
      practice: [
        "Leia um trecho curto e aplique 1 coisa prática hoje.",
        "Ore: 'Senhor, eu creio; ajuda minha incredulidade.'",
        "Aproxime-se de uma comunidade/irmãos na fé."
      ]
    },
    esperanca: {
      refs: ["Romanos 15:13", "Isaías 40:31", "Lamentações 3:21-23", "Salmos 39:7", "1 Pedro 1:3"],
      summary: "Esperança bíblica não é otimismo vazio: é certeza de que Deus é fiel e renova suas misericórdias.",
      practice: [
        "Troque 'nunca vai mudar' por 'um dia de cada vez'.",
        "Liste 3 evidências de cuidado de Deus no passado.",
        "Faça uma oração curta de esperança pela manhã."
      ]
    },
    paz: {
      refs: ["João 14:27", "Filipenses 4:7", "Isaías 26:3", "Mateus 5:9", "Salmos 29:11"],
      summary: "A paz de Cristo não depende do caos externo; ela vem da confiança e do foco em Deus.",
      practice: [
        "Diminua estímulos por 15 min (silêncio).",
        "Ore e entregue o que te agita.",
        "Faça a próxima coisa certa, sem antecipar o amanhã."
      ]
    },
    sabedoria: {
      refs: ["Tiago 1:5", "Provérbios 1:7", "Provérbios 3:13-18", "Colossenses 2:2-3", "Provérbios 11:14"],
      summary: "Sabedoria começa no temor do Senhor e cresce com conselho, prudência e discernimento.",
      practice: [
        "Peça sabedoria específica (não genérica).",
        "Consulte alguém maduro antes de decisão grande.",
        "Pergunte: isso me aproxima de Deus ou só do ego?"
      ]
    },
    gratidao: {
      refs: ["1 Tessalonicenses 5:18", "Salmos 107:1", "Colossenses 3:17", "Salmos 118:24", "Filipenses 4:4"],
      summary: "Gratidão reposiciona o coração: você passa a enxergar o bem mesmo em tempos difíceis.",
      practice: [
        "Anote 3 motivos reais de gratidão agora.",
        "Agradeça uma pessoa diretamente.",
        "Louvor em voz baixa muda o clima interno."
      ]
    },

    // Tópicos novos (bem úteis)
    tentacao: {
      refs: ["1 Coríntios 10:13", "Tiago 1:13-15", "Mateus 26:41", "Salmos 119:9-11"],
      summary: "Tentação é real, mas Deus dá escape. Vigilância, oração e Palavra fortalecem.",
      practice: [
        "Identifique gatilhos (horário, lugar, emoção).",
        "Corte o caminho do pecado antes da queda.",
        "Peça ajuda (prestação de contas) se for vício recorrente."
      ]
    },
    raiva: {
      refs: ["Efésios 4:26-27", "Provérbios 15:1", "Tiago 1:19-20", "Romanos 12:19"],
      summary: "Raiva pode virar pecado quando domina. A Bíblia ensina mansidão, autocontrole e justiça nas mãos de Deus.",
      practice: [
        "Espere 10 minutos antes de responder.",
        "Fale firme sem ferir (verdade com amor).",
        "Entregue a vingança a Deus."
      ]
    },
    solidao: {
      refs: ["Salmos 68:6", "Hebreus 13:5", "Mateus 28:20", "Salmos 23:1-4"],
      summary: "Deus não abandona. Ele também cria família espiritual e laços reais para sustentar você.",
      practice: [
        "Procure um grupo/comunidade (não caminhe só).",
        "Mande mensagem para 1 pessoa hoje.",
        "Ore pedindo conexões saudáveis."
      ]
    },
    paciencia: {
      refs: ["Gálatas 5:22-23", "Romanos 5:3-5", "Tiago 1:2-4", "Salmos 37:7"],
      summary: "Paciência é fruto do Espírito e é forjada em processo, não em atalhos.",
      practice: [
        "Troque pressa por consistência.",
        "Aceite o 'processo' como parte do crescimento.",
        "Faça pequenas escolhas certas repetidas."
      ]
    },
    casamento: {
      refs: ["Efésios 5:25-33", "1 Coríntios 13:4-7", "Colossenses 3:13-14", "Provérbios 15:1"],
      summary: "Relacionamento saudável exige amor sacrificial, perdão, conversa honesta e mansidão.",
      practice: [
        "Ouça para entender, não para vencer.",
        "Peça perdão rápido, sem justificar demais.",
        "Conversem sobre expectativas e limites."
      ]
    }
    ,
    "novos mandamentos": {
      refs: ["João 13:34-35", "João 15:12", "1 João 4:7-8"],
      summary: "O 'mandamento novo' de Jesus resume-se em amar: amar a Deus e amar ao próximo com dedicação prática. Esse amor é a marca dos seus discípulos.",
      practice: [
        "Pratique um ato concreto de amor hoje (ouvir, perdoar, ajudar).",
        "Peça perdão onde for necessário e ofereça perdão quando possível.",
        "Sirva alguém sem esperar reconhecimento; observe como isso muda seu coração."
      ]
    }
  },

  // -------------------------
  // LIVROS (resumo + temas + como ler)
  // (Você pode adicionar o resto depois; estrutura já pronta)
  // -------------------------
  bookMap: {
    "gênesis": {
      title: "Gênesis (O Início)",
      summary: "Origens: criação, queda, dilúvio, patriarcas (Abraão, Isaque, Jacó, José). Base do plano redentor.",
      themes: ["Criação e propósito", "Pecado e promessa", "Aliança", "Fé e providência"],
      readTip: "Leia em blocos: 1–11 (origens) e 12–50 (patriarcas)."
    },
    "êxodo": {
      title: "Êxodo (A Saída)",
      summary: "Libertação do Egito, aliança no Sinai, Lei, tabernáculo e presença de Deus com o povo.",
      themes: ["Libertação", "Aliança", "Santidade", "Adoração"],
      readTip: "Repare no padrão: clamor → libertação → identidade → lei → presença."
    },
    "levítico": {
      title: "Levítico (Santidade)",
      summary: "Leis de pureza, sacrifícios e sacerdócio. Ensina que Deus é santo e aproximação exige reverência.",
      themes: ["Santidade", "Sacrifício", "Pureza", "Adoração"],
      readTip: "Leia com o foco: o que isso revela sobre Deus e sobre a seriedade do pecado?"
    },
    "números": {
      title: "Números (A Jornada)",
      summary: "Peregrinação no deserto. Rebeldia, disciplina e fidelidade de Deus apesar da infidelidade humana.",
      themes: ["Deserto", "Obediência", "Liderança", "Consequências"],
      readTip: "Observe o contraste: fidelidade de Deus vs. instabilidade do povo."
    },
    "deuteronômio": {
      title: "Deuteronômio (A Lei Relembrada)",
      summary: "Discursos finais de Moisés: aliança, obediência, amor a Deus e preparação para Canaã.",
      themes: ["Aliança", "Obediência", "Amor a Deus", "Memória"],
      readTip: "Leia como 'renovação de compromisso' e princípios para a vida."
    },
    "salmos": {
      title: "Salmos (Louvor e Lamento)",
      summary: "Orações e cânticos: alegria, dor, arrependimento, esperança e adoração.",
      themes: ["Adoração", "Lamento", "Confiança", "Reino de Deus"],
      readTip: "Use como oração: transforme o salmo em palavras suas."
    },
    "provérbios": {
      title: "Provérbios (Sabedoria Prática)",
      summary: "Sabedoria para decisões, palavras, trabalho, relacionamentos e caráter.",
      themes: ["Temor do Senhor", "Prudência", "Disciplina", "Palavras"],
      readTip: "Leia 1 capítulo por dia (31 capítulos)."
    },
    "mateus": {
      title: "Mateus",
      summary: "Jesus como Rei-Messias prometido. Ênfase no Reino e cumprimento das profecias.",
      themes: ["Reino dos céus", "Cumprimento profético", "Discipulado"],
      readTip: "Destaque o Sermão do Monte (caps. 5–7)."
    },
    "marcos": {
      title: "Marcos",
      summary: "Evangelho rápido e objetivo: ações e autoridade de Jesus como Servo.",
      themes: ["Autoridade de Jesus", "Serviço", "Fé prática"],
      readTip: "Perceba o ritmo: milagres → confronto → cruz → ressurreição."
    },
    "lucas": {
      title: "Lucas",
      summary: "Jesus como Salvador compassivo, com atenção aos excluídos e detalhes históricos.",
      themes: ["Compaixão", "Salvação", "Alegria", "Espírito Santo"],
      readTip: "Observe as parábolas exclusivas (Bom Samaritano, Filho Pródigo)."
    },
    "joão": {
      title: "João",
      summary: "Ênfase na divindade de Jesus e nos sinais para crer. Linguagem profunda e pastoral.",
      themes: ["Eu Sou", "Sinais", "Vida eterna", "Amor"],
      readTip: "Leia devagar e medite nos discursos (caps. 13–17)."
    },
    "atos": {
      title: "Atos dos Apóstolos",
      summary: "Nascimento e expansão da Igreja pelo Espírito Santo; Pedro e Paulo em missão.",
      themes: ["Espírito Santo", "Missão", "Igreja", "Coragem"],
      readTip: "Anote: onde o Evangelho chegou e o que mudou nas pessoas."
    },
    "romanos": {
      title: "Romanos",
      summary: "Explica o evangelho: pecado, graça, fé, justificação e vida no Espírito.",
      themes: ["Justificação", "Graça", "Santificação", "Vida no Espírito"],
      readTip: "Leia em partes: 1–3 (problema), 4–8 (solução), 9–11 (Israel), 12–16 (prática)."
    },
    "apocalipse": {
      title: "Apocalipse (Revelação)",
      summary: "Visões sobre conflito espiritual, perseverança e vitória final de Cristo.",
      themes: ["Perseverança", "Justiça", "Esperança", "Reino final"],
      readTip: "Leia com foco: consolo e esperança para a igreja perseguida."
    }
    ,
    "1 coríntios": {
      title: "1 Coríntios",
      summary: "Carta de Paulo tratando divisões, moral, dons espirituais e a importância do amor sacrificial.",
      themes: ["Comunidade", "Dons espirituais", "Amor", "Ressurreição"],
      readTip: "Observe como a igreja prática precisa de ensino e amor mútuo."
    },
    "2 coríntios": {
      title: "2 Coríntios",
      summary: "Paulo defende seu ministério, fala de perdão, reconciliação e o conforto em meio ao sofrimento.",
      themes: ["Ministério", "Sofrimento", "Reconciliação", "Generosidade"],
      readTip: "Leia buscando entender a relação entre poder humano e graça de Deus."
    },
    "gálatas": {
      title: "Gálatas",
      summary: "Enfatiza a justificação pela fé, liberdade cristã e o perigo do legalismo.",
      themes: ["Graça", "Liberdade", "Justificação", "Fruto do Espírito"],
      readTip: "Preste atenção aos contrastes entre lei e graça."
    },
    "efésios": {
      title: "Efésios",
      summary: "Carta sobre a identidade em Cristo, unidade da igreja e instruções para vida familiar e comunitária.",
      themes: ["Identidade", "Unidade", "Espiritualidade prática"],
      readTip: "Leia devagar; há muita teologia prática aplicada à comunidade."
    },
    "filipenses": {
      title: "Filipenses",
      summary: "Carta de alegria e encorajamento: viver em humildade, alegria e foco em Cristo.",
      themes: ["Alegria", "Humildade", "Chamado em Cristo"],
      readTip: "Ótima para devoção: destaque versos de encorajamento."
    },
    "colossenses": {
      title: "Colossenses",
      summary: "Afirma a supremacia de Cristo e adverte contra filosofias que desviam da verdade do evangelho.",
      themes: ["Supremacia de Cristo", "Doutrina", "Vida prática"],
      readTip: "Observe como a teologia molda a conduta cristã."
    },
    "1 tessalonicenses": {
      title: "1 Tessalonicenses",
      summary: "Incentivo pastoral sobre fé, amor e esperança, com ensinamentos sobre a volta de Cristo.",
      themes: ["Esperança", "Segurança" ,"Retorno de Cristo"],
      readTip: "Leia para fortalecer esperança e vigilância cristã."
    },
    "2 tessalonicenses": {
      title: "2 Tessalonicenses",
      summary: "Complementa o ensino sobre a volta de Cristo e exorta à estabilidade e trabalho responsável.",
      themes: ["Escatologia", "Perseverança", "Trabalho"],
      readTip: "Útil para entender sinais e postura cristã diante de crises."
    },
    "1 timóteo": {
      title: "1 Timóteo",
      summary: "Instruções pastorais sobre liderança, culto e vida de igreja dirigidas a Timóteo.",
      themes: ["Liderança", "Doutrina", "Disciplina"],
      readTip: "Leia como manual prático para liderança e cuidado pastoral."
    },
    "2 timóteo": {
      title: "2 Timóteo",
      summary: "Últimas palavras de Paulo: perseverança, fidelidade às Escrituras e coragem no ministério.",
      themes: ["Fidelidade", "Perseverança", "Escrituras"],
      readTip: "Leia como encorajamento para ministério fiel mesmo em sofrimento."
    },
    "tito": {
      title: "Tito",
      summary: "Instruções práticas para organização de igrejas e ensino saudável em Creta.",
      themes: ["Ordem eclesiástica", "Ensino", "Caráter"],
      readTip: "Foque em como a doutrina molda a vida da comunidade."
    },
    "filemom": {
      title: "Filemom",
      summary: "Carta breve pedindo reconciliação entre Filemom e seu escravo irmão, mostrando poder transformador do evangelho.",
      themes: ["Reconciliação", "Graça", "Relações pessoais"],
      readTip: "Leia como exemplo prático de aplicação do evangelho em relações humanas."
    },
    "hebreus": {
      title: "Hebreus",
      summary: "Profunda exposição de Cristo como sumo sacerdote e superioridade da nova aliança sobre a antiga.",
      themes: ["Cristologia", "Sacerdócio", "Perseverança"],
      readTip: "Leia devagar; há tipologia e argumentos teológicos densos."
    },
    "tiago": {
      title: "Tiago",
      summary: "Foco em fé prática: fé que se demonstra em obras, sabedoria e controle da língua.",
      themes: ["Sabedoria prática", "Ética", "Fé em ação"],
      readTip: "Aplicável ao dia a dia; destaque instruções práticas."
    },
    "1 pedro": {
      title: "1 Pedro",
      summary: "Carta de encorajamento aos sofrimentos, chamada à santidade e esperança viva em Cristo.",
      themes: ["Sofrimento", "Santidade", "Esperança"],
      readTip: "Leia com foco em identidade e esperança no sofrimento."
    },
    "2 pedro": {
      title: "2 Pedro",
      summary: "Adverte contra falsos mestres e lembra da certeza da volta de Cristo.",
      themes: ["Falsos mestres", "Escatologia", "Crescimento"],
      readTip: "Útil para discernimento doutrinário."
    },
    "1 joão": {
      title: "1 João",
      summary: "Carta sobre amor, verdade e comunhão; reafirma que o critério da fé é o amor prático.",
      themes: ["Amor", "Verdade", "Comunhão"],
      readTip: "Leia para fortalecer vida relacional e discernimento."
    },
    "2 joão": {
      title: "2 João",
      summary: "Breve carta enfatizando amor e vigilância contra enganadores.",
      themes: ["Amor", "Vigilância", "Evangelho"],
      readTip: "Curta e direta; útil para advertência pastoral."
    },
    "3 joão": {
      title: "3 João",
      summary: "Carta sobre hospitalidade, apoio a missionários e cuidado com líderes fiéis.",
      themes: ["Hospitalidade", "Suporte missionário", "Integridade"],
      readTip: "Leia para exemplos práticos de apoio ao ministério."
    },
    "judas": {
      title: "Judas",
      summary: "Breve admoestação contra impostores que corrompem a fé; exorta a perseverar na verdade.",
      themes: ["Contenção doutrinária", "Perseverança", "Santidade"],
      readTip: "Leia para fortalecer vigilância doutrinária."
    }
  },

  // -------------------------
  // PERSONAGENS
  // -------------------------
  characterMap: {
    "jesus": {
      who: "Jesus Cristo, o Filho de Deus, é a figura central da fé cristã e da Bíblia.",
      call: "Sua missão foi revelada desde o nascimento: 'Ele salvará o seu povo dos seus pecados' (Mateus 1:21). Ele não foi chamado, Ele é o chamado.",
      role: "Ele é o Messias prometido, o Salvador da humanidade, o Cordeiro de Deus que tira o pecado do mundo. Através de Sua vida, morte e ressurreição, Ele oferece reconciliação entre Deus e os homens."
    },
    "mateus": {
      who: "Mateus (Levi) foi um dos 12 apóstolos e tradicionalmente considerado autor do Evangelho de Mateus.",
      call: "Chamado enquanto era cobrador de impostos; largou tudo para seguir Jesus (Mt 9:9).",
      role: "Escreve com foco em leitores judeus, enfatizando Jesus como Messias e Rei."
    },
    "pedro": {
      who: "Simão Pedro, pescador da Galileia, tornou-se liderança apostólica na igreja primitiva.",
      call: "Chamado por Jesus no trabalho; 'pescador de homens' (Mt 4:19).",
      role: "Pregou no Pentecostes e ajudou a abrir portas para judeus e gentios."
    },
    "paulo": {
      who: "Paulo de Tarso (Saulo) foi fariseu e perseguidor; convertido, virou grande missionário aos gentios.",
      call: "Encontro com Cristo no caminho de Damasco (At 9).",
      role: "Plantou igrejas e escreveu cartas fundamentais do NT."
    },
    "davi": {
      who: "Rei de Israel; pastor que se tornou líder. Figura central na linhagem messiânica.",
      call: "Ungido por Samuel ainda jovem (1Sm 16).",
      role: "Unificou Israel, escreveu muitos salmos e apontou para o reinado de Cristo."
    },
    "moisés": {
      who: "Libertador e legislador; liderou Israel na saída do Egito.",
      call: "Chamado na sarça ardente (Êx 3).",
      role: "Mediador da aliança no Sinai; conduziu o povo no deserto."
    },
    "joão": {
      who: "Apóstolo, conhecido como 'discípulo amado'.",
      call: "Chamado ainda jovem, deixou as redes para seguir Jesus.",
      role: "Escreveu Evangelho de João, cartas e Apocalipse; ênfase em amor e verdade."
    },

    // extras (muito úteis)
    "abraão": {
      who: "Patriarca da fé; recebeu promessas e alianças que moldam toda a história bíblica.",
      call: "Chamado a sair da sua terra e confiar na promessa (Gn 12).",
      role: "Exemplo de fé e obediência; pai de muitas nações."
    },
    "josé": {
      who: "Filho de Jacó; vendido pelos irmãos, tornou-se governador no Egito.",
      call: "Vida guiada por providência mesmo em sofrimento (Gn 37–50).",
      role: "Deus transformou mal em bem para salvar muitos."
    },
    "ester": {
      who: "Rainha judia na Pérsia; corajosa em defender seu povo.",
      call: "Assumiu risco para interceder diante do rei.",
      role: "Exemplo de coragem, identidade e providência."
    },
    "daniel": {
      who: "Exilado fiel na Babilônia; conhecido por integridade e oração.",
      call: "Permaneceu firme sob pressão cultural.",
      role: "Mostra fidelidade e soberania de Deus sobre reinos."
    },
    "maria": {
      who: "Maria, mãe de Jesus, jovem de fé que respondeu ao chamado com submissão e confiança.",
      call: "Chamado extraordinário ao papel de mãe do Messias; respondeu com 'faça-se em mim segundo a tua palavra' (Lucas).",
      role: "Presente nos momentos de alegria e dor; exemplo de fé, serviço e perseverança diante do sofrimento."
    }
  },

  // -------------------------
  // ALIAS DE LIVROS (abreviações e variações comuns)
  // (serve pra reconhecer "jo", "joao", "1jo", "rm", etc.)
  // -------------------------
  bookAliases: {
    "gênesis": ["genesis", "gn", "ge"],
    "êxodo": ["exodo", "ex", "êx"],
    "levítico": ["levitico", "lv", "lev"],
    "números": ["numeros", "nm", "num"],
    "deuteronômio": ["deuteronomio", "dt", "deut"],
    "salmos": ["salmo", "sl", "sal", "ps", "psalm"],
    "provérbios": ["proverbios", "pv", "prov"],
    "mateus": ["mt", "mat"],
    "marcos": ["mc", "mr", "marc"],
    "lucas": ["lc", "lk"],
    "joão": ["joao", "jo", "jn"],
    "atos": ["at", "acts"],
    "romanos": ["rm", "rom"],
    "1 coríntios": ["1 corintios", "1 cor", "1cor", "1corintios"],
    "2 coríntios": ["2 corintios", "2 cor", "2cor", "2corintios"],
    "gálatas": ["galatas", "gl"],
    "efésios": ["efesios", "ef"],
    "filipenses": ["filipenses", "flp", "fp"],
    "colossenses": ["colossenses", "cl"],
    "1 tessalonicenses": ["1 tessalonicenses", "1 tess", "1th"],
    "2 tessalonicenses": ["2 tessalonicenses", "2 tess", "2th"],
    "1 timóteo": ["1 timoteo", "1 tim", "1tm"],
    "2 timóteo": ["2 timoteo", "2 tim", "2tm"],
    "tito": ["tito"],
    "filemom": ["filemom", "flm"],
    "hebreus": ["hebreus", "hb"],
    "tiago": ["tiago", "tg"],
    "1 pedro": ["1 pedro", "1 pe", "1ptr"],
    "2 pedro": ["2 pedro", "2 pe", "2ptr"],
    "1 joão": ["1 joao", "1 jo", "1jn"],
    "2 joão": ["2 joao", "2 jo", "2jn"],
    "3 joão": ["3 joao", "3 jo", "3jn"],
    "judas": ["judas", "jude"],
    "apocalipse": ["apoc", "ap", "rev", "revelacao", "revelação"],
  },

  // -------------------------
  // UTIL: normalização de texto
  // -------------------------
  normalize(text = "") {
    return String(text)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .replace(/[^\w\s:]/g, " ")       // remove pontuação (exceto :)
      .replace(/\s+/g, " ")
      .trim();
  },

  // -------------------------
  // UTIL: debug
  // -------------------------
  debug(...args) {
    if (this.config.enableDebug) console.log("[BibleAssistant]", ...args);
  },

  // -------------------------
  // UTIL: fuzzy score simples (Jaccard + prefix bônus)
  // -------------------------
  fuzzyScore(a, b) {
    a = this.normalize(a);
    b = this.normalize(b);
    if (!a || !b) return 0;

    if (a === b) return 1;

    const aWords = new Set(a.split(" "));
    const bWords = new Set(b.split(" "));
    let inter = 0;
    for (const w of aWords) if (bWords.has(w)) inter++;

    const union = aWords.size + bWords.size - inter;
    const jacc = union ? inter / union : 0;

    // bônus se um começa com o outro (bom pra "jo" -> "joao")
    const prefixBonus =
      (a.startsWith(b) || b.startsWith(a)) ? 0.15 : 0;

    return Math.min(1, jacc + prefixBonus);
  },

  // -------------------------
  // UTIL: encontra chave por aliases
  // -------------------------
  resolveBookName(input) {
    const t = this.normalize(input);

    // 1) Match direto pelo nome principal
    for (const main of Object.keys(this.bookMap)) {
      if (this.normalize(main) === t) return main;
    }

    // 2) Match por alias
    for (const [main, aliases] of Object.entries(this.bookAliases)) {
      for (const al of aliases) {
        if (this.normalize(al) === t) return main;
      }
    }

    // 3) Fuzzy match (aproximação)
    let best = { name: null, score: 0 };
    for (const main of Object.keys(this.bookMap)) {
      const score = this.fuzzyScore(t, main);
      if (score > best.score) best = { name: main, score };
    }
    if (best.score >= this.config.minFuzzyScore) return best.name;

    return null;
  },

  // -------------------------
  // UTIL: resolve tópico via sinônimos
  // -------------------------
  resolveTopic(input) {
    const t = this.normalize(input);

    // 1) Se o texto já contém a chave exata do tópico
    for (const topic of Object.keys(this.topicMap)) {
      if (t.includes(this.normalize(topic))) return topic;
    }

    // 2) Se contém algum sinônimo
    for (const [topic, syns] of Object.entries(this.synonyms)) {
      for (const s of syns) {
        if (t.includes(this.normalize(s))) return topic;
      }
    }

    // 3) fuzzy contra chaves de tópico
    let best = { topic: null, score: 0 };
    for (const topic of Object.keys(this.topicMap)) {
      const score = this.fuzzyScore(t, topic);
      if (score > best.score) best = { topic, score };
    }
    if (best.score >= this.config.minFuzzyScore) return best.topic;

    return null;
  },

  // -------------------------
  // UTIL: resolve personagem
  // -------------------------
  resolveCharacter(input) {
    const t = this.normalize(input);

    // match direto
    for (const name of Object.keys(this.characterMap)) {
      if (t.includes(this.normalize(name))) return name;
    }

    // fuzzy
    let best = { name: null, score: 0 };
    for (const name of Object.keys(this.characterMap)) {
      const score = this.fuzzyScore(t, name);
      if (score > best.score) best = { name, score };
    }
    if (best.score >= this.config.minFuzzyScore) return best.name;

    return null;
  },

  // -------------------------
  // MAPA DE NOMES EM HEBRAICO (forma, translit, significado)
  // Priorize entradas aqui para intenções 'hebrew_name'
  // -------------------------
  hebrewNames: {
    "joao": { heb: "יוֹחָנָן", translit: "Yôḥānān (Yohanan)", meaning: "YHWH foi gracioso" },
    "joao batista": { heb: "יוֹחָנָן הַמַּטְבִּיל", translit: "Yôḥānān ha-Matbil", meaning: "João, o que batiza (o que imerge)" },
    "joao apóstolo": { heb: "יוֹחָנָן", translit: "Yôḥānān (Yohanan)", meaning: "YHWH foi gracioso" },
    "jesus": { heb: "יֵשׁוּעַ", translit: "Yeshua", meaning: "Salvação / o Senhor salva" },
    "paulo": { heb: "שָׁאוּל", translit: "Sha'ul (Saul)", meaning: "Pedido/oração (Saul) — Paulo é forma latina" },
    "pedro": { heb: "שִׁמְעוֹן", translit: "Shim'on (Simão)", meaning: "Ouvir / ouvinte" },
    "maria": { heb: "מִרְיָם", translit: "Miryam", meaning: "Possivelmente 'amada' ou ligado a 'amar' (origem incerta)" }
  },

  // -------------------------
  // DETECTA INTENÇÃO 'hebrew_name'
  // Retorna { intent: 'hebrew_name', entity: 'joao' } ou null
  // -------------------------
  detectHebrewNameIntent(raw) {
    if (!raw) return null;
    const r = String(raw).trim();

    // Padrões fortes
    const patterns = [
      /nome hebraico de\s+(.+)$/i,
      /qual (?:é|e) o nome (?:em )?hebraico de\s+(.+)$/i,
      /qual o nome de\s+(.+) em hebraico/i,
      /escreva em hebraico\s+(.+)$/i,
      /como escreve em hebraico\s+(.+)$/i
    ];

    for (const p of patterns) {
      const m = r.match(p);
      if (m && m[1]) {
        // limpa instruções extras que users frequentemente adicionam
        let ent = m[1].trim().replace(/[?.!]/g, "");
        // remove frases como "escreva em hebraico" ou "escreva em hebraico e significado"
        ent = ent.replace(/,?\s*escreva.*$/i, "");
        ent = ent.replace(/,?\s*escreva em hebraico.*$/i, "");
        // remove conteúdo entre parênteses e textos adicionais após vírgula
        ent = ent.replace(/\(.*?\)/g, "").replace(/,.*$/g, "");
        ent = ent.replace(/\s+$/g, "").trim();
        return { intent: 'hebrew_name', entity: ent };
      }
    }

    return null;
  },

  // -------------------------
  // FORMATAÇÃO: resposta para intent = hebrew_name
  // Regras aplicadas: desambiguação para 'João', bloqueio de Maria->Jesus
  // -------------------------
  formatHebrewName(rawEntity) {
    if (!rawEntity) return this.formatNotFound('Sobre qual pessoa você quer o nome em hebraico? Ex: "João Batista".');

    // limpa ruído comum (ex: "escreva em hebraico", parênteses, vírgulas)
    let entity = String(rawEntity || '').replace(/,?\s*escreva.*$/i, '');
    entity = entity.replace(/\(.*?\)/g, '').replace(/,.*$/g, '').trim();
    const norm = this.normalize(entity);

    // Desambiguação apenas se o usuário escreveu somente 'joao' sem contexto
    if (norm === 'joao') {
      return this.formatNotFound('Você quer "João Batista" ou "João apóstolo"? Escreva o suficiente para diferenciar (ex: "João Batista").');
    }

    // Garantia: se perguntar por 'maria', não roteie para Jesus
    if (norm.includes('maria')) {
      // normaliza para 'maria' exato
      const key = 'maria';
      const h = this.hebrewNames[key];
      const bio = this.characterMap['maria'] || null;
      const who = bio ? bio.who : 'Maria, conhecida na tradição cristã como mãe de Jesus, figura de fé e serviço.';
      return `
        <div>
          <h3>${this.config.ui.personIcon} ${this.escapeHtml(this.titleCase(key))} — Nome em hebraico</h3>
          <p><strong>Hebraico:</strong> ${this.escapeHtml(h.heb)} <small>(${this.escapeHtml(h.translit)})</small></p>
          <p><strong>Significado:</strong> ${this.escapeHtml(h.meaning)}</p>
          <p><strong>Caminhada:</strong> ${this.escapeHtml(who)}</p>
        </div>
      `;
    }

    // Tenta mapear por chave direta (comparando versões normalizadas das chaves)
    let foundKey = null;
    for (const k of Object.keys(this.hebrewNames)) {
      if (this.normalize(k) === norm) { foundKey = k; break; }
    }

    // Se ainda não achou, tenta personagem exato (normalized)
    if (!foundKey) {
      for (const k of Object.keys(this.characterMap)) {
        if (this.normalize(k) === norm) { foundKey = k; break; }
      }
    }

    // fallback: fuzzy match against hebrewNames keys
    if (!foundKey) {
      let best = { k: null, score: 0 };
      for (const k of Object.keys(this.hebrewNames)) {
        const s = this.fuzzyScore(norm, this.normalize(k));
        if (s > best.score) best = { k, score: s };
      }
      if (best.score >= 0.6) foundKey = best.k;
    }

    if (!foundKey) return this.formatNotFound(`Não encontrei o nome hebraico para "${rawEntity}". Tente escrever o nome completo (ex: "João Batista").`);

    // Monta resposta
    const h = this.hebrewNames[foundKey] || null;
    const bio = this.characterMap[foundKey] || null;
    const who = bio ? (bio.who + ' ' + (bio.call || '') + ' ' + (bio.role || '')) : '';

    return `
      <div>
        <h3>${this.config.ui.personIcon} ${this.escapeHtml(this.titleCase(foundKey))} — Nome em hebraico</h3>
        ${h ? `<p><strong>Hebraico:</strong> ${this.escapeHtml(h.heb)} <small>(${this.escapeHtml(h.translit)})</small></p>
               <p><strong>Significado:</strong> ${this.escapeHtml(h.meaning)}</p>` : ''}
        ${who ? `<p><strong>Caminhada (resumo):</strong> ${this.escapeHtml(who)}</p>` : `<p><em>Biografia não disponível; peça por "quem foi ${this.titleCase(foundKey)}" para mais detalhes.</em></p>`}
      </div>
    `;
  },

  // -------------------------
  // PARSER de referência bíblica
  // Ex: "joao 3:16", "Rm 8:28", "1jo 1:9", "1 joao 4:8"
  // Retorna: { book, chapter, verseStart, verseEnd, raw } ou null
  // -------------------------
  parseReference(input) {
    const raw = String(input || "");
    const t = this.normalize(raw);

    // padrões:
    // 1) "1 joao 4:8" / "1joao 4:8" / "1 jo 4:8"
    // 2) "joao 3:16-18"
    // 3) "rm 8:28"
    const refRegex = /^(\d{1}\s*)?([a-z\u00C0-\u017F]+)\s+(\d{1,3})\s*:\s*(\d{1,3})(?:\s*-\s*(\d{1,3}))?$/i;
    const m = t.match(refRegex);
    if (!m) return null;

    const num = (m[1] || "").replace(/\s+/g, "").trim(); // "1"
    const bookRaw = (m[2] || "").trim();
    const chapter = parseInt(m[3], 10);
    const verseStart = parseInt(m[4], 10);
    const verseEnd = m[5] ? parseInt(m[5], 10) : null;

    // tenta resolver livro com prefixo numérico (1 joão etc.)
    // como seu bookMap não inclui "1 João", vamos manter "João" como livro base
    // e colocar numPrefix no raw.
    const bookName = this.resolveBookName(bookRaw);
    if (!bookName) return null;

    return {
      raw,
      numPrefix: num || null,
      book: bookName,
      chapter,
      verseStart,
      verseEnd
    };
  },

  // -------------------------
  // FORMATADORES (HTML)
  // -------------------------
  formatTopic(topicKey) {
    const t = this.topicMap[topicKey];
    if (!t) return this.formatNotFound(`Tópico "${topicKey}" não encontrado.`);

    const refs = (t.refs || []).slice(0, this.config.maxRefsToShow);
    const practices = (t.practice || []).slice(0, 4);

    return `
      <div>
        <h3>${this.config.ui.topicIcon} Tema: ${this.escapeHtml(this.titleCase(topicKey))}</h3>
        <p><strong>Resumo:</strong> ${this.escapeHtml(t.summary || "")}</p>

        <p><strong>Referências:</strong><br>
          ${refs.map(r => `• ${this.escapeHtml(r)}`).join("<br>")}
        </p>

        ${practices.length ? `
          <p><strong>${this.config.ui.tipIcon} Práticas:</strong><br>
            ${practices.map(p => `• ${this.escapeHtml(p)}`).join("<br>")}
          </p>
        ` : ""}

        ${this.formatPrayerSuggestion(topicKey)}
      </div>
    `;
  },

  formatBook(bookKey) {
    const b = this.bookMap[bookKey];
    if (!b) return this.formatNotFound(`Livro "${bookKey}" não encontrado.`);

    const themes = (b.themes || []).slice(0, 8);

    return `
      <div>
        <h3>${this.config.ui.bookIcon} ${this.escapeHtml(b.title || this.titleCase(bookKey))}</h3>
        <p>${this.escapeHtml(b.summary || "")}</p>

        ${themes.length ? `
          <p><strong>Temas:</strong><br>
            ${themes.map(x => `• ${this.escapeHtml(x)}`).join("<br>")}
          </p>
        ` : ""}

        ${b.readTip ? `<p><strong>${this.config.ui.tipIcon} Como ler:</strong> ${this.escapeHtml(b.readTip)}</p>` : ""}
      </div>
    `;
  },

  async formatCharacter(nameKey) {
    const c = this.characterMap[nameKey];
    if (!c) return this.formatNotFound(`Personagem "${nameKey}" não encontrado.`);

    // Tenta enriquecer com memórias do usuário (se o Supabase estiver configurado)
    let extra = '';
    try {
      if (typeof searchOracleMemory === 'function') {
        const mems = await searchOracleMemory(nameKey);
        if (mems && mems.length) {
          extra = '<p><strong>Memórias relacionadas:</strong><br>' + mems.map(m => `• ${this.escapeHtml(m.fact)} <small>(${this.escapeHtml(m.title)})</small>`).join('<br>') + '</p>';
        }
      }
    } catch (e) {
      console.warn('Erro ao buscar memórias:', e);
    }

    return `
      <div>
        <h3>${this.config.ui.personIcon} Personagem: ${this.escapeHtml(this.titleCase(nameKey))}</h3>
        <p><strong>Quem foi:</strong> ${this.escapeHtml(c.who || "")}</p>
        <p><strong>Chamado:</strong> ${this.escapeHtml(c.call || "")}</p>
        <p><strong>Papel:</strong> ${this.escapeHtml(c.role || "")}</p>
        ${extra}
        <p><em>Dica:</em> Pergunte mais: "me conte mais sobre ${this.titleCase(nameKey)}" ou salve uma memória dizendo: "lembre que ${this.titleCase(nameKey)} foi..."</p>
      </div>
    `;
  },

  formatReference(refObj) {
    // Sem texto literal. Retorna referência formatada + dica do que fazer.
    const prefix = refObj.numPrefix ? `${refObj.numPrefix} ` : "";
    const range = refObj.verseEnd ? `${refObj.verseStart}-${refObj.verseEnd}` : `${refObj.verseStart}`;
    const pretty = `${prefix}${this.titleCase(refObj.book)} ${refObj.chapter}:${range}`;

    return `
      <div>
        <h3>${this.config.ui.okIcon} Referência detectada</h3>
        <p><strong>${this.escapeHtml(pretty)}</strong></p>
        <p>${this.config.ui.tipIcon} Dica: se você quiser, me diga o <em>tema</em> (ex: ansiedade, perdão, fé) e eu conecto essa referência com outras passagens relacionadas.</p>
      </div>
    `;
  },

  formatPrayerSuggestion(topicKey) {
    const prayers = {
      ansiedade: "Senhor, eu entrego minhas preocupações a Ti. Guarda meu coração com a Tua paz e me dá clareza para viver um passo de cada vez. Amém.",
      medo: "Deus, fortalece meu coração. Ajuda-me a confiar na Tua presença e me dá coragem para fazer o que é certo. Amém.",
      perdao: "Pai, cura meu coração e me ensina a perdoar como fui perdoado. Dá-me limites saudáveis e paz. Amém.",
      tristeza: "Senhor, acolhe minha dor. Renova minha esperança e me sustenta hoje. Amém.",
      fe: "Jesus, aumenta minha fé. Ajuda minha incredulidade e guia meus passos em obediência. Amém."
    };
    const p = prayers[topicKey];
    if (!p) return "";
    return `<p><strong>${this.config.ui.prayIcon} Oração sugerida:</strong> ${this.escapeHtml(p)}</p>`;
  },

  formatNotFound(message) {
    return `
      <div>
        <h3>${this.config.ui.warnIcon} Não encontrei</h3>
        <p>${this.escapeHtml(message || "Não consegui identificar sua pergunta.")}</p>
        <p><strong>Você pode tentar assim:</strong><br>
          • "tema ansiedade"<br>
          • "resumo de romanos"<br>
          • "quem foi paulo"<br>
          • "joão 3:16"<br>
          • "plano de leitura 7 dias"
        </p>
      </div>
    `;
  },

  // -------------------------
  // FORMATAÇÃO: lista do que o assistente conhece
  // Retorna HTML com tópicos, livros e instruções simples
  // -------------------------
  formatKnowledgeBase() {
    const topics = Object.keys(this.topicMap || {}).map(t => `• ${this.escapeHtml(this.titleCase(t))}`).join("<br>");
    const books = Object.keys(this.bookMap || {}).slice(0, 20).map(b => `• ${this.escapeHtml(this.titleCase(b))}`).join("<br>");

    return `
      <div>
        <h3>${this.config.ui.okIcon} O que eu sei</h3>
        <p><strong>Tópicos:</strong><br>${topics}</p>
        <p><strong>Alguns livros:</strong><br>${books}</p>
        <p>${this.config.ui.tipIcon} Peça por tema, livro, personagem ou referência (ex: "ansiedade", "Gênesis", "quem foi Jesus", "João 3:16").</p>
      </div>
    `;
  },

  // -------------------------
  // UTIL: escape HTML
  // -------------------------
  escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  },

  titleCase(str) {
    return String(str || "")
      .toLowerCase()
      .split(" ")
      .map(w => w ? w[0].toUpperCase() + w.slice(1) : w)
      .join(" ");
  },

  // -------------------------
  // FUNÇÕES EXTRAS
  // -------------------------
  getRandomTopic() {
    const keys = Object.keys(this.topicMap);
    return keys[Math.floor(Math.random() * keys.length)];
  },

  getVerseOfTheDayHint() {
    // Sem web; apenas escolhe uma referência forte
    const pool = [
      "Salmos 23:1-4",
      "Filipenses 4:6-7",
      "Romanos 8:28",
      "João 14:27",
      "Isaías 41:10",
      "Mateus 6:33",
      "1 Pedro 5:7",
      "2 Timóteo 1:7"
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  },

  buildReadingPlan(days = 7) {
    // Plano simples e muito útil (pode ajustar)
    // Retorna referências (não texto)
    const plans = {
      3: [
        { day: 1, title: "Começo com Jesus", refs: ["Marcos 1", "João 1"] },
        { day: 2, title: "Coração e sabedoria", refs: ["Salmos 23", "Provérbios 3"] },
        { day: 3, title: "Fé e vida nova", refs: ["Romanos 8", "Filipenses 4"] }
      ],
      7: [
        { day: 1, title: "Jesus e o Reino", refs: ["Mateus 5–7"] },
        { day: 2, title: "Descanso e confiança", refs: ["Salmos 23", "Salmos 91"] },
        { day: 3, title: "Sabedoria prática", refs: ["Provérbios 1–3"] },
        { day: 4, title: "Vida no Espírito", refs: ["Romanos 8"] },
        { day: 5, title: "Paz e alegria", refs: ["Filipenses 4"] },
        { day: 6, title: "Amor que transforma", refs: ["1 Coríntios 13", "1 João 4"] },
        { day: 7, title: "Esperança e perseverança", refs: ["Isaías 40", "Lamentações 3:21-23"] }
      ],
      14: [
        { day: 1, title: "Começo", refs: ["Marcos 1–2"] },
        { day: 2, title: "Jesus em ação", refs: ["Marcos 3–4"] },
        { day: 3, title: "Fé e poder", refs: ["Marcos 5–6"] },
        { day: 4, title: "Identidade e missão", refs: ["Marcos 7–8"] },
        { day: 5, title: "Cruz e discipulado", refs: ["Marcos 9–10"] },
        { day: 6, title: "Entrega final", refs: ["Marcos 11–12"] },
        { day: 7, title: "Paixão e ressurreição", refs: ["Marcos 13–16"] },
        { day: 8, title: "Sabedoria", refs: ["Provérbios 3–4"] },
        { day: 9, title: "Oração e lamento", refs: ["Salmos 23", "Salmos 42"] },
        { day: 10, title: "Evangelho explicado", refs: ["Romanos 1–3"] },
        { day: 11, title: "Graça e fé", refs: ["Romanos 4–5"] },
        { day: 12, title: "Nova vida", refs: ["Romanos 6–8"] },
        { day: 13, title: "Vida prática", refs: ["Romanos 12"] },
        { day: 14, title: "Paz e alegria", refs: ["Filipenses 4", "João 14"] }
      ]
    };

    const chosen = plans[days] || plans[7];
    return `
      <div>
        <h3>${this.config.ui.bookIcon} Plano de Leitura: ${days} dias</h3>
        ${chosen.map(d => `
          <p><strong>Dia ${d.day} — ${this.escapeHtml(d.title)}:</strong><br>
          ${d.refs.map(r => `• ${this.escapeHtml(r)}`).join("<br>")}
          </p>
        `).join("")}
        <p>${this.config.ui.tipIcon} Dica: após ler, me diga “o que isso significa?” ou “aplica na minha vida como?”</p>
      </div>
    `;
  },

  // -------------------------
  // DETECÇÃO DE INTENÇÃO + RESPOSTA
  // -------------------------
  async reply(userText = "") {
    const raw = String(userText || "");
    const t = this.normalize(raw);

    if (!t) return this.formatNotFound("Escreva um tema, livro, personagem ou referência (ex: 'João 3:16').");

    // Prioridade: detectar pedido explícito de "nome hebraico"
    try {
      const heb = this.detectHebrewNameIntent(raw);
      if (heb && heb.intent === 'hebrew_name') {
        return this.formatHebrewName(heb.entity);
      }
    } catch (e) {
      this.debug('Erro ao detectar hebrew_name', e);
    }

    // 0) Detecta pedido de conhecimento
    if (t.includes("o que voce sabe") || t.includes("o que vc sabe") || t.includes("seu conhecimento") || t.includes("lista de topicos")) {
      return this.formatKnowledgeBase();
    }

    // 1) Detecta pedido de plano
    if (t.includes("plano") || t.includes("leitura") || t.includes("devocional")) {
      // tenta capturar número de dias
      const m = t.match(/(\d{1,3})\s*(dias|dia)/);
      const days = m ? Math.max(3, Math.min(30, parseInt(m[1], 10))) : 7;
      // temos planos 3,7,14 — se vier outro número, cai no 7
      const normalizedDays = [3,7,14].includes(days) ? days : 7;
      return this.buildReadingPlan(normalizedDays);
    }

    // 2) Detecta "versículo do dia"
    if (t.includes("versiculo do dia") || t.includes("versículo do dia") || t.includes("hoje me da um versiculo") || t.includes("me da um versiculo")) {
      const ref = this.getVerseOfTheDayHint();
      return `
        <div>
          <h3>${this.config.ui.okIcon} Sugestão de hoje</h3>
          <p><strong>${this.escapeHtml(ref)}</strong></p>
          <p>${this.config.ui.tipIcon} Quer que eu conecte esse versículo com um tema (ansiedade, fé, paz, propósito…)?</p>
        </div>
      `;
    }

    // 3) Detecta referência tipo "João 3:16"
    const refObj = this.parseReference(raw);
    if (refObj) return this.formatReference(refObj);

    // 4) Detecta livro ("resumo de romanos")
    if (t.includes("resumo") || t.includes("livro") || t.includes("sobre o livro") || t.includes("o que fala")) {
      // tenta pegar última palavra importante como candidato
      const parts = t.split(" ");
      const tail = parts.slice(-3).join(" "); // tentativa
      const book = this.resolveBookName(tail) || this.resolveBookName(parts[parts.length - 1]) || this.resolveBookName(t);
      if (book) return this.formatBook(book);
    } else {
      // mesmo sem "resumo", pode ter digitado só o nome do livro
      const maybeBook = this.resolveBookName(t);
      if (maybeBook) return this.formatBook(maybeBook);
    }

    // 5) Detecta personagem
    if (t.includes("quem foi") || t.includes("quem e") || t.includes("personagem") || t.includes("historia de")) {
      const candidate = t.replace("quem foi", "").replace("quem e", "").replace("historia de", "").trim();
      const ch = this.resolveCharacter(candidate) || this.resolveCharacter(t);
      if (ch) return await this.formatCharacter(ch);
    } else {
      const maybeChar = this.resolveCharacter(t);
      if (maybeChar) return await this.formatCharacter(maybeChar);
    }

    // 6) Detecta tópico (principal)
    const topic = this.resolveTopic(t);
    if (topic) return this.formatTopic(topic);

    // 7) fallback: sugerir opções próximas
    const suggestions = this.suggest(t);
    if (suggestions.length) {
      return `
        <div>
          <h3>${this.config.ui.warnIcon} Não identifiquei com certeza</h3>
          <p>Talvez você quis dizer:</p>
          <p>${suggestions.map(s => `• ${this.escapeHtml(s)}`).join("<br>")}</p>
          <p>${this.config.ui.tipIcon} Exemplos: "ansiedade", "resumo de romanos", "quem foi davi", "joão 3:16"</p>
        </div>
      `;
    }

    return this.formatNotFound("Não consegui identificar o tema/livro/personagem/referência.");
  },

  // -------------------------
  // SUGESTÕES (tópicos, livros, personagens)
  // -------------------------
  suggest(input) {
    const t = this.normalize(input);
    const bag = [];

    for (const k of Object.keys(this.topicMap)) bag.push({ type: "Tema", key: k, score: this.fuzzyScore(t, k) });
    for (const k of Object.keys(this.bookMap)) bag.push({ type: "Livro", key: k, score: this.fuzzyScore(t, k) });
    for (const k of Object.keys(this.characterMap)) bag.push({ type: "Pessoa", key: k, score: this.fuzzyScore(t, k) });

    bag.sort((a, b) => b.score - a.score);
    const top = bag.filter(x => x.score >= 0.45).slice(0, 5);

    return top.map(x => `${x.type}: ${this.titleCase(x.key)} (${Math.round(x.score * 100)}%)`);
  }
};

// Função para injetar a aba Bíblia na interface
function injectBibleTab() {
  const activateBibleTab = () => {
    // Desativa todos os outros botões de navegação e abas de conteúdo
    document.querySelectorAll('.nav-item, .mobile-drawer-item, .mobile-nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    // Ativa todos os botões da Bíblia (desktop e mobile) e o conteúdo
    document.querySelectorAll('[data-tab="bible"]').forEach(b => b.classList.add('active'));
    const content = document.getElementById('tab-bible');
    if (content) content.classList.add('active');

    if (typeof closeDrawer === 'function') closeDrawer();
  };

  // 1. Injetar Botão na Navegação Desktop (Sidebar)
  const desktopNav = document.querySelector('.cinema .app-nav');
  if (desktopNav && !desktopNav.querySelector('[data-tab="bible"]')) {
    const btn = document.createElement('button');
    btn.className = 'nav-item';
    btn.dataset.tab = 'bible';
    btn.innerHTML = '<span class="nav-icon">✝️</span><span>Bíblia</span>';
    btn.addEventListener('click', activateBibleTab);
    desktopNav.appendChild(btn);
  }

  // 2. Injetar Botão no Drawer Mobile
  const mobileDrawerItemContainer = document.querySelector('.mobile-drawer-item')?.parentElement;
  if (mobileDrawerItemContainer && !mobileDrawerItemContainer.querySelector('[data-tab="bible"]')) {
    const btn = document.createElement('button');
    btn.className = 'mobile-drawer-item';
    btn.dataset.tab = 'bible';
    btn.innerHTML = '<span class="nav-icon" style="font-size: 1.5rem;">✝️</span><span>Bíblia</span>';
    btn.addEventListener('click', activateBibleTab);
    mobileDrawerItemContainer.appendChild(btn);
  }

  // 3. Injetar Conteúdo da Aba
  const main = document.getElementById('gameScreen');
  if (main && !document.getElementById('tab-bible')) {
    const content = document.createElement('div');
    content.id = 'tab-bible';
    content.className = 'tab-content';
    content.style.cssText = 'padding: 10px; height: 100%; overflow: hidden;';
    
    content.innerHTML = `
      <div class="bible-interface" style="width: 100%; max-width: 800px; margin: 0 auto; background: rgba(20, 20, 30, 0.95); border-radius: 16px; padding: 15px; border: 1px solid rgba(255, 215, 0, 0.2); box-shadow: 0 0 20px rgba(0,0,0,0.5); display: flex; flex-direction: column; height: 100%; max-height: 100%;">
        <div class="bible-header" style="text-align: center; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; flex-shrink: 0;">
          <h2 style="color: #ffdd57; margin: 0; font-family: serif; font-size: 1.4rem;">✝️ Assistente Bíblico</h2>
          <p style="opacity: 0.7; font-size: 0.8rem; margin-top: 5px;">"Lâmpada para os meus pés é a tua palavra"</p>
        </div>
        
        <div id="bibleChatArea" style="flex: 1; overflow-y: auto; background: rgba(0,0,0,0.3); border-radius: 12px; padding: 15px; margin-bottom: 15px; display: flex; flex-direction: column; gap: 10px;">
          <div class="chat-message bot" style="align-self: flex-start; background: rgba(255, 221, 87, 0.1); color: #ffdd57; padding: 10px 15px; border-radius: 12px 12px 12px 0; max-width: 85%; font-size: 0.95rem;">
            Olá, a Paz! Sou seu assistente bíblico. 🙏<br>Posso explicar sobre livros (ex: "Gênesis"), temas (ex: "ansiedade") ou dar um versículo do dia.
          </div>
        </div>

        <div class="bible-input-area" style="display: flex; gap: 10px; position: relative; flex-shrink: 0;">
          <input type="text" id="bibleInput" placeholder="Ex: Gênesis, Salmos..." style="flex: 1; padding: 12px; border-radius: 25px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); color: white; font-size: 16px;">
          <button id="bibleSendBtn" style="width: 45px; height: 45px; border-radius: 50%; border: none; background: #ffdd57; color: #000; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">➤</button>
        </div>
        
        <div class="bible-quick-actions" style="display: flex; gap: 8px; margin-top: 10px; overflow-x: auto; padding-bottom: 5px; flex-shrink: 0;">
          <button class="btn ghost bible-tag" onclick="askBible('quem foi jesus')" style="font-size: 0.75rem; white-space: nowrap; padding: 6px 12px;">✝️ Jesus</button>
          <button class="btn ghost bible-tag" onclick="askBible('o que você sabe?')" style="font-size: 0.75rem; white-space: nowrap; padding: 6px 12px;">🧠 O que você sabe?</button>
          <button class="btn ghost bible-tag" onclick="askBible('plano de leitura')" style="font-size: 0.75rem; white-space: nowrap; padding: 6px 12px;">📅 Plano de Leitura</button>
        </div>
      </div>
    `;
    
    main.appendChild(content);
    
    // Setup Listeners
    const input = document.getElementById('bibleInput');
    const btn = document.getElementById('bibleSendBtn');
    const chat = document.getElementById('bibleChatArea');
    
    const sendMessage = async () => {
        const text = input.value.trim();
        if (!text) return;
        
        // User Message
        const userDiv = document.createElement('div');
        userDiv.className = 'chat-message user';
        userDiv.style.cssText = 'align-self: flex-end; background: rgba(255, 255, 255, 0.1); padding: 10px 15px; border-radius: 12px 12px 0 12px; max-width: 80%;';
        userDiv.textContent = text;
        chat.appendChild(userDiv);
        chat.scrollTop = chat.scrollHeight;
        
        // Bot Thinking
        const thinkingDiv = document.createElement('div');
        thinkingDiv.className = 'chat-message bot thinking';
        thinkingDiv.style.cssText = 'align-self: flex-start; opacity: 0.7; font-style: italic; margin-top: 5px;';
        thinkingDiv.textContent = 'Buscando na palavra...';
        chat.appendChild(thinkingDiv);
        chat.scrollTop = chat.scrollHeight;
        
        // Bot Response (agora assíncrono)
        try {
          if (typeof saveOracleChatMessage === 'function') {
            saveOracleChatMessage('user', text).catch(e => console.warn('Erro ao salvar mensagem do usuário:', e));
          }
        } catch (e) {
          console.warn('saveOracleChatMessage não disponível', e);
        }

        // limpar o input somente após enfileirar/salvar a mensagem do usuário
        try { input.value = ''; } catch(e) { /* ignore */ }

        const response = await BibleAssistant.reply(text);
        thinkingDiv.remove();
        
        const botDiv = document.createElement('div');
        botDiv.className = 'chat-message bot';
        botDiv.style.cssText = 'align-self: flex-start; background: rgba(255, 221, 87, 0.1); color: #ffdd57; padding: 10px 15px; border-radius: 12px 12px 12px 0; max-width: 80%; margin-top: 5px; line-height: 1.5;';
        // Proteção anti-welcome: se a resposta for apenas a mensagem de boas-vindas, tente esclarecer
        let finalResponse = response;
        try {
          if (String(finalResponse).includes('Sou seu assistente bíblico') && text) {
            finalResponse = BibleAssistant.formatNotFound(`Parece que não entendi. Você quis dizer: "${BibleAssistant.escapeHtml(text)}"?`);
          }
        } catch (e) { /* ignore */ }

        botDiv.innerHTML = finalResponse;
        chat.appendChild(botDiv);
        try {
          if (typeof saveOracleChatMessage === 'function') {
            saveOracleChatMessage('assistant', finalResponse).catch(e => console.warn('Erro ao salvar mensagem do assistente:', e));
          }
        } catch (e) {
          console.warn('saveOracleChatMessage não disponível', e);
        }
        chat.scrollTop = chat.scrollHeight;
    };
    
    btn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage(); });
    
    // Global helper for tags
    window.askBible = (query) => {
        const input = document.getElementById('bibleInput');
        if(input) {
            input.value = query;
            document.getElementById('bibleSendBtn').click();
        }
    };
    // sinaliza que a aba Bíblia e handlers estão prontos
    try {
      window.__BIBLE_READY__ = true;
      document.dispatchEvent(new CustomEvent('bible:ready'));
    } catch (e) {
      console.warn('Não foi possível setar __BIBLE_READY__', e);
    }
  }
}

// Métodos auxiliares para NLU
function getTasksList() {
  if (!gameState) return "Não consegui acessar seus dados.";
  
  const pending = (gameState.dailyTasks || []).filter(t => !t.completed);
  const completed = (gameState.dailyTasks || []).filter(t => t.completed);
  
  if (pending.length === 0 && completed.length === 0) {
    return "📝 Você não tem tarefas no momento. Que tal criar uma? Diz: <strong>criar tarefa estudar</strong>";
  }
  
  let response = `<strong>📋 Suas Tarefas:</strong><br><br>`;
  
  if (pending.length > 0) {
    response += `<strong>⏳ Pendentes (${pending.length}):</strong><br>`;
    pending.forEach(t => {
      response += `• ${t.text}`;
      if (t.dueDate) {
        const date = new Date(t.dueDate + 'T00:00');
        response += ` <small>(${date.toLocaleDateString('pt-BR')})</small>`;
      }
      response += `<br>`;
    });
    response += '<br>';
  }
  
  if (completed.length > 0) {
    response += `<strong>✅ Concluídas (${completed.length}):</strong><br>`;
    completed.slice(-3).forEach(t => response += `• <s>${t.text}</s><br>`);
  }
  
  if (pending.length > 0) {
    response += `<br><em>Dica: Diga "completar [nome da tarefa]" para finalizar!</em>`;
  }
  
  return response;
}

function getFinanceSummary() {
  if (!gameState || !gameState.finances) {
    return "📊 Você ainda não tem registros financeiros. Diz algo como <strong>gastei 50 no almoço</strong> para começar!";
  }
  
  const finances = gameState.finances;
  const income = finances.filter(f => f.type === 'income').reduce((sum, f) => sum + f.value, 0);
  const expenses = finances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.value, 0);
  const balance = income - expenses;
  
  // Agrupa gastos por categoria
  const categories = {};
  finances.filter(f => f.type === 'expense').forEach(f => {
    const cat = f.category || 'Outros';
    categories[cat] = (categories[cat] || 0) + f.value;
  });
  
  let response = `<strong>💰 Resumo Financeiro:</strong><br><br>`;
  response += `📈 Entradas: <strong style="color: #4CAF50">R$ ${income.toFixed(2)}</strong><br>`;
  response += `📉 Saídas: <strong style="color: #f44336">R$ ${expenses.toFixed(2)}</strong><br>`;
  response += `💵 Saldo: <strong style="color: ${balance >= 0 ? '#4CAF50' : '#f44336'}">R$ ${balance.toFixed(2)}</strong><br><br>`;
  
  if (Object.keys(categories).length > 0) {
    response += `<strong>📊 Gastos por categoria:</strong><br>`;
    const sortedCats = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    sortedCats.slice(0, 5).forEach(([cat, val]) => {
      response += `• ${cat}: R$ ${val.toFixed(2)}<br>`;
    });
  }
  
  response += `<br>${balance >= 0 ? '✅ Suas finanças estão no verde!' : '⚠️ Atenção com os gastos!'}`;
  
  return response;
}

function getStatusInfo() {
  if (!gameState) return "Não consegui acessar seus dados.";
  
  const name = OracleMemory.getProfile('name');
  const treatment = name || 'Aventureiro';
  
  const level = gameState.level || 1;
  const xp = gameState.xp || 0;
  const pendingTasks = (gameState.dailyTasks || []).filter(t => !t.completed).length;
  
  // Calcula saldo financeiro
  const finances = gameState.finances || [];
  const income = finances.filter(f => f.type === 'income').reduce((sum, f) => sum + f.value, 0);
  const expenses = finances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.value, 0);
  const balance = income - expenses;
  
  // Trabalho de hoje
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = (gameState.workLog || []).filter(l => l.date === today);
  const todayProd = todayLogs.reduce((sum, l) => sum + (l.production || 0), 0);
  const todayMoney = todayLogs.reduce((sum, l) => sum + (l.money || 0), 0);
  
  let response = `<strong>🎮 Status de ${treatment}:</strong><br><br>`;
  response += `⭐ Nível: <strong>${level}</strong> | XP: <strong>${xp}/100</strong><br>`;
  response += `📝 Tarefas pendentes: <strong>${pendingTasks}</strong><br>`;
  response += `💰 Saldo: <strong style="color: ${balance >= 0 ? '#4CAF50' : '#f44336'}">R$ ${balance.toFixed(2)}</strong><br>`;
  
  if (todayProd > 0 || todayMoney > 0) {
    response += `<br><strong>📊 Hoje:</strong><br>`;
    response += `🍕 Produção: ${todayProd} massas<br>`;
    response += `💵 Ganho: R$ ${todayMoney.toFixed(2)}<br>`;
  }
  
  // Dica personalizada
  if (pendingTasks > 3) {
    response += `<br>💡 Você tem muitas tarefas! Foque nas mais importantes.`;
  } else if (pendingTasks === 0) {
    response += `<br>🎉 Sem tarefas pendentes! Que tal criar uma nova meta?`;
  }
  
  return response;
}

function getSuccessMessage() {
  return CHARISMATIC_RESPONSES.success[
    Math.floor(Math.random() * CHARISMATIC_RESPONSES.success.length)
  ];
}

// Helper para dar conselho sobre a meta financeira
function getSavingsAdvice() {
  const goal = gameState.financialGoal || 0;
  if (goal <= 0) return ""; 

  const finances = gameState.finances || [];
  const income = finances.filter(f => f.type === 'income').reduce((sum, f) => sum + f.value, 0);
  const expenses = finances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.value, 0);
  const currentBalance = Math.max(0, income - expenses);
  
  const remaining = Math.max(0, goal - currentBalance);
  
  if (remaining === 0) return "<br><br>🎉 <strong>Meta atingida!</strong> Você já alcançou seu objetivo financeiro!";

  // Cálculo para 1 ano (12 meses)
  const months = 12;
  const monthly = remaining / months;
  
  return `<br><br>🎯 <strong>Meta:</strong> Faltam R$ ${remaining.toLocaleString('pt-BR')}.<br>💡 Para atingir em 1 ano, guarde <strong>R$ ${monthly.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong>/mês.`;
}

// Ações reais
function createTask(text) {
  if (!gameState) return "Erro ao criar tarefa. Tente pela interface.";
  
  if (!gameState.dailyTasks) gameState.dailyTasks = [];
  
  gameState.dailyTasks.push({
    id: Date.now(),
    text: text,
    completed: false,
    date: new Date().toISOString()
  });
  
  saveGame();
  if (typeof renderDailyTasks === 'function') renderDailyTasks();
  
  return getSuccessMessage() + `<br><br>📝 Tarefa criada: <strong>${text}</strong><br><br>Quando terminar, diz: <strong>completar ${text}</strong>`;
}

function completeTask(taskName) {
  if (!gameState || !gameState.dailyTasks) return "Não encontrei tarefas.";

  // Se nenhum nome de tarefa for fornecido, pergunte qual completar.
  if (!taskName) {
    const pendingTasks = gameState.dailyTasks.filter(t => !t.completed);
    if (pendingTasks.length === 0) {
      return "Você não tem tarefas pendentes para completar! 🎉";
    }
    // Retorna um objeto para o OracleChat criar botões de ação
    return {
      message: "Qual tarefa você completou? ✅",
      actions: pendingTasks.slice(0, 4).map(t => ({
        text: t.text.substring(0, 25) + (t.text.length > 25 ? '...' : ''),
        action: () => {
          const response = completeTask(t.text);
          if (typeof response === 'string') {
            addBotMessage(response);
          } else if (response && response.message) {
            addBotMessage(response.message, response.actions);
          }
        }
      }))
    };
  }

  const lowerTaskName = taskName.toLowerCase();
  const pendingTasks = gameState.dailyTasks.filter(t => !t.completed);

  // 1. Tenta encontrar correspondência exata primeiro
  let task = pendingTasks.find(t => t.text.toLowerCase() === lowerTaskName);

  // 2. Se não houver correspondência exata, procura por correspondências parciais
  if (!task) {
    const matches = pendingTasks.filter(t => t.text.toLowerCase().includes(lowerTaskName));

    if (matches.length === 1) {
      task = matches[0];
    } else if (matches.length > 1) {
      // Múltiplas correspondências, pede esclarecimento
      OracleChat.pendingAction = { type: 'clarify_complete_task', matches: matches };
      return {
        message: `Encontrei ${matches.length} tarefas com "${taskName}". Qual delas você completou?`,
        actions: matches.slice(0, 4).map(t => ({
          text: t.text.substring(0, 25) + (t.text.length > 25 ? '...' : ''),
          action: () => {
            OracleChat.pendingAction = null;
            const response = completeTask(t.text);
            if (typeof response === 'string') {
              addBotMessage(response);
            } else if (response && response.message) {
              addBotMessage(response.message, response.actions);
            }
          }
        }))
      };
    }
  }

  if (task) {
    task.completed = true;
    task.completedAt = new Date().toISOString();

    // Dar XP
    const xpReward = task.xpReward || 10;
    gameState.xp = (gameState.xp || 0) + xpReward;
    updateXpHistory(xpReward); // Adicionado para consistência

    if (gameState.xp >= 100) {
      gameState.level = (gameState.level || 1) + 1;
      gameState.xp -= 100;
      gameState.skillPoints = (gameState.skillPoints || 0) + 1;
      showToast('🎉 Level UP! +1 Ponto de Atributo');
      playSound('levelUp');
      triggerLevelUpAnimation();
    }

    saveGame();
    if (typeof renderDailyTasks === 'function') renderDailyTasks();
    if (typeof updateUI === 'function') updateUI();

    return getSuccessMessage() + `<br><br>✅ Tarefa "<strong>${task.text}</strong>" concluída!<br>+${xpReward} XP 🎉`;
  }

  return `Não encontrei uma tarefa pendente com "${taskName}". Diz <strong>minhas tarefas</strong> pra ver a lista!`;
}

function addExpense(value, desc) {
  if (!gameState) return "Erro ao registrar. Tente pela interface.";
  
  if (!gameState.finances) gameState.finances = [];
  
  // Detecta categoria automaticamente pela descrição
  const category = detectCategory(desc);
  
  gameState.finances.push({
    id: Date.now(),
    desc: desc,
    value: value,
    type: 'expense',
    category: category,
    date: new Date().toISOString()
  });
  
  saveGame();
  if (typeof renderFinances === 'function') renderFinances();
  
  const name = OracleMemory.getProfile('name');
  const gender = OracleMemory.getProfile('gender');
  const treatment = gender === 'male' ? 'cara' : gender === 'female' ? 'querida' : (name || 'amigo');
  
  const advice = getSavingsAdvice();
  return getSuccessMessage() + `<br><br>💸 Despesa registrada, ${treatment}!<br><strong>${desc}</strong>: R$ ${value.toFixed(2)}<br><small>Categoria: ${category}</small>${advice}`;
}

function addExpenseWithCategory(value, desc, category) {
  if (!gameState) return "Erro ao registrar. Tente pela interface.";
  
  if (!gameState.finances) gameState.finances = [];
  
  gameState.finances.push({
    id: Date.now(),
    desc: desc,
    value: value,
    type: 'expense',
    category: category.charAt(0).toUpperCase() + category.slice(1),
    date: new Date().toISOString()
  });
  
  saveGame();
  if (typeof renderFinances === 'function') renderFinances();
  
  const advice = getSavingsAdvice();
  return getSuccessMessage() + `<br><br>💸 Despesa registrada:<br><strong>${desc}</strong>: R$ ${value.toFixed(2)}<br><small>Categoria: ${category}</small>${advice}`;
}

// RENOMEAR GASTO
function renameExpense(oldName, newName) {
  if (!gameState || !gameState.finances) return "Não encontrei seus registros financeiros.";
  
  const expenses = gameState.finances.filter(t => t.type === 'expense');
  
  // Busca por nome parcial (case insensitive)
  const found = expenses.filter(e => 
    e.desc.toLowerCase().includes(oldName.toLowerCase())
  );
  
  if (found.length === 0) {
    return `❌ Não encontrei nenhum gasto com o nome "<strong>${oldName}</strong>".<br><br>` +
           `💡 Dica: Diga "<strong>ver meus gastos</strong>" para listar todos os seus gastos.`;
  }
  
  if (found.length === 1) {
    // Apenas um gasto encontrado - renomeia direto
    const expense = found[0];
    const oldDesc = expense.desc;
    expense.desc = newName.charAt(0).toUpperCase() + newName.slice(1);
    
    // Recalcula categoria se necessário
    expense.category = detectCategory(expense.desc);
    
    saveGame();
    if (typeof renderFinances === 'function') renderFinances();
    
    return `✅ Gasto renomeado com sucesso!<br><br>` +
           `📝 De: <strong>${oldDesc}</strong><br>` +
           `📝 Para: <strong>${expense.desc}</strong><br>` +
           `<small>Categoria: ${expense.category}</small>`;
  }
  
  // Múltiplos gastos encontrados - mostra opções
  OracleChat.pendingAction = { type: 'rename_expense_select', newName: newName, matches: found };
  
  let response = `🔍 Encontrei ${found.length} gastos com "<strong>${oldName}</strong>".<br>Qual você quer renomear?<br><br>`;
  
  const actions = found.slice(0, 5).map((e, i) => ({
    text: `${e.desc} (R$ ${e.value.toFixed(2)})`,
    action: () => {
      e.desc = newName.charAt(0).toUpperCase() + newName.slice(1);
      e.category = detectCategory(e.desc);
      saveGame();
      if (typeof renderFinances === 'function') renderFinances();
      OracleChat.pendingAction = null;
      addBotMessage(`✅ "<strong>${e.desc}</strong>" renomeado com sucesso!`);
    }
  }));
  
  return { message: response, actions: actions };
}

// LISTAR GASTOS
function listExpenses() {
  if (!gameState || !gameState.finances) return "Você ainda não tem registros financeiros.";
  
  const expenses = gameState.finances
    .filter(t => t.type === 'expense')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10); // Últimos 10
  
  if (expenses.length === 0) {
    return "📊 Você ainda não registrou nenhum gasto.<br><br>💡 Dica: Diga \"<strong>gastei 50 no almoço</strong>\" para registrar.";
  }
  
  let response = `📊 <strong>Seus últimos gastos:</strong><br><br>`;
  
  expenses.forEach((e, i) => {
    const date = new Date(e.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    response += `${i + 1}. <strong>${e.desc}</strong> - R$ ${e.value.toFixed(2)} <small>(${date})</small><br>`;
  });
  
  response += `<br>💡 Para renomear: "<strong>renomear gasto X para Y</strong>"<br>`;
  response += `💡 Para deletar: "<strong>deletar gasto X</strong>"`;
  
  return response;
}

// DELETAR GASTO
function deleteExpense(name) {
  if (!gameState || !gameState.finances) return "Não encontrei seus registros financeiros.";
  
  const expenses = gameState.finances.filter(t => t.type === 'expense');
  
  // Busca por nome parcial
  const found = expenses.filter(e => 
    e.desc.toLowerCase().includes(name.toLowerCase())
  );
  
  if (found.length === 0) {
    return `❌ Não encontrei nenhum gasto com o nome "<strong>${name}</strong>".`;
  }
  
  if (found.length === 1) {
    const expense = found[0];
    
    // Pede confirmação
    OracleChat.pendingAction = { type: 'confirm_delete_expense', expense: expense };
    
    return {
      message: `⚠️ Tem certeza que quer deletar o gasto "<strong>${expense.desc}</strong>" de R$ ${expense.value.toFixed(2)}?`,
      actions: [
        { 
          text: '✅ Sim, deletar', 
          action: () => {
            gameState.finances = gameState.finances.filter(f => f.id !== expense.id);
            saveGame();
            if (typeof renderFinances === 'function') renderFinances();
            OracleChat.pendingAction = null;
            addBotMessage(`🗑️ Gasto "<strong>${expense.desc}</strong>" deletado!`);
          }
        },
        { 
          text: '❌ Não, cancelar', 
          action: () => {
            OracleChat.pendingAction = null;
            addBotMessage('Ok, cancelado! 👍');
          }
        }
      ]
    };
  }
  
  // Múltiplos encontrados
  OracleChat.pendingAction = { type: 'delete_expense_select', matches: found };
  
  let response = `🔍 Encontrei ${found.length} gastos com "<strong>${name}</strong>".<br>Qual você quer deletar?<br><br>`;
  
  const actions = found.slice(0, 5).map(e => ({
    text: `🗑️ ${e.desc} (R$ ${e.value.toFixed(2)})`,
    action: () => {
      gameState.finances = gameState.finances.filter(f => f.id !== e.id);
      saveGame();
      if (typeof renderFinances === 'function') renderFinances();
      OracleChat.pendingAction = null;
      addBotMessage(`🗑️ Gasto "<strong>${e.desc}</strong>" deletado!`);
    }
  }));
  
  return { message: response, actions: actions };
}

// Detecta categoria automaticamente
function detectCategory(desc) {
  const lower = desc.toLowerCase();
  
  const categories = {
    'Alimentação': ['almoço', 'jantar', 'café', 'lanche', 'comida', 'restaurante', 'pizza', 'hamburguer', 'sushi', 'mercado', 'supermercado', 'feira', 'padaria', 'açougue', 'ifood', 'rappi', 'delivery'],
    'Transporte': ['uber', '99', 'taxi', 'gasolina', 'combustível', 'estacionamento', 'pedágio', 'ônibus', 'metrô', 'passagem', 'carro', 'moto', 'bicicleta'],
    'Lazer': ['cinema', 'netflix', 'spotify', 'jogo', 'game', 'bar', 'balada', 'festa', 'show', 'teatro', 'parque', 'viagem', 'passeio', 'diversão'],
    'Saúde': ['farmácia', 'remédio', 'médico', 'consulta', 'exame', 'hospital', 'dentista', 'academia', 'suplemento', 'vitamina'],
    'Educação': ['curso', 'livro', 'escola', 'faculdade', 'mensalidade', 'material', 'apostila', 'aula'],
    'Moradia': ['aluguel', 'condomínio', 'luz', 'água', 'gás', 'internet', 'telefone', 'celular', 'conta'],
    'Compras': ['roupa', 'sapato', 'tênis', 'shopping', 'loja', 'presente', 'eletrônico', 'celular']
  };
  
  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return cat;
    }
  }
  
  return 'Outros';
}

function addIncome(value, desc) {
  if (!gameState) return "Erro ao registrar. Tente pela interface.";
  
  if (!gameState.finances) gameState.finances = [];
  
  gameState.finances.push({
    id: Date.now(),
    desc: desc,
    value: value,
    type: 'income',
    category: 'Extra',
    date: new Date().toISOString()
  });
  
  saveGame();
  if (typeof renderFinances === 'function') renderFinances();
  
  const advice = getSavingsAdvice();
  return getSuccessMessage() + `<br><br>💰 Receita registrada:<br><strong>${desc}</strong>: R$ ${value.toFixed(2)}${advice}`;
}

// RENOMEAR RECEITA/ENTRADA
function renameIncome(oldName, newName) {
  if (!gameState || !gameState.finances) return "Não encontrei seus registros financeiros.";
  
  const incomes = gameState.finances.filter(t => t.type === 'income');
  
  const found = incomes.filter(e => 
    e.desc.toLowerCase().includes(oldName.toLowerCase())
  );
  
  if (found.length === 0) {
    return `❌ Não encontrei nenhuma entrada com o nome "<strong>${oldName}</strong>".<br><br>` +
           `💡 Dica: Diga "<strong>ver minhas entradas</strong>" para listar.`;
  }
  
  if (found.length === 1) {
    const income = found[0];
    const oldDesc = income.desc;
    income.desc = newName.charAt(0).toUpperCase() + newName.slice(1);
    
    saveGame();
    if (typeof renderFinances === 'function') renderFinances();
    
    return `✅ Entrada renomeada!<br><br>` +
           `📝 De: <strong>${oldDesc}</strong><br>` +
           `📝 Para: <strong>${income.desc}</strong>`;
  }
  
  // Múltiplos encontrados
  OracleChat.pendingAction = { type: 'rename_income_select', newName: newName, matches: found };
  
  const actions = found.slice(0, 5).map(e => ({
    text: `${e.desc} (R$ ${e.value.toFixed(2)})`,
    action: () => {
      e.desc = newName.charAt(0).toUpperCase() + newName.slice(1);
      saveGame();
      if (typeof renderFinances === 'function') renderFinances();
      OracleChat.pendingAction = null;
      addBotMessage(`✅ "<strong>${e.desc}</strong>" renomeado!`);
    }
  }));
  
  return { message: `🔍 Encontrei ${found.length} entradas. Qual renomear?`, actions: actions };
}

// LISTAR RECEITAS/ENTRADAS
function listIncomes() {
  if (!gameState || !gameState.finances) return "Você ainda não tem registros financeiros.";
  
  const incomes = gameState.finances
    .filter(t => t.type === 'income')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);
  
  if (incomes.length === 0) {
    return "📊 Você ainda não registrou nenhuma entrada.<br><br>💡 Dica: Diga \"<strong>recebi 1000 de salário</strong>\" para registrar.";
  }
  
  let response = `📊 <strong>Suas últimas entradas:</strong><br><br>`;
  
  incomes.forEach((e, i) => {
    const date = new Date(e.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    response += `${i + 1}. <strong>${e.desc}</strong> - R$ ${e.value.toFixed(2)} <small>(${date})</small><br>`;
  });
  
  response += `<br>💡 Para renomear: "<strong>renomear entrada X para Y</strong>"`;
  
  return response;
}

// DELETAR RECEITA/ENTRADA
function deleteIncome(name) {
  if (!gameState || !gameState.finances) return "Não encontrei seus registros financeiros.";
  
  const incomes = gameState.finances.filter(t => t.type === 'income');
  
  const found = incomes.filter(e => 
    e.desc.toLowerCase().includes(name.toLowerCase())
  );
  
  if (found.length === 0) {
    return `❌ Não encontrei nenhuma entrada com o nome "<strong>${name}</strong>".`;
  }
  
  if (found.length === 1) {
    const income = found[0];
    
    OracleChat.pendingAction = { type: 'confirm_delete_income', income: income };
    
    return {
      message: `⚠️ Deletar entrada "<strong>${income.desc}</strong>" de R$ ${income.value.toFixed(2)}?`,
      actions: [
        { 
          text: '✅ Sim, deletar', 
          action: () => {
            gameState.finances = gameState.finances.filter(f => f.id !== income.id);
            saveGame();
            if (typeof renderFinances === 'function') renderFinances();
            OracleChat.pendingAction = null;
            addBotMessage(`🗑️ Entrada "<strong>${income.desc}</strong>" deletada!`);
          }
        },
        { 
          text: '❌ Cancelar', 
          action: () => {
            OracleChat.pendingAction = null;
            addBotMessage('Ok, cancelado! 👍');
          }
        }
      ]
    };
  }
  
  // Múltiplos encontrados
  const actions = found.slice(0, 5).map(e => ({
    text: `🗑️ ${e.desc} (R$ ${e.value.toFixed(2)})`,
    action: () => {
      gameState.finances = gameState.finances.filter(f => f.id !== e.id);
      saveGame();
      if (typeof renderFinances === 'function') renderFinances();
      OracleChat.pendingAction = null;
      addBotMessage(`🗑️ Entrada "<strong>${e.desc}</strong>" deletada!`);
    }
  }));
  
  return { message: `🔍 Encontrei ${found.length} entradas. Qual deletar?`, actions: actions };
}

// UI Methods
function addUserMessage(text) {
  const messages = document.getElementById('chatMessages');
  if (!messages) return;
  
  const div = document.createElement('div');
  div.className = 'chat-message user';
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function addBotMessage(text, actions = null) {
  // Aceita também um objeto { message, actions }
  if (text && typeof text === 'object') {
    const obj = text;
    actions = obj.actions || actions || null;
    text = obj.message || obj.text || '';
  }

  const messages = document.getElementById('chatMessages');
  if (!messages) return;

  const div = document.createElement('div');
  div.className = 'chat-message bot';
  div.innerHTML = String(text || '');
  
  if (actions && actions.length > 0) {
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'oracle-action-btns';
    
    actions.forEach(action => {
      const btn = document.createElement('button');
      btn.className = 'oracle-action-btn';
      btn.textContent = action.text;
      btn.addEventListener('click', () => {
        action.action();
        actionsDiv.remove();
      });
      actionsDiv.appendChild(btn);
    });
    
    div.appendChild(actionsDiv);
  }
  
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  playSound('click');
  
  // Se estiver em modo conversa, fala a resposta
  if (VoiceRecognition.conversationMode && OracleSpeech.enabled) {
    // Remove emojis e tags HTML para falar
    const cleanText = text.replace(/<[^>]*>/g, '').replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}]/gu, '').trim();
    if (cleanText) {
      OracleSpeech.speak(cleanText);
    }
  }
}

function addSystemMessage(text) {
  const messages = document.getElementById('chatMessages');
  if (!messages) return;
  
  const div = document.createElement('div');
  div.className = 'chat-message system';
  div.innerHTML = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function showThinking() {
  const messages = document.getElementById('chatMessages');
  if (!messages) return;
  
  const div = document.createElement('div');
  div.className = 'chat-message thinking';
  div.id = 'oracleThinking';
  div.innerHTML = '<div class="thinking-dots"><span></span><span></span><span></span></div>';
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// Utilitários de debug para verificar bindings e elementos do Oráculo
function dumpOracleBindings() {
  const ids = ['addTaskBtn','addFinanceBtn','editProfileBtn','oracleScriptBtn','oracleSettingsBtn','chatBtn','oracleQuickActions','chatModal','chatInput','sendMessageBtn'];
  const results = {};
  console.group('Dump Oracle Bindings');
  ids.forEach(id => {
    const el = document.getElementById(id);
    console.log(id, !!el, el);
    results[id] = !!el;
  });
  console.groupEnd();
  return results;
}

function removeThinking() {
  const thinking = document.getElementById('oracleThinking');
  if (thinking) thinking.remove();
}

// Expõe globalmente para compatibilidade com onclick no HTML
window.toggleChat = () => OracleChat.toggle();
window.toggleZenMode = toggleZenMode;
window.removeTask = removeTask;
window.toggleTask = toggleTask;
window.removeTransaction = removeTransaction;
window.changeFinancePage = changeFinancePage;
window.removeExpenseGroup = removeExpenseGroup;
window.toggleBillPaid = toggleBillPaid;
window.removeBill = removeBill;
window.removeSkillPoint = removeSkillPoint;
window.addSkillPoint = addSkillPoint;
window.removeItem = removeItem;
window.showAchievementDetails = showAchievementDetails;

// --- Lógica do Menu Drawer Mobile ---
const mobileFabMenu = document.getElementById('mobileFabMenu');
const mobileDrawerOverlay = document.getElementById('mobileDrawerOverlay');
const mobileDrawerClose = document.getElementById('mobileDrawerClose');

function openDrawer() {
  if (mobileDrawerOverlay) mobileDrawerOverlay.classList.remove('hidden');
  if (mobileFabMenu) mobileFabMenu.classList.add('active');
}

function closeDrawer() {
  if (mobileDrawerOverlay) mobileDrawerOverlay.classList.add('hidden');
  if (mobileFabMenu) mobileFabMenu.classList.remove('active');
}

if (mobileFabMenu) mobileFabMenu.addEventListener('click', () => {
  if (mobileDrawerOverlay?.classList.contains('hidden')) {
    openDrawer();
  } else {
    closeDrawer();
  }
});

if (mobileDrawerClose) mobileDrawerClose.addEventListener('click', closeDrawer);
if (mobileDrawerOverlay) {
  mobileDrawerOverlay.addEventListener('click', (e) => {
    if (e.target === mobileDrawerOverlay) closeDrawer();
  });
}

// Ações do drawer - Abas (fecha drawer e troca aba)
document.querySelectorAll('.mobile-drawer-item.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabId = btn.getAttribute('data-tab');
    // Remove active de todos
    document.querySelectorAll('.mobile-drawer-item.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    // Ativa o clicado
    btn.classList.add('active');
    const target = document.getElementById(`tab-${tabId}`);
    if (target) target.classList.add('active');
    // Sincroniza com tabs desktop
    document.querySelectorAll(`.tab-btn[data-tab="${tabId}"]`).forEach(b => b.classList.add('active'));
    closeDrawer();
  });
});

// Ações do drawer - Ferramentas
document.getElementById('drawerZenBtn')?.addEventListener('click', () => { closeDrawer(); toggleZenMode(); });
document.getElementById('drawerChatBtn')?.addEventListener('click', () => { closeDrawer(); OracleChat.toggle(); });
document.getElementById('drawerFinanceBtn')?.addEventListener('click', () => { closeDrawer(); window.location.href = './financeiro.html'; });
document.getElementById('drawerPontoBtn')?.addEventListener('click', () => { closeDrawer(); window.location.href = './carga-horaria.html'; });

// Ações do drawer - Sistema
document.getElementById('drawerSaveBtn')?.addEventListener('click', () => { closeDrawer(); saveGame(); });
document.getElementById('drawerUpdateBtn')?.addEventListener('click', () => { closeDrawer(); checkForUpdates(); });
document.getElementById('drawerExportBtn')?.addEventListener('click', () => { closeDrawer(); elements.exportBtn?.click(); });
document.getElementById('drawerImportBtn')?.addEventListener('click', () => { closeDrawer(); elements.importBtn?.click(); });
document.getElementById('drawerLogoutBtn')?.addEventListener('click', () => { closeDrawer(); logout(); });
document.getElementById('drawerResetBtn')?.addEventListener('click', () => { closeDrawer(); resetAccount(); });

// --- Lógica do FAB (Botão Flutuante) ---
if (elements.fabMainBtn) {
  elements.fabMainBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    elements.fabActions.classList.toggle('hidden');
    elements.fabMainBtn.classList.toggle('active');
  });
}

// Fechar FAB ao clicar fora
document.addEventListener('click', (e) => {
  if (elements.fabActions && !elements.fabActions.classList.contains('hidden')) {
    if (!e.target.closest('.fab-container')) {
      elements.fabActions.classList.add('hidden');
      elements.fabMainBtn.classList.remove('active');
    }
  }
});

// Ações do FAB
if (elements.fabWorkBtn) {
  elements.fabWorkBtn.addEventListener('click', () => {
    document.querySelector('.tab-btn[data-tab="dom"]').click();
    elements.fabActions.classList.add('hidden');
    elements.fabMainBtn.classList.remove('active');
    // Rola suavemente para o timer
    setTimeout(() => document.getElementById('workTimerDisplay')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  });
}

if (elements.fabTaskBtn) {
  elements.fabTaskBtn.addEventListener('click', () => {
    document.querySelector('.tab-btn[data-tab="quests"]').click();
    elements.fabActions.classList.add('hidden');
    elements.fabMainBtn.classList.remove('active');
    setTimeout(() => elements.taskInput?.focus(), 100);
  });
}

if (elements.fabFinanceBtn) {
  elements.fabFinanceBtn.addEventListener('click', () => {
    document.querySelector('.tab-btn[data-tab="finance"]').click();
    elements.fabActions.classList.add('hidden');
    elements.fabMainBtn.classList.remove('active');
    setTimeout(() => elements.financeDesc?.focus(), 100);
  });
}

// Toggle Password Visibility (Olho Mágico)
document.querySelectorAll('.toggle-password').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault(); // Evita submeter o formulário
    const targetId = btn.getAttribute('data-target');
    const input = document.getElementById(targetId);
    if (input) {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.textContent = isPassword ? '🙈' : '👁️';
      btn.title = isPassword ? 'Ocultar senha' : 'Mostrar senha';
    }
  });
});

// Validação em Tempo Real: Username
if (elements.registerUsername) {
  elements.registerUsername.addEventListener('input', () => {
    const username = elements.registerUsername.value.trim();
    const msg = elements.usernameCheckMsg;
    
    if (username.length < 3) {
      msg.textContent = '';
      msg.className = 'validation-msg';
      elements.registerUsername.classList.remove('success', 'error');
      return;
    }

    const users = getUsers();
    // Verifica se existe (case insensitive)
    if (users[username] || Object.keys(users).some(k => k.toLowerCase() === username.toLowerCase())) {
      msg.textContent = '❌ Usuário já existe!';
      msg.className = 'validation-msg error';
      elements.registerUsername.classList.add('error');
      elements.registerUsername.classList.remove('success');
    } else {
      msg.textContent = '✅ Disponível';
      msg.className = 'validation-msg success';
      elements.registerUsername.classList.add('success');
      elements.registerUsername.classList.remove('error');
    }
  });
}

// Validação em Tempo Real: Senhas
function validatePasswords() {
  const p1 = elements.registerPassword.value;
  const p2 = elements.registerConfirmPassword.value;
  const msg = elements.passwordMatchMsg;

  if (!p1 || !p2) {
    msg.textContent = '';
    elements.registerConfirmPassword.classList.remove('success', 'error');
    return;
  }

  if (p1 === p2) {
    msg.textContent = '✅ As senhas coincidem';
    msg.className = 'validation-msg success';
    elements.registerConfirmPassword.classList.add('success');
    elements.registerConfirmPassword.classList.remove('error');
  } else {
    msg.textContent = '❌ As senhas não coincidem';
    msg.className = 'validation-msg error';
    elements.registerConfirmPassword.classList.add('error');
    elements.registerConfirmPassword.classList.remove('success');
  }
}

if (elements.registerPassword) elements.registerPassword.addEventListener('input', validatePasswords);
if (elements.registerConfirmPassword) elements.registerConfirmPassword.addEventListener('input', validatePasswords);

// Listener para mudar cor das estrelas quando selecionar cor da aura
if (elements.registerAura) {
  elements.registerAura.addEventListener('input', (e) => {
    updateStarColor(e.target.value);
  });
}

// Também para a edição de personagem
if (elements.editAura) {
  elements.editAura.addEventListener('input', (e) => {
    updateStarColor(e.target.value);
  });
}

// Inicialização Principal
window.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Universo Real carregado com sucesso!');
  
  // Inicializa o Oráculo (com try/catch para capturar erros em tempo de execução)
  setTimeout(() => {
    try {
      OracleChat.init();
      console.log('✅ OracleChat.init executado com sucesso');
    } catch (e) {
      console.error('❌ Erro na inicialização do OracleChat:', e);
      // Mostra uma mensagem na UI para facilitar debugging
      const chatStatus = document.getElementById('oracleStatusText');
      if (chatStatus) chatStatus.textContent = 'Erro ao inicializar Oráculo (ver console)';
    }
  }, 500);
  setTimeout(() => injectBibleTab(), 600); // Injeta a aba Bíblia
  
  // Splash Screen Logic
  const splash = document.getElementById('splashScreen');
  const splashGreeting = document.getElementById('splashGreeting');

  const updateSplashGreeting = () => {
    if (!splashGreeting) return;
    const hour = new Date().getHours();
    let greeting = 'Boa noite';
    if (hour >= 5 && hour < 12) greeting = 'Bom dia';
    else if (hour >= 12 && hour < 18) greeting = 'Boa tarde';
    splashGreeting.textContent = `${greeting}, viajante!`;
  };

  const hideSplash = () => {
    if (splash) splash.classList.add('hidden');
  };

  updateSplashGreeting();
  setTimeout(hideSplash, 100); // Reduzido para 0.1s para carregar mais rápido

  // Feedback Háptico Global para Botões
  document.body.addEventListener('click', (e) => {
    // Detecta cliques em botões e elementos interativos
    if (e.target.closest('button, .btn, .ghost, .icon-btn, .tab-btn, .attr-btn, .task-item, .bill-item')) {
      triggerHaptic();
    }
  });

  // Listener para Playlist (Tocar próxima)
  if (elements.zenAudio) {
    elements.zenAudio.addEventListener('ended', () => {
      if (zenPlaylist.length > 0) {
        playZenTrack(currentTrackIndex + 1);
      }
    });
  }

  // --- Lógica de Instalação PWA ---
  let deferredPrompt;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    // Impede que o navegador mostre o banner padrão imediatamente (opcional)
    e.preventDefault();
    deferredPrompt = e;
    
    // Mostra os botões de instalar (na tela de login e na barra de controle)
    const installBtn1 = elements.installAppBtn;
    const installBtn2 = document.getElementById('installAppBtn2');
    
    if (installBtn1) {
      installBtn1.style.display = 'block';
      installBtn1.addEventListener('click', handleInstallClick);
    }
    
    if (installBtn2) {
      installBtn2.style.display = 'flex';
      installBtn2.addEventListener('click', handleInstallClick);
    }
  });
  
  // Função compartilhada para instalar o app
  async function handleInstallClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`Resultado da instalação: ${outcome}`);
      deferredPrompt = null;
      
      // Esconde ambos os botões
      if (elements.installAppBtn) elements.installAppBtn.style.display = 'none';
      const installBtn2 = document.getElementById('installAppBtn2');
      if (installBtn2) installBtn2.style.display = 'none';
    }
  }

  // Tratamento de erro para o áudio Zen (evita erro no console se falhar)
  if (elements.zenAudio) {
    elements.zenAudio.addEventListener('error', (e) => {
      console.warn("Erro ao carregar áudio (arquivo não encontrado ou erro de rede).");
    });
  }

  // 1. Re-vincular elementos (caso o script tenha carregado antes do DOM)
  Object.keys(elements).forEach(key => {
    if (!elements[key]) {
      const found = document.getElementById(key);
      if (found) elements[key] = found;
    }
  });

  // Injeção de CSS para animações dinâmicas
  const style = document.createElement('style');
  style.textContent = `
    @keyframes taskSuccess {
      0% { transform: scale(1); background-color: rgba(46, 204, 113, 0.1); }
      50% { transform: scale(1.03); background-color: rgba(46, 204, 113, 0.3); box-shadow: 0 0 15px rgba(46, 204, 113, 0.4); }
      100% { transform: scale(1); background-color: transparent; }
    }
    .task-success-anim { animation: taskSuccess 0.6s ease-out; }
  `;
  document.head.appendChild(style);

  checkMissingElements();

  // Re-vincular listener do botão de gratidão para garantir funcionamento
  if (elements.gratitudeBtn) {
    elements.gratitudeBtn.removeEventListener('click', addGratitudeEntry);
    elements.gratitudeBtn.addEventListener('click', addGratitudeEntry);
  }

  // Função para verificar elementos ausentes no DOM (apenas em desenvolvimento)
  function checkMissingElements() {
    const missing = [];
    Object.keys(elements).forEach(key => {
      if (!elements[key]) missing.push(key);
    });
    if (missing.length > 0) {
      console.group('Os seguintes elementos definidos em "elements" não foram encontrados no HTML:');
      missing.forEach(key => console.warn(`- Chave: ${key} (Verifique o ID no HTML)`));
      console.groupEnd();
      // Removido toast de debug para não incomodar usuários em produção
      // showToast(`⚠️ Debug: ${missing.length} elementos não encontrados (F12)`, 5000);
    }
  }
  
  // Sistema de Abas (Inicialização segura)
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      // Remove active de todos os botões e conteúdos
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      // Adiciona active para TODOS os botões com o mesmo data-tab (Desktop e Mobile)
      document.querySelectorAll(`.tab-btn[data-tab="${tabId}"]`).forEach(b => b.classList.add('active'));
      
      const target = document.getElementById(`tab-${tabId}`);
      if (target) target.classList.add('active');
      
      // Forçar redimensionamento dos gráficos ao trocar de aba
      window.dispatchEvent(new Event('resize'));
    });
  });

  checkSession();
});

// Evento disparado quando o app é instalado com sucesso
window.addEventListener('appinstalled', () => {
  if (elements.installAppBtn) elements.installAppBtn.style.display = 'none';
  const installBtn2 = document.getElementById('installAppBtn2');
  if (installBtn2) installBtn2.style.display = 'none';
  showToast('🎉 App instalado com sucesso!');
});

// Salvar ao sair/ocultar (Garante contagem de tempo correta em segundo plano)
window.addEventListener('beforeunload', () => {
  if (isLoggedIn && gameState) saveGame(true);
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && isLoggedIn && gameState) {
    saveGame(true);
  }
});

// Auto-save a cada 2 minutos
setInterval(() => {
  if (isLoggedIn && gameState) {
    saveGame(true);
  }
}, 120000);

// Timer do Relacionamento (1 segundo)
setInterval(updateRelationshipTimer, 1000);

// ===========================================
// SISTEMA DE ATUALIZAÇÃO DO PWA
// ===========================================

let swRegistration = null;
let updateAvailable = false;

// Força atualização do app (chamado pela notificação automática)
function forceAppUpdate() {
  if (swRegistration && swRegistration.waiting) {
    // Envia mensagem para o SW waiting para ativar
    swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  } else {
    // Se não tem SW waiting, apenas recarrega
    window.location.reload(true);
  }
}

// Mostra notificação de atualização
function showUpdateNotification() {
  // Remove notificação antiga se existir
  const oldNotif = document.getElementById('updateNotification');
  if (oldNotif) oldNotif.remove();
  
  const notification = document.createElement('div');
  notification.id = 'updateNotification';
  notification.innerHTML = `
    <div style="
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: #000;
      padding: 12px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10001;
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 600;
      animation: slide-up 0.3s ease;
    ">
      <span>🔄 Nova versão disponível!</span>
      <button onclick="forceAppUpdate()" style="
        background: #000;
        color: #fff;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
      ">Atualizar</button>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: transparent;
        border: none;
        color: #000;
        cursor: pointer;
        font-size: 18px;
      ">✕</button>
    </div>
  `;
  document.body.appendChild(notification);
}

// Adiciona estilos de animação
const updateStyles = document.createElement('style');
updateStyles.textContent = `
  @keyframes slide-up {
    from { transform: translateX(-50%) translateY(100px); opacity: 0; }
    to { transform: translateX(-50%) translateY(0); opacity: 1; }
  }
`;
document.head.appendChild(updateStyles);

// Registrar Service Worker (PWA) com detecção de atualizações
if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.protocol === 'http:')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('✅ Service Worker registrado!');
        swRegistration = reg;
        
        // Verifica se já tem um SW waiting (atualização pendente)
        if (reg.waiting) {
          updateAvailable = true;
          showUpdateNotification();
        }
        
        // Detecta quando uma nova versão está disponível
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          console.log('🔄 Nova versão sendo instalada...');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nova versão instalada, mas antiga ainda ativa
              updateAvailable = true;
              console.log('✅ Nova versão pronta! Mostrando notificação.');
              showUpdateNotification();
            }
          });
        });
        
        // Verifica atualizações a cada 5 minutos
        setInterval(() => {
          reg.update();
        }, 5 * 60 * 1000);
      })
      .catch(err => console.log('❌ Falha no Service Worker:', err));
    
    // Quando o SW toma controle, recarrega a página
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('⚡ Novo Service Worker ativo! Recarregando...');
      window.location.reload();
    });
  });
}

// Função global para verificar versão (pode ser chamada do console)
window.checkAppVersion = async function() {
  if (swRegistration) {
    const messageChannel = new MessageChannel();
    return new Promise(resolve => {
      messageChannel.port1.onmessage = (event) => {
        console.log('📱 Versão do app:', event.data.version);
        resolve(event.data.version);
      };
      navigator.serviceWorker.controller?.postMessage(
        { type: 'GET_VERSION' },
        [messageChannel.port2]
      );
    });
  }
  return 'Service Worker não disponível';
};

// Função global para forçar atualização (pode ser chamada do console)
window.forceUpdate = forceAppUpdate;

// -------------------------------
// Ingestão de PDF para o Oracle
// Requer PDF.js (veja instruções no index.html)
// -------------------------------
async function ingestPdfToOracle(url, options = { chunkSize: 2000 }) {
  if (typeof pdfjsLib === 'undefined') {
    console.warn('PDF.js não encontrado. Adicione <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script> em index.html');
    return { success: false, error: 'pdfjs missing' };
  }

  try {
    const loadingTask = pdfjsLib.getDocument(url);
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      const pageText = content.items.map(i => i.str).join(' ');
      fullText += `\n\n--- Página ${p} ---\n\n` + pageText;
    }

    const chunkSize = options.chunkSize || 2000;
    let chunksAdded = 0;
    for (let i = 0; i < fullText.length; i += chunkSize) {
      const chunk = fullText.slice(i, i + chunkSize).trim();
      if (chunk) {
        OracleMemory.learn(chunk, 'pdf');
        chunksAdded++;
      }
    }

    // Opcional: criar um script resumido no OracleScript
    try {
      const script = {
        id: Date.now(),
        filename: url.split('/').pop(),
        loadedAt: new Date().toISOString(),
        instructions: [],
        facts: [fullText.slice(0, 2000)],
        commands: [],
        responses: {},
        raw: fullText
      };
      const scripts = OracleScript.getScripts();
      scripts.push(script);
      OracleScript.saveScripts(scripts);
    } catch (e) {
      console.warn('Não foi possível salvar script resumido:', e);
    }

    OracleMemory.updateMemoryDisplay();
    return { success: true, pages: pdf.numPages, chunks: chunksAdded };
  } catch (e) {
    console.error('Erro ingestando PDF:', e);
    return { success: false, error: e.message || String(e) };
  }
}

// Helper para chamar pela UI (ex: botão)
window.ingestPdfToOracle = ingestPdfToOracle;

// -------------------------------
// Aliases globais de compatibilidade
// Evita erros quando código externo/antigo chama nomes diferentes
// Define apenas se não existir para não sobrescrever implementações atuais
// -------------------------------
try {
  if (typeof window !== 'undefined') {
    if (!window.getTasksList) window.getTasksList = (typeof getTasksList === 'function') ? getTasksList : () => "Função getTasksList não disponível.";
    if (!window.getTaskList) window.getTaskList = window.getTasksList;

    if (!window.addMessages) window.addMessages = (...args) => (typeof addBotMessage === 'function' ? addBotMessage(...args) : null);
    if (!window.addMessage) window.addMessage = window.addMessages;

    if (!window.generateResponse) window.generateResponse = (input) => (typeof OracleChat !== 'undefined' && typeof OracleChat.generateResponse === 'function') ? OracleChat.generateResponse.call(OracleChat, input) : null;
  }
} catch (e) {
  console.warn('Erro ao definir aliases globais de compatibilidade:', e);
}

// -------------------------------
// Navegação móvel interna (previne saída do PWA no mobile)
// -------------------------------
(function(){
  function showSplash(){
    const splash = document.getElementById('splashScreen');
    if (splash) splash.style.display = '';
    const chatModal = document.getElementById('chatModal');
    if (chatModal) chatModal.classList.remove('open');
  }

  function openOraculo(){
    // usa botão existente se houver
    const chatBtn = document.getElementById('chatBtn');
    if (chatBtn) { chatBtn.click(); return; }
    const chatModal = document.getElementById('chatModal');
    if (chatModal) chatModal.classList.add('open');
    const input = document.getElementById('chatInput');
    if (input) input.focus();
  }

  function openTarefas(){
    const fab = document.getElementById('fabTaskBtn') || document.getElementById('fabWorkBtn');
    if (fab) { fab.click(); return; }
    alert('Abrir Tarefas (não implementado)');
  }

  function openFinanceiro(){
    const fab = document.getElementById('fabFinanceBtn');
    if (fab) { fab.click(); return; }
    alert('Abrir Financeiro (não implementado)');
  }

  function navigateTo(view, addHistory = true){
    switch(view){
      case 'oraculo': openOraculo(); break;
      case 'tarefas': openTarefas(); break;
      case 'financeiro': openFinanceiro(); break;
      default: showSplash(); break;
    }
    if (addHistory) {
      try { history.pushState({view}, '', '#'+view); } catch(e){}
    }
  }

  window.addEventListener('popstate', function(e){
    const state = (e.state && e.state.view) ? e.state.view : (location.hash ? location.hash.replace('#','') : 'home');
    navigateTo(state, false);
  });

  document.addEventListener('DOMContentLoaded', function(){
    // delegação de eventos na nav
    const nav = document.getElementById('mobile-nav');
    if (nav){
      nav.addEventListener('click', function(e){
        const btn = e.target.closest && e.target.closest('.nav-btn');
        if (!btn) return;
        const view = btn.getAttribute('data-view') || 'home';
        navigateTo(view, true);
      });
    }

    // Navega conforme hash inicial
    const initial = location.hash ? location.hash.replace('#','') : 'home';
    navigateTo(initial, false);
  });
})();
