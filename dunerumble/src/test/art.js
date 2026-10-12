const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const pa=await b.newPage();const errs=[];pa.on('pageerror',e=>errs.push(e.message));
await pa.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());
await pa.goto('http://localhost:8765/artifact.html',{waitUntil:'domcontentloaded'});await pa.waitForTimeout(2500);await pa.click('#playSeg button[data-v=online]');await pa.waitForTimeout(300);
console.log('artifact',await pa.evaluate(()=>JSON.stringify({host:document.getElementById('hostBtn').disabled,start:document.getElementById('startBtn').disabled,msg:document.getElementById('netStatus').textContent.slice(0,40),doctype:!!document.doctype})),errs);
await b.close();})();
