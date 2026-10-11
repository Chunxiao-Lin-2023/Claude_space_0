import {chromium} from '/opt/npm-tools/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT='/home/claude/riftwork/out';
const srv=http.createServer((q,s)=>{fs.readFile(path.join(ROOT,q.url.split('?')[0]),(e,d)=>{if(e){s.writeHead(404);s.end();return;}s.writeHead(200,{'content-type':'text/html'});s.end(d);});}).listen(0);
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--disable-gpu']});
const page=await browser.newPage({viewport:{width:800,height:600}});
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(`http://127.0.0.1:${srv.address().port}/test.html?unlockall`);
await page.waitForFunction(()=>window.__dbg&&document.querySelector('#bSolo'));
for (let li=0; li<4; li++) {
  const r = await page.evaluate(li=>{
    __dbg.startLevel(li); const G=__dbg.G; G.riftMax=G.rift=1e6; __dbg.P.length=0;
    const out={}; 
    for (const type of ['grunt','kobold','ogre','bat','chief']) for (let g=0; g<G.map.gates.length; g++) {
      G.enemies.length=0; const gt=G.map.gates[g]; const e=__dbg.spawnOrc(type, gt.x*48+24, gt.y*48+24); G.phase='wave'; G.spawnQ=[{t:1e9}];
      let t=0; while(t<200 && !e.dead){ __dbg.updWorld(1/30); t+=1/30; }
      out[type+g]= e.dead ? +t.toFixed(1) : 'STUCK@'+Math.round(e.x/48)+','+Math.round(e.y/48);
    }
    // crowd: 30 grunts at once from gate 0
    G.enemies.length=0; G.rift=1e6; for(let i=0;i<30;i++) __dbg.spawnOrc(i%3?'grunt':'ogre', G.map.gates[0].x*48+24+(i%5)*3, G.map.gates[0].y*48+24);
    let t=0; while(t<240 && G.enemies.length){ __dbg.updWorld(1/30); t+=1/30; }
    out.crowd30 = G.enemies.length ? 'left '+G.enemies.length+' @ '+G.enemies.slice(0,3).map(e=>Math.round(e.x/48)+','+Math.round(e.y/48)).join(' ') : +t.toFixed(1);
    return out;
  }, li);
  console.log('level', li+1, JSON.stringify(r));
}
console.log(errs.length?errs:'no errors'); await browser.close(); srv.close();
