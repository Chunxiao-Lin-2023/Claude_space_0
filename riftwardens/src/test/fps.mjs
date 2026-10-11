import {chromium} from '/opt/npm-tools/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT='/home/claude/riftwork/out';
const srv=http.createServer((q,s)=>{fs.readFile(path.join(ROOT,q.url.split('?')[0]),(e,d)=>{if(e){s.writeHead(404);s.end();return;}s.writeHead(200,{'content-type':'text/html'});s.end(d);});}).listen(0);
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:process.env.GPU?['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:['--disable-gpu']});
const page=await browser.newPage({viewport:{width:1280,height:760}});
await page.goto(`http://127.0.0.1:${srv.address().port}/test.html`);
await page.waitForFunction(()=>window.__dbg&&document.querySelector('#bSolo'));
const prof = await page.evaluate(async()=>{ const T0=performance.now(); await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))); const raf2=performance.now()-T0;
  __dbg.startLevel(0); await new Promise(r=>setTimeout(r,500));
  const G=__dbg.G; __dbg.startWave(); for(let i=0;i<40;i++) __dbg.spawnOrc(['grunt','kobold','archer'][i%3], 200+i*10, 200);
  let n=0; const t0=performance.now(); await new Promise(r=>{function f(){n++; if(performance.now()-t0<3000) requestAnimationFrame(f); else r();} requestAnimationFrame(f);});
  // time render alone
  const t1=performance.now(); for(let i=0;i<20;i++) render(performance.now()/1000); const rt=(performance.now()-t1)/20;
  const t2=performance.now(); for(let i=0;i<60;i++) __dbg.updWorld(1/60); const wt=(performance.now()-t2)/60;
  const t3=performance.now(); for(let i=0;i<10;i++){updLocal(1/60);updHud(1);updFx(1/60);} const lt=(performance.now()-t3)/10; return {raf2, lt, fps:n/3, renderMs:rt.toFixed(1), worldMs:wt.toFixed(2)};
});
console.log(prof); await browser.close(); srv.close();
