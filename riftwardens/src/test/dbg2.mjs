import {chromium} from '/opt/npm-tools/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT='/home/claude/riftwork/out';
const srv=http.createServer((q,s)=>{fs.readFile(path.join(ROOT,q.url.split('?')[0]),(e,d)=>{if(e){s.writeHead(404);s.end();return;}s.writeHead(200,{'content-type':'text/html'});s.end(d);});}).listen(0);
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--disable-gpu']});
const page=await browser.newPage();
await page.goto(`http://127.0.0.1:${srv.address().port}/test.html?unlockall`);
await page.waitForFunction(()=>window.__dbg&&document.querySelector('#bSolo'));
console.log(await page.evaluate(()=>{
  __dbg.startLevel(3); const G=__dbg.G, m=G.map;
  const d=computeFlow(false); const i=tIdx(31,14);
  return JSON.stringify({d31:d[i], d32:d[tIdx(32,14)], t31:tAt(31,14), w:m.w, gflow:G.flow===undefined, same: G.flow[i], trapAt: G.trapAt[i], nTraps:G.traps.length});
}));
await browser.close(); srv.close();
