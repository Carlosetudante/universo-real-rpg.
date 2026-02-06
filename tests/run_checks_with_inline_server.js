const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = process.cwd();
const PORT = 5500;
const HOST = '127.0.0.1';

// small static server
const mime = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.txt':'text/plain'};
function createServer(){
  return http.createServer((req,res)=>{
    try{
      let reqPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
      if (reqPath === '/') reqPath = '/index.html';
      const filePath = path.join(ROOT, reqPath.replace(/^\//,''));
      if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
      fs.stat(filePath, (err,stat)=>{
        if (err || !stat.isFile()) { res.writeHead(404); res.end('Not found'); return; }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {'Content-Type': mime[ext] || 'application/octet-stream'});
        fs.createReadStream(filePath).pipe(res);
      });
    } catch(e){ res.writeHead(500); res.end('Server error'); }
  });
}

function fetchPath(p){
  return new Promise((resolve)=>{
    const url = new URL(p, `http://${HOST}:${PORT}`);
    const req = http.get(url, (res)=>{
      const status = res.statusCode; let size=0; res.on('data', c=>size+=c.length); res.on('end', ()=>resolve({path:url.pathname,status,size}));
    });
    req.on('error', (e)=>resolve({path:p,error:String(e)}));
    req.setTimeout(10000, ()=>{ req.abort(); resolve({path:p,error:'timeout'}); });
  });
}

(async ()=>{
  const server = createServer();
  await new Promise(r=>server.listen(PORT, HOST, r));
  console.log('Inline dev server listening at http://'+HOST+':'+PORT);

  const paths = ['/', '/index.html','/sw.js','/offline.html','/style.css','/app.js','/manifest.json'];
  const results = {start:new Date().toISOString(),checks:[]};
  for(const p of paths){
    await new Promise(r=>setTimeout(r,100));
    const res = await fetchPath(p);
    results.checks.push(res);
    console.log(p,'->',res.status||res.error, res.size?res.size+' bytes':'');
  }

  // sw content
  try{
    const sw = fs.readFileSync(path.join(ROOT,'sw.js'),'utf8');
    results.sw_present = true;
    results.sw_contains_cache = sw.includes('CACHE_NAME');
    results.sw_contains_urls = sw.includes('urlsToCache');
  } catch(e){ results.sw_present=false; results.sw_error=String(e); }

  results.end = new Date().toISOString();
  console.log('\nSUMMARY:\n', JSON.stringify(results,null,2));

  server.close(()=>{});
})();
