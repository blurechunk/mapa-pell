# Revisa les fotos (galeries IMG i glossari GIMG): fitxers que falten, sense ús, repetides.
# Ús: python3 /home/claude/eines/fotos.py
import re,json,os,urllib.parse
from collections import Counter
from PIL import Image
h=open('/home/claude/mapa-pell.html').read();E=[]
for c in ('IMG','GIMG'):
    i=h.index('const '+c+'={');j=h.index('\n};',i)
    for m in re.finditer(r'(?m)^(\w+):(\[.*\]),?$',h[i:j]):
        for a in json.loads(m.group(2)): E.append((c+':'+m.group(1),a))
fs=set(f for f in os.listdir('/home/claude/img') if f.endswith('.jpg'));rs=[a[0] for c,a in E]
print('fotos',len(E),'· falten',sorted(set(rs)-fs),'· sense ús',sorted(fs-set(rs)))
print('mateix fitxer',[k for k,v in Counter(rs).items() if v>1])
print('mateixa font',[k for k,v in Counter(urllib.parse.unquote(a[4]) for c,a in E).items() if v>1])
def dh(f,n=12):
    im=Image.open(f).convert('L').resize((n+1,n));px=list(im.getdata())
    return sum(1<<k for k in range(n*n) if px[(k//n)*(n+1)+k%n]>px[(k//n)*(n+1)+k%n+1])
H={f:dh('/home/claude/img/'+f) for f in set(rs) if f in fs};L=list(H)
print('gairebé idèntiques',[(L[x],L[y]) for x in range(len(L)) for y in range(x+1,len(L)) if bin(H[L[x]]^H[L[y]]).count('1')<=12])
