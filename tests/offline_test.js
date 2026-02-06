const puppeteer = require('puppeteer');

(async () => {
  const base = 'http://127.0.0.1:5500';
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);

  const results = { start: new Date().toISOString() };

  try {
    console.log('Opening', base);
    await page.goto(base, { waitUntil: 'networkidle2' });

    // Wait for service worker registration to appear
    let swRegistered = false;
    for (let i=0;i<20;i++) {
      swRegistered = await page.evaluate(() => !!navigator.serviceWorker && !!navigator.serviceWorker.controller);
      if (swRegistered) break;
      await new Promise(r => setTimeout(r, 500));
    }
    results.swController = swRegistered;

    // Inspect caches
    const cacheKeys = await page.evaluate(async () => {
      try { return await caches.keys(); } catch (e) { return {error: String(e)}; }
    });
    results.caches = cacheKeys;

    // Try fetching resources (online)
    results.fetchOnline = await page.evaluate(async () => {
      const r = {};
      try {
        const index = await fetch('/index.html');
        r.indexStatus = index.status;
        r.indexSnippet = await index.text().then(t => t.slice(0,200));
      } catch (e) { r.indexError = String(e); }
      try {
        const fin = await fetch('/financeiro.html');
        r.financeiroStatus = fin.status;
      } catch (e) { r.financeiroError = String(e); }
      try {
        const chart = await fetch('https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js');
        r.chartStatus = chart.status;
      } catch (e) { r.chartError = String(e); }
      return r;
    });

    // Go offline in the page
    await page.setOfflineMode(true);
    await new Promise(r => setTimeout(r, 500));

    // Try fetches offline (should be served from cache if SW works)
    results.fetchOffline = await page.evaluate(async () => {
      const res = {};
      try {
        const idx = await fetch('/index.html');
        res.indexStatus = idx.status;
        res.indexSnippet = await idx.text().then(t => t.slice(0,200));
      } catch (e) { res.indexError = String(e); }
      try {
        const fin = await fetch('/financeiro.html');
        res.financeiroStatus = fin.status;
      } catch (e) { res.financeiroError = String(e); }
      try {
        const chart = await fetch('https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js');
        res.chartStatus = chart.status;
      } catch (e) { res.chartError = String(e); }
      return res;
    });

    // Re-enable online
    await page.setOfflineMode(false);

    results.end = new Date().toISOString();
    console.log('TEST RESULTS:', JSON.stringify(results, null, 2));
  } catch (err) {
    console.error('Test failed:', err);
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
})();
