/* ============ تنبيهات بتظهر على الشاشة ============
   كل دقيقة تقريبًا (والصفحة قدام الموظف) بنسأل السيرفر سؤال خفيف: فيه إشعارات جديدة؟
   أي إشعار جديد بيظهر في كارت في جنب الشاشة لحد ما الموظف يفتحه أو يقفله. ومش بيظهر تاني بعد كده. */
const PP_ICON={ready:'tasks',approval:'cal',request:'cal',leave:'cal',project:'folder',note:'brief',blocker:'flag',brief:'brief',pulse:'chart',task:'todo',review:'todo',returned:'warn',done:'todo',comment:'brief',meeting:'meet',launch:'trend',autoout:'warn',helper:'users',thanks:'trend'};
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
    // المتجر اتعمله Launch: كارت شكر للفريق
    const thx=fresh.filter(lcIs); if(thx.length){ thx.forEach(n=>{ if(!(S.lcQ||[]).some(q=>q.id===n.id)) (S.lcQ=S.lcQ||[]).push(n); }); lcShow(); }
    fresh=fresh.filter(n=>!lcIs(n));
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
  if($('npCard')||$('tcCard')||$('lcCard')||!(S.npQ||[]).length || VA_TAB) return;   // كارت واحد في نص الشاشة في المرة
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
function npOpen(){ const n=npNext(true); S.npQ=[]; if(n&&n.go) goTo(n.go); setTimeout(tcShow,600); }
function npLater(){ npNext(false); setTimeout(()=>{ npShow(); tcShow(); },250); }

/* ----- دورك دلوقتي (تاسك كان مستني تاسك تانية وخلصت) + اتضافت تساعد في تاسك: كارت في نص الشاشة ----- */
// "بعدين" بيأجّله 30 دقيقة. لو التاسك بدأت خلاص الكارت مابيظهرش. مش وقت البريك. أكتر من واحد = كارت واحد فيه لستة.
function tcIs(n){ return n && n.go && ((n.go.tk && ((n.type==='ready' && S.cfg.rdCard!==false) || (n.type==='helper' && S.cfg.hpCard!==false)))
  || (n.go.gt && TC_GT[n.go.gt] && S.cfg.gtCard!==false)); }
// كروت التاسكات الجانبية: كل نوع بإيموجي وعنوان
const TC_GT={assign:['📌','اتعملك Assign في تاسك جانبي','Assign'],help:['🤝','اتضفت تساعد في تاسك جانبي','بتساعد'],ready:['🔓','التاسك اتفتحتلك، تقدر تبدأ','اتفتحت'],review:['🔍','تاسك جانبي مستني مراجعتك','مراجعة'],returned:['↩️','التاسك رجعتلك بملاحظة','رجعت']};
function tcInfo(n){
  const g=n.go||{}, by=`<b>${esc(g.by||'')}</b>`;
  if(g.gt && TC_GT[g.gt]){ const k=TC_GT[g.gt];
    const line={assign:by+' اداهالك',help:by+' ضافك',ready:by+' خلّص <b dir="auto">'+esc(g.from||'')+'</b>',review:by+' خلّصها',returned:by+' رجّعها'}[g.gt];
    return {emo:k[0],h:k[1],kind:k[2],line,note:g.gt==='review'||g.gt==='returned'?g.note:'',bad:g.gt==='returned'}; }
  return n.type==='helper'?{emo:'🤝',h:'اتضافت تساعد في تاسك',kind:'اتضافت تساعد',line:by+' ضافك',hand:false}:{emo:'🚀',h:'دورك دلوقتي',kind:'دورك',line:by+' خلّص <b dir="auto">'+esc(g.from||'')+'</b>',hand:true};
}
function tcNote(t,bad){ return t?`<div class="tc-hand"${bad?' style="border-color:var(--bad)"':''}><div class="muted" style="font-size:12px;margin-bottom:4px">${bad?'الملاحظة':'ملاحظة'}</div><div ${bdd(t)} style="white-space:pre-line">${esc(t)}</div></div>`:''; }
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
  if($('npCard')||$('tcCard')||$('lcCard')||VA_TAB||!(S.tcQ||[]).length) return;
  if(S.status && S.status.onBreak) return;
  if($('modalRoot') && $('modalRoot').innerHTML.trim()) return;   // فيه فورم مفتوحة: نستنى
  const L=S.tcQ, c=document.createElement('div'); c.id='tcCard'; c.className='np-wrap';
  if(L.length===1){
    const n=L[0], g=n.go, f=tcInfo(n);
    const meta=[g.pj?`<span ${bdd(g.pj)}>📁 ${esc(g.pj)}</span>`:'', g.gt?'':(g.id?`<span dir="ltr">${esc(g.id)}</span>`:''), g.gt&&g.due?`<span dir="rtl">الديدلاين ${esc(typeof fmtD==="function"?fmtD(g.due):g.due)}</span>`:''].filter(Boolean).join('');
    c.innerHTML=`<div class="np-card tc-card" role="alertdialog" aria-label="${esc(f.h)}"><div class="np-top">${f.emo}</div>
      <h2 dir="rtl">${f.h}</h2>
      <div class="np-name" dir="auto">${esc(g.tt||'')}</div>
      ${meta?`<div class="np-meta">${meta}</div>`:''}
      <div style="margin-top:12px;font-size:13.5px" dir="rtl">${f.line} ${tcAgo(n.at)}</div>
      ${f.hand?tcHand(g.h):''}${tcNote(f.note,f.bad)}
      <div class="np-act"><button class="btn ghost" onclick="tcLater()">بعدين</button>${g.gt&&g.pid?`<button class="btn ghost" onclick="tcProj('${esc(n.id)}')">📁 افتح المشروع</button>`:''}<button class="btn primary" onclick="tcOpen('${esc(n.id)}')">افتح التاسك ←</button></div></div>`;
  } else {
    const emos=[...new Set(L.map(n=>tcInfo(n).emo))].slice(0,3).join('');
    c.innerHTML=`<div class="np-card tc-card" style="width:min(500px,100%)" role="alertdialog" aria-label="Your tasks"><div class="np-top">${emos}</div>
      <h2 dir="rtl">${L.length} تاسكات مستنياك</h2>
      <div class="tc-list">${L.slice(0,6).map(n=>{ const f=tcInfo(n); return `<div class="tc-row"><span class="tc-emo" aria-hidden="true">${f.emo}</span><div style="flex:1;min-width:0"><span class="tc-k">${esc(f.kind)}</span> <b dir="auto">${esc(n.go.tt||'')}</b>${n.go.pj?` <span class="muted" ${bdd(n.go.pj)}>· ${esc(n.go.pj)}</span>`:''}
        <div class="muted" style="font-size:12.5px" dir="rtl">${f.line} ${tcAgo(n.at)}</div></div><button class="btn small primary" onclick="tcOpen('${esc(n.id)}')">افتح</button></div>`; }).join('')}</div>
      ${L.length>6?`<div class="muted" style="font-size:12.5px;margin-top:6px">+${L.length-6} more</div>`:''}
      <div class="np-act"><button class="btn ghost" onclick="tcLater()">بعدين</button><button class="btn primary" onclick="tcAll()">${L.every(n=>n.go.gt)?'Tasks ←':'My Tasks ←'}</button></div></div>`;
  }
  document.body.appendChild(c);
}
function tcProj(id){ const n=(S.tcQ||[]).find(q=>q.id===id); tcDone([id]); if(n&&n.go&&n.go.pid) goTo({view:'project',id:n.go.pid}); setTimeout(()=>{ tcShow(); npShow(); },600); }
function tcDone(ids){
  ppMark(ids); S.tcQ=(S.tcQ||[]).filter(q=>ids.indexOf(q.id)<0);
  const c=$('tcCard'); if(c) c.remove();
  call('notifRead',{ids}).then(r=>{ S.unread=r.unread; renderBell(); }).catch(()=>{});
}
function tcOpen(id){ const n=(S.tcQ||[]).find(q=>q.id===id); tcDone([id]); if(n&&n.go) goTo({view:n.go.view,id:n.go.id}); setTimeout(()=>{ tcShow(); npShow(); },600); }
function tcAll(){ const gt=(S.tcQ||[]).every(q=>q.go&&q.go.gt); tcDone((S.tcQ||[]).map(q=>q.id)); go(gt?'tasks':'mytasks'); setTimeout(npShow,600); }
function tcLater(){ tcSnzSet((S.tcQ||[]).map(q=>q.id),Date.now()+30*6e4); S.tcQ=[]; const c=$('tcCard'); if(c) c.remove(); setTimeout(()=>{ npShow(); lcShow(); },250); }

/* ----- المتجر اتعمله Launch: كارت شكر للي اشتغلوا عليه (الرسالة والتوقيع من Settings) ----- */
function lcIs(n){ return n && n.type==='thanks' && n.go && S.cfg.lcOn!==false; }
function lcShow(){
  if($('npCard')||$('tcCard')||$('lcCard')||VA_TAB||!(S.lcQ||[]).length) return;
  if(S.status && S.status.onBreak) return;
  if($('modalRoot') && $('modalRoot').innerHTML.trim()) return;
  const n=S.lcQ[0], g=n.go||{}, first=String((S.user&&S.user.name)||'').split(' ')[0];
  const msg=String(S.cfg.lcMsg||'شكراً يا {الاسم} على مجهودك 🙏\n{المتجر} اتعمله Launch النهارده، والفضل ليك وللفريق.');
  const html=esc(msg).replace(/\{الاسم\}/g,esc(first)).replace(/\{المتجر\}/g,`<b style="color:var(--brand2)">${esc(g.pj||'')}</b>`).split('\n');
  const url=String(g.url||''), href=url?(/^https?:/.test(url)?url:'https://'+url):'';
  const conf=Array.from({length:60},(_,i)=>`<i style="left:${(i*37)%100}%;background:${['#F08A4B','#2BB39A','#7FB3F5','#F2C14E','#C792EA','#F07171'][i%6]};animation-delay:${(i%12)*0.06}s;animation-duration:${1.6+(i%5)*0.25}s;transform:rotate(${i*47%360}deg)"></i>`).join('');
  const c=document.createElement('div'); c.id='lcCard'; c.className='np-wrap';
  c.innerHTML=`<div class="lc-conf" aria-hidden="true">${conf}</div>
    <div class="np-card" role="alertdialog" aria-label="Store launched" style="position:relative">
      <div class="np-top">🎉</div>
      <h2 dir="rtl" style="font-size:20px">${html[0]||''}</h2>
      ${html.slice(1).map(l=>`<div dir="rtl" style="font-size:14.5px;line-height:1.8">${l}</div>`).join('')}
      ${href?`<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" dir="ltr" style="display:inline-block;margin-top:6px;font-size:13px">${esc(url.replace(/^https?:\/\//,'').replace(/\/$/,''))} ↗</a>`:''}
      ${(g.team||[]).length?`<div class="muted" style="font-size:12.5px;margin-top:14px">الفريق</div><div class="lc-team">${g.team.map(t=>`<span class="av" data-u="${esc(t.u)}" title="${esc(t.n)}">${esc(initials(t.n))}</span>`).join('')}</div>`:''}
      ${S.cfg.lcSign?`<div class="muted" style="font-size:12.5px;margin-top:12px" dir="rtl">— ${esc(S.cfg.lcSign)}</div>`:''}
      <div class="np-act">${href?`<button class="btn ghost" onclick="lcDone('${esc(href)}')">افتح المتجر ↗</button>`:''}<button class="btn primary" onclick="lcDone()">شكراً 🙌</button></div></div>`;
  document.body.appendChild(c);
  if(typeof avApply==='function') avApply(c);
}
function lcDone(href){
  const n=(S.lcQ||[]).shift(); const c=$('lcCard'); if(c) c.remove();
  if(n){ ppMark([n.id]); call('notifRead',{ids:[n.id]}).then(r=>{ S.unread=r.unread; renderBell(); }).catch(()=>{}); }
  if(href) window.open(href,'_blank','noopener');
  setTimeout(()=>{ lcShow(); tcShow(); npShow(); },400);
}
