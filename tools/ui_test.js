const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  // Abra o arquivo index.html local
  const filePath = 'file://' + require('path').resolve('index.html');
  await page.goto(filePath, { waitUntil: 'networkidle2' });

  // Aguarda a injeção da aba Bíblia
  // Espera o sinal de readiness emitido pela aplicação
  try {
    await page.waitForFunction(() => window.__BIBLE_READY__ === true, { timeout: 15000 });
  } catch (e) {
    // fallback curto se não houver readiness
    await page.waitForTimeout(1000);
  }

  // Abre a aba bíblia clicando no botão com data-tab="bible"
  // Tenta ativar a aba Bíblia via DOM (mais robusto que ElementHandle.click)
  const activated = await page.evaluate(() => {
    const b = document.querySelector('[data-tab="bible"]');
    if (b && typeof b.click === 'function') { try { b.scrollIntoView(); b.click(); return true; } catch(e){ return false; } }
    return false;
  });
  if (!activated) {
    console.warn('Botão da aba Bíblia não encontrado; tentando abrir via injeção direta...');
    try { await page.evaluate(() => { if (typeof injectBibleTab === 'function') injectBibleTab(); }); } catch(e){}
  }

  await page.waitForSelector('#bibleInput');

  // Fazer pergunta
  const question = 'quem foi joao';

  // Preferir usar a API exposta `askBible` quando disponível (mais direta)
  const usedAsk = await page.evaluate((q) => {
    if (typeof window.askBible === 'function') {
      try { window.askBible(q); return true; } catch(e) { return false; }
    }
    return false;
  }, question);

  if (!usedAsk) {
    // Fallback: digita e clica no botão de envio
    await page.type('#bibleInput', question);
    await page.evaluate(() => { const b = document.getElementById('bibleSendBtn'); if (b) b.click(); });
  }

  // Aguarda a resposta do bot (procura por .chat-message.bot que não seja thinking)
  await page.waitForFunction(() => {
    const bots = Array.from(document.querySelectorAll('.chat-message.bot'));
    return bots.some(b => !b.classList.contains('thinking') && b.innerText.trim().length > 0);
  }, { timeout: 20000 });

  // Captura o último bot message
  const botMessages = await page.$$eval('.chat-message.bot', nodes => nodes.map(n => n.innerText.trim()));
  const last = botMessages[botMessages.length - 1];

  const status = /não encontrei|⚠️ não encontrei/i.test(last) ? 'not_found' : 'ok';

  const out = {
    question,
    responsePreview: last.slice(0, 1000),
    full: last,
    status
  };

  fs.writeFileSync('tools/ui_test_result.json', JSON.stringify(out, null, 2));
  console.log('Teste concluído. Resultado salvo em tools/ui_test_result.json');

  await browser.close();
})();
