const CACHE_NAME = 'universo-real-v50';

const urlsToCache = [
  './index.html',
  './financeiro.html',
  './carga-horaria.html',
  './style.css',
  './app.js',
  './biblia.js',
  './biblia-anotacoes.html',
  './biblia-anotacoes.js',
  './supabase.js',
  './workTimer.js',
  './logo.svg',
  './offline.html',
  './manifest.json',
  './biblia_de_estudo_de_genebra.pdf',
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
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js',
  'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1/dist/transformers.min.js',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js'
];

// Instalação - faz cache dos arquivos (resiliente: ignora recursos que falhem)
self.addEventListener('install', event => {
  console.log('🔧 SW: Instalando versão', CACHE_NAME);
  self.skipWaiting();

  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    console.log('📦 SW: Fazendo cache dos arquivos locais');
    try {
      // Tenta adicionar todos os arquivos locais de uma vez; falhas aqui são capturadas
      await cache.addAll(urlsToCache.map(u => new Request(u, {cache: 'reload'})));
    } catch (e) {
      console.warn('SW: Falha ao cachear alguns recursos locais, tentando individualmente', e);
      for (const u of urlsToCache) {
        try {
          const resp = await fetch(u, {cache: 'reload'});
          if (resp && (resp.ok || resp.type === 'opaque')) await cache.put(u, resp.clone());
        } catch (err) {
          // ignora falhas individuais
        }
      }
    }

    // Recursos externos: tenta buscar com no-cors quando apropriado e adiciona ao cache de forma resiliente
    console.log('📦 SW: Fazendo cache dos recursos externos (CDNs)');
    for (const u of externalResources) {
      try {
        const resp = await fetch(u, {mode: 'no-cors'}).catch(() => null);
        if (resp) {
          try { await cache.put(u, resp.clone()); } catch (e) { /* ignora */ }
        }
      } catch (e) {
        // ignora
      }
    }

    return true;
  })());
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
        const cacheMatch = await caches.match(event.request) ||
          await caches.match('./biblia-anotacoes.html') ||
          await caches.match('./index.html') ||
          await caches.match('./offline.html');
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

// Tratar cliques em notificações (ações: pause, pay)
self.addEventListener('notificationclick', event => {
  const action = event.action;
  event.notification.close();

  event.waitUntil((async () => {
    try {
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });

      if (action === 'pause') {
        // Envia mensagem para todas as janelas para pausar o cronômetro
        for (const c of allClients) {
          try { c.postMessage({ type: 'WORK_TIMER_ACTION', action: 'pause' }); } catch (e) {}
        }
        if (allClients.length === 0) {
          // Se não houver janela aberta, abre a aplicação
          await clients.openWindow('./index.html');
        }
        return;
      }

      if (action === 'pay') {
        const url = './financeiro.html';
        for (const c of allClients) {
          try { c.postMessage({ type: 'OPEN_URL', url }); } catch (e) {}
        }
        if (allClients.length === 0) {
          await clients.openWindow(url);
        }
        return;
      }

      // Sem ação específica: foca a primeira janela ou abre a raiz
      if (allClients.length > 0) {
        try { allClients[0].focus && allClients[0].focus(); } catch (e) {}
      } else {
        await clients.openWindow('./index.html');
      }
    } catch (e) {
      // silencioso
    }
  })());
});

console.log('📡 Service Worker carregado:', CACHE_NAME);
