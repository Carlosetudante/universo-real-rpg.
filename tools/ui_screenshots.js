const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Desktop screenshot
  const filePath = 'file://' + require('path').resolve('index.html');
  await page.goto(filePath, { waitUntil: 'networkidle2' });
  try {
    await page.waitForFunction(() => window.__BIBLE_READY__ === true, { timeout: 8000 });
  } catch (e) { await page.waitForTimeout(800); }

  // ensure bible tab is present and click
  await page.evaluate(() => {
    const b = document.querySelector('[data-tab="bible"]');
    if (b && typeof b.click === 'function') { try { b.scrollIntoView(); b.click(); } catch(e){} }
    else if (typeof injectBibleTab === 'function') try { injectBibleTab(); } catch(e){}
  });

  await page.waitForSelector('#tab-bible');
  await page.waitForTimeout(500);

  if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');
  await page.setViewport({ width: 1200, height: 900 });
  await page.screenshot({ path: path.join('screenshots','bible_desktop.png'), fullPage: true });

  // Mobile emulation (iPhone 12)
  const iPhone = puppeteer.devices['iPhone 12'] || { name: 'iPhone 12', userAgent: '', viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true } };
  await page.emulate(iPhone);
  await page.reload({ waitUntil: 'networkidle2' });

  try {
    await page.waitForFunction(() => window.__BIBLE_READY__ === true, { timeout: 8000 });
  } catch (e) { await page.waitForTimeout(800); }

  // open bible on mobile
  await page.evaluate(() => {
    const b = document.querySelector('[data-tab="bible"]');
    if (b && typeof b.click === 'function') { try { b.scrollIntoView(); b.click(); } catch(e){} }
    else if (typeof injectBibleTab === 'function') try { injectBibleTab(); } catch(e){}
  });

  await page.waitForSelector('#tab-bible');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join('screenshots','bible_mobile.png'), fullPage: true });

  // Then click home to see if bible remains visible behind
  await page.evaluate(() => {
    const h = document.querySelector('[data-tab="hero"]') || document.querySelector('.tab-btn[data-tab="hero"]');
    if (h && typeof h.click === 'function') { try { h.click(); } catch(e){} }
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join('screenshots','home_after_bible.png'), fullPage: true });

  console.log('Screenshots saved to screenshots/');
  await browser.close();
})();
