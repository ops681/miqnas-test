/* ============ هوية الشركة + قص الصور ============
   اللوجو والاسم بيتغيروا من Settings وبيظهروا عند الكل (القايمة، الدخول، أيقونة التاب، التقارير).
   بيتخزنوا في البراوزر، وبيتجابوا تاني بس لما رقم النسخة (brv) يتغير. */
S.brand={ver:'',name:'',logo:''};
try{ const c=JSON.parse(load('erp_brand')||'null'); if(c) S.brand=c; }catch(e){}
function brandName(){ return S.brand.name||'Miqnas'; }
// علامة الشركة (للقايمة والتقارير): اللوجو لو موجود، وإلا M
function brandMark(sub){
  return S.brand.logo
    ? `<img class="logo-img" src="${esc(S.brand.logo)}" alt="">${esc(brandName())}${sub?` <span>${esc(sub)}</span>`:''}`
    : `<i>M</i>${esc(brandName())}${sub?` <span>${esc(sub)}</span>`:''}`;
}
function applyBrand(){
  document.querySelectorAll('#loginView .logo, #side .logo').forEach(el=>{ el.innerHTML=brandMark('ERP'); });
  const ico=S.brand.logo||'icons/icon-192.png';
  let l=document.querySelector('link[rel="icon"]'); if(!l){ l=document.createElement('link'); l.rel='icon'; document.head.appendChild(l); } l.removeAttribute('sizes'); l.href=ico;
  let a=document.querySelector('link[rel="apple-touch-icon"]'); if(a&&S.brand.logo) a.href=S.brand.logo;
}
async function brandSync(ver){
  if(ver!==undefined && ver===S.brand.ver) return;
  try{ const r=await call('brand'); S.brand={ver:r.ver,name:r.name||'',logo:r.logo||''}; try{ store('erp_brand',JSON.stringify(S.brand)); }catch(e){} applyBrand(); }catch(e){}
}
(function(){ const run=()=>{ applyBrand(); if(!S.brand.ver) brandSync(); }; if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run(); })();

/* ----- قص الصور: دايرة أو مربع، سحب + تكبير، أو «الصورة كاملة» ----- */
// بترجع data URL (أو null لو اتلغت). round=دايرة (صور الموظفين)، size=مقاس الناتج
function imgCrop(file,opt){
  opt=opt||{}; const size=opt.size||256, round=opt.round!==false, prevHTML=$('modalRoot').innerHTML;
  return new Promise((resolve)=>{
    const url=URL.createObjectURL(file), img=new Image();
    img.onerror=()=>{ URL.revokeObjectURL(url); resolve(null); toast('مش قادر أقرا الصورة دي. جرّب صورة تانية'); };
    img.onload=()=>{
      const V=260; // حجم المعاينة
      const cover=Math.max(V/img.width,V/img.height), contain=Math.min(V/img.width,V/img.height);
      let z=cover, x=0, y=0, bg=opt.bg||'#ffffff';
      $('modalRoot').innerHTML=`<div class="modal"><div class="card" style="max-width:420px">
        <h2 style="margin:0 0 4px">${esc(opt.title||'Adjust the photo')}</h2><div class="muted" style="font-size:13px;margin-bottom:12px">Drag to move it, use the slider to zoom.</div>
        <div class="crop-box${round?' round':''}" id="cpBox" style="width:${V}px;height:${V}px"><canvas id="cpCv" width="${V*2}" height="${V*2}" style="width:${V}px;height:${V}px"></canvas></div>
        <div class="row" style="gap:10px;align-items:center;margin-top:12px"><span class="muted" aria-hidden="true">−</span><input type="range" id="cpZ" min="${Math.min(contain,cover)*0.6}" max="${cover*4}" step="0.001" value="${z}" style="flex:1" aria-label="Zoom"><span class="muted" aria-hidden="true">+</span></div>
        <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn ghost small" id="cpFit">Whole photo</button><button class="btn ghost small" id="cpFill">Fill the ${round?'circle':'box'}</button></div>
        <div class="mfoot"><button class="btn ghost" id="cpNo">Cancel</button><div class="spacer"></div><button class="btn primary" id="cpOk">Use photo</button></div></div></div>`;
      const cv=$('cpCv'), ctx=cv.getContext('2d');
      const clamp=()=>{ const mx=Math.abs(img.width*z-V)/2, my=Math.abs(img.height*z-V)/2; x=Math.max(-mx,Math.min(mx,x)); y=Math.max(-my,Math.min(my,y)); };
      const draw=c=>{ const s=c.width/V, g=c.getContext('2d'); g.fillStyle=bg; g.fillRect(0,0,c.width,c.height);
        const w=img.width*z*s, h=img.height*z*s; g.drawImage(img,(c.width-w)/2+x*s,(c.height-h)/2+y*s,w,h); };
      const paint=()=>{ clamp(); draw(cv); };
      paint();
      let drag=null;
      const box=$('cpBox');
      box.onpointerdown=e=>{ drag={x:e.clientX,y:e.clientY,ox:x,oy:y}; box.setPointerCapture(e.pointerId); };
      box.onpointermove=e=>{ if(!drag) return; x=drag.ox+(e.clientX-drag.x); y=drag.oy+(e.clientY-drag.y); paint(); };
      box.onpointerup=box.onpointercancel=()=>{ drag=null; };
      box.onwheel=e=>{ e.preventDefault(); z=Math.max(+$('cpZ').min,Math.min(+$('cpZ').max,z*(e.deltaY<0?1.06:0.94))); $('cpZ').value=z; paint(); };
      $('cpZ').oninput=()=>{ z=+$('cpZ').value; paint(); };
      $('cpFit').onclick=()=>{ z=contain; x=0; y=0; $('cpZ').value=z; paint(); };
      $('cpFill').onclick=()=>{ z=cover; x=0; y=0; $('cpZ').value=z; paint(); };
      const done=v=>{ URL.revokeObjectURL(url); $('modalRoot').innerHTML=prevHTML; resolve(v); };
      $('cpNo').onclick=()=>done(null);
      $('cpOk').onclick=()=>{ const out=document.createElement('canvas'); out.width=out.height=size; draw(out);
        let q=0.88, d=out.toDataURL('image/jpeg',q); while(d.length>(opt.maxLen||60000) && q>0.4){ q-=0.12; d=out.toDataURL('image/jpeg',q); } done(d); };
    };
    img.src=url;
  });
}
// تصغير لوجو من غير قص (بيحافظ على الشفافية)
function imgShrink(file,max){
  max=max||256;
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file), img=new Image();
    img.onerror=()=>{ URL.revokeObjectURL(url); reject(new Error('bad image')); };
    img.onload=()=>{ const k=Math.min(1,max/Math.max(img.width,img.height)), c=document.createElement('canvas'); c.width=Math.max(1,Math.round(img.width*k)); c.height=Math.max(1,Math.round(img.height*k));
      c.getContext('2d').drawImage(img,0,0,c.width,c.height); URL.revokeObjectURL(url);
      let d=c.toDataURL('image/png'); if(d.length>90000) d=c.toDataURL('image/webp',0.9); if(d.length>90000) d=c.toDataURL('image/jpeg',0.85); resolve(d); };
    img.src=url;
  });
}
