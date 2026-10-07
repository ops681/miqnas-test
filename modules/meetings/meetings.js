/* ============ Meetings ============
   اجتماع ← ملاحظات وقرارات ← Action items بتتحول تاسكات على أصحابها. */
function viewMeetings(opts){
  setTop('Meetings','Agenda, notes, decisions and action items', '');
  swr('mt','mtList',{},L=>{
    $('topActions').innerHTML=L.canCreate?`<button class="btn primary" onclick="mtEdit()">+ New meeting</button>`:'';
    renderMeetings(L);
    if(opts&&opts.id){ const id=opts.id; opts.id=null; mtOpen(id); }
  });
}
function mtFind(id){ const L=S.cache.mt||{}; return (L.upcoming||[]).concat(L.past||[]).find(x=>x.id===id); }
function mtCard(x){
  const done=x.actions.filter(a=>a.status==='Done').length;
  return `<button class="al" onclick="mtOpen('${esc(x.id)}')"><span style="flex:none;text-align:center;width:52px;border:1px solid var(--line);border-radius:10px;padding:4px 0">
      <div class="muted" style="font-size:11px">${new Date(x.date+'T12:00:00').toLocaleDateString('en-GB',{month:'short'})}</div><b style="font-size:18px">${new Date(x.date+'T12:00:00').getDate()}</b></span>
    <span class="tx"><b>${bd(x.title)}</b><span>${x.time?esc(x.time)+' · ':''}${esc(x.organizerName)} · ${x.attendees.length} ${x.attendees.length===1?'person':'people'}${x.actions.length?' · '+done+'/'+x.actions.length+' action items done':''}</span></span>
    <span class="pill ${x.status==='Done'?'p-in':'p-absent'}">${x.status==='Done'?'Done':'Scheduled'}</span></button>`;
}
function renderMeetings(L){
  $('main').innerHTML=`<h3 style="margin:0 0 10px">Upcoming</h3>
    <div class="card flush">${L.upcoming.length?L.upcoming.map(mtCard).join(''):`<div class="empty"><b>No upcoming meetings</b>${L.canCreate?'Create one with + New meeting.':'Meetings you are invited to show up here.'}</div>`}</div>
    ${L.past.length?`<h3 style="margin:22px 0 10px">Past</h3><div class="card flush">${L.past.map(mtCard).join('')}</div>`:''}`;
}
async function mtReload(){ const L=await call('mtList'); S.cache.mt=L; S.fetched.mt=Date.now(); if(S.view==='meetings') renderMeetings(L); return L; }
function mtOpen(id){ const x=mtFind(id); if(x) mtShow(x); else mtReload().then(()=>{ const y=mtFind(id); if(y) mtShow(y); else alert('الاجتماع ده مش موجود أو مش من صلاحياتك'); }).catch(e=>alert(e.message)); }
function mtShow(x){
  S.mtCur=x;
  const P=(S.cache.mt||{}).people||[];
  const ownerOpts=v=>P.map(p=>`<option value="${esc(p.u)}"${p.u===v?' selected':''}>${esc(p.name)}</option>`).join('');
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:760px">
    <div style="display:flex;gap:10px;align-items:flex-start"><div style="flex:1"><h2 style="margin:0">${bd(x.title)}</h2>
      <div class="muted" style="margin-top:4px">${new Date(x.date+'T12:00:00').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}${x.time?' · '+esc(x.time):''} · by ${esc(x.organizerName)}</div></div>
      ${x.canEdit?`<button class="btn small" onclick="closeModal();mtEdit('${esc(x.id)}')">Edit</button>`:''}<button class="iconbtn" onclick="closeModal()" aria-label="Close">✕</button></div>
    <div style="margin:14px 0"><div class="muted" style="font-size:12px;margin-bottom:4px">Attendees</div>${x.attendees.map(a=>`<span class="pill" style="background:var(--line2);margin:0 6px 6px 0">${esc(a.name)}</span>`).join('')||'—'}</div>
    ${x.agenda?`<div class="muted" style="font-size:12px;margin-bottom:4px">Agenda</div><div style="white-space:pre-wrap;background:var(--bg);border-radius:10px;padding:12px 14px;margin-bottom:14px">${bd(x.agenda)}</div>`:''}
    ${x.canEdit?`<label for="mtN">Notes</label><textarea id="mtN" rows="4" maxlength="6000" placeholder="What was discussed">${esc(x.notes)}</textarea>
      <label for="mtDec">Decisions</label><textarea id="mtDec" rows="3" maxlength="3000" placeholder="What was decided">${esc(x.decisions)}</textarea>
      <div class="mfoot" style="margin-top:8px"><label class="check" style="margin:0"><input type="checkbox" id="mtDone"${x.status==='Done'?' checked':''}>Meeting is done</label><span class="spacer"></span><button class="btn" id="mtNB" onclick="mtSaveNotes()">Save notes</button></div>`
      :`${x.notes?`<div class="muted" style="font-size:12px;margin-bottom:4px">Notes</div><div style="white-space:pre-wrap;margin-bottom:12px">${bd(x.notes)}</div>`:''}${x.decisions?`<div class="muted" style="font-size:12px;margin-bottom:4px">Decisions</div><div style="white-space:pre-wrap;margin-bottom:12px">${bd(x.decisions)}</div>`:''}`}
    <h3 style="margin:18px 0 8px">Action items</h3>
    ${x.actions.length?x.actions.map(a=>`<div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-top:1px solid var(--line2)"><span class="pill ${GT_PILL[a.status]||''}">${esc(a.status||'—')}</span><span style="flex:1">${bd(a.text)} <span class="muted">· ${esc(a.ownerName)}${a.due?' · due '+fmtD(a.due):''}</span></span>${a.taskId?`<button class="btn small ghost" onclick="closeModal();go('tasks',{id:'${esc(a.taskId)}'})">Open task</button>`:''}</div>`).join(''):'<div class="muted">No action items yet.</div>'}
    ${x.canEdit?`<div style="margin-top:12px;background:var(--bg);border-radius:10px;padding:12px">
      <div class="muted" style="font-size:12.5px;margin-bottom:6px">New action items · each one becomes a task for its owner and they get notified</div>
      <div id="mtAI">${[0,1,2].map(i=>`<div class="row" style="margin-bottom:6px"><div style="flex:3"><input data-ai="${i}|text" placeholder="Action item"></div><div><select data-ai="${i}|owner">${ownerOpts(S.user.username)}</select></div><div><input type="date" data-ai="${i}|due"></div></div>`).join('')}</div>
      <div class="mfoot"><span class="spacer"></span><button class="btn primary" id="mtAB" onclick="mtAddActions()">Create tasks</button></div><div class="err" id="mtErr"></div></div>`:''}
  </div></div>`;
}
async function mtSaveNotes(){
  const x=S.mtCur, b=$('mtNB'); b.disabled=true; b.textContent='Saving...';
  try{ const r=await call('mtSave',{meeting:{id:x.id,title:x.title,date:x.date,time:x.time,attendees:x.attendees.map(a=>a.u),agenda:x.agenda,notes:$('mtN').value,decisions:$('mtDec').value,status:$('mtDone').checked?'Done':'Scheduled'}});
    toast('اتحفظت الملاحظات ✓'); await mtReload(); mtShow(r); }
  catch(e){ alert(e.message); b.disabled=false; b.textContent='Save notes'; }
}
async function mtAddActions(){
  const rows={};
  document.querySelectorAll('[data-ai]').forEach(el=>{ const [i,f]=el.dataset.ai.split('|'); (rows[i]||(rows[i]={}))[f]=el.value.trim(); });
  const actions=Object.values(rows).filter(r=>r.text);
  if(!actions.length){ $('mtErr').textContent='اكتب Action item واحد على الأقل'; return; }
  const b=$('mtAB'); b.disabled=true; b.textContent='Creating...';
  try{ const r=await call('mtActions',{id:S.mtCur.id,actions}); toast('اتعملت '+actions.length+' تاسك ✓'); await mtReload(); S.cache.gt=null; mtShow(r); }
  catch(e){ $('mtErr').textContent=e.message; b.disabled=false; b.textContent='Create tasks'; }
}
async function mtEdit(id){
  let L=S.cache.mt; if(!L){ try{ L=await mtReload(); }catch(e){ alert(e.message); return; } }
  const x=id? mtFind(id) : {title:'',date:new Date().toISOString().slice(0,10),time:'',attendees:[],agenda:''};
  const att=x.attendees.map(a=>a.u||a);
  $('modalRoot').innerHTML=`<div class="modal"><div class="card" style="max-width:620px">
    <h2>${id?'Edit meeting':'New meeting'}</h2>
    <label for="mT">Title</label><input id="mT" maxlength="150" value="${esc(x.title)}" placeholder="e.g. Weekly operations">
    <div class="row"><div><label for="mD">Date</label><input id="mD" type="date" value="${esc(x.date)}"></div><div><label for="mTi">Time</label><input id="mTi" type="time" value="${esc(x.time)}"></div></div>
    <label for="mA">Agenda</label><textarea id="mA" rows="4" maxlength="3000" placeholder="One point per line">${esc(x.agenda)}</textarea>
    <div style="margin-top:12px;font-weight:600">Attendees</div>
    <div class="chips" style="margin-top:6px;max-height:170px;overflow:auto">${L.people.filter(p=>p.u!==S.user.username).map(p=>`<label class="check" style="margin:4px 12px 4px 0"><input type="checkbox" data-ma="${esc(p.u)}"${att.indexOf(p.u)>=0?' checked':''}>${esc(p.name)}</label>`).join('')}</div>
    <div class="err" id="mErr"></div>
    <div class="mfoot"><span class="spacer"></span><button class="btn" onclick="closeModal()">Cancel</button><button class="btn primary" id="mSB" onclick="mtSave('${id?esc(id):''}')">${id?'Save':'Create meeting'}</button></div>
  </div></div>`;
}
async function mtSave(id){
  const x=id?mtFind(id):{};
  const meeting={id:id||undefined,title:$('mT').value,date:$('mD').value,time:$('mTi').value,agenda:$('mA').value,attendees:[...document.querySelectorAll('[data-ma]:checked')].map(e=>e.dataset.ma),
    notes:x.notes,decisions:x.decisions,status:x.status};
  const b=$('mSB'); b.disabled=true; b.textContent='Saving...';
  try{ const r=await call('mtSave',{meeting}); closeModal(); toast('اتحفظ الاجتماع ✓'); await mtReload(); mtShow(r); }
  catch(e){ $('mErr').textContent=e.message; b.disabled=false; b.textContent=id?'Save':'Create meeting'; }
}
