const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  const filePath = 'file://' + require('path').resolve('index.html');
  await page.goto(filePath, { waitUntil: 'networkidle2' });

  try {
    await page.waitForFunction(() => window.__BIBLE_READY__ === true, { timeout: 15000 });
  } catch (e) {
    await page.waitForTimeout(1000);
  }

  const questions = [
    'quem foi joao',
    'qual o nome de joao em hebraico?',
    'conte a caminhada de joao, desde quando foi chamado',
    'quem foi jesus',
    'qual o nome de jesus em hebraico?',
    'conte a caminhada de jesus resumida',
    'quem foi paulo',
    'qual o nome de paulo em hebraico?',
    'conte a caminhada de paulo',
    'quem foi pedro',
    'qual o nome de pedro em hebraico?',
    'conte a caminhada de pedro',
    'quem foi maria (mãe de jesus)',
    'qual o nome de maria em hebraico?',
    'o que é o novo mandamento? explique com referências e prática'
  ];

  const results = [];

  for (const q of questions) {
    // capture current count of bot messages
    const prevCount = await page.$$eval('.chat-message.bot', nodes => nodes.length);

    // try to use askBible()
    const usedAsk = await page.evaluate((txt) => {
      if (typeof window.askBible === 'function') {
        try { window.askBible(txt); return true; } catch(e) { return false; }
      }
      return false;
    }, q);

    if (!usedAsk) {
      // fallback: type and click
      try {
        await page.type('#bibleInput', q);
        await page.evaluate(() => { const b = document.getElementById('bibleSendBtn'); if (b) b.click(); });
      } catch (e) {
        // if typing fails, try direct DOM input set + click
        await page.evaluate((txt) => {
          const inp = document.getElementById('bibleInput');
          if (inp) { inp.value = txt; const evt = new Event('input', { bubbles: true}); inp.dispatchEvent(evt); }
          const b = document.getElementById('bibleSendBtn'); if (b) b.click();
        }, q);
      }
    }

    // wait for a new bot message (non-thinking)
    try {
      await page.waitForFunction((pc) => {
        const bots = Array.from(document.querySelectorAll('.chat-message.bot'));
        if (bots.length <= pc) return false;
        const last = bots[bots.length - 1];
        return !last.classList.contains('thinking') && last.innerText.trim().length > 0;
      }, { timeout: 20000 }, prevCount);
    } catch (e) {
      // timeout, record failure
      results.push({ question: q, error: 'timeout waiting for response' });
      continue;
    }

    const last = await page.$$eval('.chat-message.bot', nodes => nodes.map(n => n.innerText.trim()).pop());
    const status = /não encontrei|⚠️ não encontrei/i.test(last) ? 'not_found' : 'ok';
    results.push({ question: q, response: last, status });

    // small pause between queries
    await page.waitForTimeout(400);
  }

  fs.writeFileSync('tools/ui_test_batch_result.json', JSON.stringify({ runAt: new Date().toISOString(), results }, null, 2));
  console.log('Batch concluído. Resultado salvo em tools/ui_test_batch_result.json');

  await browser.close();
})();
