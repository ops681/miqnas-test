/* ============ Knowledge: SOPs + المشاكل ============
   SOPs: طريقة الشغل الموحدة لكل قسم (هيد القسم والإدارة بيكتبوا، والموظف بيقترح تعديل).
   أي SOP بيتنشر أو يتعدّل لازم ناس القسم يدوسوا «قريته».
   المشاكل: أي حد يبلّغ، الهيد يشوف قسمه، والإدارة تشوف الكل + الداشبورد.
   كل الإعدادات من تاب Settings في الصفحة نفسها. */
S.kb={tab:'sops',q:'',dept:'',open:''};
function viewKnowledge(opts){
  opts=opts||{};
  if(opts.tab) S.kb.tab=opts.tab;
  if(opts.id && S.kb.tab!=='problems'){ S.kb.tab='sops'; S.kb.open=opts.id; }
  if(opts.id && S.kb.tab==='problems') S.kb.prOpen=opts.id;
  setTop('Knowledge','SOPs and problems');
  if(S.kb.tab==='problems'||S.kb.tab==='dash') return kbLoadProblems();
  if(S.kb.tab==='settings') return kbRenderSettings();
  swr('kb','kbList',{},r=>{ kbRender(r); if(S.kb.open){ const id=S.kb.open; S.kb.open=''; kbOpen(id); } });
}
function kbTabs(){
  const L=S.cache.kb||{}, pr=S.cache.pr||{};
  const tabs=[['sops','SOPs'],['problems','Problems']];
  if(pr.canDash||L.isAdmin) tabs.push(['dash','Problems dashboard']);
  if(L.isAdmin) tabs.push(['settings','Settings']);
  return `<div class="chips kb-tabs" role="tablist">${tabs.map(t=>`<button role="tab" aria-selected="${S.kb.tab===t[0]}" class="${S.kb.tab===t[0]?'on':''}" onclick="S.kb.tab='${t[0]}';viewKnowledge()">${t[1]}${t[0]==='sops'&&L.unread&&L.unread.length?` <span class="nb" style="position:static;margin-left:4px">${L.unread.length}</span>`:''}</button>`).join('')}</div>`;
}
function kbCanEditDept(d){ const L=S.cache.kb||{}; return L.isAdmin || (L.editDepts||[]).indexOf(d)>=0; }

/* ----- قايمة الـ SOPs ----- */
function kbRender(r){
  S.cache.kb=r;
  const q=S.kb.q.trim().toLowerCase();
  const list=r.sops.filter(s=>(!S.kb.dept||s.dept===S.kb.dept||(S.kb.dept==='_all'&&!s.dept))&&(!q||s.title.toLowerCase().indexOf(q)>=0||s.deptName.toLowerCase().indexOf(q)>=0));
  const canNew=r.isAdmin||(r.editDepts||[]).length>0;
  setTop('Knowledge','SOPs and problems',canNew?`<button class="btn primary" onclick="kbEdit()">+ New SOP</button>`:'');
  const depts=[['','All'],['_all','Company-wide']].concat(r.depts.filter(d=>r.sops.some(s=>s.dept===d.id)).map(d=>[d.id,d.name]));
  const st={published:'',draft:'<span class="pill p-yel">Draft</span>',archived:'<span class="pill p-out">Archived</span>'};
  $('main').innerHTML=`${kbTabs()}
    ${r.unread.length?`<div class="card kb-must"><div class="chead" style="padding:0 0 8px"><h2 style="font-size:15px">Please read (${r.unread.length})</h2><span class="muted" style="font-size:12.5px">New or updated SOPs for your team</span></div>
      ${r.unread.map(s=>`<button class="al" onclick="kbOpen('${esc(s.id)}')"><span style="color:var(--warn)">${ico('brief',18)}</span><span class="tx"><b>${esc(s.title)}</b><span>${esc(s.dept)} · v${s.version}</span></span><span class="pill p-absent">Read now</span></button>`).join('')}</div>`:''}
    <div class="kb-bar"><label class="kb-search">${ico('brief',16)}<input id="kbQ" placeholder="Search SOPs…" value="${esc(S.kb.q)}" oninput="S.kb.q=this.value;kbRender(S.cache.kb);const i=$('kbQ');i.focus();i.setSelectionRange(i.value.length,i.value.length)" aria-label="Search SOPs"></label>
      <div class="chips">${depts.map(d=>`<button class="${S.kb.dept===d[0]?'on':''}" onclick="S.kb.dept='${d[0]}';kbRender(S.cache.kb)">${esc(d[1])}</button>`).join('')}</div></div>
    ${list.length?`<div class="kb-grid">${list.map(s=>`<button type="button" class="card kb-card${s.mustRead&&!s.read?' unread':''}" onclick="kbOpen('${esc(s.id)}')">
      <div class="kb-ch"><span class="pill p-out">${esc(s.deptName)}</span>${st[s.status]||''}${s.mustRead&&!s.read?'<span class="pill p-absent">Not read</span>':''}${s.reviewDue&&s.canEdit?'<span class="pill p-yel">Review due</span>':''}</div>
      <b>${esc(s.title)}</b>
      <span class="muted">v${s.version} · ${esc(s.ownerName)} · updated ${new Date(s.updatedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}${s.taskKeys.length?' · linked to '+s.taskKeys.length+' task'+(s.taskKeys.length>1?'s':''):''}</span></button>`).join('')}</div>`
    :`<div class="card empty"><b>${r.sops.length?'Nothing matches':'No SOPs yet'}</b>${r.sops.length?'Try another word or team.':(canNew?'Write the first one with “+ New SOP”.':'Your team leads will add them here.')}</div>`}`;
}

/* ----- عرض SOP ----- */
async function kbOpen(id,ver){
  $('modalRoot').innerHTML=`<div class="modal"><div class="card" style="max-width:760px">${LOADING}</div></div>`;
  try{
    const s=await call('kbGet',{id}); S.kbCur=s;
    let body=s.body, vnote='';
    if(ver){ const v=await call('kbVersion',{id,version:ver}); body=v.body; vnote=`<div class="notice" style="margin-bottom:10px">You are looking at version ${v.version} from ${new Date(v.at).toLocaleDateString('en-GB')}. <button class="btn ghost small" onclick="kbOpen('${esc(id)}')">Back to current</button></div>`; }
    const must=s.mustRead&&!s.read;
    $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card kb-view" style="max-width:760px">
      <div class="kb-ch"><span class="pill p-out">${esc(s.deptName)}</span><span class="muted" style="font-size:12.5px">v${s.version} · owner ${esc(s.ownerName)} · updated ${new Date(s.updatedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}${s.updatedByName&&s.updatedByName!==s.ownerName?' by '+esc(s.updatedByName):''}</span>${s.status!=='published'?`<span class="pill p-yel">${esc(s.status)}</span>`:''}</div>
      <h2 style="margin:8px 0 4px">${esc(s.title)}</h2>
      ${vnote}
      ${body.intro?`<p class="kb-intro" dir="auto">${esc(body.intro).replace(/\n/g,'<br>')}</p>`:''}
      <ol class="kb-steps">${body.steps.map(x=>`<li dir="auto">${esc(x.t).replace(/\n/g,'<br>')}${x.link?` <a href="${esc(x.link)}" target="_blank" rel="noopener">Open link ↗</a>`:''}</li>`).join('')}</ol>
      ${body.tips?`<div class="kb-tips" dir="auto"><b>Notes &amp; tips</b><br>${esc(body.tips).replace(/\n/g,'<br>')}</div>`:''}
      ${s.tasks.length?`<div class="muted" style="font-size:12.5px;margin-top:10px">Shown on these tasks: ${s.tasks.map(t=>esc(t.title)).join(' · ')}</div>`:''}
      ${s.readers?`<details class="kb-det"><summary>Read by ${s.readers.done.length} of ${s.readers.done.length+s.readers.pending.length}</summary><div style="font-size:13px;margin-top:6px">${s.readers.pending.length?`<b style="color:var(--warn)">Not yet:</b> ${s.readers.pending.map(bd).join(', ')}<br>`:''}${s.readers.done.length?`<b style="color:var(--ok)">Read:</b> ${s.readers.done.map(bd).join(', ')}`:''}</div></details>`:''}
      ${s.canEdit&&s.history.length>1?`<details class="kb-det"><summary>History (${s.history.length} versions)</summary>${s.history.map(h=>`<div class="kb-h"><span>v${h.version} · ${new Date(h.at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})} · ${bd(h.by)}</span>${h.version!==s.version?`<button class="btn ghost small" onclick="kbOpen('${esc(id)}',${h.version})">View</button>`:'<span class="muted">current</span>'}</div>`).join('')}</details>`:''}
      ${s.suggestions.length?`<details class="kb-det"${s.canEdit&&s.suggestions.some(g=>g.status==='open')?' open':''}><summary>Suggestions (${s.suggestions.filter(g=>g.status==='open').length} open)</summary>${s.suggestions.map(g=>`<div class="kb-sg"><div><b>${bd(g.by)}</b> <span class="muted">${new Date(g.at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})} · ${g.status}</span></div><div dir="auto">${esc(g.text)}</div>${s.canEdit&&g.status==='open'?`<div class="row" style="gap:6px;margin-top:6px"><button class="btn small" onclick="kbDecide('${esc(g.id)}',true)">Accept</button><button class="btn ghost small" onclick="kbDecide('${esc(g.id)}',false)">Not now</button></div>`:''}</div>`).join('')}</details>`:''}
      <div class="mfoot">
        ${s.canEdit?`<button class="btn" onclick="kbEdit('${esc(id)}')">Edit</button>${s.status==='published'?`<button class="btn ghost" onclick="kbReviewed('${esc(id)}')" title="Still correct, no changes needed">Mark reviewed</button>`:''}`:''}
        ${s.status==='published'&&!s.canEdit?`<button class="btn ghost" onclick="kbSuggest('${esc(id)}')">Suggest an edit</button>`:''}
        ${(S.cache.kb||{}).isAdmin&&s.status!=='archived'?`<button class="btn ghost danger" onclick="kbArchive('${esc(id)}')">Archive</button>`:''}
        ${(S.cache.kb||{}).isAdmin&&s.status==='archived'?`<button class="btn ghost" onclick="kbArchive('${esc(id)}',true)">Restore</button>`:''}
        <div class="spacer"></div>
        ${must&&!ver?`<button class="btn primary" onclick="kbRead('${esc(id)}')">I've read it ✓</button>`:`<button class="btn primary" onclick="closeModal()">Close</button>`}</div>
    </div></div>`;
  }catch(e){ closeModal(); alert(e.message); }
}
async function kbRead(id){
  try{ const r=await call('kbRead',{id}); closeModal(); toast('تمام ✓');
    if(S.cache.kb){ S.cache.kb.unread=r.unread; S.cache.kb.sops.forEach(s=>{ if(s.id===id) s.read=true; }); if(S.view==='knowledge'&&S.kb.tab==='sops') kbRender(S.cache.kb); }
    if(S.deskLast){ S.deskLast.sopUnread=r.unread; if(S.view==='desk') renderDesk(S.deskLast); }
    updateNavBadges&&updateNavBadges();
  }catch(e){ alert(e.message); }
}
async function kbReviewed(id){ try{ await call('kbReviewed',{id}); toast('اتسجلت المراجعة ✓'); kbOpen(id); }catch(e){ alert(e.message); } }
async function kbArchive(id,restore){ if(!restore&&!confirm('الـ SOP ده هيتشال من المكتبة. متأكد؟')) return; try{ const r=await call('kbArchive',{id,restore:!!restore}); closeModal(); kbRender(r); }catch(e){ alert(e.message); } }
function kbSuggest(id){
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:520px"><h2 style="margin:0 0 6px">Suggest an edit</h2>
    <div class="muted" style="font-size:13px;margin-bottom:10px">Your team lead gets it and decides.</div>
    <textarea id="kbSg" rows="4" dir="auto" placeholder="إيه اللي محتاج يتغير أو يتضاف؟"></textarea><div class="err" id="kbSgE"></div>
    <div class="mfoot"><button class="btn ghost" onclick="kbOpen('${esc(id)}')">Back</button><div class="spacer"></div><button class="btn primary" id="kbSgB">Send</button></div></div></div>`;
  $('kbSgB').onclick=async()=>{ try{ await call('kbSuggest',{id,text:$('kbSg').value}); toast('اتبعت ✓'); kbOpen(id); }catch(e){ $('kbSgE').textContent=e.message; } };
}
async function kbDecide(sid,accept){ try{ await call('kbSuggestDecide',{sid,accept}); toast(accept?'اتقبل ✓':'تمام'); kbOpen(S.kbCur.id); }catch(e){ alert(e.message); } }

/* ----- كتابة / تعديل SOP ----- */
async function kbEdit(id){
  const L=S.cache.kb||await call('kbList'); S.cache.kb=L;
  let s={title:'',dept:L.isAdmin?'':(L.editDepts||[])[0]||'',owner:L.me,status:'published',body:{intro:'',steps:[{t:'',link:''}],tips:''},taskKeys:[]};
  if(id) s=await call('kbGet',{id});
  const depts=(L.isAdmin?[{id:'',name:'All company'}].concat(L.depts):L.depts.filter(d=>(L.editDepts||[]).indexOf(d.id)>=0));
  const roles={}; (L.tasks||[]).forEach(t=>{ (roles[t.role]||(roles[t.role]=[])).push(t); });
  S.kbSteps=s.body.steps.length?s.body.steps.map(x=>({t:x.t,link:x.link})):[{t:'',link:''}];
  const draw=()=>{
    const stepsHTML=S.kbSteps.map((x,i)=>`<div class="kb-st"><span class="kb-n">${i+1}</span><div style="flex:1;display:grid;gap:6px"><textarea rows="2" dir="auto" data-i="${i}" class="kbT" placeholder="اكتب الخطوة">${esc(x.t)}</textarea><input data-i="${i}" class="kbL" dir="ltr" placeholder="Link (optional) https://" value="${esc(x.link)}"></div>
      <div class="kb-sa"><button type="button" class="iconbtn" ${i?'':'disabled'} onclick="kbStep(${i},-1)" aria-label="Move up">↑</button><button type="button" class="iconbtn" ${i<S.kbSteps.length-1?'':'disabled'} onclick="kbStep(${i},1)" aria-label="Move down">↓</button><button type="button" class="iconbtn" onclick="kbStep(${i},0)" aria-label="Remove step">×</button></div></div>`).join('');
    $('kbStepsBox').innerHTML=stepsHTML;
    document.querySelectorAll('.kbT').forEach(el=>el.oninput=()=>{ S.kbSteps[+el.dataset.i].t=el.value; });
    document.querySelectorAll('.kbL').forEach(el=>el.oninput=()=>{ S.kbSteps[+el.dataset.i].link=el.value; });
  };
  $('modalRoot').innerHTML=`<div class="modal"><div class="card" style="max-width:820px">
    <h2 style="margin:0 0 12px">${id?'Edit SOP':'New SOP'}</h2>
    <div class="pfgrid">
      <div style="grid-column:1/-1"><label>Title *</label><input id="kbTi" dir="auto" value="${esc(s.title)}" placeholder="مثال: نقل المنتجات من سلة لزد"></div>
      <div><label>Team</label><select id="kbDe">${depts.map(d=>`<option value="${esc(d.id)}"${d.id===s.dept?' selected':''}>${esc(d.name)}</option>`).join('')}</select><div class="muted" style="font-size:12px;margin-top:4px">Everyone in this team must read it.</div></div>
      <div><label>Owner</label><select id="kbOw">${(L.people||[]).map(p=>`<option value="${esc(p.u)}"${p.u===s.owner?' selected':''}>${esc(p.name)}</option>`).join('')}</select></div>
      <div style="grid-column:1/-1"><label>Intro (what it is and when to use it)</label><textarea id="kbIn" rows="2" dir="auto">${esc(s.body.intro)}</textarea></div>
    </div>
    <h3 style="margin:16px 0 8px">Steps *</h3><div id="kbStepsBox" class="kb-sts"></div>
    <button type="button" class="btn ghost small" onclick="S.kbSteps.push({t:'',link:''});kbEditDraw()">+ Add step</button>
    <div style="margin-top:14px"><label>Notes &amp; tips</label><textarea id="kbTp" rows="2" dir="auto">${esc(s.body.tips)}</textarea></div>
    ${(L.tasks||[]).length?`<details class="kb-det"${s.taskKeys.length?' open':''}><summary>Show on workflow tasks (${s.taskKeys.length})</summary><div class="muted" style="font-size:12.5px;margin:6px 0">People see a “How to” button on these tasks.</div>
      <div class="kb-tasks">${Object.keys(roles).map(r=>`<div><b>${esc(r)}</b>${roles[r].map(t=>`<label class="pf-chk"><input type="checkbox" class="kbTk" value="${esc(t.key)}"${s.taskKeys.indexOf(t.key)>=0?' checked':''}> ${esc(t.title)}</label>`).join('')}</div>`).join('')}</div></details>`:''}
    <div class="err" id="kbErr"></div>
    <div class="mfoot"><button class="btn ghost" onclick="${id?`kbOpen('${esc(id)}')`:'closeModal()'}">Cancel</button><div class="spacer"></div>
      <button class="btn" onclick="kbSave('${esc(id||'')}','draft')">Save as draft</button><button class="btn primary" onclick="kbSave('${esc(id||'')}','published')">${id&&s.status==='published'?'Save & notify team':'Publish'}</button></div></div></div>`;
  window.kbEditDraw=draw; draw();
  pickify($('kbOw'), L.people||[]);
}
function kbStep(i,dir){ const a=S.kbSteps; if(dir===0){ a.splice(i,1); if(!a.length) a.push({t:'',link:''}); } else { const j=i+dir; [a[i],a[j]]=[a[j],a[i]]; } kbEditDraw(); }
async function kbSave(id,status){
  const sop={id,title:$('kbTi').value,dept:$('kbDe').value,owner:$('kbOw').value,status,
    body:{intro:$('kbIn').value,steps:S.kbSteps.filter(x=>x.t.trim()),tips:$('kbTp').value},
    taskKeys:[...document.querySelectorAll('.kbTk:checked')].map(x=>x.value)};
  try{ const s=await call('kbSave',{sop}); toast(status==='published'?'اتنشر ✓ والفريق اتبلغ':'اتحفظ كمسودة ✓'); call('kbList').then(r=>{ S.cache.kb=r; if(S.view==='knowledge'&&S.kb.tab==='sops') kbRender(r); }).catch(()=>{}); kbOpen(s.id); }
  catch(e){ $('kbErr').textContent=e.message; }
}

/* ----- المشاكل ----- */
const PR_ST={open:['Open','p-bad'],investigating:['Investigating','p-yel'],solved:['Solved','p-in']};
function kbLoadProblems(){
  if(!S.cache.kb) call('kbList').then(r=>{ S.cache.kb=r; }).catch(()=>{});
  swr('pr','prList',{month:S.kb.month||''},r=>{ if(S.kb.tab==='dash') kbRenderDash(r); else kbRenderProblems(r); if(S.kb.prOpen){ const id=S.kb.prOpen; S.kb.prOpen=''; prOpen(id); } });
}
function kbRenderProblems(r){
  S.cache.pr=r;
  setTop('Knowledge','SOPs and problems',`<button class="btn primary" onclick="prForm()">+ Report a problem</button>`);
  const f=S.kb.prF||'active', L=r.problems.filter(p=>f==='all'||(f==='active'?p.status!=='solved':p.status==='solved'));
  $('main').innerHTML=`${kbTabs()}
    <div class="kb-bar"><div class="chips">${[['active','Open'],['solved','Solved'],['all','All']].map(x=>`<button class="${f===x[0]?'on':''}" onclick="S.kb.prF='${x[0]}';kbRenderProblems(S.cache.pr)">${x[1]}</button>`).join('')}</div>
      <span class="muted" style="font-size:12.5px">${r.canDash?'You see your team’s problems':'You see the problems you reported'}</span></div>
    ${L.length?`<div class="card flush">${L.map(p=>`<button class="al" onclick="prOpen('${esc(p.id)}')"><span class="tx"><b dir="auto">${esc(p.title)}</b><span>${esc(p.category)} · ${esc(p.deptName)}${p.client?' · '+esc(p.client):''} · ${bd(p.byName)} · ${new Date(p.at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}${p.ownerName?' · owner '+bd(p.ownerName):''}</span></span><span class="pill p-out">${esc(p.severity)}</span><span class="pill ${PR_ST[p.status][1]}">${PR_ST[p.status][0]}</span></button>`).join('')}</div>`
      :`<div class="card empty"><b>No problems here</b>Report anything that keeps slowing the work down.</div>`}`;
}
function prForm(){
  const r=S.cache.pr; if(!r) return;
  const st=r.settings;
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:600px">
    <h2 style="margin:0 0 4px">Report a problem</h2><div class="muted" style="font-size:13px;margin-bottom:12px">Your team lead gets it. High severity goes to management too.</div>
    <div class="pfgrid">
      <div style="grid-column:1/-1"><label>What happened? *</label><input id="prT" dir="auto" placeholder="مثال: العميل بيتأخر في إرسال الأكسيس"></div>
      <div><label>Type *</label><select id="prC"><option value="">Choose…</option>${st.problemCats.map(c=>`<option>${esc(c)}</option>`).join('')}</select></div>
      <div><label>Severity</label><select id="prS">${st.severities.map((c,i)=>`<option${i===1?' selected':''}>${esc(c)}</option>`).join('')}</select></div>
      <div><label>Team it belongs to</label><select id="prD">${r.depts.map(d=>`<option value="${esc(d.id)}"${d.id===r.myDept?' selected':''}>${esc(d.name)}</option>`).join('')}</select></div>
      <div><label>Project (optional)</label><select id="prP"><option value="">—</option>${r.projects.map(p=>`<option value="${esc(p.id)}">${esc(p.client)}</option>`).join('')}</select></div>
      <div style="grid-column:1/-1"><label>Details</label><textarea id="prDs" rows="3" dir="auto" placeholder="إيه اللي حصل، وبيتكرر إمتى؟"></textarea></div>
    </div><div class="err" id="prE"></div>
    <div class="mfoot"><button class="btn ghost" onclick="closeModal()">Cancel</button><div class="spacer"></div><button class="btn primary" id="prB">Send</button></div></div></div>`;
  $('prB').onclick=async()=>{ $('prB').disabled=true; try{ const out=await call('prSave',{problem:{title:$('prT').value,category:$('prC').value,severity:$('prS').value,dept:$('prD').value,project:$('prP').value,desc:$('prDs').value}}); S.cache.pr=out; closeModal(); toast('اتبلّغ ✓'); S.kb.tab='problems'; kbRenderProblems(out); }catch(e){ $('prE').textContent=e.message; $('prB').disabled=false; } };
}
function prOpen(id){
  const r=S.cache.pr, p=r&&r.problems.find(x=>x.id===id); if(!p) return;
  const sop=p.sop&&(r.sops||[]).find(s=>s.id===p.sop);
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:640px">
    <div class="kb-ch"><span class="pill ${PR_ST[p.status][1]}">${PR_ST[p.status][0]}</span><span class="pill p-out">${esc(p.severity)}</span><span class="muted" style="font-size:12.5px">${esc(p.category)} · ${esc(p.deptName)}${p.client?' · '+esc(p.client):''}</span></div>
    <h2 style="margin:8px 0 4px" dir="auto">${esc(p.title)}</h2>
    <div class="muted" style="font-size:12.5px">Reported by ${bd(p.byName)} · ${new Date(p.at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})}${p.solvedAt?' · solved '+new Date(p.solvedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'})+' by '+bd(p.solvedByName):''}</div>
    ${p.desc?`<p dir="auto" style="white-space:pre-wrap">${esc(p.desc)}</p>`:''}
    ${p.canManage?`<div class="pfgrid" style="margin-top:12px">
      <div><label>Status</label><select id="paS">${Object.keys(PR_ST).map(k=>`<option value="${k}"${k===p.status?' selected':''}>${PR_ST[k][0]}</option>`).join('')}</select></div>
      <div><label>Owner</label><select id="paO"><option value="">—</option>${(r.people||[]).map(x=>`<option value="${esc(x.u)}"${x.u===p.owner?' selected':''}>${esc(x.name)}</option>`).join('')}</select></div>
      <div style="grid-column:1/-1"><label>Root cause</label><textarea id="paR" rows="2" dir="auto" placeholder="السبب الحقيقي ورا المشكلة">${esc(p.rootCause)}</textarea></div>
      <div style="grid-column:1/-1"><label>Fix</label><textarea id="paF" rows="2" dir="auto" placeholder="اتحلت إزاي، وإيه اللي هيمنع تكرارها">${esc(p.fix)}</textarea></div>
      <div style="grid-column:1/-1"><label>Related SOP</label><select id="paP"><option value="">—</option>${(r.sops||[]).map(s=>`<option value="${esc(s.id)}"${s.id===p.sop?' selected':''}>${esc(s.title)}</option>`).join('')}</select></div>
    </div>`:`${p.rootCause?`<div class="kb-tips"><b>Root cause</b><br>${esc(p.rootCause)}</div>`:''}${p.fix?`<div class="kb-tips"><b>Fix</b><br>${esc(p.fix)}</div>`:''}${sop?`<div style="margin-top:8px"><button class="btn ghost small" onclick="go('knowledge',{id:'${esc(sop.id)}'})">📘 ${esc(sop.title)}</button></div>`:''}`}
    <div class="err" id="paE"></div>
    <div class="mfoot">${p.canManage&&kbCanEditDept(p.dept)?`<button class="btn ghost" onclick="prToSop('${esc(p.id)}')">Write an SOP from this</button>`:''}<div class="spacer"></div><button class="btn ghost" onclick="closeModal()">Close</button>${p.canManage?`<button class="btn primary" id="paB">Save</button>`:''}</div></div></div>`;
  if(p.canManage){ pickify($('paO'), r.people||[]);
    $('paB').onclick=async()=>{ try{ const out=await call('prAct',{id,update:{status:$('paS').value,owner:$('paO').value,rootCause:$('paR').value,fix:$('paF').value,sop:$('paP').value}}); S.cache.pr=out; closeModal(); toast('اتحفظ ✓'); if(S.kb.tab==='problems') kbRenderProblems(out); }catch(e){ $('paE').textContent=e.message; } }; }
}
// SOP جديد متعبّي من المشكلة (السبب والحل)
async function prToSop(id){
  const p=S.cache.pr.problems.find(x=>x.id===id); if(!p) return;
  const root=$('paR')?$('paR').value:p.rootCause, fix=$('paF')?$('paF').value:p.fix;
  await kbEdit();
  $('kbTi').value=p.title; if([...$('kbDe').options].some(o=>o.value===p.dept)) $('kbDe').value=p.dept;
  $('kbIn').value='الهدف: نمنع تكرار المشكلة دي.'+(root?'\nالسبب: '+root:'');
  S.kbSteps=[{t:fix||'',link:''}]; kbEditDraw();
}

/* ----- داشبورد المشاكل ----- */
function kbBars(o,prev){
  const keys=Object.keys(o).concat(Object.keys(prev||{}).filter(k=>!(k in o))).sort((a,b)=>(o[b]||0)-(o[a]||0));
  if(!keys.length) return '<div class="muted" style="font-size:13px">Nothing this month.</div>';
  const mx=Math.max(1,...keys.map(k=>Math.max(o[k]||0,(prev||{})[k]||0)));
  return `<div class="kb-bars">${keys.map(k=>`<div class="kb-br"><span dir="auto">${esc(k)}</span><div class="kb-bt"><i style="width:${(o[k]||0)/mx*100}%"></i>${prev?`<em style="width:${(prev[k]||0)/mx*100}%"></em>`:''}</div><b>${o[k]||0}${prev?`<small class="muted"> / ${prev[k]||0}</small>`:''}</b></div>`).join('')}</div>`;
}
function kbRenderDash(r){
  S.cache.pr=r;
  setTop('Knowledge','SOPs and problems',`<button class="btn primary" onclick="prForm()">+ Report a problem</button>`);
  const D=r.dash;
  if(!D){ $('main').innerHTML=kbTabs()+'<div class="card empty">The dashboard is for team leads and management.</div>'; return; }
  const k=D.kpis, months=[]; { const n=new Date(); for(let i=0;i<12;i++){ const d=new Date(n.getFullYear(),n.getMonth()-i,15); months.push(d.toISOString().slice(0,7)); } }
  const diff=k.reported-k.prevReported;
  $('main').innerHTML=`${kbTabs()}
    <div class="kb-bar"><select style="max-width:240px" onchange="S.kb.month=this.value;delete S.cache.pr;kbLoadProblems()" aria-label="Month">${months.map(m=>`<option value="${m}"${m===D.month?' selected':''}>${new Date(m+'-15').toLocaleDateString('en-GB',{month:'long',year:'numeric'})}</option>`).join('')}</select><span class="muted" style="font-size:12.5px">${D.scope==='all'?'Whole company':'Your team'} · compared with ${esc(D.prevName)}</span></div>
    <div class="grid kpis">
      <div class="kpi"><span>Reported</span><b>${k.reported}</b><small style="color:${diff>0?'var(--bad)':diff<0?'var(--ok)':'inherit'}">${diff>0?'+':''}${diff} vs last month</small></div>
      <div class="kpi"><span>Still open</span><b style="color:${k.open?'var(--warn)':'inherit'}">${k.open}</b><small>All months</small></div>
      <div class="kpi"><span>Solved this month</span><b style="color:var(--ok)">${k.solved}</b><small>${k.avgDays===null?'':'Avg '+k.avgDays+' days to solve'}</small></div>
      ${D.blockers?`<div class="kpi"><span>Blockers opened</span><b>${D.blockers.total}</b><small>${D.blockers.open} open now</small></div>
      <div class="kpi"><span>Client revisions</span><b>${D.revisions}</b><small>Revision notes on tasks</small></div>
      <div class="kpi"><span>Late tasks now</span><b style="color:${D.late?'var(--bad)':'inherit'}">${D.late}</b><small>Past their deadline</small></div>`:''}
    </div>
    <div class="two">
      <div class="card"><h2 style="font-size:15px;margin:0 0 4px">Most common problems</h2><div class="muted" style="font-size:12px;margin-bottom:10px"><i class="kb-lg"></i>${esc(D.monthName)} <i class="kb-lg prev"></i>${esc(D.prevName)}</div>${kbBars(D.byCat,D.byCatPrev)}</div>
      <div class="card"><h2 style="font-size:15px;margin:0 0 10px">By team</h2>${kbBars(D.byDept)}<h2 style="font-size:15px;margin:16px 0 10px">By severity</h2>${kbBars(D.bySev)}</div>
      ${D.blockers?`<div class="card"><h2 style="font-size:15px;margin:0 0 10px">Blockers by type</h2>${kbBars(D.blockers.byCat)}<h2 style="font-size:15px;margin:16px 0 10px">Blockers by side</h2>${kbBars(D.blockers.byCause)}</div>
      <div class="card"><h2 style="font-size:15px;margin:0 0 10px">By platform</h2><div class="muted" style="font-size:12px;margin-bottom:8px">Problems and blockers on projects</div>${kbBars(D.byPlatform||{})}</div>`:''}
    </div>`;
}

/* ----- الإعدادات (من الصفحة، مش من الكود) ----- */
async function kbRenderSettings(){
  const L=S.cache.kb||await call('kbList'); S.cache.kb=L;
  if(!L.isAdmin){ S.kb.tab='sops'; return viewKnowledge(); }
  const st=L.settings;
  setTop('Knowledge','SOPs and problems','');
  $('main').innerHTML=`${kbTabs()}<div class="card" style="max-width:720px">
    <h2 style="margin:0 0 4px">Settings</h2><div class="muted" style="font-size:13px;margin-bottom:14px">Changes apply right away for everyone.</div>
    <label>Problem types (one per line)</label><textarea id="ksC" rows="6" dir="auto">${esc(st.problemCats.join('\n'))}</textarea>
    <label style="margin-top:12px;display:block">Severity levels, lowest first (one per line)</label><textarea id="ksS" rows="4" dir="auto">${esc(st.severities.join('\n'))}</textarea>
    <div class="muted" style="font-size:12px;margin-top:4px">The top two levels also notify management.</div>
    <label style="margin-top:12px;display:block">Remind SOP owners to review every (months)</label><input id="ksR" type="number" min="1" max="36" value="${st.reviewMonths}" style="max-width:120px">
    <div class="err" id="ksE"></div>
    <div class="mfoot"><div class="spacer"></div><button class="btn primary" id="ksB">Save</button></div></div>`;
  $('ksB').onclick=async()=>{ try{ const s=await call('kbSettingsSave',{settings:{problemCats:$('ksC').value.split('\n'),severities:$('ksS').value.split('\n'),reviewMonths:$('ksR').value}}); L.settings=s; if(S.cache.pr) S.cache.pr.settings=s; toast('اتحفظت ✓'); }catch(e){ $('ksE').textContent=e.message; } };
}

/* ----- كارت الديسك + زرار «إزاي أعملها» على التاسك ----- */
function kbDeskHTML(L){
  if(!L||!L.length) return '';
  return `<div class="card flush"><div class="chead"><h2>SOPs to read</h2><span class="pill p-absent">${L.length}</span><span class="spacer"></span><button class="btn ghost small" onclick="go('knowledge')">Knowledge →</button></div>
    ${L.map(s=>`<button class="al" onclick="kbOpen('${esc(s.id)}')"><span style="color:var(--warn)">${ico('brief',18)}</span><span class="tx"><b>${esc(s.title)}</b><span>${esc(s.dept)} · v${s.version} · required</span></span><span class="pill p-absent">Read</span></button>`).join('')}</div>`;
}
