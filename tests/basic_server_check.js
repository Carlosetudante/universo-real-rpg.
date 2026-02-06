const http = require('http');
const { URL } = require('url');

const BASE = 'http://127.0.0.1:5500';
const paths = [
  '/',
  '/index.html',
  '/sw.js',
  '/offline.html',
  '/style.css',
  '/app.js',
  '/manifest.json'
];

async function fetchPath(p) {
  return new Promise((resolve) => {
    const url = new URL(p, BASE);
    const req = http.get(url, (res) => {
      const status = res.statusCode;
      let size = 0;
      res.on('data', (c) => size += c.length);
      res.on('end', () => resolve({ path: url.pathname, status, size }));
    });
    req.on('error', (e) => resolve({ path: p, error: String(e) }));
    req.setTimeout(10000, () => { req.abort(); resolve({ path: p, error: 'timeout' }); });
  });
}

(async () => {
  console.log('Starting basic server checks against', BASE);
  const results = { start: new Date().toISOString(), checks: [] };
  for (const p of paths) {
    // small delay
    await new Promise(r => setTimeout(r, 120));
    // ensure leading slash
    const res = await fetchPath(p);
    results.checks.push(res);
    console.log(p, '->', res.status || res.error, res.size ? `${res.size} bytes` : '');
  }

  // Check sw.js content for CACHE_NAME and urlsToCache
  try {
    const sw = await new Promise((resolve, reject) => {
      http.get(BASE + '/sw.js', (res) => {
        let body = '';
        res.on('data', c => body += c.toString());
        res.on('end', () => resolve(body));
      }).on('error', e => resolve(''));
    });
    results.sw_present = !!sw;
    results.sw_contains_cache = sw.includes('CACHE_NAME');
    results.sw_contains_urls = sw.includes('urlsToCache');
  } catch (e) { results.sw_error = String(e); }

  results.end = new Date().toISOString();
  console.log('\nSUMMARY:\n', JSON.stringify(results, null, 2));
})();
