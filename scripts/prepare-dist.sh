#!/usr/bin/env bash
set -euo pipefail

rm -rf dist
mkdir -p dist/audio dist/image dist/image_small

cp index.html p02.html p03.html p04.html p05.html p06.html dist/
cp reset.css style.css nextpage_style.css page3.css page3.js page4.css page4.js page5.css page5.js page6.css page6.js dist/
cp favicon-32x32.png dist/
cp -r image/* dist/image/
cp -r image_small/* dist/image_small/

for file in audio/*.mp3; do
  name="$(basename "$file")"
  size=$(stat -c%s "$file")
  if [ "$size" -gt 5000000 ]; then
    ffmpeg -y -i "$file" -b:a 96k "dist/audio/$name" >/dev/null 2>&1
  else
    cp "$file" "dist/audio/$name"
  fi
done
