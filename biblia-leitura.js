(() => {
  const showError = (msg) => {
    const box = document.getElementById('bibleErrorBox');
    if (!box) return;
    box.textContent = msg;
    box.classList.remove('hidden');
  };

  window.addEventListener('error', (e) => {
    showError(`Erro: ${e.message || 'desconhecido'}`);
  });
  window.addEventListener('unhandledrejection', (e) => {
    showError(`Erro: ${e.reason?.message || e.reason || 'desconhecido'}`);
  });
  let biblePdfDoc = null;
  let biblePdfPage = 1;
  let biblePdfRendering = false;
  let biblePdfPageCache = new Map();
  let biblePdfSearchToken = 0;

  const BIBLE_BOOKS = [
    { name: 'Gênesis', order: 1, group: 'Pentateuco', testament: 'AT' },
    { name: 'Êxodo', order: 2, group: 'Pentateuco', testament: 'AT' },
    { name: 'Levítico', order: 3, group: 'Pentateuco', testament: 'AT' },
    { name: 'Números', order: 4, group: 'Pentateuco', testament: 'AT' },
    { name: 'Deuteronômio', order: 5, group: 'Pentateuco', testament: 'AT' },
    { name: 'Josué', order: 6, group: 'Históricos', testament: 'AT' },
    { name: 'Juízes', order: 7, group: 'Históricos', testament: 'AT' },
    { name: 'Rute', order: 8, group: 'Históricos', testament: 'AT' },
    { name: '1 Samuel', order: 9, group: 'Históricos', testament: 'AT' },
    { name: '2 Samuel', order: 10, group: 'Históricos', testament: 'AT' },
    { name: '1 Reis', order: 11, group: 'Históricos', testament: 'AT' },
    { name: '2 Reis', order: 12, group: 'Históricos', testament: 'AT' },
    { name: '1 Crônicas', order: 13, group: 'Históricos', testament: 'AT' },
    { name: '2 Crônicas', order: 14, group: 'Históricos', testament: 'AT' },
    { name: 'Esdras', order: 15, group: 'Históricos', testament: 'AT' },
    { name: 'Neemias', order: 16, group: 'Históricos', testament: 'AT' },
    { name: 'Ester', order: 17, group: 'Históricos', testament: 'AT' },
    { name: 'Jó', order: 18, group: 'Poéticos', testament: 'AT' },
    { name: 'Salmos', order: 19, group: 'Poéticos', testament: 'AT' },
    { name: 'Provérbios', order: 20, group: 'Poéticos', testament: 'AT' },
    { name: 'Eclesiastes', order: 21, group: 'Poéticos', testament: 'AT' },
    { name: 'Cantares', order: 22, group: 'Poéticos', testament: 'AT' },
    { name: 'Isaías', order: 23, group: 'Profetas Maiores', testament: 'AT' },
    { name: 'Jeremias', order: 24, group: 'Profetas Maiores', testament: 'AT' },
    { name: 'Lamentações', order: 25, group: 'Profetas Maiores', testament: 'AT' },
    { name: 'Ezequiel', order: 26, group: 'Profetas Maiores', testament: 'AT' },
    { name: 'Daniel', order: 27, group: 'Profetas Maiores', testament: 'AT' },
    { name: 'Oséias', order: 28, group: 'Profetas Menores', testament: 'AT' },
    { name: 'Joel', order: 29, group: 'Profetas Menores', testament: 'AT' },
    { name: 'Amós', order: 30, group: 'Profetas Menores', testament: 'AT' },
    { name: 'Obadias', order: 31, group: 'Profetas Menores', testament: 'AT' },
    { name: 'Jonas', order: 32, group: 'Profetas Menores', testament: 'AT' },
    { name: 'Miquéias', order: 33, group: 'Profetas Menores', testament: 'AT' },
    { name: 'Naum', order: 34, group: 'Profetas Menores', testament: 'AT' },
    { name: 'Habacuque', order: 35, group: 'Profetas Menores', testament: 'AT' },
    { name: 'Sofonias', order: 36, group: 'Profetas Menores', testament: 'AT' },
    { name: 'Ageu', order: 37, group: 'Profetas Menores', testament: 'AT' },
    { name: 'Zacarias', order: 38, group: 'Profetas Menores', testament: 'AT' },
    { name: 'Malaquias', order: 39, group: 'Profetas Menores', testament: 'AT' },
    { name: 'Mateus', order: 40, group: 'Evangelhos', testament: 'NT' },
    { name: 'Marcos', order: 41, group: 'Evangelhos', testament: 'NT' },
    { name: 'Lucas', order: 42, group: 'Evangelhos', testament: 'NT' },
    { name: 'João', order: 43, group: 'Evangelhos', testament: 'NT' },
    { name: 'Atos', order: 44, group: 'História da Igreja', testament: 'NT' },
    { name: 'Romanos', order: 45, group: 'Cartas Paulinas', testament: 'NT' },
    { name: '1 Coríntios', order: 46, group: 'Cartas Paulinas', testament: 'NT' },
    { name: '2 Coríntios', order: 47, group: 'Cartas Paulinas', testament: 'NT' },
    { name: 'Gálatas', order: 48, group: 'Cartas Paulinas', testament: 'NT' },
    { name: 'Efésios', order: 49, group: 'Cartas Paulinas', testament: 'NT' },
    { name: 'Filipenses', order: 50, group: 'Cartas Paulinas', testament: 'NT' },
    { name: 'Colossenses', order: 51, group: 'Cartas Paulinas', testament: 'NT' },
    { name: '1 Tessalonicenses', order: 52, group: 'Cartas Paulinas', testament: 'NT' },
    { name: '2 Tessalonicenses', order: 53, group: 'Cartas Paulinas', testament: 'NT' },
    { name: '1 Timóteo', order: 54, group: 'Cartas Paulinas', testament: 'NT' },
    { name: '2 Timóteo', order: 55, group: 'Cartas Paulinas', testament: 'NT' },
    { name: 'Tito', order: 56, group: 'Cartas Paulinas', testament: 'NT' },
    { name: 'Filemom', order: 57, group: 'Cartas Paulinas', testament: 'NT' },
    { name: 'Hebreus', order: 58, group: 'Cartas Gerais', testament: 'NT' },
    { name: 'Tiago', order: 59, group: 'Cartas Gerais', testament: 'NT' },
    { name: '1 Pedro', order: 60, group: 'Cartas Gerais', testament: 'NT' },
    { name: '2 Pedro', order: 61, group: 'Cartas Gerais', testament: 'NT' },
    { name: '1 João', order: 62, group: 'Cartas Gerais', testament: 'NT' },
    { name: '2 João', order: 63, group: 'Cartas Gerais', testament: 'NT' },
    { name: '3 João', order: 64, group: 'Cartas Gerais', testament: 'NT' },
    { name: 'Judas', order: 65, group: 'Cartas Gerais', testament: 'NT' },
    { name: 'Apocalipse', order: 66, group: 'Profético', testament: 'NT' }
  ];

  const normalizeText = (str) => String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const BOOK_ALIASES = {
    'gn': 'Gênesis', 'gen': 'Gênesis',
    'ex': 'Êxodo', 'exo': 'Êxodo',
    'lv': 'Levítico', 'lev': 'Levítico',
    'nm': 'Números', 'num': 'Números',
    'dt': 'Deuteronômio', 'deut': 'Deuteronômio',
    'js': 'Josué', 'jz': 'Juízes', 'rt': 'Rute',
    '1sm': '1 Samuel', '2sm': '2 Samuel',
    '1rs': '1 Reis', '2rs': '2 Reis',
    '1cr': '1 Crônicas', '2cr': '2 Crônicas',
    'ed': 'Esdras', 'ne': 'Neemias', 'et': 'Ester',
    'jo': 'Jó', 'sl': 'Salmos', 'pv': 'Provérbios',
    'ec': 'Eclesiastes', 'ct': 'Cantares',
    'is': 'Isaías', 'jr': 'Jeremias', 'lm': 'Lamentações',
    'ez': 'Ezequiel', 'dn': 'Daniel',
    'os': 'Oséias', 'jl': 'Joel', 'am': 'Amós', 'ob': 'Obadias',
    'jn': 'Jonas', 'mq': 'Miquéias', 'na': 'Naum',
    'hc': 'Habacuque', 'sf': 'Sofonias', 'ag': 'Ageu',
    'zc': 'Zacarias', 'ml': 'Malaquias',
    'mt': 'Mateus', 'mc': 'Marcos', 'lc': 'Lucas', 'joao': 'João', 'jo': 'João',
    'at': 'Atos', 'rm': 'Romanos',
    '1co': '1 Coríntios', '2co': '2 Coríntios',
    'gl': 'Gálatas', 'ef': 'Efésios', 'fp': 'Filipenses', 'cl': 'Colossenses',
    '1ts': '1 Tessalonicenses', '2ts': '2 Tessalonicenses',
    '1tm': '1 Timóteo', '2tm': '2 Timóteo',
    'tt': 'Tito', 'fm': 'Filemom',
    'hb': 'Hebreus', 'tg': 'Tiago',
    '1pe': '1 Pedro', '2pe': '2 Pedro',
    '1jo': '1 João', '2jo': '2 João', '3jo': '3 João',
    'jd': 'Judas', 'ap': 'Apocalipse'
  };

  const findBookByName = (name) => {
    const n = normalizeText(name).replace(/\s+/g, '');
    const alias = BOOK_ALIASES[n];
    if (alias) return BIBLE_BOOKS.find(b => b.name === alias);
    return BIBLE_BOOKS.find(b => normalizeText(b.name).replace(/\s+/g, '') === n);
  };

  const parseVerseQuery = (input) => {
    const raw = String(input || '').trim();
    const match = raw.match(/^([\d]?\s?[A-Za-zÀ-ÿ\.]+\s?[A-Za-zÀ-ÿ\.]*)\s+(\d+)\s*[:\-]?\s*(\d+)?/i);
    if (!match) return null;
    const bookRaw = match[1].trim().replace(/\s+/g, ' ');
    const chapter = match[2];
    const verse = match[3] || '';
    const book = findBookByName(bookRaw);
    if (!book) return null;
    const label = `${book.name} ${chapter}${verse ? ':' + verse : ''}`;
    const terms = [book.name, `${chapter}${verse ? ':' + verse : ''}`, `${book.name} ${chapter}`];
    return { label, terms };
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
      showError('Não foi possível carregar o PDF. Verifique se o arquivo está no servidor.');
      throw err;
    }
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

  const searchPdf = async (query, extraTerms = []) => {
    const statusEl = document.getElementById('biblePdfStatus');
    const resultsEl = document.getElementById('biblePdfResults');
    const token = ++biblePdfSearchToken;
    if (resultsEl) resultsEl.innerHTML = '';
    if (statusEl) statusEl.textContent = 'Buscando no PDF...';

    const pdf = await ensurePdf();
    const terms = [];
    const normalizedQuery = normalizeText(query);
    if (normalizedQuery.length >= 4) terms.push(normalizedQuery);
    extraTerms.forEach(t => t && terms.push(normalizeText(t)));

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

    if (statusEl) statusEl.textContent = `Encontrado ${matches.length} resultado(s).`;
    if (resultsEl) {
      resultsEl.innerHTML = matches.map(m => {
        const safe = m.text.slice(0, 200).replace(/\s+/g, ' ').trim();
        return `
          <div class="bible-result">
            <div class="bible-result-title">Página ${m.page}</div>
            <div class="bible-result-snippet">${safe}...</div>
            <button class="ghost bible-open-page-btn" data-page="${m.page}">Abrir página</button>
          </div>
        `;
      }).join('');
      resultsEl.querySelectorAll('.bible-open-page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const page = parseInt(btn.dataset.page, 10);
          renderPdfPage(page);
        });
      });
    }
  };

  const renderBooks = () => {
    const grid = document.getElementById('bibleBooksGrid');
    if (!grid) return;
    grid.innerHTML = BIBLE_BOOKS.map(b => `
      <button class="bible-book-card" data-book="${b.name}" data-testament="${b.testament}">
        <div class="bible-book-name">${b.name}</div>
        <div class="bible-book-meta">${b.group} • ${b.order}º livro</div>
      </button>
    `).join('');
  };

  const wireBooks = () => {
    const searchInput = document.getElementById('biblePdfSearchInput');
    const selectedLabel = document.getElementById('bibleBookSelected');
    const chapterInput = document.getElementById('bibleBookChapter');
    const verseInput = document.getElementById('bibleBookVerse');
    const openBtn = document.getElementById('bibleBookOpenBtn');
    let selectedBook = '';

    const openSelected = () => {
      if (!selectedBook) return;
      const chapter = (chapterInput && chapterInput.value) ? chapterInput.value : '1';
      const verse = (verseInput && verseInput.value) ? verseInput.value : '1';
      const query = `${selectedBook} ${chapter}:${verse}`;
      if (searchInput) searchInput.value = query;
      searchPdf(query, [selectedBook, `${chapter}:${verse}`, `${selectedBook} ${chapter}`]);
    };

    document.querySelectorAll('.bible-book-card').forEach(card => {
      card.addEventListener('click', () => {
        const book = card.getAttribute('data-book');
        if (book) {
          selectedBook = book;
          if (selectedLabel) selectedLabel.textContent = `${book}`;
          if (chapterInput && !chapterInput.value) chapterInput.value = '1';
          if (verseInput && !verseInput.value) verseInput.value = '1';
        }
      });
    });

    if (openBtn) openBtn.addEventListener('click', openSelected);
    if (verseInput) verseInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') openSelected();
    });
    if (chapterInput) chapterInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') openSelected();
    });
  };

  const wireFilters = () => {
    const bookCards = () => document.querySelectorAll('.bible-book-card');
    const filterButtons = document.querySelectorAll('.bible-filter-btn');
    if (!filterButtons.length) return;
    const setFilter = (filter) => {
      bookCards().forEach(card => {
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
  };

  const init = () => {
    const searchInput = document.getElementById('biblePdfSearchInput');
    const searchBtn = document.getElementById('biblePdfSearchBtn');
    const pdfPrevBtn = document.getElementById('biblePdfPrevBtn');
    const pdfNextBtn = document.getElementById('biblePdfNextBtn');

    renderBooks();
    wireBooks();
    wireFilters();

    if (searchBtn) searchBtn.addEventListener('click', () => {
      const q = (searchInput && searchInput.value || '').trim();
      if (!q) return;
      const verse = parseVerseQuery(q);
      if (verse) {
        if (searchInput) searchInput.value = verse.label;
        searchPdf(verse.label, verse.terms);
      } else {
        searchPdf(q);
      }
    });
    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const q = (searchInput.value || '').trim();
          if (!q) return;
          const verse = parseVerseQuery(q);
          if (verse) {
            if (searchInput) searchInput.value = verse.label;
            searchPdf(verse.label, verse.terms);
          } else {
            searchPdf(q);
          }
        }
      });
    }

    if (pdfPrevBtn) pdfPrevBtn.addEventListener('click', () => renderPdfPage(biblePdfPage - 1));
    if (pdfNextBtn) pdfNextBtn.addEventListener('click', () => renderPdfPage(biblePdfPage + 1));

    renderPdfPage(1);
  };

  document.addEventListener('DOMContentLoaded', init);
})();
