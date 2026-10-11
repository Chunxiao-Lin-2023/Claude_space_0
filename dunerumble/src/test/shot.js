const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1500,height:560}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push(m.text())});
for(const [q,f] of process.argv.slice(2).map(s=>s.split('@'))){await p.goto('file://'+__dirname+'/preview.html?'+q);await p.waitForFunction('window.done',{timeout:30000}).catch(()=>{});await p.screenshot({path:f});}
console.log(errs.slice(0,10).join('\n'));await b.close();})();
