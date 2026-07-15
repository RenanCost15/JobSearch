import fs from 'node:fs/promises';
const data=JSON.parse(await fs.readFile(new URL('../data/companies.json',import.meta.url),'utf8'));
const urls=[...new Set(data.map(x=>x.sourceUrl).filter(x=>/^https?:/.test(x||'')))];
const timeout=12000;async function check(url){const ctrl=new AbortController();const t=setTimeout(()=>ctrl.abort(),timeout);try{let r=await fetch(url,{method:'HEAD',redirect:'follow',signal:ctrl.signal,headers:{'user-agent':'JobSearch-LinkCheck/1.0'}});if([403,405,429].includes(r.status))r=await fetch(url,{method:'GET',redirect:'follow',signal:ctrl.signal,headers:{'user-agent':'JobSearch-LinkCheck/1.0'}});return{url,status:r.status,ok:r.status>=200&&r.status<400||[401,403,429].includes(r.status)}}catch(e){return{url,status:0,ok:false,error:e.name}}finally{clearTimeout(t)}}
const results=[];for(let i=0;i<urls.length;i+=8)results.push(...await Promise.all(urls.slice(i,i+8).map(check)));
const bad=results.filter(x=>!x.ok),warnings=results.filter(x=>[401,403,429].includes(x.status));
let md=`# JobSearch — relatório semanal de links\n\nData: ${new Date().toISOString()}\n\n- URLs verificadas: ${results.length}\n- Falhas: ${bad.length}\n- Bloqueios/avisos: ${warnings.length}\n\n`;
if(bad.length)md+='## Links que precisam de revisão\n'+bad.map(x=>`- ${x.url} — status ${x.status||x.error}`).join('\n')+'\n';else md+='Nenhuma falha crítica detectada.\n';
await fs.writeFile('link-report.json',JSON.stringify({generatedAt:new Date().toISOString(),results},null,2));await fs.writeFile('link-report.md',md);console.log(md);if(bad.length)process.exitCode=1;
