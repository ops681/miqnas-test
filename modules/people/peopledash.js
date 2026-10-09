/* ============ People Dashboard (HR) ============
   الحضور النهارده، الطلبات، الأجهزة، والموظفين بالأقسام. من غير المشاريع وتاسكاتها. */
const PD_ST={
  in:['Clocked in','#12B76A','p-in'], break:['On break','#5B7BD5','p-prog'], out:['Clocked out','#98A2B3','p-out'],
  absent:['Not clocked in','#F79009','p-absent'], leave:['On leave','#1849A9','p-prog'], stale:['Forgot to clock out','#D92D20','p-bad'],
  noclock:['Not tracked','#D0D5DD','p-out']
};
S.pdF={q:'',st:''};
function viewPeople(){
  setTop('People Dashboard','Attendance, requests and the team by department', `<button class="btn" onclick="pdRefresh()">Refresh</button>`);
  swr('people','peopleDash',{},renderPeople);
  S.viewTimer=setInterval(()=>{ if(S.view==='people' && document.visibilityState==='visible' && !busyTyping()) call('peopleDash').then(r=>{ S.cache.people=r; if(S.view==='people') renderPeople(r); }).catch(()=>{}); },90000);
}
function pdRefresh(){ call('peopleDash',{fresh:true}).then(r=>{ S.cache.people=r; S.fetched.people=Date.now(); saveCache(); if(S.view==='people') renderPeople(r); }).catch(e=>toast(e.message)); }
function pdFilter(st){ S.pdF.st = S.pdF.st===st ? '' : st; renderPeople(S.cache.people); const el=$('pdList'); if(el) el.scrollIntoView({behavior:'smooth',block:'start'}); }
function pdLine(p){
  if(p.state==='in') return 'In since '+esc(p.inT)+' · '+p.hours+' h';
  if(p.state==='break') return 'On break since '+esc(p.breakSince)+(p.breakReason?' · '+bd(p.breakReason):'');
  if(p.state==='out') return 'Clocked out '+esc(p.outT||'')+' · '+p.hours+' h';
  if(p.state==='leave') return 'On leave · '+bd(p.leave||'');
  if(p.state==='stale') return 'Clock-out missing from an earlier day';
  if(p.state==='noclock') return 'Does not clock in';
  return 'Not clocked in yet';
}
function renderPeople(r){
  if(!r||!r.kpis) return;
  const k=r.kpis, F=S.pdF;
  const tile=(st,label,val,sub,color)=>`<button class="kpi pdk${F.st===st?' on':''}" onclick="pdFilter('${st}')" aria-pressed="${F.st===st}"><span>${label}</span><b style="color:${val?color:'var(--ink)'}">${val}</b><small>${sub}</small></button>`;
  const link=(label,val,sub,color,view)=>`<button class="kpi pdk" onclick="go('${view}')"><span>${label}</span><b style="color:${val?color:'var(--ink)'}">${val}</b><small>${sub}</small></button>`;
  const q=F.q.trim().toLowerCase();
  const P=r.people.filter(p=>(!F.st||p.state===F.st)&&(!q||[p.name,p.job,p.deptName,p.u].some(v=>String(v||'').toLowerCase().indexOf(q)>=0)));
  const focus=document.activeElement&&document.activeElement.id==='pdQ';
  const deptHTML=r.depts.map(d=>{ const L=P.filter(p=>p.dept===d.id); if(!L.length) return '';
    const inN=L.filter(p=>p.state==='in'||p.state==='break').length;
    return `<div class="card flush pd-dept"><div class="chead"><h2 style="font-size:15px">${esc(d.name)}</h2><span class="muted" style="font-size:12.5px">${L.length} ${L.length===1?'person':'people'}${d.head?' · Head: '+bd(d.head):''}</span><span class="spacer"></span><span class="pill p-in">${inN} in</span></div>
      ${L.map(p=>{ const s=PD_ST[p.state]||PD_ST.absent; return `<div class="tm"><div class="av">${esc(initials(p.name))}<i style="background:${s[1]}"></i></div><div class="tx"><b>${bd(p.name)}</b> <span class="muted" style="font-size:12px">· ${esc(p.job||'')}</span><div>${pdLine(p)}</div></div><span class="pill ${s[2]}">${s[0]}</span></div>`; }).join('')}</div>`; }).join('');
  const reqRow=x=>`<div class="al" style="cursor:default;align-items:center"><span class="tx"><b>${bd(x.name)} · ${x.kind==='leave'?esc(x.typeLabel):x.kind==='permission'?'Permission':'Overtime'}</b><span>${fmtD(x.from)}${x.to&&x.to!==x.from?' → '+fmtD(x.to):''}${x.kind==='leave'?' · '+x.days+(x.days===1?' day':' days'):' · '+x.hours+' h'}${x.reason?' · '+bd(x.reason):''}</span></span>
    <span style="display:flex;gap:6px">${x.canDecide?`<button class="btn small primary" onclick="pdDecide('${x.id}','approve')">Approve</button><button class="btn small danger" onclick="pdDecide('${x.id}','reject')">Reject</button>`:''}</span></div>`;
  const alertIc={ATTENDANCE:'clock',BREAK:'clock',LOCATION:'pin','NOT IN':'warn'};
  $('main').innerHTML=`
  ${r.workday?'':`<div class="card" style="padding:12px 18px;margin-bottom:14px;color:var(--muted)">Today is a day off, so nobody is counted as "not clocked in".</div>`}
  <div class="grid kpis pdkpis">
    ${tile('in','Clocked in',k.in,'of '+k.clockers+' who clock in','var(--ok)')}
    ${tile('break','On break',k.brk,'Right now','var(--blue)')}
    ${tile('absent','Not clocked in',k.notIn,r.workday?'Today':'Day off','var(--warn)')}
    ${tile('leave','On leave',k.leave,'Today','var(--blue)')}
    ${tile('stale','Forgot to clock out',k.stale,'From an earlier day','var(--bad)')}
    ${link('Requests waiting',k.requests,'Leave, permissions, overtime','var(--warn)','requests')}
    ${k.devices!=null?link('New devices',k.devices,'Waiting for approval','var(--warn)','devices'):''}
  </div>
  <div class="pd-grid">
    <div id="pdList">
      <div class="card" style="padding:12px 16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px">
        <input id="pdQ" placeholder="Search by name, job or department..." value="${esc(F.q)}" style="flex:1;min-width:200px" oninput="S.pdF.q=this.value;renderPeople(S.cache.people)">
        ${F.st?`<span class="pill ${(PD_ST[F.st]||[])[2]||'p-out'}">${(PD_ST[F.st]||[F.st])[0]}</span><button class="btn small ghost" onclick="pdFilter('${F.st}')">Show everyone</button>`:''}
        <span class="muted" style="font-size:12.5px">${P.length} of ${r.people.length} · updated ${esc(r.updated)}</span>
      </div>
      ${deptHTML||`<div class="card empty"><b>Nobody matches</b>Try another search or filter.</div>`}
    </div>
    <div style="display:grid;gap:14px;align-content:start">
      <div class="card flush"><div class="chead"><h2 style="font-size:15px">Waiting for you</h2>${k.requests?`<span class="pill p-absent">${k.requests}</span>`:''}<span class="spacer"></span><button class="btn ghost small" onclick="go('requests',{tab:'approve'})">All requests →</button></div>
        ${r.approve.length?r.approve.map(reqRow).join(''):`<div class="empty"><b>Nothing waiting</b>New requests show up here.</div>`}</div>
      <div class="card flush"><div class="chead"><h2 style="font-size:15px">Alerts</h2>${r.alerts.length?`<span class="pill p-absent">${r.alerts.length}</span>`:''}</div>
        ${r.alerts.length?r.alerts.map(a=>`<div class="al" style="cursor:default"><span style="color:var(--warn);flex:none">${ico(alertIc[a.tag]||'warn',18)}</span><span class="tx"><b>${bd(a.title)}</b><span>${bd(a.detail||'')}</span></span></div>`).join(''):`<div class="empty"><b>All clear</b>No attendance alerts right now.</div>`}</div>
      <div class="card flush"><div class="chead"><h2 style="font-size:15px">Leave</h2><span class="muted" style="font-size:12.5px">Today and next 2 weeks</span></div>
        ${r.onLeave.length||r.upcoming.length?r.onLeave.map(x=>`<div class="al" style="cursor:default"><span class="tx"><b>${bd(x.name)}</b><span>${esc(x.typeLabel)} · until ${fmtD(x.to)}</span></span><span class="pill p-prog">Today</span></div>`).join('')+r.upcoming.map(x=>`<div class="al" style="cursor:default"><span class="tx"><b>${bd(x.name)}</b><span>${esc(x.typeLabel)} · ${fmtD(x.from)}${x.to!==x.from?' → '+fmtD(x.to):''}</span></span><span class="pill p-out">Soon</span></div>`).join(''):`<div class="empty"><b>No leave</b>Nobody is off in the next 2 weeks.</div>`}</div>
    </div>
  </div>`;
  if(focus){ const el=$('pdQ'); el.focus(); el.setSelectionRange(el.value.length,el.value.length); }
}
async function pdDecide(id,decision){
  let note='';
  if(decision==='reject'){ note=prompt('سبب الرفض؟')||''; if(!note.trim()) return; }
  else if(!confirm('توافق على الطلب ده؟')) return;
  try{ await call('reqDecide',{id,decision,note}); toast(decision==='approve'?'اتوافق ✓':'اترفض'); S.rqMeta=null; pdRefresh(); refreshDash(); }catch(e){ alert(e.message); }
}
