const fs=require('fs');const h=fs.readFileSync('/home/claude/mapa-pell.html','utf8');
const g=n=>eval('('+h.match(new RegExp('const '+n+'=(\\{[\\s\\S]*?\\n\\});'))[1]+')');
const T=g('TYP');const D=g('D');
for(const id of process.argv.slice(2)){console.log('=====',id,D[id].n,'| f:',D[id].f,'m:',D[id].m);console.log('q:',D[id].q);console.log('x:',D[id].x);
const t=T[id];if(t){console.log('TYP t:',t.t,'lab:',JSON.stringify(t.lab));t.r.forEach((r,i)=>console.log(' ',i,JSON.stringify(r)));for(const k of ['hd','lk','no','nl','main','tag'])if(t[k])console.log(' ',k,JSON.stringify(t[k]));}
for(const k of Object.keys(D[id]))if(!['n','q','x'].includes(k))console.log(' D.'+k,JSON.stringify(D[id][k]).slice(0,600));}
