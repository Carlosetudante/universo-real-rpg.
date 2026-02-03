const CACHE_NAME = 'universo-real-v49';

const urlsToCache = [
  './index.html',
  './financeiro.html',
  './carga-horaria.html',
  './style.css',
  './app.js',
  './supabase.js',
  './workTimer.js',
  './logo.svg',
  './offline.html',
  './manifest.json',
  './pergaminho-onboarding.json',
  './pergaminho-onboarding.md',
  './pergaminho-onboarding.txt',
  './oracle-client.js',
  './frontend/oracle-client.js'
];

// Recursos externos recomendados para cache inicial (CDNs)
const externalResources = [
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
  'https://unpkg.com/@supabase/supabase-js@2',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js'
];

// Instalação - faz cache dos arquivos (resiliente: ignora recursos que falhem)
self.addEventListener('install', event => {
  console.log('🔧 SW: Instalando versão', CACHE_NAME);
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      console.log('📦 SW: Fazendo cache dos arquivos (resiliente)');
      // Usa addAll com fallback para evitar falha total se algum recurso remoto falhar
      const allToCache = urlsToCache.concat(externalResources);
      const settle = await Promise.allSettled(allToCache.map(u => fetch(u).then(r => {
        if (!r.ok) throw new Error('fetch-failed');
        return cache.put(u, r.clone()).catch(() => {});
      }).catch(() => {})));
      // Não retorna erro — continuamos com o que foi cacheado
      return settle;
    })
  );
});

// Ativação - limpa caches antigos
self.addEventListener('activate', event => {
  console.log('✅ SW: Ativando versão', CACHE_NAME);

  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cn => cn !== CACHE_NAME ? caches.delete(cn) : Promise.resolve()));
      await self.clients.claim();
    })()
  );
});

// Fetch - NETWORK FIRST (sempre tenta buscar da rede primeiro)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);

  // Navegação (páginas) -> serve index.html do cache, ou offline.html
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const networkResponse = await fetch(event.request);
        // atualiza cache com a página mais recente
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, networkResponse.clone()).catch(() => {});
        return networkResponse;
      } catch (e) {
        const cacheMatch = await caches.match('./index.html') || await caches.match('./offline.html');
        return cacheMatch || Response.error();
      }
    })());
    return;
  }

  // Para requisições de API ou recursos estáticos: tenta rede, fallback para cache
  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);
      if (response && response.status === 200) {
        const rclone = response.clone();
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, rclone).catch(() => {});
      }
      return response;
    } catch (err) {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      // Como última alternativa, se for imagem, retorna um empty 1x1 svg
      if (event.request.destination === 'image') {
        return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>', { headers: { 'Content-Type': 'image/svg+xml' } });
      }
      return caches.match('./offline.html');
    }
  })());
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