/* ============ تنبيهات بتظهر على الشاشة ============
   كل دقيقة تقريبًا (والصفحة قدام الموظف) بنسأل السيرفر سؤال خفيف: فيه إشعارات جديدة؟
   أي إشعار جديد بيظهر في كارت في جنب الشاشة لحد ما الموظف يفتحه أو يقفله. ومش بيظهر تاني بعد كده. */
const PP_ICON={ready:'tasks',approval:'cal',request:'cal',leave:'cal',project:'folder',note:'brief',blocker:'flag',brief:'brief',pulse:'chart',task:'todo',review:'todo',returned:'warn',done:'todo',comment:'brief',meeting:'meet',launch:'trend',autoout:'warn',helper:'users'};
S.pp=[];
function ppKey(){ return 'erp_pp_'+(S.user?S.user.username:''); }
function ppSeen(){ try{ return JSON.parse(load(ppKey())||'{}')||{}; }catch(e){ return {}; } }
function ppMark(ids){ const s=ppSeen(); ids.forEach(id=>{ s[id]=Date.now(); }); const keep={}; Object.keys(s).sort((a,b)=>s[b]-s[a]).slice(0,300).forEach(k=>{ keep[k]=s[k]; }); store(ppKey(),JSON.stringify(keep)); }
async function ppCheck(){
  if(!S.token || !S.user || gated() || document.visibilityState!=='visible') return;
  try{
    const since=Date.now()-2*864e5;   // آخر يومين بس (اللي حصل وإنت مش موجود)
    const r=await call('notifPeek',{since});
    if(r.unread!=null && r.unread!==S.unread){ S.unread=r.unread; renderBell(); }
    const seen=ppSeen();
    let fresh=(r.list||[]).filter(n=>!seen[n.id] && !S.pp.some(x=>x.id===n.id));
    if(!fresh.length) return;
    // استلام مشروع جديد: كارت كبير في نص الشاشة بدل الركن
    const big=fresh.filter(npIs); if(big.length){ ppMark(big.map(n=>n.id)); S.npQ=(S.npQ||[]).concat(big); npShow(); }
    fresh=fresh.filter(n=>!npIs(n));
    // دورك دلوقتي / اتضافت تساعد: كارت في نص الشاشة (لو مقفول من الإعدادات بيروح للركن زي الأول)
    const turn=fresh.filter(tcIs); if(turn.length) tcTake(turn);
    fresh=fresh.filter(n=>!tcIs(n));
    if(!fresh.length) return;
    S.pp=fresh.concat(S.pp).slice(0,8);
    ppMark(fresh.map(n=>n.id));
    ppRender();
    if(S.view==='desk' && S.cache.desk) S.cache.desk=null;
  }catch(e){}
}
function ppRender(){
  let box=$('ppBox'); if(!box){ box=document.createElement('div'); box.id='ppBox'; box.className='pp-box'; box.setAttribute('role','region'); box.setAttribute('aria-label','New notifications'); box.setAttribute('aria-live','polite'); document.body.appendChild(box); }
  if(!S.pp.length){ box.innerHTML=''; return; }
  const show=S.pp.slice(0,3), more=S.pp.length-show.length;
  box.innerHTML=show.map((n,i)=>`<div class="pp-card${n.type==='ready'?' ready':''}">
      <span class="pp-ic">${ico(PP_ICON[n.type]||'bell',18)}</span>
      <div class="pp-tx"><b>${bd(n.title)}</b><span>${bd(n.detail||'')}</span>
        <div class="pp-act">${n.go?`<button class="btn small primary" onclick="ppOpen(${i})">${n.type==='ready'?'Open task':'Open'}</button>`:''}<button class="btn small ghost" onclick="ppClose(${i})">Dismiss</button></div></div>
      <button class="pp-x" onclick="ppClose(${i})" aria-label="Close">✕</button></div>`).join('')
    +(more?`<button class="pp-more" onclick="ppAll()">+${more} more · open notifications</button>`:'');
}
function ppDrop(i,read){ const n=S.pp[i]; if(!n) return null; S.pp.splice(i,1); ppRender();
  if(read){ call('notifRead',{ids:[n.id]}).then(r=>{ S.unread=r.unread; renderBell(); }).catch(()=>{}); }
  return n; }
function ppOpen(i){ const n=ppDrop(i,true); if(!n||!n.go) return; if(n.go.view==='briefs') go('briefs',{id:n.go.brief}); else goTo(n.go); }
function ppClose(i){ ppDrop(i,false); }
function ppAll(){ S.pp=[]; ppRender(); loadNotifs(); openBell(); }
(function(){
  const loop=()=>{ setTimeout(()=>{ ppCheck(); loop(); }, 55000+Math.floor(Math.random()*15000)); };
  loop();
  setTimeout(ppCheck, 4000);   // بعد ما الموقع يفتح على طول: اللي حصل وإنت مش موجود
  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') setTimeout(ppCheck,800); });
})();

/* ----- استلمت مشروع جديد: كارت في نص الشاشة (واحد ورا التاني لو أكتر من مشروع) ----- */
function npIs(n){ return n && n.type==='project' && /^(You were added to |You are the Account Manager of )/.test(String(n.title||'')); }
function npShow(){
  if($('npCard')||!(S.npQ||[]).length || VA_TAB) return;
  const n=S.npQ[0], am=/^You are the Account Manager of /.test(n.title), name=String(n.title).replace(/^(You were added to |You are the Account Manager of )/,'');
  const parts=String(n.detail||'').split(' · ');
  const c=document.createElement('div'); c.id='npCard'; c.className='np-wrap';
  c.innerHTML=`<div class="np-card" role="alertdialog" aria-label="New project"><div class="np-top">🎉</div>
    <h2 dir="rtl">${am?'بقيت الـ Account Manager لمشروع جديد':'استلمت مشروع جديد'}</h2>
    <div class="np-name" ${bdd(name)}>${esc(name)}</div>
    <div class="np-meta">${parts.map(p=>`<span>${bd(p)}</span>`).join('')}</div>
    ${S.npQ.length>1?`<div class="muted" style="font-size:12.5px;margin-top:6px">+${S.npQ.length-1} more</div>`:''}
    <div class="np-act"><button class="btn ghost" onclick="npLater()">Later</button><button class="btn primary" onclick="npOpen()">Open project →</button></div></div>`;
  document.body.appendChild(c);
}
function npNext(read){ const n=(S.npQ||[]).shift(); const c=$('npCard'); if(c) c.remove();
  if(n && read) call('notifRead',{ids:[n.id]}).then(r=>{ S.unread=r.unread; renderBell(); }).catch(()=>{});
  return n; }
function npOpen(){ const n=npNext(true); S.npQ=[]; if(n&&n.go) goTo(n.go); }
function npLater(){ npNext(false); setTimeout(npShow,250); }

/* ----- دورك دلوقتي (تاسك كان مستني تاسك تانية وخلصت) + اتضافت تساعد في تاسك: كارت في نص الشاشة ----- */
// "بعدين" بيأجّله 30 دقيقة. لو التاسك بدأت خلاص الكارت مابيظهرش. مش وقت البريك. أكتر من واحد = كارت واحد فيه لستة.
function tcIs(n){ return n && n.go && n.go.tk && ((n.type==='ready' && S.cfg.rdCard!==false) || (n.type==='helper' && S.cfg.hpCard!==false)); }
function tcSnz(){ try{ return JSON.parse(load('erp_tc_snz_'+(S.user?S.user.username:''))||'{}')||{}; }catch(e){ return {}; } }
function tcSnzSet(ids,until){ const s=tcSnz(), now=Date.now(); Object.keys(s).forEach(k=>{ if(s[k]<now) delete s[k]; }); ids.forEach(id=>{ s[id]=until; }); store('erp_tc_snz_'+(S.user?S.user.username:''),JSON.stringify(s)); }
function tcTake(list){
  const snz=tcSnz(), now=Date.now();
  // بدأها خلاص: تتعلّم مقروءة من غير ما تظهر
  const started=list.filter(n=>n.started); if(started.length) ppMark(started.map(n=>n.id));
  S.tcQ=(S.tcQ||[]).filter(q=>!started.some(n=>n.id===q.id));
  list.filter(n=>!n.started && !(snz[n.id]>now) && !(S.tcQ||[]).some(q=>q.id===n.id)).forEach(n=>(S.tcQ=S.tcQ||[]).push(n));
  tcShow();
}
function tcAgo(at){ const m=Math.max(0,Math.round((Date.now()-at)/6e4)); if(m<1) return 'دلوقتي'; if(m<60) return 'من '+m+' دقيقة'; const h=Math.round(m/60); if(h<24) return 'من '+h+(h===1?' ساعة':' ساعات'); const d=Math.round(h/24); return 'من '+d+(d===1?' يوم':' أيام'); }
function tcHand(h){
  if(!h) return '';
  const parts=String(h).split(/(https?:\/\/[^\s<>"']+)/g);
  const html=parts.map((p,i)=>i%2?`<div>🔗 <a href="${esc(p)}" target="_blank" rel="noopener noreferrer" dir="ltr">${esc(p.replace(/^https?:\/\//,'').slice(0,60))}</a></div>`:(p.trim()?`<div ${bdd(p)} style="white-space:pre-line">${esc(p.trim())}</div>`:'')).join('');
  return `<div class="tc-hand"><div class="muted" style="font-size:12px;margin-bottom:4px">التسليم</div>${html}</div>`;
}
function tcShow(){
  if($('npCard')||$('tcCard')||VA_TAB||!(S.tcQ||[]).length) return;
  if(S.status && S.status.onBreak) return;
  if($('modalRoot') && $('modalRoot').innerHTML.trim()) return;   // فيه فورم مفتوحة: نستنى
  const L=S.tcQ, c=document.createElement('div'); c.id='tcCard'; c.className='np-wrap';
  const kind=n=>n.type==='helper'?'🤝 اتضافت تساعد':'🚀 دورك';
  if(L.length===1){
    const n=L[0], g=n.go, help=n.type==='helper';
    c.innerHTML=`<div class="np-card tc-card" role="alertdialog" aria-label="${help?'Added as helper':'Your turn'}"><div class="np-top">${help?'🤝':'🚀'}</div>
      <h2 dir="rtl">${help?'اتضافت تساعد في تاسك':'دورك دلوقتي'}</h2>
      <div class="np-name" dir="auto">${esc(g.tt||'')}</div>
      <div class="np-meta"><span ${bdd(g.pj||'')}>${esc(g.pj||'')}</span>${g.id?`<span dir="ltr">${esc(g.id)}</span>`:''}</div>
      <div style="margin-top:12px;font-size:13.5px" dir="rtl"><b>${esc(g.by||'')}</b> ${help?'ضافك':'خلّص <b dir="auto">'+esc(g.from||'')+'</b>'} ${tcAgo(n.at)}</div>
      ${help?'':tcHand(g.h)}
      <div class="np-act"><button class="btn ghost" onclick="tcLater()">بعدين</button><button class="btn primary" onclick="tcOpen('${esc(n.id)}')">افتح التاسك ←</button></div></div>`;
  } else {
    c.innerHTML=`<div class="np-card tc-card" style="width:min(500px,100%)" role="alertdialog" aria-label="Your tasks"><div class="np-top">🚀</div>
      <h2 dir="rtl">${L.length} تاسكات مستنياك</h2>
      <div class="tc-list">${L.slice(0,6).map(n=>`<div class="tc-row"><div style="flex:1;min-width:0"><span class="tc-k">${kind(n)}</span> <b dir="auto">${esc(n.go.tt||'')}</b> <span class="muted" ${bdd(n.go.pj||'')}>· ${esc(n.go.pj||'')}</span>
        <div class="muted" style="font-size:12.5px" dir="rtl">${esc(n.go.by||'')} ${n.type==='helper'?'ضافك':'خلّص '+esc(n.go.from||'')} ${tcAgo(n.at)}</div></div><button class="btn small primary" onclick="tcOpen('${esc(n.id)}')">افتح</button></div>`).join('')}</div>
      ${L.length>6?`<div class="muted" style="font-size:12.5px;margin-top:6px">+${L.length-6} more</div>`:''}
      <div class="np-act"><button class="btn ghost" onclick="tcLater()">بعدين</button><button class="btn primary" onclick="tcAll()">My Tasks ←</button></div></div>`;
  }
  document.body.appendChild(c);
}
function tcDone(ids){
  ppMark(ids); S.tcQ=(S.tcQ||[]).filter(q=>ids.indexOf(q.id)<0);
  const c=$('tcCard'); if(c) c.remove();
  call('notifRead',{ids}).then(r=>{ S.unread=r.unread; renderBell(); }).catch(()=>{});
}
function tcOpen(id){ const n=(S.tcQ||[]).find(q=>q.id===id); tcDone([id]); if(n&&n.go) goTo({view:n.go.view,id:n.go.id}); setTimeout(tcShow,600); }
function tcAll(){ tcDone((S.tcQ||[]).map(q=>q.id)); go('mytasks'); }
function tcLater(){ tcSnzSet((S.tcQ||[]).map(q=>q.id),Date.now()+30*6e4); S.tcQ=[]; const c=$('tcCard'); if(c) c.remove(); }
