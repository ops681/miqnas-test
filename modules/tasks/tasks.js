/* ============ Tasks (التاسكات العامة) ============
   تاسك من أي مصدر: صاحب، مشاركين، مراجع، أولوية، ديدلاين، وتاسكات لازم تخلص قبلها.
   تاسكات المشاريع لسه في My Tasks / Projects. */
const PRIO_COL={Low:'#98A2B3',Medium:'var(--blue)',High:'var(--accent)',Urgent:'#D92D20'};
const GT_PILL={'To Do':'p-absent','In Progress':'p-in','In Review':'p-yel','Done':'p-in','Cancelled':''};
S.gtTab='mine'; S.gtProj='';
function viewTasks(opts){
  setTop('Tasks','Tasks from meetings, requests and day-to-day work',`<button class="btn primary" onclick="gtEdit()">+ New task</button>`);
  swr('gt','gtList',{},(L)=>{ renderTasks(L); if(opts&&opts.id){ const id=opts.id; opts.id=null; gtOpen(id); } });
}
function gtFind(id){ const L=S.cache.gt||{}; return ['mine','review','assigned','team'].reduce((f,k)=>f||(L[k]||[]).find(t=>t.id===id),null); }
function gtRow(t){
  const meta=[];
  if(S.gtTab!=='mine') meta.push(esc(t.ownerName));
  if(t.due) meta.push(`<span style="color:${t.late?'var(--bad)':t.dueToday?'var(--warn)':'inherit'}">${t.late?'Late · ':t.dueToday?'Due today · ':'Due '}${fmtD(t.due)}</span>`);
  if(t.source&&t.source.label) meta.push(t.source.type==='project'?`<span class="gt-pj">📁 ${bd(t.source.label)}</span>`:esc(t.source.label));
  if(t.blocked) meta.push('<span style="color:var(--yel)">Waiting on '+t.deps.filter(d=>d.status!=='Done'&&d.status!=='Cancelled').map(d=>esc(d.title)).join(', ')+'</span>');
  return `<button class="al" onclick="gtOpen('${esc(t.id)}')"><span title="${t.priority}" style="flex:none;width:10px;height:10px;border-radius:3px;margin-top:6px;background:${PRIO_COL[t.priority]}"></span>
    <span class="tx"><b style="${t.status==='Done'||t.status==='Cancelled'?'text-decoration:line-through;color:var(--muted)':''}">${bd(t.title)}</b><span>${meta.join(' · ')||'&nbsp;'}</span></span>
    <span class="pill ${GT_PILL[t.status]||''}">${esc(t.status)}</span></button>`;
}
function renderTasks(L){
  const tabs=[['mine','My tasks',L.mine],['review','To review',L.review],['assigned','Assigned by me',L.assigned]].concat(L.team?[['team','My team',L.team]]:[]);
  if(!tabs.some(x=>x[0]===S.gtTab)) S.gtTab='mine';
  const all=L[S.gtTab]||[];
  // فلتر بالمشروع: المشاريع اللي ليها تاسكات في التاب ده بس
  const pj={}; all.forEach(t=>{ if(t.source&&t.source.type==='project'&&t.source.id) pj[t.source.id]=t.source.label; });
  if(S.gtProj && !pj[S.gtProj]) S.gtProj='';
  const pf=Object.keys(pj).length?`<select class="gt-pf" aria-label="Filter by project" onchange="S.gtProj=this.value;renderTasks(S.cache.gt)"><option value="">📁 All projects</option>${Object.keys(pj).sort((a,b)=>String(pj[a]).localeCompare(pj[b])).map(id=>`<option value="${esc(id)}"${S.gtProj===id?' selected':''}>${esc(pj[id])}</option>`).join('')}</select>`:'';
  const list=all.filter(t=>!S.gtProj||(t.source&&t.source.type==='project'&&t.source.id===S.gtProj)).slice().sort((a,b)=>{ const o=s=>['In Review','In Progress','To Do','Done','Cancelled'].indexOf(s); return o(a.status)-o(b.status) || (b.late-a.late) || ((a.due||'9')<(b.due||'9')?-1:1); });
  const open=list.filter(t=>t.status!=='Done'&&t.status!=='Cancelled'), closed=list.filter(t=>t.status==='Done'||t.status==='Cancelled');
  $('main').innerHTML=`<div class="gt-bar"><div class="flt">${tabs.map(x=>`<button class="${S.gtTab===x[0]?'on':''}" onclick="S.gtTab='${x[0]}';renderTasks(S.cache.gt)">${x[1]} <span>${x[2].filter(t=>t.status!=='Done'&&t.status!=='Cancelled').length}</span></button>`).join('')}</div>${pf}</div>
    <div class="card flush">${open.length?open.map(gtRow).join(''):`<div class="empty"><b>Nothing open</b>${S.gtTab==='review'?'No tasks are waiting for your review.':'No open tasks here.'}</div>`}</div>
    ${closed.length?`<h3 style="margin:22px 0 10px" class="muted">Finished in the last 2 weeks</h3><div class="card flush" style="opacity:.85">${closed.map(gtRow).join('')}</div>`:''}`;
}
async function gtReload(){ const L=await call('gtList'); S.cache.gt=L; S.fetched.gt=Date.now(); if(S.view==='tasks') renderTasks(L); return L; }

function gtOpen(id){
  const t=gtFind(id);
  if(t) return gtShow(t);
  call('gtGet',{id}).then(gtShow).catch(e=>alert(e.message));
}
function gtShow(t){
  S.gtCur=t;
  const c=t.can, btn=[];
  if(c.work && t.status==='To Do') btn.push(`<button class="btn" onclick="gtDo('start')"${t.blocked?' disabled title="Waiting on other tasks"':''}>Start</button>`);
  if(t.owner===S.user.username && (t.status==='To Do'||t.status==='In Progress')) btn.push(`<button class="btn primary" onclick="gtDo('submit',true)"${t.blocked?' disabled':''}>${t.reviewer?'Send for review':'Mark done'}</button>`);
  if(c.review && t.status==='In Review'){ btn.push(`<button class="btn primary" onclick="gtDo('approve',true)">Approve</button>`); btn.push(`<button class="btn" onclick="gtRet('return')">Return for changes</button>`); }
  const ob=(t.blocks||[]).find(b=>b.status==='open'), open=t.status!=='Done'&&t.status!=='Cancelled';
  if(c.work && open && !ob) btn.push(`<button class="btn ghost" onclick="gtBlk()">⛔ متوقفة</button>`);
  if(c.redo && t.status==='Done') btn.push(`<button class="btn" onclick="gtRet('redo')">↩️ رجّعها</button>`);
  if(c.manage && (t.status==='Done'||t.status==='Cancelled')) btn.push(`<button class="btn" onclick="gtDo('reopen',true)">Reopen</button>`);
  if(c.manage && t.status!=='Done' && t.status!=='Cancelled'){ btn.push(`<button class="btn" onclick="closeModal();gtEdit('${esc(t.id)}')">Edit</button>`); btn.push(`<button class="btn ghost danger" onclick="gtDo('cancel',true)">Cancel task</button>`); }
  const kv=(k,v)=>`<div><div class="muted" style="font-size:12px">${k}</div><div style="font-weight:600">${v}</div></div>`;
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:720px">
    <div style="display:flex;gap:10px;align-items:flex-start"><h2 style="flex:1;margin:0">${bd(t.title)}</h2><span class="pill ${GT_PILL[t.status]||''}">${esc(t.status)}</span><button class="iconbtn" onclick="closeModal()" aria-label="Close">✕</button></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin:16px 0">
      ${kv('Owner',esc(t.ownerName))}${kv('Priority',`<span style="color:${PRIO_COL[t.priority]}">● </span>`+esc(t.priority))}${kv('Deadline',t.due?`<span style="color:${t.late?'var(--bad)':'inherit'}">${fmtD(t.due)}${t.late?' · late':''}</span>`:'—')}
      ${kv('Reviewer',t.reviewerName?esc(t.reviewerName):'—')}${kv('Helping',t.contributors.length?t.contributors.map(x=>esc(x.name)).join('، '):'—')}${kv('Created by',esc(t.createdByName))}
      ${t.source&&t.source.type==='project'&&t.source.label?kv('Project',t.source.open?`<a href="#" onclick="closeModal();goTo({view:'project',id:'${esc(t.source.id)}'});return false">📁 ${bd(t.source.label)} ↗</a>`:'📁 '+bd(t.source.label))
        :t.source&&t.source.label?kv('From',esc(t.source.type)+' · '+(t.source.type==='meeting'?`<a href="#" onclick="closeModal();go('meetings',{id:'${esc(t.source.id)}'});return false">${esc(t.source.label)}</a>`:esc(t.source.label))):''}
    </div>
    ${t.desc?`<div style="white-space:pre-wrap;background:var(--bg);border-radius:10px;padding:12px 14px;margin-bottom:14px">${bd(t.desc)}</div>`:''}
    ${t.can.work&&t.status!=='Cancelled'?`<div style="margin-bottom:14px" dir="rtl"><label for="gtLk">التسليم <span class="muted" style="font-weight:400">(اختياري)</span></label>
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
/* ----- KPIs: رجّعها بنوعها / متوقفة ----- */
function gtRet(act){
  kpiModal('↩️ رجّع التاسك للتعديل',`${Object.keys(RET_K).map((k,i)=>`<label class="check cf-opt"><input type="radio" name="kmK" value="${k}"${i===0?' checked':''}><span><b>${RET_K[k][0]}</b><small>${RET_K[k][1]}</small></span></label>`).join('')}
    <label for="kmR">السبب</label><textarea id="kmR" rows="3" dir="auto" class="ml" placeholder="إيه اللي محتاج يتعدّل؟"></textarea>`,()=>{
    const note=$('kmR').value.trim(); if(!note) return 'اكتب السبب';
    const kind=(document.querySelector('input[name="kmK"]:checked')||{}).value||'qa';
    gtDo(act,false,false,{note,kind});
  });
}
function gtBlk(){
  kpiModal('⛔ التاسك متوقفة',`<label for="kmC">السبب</label><select id="kmC">${Object.keys(TBLK).map(k=>`<option value="${k}">${TBLK[k]}</option>`).join('')}</select>
    <label for="kmR">التفاصيل</label><textarea id="kmR" rows="3" dir="auto" class="ml"></textarea>`,()=>{
    const note=$('kmR').value.trim(); if(!note) return 'اكتب التفاصيل';
    gtDo('block',false,false,{note,cause:$('kmC').value});
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
    toast(act==='comment'?'اتضاف التعليق ✓':'اتحفظ ✓');
    gtShow(t); gtReload().catch(()=>{}); S.cache.desk=null;
  }catch(e){ alert(e.message); }
}

/* ----- إنشاء / تعديل ----- */
async function gtEdit(id,pre){
  let L=S.cache.gt; if(!L){ try{ L=await gtReload(); }catch(e){ alert(e.message); return; } }
  const t=id? gtFind(id) : {title:'',desc:'',owner:S.user.username,contributors:[],reviewer:'',priority:'Medium',due:'',deps:[]};
  const P=L.people, me=S.user.username;
  const owners=L.canAssign? P : P.filter(p=>p.u===me);
  const opt=(list,val,blank)=>(blank?`<option value="">${blank}</option>`:'')+list.map(p=>`<option value="${esc(p.u)}"${p.u===val?' selected':''}>${esc(p.name)}${p.job?' · '+esc(p.job):''}</option>`).join('');
  const cont=(t.contributors||[]).map(x=>x.u||x);
  const deps=(t.deps||[]).map(d=>d.id||d);
  const depList=L.depsPick.filter(d=>d.id!==t.id);
  // المشروع (اختياري): في التاسكات الإيدوي بس (مش اللي جاية من اجتماع أو طلب)
  const src=t.source||{}, canPj=!id||!src.type||src.type==='manual'||src.type==='project';
  const curPj=(pre&&pre.project)||(src.type==='project'?src.id:'');
  const PJ=(L.projects||[]).slice(); if(curPj && !PJ.some(x=>x.id===curPj)) PJ.unshift({id:curPj,client:src.label||curPj});
  const pjSel=canPj&&PJ.length?`<label for="gtPj">Project <span class="muted" style="font-weight:400">(optional)</span></label><select id="gtPj"><option value="">— No project —</option>${PJ.map(x=>`<option value="${esc(x.id)}"${x.id===curPj?' selected':''}>${esc(x.client)} · ${esc(x.id)}${x.status&&x.status!=='Active'?' ('+esc(x.status)+')':''}</option>`).join('')}</select><div class="muted" style="font-size:12.5px;margin-top:4px" dir="rtl">اللي عليه التاسك هيقدر يفتح المشروع والبريف للقراءة لحد ما التاسك تخلص</div>`:'';
  $('modalRoot').innerHTML=`<div class="modal"><div class="card" style="max-width:640px">
    <h2>${id?'Edit task':'New task'}</h2>
    <label for="gtT">Title</label><input id="gtT" maxlength="200" value="${esc(t.title)}" placeholder="What needs to be done">
    <label for="gtD">Details</label><textarea id="gtD" rows="3" maxlength="3000" placeholder="Optional">${esc(t.desc)}</textarea>
    ${pjSel}
    <div class="row"><div><label for="gtO">Owner</label><select id="gtO">${opt(owners,t.owner)}</select></div>
      <div><label for="gtR">Reviewer</label><select id="gtR">${opt(P.filter(p=>p.u!==t.owner),t.reviewer,'No review')}</select></div></div>
    <div class="row"><div><label for="gtP">Priority</label><select id="gtP">${['Low','Medium','High','Urgent'].map(p=>`<option${p===t.priority?' selected':''}>${p}</option>`).join('')}</select></div>
      <div><label for="gtDue">Deadline</label><input id="gtDue" type="date" value="${esc(t.due)}"></div></div>
    ${L.canAssign?`<details style="margin-top:12px"><summary style="cursor:pointer;font-weight:600">People helping (${cont.length})</summary><div class="chips" style="margin-top:8px;max-height:150px;overflow:auto">${P.map(p=>`<label class="check" style="margin:4px 12px 4px 0"><input type="checkbox" data-gc="${esc(p.u)}"${cont.indexOf(p.u)>=0?' checked':''}>${esc(p.name)}</label>`).join('')}</div></details>`:''}
    <details style="margin-top:12px"${deps.length?' open':''}><summary style="cursor:pointer;font-weight:600">Has to wait for (${deps.length})</summary>
      ${depList.length?`<div style="margin-top:8px;max-height:160px;overflow:auto">${depList.map(d=>`<label class="check" style="margin:4px 0"><input type="checkbox" data-gd="${esc(d.id)}"${deps.indexOf(d.id)>=0?' checked':''}>${bd(d.title)} <span class="muted">· ${esc(d.owner)}</span></label>`).join('')}</div>`:'<div class="muted" style="margin-top:6px">No open tasks to pick from.</div>'}</details>
    <div class="err" id="gtErr"></div>
    <div class="mfoot"><span class="spacer"></span><button class="btn" onclick="closeModal()">Cancel</button><button class="btn primary" id="gtSaveB" onclick="gtSave('${id?esc(id):''}')">${id?'Save':'Create task'}</button></div>
  </div></div>`;
  $('gtO').onchange=()=>{ const o=$('gtO').value, r=$('gtR').value; $('gtR').innerHTML=opt(P.filter(p=>p.u!==o),r===o?'':r,'No review'); };
  setTimeout(()=>$('gtT').focus(),50);
}
async function gtSave(id){
  const task={id:id||undefined,title:$('gtT').value,desc:$('gtD').value,owner:$('gtO').value,reviewer:$('gtR').value,priority:$('gtP').value,due:$('gtDue').value,
    contributors:[...document.querySelectorAll('[data-gc]:checked')].map(x=>x.dataset.gc),deps:[...document.querySelectorAll('[data-gd]:checked')].map(x=>x.dataset.gd)};
  if($('gtPj')) task.project=$('gtPj').value;
  const b=$('gtSaveB'); b.disabled=true; b.textContent='Saving...';
  try{ const t=await call('gtSave',{task}); closeModal(); toast('اتحفظت التاسك ✓'); if(task.owner!==S.user.username) S.gtTab='assigned'; await gtReload(); S.cache.desk=null;
    if(S.view==='tasks') gtShow(t); else if(S.proj&&S.proj.id&&task.project===S.proj.id&&typeof viewProject==='function') viewProject(S.proj.id,true); }
  catch(e){ $('gtErr').textContent=e.message; b.disabled=false; b.textContent=id?'Save':'Create task'; }
}
