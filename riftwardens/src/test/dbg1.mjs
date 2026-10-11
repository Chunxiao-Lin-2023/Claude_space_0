import {chromium} from '/opt/npm-tools/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT='/home/claude/riftwork/out';
const srv=http.createServer((q,s)=>{fs.readFile(path.join(ROOT,q.url.split('?')[0]),(e,d)=>{if(e){s.writeHead(404);s.end();return;}s.writeHead(200,{'content-type':'text/html'});s.end(d);});}).listen(0);
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--disable-gpu']});
const page=await browser.newPage();
await page.goto(`http://127.0.0.1:${srv.address().port}/test.html?unlockall`);
await page.waitForFunction(()=>window.__dbg&&document.querySelector('#bSolo'));
console.log(await page.evaluate(()=>{
  __dbg.startLevel(3); const G=__dbg.G; __dbg.P.length=0; G.phase='wave'; G.spawnQ=[{t:1e9}];
  const m=G.map; let rows=[]; for(let y=0;y<m.h;y++){let r="";for(let x=0;x<m.w;x++){const d=G.flow[y*m.w+x]; r+=(d>1e8?(m.t[y*m.w+x]==0?".":"#"):String.fromCharCode(48+Math.min(74,Math.round(d))));} rows.push(r);} 
  const gt=m.gates[0]; const e=__dbg.spawnOrc('grunt', gt.x*48+24, gt.y*48+24); const log=[];
  for(let i=0;i<300;i++){ __dbg.updWorld(1/30); if(i%30==0) log.push([Math.round(e.x),Math.round(e.y),e.anim,e.act?1:0,e.dead]); }
  return rows.join('\n')+'\n'+JSON.stringify(log);
}));
await browser.close(); srv.close();
