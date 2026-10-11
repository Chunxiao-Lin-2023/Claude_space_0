const {chromium}=require('playwright');const OUT=process.env.OUT;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-features=WebRtcHideLocalIpsWithMdns']});
const U='http://localhost:8765/test.html?peerhost=127.0.0.1&peerport=9000';
const PJ=require('fs').readFileSync(require.resolve('peerjs/dist/peerjs.min.js'),'utf8');
const mk=async()=>{const c=await b.newContext({viewport:{width:960,height:600}});await c.route(/unpkg\.com|jsdelivr\.net/,r=>r.fulfill({status:200,contentType:'application/javascript',body:PJ}));await c.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());const p=await c.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|Failed to load/.test(m.text()))p.errs.push(m.text().slice(0,200))});await p.goto(U);await p.waitForTimeout(1500);return p;};
const H=await mk(), Gp=await mk();
// peerjs is loaded from unpkg; serve it locally if the CDN is blocked
for(const p of [H,Gp]) await p.evaluate(()=>{});
await H.click('#modeSeg button[data-v=online]');await Gp.click('#modeSeg button[data-v=online]');
await Gp.click('.hcard[data-i="4"]');
await H.fill('#nameIn','房主');await Gp.fill('#nameIn','小伙伴');
await H.click('#hostBtn');
await H.waitForFunction(()=>NET.peer&&NET.peer.open,{timeout:20000});
const code=await H.evaluate(()=>NET.code);console.log('code',code);
await Gp.fill('#codeIn',code);await Gp.click('#joinBtn');
await H.waitForFunction(()=>NET.partner&&connected(),{timeout:20000});
console.log('host sees',await H.evaluate(()=>JSON.stringify(NET.partner)), 'start enabled', await H.evaluate(()=>!document.getElementById('startBtn').disabled));
await H.screenshot({path:OUT+'/c_lobby_host.png'});
await H.click('#startBtn');
await Gp.waitForFunction(()=>STATE.mode==='play'&&CL.me,{timeout:15000});
await Gp.evaluate(()=>{window.__dbg.skipDraw=true});await H.evaluate(()=>{window.__dbg.skipDraw=true;window.__dbg.god=true;for(const e of G.ents)if(e.human)e.hp=e.mhp=99999;});
console.log('guest me',await Gp.evaluate(()=>JSON.stringify({id:CL.me.id,hero:CL.me.H.k,team:CL.me.team,n:CL.list.length,theme:M.theme})));
const g0=await H.evaluate(()=>{const g=G.ents.find(e=>e.human===2);return {x:g.x,z:g.z,atk:g.atkSeq}});
await Gp.evaluate(()=>{window.__fr=0;(function f(){window.__fr++;requestAnimationFrame(f)})();});await Gp.keyboard.down('d');await Gp.waitForTimeout(3000);await Gp.keyboard.up('d');console.log('guest frames in 3s',await Gp.evaluate(()=>window.__fr),'keys',await Gp.evaluate(()=>JSON.stringify(INP.keys)));
await Gp.mouse.move(700,300);await Gp.mouse.down();await Gp.waitForTimeout(150);await Gp.mouse.up();
await Gp.waitForTimeout(3000);
const g1=await H.evaluate(()=>{const g=G.ents.find(e=>e.human===2);return {x:g.x,z:g.z,atk:g.atkSeq,projs:G.projs.length}});
const gl=await Gp.evaluate(()=>({x:CL.me.x,z:CL.me.z,snapAge:performance.now()-CL.lastSnap,evSeq:CL.evSeq,projs:CL.projs.size,hp:CL.me.hp}));
console.log('dbg host',await H.evaluate(()=>{const g=G.ents.find(e=>e.human===2);return JSON.stringify({rp:g.remotePos,ps:g.posSeq,fm:!!g.fm,snapOpen:!!(NET.snap&&NET.snap.open),human:g.human,alive:g.alive})}),'guest',await Gp.evaluate(()=>JSON.stringify({ps:CL.me.posSeq,first:CL.me.first,snapOpen:!!(NET.snap&&NET.snap.open),hostFm:CL.me.hostFm})));
console.log('host view of guest before',JSON.stringify(g0),'after',JSON.stringify(g1));console.log('guest local',JSON.stringify(gl));
// fast-forward host to see action reach guest
await H.evaluate(()=>{for(let i=0;i<60*20;i++)stepGame(1/60);});
await Gp.waitForTimeout(2500);
console.log('after ff guest sees',await Gp.evaluate(()=>JSON.stringify({t:CL.t,alive:CL.list.filter(e=>e.alive).length,walls:M.t.filter(x=>x===1).length,boxes:M.boxes.filter(b=>b.hp>0).length,cubes:CL.cubes.length})),
  'host',await H.evaluate(()=>JSON.stringify({t:G.t,alive:G.ents.filter(e=>e.alive).length,walls:M.t.filter(x=>x===1).length,boxes:M.boxes.filter(b=>b.hp>0).length,cubes:G.cubes.length})));
await Gp.evaluate(()=>{window.__dbg.skipDraw=false});await H.evaluate(()=>{window.__dbg.skipDraw=false});await Gp.waitForTimeout(2500);await Gp.screenshot({path:OUT+'/c_guest.png'});await H.screenshot({path:OUT+'/c_host.png'});
// guest leaves -> host continues with AI
await Gp.context().close();await H.waitForTimeout(11000);
console.log('after guest left',await H.evaluate(()=>JSON.stringify({conn:connected(),g:G.ents.filter(e=>e.name.includes('(AI)')).map(e=>e.name),mode:STATE.mode})));
console.log('errs host',H.errs.slice(0,6),'guest',Gp.errs.slice(0,6));
await b.close();})();
