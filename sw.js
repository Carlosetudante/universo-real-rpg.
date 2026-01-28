const CACHE_NAME = 'universo-real-v29';

const urlsToCache = [
  './index.html',
  './financeiro.html',
  './carga-horaria.html',
  './style.css',
  './app.js',
  './supabase.js',
  './workTimer.js',
  './logo.svg',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
  'https://unpkg.com/@supabase/supabase-js@2'
];

// Instalação - faz cache dos arquivos
self.addEventListener('install', event => {
  console.log('🔧 SW: Instalando versão', CACHE_NAME);
  
  // IMPORTANTE: Força ativação imediata (não espera abas fecharem)
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 SW: Fazendo cache dos arquivos');
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativação - limpa caches antigos
self.addEventListener('activate', event => {
  console.log('✅ SW: Ativando versão', CACHE_NAME);
  
  // IMPORTANTE: Toma controle imediato de todas as páginas
  event.waitUntil(
    Promise.all([
      // Limpa caches antigos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ SW: Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Toma controle de todas as abas imediatamente
      self.clients.claim()
    ])
  );
});

// Fetch - NETWORK FIRST (sempre tenta buscar da rede primeiro)
self.addEventListener('fetch', event => {
  // Ignora requests não-GET
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    // Tenta buscar da rede primeiro
    fetch(event.request)
      .then(response => {
        // Se conseguiu, atualiza o cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Se falhou (offline), usa o cache
        return caches.match(event.request);
      })
  );
});

// Listener para mensagens (forçar atualização)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⚡ SW: Forçando atualização imediata');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('📡 Service Worker carregado:', CACHE_NAME);