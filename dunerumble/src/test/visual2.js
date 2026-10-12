const {chromium}=require('playwright');const OUT=process.env.OUT;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());
await p.goto('http://localhost:8765/test.html');await p.waitForTimeout(1500);
await p.evaluate(()=>{window.__dbg.god=true;SEL.hero=3;SEL.mode='solo';startGame({seed:31,theme:'dusk',mode:'solo',diff:1,roster: rosterFor(SEL.mode, localHumans(), false)});});
await p.waitForTimeout(700);await p.screenshot({path:OUT+'/w_start.png'});
// late game with gas: AI drives me, fast-forward, then clear fx so screenshot is representative
await p.evaluate(()=>{STATE.me.isBot=true;for(let i=0;i<60*95&&!G.over;i++)stepGame(1/60);PT.list.length=0;PT.addList.length=0;OV.nums.length=0;STATE.me.isBot=false;STATE.me.inp.mx=STATE.me.inp.mz=0;});
await p.waitForTimeout(1500);await p.screenshot({path:OUT+'/w_gas.png'});
// megabomb in flight
await p.evaluate(()=>{const me=STATE.me;me.alive=true;me.hp=me.mhp;me.sup=1;me.inp.sup=true;me.inp.aim=-0.6;me.inp.tx=me.x+5;me.inp.tz=me.z-3;});
await p.waitForTimeout(450);await p.screenshot({path:OUT+'/w_bomb.png'});
await p.waitForTimeout(900);await p.screenshot({path:OUT+'/w_boom.png'});
console.log(JSON.stringify(await p.evaluate(()=>({t:G.t,gasR:G.gasR,alive:G.alive.size,err:window.__dbg.err}))),errs);
await b.close();})();
