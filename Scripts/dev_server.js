const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = {
  '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.txt':'text/plain'
};
const ROOT = process.cwd();
const PORT = 5500;
const HOST = '127.0.0.1';

const server = http.createServer((req,res)=>{
  try {
    let reqPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(ROOT, reqPath.replace(/^\//,''));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403); res.end('Forbidden'); return;
    }
    fs.stat(filePath, (err,stat)=>{
      if (err || !stat.isFile()) { res.writeHead(404); res.end('Not found'); return; }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {'Content-Type': mime[ext] || 'application/octet-stream'});
      fs.createReadStream(filePath).pipe(res);
    });
  } catch(e){ res.writeHead(500); res.end('Server error'); }
});

server.listen(PORT, HOST, ()=>{
  console.log('Dev server running at http://'+HOST+':'+PORT);
});

// graceful
process.on('SIGINT', ()=>{ server.close(()=>process.exit(0)); });
