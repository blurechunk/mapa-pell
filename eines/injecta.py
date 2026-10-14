# Injecta (o reinjecta) la capa de revisió a /home/claude/mapa-pell.html.
# Ús: python3 /home/claude/rv/injecta.py
import re
p = '/home/claude/mapa-pell.html'
s = open(p, encoding='utf-8').read()
css = open('/home/claude/rv/rv.css', encoding='utf-8').read()
js = open('/home/claude/rv/rv.js', encoding='utf-8').read()

# 1. Bloc de revisió (estil + script), sempre just abans del tancament del document
s = re.sub(r'\n?<!--RV:INICI-->.*?<!--RV:FI-->\n?', '\n', s, flags=re.S)
blk = '<!--RV:INICI-->\n<style>\n' + css + '</style>\n<script>\n' + js + '</script>\n<!--RV:FI-->\n'
k = s.rindex('</body>') if '</body>' in s else len(s)
s = s[:k].rstrip('\n') + '\n' + blk + s[k:]

# 2. Constant CANVIS al bloc de dades (resolucions de les propostes)
if '\nconst CANVIS=' not in s:
    s = s.replace('<script>\n/*DATA*/\n', '<script>\n/*DATA*/\nconst CANVIS={\n};\n', 1)

# 3. El glossari no ha d'actuar dins de la interfície de revisió
old = '.lbox,.gl,[contenteditable],.ty>b";'
if old in s and '.ty>b,.rv-ui";' not in s:
    s = s.replace(old, '.lbox,.gl,[contenteditable],.ty>b,.rv-ui";', 1)

open(p, 'w', encoding='utf-8').write(s)
print('injectat', len(s) // 1024, 'kB')
