#!/bin/bash
# Kullanım: tools/make_reel.sh "Satır 1|Satır 2" "Açıklama" YYYY-AA-GG
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
echo "reels/bam-reels-$D.mp4"
