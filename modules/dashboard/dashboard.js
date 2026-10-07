/* ============ الداشبورد ============ */
function viewDash(){ setTop('Dashboard', ''); swr('dash','dash',{},renderDash).then(renderBell); }
function fmtD(v){ if(!v) return '—'; const d=new Date(v+'T12:00:00'); return isNaN(d)? v : d.toLocaleDateString('en-GB',{day:'numeric',month:'short'}); }
const HEALTH={ overdue:['Overdue','p-bad','#D92D20'], risk:['At risk','p-absent','#E8753D'], behind:['Behind','p-yel','#D6A100'], ok:['On track','p-in','#107366'] };
function renderDash(r,keep){
  S.skew=Date.now()-r.now;
  const k=r.kpis;
  setTop('Dashboard', new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'short',year:'numeric'})+' · updated '+new Date(r.now).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),
    `<button class="btn" onclick="refreshDash()">Refresh</button>`);
  const F=S.alertFilter, cats={all:'All',project:'Projects',task:'Tasks',people:'People'};
  const L=r.alerts.map((a,i)=>({a,i})).filter(x=>F==='all'||x.a.cat===F);
  const showPeople = can('attendance.view_all');
  const y=window.scrollY;
  $('main').innerHTML=`
  <div class="grid kpis">
    <div class="kpi"><span>Active projects</span><b>${k.active}</b><small>${r.projects.length} tracked</small></div>
    <div class="kpi"><span>At risk / behind</span><b style="color:${k.risk?'var(--warn)':'var(--ink)'}">${k.risk}</b><small>Behind expected progress</small></div>
    <div class="kpi"><span>Overdue</span><b style="color:${k.overdue?'var(--bad)':'var(--ink)'}">${k.overdue}</b><small>Past Target Launch</small></div>
    ${showPeople?`<div class="kpi"><span>Clocked in</span><b>${k.clockedIn}/${k.clockers}</b><small>Right now</small></div>`:''}
    <div class="kpi"><span>Timers running</span><b style="color:var(--brand2)">${k.timers}</b><small>Across all projects</small></div>
  </div>
  <div class="two">
    <div class="card flush">
      <div class="chead"><span style="color:var(--bad)">${ico('warn',20)}</span><h2>Needs attention</h2><span class="pill p-bad">${r.alerts.length}</span><span class="spacer"></span>
        <div class="chips">${Object.keys(cats).filter(c=>showPeople||c!=='people').map(c=>`<button class="${F===c?'on':''}" onclick="S.alertFilter='${c}';renderDash(S.cache.dash,true)">${cats[c]}</button>`).join('')}</div></div>
      ${L.length? L.map(x=>alertHTML(x.a,x.i)).join('') : `<div class="empty"><b>All clear</b>Nothing needs your attention here.</div>`}
    </div>
    ${showPeople?`<div class="card flush">
      <div class="chead"><h2>Team today</h2><span class="spacer"></span><span class="muted" style="font-size:13px">${k.clockedIn} of ${k.clockers} clocked in</span></div>
      ${r.team.map(m=>{ const c={in:'#12B76A',break:'#5B7BD5',out:'#98A2B3',absent:'#D0D5DD',stale:'#F79009',leave:'#1849A9'}[m.state];
        const line = m.state==='break' ? 'On break' : m.state==='in' ? (m.now? 'Timer · '+m.now : 'Clocked in '+m.since+' · no timer running') : m.state==='out' ? 'Clocked out' : m.state==='stale' ? 'Forgot to clock out' : m.state==='leave' ? 'On leave' : 'Not clocked in';
        return `<div class="tm"><div class="av">${esc(initials(m.name))}<i style="background:${c}"></i></div><div class="tx"><b>${esc(m.name)}</b> <span class="muted" style="font-size:12px">· ${esc(m.job)}</span><div>${bd(line)}</div></div><div class="nums"><b>${m.open} open</b>${m.hours} h today</div></div>`; }).join('') || '<div class="empty">No employees clock in yet.</div>'}
    </div>`:''}
  </div>
  ${r.blockers?blockersDashHTML(r.blockers):''}
  <div class="card flush">
    <div class="chead"><h2>Project health</h2><div class="legend"><span><i style="width:14px;height:6px;border-radius:3px;background:var(--brand2);display:inline-block"></i>Done</span><span><i style="width:2px;height:12px;background:var(--ink);display:inline-block"></i>Expected by today</span></div><span class="spacer"></span><button class="btn ghost small" onclick="go('projects')">All projects →</button></div>
    ${r.projects.length?`<div class="tbl-wrap"><table style="min-width:900px">
      <tr><th>Project</th><th>Account Manager</th><th>Target Launch</th><th style="width:28%">Progress vs expected</th><th>Health</th><th>Holding it up</th></tr>
      ${r.projects.map(p=>{ const h=HEALTH[p.health]; const left=p.daysLeft===null?'':p.daysLeft<0?`${-p.daysLeft} days late`:p.daysLeft===0?'Today':`${p.daysLeft} days left`;
        return `<tr class="clk" onclick="go('projects');viewProject('${esc(p.id)}')"><td><b>${esc(p.client)}</b><div class="sub2">${esc(p.id)} · ${esc(p.type)}</div>${p.blockers&&p.blockers.total?`<div style="margin-top:4px">${blBadge(p.blockers)}</div>`:''}</td><td>${bd(p.am)||'—'}</td>
        <td><b>${fmtD(p.target)}</b><div class="sub2" style="color:${p.daysLeft!==null&&p.daysLeft<0?'var(--bad)':p.daysLeft!==null&&p.daysLeft<=3?'var(--warn)':'var(--muted)'}">${left}</div></td>
        <td><div class="pv"><div class="pbar"><i style="width:${p.done}%;background:${h[2]}"></i><em style="left:calc(${p.expected}% - 1px)"></em></div><span>${p.done}% <small>/ ${p.expected}%</small></span></div></td>
        <td><span class="pill ${h[1]}">${h[0]}</span></td><td style="font-size:13px">${p.blocker?bd(p.blocker):'—'}</td></tr>`; }).join('')}
    </table></div>`:`<div class="empty">No active projects.</div>`}
  </div>`;
  if(keep) window.scrollTo(0,y);
}

function blockersDashHTML(B){
  const by={}; B.forEach(b=>{ (by[b.cat]||(by[b.cat]=[])).push(b); });
  return `<div class="card flush" style="margin-bottom:20px">
    <div class="chead"><span style="color:${B.length?'var(--bad)':'var(--muted)'}">${ico('flag',18)}</span><h2>Open blockers</h2><span class="pill ${B.length?'p-bad':'p-out'}">${B.length}</span><span class="spacer"></span><button class="btn ghost small" onclick="go('blockers')">All blockers →</button></div>
    <div class="blgrid">
    ${BL_CATS.map(c=>{ const L=(by[c]||[]).sort((a,b)=>b.days-a.days); return `<div style="background:#fff;padding:14px 16px;min-height:96px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><b style="font-size:13.5px">${c}</b><span class="spacer"></span><span class="pill ${L.length?'p-bad':'p-out'}">${L.length}</span></div>
      ${L.length? L.slice(0,4).map(b=>`<button class="al" style="padding:6px 0;border:0" onclick="go('projects');viewProject('${esc(b.project)}')"><span class="tx"><b style="font-size:13px">${bd(b.client)}</b><span style="font-size:12px">${b.days} day${b.days===1?'':'s'} · ${esc(b.cause)}</span></span></button>`).join('')+(L.length>4?`<div class="muted" style="font-size:12px">+${L.length-4} more</div>`:'') : '<div class="muted" style="font-size:12.5px">None</div>'}
    </div>`; }).join('')}
    </div></div>`;
}
