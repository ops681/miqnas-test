/* ============ Tasks (التاسكات العامة) ============
   تاسك من أي مصدر: Assigned to (اللي هيشتغل)، مشاركين، Approves delivery (اللي رفع التاسك دايمًا + ناس زيادة)،
   مراقبين (Watchers)، مراحل تسليم (اختياري)، أولوية، ديدلاين، وتاسكات لازم تخلص قبلها.
   تاسكات المشاريع لسه في My Tasks / Projects. */
const PRIO_COL={Low:'#98A2B3',Medium:'var(--blue)',High:'var(--accent)',Urgent:'#D92D20'};
const GT_PILL={'To Do':'p-absent','In Progress':'p-in','In Review':'p-yel','Done':'p-in','Cancelled':''};
S.gtTab='mine'; S.gtProj='';
function viewTasks(opts){
  setTop('Tasks','Tasks from meetings, requests and day-to-day work',`<button class="btn primary" onclick="gtEdit()">+ New task</button>`);
  swr('gt','gtList',{},(L)=>{ renderTasks(L); if(opts&&opts.id){ const id=opts.id; opts.id=null; gtOpen(id); } });
}
function gtFind(id){ const L=S.cache.gt||{}; return ['mine','review','assigned','team','watching'].reduce((f,k)=>f||(L[k]||[]).find(t=>t.id===id),null); }
function gtRow(t){
  const meta=[];
  if(S.gtTab!=='mine') meta.push(esc(t.ownerName));
  if(t.due) meta.push(`<span style="color:${t.late?'var(--bad)':t.dueToday?'var(--warn)':'inherit'}">${t.late?'Late · ':t.dueToday?'Due today · ':'Due '}${fmtD(t.due)}</span>`);
  if(t.source&&t.source.label) meta.push(t.source.type==='project'?`<span class="gt-pj">📁 ${bd(t.source.label)}</span>`:esc(t.source.label));
  if(t.stages&&t.stages.length){ const d=t.stages.filter(x=>x.status==='approved').length, rv=t.stages.find(x=>x.status==='review'); meta.push(`<span class="gt-stc">${rv?'🔍 '+esc(rv.name)+' · ':''}Stage ${Math.min(d+1,t.stages.length)}/${t.stages.length}${d===t.stages.length?' ✓':''}</span>`); }
  if(t.blocked) meta.push('<span style="color:var(--yel)">Waiting on '+t.deps.filter(d=>d.status!=='Done'&&d.status!=='Cancelled').map(d=>esc(d.title)).join(', ')+'</span>');
  return `<button class="al" onclick="gtOpen('${esc(t.id)}')"><span title="${t.priority}" style="flex:none;width:10px;height:10px;border-radius:3px;margin-top:6px;background:${PRIO_COL[t.priority]}"></span>
    <span class="tx"><b style="${t.status==='Done'||t.status==='Cancelled'?'text-decoration:line-through;color:var(--muted)':''}">${bd(t.title)}</b><span>${meta.join(' · ')||'&nbsp;'}</span></span>
    <span class="pill ${GT_PILL[t.status]||''}">${esc(t.status)}</span></button>`;
}
function renderTasks(L){
  const tabs=[['mine','My tasks',L.mine],['review','To review',L.review],['assigned','Assigned by me',L.assigned]].concat(L.team?[['team','My team',L.team]]:[],(L.watching||[]).length?[['watching','👁 Watching',L.watching]]:[]);
  if(!tabs.some(x=>x[0]===S.gtTab)) S.gtTab='mine';
  const all=L[S.gtTab]||[];
  // فلتر بالمشروع: المشاريع اللي ليها تاسكات في التاب ده بس
  const pj={}; all.forEach(t=>{ if(t.source&&t.source.type==='project'&&t.source.id) pj[t.source.id]=t.source.label; });
  if(S.gtProj && !pj[S.gtProj]) S.gtProj='';
  const pf=Object.keys(pj).length?`<select class="gt-pf" aria-label="Filter by project" onchange="S.gtProj=this.value;renderTasks(S.cache.gt)"><option value="">📁 All projects</option>${Object.keys(pj).sort((a,b)=>String(pj[a]).localeCompare(pj[b])).map(id=>`<option value="${esc(id)}"${S.gtProj===id?' selected':''}>${esc(pj[id])}</option>`).join('')}</select>`:'';
  const list=all.filter(t=>!S.gtProj||(t.source&&t.source.type==='project'&&t.source.id===S.gtProj)).slice().sort((a,b)=>{ const o=s=>['In Review','In Progress','To Do','Done','Cancelled'].indexOf(s); return o(a.status)-o(b.status) || (b.late-a.late) || ((a.due||'9')<(b.due||'9')?-1:1); });
  const open=list.filter(t=>t.status!=='Done'&&t.status!=='Cancelled'), closed=list.filter(t=>t.status==='Done'||t.status==='Cancelled');
  $('main').innerHTML=`<div class="gt-bar"><div class="flt">${tabs.map(x=>`<button class="${S.gtTab===x[0]?'on':''}" onclick="S.gtTab='${x[0]}';renderTasks(S.cache.gt)">${x[1]} <span>${x[2].filter(t=>t.status!=='Done'&&t.status!=='Cancelled').length}</span></button>`).join('')}</div>${pf}</div>
    <div class="card flush">${open.length?open.map(gtRow).join(''):`<div class="empty"><b>Nothing open</b>${S.gtTab==='review'?'No tasks are waiting for your review.':S.gtTab==='watching'?'No tasks you are watching are open.':'No open tasks here.'}</div>`}</div>
    ${closed.length?`<h3 style="margin:22px 0 10px" class="muted">Finished in the last 2 weeks</h3><div class="card flush" style="opacity:.85">${closed.map(gtRow).join('')}</div>`:''}`;
}
async function gtReload(){ const L=await call('gtList'); S.cache.gt=L; S.fetched.gt=Date.now(); if(S.view==='tasks') renderTasks(L); return L; }

function gtOpen(id){
  const t=gtFind(id);
  if(t) return gtShow(t);
  call('gtGet',{id}).then(gtShow).catch(e=>alert(e.message));
}
function gtShow(t){
  t.approvers=t.approvers||[]; t.watchers=t.watchers||[]; t.stages=t.stages||[]; t.extraApprovers=t.extraApprovers||[];
  S.gtCur=t;
  const c=t.can, btn=[];
  if(c.work && t.status==='To Do') btn.push(`<button class="btn" onclick="gtDo('start')"${t.blocked?' disabled title="Waiting on other tasks"':''}>Start</button>`);
  const hasSt=(t.stages||[]).length>0;
  if(!hasSt && t.owner===S.user.username && (t.status==='To Do'||t.status==='In Progress')) btn.push(`<button class="btn primary" onclick="gtDo('submit',true)"${t.blocked?' disabled':''}>${t.approvers.length?'Send for review':'Mark done'}</button>`);
  if(!hasSt && c.review && t.status==='In Review'){ btn.push(`<button class="btn primary" onclick="gtDo('approve',true)">Approve</button>`); btn.push(`<button class="btn" onclick="gtRet('return')">Return for changes</button>`); }
  const ob=(t.blocks||[]).find(b=>b.status==='open'), open=t.status!=='Done'&&t.status!=='Cancelled';
  if(c.work && open && !ob) btn.push(`<button class="btn ghost" onclick="gtBlk()">⛔ متوقفة</button>`);
  if(c.redo && t.status==='Done') btn.push(`<button class="btn" onclick="gtRet('redo')">↩️ رجّعها</button>`);
  if(c.manage && (t.status==='Done'||t.status==='Cancelled')) btn.push(`<button class="btn" onclick="gtDo('reopen',true)">Reopen</button>`);
  if(c.manage && t.status!=='Done' && t.status!=='Cancelled'){ btn.push(`<button class="btn" onclick="closeModal();gtEdit('${esc(t.id)}')">Edit</button>`); btn.push(`<button class="btn ghost danger" onclick="gtDo('cancel',true)">Cancel task</button>`); }
  const kv=(k,v)=>`<div><div class="muted" style="font-size:12px">${k}</div><div style="font-weight:600">${v}</div></div>`;
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:720px">
    <div style="display:flex;gap:10px;align-items:flex-start"><h2 style="flex:1;margin:0">${bd(t.title)}</h2><span class="pill ${GT_PILL[t.status]||''}">${esc(t.status)}</span><button class="iconbtn" onclick="closeModal()" aria-label="Close">✕</button></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin:16px 0">
      ${kv('Assigned to',esc(t.ownerName))}${kv('Priority',`<span style="color:${PRIO_COL[t.priority]}">● </span>`+esc(t.priority))}${kv('Deadline',t.due?`<span style="color:${t.late?'var(--bad)':'inherit'}">${fmtD(t.due)}${t.late?' · late':''}</span>`:'—')}
      ${kv('Approves delivery',(t.approvers.length?t.approvers.map(x=>esc(x.name)).join('، '):'—')+(c.approvers&&open?` <button class="tnbtn" onclick="gtApv()" title="Add someone so the delivery goes to them too">+ Add</button>`:''))}
      ${kv('Watchers',t.watchers.length?'👁 '+t.watchers.map(x=>esc(x.name)).join('، '):'—')}${kv('Helping',t.contributors.length?t.contributors.map(x=>esc(x.name)).join('، '):'—')}${kv('Created by',esc(t.createdByName))}
      ${t.source&&t.source.type==='project'&&t.source.label?kv('Project',t.source.open?`<a href="#" onclick="closeModal();goTo({view:'project',id:'${esc(t.source.id)}'});return false">📁 ${bd(t.source.label)} ↗</a>`:'📁 '+bd(t.source.label))
        :t.source&&t.source.label?kv('From',esc(t.source.type)+' · '+(t.source.type==='meeting'?`<a href="#" onclick="closeModal();go('meetings',{id:'${esc(t.source.id)}'});return false">${esc(t.source.label)}</a>`:esc(t.source.label))):''}
    </div>
    ${t.desc?`<div style="white-space:pre-wrap;background:var(--bg);border-radius:10px;padding:12px 14px;margin-bottom:14px">${bd(t.desc)}</div>`:''}
    ${t.watching?`<div class="gt-watch" dir="rtl">👁 انت مراقب للتاسك ده: تقدر تشوف وتكتب كومنت بس.</div>`:''}
    ${hasSt?gtStagesHTML(t):''}
    ${hasSt&&!t.link?'':t.can.work&&t.status!=='Cancelled'?`<div style="margin-bottom:14px" dir="rtl"><label for="gtLk">التسليم <span class="muted" style="font-weight:400">(اختياري)</span></label>
      <div style="display:flex;gap:8px;align-items:flex-start"><textarea id="gtLk" class="ml" dir="auto" rows="1" maxlength="2000" placeholder="لينك أو كلام · Enter = سطر جديد" onkeydown="if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();gtDeliver();}">${esc(t.link||'')}</textarea><button class="btn" type="button" onclick="gtDeliver()">Save</button></div>
      ${t.link&&/https?:\/\//i.test(t.link)?`<div class="tl-txt" style="margin-top:6px">${txtLinks(t.link)}</div>`:''}</div>`
      :t.link?`<div style="margin-bottom:14px;background:var(--bg);border-radius:10px;padding:10px 14px" dir="rtl"><div class="muted" style="font-size:12px;margin-bottom:4px">📎 التسليم</div><div class="tl-txt">${txtLinks(t.link)}</div></div>`:''}
    ${(()=>{ const ob=(t.blocks||[]).find(b=>b.status==='open'); return ob?`<div class="tblk" dir="rtl" style="margin-bottom:14px">⛔ <b>متوقفة: ${esc(ob.causeLabel)}</b> · ${bd(ob.details)} <span class="muted">· ${esc(ob.by)}${ob.promoted?' · اترفعت للبورتال':''}</span>
      <span class="tblk-b">${t.can.work||t.can.judge?`<button class="tnbtn" onclick="gtDo('unblock')">✓ اتحلت</button>`:''}${t.can.judge?`<button class="tnbtn" onclick="gtBlkRej()">رفض</button>`:''}${t.can.judge&&ob.cause==='client'&&t.source&&t.source.type==='project'&&!ob.promoted?`<button class="tnbtn" onclick="gtDo('blockup')">ارفعها للبورتال</button>`:''}</span></div>`:''; })()}
    ${t.returns?`<div class="tret" dir="rtl" style="margin-bottom:12px">↩️ رجعت ${t.returns===1?'مرة':t.returns+' مرات'} (التفاصيل في السجل تحت)</div>`:''}
    ${t.deps.length?`<div style="margin-bottom:14px"><div class="muted" style="font-size:12px;margin-bottom:4px">Has to wait for</div>${t.deps.map(d=>`<div style="display:flex;gap:8px;margin:4px 0"><span class="pill ${GT_PILL[d.status]||''}">${esc(d.status)}</span><span>${bd(d.title)} <span class="muted">· ${esc(d.owner)}</span></span></div>`).join('')}</div>`:''}
    ${btn.length?`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">${btn.join('')}</div>`:''}
    <div style="display:flex;gap:8px"><textarea id="gtNote" placeholder="Write a comment" maxlength="1000" onkeydown="if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();gtDo('comment',true);}" dir="auto" rows="1" class="ml"></textarea><button class="btn" onclick="gtDo('comment',true)">Comment</button></div>
    <div style="margin-top:14px;max-height:260px;overflow:auto">${t.log.slice().reverse().map(l=>`<div style="padding:8px 0;border-top:1px solid var(--line2);font-size:13px"><b>${esc(l.by)}</b> <span class="muted" dir="ltr">· ${new Date(l.at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span><div>${l.type==='comment'?bd(l.text):l.type==='returned'?'<span style="color:var(--bad)">↩️ Returned'+(l.kind?' ('+esc(l.kind)+')':'')+':</span> '+bd(l.text):l.type==='created'?'Created the task':bd(l.text||l.type)}</div></div>`).join('')}</div>
  </div></div>`;
}
/* ----- مراحل التسليم ----- */
const GT_STP={open:['Open',''],review:['Waiting for approval','p-yel'],approved:['Approved ✓','p-in']};
function gtStagesHTML(t){
  const me=S.user.username, open=t.status!=='Done'&&t.status!=='Cancelled';
  return `<div class="gt-stages"><div class="muted" style="font-size:12px;margin-bottom:6px">Stages · ${t.stages.filter(x=>x.status==='approved').length}/${t.stages.length} approved</div>
    ${t.stages.map((s,i)=>{
      const prevOk=t.stages.slice(0,i).every(x=>x.status==='approved');
      const edit=t.can.work&&open&&s.status==='open';
      const b=[];
      if(open&&t.owner===me&&s.status==='open'&&prevOk) b.push(`<button class="btn primary small" onclick="gtStSub('${esc(s.id)}')">Submit stage</button>`);
      if(open&&t.can.review&&s.status==='review'){ b.push(`<button class="btn primary small" onclick="gtStDo('stok','${esc(s.id)}')">✓ Approve</button>`); b.push(`<button class="btn small" onclick="gtStRet('${esc(s.id)}')">↩️ Return</button>`); }
      return `<div class="gt-st ${s.status}"><div class="gt-st-h"><span class="gt-st-n">${s.status==='approved'?'✓':i+1}</span><b>${esc(s.name)}</b><span class="pill ${GT_STP[s.status][1]}">${GT_STP[s.status][0]}</span>
        ${s.okAt?`<span class="muted" style="font-size:12px">· ${esc(s.okBy)}</span>`:s.subAt&&s.status==='review'?`<span class="muted" style="font-size:12px">· sent by ${esc(s.subBy)}</span>`:''}</div>
        ${edit?`<div style="display:flex;gap:8px;align-items:flex-start;margin-top:8px" dir="rtl"><textarea id="gtSl_${esc(s.id)}" class="ml" dir="auto" rows="1" maxlength="2000" placeholder="التسليم: لينك أو كلام">${esc(s.link||'')}</textarea><button class="btn small" type="button" onclick="gtStSave('${esc(s.id)}')">Save</button></div>${s.link&&/https?:\/\//i.test(s.link)?`<div class="tl-txt" style="margin-top:4px">${txtLinks(s.link)}</div>`:''}`
          :s.link?`<div class="tl-txt" dir="rtl" style="margin-top:6px">📎 ${txtLinks(s.link)}</div>`:''}
        ${(s.returns||[]).length?`<div class="gt-st-r" dir="rtl">${s.returns.map(r=>`<div>↩️ <b>${esc(r.by)}</b>: ${bd(r.note)} <span class="muted" dir="ltr">· ${new Date(r.at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span></div>`).join('')}</div>`:''}
        ${b.length?`<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">${b.join('')}</div>`:''}</div>`;
    }).join('')}</div>`;
}
function gtStVal(sid){ const el=$('gtSl_'+sid); return el?el.value.trim():undefined; }
function gtStSave(sid){ gtDo('stsave',false,false,{sid,link:gtStVal(sid)||''}); }
function gtStSub(sid){ const link=gtStVal(sid); if(link!==undefined&&!link){ alert('حط التسليم (لينك أو كلام) الأول'); return; } gtDo('stsub',false,false,{sid,link}); }
function gtStDo(act,sid){ gtDo(act,false,false,{sid}); }
function gtStRet(sid){
  kpiModal('↩️ رجّع المرحلة',`<label for="kmR">الكومنت</label><textarea id="kmR" rows="3" dir="auto" class="ml" placeholder="إيه اللي محتاج يتعدّل؟"></textarea>`,()=>{
    const note=$('kmR').value.trim(); if(!note) return 'اكتب الكومنت';
    gtDo('stret',false,false,{sid,note});
  });
  setTimeout(()=>{ const r=$('kmR'); if(r) r.focus(); },50);
}
// اللي عليه التاسك يزود ناس التسليم يروحلهم
function gtApv(){
  const t=S.gtCur, L=S.cache.gt||{}, P=(L.people||[]).filter(p=>p.u!==t.owner&&p.u!==t.createdBy), cur=t.extraApprovers||[], lock=!t.can.manage;
  kpiModal('Approves delivery',`<div class="muted" style="font-size:13px;margin-bottom:8px">${esc(t.createdByName)} دايمًا بيوافق. اختار ناس زيادة يروحلهم التسليم كمان (موافقة واحد كفاية).</div>
    <input class="gt-ps" dir="auto" placeholder="Search" oninput="gtPsF(this)"><div class="gt-pick" style="max-height:260px">${P.map(p=>`<label class="check"><input type="checkbox" data-ga="${esc(p.u)}"${cur.indexOf(p.u)>=0?' checked':''}${lock&&cur.indexOf(p.u)>=0?' disabled':''}><span>${esc(p.name)}${p.job?` <small class="muted">· ${esc(p.job)}</small>`:''}</span></label>`).join('')}</div>`,()=>{
    const list=[...document.querySelectorAll('[data-ga]:checked')].map(x=>x.dataset.ga);
    gtDo('approvers',false,false,{list});
  });
}
function gtPsF(el){ const q=el.value.trim().toLowerCase(); el.nextElementSibling.querySelectorAll('label').forEach(l=>{ l.style.display=!q||l.textContent.toLowerCase().indexOf(q)>=0?'':'none'; }); }

/* ----- KPIs: رجّعها بنوعها / متوقفة ----- */
function gtRet(act){
  kpiModal('↩️ رجّع التاسك للتعديل',`${Object.keys(RET_K).map((k,i)=>`<label class="check cf-opt"><input type="radio" name="kmK" value="${k}"${i===0?' checked':''}><span><b>${RET_K[k][0]}</b><small>${RET_K[k][1]}</small></span></label>`).join('')}
    <label for="kmR">السبب</label><textarea id="kmR" rows="3" dir="auto" class="ml" placeholder="إيه اللي محتاج يتعدّل؟"></textarea>`,()=>{
    const note=$('kmR').value.trim(); if(!note) return 'اكتب السبب';
    const kind=(document.querySelector('input[name="kmK"]:checked')||{}).value||'qa';
    gtDo(act,false,false,{note,kind});
  });
}
async function gtBlk(){
  const O=await blkOptsGet();
  kpiModal('⛔ التاسك متوقفة',blkFormHTML(O,''),()=>{
    const note=$('kmR').value.trim(); if(!note) return 'اكتب التفاصيل';
    const b=blkVals(); if(b.err) return b.err;
    gtDo('block',false,false,Object.assign(b,{note}));
  });
}
function gtDeliver(){ const el=$('gtLk'); if(!el) return; gtDo('deliver',false,false,{link:el.value.trim()}); }
function gtBlkRej(){ kpiModal('رفض التوقف',`<label for="kmR">ليه؟ (اختياري)</label><textarea id="kmR" rows="2" dir="auto" class="ml"></textarea>`,()=>{ gtDo('blockrej',false,false,{note:$('kmR').value.trim()}); }); }
async function gtDo(act,withNote,needNote,extra){
  let note='';
  if(extra){ note=extra.note||''; }
  else if(act==='comment'){ note=$('gtNote').value.trim(); if(!note) return; }
  else if(needNote){ note=prompt('إيه اللي محتاج يتعدّل؟')||''; if(!note.trim()) return; }
  else if(withNote && act!=='approve' && act!=='submit'){ if(!confirm({cancel:'تلغي التاسك دي؟',reopen:'تفتح التاسك دي تاني؟'}[act]||'متأكد؟')) return; }
  try{
    const t=await call('gtAct',Object.assign({id:S.gtCur.id,act,note},extra||{}));
    toast({comment:'اتضاف التعليق ✓',stsub:'المرحلة اتسلمت ✓',stok:'اتوافق عليها ✓',stret:'المرحلة رجعت بالكومنت ✓',approvers:'اتحفظ ✓ والتسليم هيروحلهم'}[act]||'اتحفظ ✓');
    gtShow(t); gtReload().catch(()=>{}); S.cache.desk=null;
  }catch(e){ alert(e.message); }
}

/* ----- إنشاء / تعديل ----- */
const GT_ST_QUICK=['Wireframe','UI','Analysis','Content','Development','Testing'];
// قايمة ناس بـ checkboxes وبحث
function gtPickHTML(key,list,sel,lockU){
  return `<input class="gt-ps" dir="auto" placeholder="Search" oninput="gtPsF(this)" aria-label="Search people"><div class="gt-pick">${list.map(p=>`<label class="check"><input type="checkbox" data-${key}="${esc(p.u)}"${sel.indexOf(p.u)>=0?' checked':''} onchange="gtCnt()"><span>${esc(p.name)}${p.job?` <small class="muted">· ${esc(p.job)}</small>`:''}</span></label>`).join('')}</div>`;
}
function gtCnt(){ [['gc','gtCc'],['gv','gtCr'],['gw','gtCw']].forEach(([k,id])=>{ const el=$(id); if(el) el.textContent=document.querySelectorAll('[data-'+k+']:checked').length; }); }
function gtStRows(){ const box=$('gtStL'); if(!box) return; const st=S.gtEditSt||[];
  box.innerHTML=st.length?st.map((x,i)=>`<div class="gt-str"><span class="gt-st-n">${i+1}</span><input dir="auto" value="${esc(x.name)}" maxlength="60" placeholder="Stage name" oninput="S.gtEditSt[${i}].name=this.value"${x.locked?' disabled title="Already sent or approved"':''}>
    <button class="iconbtn" type="button" onclick="gtStMv(${i},-1)" aria-label="Move up"${i?'':' disabled'}>↑</button><button class="iconbtn" type="button" onclick="gtStRm(${i})" aria-label="Remove"${x.locked?' disabled':''}>✕</button></div>`).join('')
    :'<div class="muted" style="font-size:13px">No stages: the task is delivered once.</div>';
  const c=$('gtCs'); if(c) c.textContent=st.length; }
function gtStAdd(name){ S.gtEditSt=S.gtEditSt||[]; if(S.gtEditSt.length>=10) return; S.gtEditSt.push({name:name||''}); gtStRows(); if(!name){ const ins=$('gtStL').querySelectorAll('input'); ins[ins.length-1].focus(); } }
function gtStRm(i){ S.gtEditSt.splice(i,1); gtStRows(); }
function gtStMv(i,d){ const a=S.gtEditSt, j=i+d; if(j<0||j>=a.length) return; [a[i],a[j]]=[a[j],a[i]]; gtStRows(); }
async function gtEdit(id,pre){
  let L=S.cache.gt; if(!L){ try{ L=await gtReload(); }catch(e){ alert(e.message); return; } }
  const t=id? gtFind(id) : {title:'',desc:'',owner:S.user.username,contributors:[],extraApprovers:[],watchers:[],stages:[],priority:'Medium',due:'',deps:[],createdBy:S.user.username};
  const P=L.people, me=S.user.username, creator=t.createdBy||me;
  // أي حد يدّي لأي حد، ما عدا الـ C-level (بس الـ C-level يدّوا لبعض). السيرفر بيبعت مين ينفع.
  const AS=L.assignable||P.map(p=>p.u), owners=P.filter(p=>AS.indexOf(p.u)>=0||p.u===t.owner);
  const opt=(list,val,blank)=>(blank?`<option value="">${blank}</option>`:'')+list.map(p=>`<option value="${esc(p.u)}"${p.u===val?' selected':''}>${esc(p.name)}${p.job?' · '+esc(p.job):''}</option>`).join('');
  const cont=(t.contributors||[]).map(x=>x.u||x), apv=(t.extraApprovers||[]).slice(), wat=(t.watchers||[]).map(x=>x.u||x);
  const deps=(t.deps||[]).map(d=>d.id||d);
  const depList=L.depsPick.filter(d=>d.id!==t.id);
  S.gtEditSt=(t.stages||[]).map(x=>({id:x.id,name:x.name,locked:x.status==='approved'||x.status==='review'}));
  const crName=(P.find(p=>p.u===creator)||{}).name||creator;
  // المشروع (اختياري): في التاسكات الإيدوي بس (مش اللي جاية من اجتماع أو طلب)
  const src=t.source||{}, canPj=!id||!src.type||src.type==='manual'||src.type==='project';
  const curPj=(pre&&pre.project)||(src.type==='project'?src.id:'');
  const PJ=(L.projects||[]).slice(); if(curPj && !PJ.some(x=>x.id===curPj)) PJ.unshift({id:curPj,client:src.label||curPj});
  const pjSel=canPj&&PJ.length?`<label for="gtPj">Project <span class="muted" style="font-weight:400">(optional)</span></label><select id="gtPj"><option value="">— No project —</option>${PJ.map(x=>`<option value="${esc(x.id)}"${x.id===curPj?' selected':''}>${esc(x.client)} · ${esc(x.id)}${x.status&&x.status!=='Active'?' ('+esc(x.status)+')':''}</option>`).join('')}</select><div class="gt-hint" dir="rtl">اللي على التاسك والمراقبين هيقدروا يفتحوا المشروع والبريف للقراءة لحد ما التاسك تخلص</div>`:'';
  const sec=(title,body)=>`<div class="gt-sec"><div class="gt-sec-h">${title}</div>${body}</div>`;
  $('modalRoot').innerHTML=`<div class="modal"><div class="card gt-form" style="max-width:860px">
    <h2>${id?'Edit task':'New task'}</h2>
    ${sec('Task',`<label for="gtT">Title</label><input id="gtT" dir="auto" maxlength="200" value="${esc(t.title)}" placeholder="What needs to be done">
      <label for="gtD">Details</label><textarea id="gtD" dir="auto" rows="3" maxlength="3000" placeholder="Optional">${esc(t.desc)}</textarea>
      ${pjSel}
      <div class="row"><div><label for="gtP">Priority</label><select id="gtP">${['Low','Medium','High','Urgent'].map(p=>`<option${p===t.priority?' selected':''}>${p}</option>`).join('')}</select></div>
        <div><label for="gtDue">Deadline</label><input id="gtDue" type="date" value="${esc(t.due)}"></div></div>`)}
    ${sec('People',`<div class="row"><div><label for="gtO">Assigned to</label><select id="gtO">${opt(owners,t.owner)}</select><div class="gt-hint">Who does the work</div></div>
        <div><label>Approves delivery</label><div class="gt-fixed" id="gtFx"></div><div class="gt-hint" id="gtFxH"></div></div></div>
      <details class="gt-dt"${apv.length?' open':''}><summary>+ More people who approve delivery (<span id="gtCr">${apv.length}</span>)</summary>${gtPickHTML('gv',P.filter(p=>p.u!==creator),apv)}</details>
      <details class="gt-dt"${wat.length?' open':''}><summary>👁 Watchers (<span id="gtCw">${wat.length}</span>) <small class="muted">· optional: can see the task and comment, nothing else</small></summary>${gtPickHTML('gw',P,wat)}</details>
      <details class="gt-dt"${cont.length?' open':''}><summary>🤝 People helping (<span id="gtCc">${cont.length}</span>)</summary>${gtPickHTML('gc',P.filter(p=>AS.indexOf(p.u)>=0||cont.indexOf(p.u)>=0),cont)}</details>`)}
    ${sec('Delivery',`<details class="gt-dt"${S.gtEditSt.length?' open':''}><summary>Stages (<span id="gtCs">${S.gtEditSt.length}</span>) <small class="muted">· optional: deliver the task step by step, each step gets approved</small></summary>
        <div id="gtStL" style="margin-top:8px"></div>
        <div class="gt-stq">${GT_ST_QUICK.map(n=>`<button type="button" class="chip" onclick="gtStAdd('${n}')">+ ${n}</button>`).join('')}<button type="button" class="chip" onclick="gtStAdd()">+ Other…</button></div></details>
      <details class="gt-dt"${deps.length?' open':''}><summary>Has to wait for (${deps.length})</summary>
      ${depList.length?`<div class="gt-pick">${depList.map(d=>`<label class="check"><input type="checkbox" data-gd="${esc(d.id)}"${deps.indexOf(d.id)>=0?' checked':''}><span>${bd(d.title)} <small class="muted">· ${esc(d.owner)}</small></span></label>`).join('')}</div>`:'<div class="muted" style="margin-top:6px">No open tasks to pick from.</div>'}</details>`)}
    <div class="err" id="gtErr"></div>
    <div class="mfoot"><span class="spacer"></span><button class="btn" onclick="closeModal()">Cancel</button><button class="btn primary" id="gtSaveB" onclick="gtSave('${id?esc(id):''}')">${id?'Save':'Create task'}</button></div>
  </div></div>`;
  gtStRows();
  // لو التاسك لنفسك: مفيش حد ثابت بيوافق (ممكن تزود ناس)
  const fx=()=>{ const self=$('gtO').value===creator;
    $('gtFx').innerHTML=self?'<span class="muted">No one: it\'s your own task</span>':`✓ ${esc(crName)} <small class="muted">· always</small>`;
    $('gtFxH').textContent=self?'Add people below if you want someone to approve it.':'The delivery goes to them for approval. One approval is enough.'; };
  $('gtO').onchange=fx; fx();
  setTimeout(()=>$('gtT').focus(),50);
}
async function gtSave(id){
  const sel=k=>[...document.querySelectorAll('[data-'+k+']:checked')].map(x=>x.getAttribute('data-'+k));
  const task={id:id||undefined,title:$('gtT').value,desc:$('gtD').value,owner:$('gtO').value,priority:$('gtP').value,due:$('gtDue').value,
    reviewers:sel('gv'),watchers:sel('gw'),contributors:sel('gc'),deps:sel('gd'),
    stages:(S.gtEditSt||[]).map(x=>({id:x.id,name:String(x.name||'').trim()})).filter(x=>x.name)};
  if($('gtPj')) task.project=$('gtPj').value;
  const b=$('gtSaveB'); b.disabled=true; b.textContent='Saving...';
  try{ const t=await call('gtSave',{task}); closeModal(); toast('اتحفظت التاسك ✓'); if(task.owner!==S.user.username) S.gtTab='assigned'; await gtReload(); S.cache.desk=null;
    if(S.view==='tasks') gtShow(t); else if(S.proj&&S.proj.id&&task.project===S.proj.id&&typeof viewProject==='function') viewProject(S.proj.id,true); }
  catch(e){ $('gtErr').textContent=e.message; b.disabled=false; b.textContent=id?'Save':'Create task'; }
}
