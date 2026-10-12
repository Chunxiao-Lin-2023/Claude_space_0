// feature probes: bush stealth, duo respawn, super types, pause, quit-to-menu, artifact mode
const {chromium}=require('playwright');const OUT=process.env.OUT;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1280,height:720}});await p.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('http://localhost:8765/test.html');await p.waitForTimeout(1500);
const r={};
// bush stealth
r.bush=await p.evaluate(async()=>{window.__dbg.god=true;startGame({seed:42,theme:'desert',mode:'solo',diff:1,roster: rosterFor(SEL.mode, localHumans(), false)});
 const bushes=[];for(let i=0;i<M.N*M.N;i++)if(M.t[i]===T_BUSH)bushes.push(i);
 const me=STATE.me,foe=G.ents[1];foe.isBot=false;foe.inp.mx=foe.inp.mz=0;
 const t0=bushes[0],t1=bushes.find(i=>dist(i%M.N,(i/M.N)|0,t0%M.N,(t0/M.N)|0)>6);
 me.x=(t0%M.N)+.5;me.z=((t0/M.N)|0)+.5;foe.x=(t1%M.N)+.5;foe.z=((t1/M.N)|0)+.5;
 for(const e of G.ents.slice(2)){e.alive=false;}
 for(let i=0;i<5;i++)stepGame(1/60);
 await new Promise(r=>setTimeout(r,1500));
 const Vme=R3.vis.get(me.id),Vf=R3.vis.get(foe.id);
 const a={meInBush:me.inBush,meOpac:Vme.opac,foeInBush:foe.inBush,foeVisibleToMe:visibleTo(foe,me.team),foeRendered:Vf.root.visible};
 foe.x=me.x+1.5;foe.z=me.z;for(let i=0;i<3;i++)stepGame(1/60);await new Promise(r=>setTimeout(r,800));
 a.nearFoeVisible=visibleTo(foe,me.team);a.nearRendered=R3.vis.get(foe.id).root.visible;return a;});
await p.screenshot({path:OUT+'/p_bush.png'});
// every super type fires without error
r.supers=await p.evaluate(()=>{const out={};for(let h=0;h<6;h++){SEL.hero=h;startGame({seed:7+h,theme:'snow',mode:'solo',diff:1,roster: rosterFor(SEL.mode, localHumans(), false)});const me=STATE.me;me.sup=1;me.inp.sup=true;me.inp.aim=0.3;me.inp.tx=me.x+3;me.inp.tz=me.z+1;
  for(let i=0;i<90;i++)stepGame(1/60);out[me.H.k]={sup:me.sup,supSeq:me.supSeq,turrets:G.turrets.length,err:window.__dbg.err||''};}return out;});
// duo respawn of the human
r.duo=await p.evaluate(()=>{window.__dbg.god=false;SEL.mode='duo';startGame({seed:9,theme:'dusk',mode:'duo',diff:1,roster: rosterFor(SEL.mode, localHumans(), false)});const me=STATE.me;const mate=G.ents.find(e=>e.team===me.team&&e!==me);mate.hp=1e9;mate.mhp=1e9;
  hurt(me,99999,null,{});const dead=!me.alive,rt=+(me.respawnT-G.t).toFixed(1);for(let i=0;i<60*13;i++)stepGame(1/60);return {dead,rt,aliveAfter:me.alive,teamsAlive:G.alive.size};});
// pause freezes sim in solo
await p.evaluate(()=>{SEL.mode='solo';startGame({seed:3,theme:'desert',mode:'solo',diff:1,roster: rosterFor(SEL.mode, localHumans(), false)});});
await p.waitForTimeout(500);await p.keyboard.press('Escape');const tA=await p.evaluate(()=>G.t);await p.waitForTimeout(1200);const tB=await p.evaluate(()=>G.t);
r.pause={mode:await p.evaluate(()=>STATE.mode),frozen:tA===tB};
await p.screenshot({path:OUT+'/p_pause.png'});
await p.keyboard.press('Escape');await p.waitForTimeout(300);r.resumed=await p.evaluate(()=>STATE.mode);
// quit to menu and keyboard hero select
await p.evaluate(()=>quitToMenu());await p.waitForTimeout(400);await p.keyboard.press('ArrowRight');await p.keyboard.press('ArrowRight');
r.menu=await p.evaluate(()=>({mode:STATE.mode,hero:SEL.hero,show:R3.show.k}));
await p.keyboard.press('Enter');await p.waitForTimeout(800);r.enterStarts=await p.evaluate(()=>STATE.mode);
console.log(JSON.stringify(r,null,1));console.log(errs.slice(0,8).join('\n'));
// artifact build: online disabled
await p.close();const pa=await b.newPage();await pa.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());await pa.goto('http://localhost:8765/artifact.html',{waitUntil:'domcontentloaded'});await pa.waitForTimeout(1500);await pa.click('#playSeg button[data-v=online]');await pa.waitForTimeout(300);
console.log('artifact',await pa.evaluate(()=>JSON.stringify({host:document.getElementById('hostBtn').disabled,msg:document.getElementById('netStatus').textContent.slice(0,30)})));
await b.close();})();
