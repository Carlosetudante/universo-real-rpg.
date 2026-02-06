// server/actions/validator.js
// Valida e enriquece actions vindas do LLM
async function validateAndEnrichActions(actions = [], context = {}) {
  const normalized = [];

  for (const act of actions) {
    const payload = (act && typeof act === 'object') ? (act.payload || {}) : {};
    const type = (act && act.type) || payload.type || '';
    const out = { type, payload: { ...payload } };

    let valid = true;
    let error = null;

    // helpers
    const asNumber = v => {
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      if (typeof v === 'string') {
        const n = Number(v.toString().replace(/\./g, '').replace(',', '.'));
        return Number.isFinite(n) ? n : null;
      }
      return null;
    };

    const isDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
    const isTime = s => typeof s === 'string' && /^\d{2}:\d{2}$/.test(s);

    switch (type) {
      case 'task.add':
        out.payload.title = (out.payload.title || out.payload.name || '').toString().trim();
        if (!out.payload.title) {
          valid = false;
          error = 'missing_title';
        }
        if (out.payload.date && !isDate(out.payload.date)) out.payload.date = null;
        if (out.payload.time && !isTime(out.payload.time)) out.payload.time = null;
        out.payload.priority = ['low', 'medium', 'high'].includes(out.payload.priority) ? out.payload.priority : (out.payload.priority || 'medium');
        break;

      case 'finance.add':
        const amt = asNumber(out.payload.amount);
        if (amt == null) {
          valid = false;
          error = 'missing_amount';
        } else {
          out.payload.amount = amt;
        }
        out.payload.kind = (out.payload.kind === 'income' || out.payload.kind === 'expense') ? out.payload.kind : null;
        if (out.payload.date && !isDate(out.payload.date)) out.payload.date = null;
        out.payload.category = out.payload.category || null;
        break;

      case 'xp.add':
        const xp = asNumber(out.payload.amount);
        if (xp == null) {
          valid = false;
          error = 'missing_xp_amount';
        } else {
          out.payload.amount = xp;
        }
        out.payload.reason = out.payload.reason || null;
        break;

      default:
        valid = false;
        error = 'unknown_action';
    }

    if (valid) {
      normalized.push(out);
    } else {
      // anexar info de erro para auditoria (mas não retornar ações inválidas)
      console.warn('[actions/validator] Dropping invalid action]', { action: act, error });
    }
  }

  return normalized;
}

module.exports = { validateAndEnrichActions };
