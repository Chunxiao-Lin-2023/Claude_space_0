const http = require('http'); const express = require('/home/claude/riftwork/node_modules/express');
const {ExpressPeerServer} = require('/home/claude/riftwork/node_modules/peer');
const app = express(); const server = http.createServer(app);
app.use('/', ExpressPeerServer(server, {path: '/'}));
server.listen(+process.argv[2] || 9123, '127.0.0.1', () => console.log('peer up'));
