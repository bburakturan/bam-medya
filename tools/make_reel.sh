#!/bin/bash
# Kullanım: tools/make_reel.sh "Satır 1|Satır 2" "Açıklama" YYYY-AA-GG ["YouTube başlığı" "YouTube açıklaması"]
set -e
cd "$(dirname "$0")/.."
D="$3"; mkdir -p reels
python3 - "$1" "$2" > /tmp/reelcfg.json <<'PY'
import json,sys;print(json.dumps({"title":sys.argv[1],"sub":sys.argv[2],"logo":"tools/logo.png","out":"/tmp/reel_raw.mp4"}))
PY
NODE_PATH=$(npm root -g) node tools/render.js "$(cat /tmp/reelcfg.json)"
python3 tools/beat.py /tmp/reel_beat.wav
ffmpeg -loglevel error -y -i /tmp/reel_raw.mp4 -i /tmp/reel_beat.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "reels/bam-reels-$D.mp4"
ffmpeg -loglevel error -y -ss 3 -i "reels/bam-reels-$D.mp4" -frames:v 1 /tmp/reel_f3.png
ffmpeg -loglevel error -y -ss 8 -i "reels/bam-reels-$D.mp4" -frames:v 1 /tmp/reel_f8.png
python3 - "$D" "$1" "$2" "${4:-}" "${5:-}" > reels/latest.json <<'PY'
import json,sys
d,t,s,yt,yd=sys.argv[1:6]
title=yt or t.replace('|',' ')
title=(title[:90]+' #shorts')
desc=(yd or s)+"\n\nBAM Teknoloji | İstanbul Şişli merkezli kurumsal BT tedarikçisi\nhttps://www.bamteknoloji.com\n0212 993 14 67"
print(json.dumps({"date":d,"file_name":f"bam-reels-{d}.mp4","video_url":f"https://raw.githubusercontent.com/bburakturan/bam-medya/main/reels/bam-reels-{d}.mp4","title":title,"description":desc},ensure_ascii=False,indent=1))
PY
echo "reels/bam-reels-$D.mp4"
