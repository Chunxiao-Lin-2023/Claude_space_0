const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] || 'out'), port = +(process.argv[3] || 8765);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.css': 'text/css' };
http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end('404'); return; } s.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); s.end(d); }); }).listen(port, () => console.log('serving', root, port));
