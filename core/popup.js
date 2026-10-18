/* ============ تنبيهات بتظهر على الشاشة ============
   كل دقيقة تقريبًا (والصفحة قدام الموظف) بنسأل السيرفر سؤال خفيف: فيه إشعارات جديدة؟
   أي إشعار جديد بيظهر في كارت في جنب الشاشة لحد ما الموظف يفتحه أو يقفله. ومش بيظهر تاني بعد كده. */
const PP_ICON={ready:'tasks',approval:'cal',request:'cal',leave:'cal',project:'folder',note:'brief',blocker:'flag',brief:'brief',pulse:'chart',task:'todo',review:'todo',returned:'warn',done:'todo',comment:'brief',meeting:'meet',launch:'trend',autoout:'warn'};
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
