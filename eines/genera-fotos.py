# Genera la pàgina de selecció de fotos a partir de la guia i d'objectius.py.
# Ús: python3 /home/claude/eines/genera-fotos.py dades.json sortida.html
import sys,json,urllib.parse
sys.path.insert(0,'/home/claude/eines');from objectius import OBJ,GLOS_OBJ
d=json.load(open(sys.argv[1]))
us=sorted({urllib.parse.unquote(u.split('/')[-1]).replace('_',' ').removeprefix('File:') for u in [f['src'] for x in d['fitxes'].values() for f in x['fotos']]+d.get('gimg',[])})
obj=[{"f":f,"p":p,"t":t,"q":q,"v":v,"c":c} for f,p,t,q,v,c in OBJ]
GK={g['k']:g['t'] for g in d['glos']};FX=dict(d['fitxes']);gids=[]
for k,t,q,v,c,fx in GLOS_OBJ:
    nou=fx is not None;fx=fx or d['glosUs'].get(k,[])
    assert nou or k in GK,k
    assert len(fx)>1,(k,fx)
    gid='glos:'+k;gids.append(gid)
    FX[gid]={"n":t,"agr":False,"formes":[],"fotos":[],"glos":k,"nou":nou,"apareix":[d['fitxes'][i]['n'] for i in fx]}
    obj.append({"f":gid,"p":t,"t":"G","q":q,"v":v,"c":c})
grups=[{"g":"glos","n":"Glossari · surten en més d'una fitxa","ids":gids}]+d['grups']
J=lambda o:json.dumps(o,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
dades=f"const OBJ={J(obj)};\nconst GRUPS={J(grups)};\nconst FX={J(FX)};\nconst USADES=new Set({J(us)});"
s=open('/home/claude/eines/fotos-seleccio.tpl.html').read().replace('/*DADES*/',dades,1)
open(sys.argv[2],'w').write(s);print(sys.argv[2],len(s)//1024,'kB ·',len(obj),'objectius ·',len(gids),'de glossari ·',len(us),'fotos usades')
