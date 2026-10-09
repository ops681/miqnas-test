/* ============ اختيار شخص (بحث + أقسام + الضغط الحالي) ============
   بيتركب فوق <select> عادي: الـ select بيفضل موجود ومخفي وقيمته هي اللي بتتحفظ،
   والزرار بيفتح قايمة فيها بحث بالاسم أو الوظيفة، الناس متقسمة بالقسم،
   وجنب كل واحد عدد المشاريع الشغالة معاه ولو هو إجازة النهارده. */
function pickify(sel, people){
  if(!sel || sel.dataset.pk) return;
  sel.dataset.pk='1'; sel.style.display='none';
  const info={}; (people||[]).forEach(p=>{ info[p.u]=p; });
  const btn=document.createElement('button'); btn.type='button'; btn.className='pk-btn';
  sel.after(btn); sel._pk={btn,info};
  btn.onclick=e=>{ e.preventDefault(); pkOpen(sel); };
  sel.addEventListener('change',()=>pkSync(sel));
  pkSync(sel);
}
function pkSync(sel){
  if(!sel||!sel._pk) return;
  const o=sel.options[sel.selectedIndex], v=sel.value, p=sel._pk.info[v];
  const name=p?p.name:(o?o.textContent.split(' · ')[0]:'');
  sel._pk.btn.innerHTML=v
    ? `<span class="av" data-u="${esc(v)}">${esc(initials(name))}</span><span class="pk-t"><b>${bd(name)}</b><small>${esc(p?[p.job,p.dept].filter(Boolean).join(' · '):'')}</small></span>${p&&p.leave?'<span class="pk-leave">On leave</span>':''}<span class="pk-car">▾</span>`
    : `<span class="pk-ph">${esc(o?o.textContent:'Select...')}</span><span class="pk-car">▾</span>`;
  sel._pk.btn.classList.toggle('empty',!v);
}
function pkSyncAll(root){ (root||document).querySelectorAll('select[data-pk]').forEach(pkSync); }
function pkClose(){ const p=document.getElementById('pkPop'); if(p) p.remove(); document.removeEventListener('mousedown',pkOut,true); }
function pkOut(e){ const p=document.getElementById('pkPop'); if(p && !p.contains(e.target) && !e.target.closest('.pk-btn')) pkClose(); }
function pkOpen(sel){
  pkClose();
  const info=sel._pk.info, blank=[...sel.options].find(o=>!o.value);
  const items=[...sel.options].filter(o=>o.value).map(o=>{ const p=info[o.value]||{}; return { u:o.value, name:p.name||o.textContent.split(' · ')[0], job:p.job||o.textContent.split(' · ')[1]||'', dept:p.dept||'Other', active:p.active, leave:!!p.leave }; });
  const pop=document.createElement('div'); pop.id='pkPop'; pop.className='pk-pop';
  pop.innerHTML=`<input class="pk-q" placeholder="Search name, job or department..." autocomplete="off"><div class="pk-list"></div>`;
  document.body.appendChild(pop);
  const r=sel._pk.btn.getBoundingClientRect(), mob=window.innerWidth<640;
  if(mob){ pop.classList.add('pk-sheet'); }
  else { pop.style.width=Math.max(320,r.width)+'px'; pop.style.left=Math.min(r.left, window.innerWidth-Math.max(320,r.width)-12)+'px';
    const below=window.innerHeight-r.bottom; if(below<300 && r.top>below){ pop.style.bottom=(window.innerHeight-r.top+4)+'px'; } else pop.style.top=(r.bottom+4)+'px'; }
  const q=pop.querySelector('.pk-q'), L=pop.querySelector('.pk-list'); let hi=0, flat=[];
  const draw=()=>{
    const t=q.value.trim().toLowerCase();
    const f=items.filter(x=>!t||[x.name,x.job,x.dept,x.u].some(s=>String(s||'').toLowerCase().indexOf(t)>=0));
    const groups={}; f.forEach(x=>{ (groups[x.dept]||(groups[x.dept]=[])).push(x); });
    flat=[]; let h='';
    if(blank && !t){ flat.push(''); h+=`<div class="pk-row pk-none" data-i="0">${esc(blank.textContent)}</div>`; }
    Object.keys(groups).sort((a,b)=>a==='Other'?1:b==='Other'?-1:a.localeCompare(b)).forEach(g=>{
      h+=`<div class="pk-g">${esc(g)} <span>${groups[g].length}</span></div>`;
      groups[g].sort((a,b)=>(a.leave-b.leave)||((a.active||0)-(b.active||0))||a.name.localeCompare(b.name)).forEach(x=>{
        const i=flat.length; flat.push(x.u);
        h+=`<div class="pk-row${x.u===sel.value?' on':''}" data-i="${i}"><span class="av" data-u="${esc(x.u)}">${esc(initials(x.name))}</span>
          <span class="pk-t"><b>${bd(x.name)}</b><small>${esc(x.job)}</small></span>
          ${x.leave?'<span class="pk-leave">On leave</span>':''}${x.active===undefined?'':`<span class="pk-load${x.active>=4?' hi':''}">${x.active} ${x.active===1?'project':'projects'}</span>`}</div>`;
      });
    });
    L.innerHTML=h||'<div class="pk-emp">No one matches</div>';
    hi=Math.min(hi,Math.max(0,flat.length-1)); mark();
  };
  const mark=()=>{ L.querySelectorAll('.pk-row').forEach(e=>e.classList.toggle('hi',+e.dataset.i===hi)); const e=L.querySelector('.pk-row.hi'); if(e) e.scrollIntoView({block:'nearest'}); };
  const pick=i=>{ if(i<0||i>=flat.length) return; sel.value=flat[i]; sel.dispatchEvent(new Event('change',{bubbles:true})); pkClose(); sel._pk.btn.focus(); };
  L.onclick=e=>{ const row=e.target.closest('.pk-row'); if(row) pick(+row.dataset.i); };
  q.oninput=()=>{ hi=0; draw(); };
  q.onkeydown=e=>{ if(e.key==='ArrowDown'){ hi=Math.min(flat.length-1,hi+1); mark(); e.preventDefault(); } else if(e.key==='ArrowUp'){ hi=Math.max(0,hi-1); mark(); e.preventDefault(); } else if(e.key==='Enter'){ pick(hi); e.preventDefault(); } else if(e.key==='Escape'){ pkClose(); } };
  draw(); const cur=flat.indexOf(sel.value); if(cur>=0){ hi=cur; mark(); }
  setTimeout(()=>{ document.addEventListener('mousedown',pkOut,true); if(!mob) q.focus(); },0);
}
window.addEventListener('resize',()=>pkClose());
document.addEventListener('scroll',e=>{ const p=document.getElementById('pkPop'); if(p && !p.contains(e.target) && !p.classList.contains('pk-sheet')) pkClose(); },true);
