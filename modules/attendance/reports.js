/* ============ Attendance › Today ============ */
function viewToday(){
  setTop('Attendance','Today · refreshes every minute');
  swr('board','board',{},renderToday);
  S.viewTimer=setInterval(()=>{ if(S.view==='today' && document.visibilityState==='visible') call('board').then(r=>{ S.cache.board=r; if(S.view==='today') renderToday(r,true); }).catch(()=>{}); },60000);
}
function renderToday(r,keep){
  const L=r.list;
  const inN=L.filter(x=>x.state==='in'||x.state==='break').length, came=L.filter(x=>x.state!=='absent'&&x.state!=='leave').length;
  const alerts=L.filter(x=>x.alert||x.staleOpen).length;
  setTop('Attendance','Today · '+r.today+' · updated '+r.now);
  $('main').innerHTML=`
  <div class="grid kpis">
    <div class="kpi"><span>Working now</span><b>${inN}</b></div>
    <div class="kpi"><span>Clocked in today</span><b>${came}</b></div>
    <div class="kpi"><span>Not clocked in</span><b>${L.length-came}</b></div>
    <div class="kpi"><span>Alerts</span><b style="color:${alerts?'var(--bad)':'var(--ink)'}">${alerts}</b></div>
  </div>
  <div class="tbl-wrap"><table>
    <tr><th>Name</th><th>Job</th><th>Status</th><th>In</th><th>Out</th><th>Sharing</th><th>Last screenshot</th><th>Stops</th><th>Hours today</th></tr>
    ${L.map(x=>`<tr>
      <td><b>${esc(x.name)}</b></td><td class="muted">${esc(x.job)}</td>
      <td>${x.staleOpen?'<span class="pill p-bad">Forgot clock-out</span>':x.alert?'<span class="pill p-bad">No screenshots</span>':x.state==='break'?`<span class="pill p-prog">On Break</span><div class="sub2" dir="auto">${esc(x.breakSince)} · ${esc(x.breakReason)}</div>`:x.state==='in'?'<span class="pill p-in">Working</span>':x.state==='out'?'<span class="pill p-out">Clocked out</span>':x.state==='leave'?'<span class="pill" style="background:var(--bluebg);color:var(--blue)">On leave</span>':'<span class="pill p-absent">Absent</span>'}</td>
      <td>${esc(x.inT)||'—'}</td><td>${esc(x.outT)||'—'}</td><td>${esc(x.mode)||'—'}</td>
      <td>${esc(x.lastShot)||'—'}</td><td>${x.stops?`<span class="pill p-bad">${x.stops}</span>`:'0'}</td><td>${x.hoursToday}</td></tr>`).join('')}
  </table></div>`;
}

/* ============ Monthly Report ============ */
let monthlyData=null;
function viewMonthly(){
  const m=new Date().toISOString().slice(0,7);
  setTop('Monthly Report','Attendance, leave and workload per employee', `<input type="month" id="mSel" value="${m}" style="width:auto"><button class="btn" id="csvBtn">Download Excel (CSV)</button>`);
  if(!S.mrF) S.mrF={dept:'',q:'',sort:'hours',dir:-1};
  $('main').innerHTML=`<div id="mBody">${LOADING}</div>`;
  $('mSel').onchange=loadMonthly; $('csvBtn').onclick=exportCsv;
  loadMonthly();
}
const MR_COLS=[['name','Name'],['deptName','Department'],['days','Days'],['hours','Hours'],['avg','Avg / day'],['leaveDays','Leave days'],['permHours','Permission h'],['otHours','Overtime h'],['missed','Missed clock-outs'],['stops','Sharing stops'],['projects','Active projects']];
function mrRows(r){ const F=S.mrF, q=F.q.trim().toLowerCase();
  return r.rows.filter(x=>(!F.dept||x.dept===F.dept)&&(!q||[x.name,x.job,x.deptName].some(v=>String(v||'').toLowerCase().indexOf(q)>=0)))
    .sort((a,b)=>{ const va=a[F.sort], vb=b[F.sort]; return (typeof va==='string'||typeof vb==='string' ? String(va||'').localeCompare(String(vb||'')) : (Number(va)||0)-(Number(vb)||0))*F.dir; }); }
function mrSort(k){ const F=S.mrF; if(F.sort===k) F.dir*=-1; else { F.sort=k; F.dir=(k==='name'||k==='deptName')?1:-1; } drawMonthly(monthlyData); }
function drawMonthly(r){
  if(!r||!$('mBody')) return;
  monthlyData=r;
  const F=S.mrF, R=mrRows(r), sum=k=>Math.round(R.reduce((s,x)=>s+(Number(x[k])||0),0)*100)/100;
  const depts=[...new Map(r.rows.map(x=>[x.dept,x.deptName])).entries()].filter(d=>d[0]);
  const maxH=Math.max(1,...R.map(x=>x.hours||0));
  const focus=document.activeElement&&document.activeElement.id==='mrQ';
  $('mBody').innerHTML=`
  <div class="grid kpis">
    <div class="kpi"><span>Employees</span><b>${R.length}</b><small>${F.dept?esc((depts.find(d=>d[0]===F.dept)||[])[1]||''):'All departments'}</small></div>
    <div class="kpi"><span>Total hours</span><b>${sum('hours')}</b><small>Avg ${R.length?Math.round(sum('hours')/R.length*10)/10:0} h per person</small></div>
    <div class="kpi"><span>Leave days</span><b>${sum('leaveDays')}</b><small>${sum('permHours')} h of permissions</small></div>
    <div class="kpi"><span>Overtime</span><b>${sum('otHours')} h</b><small>Approved</small></div>
    <div class="kpi"><span>Missed clock-outs</span><b style="color:${sum('missed')?'var(--bad)':'var(--ink)'}">${sum('missed')}</b><small>${sum('stops')} sharing stops</small></div>
  </div>
  <div class="card" style="padding:12px 16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px">
    <input id="mrQ" placeholder="Search by name, job or department..." value="${esc(F.q)}" style="flex:1;min-width:200px" oninput="S.mrF.q=this.value;drawMonthly(monthlyData)">
    <select style="width:auto" onchange="S.mrF.dept=this.value;drawMonthly(monthlyData)"><option value="">All departments</option>${depts.map(d=>`<option value="${esc(d[0])}"${F.dept===d[0]?' selected':''}>${esc(d[1])}</option>`).join('')}</select>
  </div>
  <div class="card" style="padding:16px 20px;margin-bottom:14px"><h3 style="margin:0 0 10px;font-size:15px">Hours this month</h3>
    ${R.length?`<div class="mr-bars">${R.slice().sort((a,b)=>b.hours-a.hours).map(x=>`<button class="mr-bar" onclick="mrOpen('${esc(x.username)}')" title="${esc(x.name)} · ${x.hours} h"><span class="mr-n">${bd(x.name)}</span><span class="mr-t"><i style="width:${Math.max(2,Math.round((x.hours||0)/maxH*100))}%"></i></span><b>${x.hours} h</b></button>`).join('')}</div>`:'<div class="muted">No data.</div>'}
  </div>
  <div class="tbl-wrap"><table class="mr-tbl">
    <tr>${MR_COLS.map(c=>`<th><button class="mr-th" onclick="mrSort('${c[0]}')">${c[1]}${F.sort===c[0]?(F.dir>0?' ▲':' ▼'):''}</button></th>`).join('')}</tr>
    ${R.map(x=>`<tr class="clk" onclick="mrOpen('${esc(x.username)}')"><td><b>${bd(x.name)}</b><div class="muted" style="font-size:12px">${esc(x.job||'')}</div></td><td class="muted">${esc(x.deptName||'')}</td><td>${x.days}</td><td><b>${x.hours}</b></td><td>${x.avg}</td>
      <td>${x.leaveDays||0}</td><td>${x.permHours||0}</td><td>${x.otHours||0}</td>
      <td>${x.missed?`<span class="pill p-bad">${x.missed}</span>`:'0'}</td><td>${x.stops?`<span class="pill p-absent">${x.stops}</span>`:'0'}</td><td>${x.projects!=null?x.projects:'—'}</td></tr>`).join('')}
  </table></div>`;
  if(focus){ const q=$('mrQ'); q.focus(); q.setSelectionRange(q.value.length,q.value.length); }
}
async function loadMonthly(){
  const month=$('mSel').value, key='monthly:'+month, vt=S.vt;
  if(S.cache[key]) drawMonthly(S.cache[key]); else $('mBody').innerHTML=LOADING;
  try{ const r=await call('monthly',{month}); S.cache[key]=r; if(S.vt===vt && $('mSel') && $('mSel').value===month) drawMonthly(r); }
  catch(e){ if(!S.cache[key]) $('mBody').innerHTML=`<div class="card err">${esc(e.message)}</div>`; }
}
async function mrOpen(un){
  const month=$('mSel')?$('mSel').value:new Date().toISOString().slice(0,7);
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:640px">${LOADING}</div></div>`;
  try{
    const r=await call('monthlyUser',{username:un,month}); const s=r.summary||{};
    const KIND={leave:'Leave',permission:'Permission',overtime:'Overtime'};
    $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:640px">
      <div class="row" style="align-items:center;gap:10px"><div class="av">${esc(initials(r.user.name))}</div><div><h2 style="margin:0;font-size:18px">${bd(r.user.name)}</h2><div class="muted" style="font-size:13px">${esc(r.user.job||'')} · ${esc(r.user.dept||'')} · ${esc(r.month)}</div></div><div class="spacer"></div><button class="btn ghost small" onclick="closeModal()">Close</button></div>
      <div class="grid kpis" style="margin:14px 0"><div class="kpi"><span>Days</span><b>${s.days||0}</b></div><div class="kpi"><span>Hours</span><b>${s.hours||0}</b></div><div class="kpi"><span>Avg / day</span><b>${s.avg||0}</b></div><div class="kpi"><span>Missed clock-outs</span><b>${s.missed||0}</b></div></div>
      ${r.requests.length?`<h3 style="font-size:14px;margin:0 0 6px">Approved requests</h3><div style="margin-bottom:12px">${r.requests.map(q=>`<div class="kv" style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed var(--line);font-size:13.5px"><span>${KIND[q.kind]||q.kind}${q.kind==='leave'?' · '+esc(q.type):''}</span><span class="muted">${fmtD(q.from)}${q.to&&q.to!==q.from?' → '+fmtD(q.to):''} · ${q.kind==='leave'?q.days+' d':q.hours+' h'}</span></div>`).join('')}</div>`:''}
      <h3 style="font-size:14px;margin:0 0 6px">Days</h3>
      ${r.days.length?`<div class="tbl-wrap" style="max-height:320px;overflow:auto"><table><tr><th>Date</th><th>Day</th><th>In</th><th>Out</th><th>Hours</th></tr>${r.days.map(d=>`<tr><td>${fmtD(d.date)}</td><td class="muted">${esc(d.day||'')}</td><td>${esc(d.inT||'')}</td><td>${d.open?'<span class="pill p-absent">Open</span>':esc(d.outT||'')}</td><td>${d.hours}</td></tr>`).join('')}</table></div>`:'<div class="muted">No attendance this month.</div>'}
    </div></div>`;
  }catch(e){ closeModal(); toast(e.message); }
}
function exportCsv(){
  if(!monthlyData) return;
  const head=['Name','Department','Job','Days present','Total hours','Avg per day','Leave days','Permission hours','Overtime hours','Missed clock-outs','Sharing stops','Screenshots','Active projects'];
  const lines=[head].concat(mrRows(monthlyData).map(x=>[x.name,x.deptName||'',x.job,x.days,x.hours,x.avg,x.leaveDays||0,x.permHours||0,x.otHours||0,x.missed,x.stops,x.shots,x.projects!=null?x.projects:'']))
    .map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(','));
  const blob=new Blob(['﻿'+lines.join('\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='monthly-report-'+monthlyData.month+'.csv'; a.click();
}

/* ============ Screen Report ============ */
function viewScreen(){
  const today=new Date().toLocaleDateString('en-CA',{timeZone:'Africa/Cairo'});
  if(!S.screenDate) S.screenDate=today;
  setTop('Screen Sharing Report','Daily summary · screenshots stay in Google Drive',
    `<input type="date" id="sD" value="${esc(S.screenDate)}" style="width:auto"><a class="btn" id="driveAll" href="#" target="_blank" rel="noopener">${ico('folder',16)} All screenshots in Drive</a>`);
  $('sD').onchange=()=>{ S.screenDate=$('sD').value; loadScreen(); };
  loadScreen();
}
function loadScreen(){
  const date=S.screenDate, key=date===new Date().toLocaleDateString('en-CA',{timeZone:'Africa/Cairo'})?'screen':'screen:'+date;
  swr(key,'screenReport',{date},renderScreen);
}
function renderScreen(r,keep){
  if(r.date!==S.screenDate) return;
  const a=$('driveAll'); if(a){ if(r.root) a.href=r.root; else a.classList.add('hidden'); }
  const H={check:['Check','p-bad'],some:['Some stops','p-absent'],clean:['Clean','p-in'],absent:['Absent','p-out']};
  const [lo,hi]=r.range, span=Math.max(60,hi-lo);
  const hours=[]; for(let t=lo;t<=hi;t+=Math.max(60,Math.round(span/6/60)*60)) hours.push(t);
  const t=r.totals;
  $('main').innerHTML=`
  <div class="grid kpis">
    <div class="kpi"><span>Shared all day</span><b style="color:var(--ok)">${t.clean}</b></div>
    <div class="kpi"><span>With stops</span><b style="color:${t.stops?'var(--warn)':'var(--ink)'}">${t.stops}</b></div>
    <div class="kpi"><span>Total time not shared</span><b>${t.off>=60?Math.floor(t.off/60)+' h '+(t.off%60)+' m':t.off+' min'}</b></div>
    <div class="kpi"><span>Screenshots taken</span><b>${t.shots}</b></div>
  </div>
  <div class="card flush"><div class="tbl-wrap"><table style="min-width:1100px">
    <tr><th>Employee</th><th>Clocked</th><th>Sharing</th><th>Stops</th><th>Not shared</th><th style="min-width:220px">Timeline <span style="font-weight:400;text-transform:none">${String(Math.floor(lo/60)).padStart(2,'0')}:00 – ${String(Math.floor(hi/60)).padStart(2,'0')}:00</span></th><th>Gaps without screenshots</th><th>Screenshots</th><th>Day</th><th></th></tr>
    ${r.rows.map(x=>{ const h=H[x.health];
      if(x.absent) return `<tr><td><b>${esc(x.name)}</b><div class="sub2">${esc(x.job)}</div></td><td colspan="7" class="muted">Didn't clock in</td><td><span class="pill ${h[1]}">${h[0]}</span></td><td></td></tr>`;
      return `<tr><td><b>${esc(x.name)}</b><div class="sub2">${esc(x.job)}</div></td><td style="white-space:nowrap">${esc(x.clock)}</td><td>${esc(x.modes.join(' → '))||'—'}</td>
      <td><b style="color:${x.stops?'var(--warn)':'var(--ink)'}">${x.stops}</b></td><td>${x.off} min</td>
      <td><div class="tl">${x.segs.map(s=>`<i class="${s.k}" style="left:${(s.s-lo)/span*100}%;width:${Math.max(.4,(s.e-s.s)/span*100)}%"></i>`).join('')}</div></td>
      <td style="font-size:13px">${x.gaps.length?esc(x.gaps.join(', ')):'—'}</td>
      <td><b>${x.shots}</b><div class="sub2">${x.cover}% of expected</div></td>
      <td><span class="pill ${h[1]}">${h[0]}</span></td>
      <td>${x.folder?`<a class="btn small" href="${esc(x.folder)}" target="_blank" rel="noopener">Open in Drive</a>`:'<span class="muted" style="font-size:12px">No folder</span>'}</td></tr>`; }).join('')}
  </table></div></div>
  <div class="legend" style="margin-top:12px"><span><i style="width:12px;height:12px;border-radius:3px;background:#7DD3A8;display:inline-block"></i>Sharing</span><span><i style="width:12px;height:12px;border-radius:3px;background:#F4A27A;display:inline-block"></i>Stopped sharing</span><span><i style="width:12px;height:12px;border-radius:3px;background:#B9C7F0;display:inline-block"></i>Break</span><span><i style="width:12px;height:12px;border-radius:3px;background:#C5CBD3;display:inline-block"></i>No screenshots (page closed / laptop asleep)</span></div>`;
}
