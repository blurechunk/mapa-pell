# Genera la pàgina de selecció de fotos a partir de la guia i d'objectius.py.
# Ús: python3 /home/claude/eines/genera-fotos.py dades.json sortida.html
import sys,json,urllib.parse
sys.path.insert(0,'/home/claude/eines');from objectius import OBJ
d=json.load(open(sys.argv[1]))
us=sorted({urllib.parse.unquote(f['src'].split('/')[-1]).replace('_',' ').removeprefix('File:') for x in d['fitxes'].values() for f in x['fotos']})
obj=[{"f":f,"p":p,"t":t,"q":q,"v":v,"c":c} for f,p,t,q,v,c in OBJ]
J=lambda o:json.dumps(o,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
dades=f"const OBJ={J(obj)};\nconst GRUPS={J(d['grups'])};\nconst FX={J(d['fitxes'])};\nconst USADES=new Set({J(us)});"
s=open('/home/claude/eines/fotos-seleccio.tpl.html').read().replace('/*DADES*/',dades,1)
open(sys.argv[2],'w').write(s);print(sys.argv[2],len(s)//1024,'kB ·',len(obj),'objectius ·',len(us),'fotos usades')
