const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('http://localhost:8765/test.html');await p.waitForTimeout(1500);
await p.evaluate(()=>{window.__dbg.god=true;startGame({seed:5,theme:'desert',mode:'solo',diff:1,roster: rosterFor(SEL.mode, localHumans(), false)});});
await p.waitForTimeout(3000);
console.log(await p.evaluate(()=>JSON.stringify({calls:R3.renderer.info.render.calls,tris:R3.renderer.info.render.triangles,progs:R3.renderer.info.programs.length,geos:R3.renderer.info.memory.geometries})));
await p.screenshot({path:process.env.OUT+'/perf.png'});
console.log(errs.slice(0,5).join('\n'));await b.close();})();
