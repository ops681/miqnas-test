/* ============ Leave & Requests ============
   إجازات، أذونات بالساعة (لو متفعّلة)، وأوفر تايم.
   الموافقة: مدير القسم ← HR. طلب الـ HR بيروح للـ CEO. الأوفر تايم: أي حد معاه Overtime approval. */
const RQ_STATUS={pending:['Waiting','p-yel'],approved:['Approved','p-in'],rejected:['Rejected','p-bad'],cancelled:['Cancelled','p-out']};
const RQ_KIND={leave:'Leave',permission:'Permission',overtime:'Overtime'};
S.rqTab='mine';
function viewRequests(opts){
  if(opts&&opts.tab) S.rqTab=opts.tab;
  setTop('Leave & Requests','Leave, permissions and overtime');
  $('main').innerHTML=LOADING;
  Promise.all([call('reqMeta'),call('reqList')]).then(([M,L])=>{ S.rqMeta=M; S.rqList=L; renderRequests(); }).catch(e=>{ $('main').innerHTML=`<div class="card err">${esc(e.message)}</div>`; });
}
async function rqReload(){ const [M,L]=await Promise.all([call('reqMeta'),call('reqList')]); S.rqMeta=M; S.rqList=L; renderRequests(); refreshDash(); }
function rqWhen(r){
  if(r.kind==='permission') return `${fmtD(r.from)} · ${esc(r.timeFrom)}–${esc(r.timeTo)} · ${r.hours} h`;
  if(r.kind==='overtime') return `${fmtD(r.from)} · ${r.hours} h${r.source==='manual'?' · entered manually':r.source==='auto'?' · from clock-out':''}`;
  return `${fmtD(r.from)}${r.to!==r.from?' → '+fmtD(r.to):''} · ${r.days} ${r.days===1?'day':'days'}`;
}
function rqRow(r,mode){
  const s=RQ_STATUS[r.status]||[r.status,''];
  const who=mode!=='mine'?`<span style="color:var(--ink);font-size:14px"><b>${esc(r.name)}</b> <span class="muted">· ${esc(r.job||'')}</span></span>`:'';
  const title=r.kind==='leave'?esc(r.typeLabel):RQ_KIND[r.kind];
  const trail=r.approvals.map(a=>`${a.decision==='approved'?'✓':'✕'} ${esc(a.step)}: ${esc(a.by)}${a.note?' – '+esc(a.note):''}`).join(' · ');
  return `<div class="al" style="cursor:default;align-items:center"><span class="tx">${who}<b>${title}</b><span>${rqWhen(r)}${r.reason?' · '+bd(r.reason):''}${r.link?` · <a href="${esc(r.link)}" target="_blank" rel="noopener">attachment</a>`:''}</span>
      ${r.status==='pending'&&r.waitingOn.length?`<span>Waiting for ${esc(r.step)}: ${r.waitingOn.map(esc).join(' or ')}</span>`:''}${trail?`<span style="font-size:12px">${trail}</span>`:''}</span>
    <span style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end">
      ${r.canDecide?`<button class="btn small primary" onclick="rqDecide('${r.id}','approve')">Approve</button><button class="btn small danger" onclick="rqDecide('${r.id}','reject')">Reject</button>`:`<span class="pill ${s[1]}">${s[0]}</span>`}
      ${r.canCancel?`<button class="btn small ghost" onclick="rqCancel('${r.id}')">Cancel</button>`:''}</span></div>`;
}
function renderRequests(){
  const M=S.rqMeta, L=S.rqList;
  const tabs=[['mine','My requests',0],['approve','To approve',L.approve.length]].concat(L.team?[['team','Team',0]]:[]).concat(M.canSetup?[['setup','Setup',0]]:[]);
  if(!tabs.some(t=>t[0]===S.rqTab)) S.rqTab='mine';
  const T=S.rqTab;
  let body='';
  if(T==='mine'){
    const b=M.balance;
    body=`<div class="grid kpis" style="margin:0 0 18px">
      <div class="kpi"><span>Annual leave left</span><b style="color:${b.left<=3?'var(--warn)':'var(--ok)'}">${b.left}</b><small>of ${b.total} days this year</small></div>
      <div class="kpi"><span>Used</span><b>${b.used}</b><small>Approved days this year</small></div>
      <div class="kpi"><span>Waiting approval</span><b>${b.pending}</b><small>Days in pending requests</small></div>
      <div class="kpi"><span>Your shift</span><b>${M.shift} h</b><small>Extra time becomes overtime</small></div>
    </div>
    <div class="card" style="margin-bottom:18px;display:flex;gap:12px;align-items:center;flex-wrap:wrap">
      <div style="flex:1 1 300px"><b>Who approves your requests</b><div class="muted" style="font-size:13px">${M.flow.map((f,i)=>`${i+1}. ${esc(f.step)}${f.who.length?' ('+f.who.map(esc).join(' or ')+')':''}`).join(' → ')}</div></div>
      <button class="btn primary" onclick="rqNew('leave')">+ Leave request</button>${M.permissionsOn?`<button class="btn" onclick="rqNew('permission')">+ Permission</button>`:''}
    </div>
    <div class="card flush">${L.mine.length?L.mine.map(r=>rqRow(r,'mine')).join(''):`<div class="empty"><b>No requests yet</b>Your leave, permissions and overtime show up here.</div>`}</div>`;
  }
  if(T==='approve') body=`<div class="card flush">${L.approve.length?L.approve.map(r=>rqRow(r,'approve')).join(''):`<div class="empty"><b>All clear</b>Nothing is waiting for your approval.</div>`}</div>
    ${L.decided.length?`<h3 style="margin:22px 0 10px" class="muted">You decided recently</h3><div class="card flush" style="opacity:.9">${L.decided.map(r=>rqRow(r,'decided')).join('')}</div>`:''}`;
  if(T==='team'){
    const Tm=L.team;
    body=`<div class="two" style="margin:0 0 18px">
      <div class="card flush"><div class="chead"><h2>On leave today</h2><span class="pill" style="background:var(--bluebg);color:var(--blue)">${Tm.onLeave.length}</span></div>${Tm.onLeave.length?Tm.onLeave.map(r=>rqRow(r,'team')).join(''):'<div class="empty" style="padding:18px">Everyone is in today.</div>'}</div>
      <div class="card flush"><div class="chead"><h2>Next 2 weeks</h2></div>${Tm.upcoming.length?Tm.upcoming.map(r=>rqRow(r,'team')).join(''):'<div class="empty" style="padding:18px">No leave coming up.</div>'}</div></div>
    ${M.canManualOt?`<div class="card" style="margin-bottom:18px"><h2>Record overtime</h2><p class="muted" style="margin-top:-6px;font-size:13px">Saved as approved and HR gets notified.</p>
      <div class="row"><div><label for="otU">Employee</label><select id="otU">${(L.balances||[]).map(x=>`<option value="${esc(x.u)}">${esc(x.name)}</option>`).join('')}</select></div>
      <div><label for="otD">Day</label><input id="otD" type="date" value="${M.today}"></div><div style="max-width:120px"><label for="otH">Hours</label><input id="otH" type="number" min="0.25" step="0.25" value="1"></div>
      <div style="flex:2"><label for="otR">Reason</label><input id="otR" maxlength="300" placeholder="Why"></div><div style="flex:0 0 auto"><button class="btn primary" onclick="otSave()">Save</button></div></div></div>`:''}
    ${L.balances?`<div class="card flush" style="margin-bottom:18px"><div class="chead"><h2>Balances & shifts</h2><span class="muted" style="font-size:13px">${new Date().getFullYear()} · resets every January</span></div>
      <div class="tbl-wrap" style="border:0"><table style="min-width:760px"><tr><th>Employee</th><th>Shift (hours)</th><th>Annual days</th><th>Used</th><th>Waiting</th><th>Left</th><th></th></tr>
      ${L.balances.map(x=>`<tr><td><b>${esc(x.name)}</b><div class="sub2">${esc(x.job)}</div></td><td><input type="number" id="hs_${x.u}" min="1" max="16" step="0.5" value="${x.shift}" style="max-width:90px"></td><td><input type="number" id="ha_${x.u}" min="0" max="60" value="${x.total}" style="max-width:90px"></td>
        <td>${x.used}</td><td>${x.pending}</td><td><b style="color:${x.left<=3?'var(--warn)':'inherit'}">${x.left}</b></td><td><button class="btn small" onclick="hrSave('${x.u}')">Save</button></td></tr>`).join('')}</table></div></div>`:''}
    <div class="card flush"><div class="chead"><h2>All recent requests</h2></div>${Tm.recent.length?Tm.recent.map(r=>rqRow(r,'team')).join(''):'<div class="empty" style="padding:18px">No requests yet.</div>'}</div>`;
  }
  if(T==='setup'){
    S.rqTypes=JSON.parse(JSON.stringify(M.types.length?M.types:[])); S.rqHol=JSON.parse(JSON.stringify(M.holidays));
    body=rqSetupHTML();
  }
  $('main').innerHTML=`<div class="flt">${tabs.map(t=>`<button class="${T===t[0]?'on':''}" onclick="S.rqTab='${t[0]}';renderRequests()">${t[1]}${t[2]?` <span>${t[2]}</span>`:''}</button>`).join('')}</div>${body}`;
}
function rqSetupHTML(){
  return `<div class="card" style="margin-bottom:18px"><h2>Leave types</h2><p class="muted" style="margin-top:-6px;font-size:13px">"From balance" types take days from the annual balance. Notice = how many days before it has to be requested.</p>
    <div class="tbl-wrap"><table style="min-width:640px"><tr><th>Code</th><th>Name</th><th>From balance</th><th>Notice (days)</th><th>Shown</th><th></th></tr>
    ${S.rqTypes.map((t,i)=>`<tr><td><input data-lt="${i}|key" value="${esc(t.key)}" dir="ltr" style="max-width:130px"></td><td><input data-lt="${i}|label" value="${esc(t.label)}"></td>
      <td style="text-align:center"><input type="checkbox" data-ltb="${i}|deduct"${t.deduct?' checked':''}></td><td><input type="number" min="0" data-lt="${i}|notice" value="${t.notice}" style="max-width:90px"></td>
      <td style="text-align:center"><input type="checkbox" data-ltb="${i}|active"${t.active!==false?' checked':''}></td><td><button class="btn small ghost danger" onclick="ltCollect();S.rqTypes.splice(${i},1);rqSetupRender()">Remove</button></td></tr>`).join('')}</table></div>
    <div class="mfoot"><button class="btn" onclick="ltCollect();S.rqTypes.push({key:'',label:'',deduct:false,notice:0,active:true});rqSetupRender()">+ Add type</button><span class="spacer"></span><button class="btn primary" onclick="ltSave()">Save leave types</button></div></div>
  <div class="card"><h2>Public holidays</h2><p class="muted" style="margin-top:-6px;font-size:13px">These days are not counted as leave days.</p>
    ${S.rqHol.map((h,i)=>`<div class="row" style="margin-bottom:6px"><div style="max-width:200px"><input type="date" data-hol="${i}|date" value="${esc(h.date)}"></div><div><input data-hol="${i}|name" value="${esc(h.name)}" placeholder="e.g. Eid"></div><div style="flex:0 0 auto"><button class="btn small ghost danger" onclick="holCollect();S.rqHol.splice(${i},1);rqSetupRender()">Remove</button></div></div>`).join('')||'<div class="muted">No holidays added yet.</div>'}
    <div class="mfoot"><button class="btn" onclick="holCollect();S.rqHol.push({date:'',name:''});rqSetupRender()">+ Add holiday</button><span class="spacer"></span><button class="btn primary" onclick="holSave()">Save holidays</button></div></div>`;
}
function rqSetupRender(){ const keepT=S.rqTypes, keepH=S.rqHol; const tabs=$('main').querySelector('.flt').outerHTML; $('main').innerHTML=tabs+rqSetupHTML(); S.rqTypes=keepT; S.rqHol=keepH; }
function ltCollect(){ document.querySelectorAll('[data-lt]').forEach(el=>{ const [i,f]=el.dataset.lt.split('|'); if(S.rqTypes[i]) S.rqTypes[i][f]=f==='notice'?Number(el.value):el.value.trim(); }); document.querySelectorAll('[data-ltb]').forEach(el=>{ const [i,f]=el.dataset.ltb.split('|'); if(S.rqTypes[i]) S.rqTypes[i][f]=el.checked; }); }
function holCollect(){ document.querySelectorAll('[data-hol]').forEach(el=>{ const [i,f]=el.dataset.hol.split('|'); if(S.rqHol[i]) S.rqHol[i][f]=el.value.trim(); }); }
async function ltSave(){ ltCollect(); try{ await call('leaveSetupSave',{types:S.rqTypes}); toast('اتحفظت أنواع الإجازات ✓'); rqReload(); }catch(e){ alert(e.message); } }
async function holSave(){ holCollect(); try{ await call('leaveSetupSave',{holidays:S.rqHol}); toast('اتحفظت الأجازات الرسمية ✓'); rqReload(); }catch(e){ alert(e.message); } }

function rqNew(kind){
  const M=S.rqMeta;
  const isLeave=kind==='leave';
  $('modalRoot').innerHTML=`<div class="modal"><div class="card" style="max-width:560px">
    <h2>${isLeave?'Leave request':'Permission request'}</h2>
    ${isLeave?`<label for="rqT">Type</label><select id="rqT">${M.types.map(t=>`<option value="${esc(t.key)}">${esc(t.label)}${t.notice?' · '+t.notice+' days notice':''}${t.deduct?' · from balance':''}</option>`).join('')}</select>
      <div class="row"><div><label for="rqF">From</label><input id="rqF" type="date" value="${M.today}"></div><div><label for="rqTo">To</label><input id="rqTo" type="date" value="${M.today}"></div></div>
      <div class="muted" id="rqDays" style="font-size:13px;margin-top:6px"></div>`
    :`<label for="rqF">Day</label><input id="rqF" type="date" value="${M.today}">
      <div class="row"><div><label for="rqA">From</label><input id="rqA" type="time"></div><div><label for="rqB">To</label><input id="rqB" type="time"></div></div>`}
    <label for="rqR">Reason${isLeave?' (optional)':''}</label><input id="rqR" maxlength="500">
    ${isLeave?`<label for="rqL">Link to a document (optional)</label><input id="rqL" placeholder="https://… e.g. sick note on Drive" dir="ltr">`:''}
    <div class="muted" style="font-size:12.5px;margin-top:10px">Goes to: ${M.flow.map(f=>esc(f.step)).join(' → ')}</div>
    <div class="err" id="rqErr"></div>
    <div class="mfoot"><span class="spacer"></span><button class="btn" onclick="closeModal()">Cancel</button><button class="btn primary" id="rqSB" onclick="rqSend('${kind}')">Send request</button></div></div></div>`;
  if(isLeave){
    const upd=()=>{ const f=$('rqF').value, t=$('rqTo').value; if(t<f) $('rqTo').value=f; const n=countDays(f,$('rqTo').value); $('rqDays').textContent=n?n+(n===1?' working day':' working days')+' (days off and public holidays are not counted)':'No working days in this range'; };
    $('rqF').onchange=upd; $('rqTo').onchange=upd; upd();
  }
}
function countDays(a,b){
  const M=S.rqMeta, hol={}; M.holidays.forEach(h=>hol[h.date]=1);
  let n=0; for(let d=new Date(a+'T12:00:00Z'); d<=new Date(b+'T12:00:00Z'); d=new Date(d.getTime()+864e5)){ const ds=d.toISOString().slice(0,10); if(M.offDays.indexOf(d.getUTCDay())<0 && !hol[ds]) n++; }
  return n;
}
async function rqSend(kind){
  const req={kind,from:$('rqF').value,reason:$('rqR').value};
  if(kind==='leave'){ req.leave_type=$('rqT').value; req.to=$('rqTo').value; req.link=$('rqL').value; }
  else { req.time_from=$('rqA').value; req.time_to=$('rqB').value; }
  const b=$('rqSB'); b.disabled=true; b.textContent='Sending...'; $('rqErr').textContent='';
  try{ await call('reqSave',{req}); closeModal(); toast('اتبعت الطلب ✓'); S.rqTab='mine'; rqReload(); }
  catch(e){ $('rqErr').textContent=e.message; b.disabled=false; b.textContent='Send request'; }
}
async function rqDecide(id,decision){
  let note='';
  if(decision==='reject'){ note=prompt('سبب الرفض؟')||''; if(!note.trim()) return; }
  else if(!confirm('توافق على الطلب ده؟')) return;
  try{ await call('reqDecide',{id,decision,note}); toast(decision==='approve'?'اتوافق ✓':'اترفض'); rqReload(); }catch(e){ alert(e.message); }
}
async function rqCancel(id){ if(!confirm('تلغي الطلب ده؟')) return; try{ await call('reqCancel',{id}); toast('اتلغى'); rqReload(); }catch(e){ alert(e.message); } }
async function hrSave(un){ try{ await call('empHrSave',{username:un,shift:Number($('hs_'+un).value),annual:Number($('ha_'+un).value)}); toast('اتحفظ ✓'); rqReload(); }catch(e){ alert(e.message); } }
async function otSave(){ try{ await call('otManual',{username:$('otU').value,date:$('otD').value,hours:Number($('otH').value),reason:$('otR').value}); toast('اتسجل الأوفر تايم ✓'); rqReload(); }catch(e){ alert(e.message); } }
