// node test/peerserver.js — 本地 PeerJS 服务器（双人测试用，端口 9000）。需要 express + peer（NODE_PATH 指到装了它们的地方）
const express = require('express'); const http = require('http'); const { ExpressPeerServer } = require('peer');
const app = express(); const server = http.createServer(app);
app.use('/', ExpressPeerServer(server, { path: '/' }));
server.listen(9000, '127.0.0.1', () => console.log('peer server on 127.0.0.1:9000'));
