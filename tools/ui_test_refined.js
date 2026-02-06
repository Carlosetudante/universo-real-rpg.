const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  const filePath = 'file://' + require('path').resolve('index.html');
  await page.goto(filePath, { waitUntil: 'networkidle2' });

  try { await page.waitForFunction(() => window.__BIBLE_READY__ === true, { timeout: 15000 }); } catch(e) { await page.waitForTimeout(1000); }

  const questions = [
    'nome hebraico de João Batista, escreva em hebraico',
    'nome hebraico de João apóstolo, escreva em hebraico',
    'nome hebraico de Jesus, escreva em hebraico e significado',
    'nome hebraico de Paulo (Saulo), escreva em hebraico',
    'nome hebraico de Pedro (Simão), escreva em hebraico',
    'nome hebraico de Maria mãe de Jesus, escreva em hebraico',
    'quem foi João Batista? caminhada completa',
    'quem foi João apóstolo? caminhada completa',
    'quem foi Pedro? queda e restauração',
    'quem foi Paulo? conversão e missões',
    'quem foi Maria? fé e sofrimento',
    'novo mandamento: cite e explique profundo',
    'qual a diferença entre mandamento e conselho bíblico?',
    "o que significa 'graça' na prática?",
    'como lidar com ansiedade com base bíblica (passos práticos)'
  ];

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
    const status = /não encontrei|⚠️ não encontrei/i.test(last) ? 'not_found' : 'ok';
    results.push({ question: q, response: last, status });

    await page.waitForTimeout(400);
  }

  fs.writeFileSync('tools/ui_test_refined_result.json', JSON.stringify({ runAt: new Date().toISOString(), results }, null, 2));
  console.log('Refined batch concluído. Resultado salvo em tools/ui_test_refined_result.json');
  await browser.close();

  // Executa pipeline automático para re-enviar falhas e consolidar resultados
  try {
    const { execSync } = require('child_process');
    console.log('Iniciando pipeline automático (retries)...');
    execSync('node tools/ui_test_pipeline.js', { stdio: 'inherit' });
    console.log('Pipeline automático concluído. Verifique tools/ui_test_pipeline_result.json');
  } catch (e) {
    console.error('Falha ao executar pipeline automático:', e && e.message ? e.message : e);
  }
})();
