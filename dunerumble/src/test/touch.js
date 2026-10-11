const {chromium}=require('playwright');const OUT=process.env.OUT;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const res=[];
for(const [w,h,tag] of [[1194,834,'land'],[834,1194,'port']]){
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:true,deviceScaleFactor:1});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8765/test.html');await p.waitForTimeout(2000);
 await p.screenshot({path:`${OUT}/t_menu_${tag}.png`});
 const touch=await p.evaluate(()=>IS_TOUCH);
 await p.tap('#startBtn');await p.waitForTimeout(1200);
 await p.evaluate(()=>{window.__dbg.god=true});
 const cdp=await ctx.newCDPSession(p);
 const T=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts});
 const me0=await p.evaluate(()=>({x:STATE.me.x,z:STATE.me.z,ammo:STATE.me.ammo}));
 // drag move stick right for ~1.2s, and simultaneously drag the attack stick up then release
 const ax=w-34-66, ay=h-34-66;
 await T('touchStart',[{x:200,y:h-200,id:1}]);
 for(let i=1;i<=6;i++){await T('touchMove',[{x:200+i*10,y:h-200,id:1}]);await p.waitForTimeout(30);}
 await T('touchStart',[{x:260,y:h-200,id:1},{x:ax,y:ay,id:2}]);
 for(let i=1;i<=5;i++){await T('touchMove',[{x:260,y:h-200,id:1},{x:ax,y:ay-i*14,id:2}]);await p.waitForTimeout(40);}
 await p.screenshot({path:`${OUT}/t_aim_${tag}.png`});
 await T('touchEnd',[{x:260,y:h-200,id:1}]);
 await p.waitForTimeout(600);
 await T('touchEnd',[]);
 await p.waitForTimeout(300);
 const me1=await p.evaluate(()=>({x:STATE.me.x,z:STATE.me.z,ammo:STATE.me.ammo,atk:STATE.me.atkSeq}));
 // tap attack stick: auto aim
 await p.tap('#atkStick');await p.waitForTimeout(400);
 const me2=await p.evaluate(()=>({atk:STATE.me.atkSeq}));
 res.push({tag,touch,me0,me1,me2,errs:errs.slice(0,5)});
 await p.screenshot({path:`${OUT}/t_play_${tag}.png`});
 await ctx.close();
}
console.log(JSON.stringify(res,null,1));await b.close();})();
