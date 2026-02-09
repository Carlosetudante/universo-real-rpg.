(() => {
  const showError = (msg) => {
    const box = document.getElementById('bibleNotesError');
    if (!box) return;
    box.textContent = msg;
    box.classList.remove('hidden');
  };

  const clearError = () => {
    const box = document.getElementById('bibleNotesError');
    if (!box) return;
    box.textContent = '';
    box.classList.add('hidden');
  };

  const getSessionUser = () => {
    try {
      return localStorage.getItem('ur_session') || localStorage.getItem('ur_last_user') || 'local';
    } catch (e) {
      return 'local';
    }
  };

  const BibleNotesStore = {
    cache: [],
    loaded: false,

    _getLocalKey() {
      const user = getSessionUser();
      return `bible_notes_${user}`;
    },

    _normalize(str) {
      return String(str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    },

    _parseTags(tagsStr) {
      if (!tagsStr) return [];
      return tagsStr.split(',').map(t => t.trim()).filter(Boolean);
    },

    async load(force = false) {
      if (this.loaded && !force) return this.cache;
      try {
        const raw = localStorage.getItem(this._getLocalKey());
        this.cache = raw ? JSON.parse(raw) : [];
      } catch (e) {
        this.cache = [];
      }
      this.loaded = true;
      return this.cache;
    },

    _saveLocal() {
      try {
        localStorage.setItem(this._getLocalKey(), JSON.stringify(this.cache || []));
      } catch (e) {
        console.warn('Falha ao salvar notas localmente:', e);
        showError('Não foi possível salvar as anotações. Verifique as permissões do navegador.');
      }
    },

    async add({ reference, content, tags }) {
      const note = {
        id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        reference: reference || '',
        content: content || '',
        tags: Array.isArray(tags) ? tags : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.cache.unshift(note);
      this._saveLocal();
      return note;
    },

    async remove(id) {
      this.cache = (this.cache || []).filter(n => n.id !== id);
      this._saveLocal();
    },

    async update(id, patch) {
      const idx = this.cache.findIndex(n => n.id === id);
      if (idx === -1) return null;
      this.cache[idx] = {
        ...this.cache[idx],
        ...patch,
        updatedAt: new Date().toISOString()
      };
      this._saveLocal();
      return this.cache[idx];
    },

    async search(query) {
      const notes = await this.load();
      const q = this._normalize(query);
      const tagQuery = q.replace(/^#/, '').replace(/^tags?:/, '').trim();
      const isTagOnly = q.startsWith('#') || q.startsWith('tag:') || q.startsWith('tags:');
      if (!q) return [];
      if (!isTagOnly && q.length < 3) return [];
      const terms = q.split(/\s+/).filter(t => t.length >= 3);
      return notes.filter(n => {
        const tags = (n.tags || []).map(t => this._normalize(t));
        if (isTagOnly) {
          if (!tagQuery) return false;
          return tags.some(t => t.includes(tagQuery));
        }
        const hay = this._normalize(`${n.reference} ${n.content} ${(n.tags || []).join(' ')}`);
        return terms.some(t => hay.includes(t));
      }).slice(0, 50);
    }
  };

  const escapeHtml = (str) => String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const init = () => {
    const noteRef = document.getElementById('bibleNoteRef');
    const noteContent = document.getElementById('bibleNoteContent');
    const noteTags = document.getElementById('bibleNoteTags');
    const noteSaveBtn = document.getElementById('bibleNoteSaveBtn');
    const notesList = document.getElementById('bibleNotesList');
    const noteSearch = document.getElementById('bibleNoteSearch');
    const tagsPanel = document.getElementById('bibleTagsPanel');
    const tagsDatalist = document.getElementById('bibleTagsDatalist');

    const renderTagsPanel = (notes) => {
      if (!tagsPanel || !tagsDatalist) return;
      const freq = new Map();
      notes.forEach(n => {
        (n.tags || []).forEach(t => {
          const key = t.trim();
          if (!key) return;
          freq.set(key, (freq.get(key) || 0) + 1);
        });
      });
      const tags = Array.from(freq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 16)
        .map(([tag, count]) => ({ tag, count }));

      tagsPanel.innerHTML = tags.length
        ? tags.map(t => `<button type="button" data-tag="${escapeHtml(t.tag)}">#${escapeHtml(t.tag)} (${t.count})</button>`).join('')
        : '<div class="small" style="opacity:0.7">Sem tags ainda.</div>';

      tagsDatalist.innerHTML = tags.map(t => `<option value="#${escapeHtml(t.tag)}"></option>`).join('');

      tagsPanel.querySelectorAll('button[data-tag]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (noteSearch) {
            noteSearch.value = `#${btn.dataset.tag}`;
            renderNotes();
          }
        });
      });
    };

    const renderNotes = async () => {
      const notes = await BibleNotesStore.load();
      const q = noteSearch ? noteSearch.value.trim() : '';
      const filtered = q ? await BibleNotesStore.search(q) : notes;
      if (!notesList) return;
      if (!filtered.length) {
        notesList.innerHTML = '<div class="small" style="opacity:0.7">Sem anotações ainda.</div>';
        renderTagsPanel(notes);
        return;
      }
      notesList.innerHTML = filtered.map(n => `
        <div class="bible-note-card" data-id="${n.id}">
          <div class="bible-note-card-ref">${n.reference ? escapeHtml(n.reference) : 'Sem referência'}</div>
          <div class="bible-note-card-content">${escapeHtml(n.content)}</div>
          ${n.tags && n.tags.length ? `<div class="bible-note-card-tags">${n.tags.map(t => `<span data-tag="${escapeHtml(t)}">#${escapeHtml(t)}</span>`).join(' ')}</div>` : ''}
          <div class="bible-note-card-actions">
            <button class="ghost bible-note-edit" data-id="${n.id}">Editar</button>
            <button class="ghost bible-note-delete" data-id="${n.id}">Excluir</button>
          </div>
          <div class="bible-note-edit-form hidden" data-id="${n.id}">
            <input type="text" class="bible-note-input edit-ref" value="${escapeHtml(n.reference || '')}">
            <textarea class="bible-note-textarea edit-content">${escapeHtml(n.content || '')}</textarea>
            <input type="text" class="bible-note-input edit-tags" value="${escapeHtml((n.tags || []).join(', '))}">
            <div class="bible-note-card-actions">
              <button class="btn success bible-note-save" data-id="${n.id}">Salvar</button>
              <button class="ghost bible-note-cancel" data-id="${n.id}">Cancelar</button>
            </div>
          </div>
        </div>
      `).join('');

      notesList.querySelectorAll('.bible-note-delete').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          if (!id) return;
          await BibleNotesStore.remove(id);
          renderNotes();
        });
      });

      notesList.querySelectorAll('.bible-note-edit').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const card = notesList.querySelector(`.bible-note-card[data-id="${id}"]`);
          if (!card) return;
          card.querySelector('.bible-note-edit-form')?.classList.remove('hidden');
        });
      });

      notesList.querySelectorAll('.bible-note-cancel').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const card = notesList.querySelector(`.bible-note-card[data-id="${id}"]`);
          if (!card) return;
          card.querySelector('.bible-note-edit-form')?.classList.add('hidden');
        });
      });

      notesList.querySelectorAll('.bible-note-save').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const card = notesList.querySelector(`.bible-note-card[data-id="${id}"]`);
          if (!card) return;
          const ref = card.querySelector('.edit-ref')?.value?.trim() || '';
          const content = card.querySelector('.edit-content')?.value?.trim() || '';
          const tags = BibleNotesStore._parseTags(card.querySelector('.edit-tags')?.value || '');
          if (!content) {
            showError('Escreva uma anotação antes de salvar.');
            return;
          }
          clearError();
          await BibleNotesStore.update(id, { reference: ref, content, tags });
          renderNotes();
        });
      });

      notesList.querySelectorAll('.bible-note-card-tags span').forEach(tagEl => {
        tagEl.addEventListener('click', () => {
          if (noteSearch) {
            noteSearch.value = `#${tagEl.dataset.tag || ''}`.trim();
            renderNotes();
          }
        });
      });

      renderTagsPanel(notes);
    };

    if (noteSaveBtn) {
      noteSaveBtn.addEventListener('click', async () => {
        const ref = noteRef ? noteRef.value.trim() : '';
        const content = noteContent ? noteContent.value.trim() : '';
        const tags = noteTags ? BibleNotesStore._parseTags(noteTags.value) : [];
        if (!content) {
          showError('Escreva uma anotação antes de salvar.');
          return;
        }
        clearError();
        await BibleNotesStore.add({ reference: ref, content, tags });
        if (noteRef) noteRef.value = '';
        if (noteContent) noteContent.value = '';
        if (noteTags) noteTags.value = '';
        renderNotes();
      });
    }

    if (noteSearch) {
      noteSearch.addEventListener('input', () => {
        renderNotes();
      });
    }

    renderNotes().catch(e => {
      showError('Não foi possível carregar as anotações.');
      console.warn('Falha ao carregar anotações:', e);
    });
  };

  document.addEventListener('DOMContentLoaded', init);
})();
