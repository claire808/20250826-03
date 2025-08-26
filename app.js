
// v4.5 — auto camera, no start prompt. TW UI. All features enabled.
const COLORS=[
  {name:'橙 Orange', value:'#FF7A00'},
  {name:'黑 Deep Black', value:'#111111'},
  {name:'奶黃 Cream Yellow', value:'#FFE9A8'},
  {name:'粉 Pink', value:'#FF7FB0'},
  {name:'香檳米 Champagne', value:'#F7E7CE'},
  {name:'苔綠 Moss', value:'#597D4A'},
  {name:'酒紅 Burgundy', value:'#7F1D2D'},
  {name:'天藍 Sky', value:'#86C5FF'}
];
const STYLES=[
  {id:'moon-rabbit', name:'Moon Rabbit'},
  {id:'clean-fit',  name:'Clean Fit'},
  {id:'twill',      name:'Twill'},
  {id:'racing',     name:'Racing'},
  {id:'sports',     name:'Sports'},
  {id:'mountain',   name:'Mountain'},
  {id:'ballet',     name:'Ballet Girl'},
  {id:'y2k',        name:'Y2K'}
];
let S={facingMode:'user',beautyOn:true,bubblesOn:true,bandColor:COLORS[0].value,styleId:'moon-rabbit',customText:'ECI SPORTS',textSize:36,textWeight:700,loopText:true};
const $=id=>document.getElementById(id);
const V=$('video'), O=$('overlay'), CTX=O.getContext('2d'), ERR=$('errorBanner');
function err(m){ ERR.textContent=m; ERR.classList.remove('hidden'); }

// UI
(function(){
  const colorDot=$('colorDot'), sw=$('colorSwatches'), gal=$('styleGallery');
  const segBtns=[...document.querySelectorAll('.seg-btn')], tabs=[...document.querySelectorAll('.tab')];
  const tIn=$('customText'), tSize=$('textSize'), tW=$('textWeight'), loop=$('loopText');
  const bty=$('beautyToggle'), ar=$('arToggle'), help=$('help');
  const setColor=c=>{S.bandColor=c;colorDot.style.background=c}; setColor(S.bandColor);
  COLORS.forEach(c=>{const b=document.createElement('button'); b.title=c.name; b.style.background=c.value; b.onclick=()=>setColor(c.value); sw.appendChild(b)});
  STYLES.forEach(s=>{const b=document.createElement('button'); b.innerHTML=`<span>${s.name}</span>`; b.onclick=()=>S.styleId=s.id; gal.appendChild(b)});
  segBtns.forEach(btn=>btn.onclick=()=>{segBtns.forEach(x=>x.classList.remove('active')); tabs.forEach(x=>x.classList.remove('active')); btn.classList.add('active'); $('tab-'+btn.dataset.tab).classList.add('active')});
  tIn.value=S.customText; tSize.value=S.textSize; tW.value=S.textWeight; loop.checked=S.loopText;
  tIn.oninput=e=>S.customText=e.target.value; tSize.oninput=e=>S.textSize=parseInt(e.target.value,10); tW.oninput=e=>S.textWeight=parseInt(e.target.value,10); loop.onchange=e=>S.loopText=e.target.checked;
  bty.onclick=()=>{S.beautyOn=!S.beautyOn; bty.classList.toggle('on',S.beautyOn); applyBeauty()};
  ar.onclick=()=>{S.bubblesOn=!S.bubblesOn; ar.classList.toggle('on',S.bubblesOn)};
  $('helpBtn').onclick=()=>help.classList.remove('hidden'); $('closeHelp').onclick=()=>help.classList.add('hidden');
})();
function applyBeauty(){ V.style.filter=S.beautyOn?'brightness(1.06) contrast(1.04) saturate(1.05)':'none'; }

// Camera (auto)
let stream=null;
async function startCamera(){
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ err('此瀏覽器不支援相機。'); return; }
  try{
    if(stream) stream.getTracks().forEach(t=>t.stop());
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:S.facingMode,width:{ideal:1280},height:{ideal:720}},audio:false});
  }catch(e){
    try{ // fallback w/o facingMode
      stream=await navigator.mediaDevices.getUserMedia({video:true,audio:false});
    }catch(e2){
      err('相機啟動失敗，請確認已允許權限，並以 HTTPS 開啟。'); return;
    }
  }
  V.srcObject=stream;
  await V.play();
  resize(); applyBeauty();
}
$('flipBtn').onclick=async()=>{ S.facingMode=S.facingMode==='user'?'environment':'user'; await startCamera(); };
function resize(){ O.width=V.videoWidth||O.clientWidth; O.height=V.videoHeight||O.clientHeight; }
addEventListener('resize', resize);

// FaceMesh
let results=null;
const FM=new FaceMesh.FaceMesh({locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`});
FM.setOptions({maxNumFaces:1,refineLandmarks:true,minDetectionConfidence:.5,minTrackingConfidence:.5});
FM.onResults(r=>results=r);
async function tickFM(){ if(!V.videoWidth){ requestAnimationFrame(tickFM); return; } try{ await FM.send({image:V}); }catch(e){} requestAnimationFrame(tickFM); }

// Helpers
function px(pt){ return {x:pt.x*O.width, y:pt.y*O.height}; }
function rr(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath(); }
function shade(hex,a){ let c=hex.replace('#',''); if(c.length===3)c=c.split('').map(x=>x+x).join(''); let n=parseInt(c,16),r=(n>>16)+a,g=(n>>8&255)+a,b=(n&255)+a; r=Math.min(255,Math.max(0,r)); g=Math.min(255,Math.max(0,g)); b=Math.min(255,Math.max(0,b)); return '#'+(r<<16|g<<8|b).toString(16).padStart(6,'0'); }
function pattern(style,base){ const p=document.createElement('canvas'); p.width=128; p.height=64; const c=p.getContext('2d');
  switch(style){
    case'moon-rabbit': c.fillStyle=shade(base,-30); c.fillRect(0,0,128,64); c.fillStyle='rgba(255,255,255,.25)'; for(let i=0;i<60;i++){ c.beginPath(); c.arc(Math.random()*128,Math.random()*64,Math.random()*1.2+0.6,0,Math.PI*2); c.fill(); } c.fillStyle='rgba(255,220,120,.9)'; c.beginPath(); c.arc(98,18,10,0,Math.PI*2); c.fill(); c.fillStyle='rgba(255,255,255,.7)'; c.beginPath(); c.arc(108,18,6,0,Math.PI*2); c.fill(); break;
    case'clean-fit': c.fillStyle=shade(base,-10); c.fillRect(0,0,128,64); c.fillStyle='rgba(255,255,255,.7)'; c.fillRect(0,30,128,4); break;
    case'twill': c.fillStyle=shade(base,-15); c.fillRect(0,0,128,64); c.strokeStyle='rgba(255,255,255,.35)'; c.lineWidth=2; for(let x=-64;x<192;x+=8){ c.beginPath(); c.moveTo(x,0); c.lineTo(x+64,64); c.stroke(); } break;
    case'racing': c.fillStyle=shade(base,-20); c.fillRect(0,0,128,64); c.fillStyle='rgba(255,255,255,.95)'; c.fillRect(56,0,6,64); c.fillRect(70,0,6,64); break;
    case'sports': c.fillStyle=shade(base,-15); c.fillRect(0,0,128,64); c.fillStyle='rgba(255,255,255,.35)'; for(let y=6;y<64;y+=10){ for(let x=6;x<128;x+=10){ c.beginPath(); c.arc(x,y,2.3,0,Math.PI*2); c.fill(); } } break;
    case'mountain': c.fillStyle=shade(base,-25); c.fillRect(0,0,128,64); c.fillStyle='rgba(255,255,255,.75)'; c.beginPath(); c.moveTo(12,48); c.lineTo(36,18); c.lineTo(60,48); c.closePath(); c.fill(); c.beginPath(); c.moveTo(60,48); c.lineTo(88,28); c.lineTo(112,48); c.closePath(); c.fill(); break;
    case'ballet': c.fillStyle=shade(base,-12); c.fillRect(0,0,128,64); c.strokeStyle='rgba(255,255,255,.85)'; c.lineWidth=4; c.beginPath(); c.moveTo(30,32); c.quadraticCurveTo(12,8,30,12); c.moveTo(30,32); c.quadraticCurveTo(48,8,30,12); c.moveTo(98,32); c.quadraticCurveTo(80,8,98,12); c.moveTo(98,32); c.quadraticCurveTo(116,8,98,12); c.stroke(); break;
    case'y2k': c.fillStyle=shade(base,-18); c.fillRect(0,0,128,64); c.fillStyle='rgba(255,255,255,.85)'; [[24,16,7],[60,12,5],[92,22,6],[114,8,4]].forEach(([cx,cy,r])=>{ c.beginPath(); for(let i=0;i<8;i++){ const a=(Math.PI*2*i)/8, rr=i%2?r*0.45:r, x=cx+Math.cos(a)*rr, y=cy+Math.sin(a)*rr; i?c.lineTo(x,y):c.moveTo(x,y); } c.closePath(); c.fill(); }); break;
  } return p; }
function drawBand(rect){ const {x,y,w,h,angle}=rect; CTX.save(); CTX.translate(x,y); CTX.rotate(angle);
  CTX.fillStyle=S.bandColor; rr(CTX,-w/2,-h/2,w,h,Math.min(h/2,22)); CTX.fill();
  const p=CTX.createPattern(pattern(S.styleId,S.bandColor),'repeat'); CTX.globalAlpha=.88; CTX.fillStyle=p; rr(CTX,-w/2,-h/2,w,h,Math.min(h/2,22)); CTX.fill(); CTX.globalAlpha=1;
  CTX.fillStyle='#fff'; CTX.strokeStyle='rgba(0,0,0,.25)'; CTX.lineWidth=4; CTX.font=`${S.textWeight} ${S.textSize}px Inter, system-ui, -apple-system, 'Noto Sans TC'`; CTX.textAlign='center';
  if(S.customText){ if(S.loopText){ const sp=CTX.measureText(S.customText+'   ').width, n=Math.ceil(w/sp)+2, t=(Date.now()/600)%1; for(let i=-1;i<n;i++){ const tx=-w/2 + i*sp + (1-t)*sp; CTX.strokeText(S.customText,tx,10); CTX.fillText(S.customText,tx,10);} } else { CTX.strokeText(S.customText,0,10); CTX.fillText(S.customText,0,10); } }
  CTX.restore(); }

// Bubbles
const logo=new Image(); logo.src='assets/eci-logo.png'; const bubbles=[]; let lastB=0;
function spawn(x,y){ const r=12+Math.random()*14; bubbles.push({x,y,r,a:1,vy:-(1.2+Math.random()*1.2),vx:(Math.random()-.5)*0.6,rot:Math.random()*Math.PI}); }
function drawB(){ for(let i=bubbles.length-1;i>=0;i--){ const b=bubbles[i]; b.x+=b.vx; b.y+=b.vy; b.a-=.012; b.r*=1.003; if(b.a<=0){ bubbles.splice(i,1); continue; }
  CTX.save(); CTX.globalAlpha=Math.max(0,b.a); CTX.beginPath(); CTX.arc(b.x,b.y,b.r,0,Math.PI*2); CTX.fillStyle='rgba(255,255,255,.18)'; CTX.fill();
  if(logo.complete && logo.width>0){ const s=b.r*1.5; CTX.save(); CTX.translate(b.x,b.y); CTX.rotate(b.rot); CTX.drawImage(logo,-s/2,-s/2,s,s); CTX.restore(); }
  else { CTX.fillStyle='rgba(50,50,200,.95)'; CTX.font='bold 10px Inter, system-ui, -apple-system'; CTX.textAlign='center'; CTX.fillText('ECI', b.x, b.y+3); }
  CTX.restore(); }}

// Render loop
function render(){
  CTX.clearRect(0,0,O.width,O.height);
  if(results && results.multiFaceLandmarks && results.multiFaceLandmarks.length){
    const lm=results.multiFaceLandmarks[0];
    const L=px(lm[127]), R=px(lm[356]), C={x:(L.x+R.x)/2,y:(L.y+R.y)/2};
    const W=Math.hypot(R.x-L.x,R.y-L.y), A=Math.atan2(R.y-L.y,R.x-L.x);
    const bw=W*1.55, bh=Math.max(28,W*0.22), off=-W*0.22;
    const rect={x:C.x+Math.cos(A-Math.PI/2)*(-off), y:C.y+Math.sin(A-Math.PI/2)*(-off), w:bw, h:bh, angle:A};
    drawBand(rect);
    const top=px(lm[13]), bot=px(lm[14]); const mouth=Math.hypot(top.x-bot.x,top.y-bot.y)/W; const now=Date.now();
    if(S.bubblesOn && mouth>0.065 && now-lastB>110){ spawn((top.x+bot.x)/2,(top.y+bot.y)/2); lastB=now; }
  }
  drawB(); requestAnimationFrame(render);
}

// Capture
const preview=$('preview'), img=$('previewImg'), dl=$('dlBtn'), share=$('shareBtn'), closeP=$('closePreview');
$('shutterBtn').onclick=()=>{ const w=O.width,h=O.height,c=document.createElement('canvas'); c.width=w;c.height=h; const ctx=c.getContext('2d'); if(S.beautyOn){ ctx.filter='brightness(1.06) contrast(1.04) saturate(1.05) blur(0.4px)'; } ctx.drawImage(V,0,0,w,h); ctx.filter='none'; ctx.drawImage(O,0,0,w,h); const url=c.toDataURL('image/png'); img.src=url; dl.href=url; preview.classList.remove('hidden'); };
closeP.onclick=()=>preview.classList.add('hidden');
share.onclick=async()=>{ try{ const res=await fetch(img.src); const blob=await res.blob(); const file=new File([blob],'headband.png',{type:'image/png'}); if(navigator.canShare && navigator.canShare({files:[file]})) await navigator.share({files:[file],title:'Headband'}); else alert('此瀏覽器不支援分享，請點下載'); }catch(e){ alert('分享失敗，請先下載圖片'); } };

// Boot — auto start everything
(async()=>{
  await startCamera();     // 自動開相機
  tickFM();                // 臉部偵測
  render();                // 繪圖
})();

