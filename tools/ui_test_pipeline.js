const puppeteer = require('puppeteer');
const fs = require('fs');

// Pipeline: lê um JSON de resultados existentes, identifica falhas (fallback/not found/timeout),
// reenvia só as perguntas com falha e consolida num JSON final.

const SOURCE = 'tools/ui_test_refined_result.json';
const OUT = 'tools/ui_test_pipeline_result.json';

async function resendQuestions(questions) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  const filePath = 'file://' + require('path').resolve('index.html');
  await page.goto(filePath, { waitUntil: 'networkidle2' });

  try { await page.waitForFunction(() => window.__BIBLE_READY__ === true, { timeout: 15000 }); } catch (e) { await page.waitForTimeout(1000); }

  const results = [];
  for (const q of questions) {
    const prevCount = await page.$$eval('.chat-message.bot', nodes => nodes.length);

    const usedAsk = await page.evaluate((txt) => {
      if (typeof window.askBible === 'function') {
        try { window.askBible(txt); return true; } catch(e) { return false; }
      }
      return false;
    }, q);

    if (!usedAsk) {
      try {
        await page.type('#bibleInput', q);
        await page.evaluate(() => { const b = document.getElementById('bibleSendBtn'); if (b) b.click(); });
      } catch (e) {
        await page.evaluate((txt) => {
          const inp = document.getElementById('bibleInput');
          if (inp) { inp.value = txt; inp.dispatchEvent(new Event('input', { bubbles: true })); }
          const b = document.getElementById('bibleSendBtn'); if (b) b.click();
        }, q);
      }
    }

    try {
      await page.waitForFunction((pc) => {
        const bots = Array.from(document.querySelectorAll('.chat-message.bot'));
        if (bots.length <= pc) return false;
        const last = bots[bots.length - 1];
        return !last.classList.contains('thinking') && last.innerText.trim().length > 0;
      }, { timeout: 20000 }, prevCount);
    } catch (e) {
      results.push({ question: q, error: 'timeout waiting for response' });
      continue;
    }

    const last = await page.$$eval('.chat-message.bot', nodes => nodes.map(n => n.innerText.trim()).pop());
    results.push({ question: q, response: last });

    await page.waitForTimeout(300);
  }

  await browser.close();
  return results;
}

function isFailureEntry(entry) {
  if (!entry) return false;
  if (entry.error) return true;
  if (entry.status && entry.status !== 'ok') return true;
  const resp = (entry.response || '').toString().toLowerCase();
  if (resp.includes('não encontrei') || resp.includes('⚠️ não encontrei') || resp.includes('timeout waiting')) return true;
  return false;
}

(async () => {
  if (!fs.existsSync(SOURCE)) {
    console.error('Arquivo fonte não encontrado:', SOURCE);
    process.exit(1);
  }

  const src = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
  const failed = src.results.filter(isFailureEntry).map(r => r.question);

  if (failed.length === 0) {
    console.log('Nenhuma falha detectada em', SOURCE);
    fs.writeFileSync(OUT, JSON.stringify(src, null, 2));
    process.exit(0);
  }

  console.log('Reenviando', failed.length, 'perguntas com falha...');
  const retry = await resendQuestions(failed);

  // Consolida: substitui respostas falhas pelas respostas do retry (match by question exact)
  const merged = src.results.map(r => {
    if (isFailureEntry(r)) {
      const rep = retry.find(x => x.question === r.question);
      return rep || r;
    }
    return r;
  });

  const out = { runAt: new Date().toISOString(), source: SOURCE, results: merged, retry };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log('Pipeline concluído. Resultado salvo em', OUT);
})();
