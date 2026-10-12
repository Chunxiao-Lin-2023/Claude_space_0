// headless sim: run full matches without rendering, report outcome and errors
const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:800,height:500}});const errs=[];
p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load/.test(m.text()))errs.push('CONSOLE '+m.text().slice(0,300))});
await p.goto('http://localhost:8765/test.html');await p.waitForTimeout(1500);
for(const mode of (process.env.MODES||'solo,duo').split(',')) for(let r=0;r<(+process.env.RUNS||2);r++){
 const res=await p.evaluate(([mode,diff])=>{
  SEL.mode=mode;SEL.diff=diff;SEL.hero=PLAYABLE[Math.floor(Math.random()*PLAYABLE.length)];startGame({seed:(Math.random()*1e9)|0,theme:pickTheme(),mode,diff,roster: rosterFor(SEL.mode, localHumans(), false)});
  const me=STATE.me;me.isBot=true;me.human=0; // let AI drive the human slot too
  const log=[];let firstKill=null;const t0=performance.now();
  for(let i=0;i<60*240&&!G.over;i++){stepGame(1/60); if(firstKill==null&&G.ents.some(e=>!e.alive))firstKill=G.t.toFixed(1);}
  const boxes=M.boxes.filter(b=>b.hp<=0).length;
  return {mode,t:G.t.toFixed(1),over:G.over,winner:G.winner,firstKill,boxesBroken:boxes+'/'+M.boxes.length,walls:G.destroyed.length,ms:Math.round(performance.now()-t0),
   ents:G.ents.map(e=>`${e.name}/${e.H.k}/t${e.team}:${e.alive?'A':'D'} k${e.kills} c${e.cubes} d${Math.round(e.dmg)} r${G.placement[e.team]}`)};
 },[mode,+(process.env.DIFF||1)]);
 console.log(JSON.stringify(res));
 await p.evaluate(()=>quitToMenu());
}
console.log(errs.slice(0,10).join('\n'));await b.close();})();
