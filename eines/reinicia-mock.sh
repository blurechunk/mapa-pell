#!/bin/sh
# Reinicia el servidor de prova amb la base de dades buida.
for p in $(ps -eo pid,args | awk '$2=="node" && $3 ~ /mock\.js$/ {print $1}'); do kill $p; done
sleep 0.5
nohup node /home/claude/rv/mock.js 8765 > /dev/null 2>&1 &
sleep 1
