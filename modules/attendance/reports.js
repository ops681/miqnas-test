/* ============ Attendance › Today ============ */
function viewToday(){
  setTop('Attendance','Today · refreshes every minute');
  swr('board','board',{},renderToday);
  S.viewTimer=setInterval(()=>{ if(S.view==='today') call('board').then(r=>{ S.cache.board=r; if(S.view==='today') renderToday(r,true); }).catch(()=>{}); },60000);
}
function renderToday(r,keep){
  const L=r.list;
  const inN=L.filter(x=>x.state==='in'||x.state==='break').length, came=L.filter(x=>x.state!=='absent').length;
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
      <td>${x.staleOpen?'<span class="pill p-bad">Forgot clock-out</span>':x.alert?'<span class="pill p-bad">No screenshots</span>':x.state==='break'?`<span class="pill p-prog">On Break</span><div class="sub2" dir="auto">${esc(x.breakSince)} · ${esc(x.breakReason)}</div>`:x.state==='in'?'<span class="pill p-in">Working</span>':x.state==='out'?'<span class="pill p-out">Clocked out</span>':'<span class="pill p-absent">Absent</span>'}</td>
      <td>${esc(x.inT)||'—'}</td><td>${esc(x.outT)||'—'}</td><td>${esc(x.mode)||'—'}</td>
      <td>${esc(x.lastShot)||'—'}</td><td>${x.stops?`<span class="pill p-bad">${x.stops}</span>`:'0'}</td><td>${x.hoursToday}</td></tr>`).join('')}
  </table></div>`;
}

/* ============ Monthly Report ============ */
let monthlyData=null;
function viewMonthly(){
  const m=new Date().toISOString().slice(0,7);
  setTop('Monthly Report','Attendance per employee', `<input type="month" id="mSel" value="${m}" style="width:auto"><button class="btn" id="csvBtn">Download Excel (CSV)</button>`);
  $('main').innerHTML=`<div id="mBody">${LOADING}</div>`;
  $('mSel').onchange=loadMonthly; $('csvBtn').onclick=exportCsv;
  loadMonthly();
}
async function loadMonthly(){
  const month=$('mSel').value, key='monthly:'+month, vt=S.vt;
  const draw=r=>{
    monthlyData=r;
    const R=r.rows, tot=R.reduce((s,x)=>s+x.hours,0);
    $('mBody').innerHTML=`
    <div class="grid kpis">
      <div class="kpi"><span>Employees</span><b>${R.length}</b></div>
      <div class="kpi"><span>Total hours</span><b>${Math.round(tot*100)/100}</b></div>
      <div class="kpi"><span>Missed clock-outs</span><b style="color:${R.some(x=>x.missed)?'var(--bad)':'var(--ink)'}">${R.reduce((s,x)=>s+x.missed,0)}</b></div>
    </div>
    <div class="tbl-wrap"><table>
      <tr><th>Name</th><th>Job</th><th>Days present</th><th>Total hours</th><th>Avg per day</th><th>Missed clock-outs</th><th>Sharing stops</th><th>Screenshots</th></tr>
      ${R.map(x=>`<tr><td><b>${esc(x.name)}</b></td><td class="muted">${esc(x.job)}</td><td>${x.days}</td><td>${x.hours}</td><td>${x.avg}</td>
        <td>${x.missed?`<span class="pill p-bad">${x.missed}</span>`:'0'}</td><td>${x.stops?`<span class="pill p-absent">${x.stops}</span>`:'0'}</td><td>${x.shots}</td></tr>`).join('')}
    </table></div>`;
  };
  if(S.cache[key]) draw(S.cache[key]); else $('mBody').innerHTML=LOADING;
  try{ const r=await call('monthly',{month}); S.cache[key]=r; if(S.vt===vt && $('mSel') && $('mSel').value===month) draw(r); }
  catch(e){ if(!S.cache[key]) $('mBody').innerHTML=`<div class="card err">${esc(e.message)}</div>`; }
}
function exportCsv(){
  if(!monthlyData) return;
  const head=['Name','Job','Days present','Total hours','Avg per day','Missed clock-outs','Sharing stops','Screenshots'];
  const lines=[head].concat(monthlyData.rows.map(x=>[x.name,x.job,x.days,x.hours,x.avg,x.missed,x.stops,x.shots]))
    .map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(','));
  const blob=new Blob(['﻿'+lines.join('\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='attendance-'+monthlyData.month+'.csv'; a.click();
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
