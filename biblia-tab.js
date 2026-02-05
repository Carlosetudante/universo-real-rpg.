// biblia-tab.js
// Exporta initBibleTab() que injeta a aba Bíblia e registra handlers.
// Observação: usa globals existentes (BIBLE_BOOKS, BibleAssistant, OracleMemory, gameState, etc).
export async function initBibleTab() {
  (function(){
    let biblePdfDoc = null;
    let biblePdfPage = 1;
    let biblePdfRendering = false;
    let biblePdfPageCache = new Map();
    let biblePdfSearchToken = 0;
    let bibleSemanticEnabled = false;
    let bibleEmbedder = null;
    let bibleEmbedderPromise = null;

    const normalizeText = (str) => String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const extractSearchTerms = (query) => {
      const stop = new Set(['de','da','do','dos','das','para','por','com','sem','uma','um','uns','umas','que','qual','quais','como','porque','por que','sobre','na','no','nas','nos','a','o','os','as','em','e','ou','se','eu','voce','você','meu','minha','meus','minhas','sua','seu','suas','seus']);
      const raw = normalizeText(query).replace(/[^a-z0-9:\s]/g, ' ').split(/\s+/).filter(Boolean);
      const terms = raw.filter(w => w.length >= 4 && !stop.has(w));
      return terms.slice(0, 3);
    };

    const ensurePdf = async () => {
      if (biblePdfDoc) return biblePdfDoc;
      const statusEl = document.getElementById('biblePdfStatus');
      try {
        const pdfjsLib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
        if (!pdfjsLib) throw new Error('PDF.js não carregado');
        if (window.location.protocol === 'file:') {
          pdfjsLib.disableWorker = true;
        }
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        }
        if (statusEl) statusEl.textContent = 'Carregando Bíblia...';
        let loadingTask = pdfjsLib.getDocument('biblia_de_estudo_de_genebra.pdf');
        try {
          biblePdfDoc = await loadingTask.promise;
        } catch (err) {
          pdfjsLib.disableWorker = true;
          loadingTask = pdfjsLib.getDocument('biblia_de_estudo_de_genebra.pdf');
          biblePdfDoc = await loadingTask.promise;
        }
        if (statusEl) statusEl.textContent = `Bíblia carregada (${biblePdfDoc.numPages} páginas).`;
        return biblePdfDoc;
      } catch (err) {
        if (statusEl) statusEl.textContent = 'Não foi possível carregar o PDF da Bíblia.';
        throw err;
      }
    };

    const loadEmbedder = async () => {
      if (bibleEmbedder) return bibleEmbedder;
      if (bibleEmbedderPromise) return bibleEmbedderPromise;
      const t = window.transformers;
      if (!t || !t.pipeline) {
        throw new Error('Transformers.js não carregado');
      }
      if (t.env) {
        t.env.allowRemoteModels = true;
        t.env.useBrowserCache = true;
        t.env.allowLocalModels = false;
      }
      const statusEl = document.getElementById('biblePdfStatus');
      if (statusEl) statusEl.textContent = 'Carregando IA de busca inteligente...';
      if (window.location.protocol === 'file:') {
        if (statusEl) statusEl.textContent = 'Para busca inteligente, abra o site via servidor local (não file://).';
      }
      bibleEmbedderPromise = t.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { quantized: true });
      bibleEmbedder = await bibleEmbedderPromise;
      if (statusEl) statusEl.textContent = 'Busca inteligente ativada.';
      return bibleEmbedder;
    };

    const embedText = async (text) => {
      const model = await loadEmbedder();
      const output = await model(text, { pooling: 'mean', normalize: true });
      return Array.from(output.data || []);
    };

    const cosineSimilarity = (a, b) => {
      if (!a || !b || a.length !== b.length) return 0;
      let sum = 0;
      for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
      return sum;
    };

    const getPageText = async (pageNum) => {
      if (biblePdfPageCache.has(pageNum)) return biblePdfPageCache.get(pageNum);
      const pdf = await ensurePdf();
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const text = content.items.map(i => i.str).join(' ');
      const normalized = normalizeText(text);
      const result = { raw: text, normalized };
      biblePdfPageCache.set(pageNum, result);
      return result;
    };

    const renderPdfPage = async (pageNum) => {
      if (biblePdfRendering) return;
      biblePdfRendering = true;
      const pdf = await ensurePdf();
      pageNum = Math.max(1, Math.min(pageNum, pdf.numPages));
      biblePdfPage = pageNum;

      const canvas = document.getElementById('biblePdfCanvas');
      const label = document.getElementById('biblePdfPageLabel');
      const container = document.getElementById('biblePdfCanvasWrap');
      if (!canvas || !container) {
        biblePdfRendering = false;
        return;
      }

      const page = await pdf.getPage(pageNum);
      const containerWidth = container.clientWidth || 320;
      const viewport = page.getViewport({ scale: 1 });
      const scale = Math.min(2, Math.max(1, (containerWidth - 8) / viewport.width));
      const scaledViewport = page.getViewport({ scale });
      const ctx = canvas.getContext('2d');
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
      if (label) label.textContent = `Página ${pageNum} / ${pdf.numPages}`;
      biblePdfRendering = false;
    };

    const searchPdf = async (query) => {
      const statusEl = document.getElementById('biblePdfStatus');
      const resultsEl = document.getElementById('biblePdfResults');
      const token = ++biblePdfSearchToken;
      if (resultsEl) resultsEl.innerHTML = '';
      if (statusEl) statusEl.textContent = 'Buscando no PDF...';

      const pdf = await ensurePdf();
      const terms = [];
      const normalizedQuery = normalizeText(query);
      if (normalizedQuery.length >= 4) terms.push(normalizedQuery);
      terms.push(...extractSearchTerms(query));

      const matches = [];
      const maxScanPages = Math.min(pdf.numPages, 420);
      for (let i = 1; i <= maxScanPages; i++) {
        if (token !== biblePdfSearchToken) return;
        const pageText = await getPageText(i);
        const hit = terms.find(t => t && pageText.normalized.includes(t));
        if (hit) {
          matches.push({ page: i, term: hit, text: pageText.raw });
          if (matches.length >= 12) break;
        }
        if (statusEl && i % 10 === 0) statusEl.textContent = `Buscando no PDF... (${i}/${maxScanPages})`;
      }

      if (!matches.length) {
        if (statusEl) statusEl.textContent = 'Nenhum trecho encontrado no PDF.';
        return;
      }

      let finalMatches = matches;
      if (bibleSemanticEnabled) {
        try {
          if (statusEl) statusEl.textContent = 'Reordenando com busca inteligente...';
          const queryEmb = await embedText(query);
          const scored = [];
          for (const m of matches) {
            const snippet = m.text.slice(0, 600);
            const emb = await embedText(snippet);
            const score = cosineSimilarity(queryEmb, emb);
            scored.push({ ...m, score });
          }
          scored.sort((a, b) => b.score - a.score);
          finalMatches = scored.slice(0, 5);
        } catch (e) {
          if (statusEl) statusEl.textContent = 'Busca inteligente indisponível. Mostrando resultados normais.';
        }
      }

      if (statusEl) statusEl.textContent = `Encontrado ${finalMatches.length} resultado(s).`;
      if (resultsEl) {
        const highlightTerms = terms.filter(Boolean).slice(0, 3);
        const highlightSnippet = (text) => {
          let snippet = text.slice(0, 220).replace(/\s+/g, ' ').trim();
          highlightTerms.forEach((t, idx) => {
            if (!t) return;
            const re = new RegExp(`(${t.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')})`, 'ig');
            snippet = snippet.replace(re, `<mark class="hl-${idx + 1}">$1</mark>`);
          });
          return snippet;
        };
        resultsEl.innerHTML = finalMatches.map(m => {
          const safe = highlightSnippet(m.text);
          const scoreText = (typeof m.score === 'number') ? `<div class="bible-result-score">Relevância: ${(m.score * 100).toFixed(1)}%</div>` : '';
          return `
            <div class="bible-result">
              <div class="bible-result-title">Página ${m.page}</div>
              <div class="bible-result-snippet">${safe}...</div>
              ${scoreText}
              <button class="ghost bible-open-page-btn" data-page="${m.page}">Abrir página</button>
            </div>
          `;
        }).join('');
        resultsEl.querySelectorAll('.bible-open-page-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const page = parseInt(btn.dataset.page, 10);
            const reader = document.getElementById('biblePdfReader');
            if (reader) reader.classList.remove('hidden');
            renderPdfPage(page);
          });
        });
      }
    };

    const activateBibleTab = () => {
      document.querySelectorAll('.nav-item, .mobile-drawer-item, .mobile-nav-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.querySelectorAll('[data-tab="bible"]').forEach(b => b.classList.add('active'));
      const content = document.getElementById('tab-bible');
      if (content) content.classList.add('active');
      if (typeof closeDrawer === 'function') closeDrawer();
    };

    // Injeção de botões e conteúdo (desktop/mobile) e interface da aba (mesma lógica original)
    const desktopNav = document.querySelector('.cinema .app-nav');
    if (desktopNav && !desktopNav.querySelector('[data-tab="bible"]')) {
      const btn = document.createElement('button');
      btn.className = 'nav-item';
      btn.dataset.tab = 'bible';
      btn.innerHTML = '<span class="nav-icon">✝️</span><span>Bíblia</span>';
      btn.addEventListener('click', activateBibleTab);
      desktopNav.appendChild(btn);
    }

    const mobileDrawerItemContainer = document.querySelector('.mobile-drawer-item')?.parentElement;
    if (mobileDrawerItemContainer && !mobileDrawerItemContainer.querySelector('[data-tab="bible"]')) {
      const btn = document.createElement('button');
      btn.className = 'mobile-drawer-item';
      btn.dataset.tab = 'bible';
      btn.innerHTML = '<span class="nav-icon" style="font-size: 1.5rem;">✝️</span><span>Bíblia</span>';
      btn.addEventListener('click', activateBibleTab);
      mobileDrawerItemContainer.appendChild(btn);
    }

    const main = document.getElementById('gameScreen');
    if (main && !document.getElementById('tab-bible')) {
      const content = document.createElement('div');
      content.id = 'tab-bible';
      content.className = 'tab-content';
      content.style.cssText = 'padding: 10px;';

      const booksHtml = (typeof BIBLE_BOOKS !== 'undefined' ? BIBLE_BOOKS : []).map(b => `
        <button class="bible-book-card" data-book="${b.name}" data-testament="${b.testament}">
          <div class="bible-book-name">${b.name}</div>
          <div class="bible-book-meta">${b.group} • ${b.order}º livro</div>
        </button>
      `).join('');

      content.innerHTML = `
        <div class="bible-interface">
          <div class="bible-header">
            <div class="bible-header-top">
              <div class="bible-icon">✝️</div>
              <div>
                <h2 class="bible-title">Assistente Bíblico</h2>
                <p class="bible-subtitle">"Lâmpada para os meus pés é a tua palavra"</p>
              </div>
            </div>
            <div class="bible-quick-actions">
              <button class="btn ghost bible-tag" onclick="askBible('quem foi jesus')">✝️ Jesus</button>
              <button class="btn ghost bible-tag" onclick="askBible('o que você sabe?')">🧠 O que você sabe?</button>
              <button class="btn ghost bible-tag" onclick="askBible('plano de leitura')">📅 Plano de Leitura</button>
              <button class="btn ghost bible-tag" id="bibleOpenPdfBtn">📖 Abrir Bíblia</button>
              <button class="btn ghost bible-tag" id="bibleSemanticBtn">✨ Busca inteligente</button>
            </div>
          </div>

          <div id="bibleChatArea" class="bible-chat">
            <div class="bible-message bot">
              Olá, a Paz! Sou seu assistente bíblico. 🙏<br>Posso explicar sobre livros (ex: "Gênesis"), temas (ex: "ansiedade") ou dar um versículo do dia.
            </div>
          </div>

          <div class="bible-pdf-tools">
            <div id="biblePdfStatus" class="bible-pdf-status">Bíblia pronta para busca.</div>
            <div id="biblePdfResults" class="bible-pdf-results"></div>
          </div>

          <div class="bible-books">
            <div class="bible-books-title">Livros da Bíblia</div>
            <div class="bible-books-filters">
              <button class="ghost bible-filter-btn active" data-filter="all">Todos</button>
              <button class="ghost bible-filter-btn" data-filter="AT">Antigo Testamento</button>
              <button class="ghost bible-filter-btn" data-filter="NT">Novo Testamento</button>
            </div>
            <div class="bible-books-grid">
              ${booksHtml}
            </div>
          </div>

          <div id="biblePdfReader" class="bible-pdf-reader hidden">
            <div class="bible-pdf-reader-header">
              <div id="biblePdfPageLabel" class="bible-pdf-page">Página 1</div>
              <div class="bible-pdf-controls">
                <button class="ghost" id="biblePdfPrevBtn">◀</button>
                <button class="ghost" id="biblePdfNextBtn">▶</button>
                <button class="ghost" id="biblePdfCloseBtn">Fechar</button>
              </div>
            </div>
            <div class="bible-pdf-search">
              <input type="text" id="biblePdfSearchInput" class="bible-pdf-search-input" placeholder="Buscar na Bíblia...">
              <button class="ghost" id="biblePdfSearchBtn">Buscar</button>
            </div>
            <div id="biblePdfCanvasWrap" class="bible-pdf-canvas-wrap">
              <canvas id="biblePdfCanvas"></canvas>
            </div>
          </div>

          <div class="bible-input-area">
            <input type="text" id="bibleInput" class="bible-input" placeholder="Ex: Gênesis, Salmos...">
            <button id="bibleSendBtn" class="bible-send-btn" aria-label="Enviar">➤</button>
          </div>
        </div>
      `;

      main.appendChild(content);

      const input = document.getElementById('bibleInput');
      const btn = document.getElementById('bibleSendBtn');
      const chat = document.getElementById('bibleChatArea');
      const openPdfBtn = document.getElementById('bibleOpenPdfBtn');
      const semanticBtn = document.getElementById('bibleSemanticBtn');
      const pdfPrevBtn = document.getElementById('biblePdfPrevBtn');
      const pdfNextBtn = document.getElementById('biblePdfNextBtn');
      const pdfCloseBtn = document.getElementById('biblePdfCloseBtn');
      const pdfSearchInput = document.getElementById('biblePdfSearchInput');
      const pdfSearchBtn = document.getElementById('biblePdfSearchBtn');
      const bookCards = document.querySelectorAll('.bible-book-card');
      const filterButtons = document.querySelectorAll('.bible-filter-btn');

      const sendMessage = async () => {
        const text = input.value.trim();
        if (!text) return;

        const userDiv = document.createElement('div');
        userDiv.className = 'bible-message user';
        userDiv.textContent = text;
        chat.appendChild(userDiv);
        chat.scrollTop = chat.scrollHeight;

        const thinkingDiv = document.createElement('div');
        thinkingDiv.className = 'bible-message bot thinking';
        thinkingDiv.textContent = 'Buscando na palavra...';
        chat.appendChild(thinkingDiv);
        chat.scrollTop = chat.scrollHeight;

        try {
          if (typeof saveOracleChatMessage === 'function') {
            saveOracleChatMessage('user', text).catch(e => console.warn('Erro ao salvar mensagem do usuário:', e));
          }
        } catch (e) {
          console.warn('saveOracleChatMessage não disponível', e);
        }

        try { input.value = ''; } catch(e) { /* ignore */ }

        let response = '';
        try {
          if (typeof BibleAssistant !== 'undefined' && BibleAssistant && typeof BibleAssistant.reply === 'function') {
            response = await BibleAssistant.reply(text);
          } else {
            response = 'Sou seu assistente bíblico. Ainda estou carregando recursos mais avançados.';
          }
        } catch (err) {
          response = 'Desculpe, ocorreu um erro ao buscar a resposta.';
          console.warn('BibleAssistant.reply falhou:', err);
        }

        thinkingDiv.remove();

        const botDiv = document.createElement('div');
        botDiv.className = 'bible-message bot';
        let finalResponse = response;
        try {
          if (String(finalResponse).includes('Sou seu assistente bíblico') && text) {
            finalResponse = (typeof BibleAssistant !== 'undefined' && BibleAssistant.formatNotFound) ?
              BibleAssistant.formatNotFound(`Parece que não entendi. Você quis dizer: "${BibleAssistant.escapeHtml(text)}"?`) :
              `Parece que não entendi. Você quis dizer: "${text}"?`;
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

        try {
          await searchPdf(text);
        } catch (e) {
          const statusEl = document.getElementById('biblePdfStatus');
          if (statusEl) statusEl.textContent = 'Não foi possível buscar no PDF.';
        }
      };

      if (btn) btn.addEventListener('click', sendMessage);
      if (input) input.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage(); });

      if (openPdfBtn) {
        openPdfBtn.addEventListener('click', async () => {
          const reader = document.getElementById('biblePdfReader');
          if (reader) reader.classList.remove('hidden');
          await renderPdfPage(biblePdfPage || 1);
        });
      }
      if (semanticBtn) {
        semanticBtn.addEventListener('click', async () => {
          try {
            await loadEmbedder();
            bibleSemanticEnabled = true;
            semanticBtn.classList.add('active');
            semanticBtn.textContent = '✨ Inteligente ativo';
          } catch (e) {
            const statusEl = document.getElementById('biblePdfStatus');
            if (statusEl) statusEl.textContent = 'Falha ao ativar busca inteligente. Verifique se abriu via localhost.';
          }
        });
      }

      const runPdfSearch = async () => {
        const q = (pdfSearchInput && pdfSearchInput.value || '').trim();
        if (!q) return;
        const reader = document.getElementById('biblePdfReader');
        if (reader) reader.classList.remove('hidden');
        await searchPdf(q);
      };
      if (pdfSearchBtn) pdfSearchBtn.addEventListener('click', runPdfSearch);
      if (pdfSearchInput) {
        pdfSearchInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') runPdfSearch();
        });
      }

      if (bookCards.length) {
        bookCards.forEach(card => {
          card.addEventListener('click', () => {
            const book = card.getAttribute('data-book');
            if (input && book) {
              input.value = book;
              btn.click();
            }
          });
        });
      }

      if (filterButtons.length) {
        const setFilter = (filter) => {
          bookCards.forEach(card => {
            const t = card.getAttribute('data-testament');
            const show = filter === 'all' || t === filter;
            card.style.display = show ? '' : 'none';
          });
        };
        filterButtons.forEach(btnEl => {
          btnEl.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btnEl.classList.add('active');
            setFilter(btnEl.dataset.filter);
          });
        });
        setFilter('all');
      }
      if (pdfPrevBtn) pdfPrevBtn.addEventListener('click', () => renderPdfPage(biblePdfPage - 1));
      if (pdfNextBtn) pdfNextBtn.addEventListener('click', () => renderPdfPage(biblePdfPage + 1));
      if (pdfCloseBtn) pdfCloseBtn.addEventListener('click', () => {
        const reader = document.getElementById('biblePdfReader');
        if (reader) reader.classList.add('hidden');
      });

      window.askBible = (query) => {
        const input = document.getElementById('bibleInput');
        if(input) {
          input.value = query;
          document.getElementById('bibleSendBtn').click();
        }
      };

      try {
        window.__BIBLE_READY__ = true;
        document.dispatchEvent(new CustomEvent('bible:ready'));
      } catch (e) {
        console.warn('Não foi possível setar __BIBLE_READY__', e);
      }
    }
  })();
}
