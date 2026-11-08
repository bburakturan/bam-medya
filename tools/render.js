// BAM Teknoloji Reels renderer: node render.js '<json>'
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path'); const { execSync } = require('child_process');
const cfg = JSON.parse(process.argv[2]);
const W = 1080, H = 1920, FPS = 30, DUR = 10;
const logo = 'data:image/png;base64,' + fs.readFileSync(cfg.logo).toString('base64');
const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
const lines = cfg.title.split('|').map((l,i)=>`<div class="tl" style="animation-delay:${1.0+i*0.32}s">${esc(l)}</div>`).join('');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:#000}
#s{position:absolute;inset:0;background:linear-gradient(180deg,#505050 0%,#4B4B4B 45%,#3F3F3F 100%);animation:fin .6s ease-out both}
#s:after{content:"";position:absolute;inset:0;background:radial-gradient(1200px 900px at 85% 10%,rgba(59,130,196,.10),transparent 60%)}
#mini{position:absolute;left:100px;top:150px;width:170px;animation:fin .8s .3s ease-out both}
#bar{position:absolute;left:100px;top:700px;height:10px;width:130px;background:#3B82C4;transform-origin:left;animation:grow .7s .4s cubic-bezier(.2,.8,.2,1) both}
#tw{position:absolute;left:100px;top:760px;width:880px}
.tl{font:700 92px/1.12 Poppins,sans-serif;color:#fff;letter-spacing:-1px;opacity:0;animation:up .7s cubic-bezier(.2,.8,.2,1) both}
#sub{margin-top:44px;font:500 46px/1.38 Inter,sans-serif;color:rgba(255,255,255,.78);animation:fin .8s 2.6s ease-out both}
#main{position:absolute;inset:0;animation:fout .5s 6.6s ease-in both}
#end{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
#big{width:620px;opacity:0;animation:pop .9s 7.1s cubic-bezier(.2,.8,.2,1) both}
#url{margin-top:60px;font:500 44px Inter,sans-serif;color:#fff;letter-spacing:2px;opacity:0;animation:fin .6s 8.0s ease-out both}
#line{margin-top:28px;height:6px;width:0;background:#3B82C4;animation:wid .6s 8.2s ease-out both}
@keyframes fin{from{opacity:0}to{opacity:1}}
@keyframes fout{from{opacity:1}to{opacity:0}}
@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes up{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
@keyframes pop{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:none}}
@keyframes wid{from{width:0}to{width:180px}}
</style></head><body><div id="s"></div>
<div id="main"><img id="mini" src="${logo}"><div id="bar"></div><div id="tw">${lines}<div id="sub">${esc(cfg.sub)}</div></div></div>
<div id="end"><img id="big" src="${logo}"><div id="url">bamteknoloji.com</div><div id="line"></div></div>
</body></html>`;
(async () => {
  const dir = fs.mkdtempSync('/tmp/frames-');
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.setContent(html); await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => document.getAnimations().forEach(a => a.pause()));
  for (let f = 0; f < FPS * DUR; f++) {
    const t = f * 1000 / FPS;
    await p.evaluate(t => document.getAnimations().forEach(a => a.currentTime = t), t);
    await p.screenshot({ path: path.join(dir, String(f).padStart(4, '0') + '.png') });
  }
  await b.close();
  execSync(`ffmpeg -y -loglevel error -framerate ${FPS} -i ${dir}/%04d.png -f lavfi -i anullsrc=r=44100:cl=stereo -shortest -c:v libx264 -preset veryfast -pix_fmt yuv420p -crf 18 -c:a aac -b:a 128k -movflags +faststart "${cfg.out}"`);
  fs.rmSync(dir, { recursive: true, force: true }); console.log('ok ' + cfg.out);
})();