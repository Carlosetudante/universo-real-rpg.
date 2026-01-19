// Universo Real - Frontend com Backend Integration
// API Base URL
const API_URL = '/api';

// Sistema de Som (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const sounds = {
  click: () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  },
  
  levelUp: () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    
    [440, 554, 659, 880].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
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
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    
    [523.25, 659.25, 783.99, 1046.50].forEach((freq) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
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
    str = str.replace(/\./g, '').replace(',', '.');
  } else {
    // Se só tem ponto (ex: 2.000), assume que é milhar
    str = str.replace(/\./g, '');
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

// Sistema de Conquistas
const ACHIEVEMENTS = [
  { id: 'first_step', name: 'Primeiro Passo', icon: '👣', condition: (char) => char.level >= 1, unlocked: true, titleReward: 'O Iniciante' },
  { id: 'level_5', name: 'Novato', icon: '🌱', condition: (char) => char.level >= 5, titleReward: 'Aprendiz' },
  { id: 'level_10', name: 'Experiente', icon: '⭐', condition: (char) => char.level >= 10, titleReward: 'Aventureiro' },
  { id: 'level_25', name: 'Veterano', icon: '🏅', condition: (char) => char.level >= 25, titleReward: 'Veterano' },
  { id: 'level_50', name: 'Mestre', icon: '👑', condition: (char) => char.level >= 50, titleReward: 'Lenda' },
  { id: 'all_attrs_10', name: 'Equilibrado', icon: '⚖️', condition: (char) => Object.values(char.attributes).every(v => v >= 10), titleReward: 'Harmônico' },
  { id: 'one_attr_50', name: 'Especialista', icon: '🎯', condition: (char) => Object.values(char.attributes).some(v => v >= 50), titleReward: 'Grão-Mestre' },
  { id: 'week_streak', name: 'Consistente', icon: '🔥', condition: (char) => char.streak >= 7, titleReward: 'Persistente' },
  { id: 'month_streak', name: 'Dedicado', icon: '💎', condition: (char) => char.streak >= 30, titleReward: 'Imparável' },
  { id: 'streak_10', name: 'Chave Mestra', icon: '🗝️', condition: (char) => char.streak >= 10, titleReward: 'Guardião', secret: true }
];

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
let domProductionChartInstance = null;
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
  financeGoalDisplay: document.getElementById('financeGoalDisplay'),
  financeGoalText: document.getElementById('financeGoalText'),
  financeGoalProgress: document.getElementById('financeGoalProgress'),
  financeGoalStatus: document.getElementById('financeGoalStatus'),

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

  // Dom
  domDateInput: document.getElementById('domDateInput'),
  domEntryTimeInput: document.getElementById('domEntryTimeInput'),
  domExitTimeInput: document.getElementById('domExitTimeInput'),
  addDomHourBtn: document.getElementById('addDomHourBtn'),
  domHourHistoryList: document.getElementById('domHourHistoryList'),
  domDoughDateInput: document.getElementById('domDoughDateInput'),
  domDoughInput: document.getElementById('domDoughInput'),
  addDomDoughBtn: document.getElementById('addDomDoughBtn'),
  domHistoryList: document.getElementById('domHistoryList'),
  domStats: document.getElementById('domStats'),
  domPriceInput: document.getElementById('domPriceInput'),
  domProductionChart: document.getElementById('domProductionChart')
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
}

function hideAuthModal() {
  elements.authModal.classList.remove('active');
  elements.gameScreen.classList.remove('hidden');
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

// Função de login local
async function login() {
  const username = elements.loginUsername.value.trim();
  const password = elements.loginPassword.value;
  if (!username || !password) {
    showToast('⚠️ Preencha todos os campos!');
    return;
  }
  try {
    elements.loginBtn.disabled = true;
    elements.loginBtn.textContent = 'Entrando...';
    const users = getUsers();
    if (!users[username]) {
      // Tenta encontrar usuário com letras maiúsculas/minúsculas diferentes
      const foundKey = Object.keys(users).find(k => k.toLowerCase() === username.toLowerCase());
      if (foundKey) {
        throw new Error(`Usuário não encontrado! Você quis dizer "${foundKey}"?`);
      }
      throw new Error('Usuário não encontrado! Crie uma conta primeiro.');
    }
    
    if (users[username].password !== password) {
      throw new Error('Senha incorreta!');
    }
    
    // Salvar usuário na memória se a opção estiver marcada
    if (elements.rememberUser && elements.rememberUser.checked) {
      localStorage.setItem('ur_last_user', username);
    } else {
      localStorage.removeItem('ur_last_user');
    }

    showToast('✅ Login realizado com sucesso!');
    gameState = normalizeGameState(users[username].character);
    isLoggedIn = true;
    loginTime = new Date();
    saveSession(username);
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
  let username = elements.loginUsername.value.trim();
  if (!username) {
    username = prompt("Digite seu usuário para recuperar a senha:");
  }
  
  if (!username) return;

  const users = getUsers();
  if (users[username]) {
    // Verifica se o usuário tem pergunta de segurança (contas novas)
    if (users[username].security && users[username].security.question) {
      const answer = prompt(`Pergunta de Segurança: ${users[username].security.question}`);
      if (answer && answer.toLowerCase().trim() === users[username].security.answer.toLowerCase().trim()) {
        alert(`Sua senha é: ${users[username].password}`);
      } else {
        showToast('❌ Resposta de segurança incorreta.');
      }
    } else {
      // Fallback para contas antigas (Nome do Personagem)
      const charName = users[username].character.name;
      const check = prompt(`Segurança (Conta Antiga): Qual o nome do seu personagem?`);
      if (check && check.toLowerCase().trim() === charName.toLowerCase().trim()) {
        alert(`Sua senha é: ${users[username].password}`);
      } else {
        showToast('❌ Nome do personagem incorreto.');
      }
    }
  } else {
    showToast('❌ Usuário não encontrado neste navegador.');
  }
}

// Função de cadastro local
async function register() {
  const username = elements.registerUsername.value.trim();
  const password = elements.registerPassword.value;
  const confirmPassword = elements.registerConfirmPassword.value;
  const name = elements.registerName.value.trim();
  const race = elements.registerRace.value;
  const auraColor = elements.registerAura.value;
  const question = elements.registerQuestion.value.trim();
  const answer = elements.registerAnswer.value.trim();

  if (!username || !password || !name || !question || !answer) {
    showToast('⚠️ Preencha todos os campos obrigatórios!');
    return;
  }
  if (password.length < 4) {
    showToast('⚠️ A senha deve ter pelo menos 4 caracteres!');
    return;
  }
  if (password !== confirmPassword) {
    showToast('⚠️ As senhas não coincidem!');
    return;
  }
  try {
    elements.registerBtn.disabled = true;
    elements.registerBtn.textContent = 'Criando...';
    let users = getUsers();
    if (users[username]) {
      throw new Error('Usuário já existe!');
    }
    // Criação do personagem inicial
    let character = {
      username,
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
    character = normalizeGameState(character); // Garante que todos os campos padrão (como Pomodoro) existam
    users[username] = { password, character, security: { question, answer } };
    setUsers(users);
    showToast('🎉 Personagem criado com sucesso!', 4000);
    gameState = character;
    isLoggedIn = true;
    saveSession(username);
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
  showToast('👋 Até logo!');
  isLoggedIn = false;
  gameState = null;
  clearSession();
  showAuthModal();
  showLoginForm();
}

async function checkSession() {
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
    checkDailyTaskReset(); // Verifica se virou o dia para resetar tarefas/aplicar penalidade
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
    domPrice: 0,
    zenBackgroundImage: null,
    zenMusic: null,
    gratitudeJournal: [],
    taskHistory: []
  };

  // Mescla os dados importados com o padrão para preencher campos faltantes
  const merged = { ...defaultState, ...data };

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
    let users = getUsers();
    if (users[username]) {
      users[username].character = gameState;
      setUsers(users);
      
      // Backup Automático
      createAutoBackup();

      if (!silent) showToast('💾 Progresso salvo com sucesso!');
    } else {
      throw new Error('Usuário não encontrado para salvar.');
    }
  } catch (error) {
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
  
  gameState.xpHistory[dateKey] = (gameState.xpHistory[dateKey] || 0) + amount;
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
  elements.gratitudeHistory.innerHTML = '';
  const list = gameState.gratitudeJournal || [];
  
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

function removeTask(id, event) {
  event.stopPropagation(); // Impede que o clique no botão ative o toggleTask
  if (confirm('Excluir esta tarefa permanentemente?')) {
    gameState.dailyTasks = gameState.dailyTasks.filter(t => t.id !== id);
    saveGame();
    updateUI();
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

function removeTransaction(id) {
  if (confirm('Remover esta transação?')) {
    gameState.finances = gameState.finances.filter(t => t.id !== id);
    saveGame();
    updateUI();
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
      <button class="ghost" style="padding:4px 8px; margin-left:10px" onclick="removeTransaction(${t.id})">❌</button>
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
  if (isNaN(goal) || goal < 0) {
    showToast('⚠️ Defina um valor válido para a meta!');
    return;
  }
  gameState.financialGoal = goal;
  saveGame();
  updateUI();
  showToast('🎯 Meta financeira definida!');
}

function renderFinancialGoal() {
  const goal = gameState.financialGoal || 0;
  
  if (goal <= 0) {
    if (elements.financeGoalDisplay) elements.financeGoalDisplay.classList.add('hidden');
    return;
  }
  
  if (elements.financeGoalDisplay) elements.financeGoalDisplay.classList.remove('hidden');
  if (elements.financeGoalInput) elements.financeGoalInput.placeholder = `Meta atual: R$ ${goal.toLocaleString('pt-BR')}`;
  
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
  if (percent < 0) percent = 0;
  if (percent > 100) percent = 100;
  
  if (elements.financeGoalProgress) elements.financeGoalProgress.style.width = `${percent}%`;
  if (elements.financeGoalText) elements.financeGoalText.textContent = `${percent.toFixed(1)}% (R$ ${balance.toLocaleString('pt-BR')} / R$ ${goal.toLocaleString('pt-BR')})`;
  
  const remaining = goal - balance;
  if (elements.financeGoalStatus) {
    if (remaining <= 0) {
      elements.financeGoalStatus.textContent = "🎉 Meta alcançada! Parabéns!";
      elements.financeGoalStatus.style.color = "var(--accent)";
      elements.financeGoalStatus.style.fontWeight = "bold";
    } else {
      elements.financeGoalStatus.textContent = `Faltam R$ ${remaining.toLocaleString('pt-BR')}`;
      elements.financeGoalStatus.style.color = "inherit";
      elements.financeGoalStatus.style.fontWeight = "normal";
    }
  }
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
    // Se ontem, aumenta streak, senão zera
    if (lastClaim && (now - lastClaim) < 1000 * 60 * 60 * 48 && now.getDate() !== lastClaim.getDate()) {
      streak++;
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
    saveGame();
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
    div.innerHTML = `
      <span class="achievement-icon">${displayIcon}</span>
      <div style="flex: 1;">
        <div style="font-weight: 600;">${displayName}</div>
        <div class="small" style="opacity: 0.7;">${unlocked ? 'Desbloqueada!' : '???'}</div>
      </div>
    `;
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
      
      if (achievement.icon === '👣') {
        badge.style.cursor = 'pointer';
        badge.title = "Ver tempo online";
        badge.onclick = () => {
          const now = new Date();
          const start = loginTime || now;
          const diff = now - start;
          const hours = Math.floor(diff / 3600000);
          const minutes = Math.floor((diff % 3600000) / 60000);
          showToast(`⏱️ Tempo online: ${hours}h e ${minutes}m`);
        };
      } else {
        badge.title = `${achievement.name}\n${achievement.titleReward ? 'Título: ' + achievement.titleReward : 'Conquista Desbloqueada'}`;
      }
      
      elements.heroVisualBadges.appendChild(badge);
    }
  });
}

// --- Dom: Carga Horária (Dia a Dia) ---
function addDomHourRecord() {
  const date = elements.domDateInput.value;
  const entry = elements.domEntryTimeInput.value;
  const exit = elements.domExitTimeInput.value;
  if (!date || !entry || !exit) {
    showToast('⚠️ Preencha data, entrada e saída!');
    return;
  }
  if (!gameState.domHours) gameState.domHours = [];
  gameState.domHours.push({ date, entry, exit });
  saveGame();
  renderDomHourHistory();
  elements.domDateInput.value = '';
  elements.domEntryTimeInput.value = '';
  elements.domExitTimeInput.value = '';
  showToast('⏰ Registro de carga horária adicionado!');
}

function saveDomPrice() {
  if (!gameState) return;
  const price = parseMoney(elements.domPriceInput.value);
  gameState.domPrice = isNaN(price) ? 0 : price;
  saveGame(true);
  renderDomDoughHistory();
}

function renderDomHourHistory() {
  if (!elements.domHourHistoryList || !gameState) return;
  const list = gameState.domHours || [];
  if (list.length === 0) {
    elements.domHourHistoryList.innerHTML = '<tr><td colspan="4" style="padding:8px; opacity:0.6;">Nenhum registro ainda.</td></tr>';
    return;
  }
  elements.domHourHistoryList.innerHTML = '';
  list.slice().reverse().forEach(item => {
    // Calcular total de horas
    let total = '';
    try {
      const [h1, m1] = item.entry.split(':').map(Number);
      const [h2, m2] = item.exit.split(':').map(Number);
      let start = h1 * 60 + m1;
      let end = h2 * 60 + m2;
      let diff = end - start;
      if (diff < 0) diff += 24 * 60;
      total = (diff / 60).toFixed(2);
    } catch { total = '?'; }
    elements.domHourHistoryList.innerHTML += `
      <tr>
        <td style="padding:6px;">${item.date}</td>
        <td style="padding:6px;">${item.entry}</td>
        <td style="padding:6px;">${item.exit}</td>
        <td style="padding:6px;">${total}</td>
      </tr>
    `;
  });
}

// --- Dom: Produção de Massas ---
function addDomDoughRecord() {
  const date = elements.domDoughDateInput.value;
  const qty = parseInt(elements.domDoughInput.value);
  const currentPrice = parseMoney(elements.domPriceInput.value);

  if (!date || isNaN(qty) || qty <= 0) {
    showToast('⚠️ Preencha semana e quantidade válida!');
    return;
  }

  // Validação de preço maior que zero
  const priceToUse = !isNaN(currentPrice) ? currentPrice : (gameState.domPrice || 0);
  if (priceToUse <= 0) {
    showToast('⚠️ O valor por massa deve ser maior que zero!');
    return;
  }

  // Atualiza o preço global se válido
  if (!isNaN(currentPrice)) {
    gameState.domPrice = currentPrice;
  }

  if (!gameState.domDoughs) gameState.domDoughs = [];
  
  // Salva o registro com o preço atual
  gameState.domDoughs.push({ 
    date, 
    qty,
    price: priceToUse
  });
  
  updateDomFinance(date);
  saveGame();
  renderDomDoughHistory();
  renderDomProductionChart();
  elements.domDoughDateInput.value = '';
  elements.domDoughInput.value = '';
  showToast('🍞 Registro de massas adicionado!');
}

function editDomDough(dateKey) {
  if (!gameState.domDoughs) return;
  
  const entries = gameState.domDoughs.filter(d => d.date === dateKey);
  if (entries.length === 0) return;
  
  const currentTotal = entries.reduce((sum, item) => sum + item.qty, 0);
  // Usa o preço do último registro como referência
  const lastPrice = entries[entries.length - 1].price || gameState.domPrice || 0;
  
  const newTotalStr = prompt(`Editar total de massas para ${dateKey}:`, currentTotal);
  if (newTotalStr === null) return; // Cancelado pelo usuário
  
  const newTotal = parseInt(newTotalStr);
  if (isNaN(newTotal) || newTotal < 0) {
    showToast('⚠️ Quantidade inválida!');
    return;
  }
  
  // Remove entradas antigas dessa data e adiciona a consolidada
  gameState.domDoughs = gameState.domDoughs.filter(d => d.date !== dateKey);
  if (newTotal > 0) {
    gameState.domDoughs.push({ date: dateKey, qty: newTotal, price: lastPrice });
  }
  
  saveGame();
  renderDomDoughHistory();
  renderDomProductionChart();
  showToast('✅ Quantidade atualizada com sucesso!');
}

function updateDomFinance(dateKey) {
  if (!gameState.domDoughs) return;
  
  // Calcula o total para esta semana específica
  const entries = gameState.domDoughs.filter(d => d.date === dateKey);
  const totalValue = entries.reduce((sum, item) => {
    const price = (item.price !== undefined) ? item.price : (gameState.domPrice || 0);
    return sum + (item.qty * price);
  }, 0);
  
  if (!gameState.finances) gameState.finances = [];
  
  // Tag única para identificar que essa entrada veio do Dom
  const tag = `dom_${dateKey}`;
  const existingIndex = gameState.finances.findIndex(f => f.tag === tag);
  
  if (totalValue > 0) {
    if (existingIndex >= 0) {
      // Atualiza existente
      gameState.finances[existingIndex].value = totalValue;
    } else {
      // Cria nova entrada como "Extra"
      gameState.finances.push({
        id: Date.now(),
        desc: `Produção Dom (${dateKey})`,
        value: totalValue,
        type: 'income',
        category: 'Extra',
        date: new Date().toISOString(),
        tag: tag
      });
    }
  } else if (existingIndex >= 0) {
    // Se o total for 0, remove a entrada financeira
    gameState.finances.splice(existingIndex, 1);
  }
}

function editDomDough(dateKey) {
  if (!gameState.domDoughs) return;
  const entries = gameState.domDoughs.filter(d => d.date === dateKey);
  if (entries.length === 0) return;
  
  const currentTotal = entries.reduce((sum, item) => sum + item.qty, 0);
  const lastPrice = entries[entries.length - 1].price || gameState.domPrice || 0;
  
  const newTotalStr = prompt(`Editar total de massas para ${dateKey}:`, currentTotal);
  if (newTotalStr === null) return;
  
  const newTotal = parseInt(newTotalStr);
  if (isNaN(newTotal) || newTotal < 0) {
    showToast('⚠️ Quantidade inválida!');
    return;
  }
  
  // Substitui as entradas antigas por uma consolidada
  gameState.domDoughs = gameState.domDoughs.filter(d => d.date !== dateKey);
  if (newTotal > 0) {
    gameState.domDoughs.push({ date: dateKey, qty: newTotal, price: lastPrice });
  }
  
  updateDomFinance(dateKey);
  saveGame();
  renderDomDoughHistory();
  renderDomProductionChart();
  showToast('✅ Quantidade e Financeiro atualizados!');
}

function renderDomDoughHistory() {
  if (!elements.domHistoryList || !elements.domStats || !gameState) return;
  const list = gameState.domDoughs || [];
  
  // Atualiza o input de preço com o valor salvo
  if (elements.domPriceInput && document.activeElement !== elements.domPriceInput) {
    elements.domPriceInput.value = gameState.domPrice || '';
  }

  if (list.length === 0) {
    elements.domHistoryList.innerHTML = '<div style="padding:10px; opacity:0.6;">Nenhum registro ainda.</div>';
    elements.domStats.innerHTML = '0';
    return;
  }

  // Agrupar por semana
  const groups = {};
  let totalQty = 0;
  let totalValueGlobal = 0;

  list.forEach(item => {
    totalQty += item.qty;
    
    // Usa o preço salvo no item ou o global como fallback
    const itemPrice = (item.price !== undefined) ? item.price : (gameState.domPrice || 0);
    const itemTotal = item.qty * itemPrice;
    
    totalValueGlobal += itemTotal;

    if (!groups[item.date]) {
      groups[item.date] = { qty: 0, value: 0, price: itemPrice };
    }
    
    groups[item.date].qty += item.qty;
    groups[item.date].value += itemTotal;
    // Atualiza o preço de referência para o grupo (último registrado)
    groups[item.date].price = itemPrice;
  });

  elements.domHistoryList.innerHTML = '';
  
  // Ordenar e Renderizar
  Object.keys(groups).sort().reverse().forEach(dateKey => {
    const group = groups[dateKey];
    
    let displayDate = dateKey;
    let dateSubtext = '';

    // Converter 2026-W01 para data legível
    if (dateKey && dateKey.includes('-W')) {
      const [yearStr, weekStr] = dateKey.split('-W');
      const year = parseInt(yearStr);
      const week = parseInt(weekStr);
      
      // Cálculo aproximado do início da semana ISO
      const simple = new Date(year, 0, 1 + (week - 1) * 7);
      const dayOfWeek = simple.getDay();
      const weekStart = simple;
      if (dayOfWeek <= 4) weekStart.setDate(simple.getDate() - simple.getDay() + 1);
      else weekStart.setDate(simple.getDate() + 8 - simple.getDay());
      
      displayDate = `Semana ${week}/${year}`;
      dateSubtext = weekStart.toLocaleDateString('pt-BR');
    }
    
    elements.domHistoryList.innerHTML += `
      <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; margin-bottom: 8px; border-left: 3px solid var(--accent);">
        <div style="display:flex; justify-content:space-between; margin-bottom: 6px;">
          <span style="font-weight:700; color:#fff;">${displayDate}</span>
          <div style="display:flex; align-items:center; gap:8px;">
            <button class="ghost" style="padding: 2px 6px; font-size: 12px; border: 1px solid rgba(255,255,255,0.1);" onclick="editDomDough('${dateKey}')" title="Editar Quantidade">✏️</button>
            <span style="font-size:12px; opacity:0.7;">${dateSubtext}</span>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px;">
          <div>🍕 <b>${group.qty}</b> massas</div>
          <div style="opacity: 0.8;">Unit: R$ ${group.price.toLocaleString('pt-BR')}</div>
          <div style="color: var(--success); font-weight: 700;">Total: R$ ${group.value.toLocaleString('pt-BR')}</div>
        </div>
      </div>`;
  });

  elements.domStats.innerHTML = `${totalQty} <span style="color: var(--success); margin-left: 8px; font-size: 0.9em;">(Total: R$ ${totalValueGlobal.toLocaleString('pt-BR')})</span>`;
}

function renderDomProductionChart() {
  if (!elements.domProductionChart || !gameState) return;

  const list = gameState.domDoughs || [];
  const groups = {};

  // Agrupar por semana
  list.forEach(item => {
    if (!groups[item.date]) groups[item.date] = 0;
    groups[item.date] += item.qty;
  });

  // Pegar as últimas 4 semanas ordenadas
  const sortedWeeks = Object.keys(groups).sort();
  const last4Weeks = sortedWeeks.slice(-4);
  
  const labels = last4Weeks.map(w => {
    if (w.includes('-W')) {
      const [y, week] = w.split('-W');
      return `Sem ${week}`;
    }
    return w;
  });
  
  const data = last4Weeks.map(w => groups[w]);

  if (domProductionChartInstance) {
    domProductionChartInstance.destroy();
  }

  domProductionChartInstance = new Chart(elements.domProductionChart, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Massas',
        data: data,
        backgroundColor: '#ffdd57',
        borderRadius: 4,
        barThickness: 40
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#ccc', precision: 0 } },
        x: { grid: { display: false }, ticks: { color: '#ccc' } }
      },
      plugins: { legend: { display: false } }
    }
  });
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
    div.onclick = () => toggleTask(task.id);
    div.innerHTML = `
      <span style="flex:1">${task.completed ? '✅' : '⬜'} ${task.text}</span>
      <button class="ghost" style="padding:4px 8px; font-size:10px" onclick="removeTask(${task.id}, event)">❌</button>
    `;
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
    data.push((gameState.xpHistory && gameState.xpHistory[dateKey]) || 0);
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
  renderBills();
  renderDomHourHistory();
  renderDomDoughHistory();
  renderDomProductionChart();
  
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
if (elements.addDomHourBtn) elements.addDomHourBtn.addEventListener('click', addDomHourRecord);
if (elements.addDomDoughBtn) elements.addDomDoughBtn.addEventListener('click', addDomDoughRecord);
if (elements.domPriceInput) elements.domPriceInput.addEventListener('change', saveDomPrice);

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

// Inicialização
window.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Universo Real carregado com sucesso!');
  
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
  setTimeout(hideSplash, 2000); // Exibe por 2s ao abrir

  // Reaparecer ao voltar para a aba/app
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      updateSplashGreeting();
      if (splash) splash.classList.remove('hidden');
      setTimeout(hideSplash, 1500); // Exibe por 1.5s ao retornar
    }
  });

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
    
    // Mostra o botão de instalar
    if (elements.installAppBtn) {
      elements.installAppBtn.style.display = 'block';
      
      elements.installAppBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`Resultado da instalação: ${outcome}`);
          deferredPrompt = null;
          elements.installAppBtn.style.display = 'none';
        }
      });
    }
  });

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

  // Função para verificar elementos ausentes no DOM
  function checkMissingElements() {
    const missing = [];
    Object.keys(elements).forEach(key => {
      if (!elements[key]) missing.push(key);
    });
    if (missing.length > 0) {
      console.group('Os seguintes elementos definidos em "elements" não foram encontrados no HTML:');
      missing.forEach(key => console.warn(`- Chave: ${key} (Verifique o ID no HTML)`));
      console.groupEnd();
      showToast(`⚠️ Debug: ${missing.length} elementos não encontrados (F12)`, 5000);
    }
  }
  
  // Sistema de Abas (Inicialização segura)
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
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
  showToast('🎉 App instalado com sucesso!');
});

// Auto-save a cada 2 minutos
setInterval(() => {
  if (isLoggedIn && gameState) {
    saveGame(true);
  }
}, 120000);

// Timer do Relacionamento (1 segundo)
setInterval(updateRelationshipTimer, 1000);

// Registrar Service Worker (PWA)
if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.protocol === 'http:')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registrado!', reg))
      .catch(err => console.log('Falha no Service Worker:', err));
  });
}
