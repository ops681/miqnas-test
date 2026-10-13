/* ============ سيرش في القوايم الطويلة ============
   أي <select> فيه أكتر من SS_MIN اختيار: لما يتفتح بيطلع بدله قايمة فيها سيرش (عربي/إنجليزي/رقم المشروع).
   الـ select نفسه بيفضل زي ما هو وقيمته هي اللي بتتحفظ، فكل الصفحات بتشتغل من غير أي تغيير.
   على الموبايل بتفضل القايمة العادية بتاعة الجهاز. ولو قايمة مش عاوزينها: data-nosearch */
const SS_MIN = 8;
function ssNorm(s){ return String(s||'').toLowerCase().replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/[ً-ْـ]/g,'').replace(/\s+/g,' ').trim(); }
function ssWants(sel){ return sel && sel.tagName==='SELECT' && !sel.multiple && !sel.disabled && !sel.dataset.nosearch && !sel.dataset.pk && sel.options.length>SS_MIN && !(window.matchMedia && matchMedia('(pointer:coarse)').matches); }
function ssClose(){ const p=$('ssPop'); if(p){ const s=p._sel; p.remove(); if(s) try{ s.focus(); }catch(e){} } document.removeEventListener('mousedown',ssOutside,true); window.removeEventListener('resize',ssClose); window.removeEventListener('scroll',ssScroll,true); }
function ssOutside(e){ const p=$('ssPop'); if(p && !p.contains(e.target)) { if(e.target===p._sel){ e.preventDefault(); } ssClose(); } }
function ssScroll(e){ const p=$('ssPop'); if(p && !p.contains(e.target)) ssClose(); }
function ssOpen(sel){
  ssClose();
  const items=[]; let grp='';
  [...sel.children].forEach(ch=>{
    if(ch.tagName==='OPTGROUP'){ [...ch.children].forEach(o=>items.push({o,g:ch.label})); }
    else items.push({o:ch,g:''});
  });
  const p=document.createElement('div'); p.id='ssPop'; p.className='ss-pop'; p._sel=sel;
  p.innerHTML=`<input class="ss-in" type="text" placeholder="🔍 Search..." autocomplete="off" spellcheck="false" dir="auto"><div class="ss-list" role="listbox"></div>`;
  document.body.appendChild(p);
  const r=sel.getBoundingClientRect(), W=Math.max(r.width,280), vw=window.innerWidth, vh=window.innerHeight;
  p.style.width=Math.min(W,vw-16)+'px'; p.style.left=Math.max(8,Math.min(r.left,vw-Math.min(W,vw-16)-8))+'px';
  const below=vh-r.bottom, H=Math.min(380,Math.max(below,r.top)-12);
  if(below>=260 || below>=r.top){ p.style.top=(r.bottom+4)+'px'; } else { p.style.bottom=(vh-r.top+4)+'px'; }
  p.style.maxHeight=Math.max(200,H)+'px';
  const inp=p.querySelector('.ss-in'), list=p.querySelector('.ss-list');
  let shown=[], act=0;
  const draw=()=>{
    const q=ssNorm(inp.value), words=q?q.split(' '):[];
    shown=items.filter(x=>!x.o.disabled && (!words.length || words.every(w=>ssNorm(x.o.textContent+' '+x.o.value+' '+x.g).indexOf(w)>=0)));
    let g=null, h='';
    shown.forEach((x,i)=>{ if(x.g!==g){ g=x.g; if(g) h+=`<div class="ss-g">${esc(g)}</div>`; } h+=`<div class="ss-o${x.o.value===sel.value?' sel':''}${i===act?' act':''}" role="option" data-i="${i}">${x.o.value===sel.value?'✓ ':''}${esc(x.o.textContent).replace(/[\u0600-\u06FF](?:[\u0600-\u06FF\s\d.,،:()\-\/]*[\u0600-\u06FF])?/g,m=>'<bdi>'+m+'</bdi>')}</div>`; });
    list.innerHTML=h||'<div class="ss-none">No matches</div>';
  };
  const pick=i=>{ const x=shown[i]; if(!x) return; const ch=sel.value!==x.o.value; sel.value=x.o.value; ssClose(); if(ch){ sel.dispatchEvent(new Event('input',{bubbles:true})); sel.dispatchEvent(new Event('change',{bubbles:true})); } };
  const mark=()=>{ list.querySelectorAll('.ss-o').forEach(e=>e.classList.toggle('act',+e.dataset.i===act)); const a=list.querySelector('.ss-o.act'); if(a) a.scrollIntoView({block:'nearest'}); };
  act=Math.max(0,items.filter(x=>!x.o.disabled).findIndex(x=>x.o.value===sel.value));
  draw(); mark();
  inp.addEventListener('input',()=>{ act=0; draw(); });
  inp.addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'){ e.preventDefault(); act=Math.min(shown.length-1,act+1); mark(); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); act=Math.max(0,act-1); mark(); }
    else if(e.key==='Enter'){ e.preventDefault(); pick(act); }
    else if(e.key==='Escape'||e.key==='Tab'){ e.preventDefault(); ssClose(); }
  });
  list.addEventListener('mousedown',e=>{ const o=e.target.closest('.ss-o'); if(o){ e.preventDefault(); pick(+o.dataset.i); } });
  list.addEventListener('mousemove',e=>{ const o=e.target.closest('.ss-o'); if(o && +o.dataset.i!==act){ act=+o.dataset.i; mark(); } });
  setTimeout(()=>{ inp.focus(); document.addEventListener('mousedown',ssOutside,true); window.addEventListener('resize',ssClose); window.addEventListener('scroll',ssScroll,true); },0);
}
// بنمسك الضغطة قبل ما القايمة العادية تتفتح
document.addEventListener('mousedown',e=>{ const s=e.target; if(e.button===0 && ssWants(s)){ e.preventDefault(); if($('ssPop') && $('ssPop')._sel===s){ ssClose(); return; } s.focus(); ssOpen(s); } },true);
document.addEventListener('keydown',e=>{ const s=e.target; if(ssWants(s) && !$('ssPop') && (e.key===' '||e.key==='Enter'||(e.altKey&&e.key==='ArrowDown')||e.key==='F4')){ e.preventDefault(); ssOpen(s); } },true);
