import {chromium} from '/opt/npm-tools/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT='/home/claude/riftwork/out';
const srv=http.createServer((q,s)=>{fs.readFile(path.join(ROOT,q.url.split('?')[0]),(e,d)=>{if(e){s.writeHead(404);s.end();return;}s.writeHead(200,{'content-type':'text/html'});s.end(d);});}).listen(0);
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--disable-gpu']});
const page=await browser.newPage({viewport:{width:1280,height:760}});
const errs=[]; page.on('pageerror',e=>errs.push(e.message)); page.on('console',m=>console.log('console',m.text()));
await page.goto(`http://127.0.0.1:${srv.address().port}/test.html?unlockall`);
await page.waitForFunction(()=>window.__dbg&&document.querySelector('#bSolo'));
for (const hero of ['paladin','blade']) {
 const r = await page.evaluate(h=>{ __dbg.SAVE.hero=h; __dbg.startLevel(1); const ME=__dbg.ME; const out=[ME.hero, ME.mp];
   useAlt(); out.push(ME.mp, ME.cdAlt, ME.guard); useSkill(); out.push(ME.mp, ME.cdSkill, ME.spin); return out; }, hero);
 console.log(hero, JSON.stringify(r));
}
console.log(errs); await browser.close(); srv.close();
