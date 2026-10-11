const {chromium}=require('playwright');
const OUT=process.env.OUT;
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];
p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
await p.goto('http://localhost:8765/test.html'+(process.env.Q||''));
await p.waitForTimeout(2500);await p.screenshot({path:OUT+'/s_menu.png'});
await p.evaluate(()=>{SEL.mode=process_mode='solo';});
await p.click('#startBtn');await p.waitForTimeout(1500);
await p.mouse.move(800,300);await p.keyboard.down('w');await p.waitForTimeout(700);await p.keyboard.up('w');
await p.mouse.down();await p.waitForTimeout(300);await p.mouse.up();await p.waitForTimeout(200);
await p.screenshot({path:OUT+'/s_play1.png'});
await p.evaluate(()=>{window.__dbg.speed=6});
for(let i=0;i<6;i++){await p.waitForTimeout(2500);}
const st=await p.evaluate(()=>({t:G.t.toFixed(1),alive:G.alive.size,ents:G.ents.map(e=>[e.name,e.alive,Math.round(e.hp),e.kills,e.cubes].join(':')),projs:G.projs.length,boxes:M.boxes.filter(b=>b.hp>0).length,destroyed:G.destroyed.length,err:window.__dbg.err,mode:STATE.mode}));
console.log(JSON.stringify(st,null,0));
await p.evaluate(()=>{window.__dbg.speed=1});await p.waitForTimeout(400);
await p.screenshot({path:OUT+'/s_play2.png'});
console.log(errs.slice(0,15).join('\n'));
await b.close();})();
