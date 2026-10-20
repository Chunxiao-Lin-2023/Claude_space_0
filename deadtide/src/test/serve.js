// tiny static server: node test/serve.js <dir> <port>
const http = require('http'), fs = require('fs'), path = require('path');
const dir = path.resolve(process.argv[2] || 'out'), port = +(process.argv[3] || 8765);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json', '.css': 'text/css' };
http.createServer((q, r) => { let f = path.join(dir, decodeURIComponent(q.url.split('?')[0])); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(port, () => console.log('serving', dir, 'on', port));
