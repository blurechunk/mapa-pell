# Eines per editar mapa-pell.html. Ús: exec(open('/home/claude/eines/mp.py').read()) i després get/setv/dele/rep; al final save().
import json,re
p='/home/claude/mapa-pell.html'; s=open(p).read()
J=lambda o:json.dumps(o,ensure_ascii=False,separators=(',',':'))
def blk(name):
    a=s.index('\nconst '+name+'=')+1
    m=re.compile(r'\n[\}\]];').search(s,a)
    return a,m.start()
def find(name,key):
    a,b=blk(name)
    for pre in (key+':','"'+key+'":'):
        k=s.find('\n'+pre,a,b)
        if k>=0:
            i=k+1; j=s.index('\n',i); return i,j,pre
    return None
def get(name,key):
    i,j,pre=find(name,key); raw=s[i:j]; return json.loads(raw[len(pre):].rstrip(','))
def quoted(name):
    a,b=blk(name); L=s[a:b].split('\n'); return len(L)>1 and L[1].startswith('"')
def setv(name,key,val,after=None):
    """Crea o substitueix l'entrada `key` de la constant `name`."""
    global s
    f=find(name,key); q=quoted(name)
    line=('"%s"'%key if q else key)+':'+J(val)+','
    if f: i,j,_=f; s=s[:i]+line+s[j:]; return
    if after:
        i,j,_=find(name,after); s=s[:j+1]+line+'\n'+s[j+1:]; return
    a,b=blk(name); s=s[:b]+'\n'+line+s[b:]
def dele(name,key):
    global s
    f=find(name,key)
    if f: i,j,_=f; s=s[:i]+s[j+1:]
def rep(a,b,n=1):
    """Substitució literal que ha d'aparèixer exactament n vegades."""
    global s; assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)
def glos_add(entries):
    """Afegeix termes al glossari: [{'k','r','t','d','w'}]."""
    global s
    i=s.index('const GLOS=');j=s.index('\n];',i)
    pre=s[:j].rstrip(); pre+=('' if pre.endswith(',') else ',')
    s=pre+''.join('\n'+json.dumps(x,ensure_ascii=False)+',' for x in entries).rstrip(',')+s[j:]
def fix_commas():
    """Afegeix la coma que falta a la línia anterior a una entrada inserida al final d'un bloc."""
    global s
    L=s.split('\n'); key=re.compile(r'^"?[\w~]+"?:')
    for i in range(1,len(L)):
        if key.match(L[i]) and L[i-1].strip() and not re.search(r'[,\{\[\(]\s*$',L[i-1]) and re.match(r'^"?[\w~]+"?:',L[i-1]): L[i-1]+=','
    s='\n'.join(L)
def save():
    fix_commas(); open(p,'w').write(s); print('desat')
