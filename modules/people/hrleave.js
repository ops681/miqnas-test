/* ============ HR: Leaves & Permissions + Agent Profiles + My Profile (2026-11-21) ============
   - Leaves & Permissions: كل طلبات الإجازة والإذن. الموافقة: Team Leader (لو موجود) ← Operations Manager ← HR.
     الخطوة اللي جاية مقفولة لحد ما اللي قبلها تخلص. كل خطوة بتتسجل (مين وإمتى) ومفيش مسح.
   - Agent Profiles: كل الموظفين في جدول، والضغط على أي حد بيفتح البروفايل بتاعه من الجنب.
   - My Profile: الموظف بيشوف البروفايل بتاعه بس (المرتب للقراية بس).
   - المرتب والبونص والخصم بيتدخلوا يدوي (CEO، Founders، Operations Manager، HR). */
const AG_TYPE={full:'Full-time',part:'Part-time'}, AG_MODE={remote:'Remote',onsite:'Onsite',hybrid:'Hybrid'};
const agMoney=(n,c)=>n==null?'—':Number(n).toLocaleString('en-US',{maximumFractionDigits:2})+(c?' '+c:'');
const agMonthLabel=m=>{ const d=new Date(m+'-15T12:00:00'); return isNaN(d)?m:d.toLocaleDateString('en-GB',{month:'long',year:'numeric'}); };
const agTime=t=>t?new Date(Number(t)).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'';
const agMonthSel=(id,months,cur)=>`<select id="${id}" style="width:auto" aria-label="Month">${(months||[cur]).map(m=>`<option value="${m}"${m===cur?' selected':''}>${agMonthLabel(m)}</option>`).join('')}</select>`;

/* ----- سلسلة الموافقات: كل خطوة وحالتها ----- */
function lvChain(r){
  const ok=r.approvals.filter(a=>a.decision==='approved'), bad=r.approvals.find(a=>a.decision==='rejected'), canc=r.approvals.find(a=>a.decision==='cancelled');
  const steps=r.flow.map((st,i)=>{
    const a=ok[i];
    if(a) return `<span class="lv-st ok" title="${esc(a.by)} · ${agTime(a.at)}">✓ ${esc(st)} · ${bd(a.by)} · ${agTime(a.at)}</span>`;
    if(i===ok.length){
      if(bad) return `<span class="lv-st bad" title="${esc(bad.note||'')}">✕ ${esc(st)} · ${bd(bad.by)} · ${agTime(bad.at)}</span>`;
      if(canc||r.status==='cancelled') return `<span class="lv-st off">${esc(st)} · cancelled</span>`;
      if(r.status==='pending') return `<span class="lv-st wait">⏳ ${esc(st)}${r.waitingOn&&r.waitingOn.length?' · '+r.waitingOn.map(bd).join(' or '):''}</span>`;
    }
    return `<span class="lv-st lock">🔒 ${esc(st)}${r.status==='pending'?' · after step '+(i):''}</span>`;
  });
  if(!r.flow.length&&r.status==='approved') steps.push('<span class="lv-st ok">✓ Approved automatically</span>');
  return `<div class="lv-chain">${steps.join('<i aria-hidden="true">→</i>')}</div>`;
}
function lvWhen(r){ return typeof rqWhen==='function'?rqWhen(r):(r.from+(r.to!==r.from?' → '+r.to:'')); }
function lvRow(r,hist){
  const s=(typeof RQ_STATUS!=='undefined'&&RQ_STATUS[r.status])||[r.status,''];
  const title=r.kind==='leave'?esc(r.typeLabel):'Permission';
  return `<div class="lv-row" id="lvr_${esc(r.id)}">
    <div class="lv-who"><div class="av" data-u="${esc(r.u)}">${esc(initials(r.name))}</div><div class="lv-tx"><b>${bd(r.name)}</b><span class="muted">${esc(r.job||'')}</span></div></div>
    <div class="lv-what"><b>${title}</b><span>${lvWhen(r)}${r.reason?' · '+bd(r.reason):''}${r.link?(/^https?:\/\//i.test(r.link)?` · <a href="${esc(r.link)}" target="_blank" rel="noopener">attachment</a>`:' · '+bd(r.link)):''}</span>${lvChain(r)}</div>
    <div class="lv-act">${r.canDecide?`<button class="btn small primary" onclick="lvDecide('${esc(r.id)}','approve')">Approve</button><button class="btn small danger" onclick="lvDecide('${esc(r.id)}','reject')">Reject</button>`:`<span class="pill ${s[1]}">${s[0]}</span>`}
      ${hist?`<button class="btn small ghost" onclick="lvHist('${esc(r.id)}')" aria-expanded="false">History</button>`:''}</div>
    <div class="lv-log" id="lvh_${esc(r.id)}" hidden></div></div>`;
}
function lvHistHTML(r){
  const L=[`<div>${agTime(r.createdAt)} · <b>${bd(r.name)}</b> · request created (${r.kind==='leave'?esc(r.typeLabel):'permission'}, ${lvWhen(r)})</div>`]
    .concat(r.approvals.map((a,i)=>`<div>${agTime(a.at)} · <b>${bd(a.by)}</b> · ${esc(a.step||'')} · ${a.decision==='approved'?'approved':a.decision==='rejected'?'rejected':'cancelled'}${a.decision==='approved'?' · step '+(i+1)+'/'+r.flow.length:''}${a.note?' · '+bd(a.note):''}</div>`));
  return L.join('');
}
function lvHist(id){
  const box=$('lvh_'+id); if(!box) return;
  const r=(S.lvData&&S.lvData.list.concat(S.lvData.pending).find(x=>x.id===id))||null; if(!r) return;
  if(box.hidden){ box.innerHTML=lvHistHTML(r); box.hidden=false; } else box.hidden=true;
  const b=$('lvr_'+id)&&$('lvr_'+id).querySelector('[aria-expanded]'); if(b) b.setAttribute('aria-expanded',String(!box.hidden));
}

/* ----- HR → Leaves & Permissions ----- */
S.lvF={kind:'',status:''};
function viewLeaves(opts){
  const month=(opts&&opts.month)||S.lvMonth||'';
  S.lvMonth=month;
  setTop('Leaves & Permissions','Every leave and permission request · approval goes step by step and is kept for good');
  swr('lv:'+(month||'now'),'leaveBoard',month?{month}:{},(d)=>{ S.lvData=d; renderLeaves(); });
}
function renderLeaves(){
  const d=S.lvData, F=S.lvF; if(!d) return;
  if(!$('lvMonth')){ const ta=$('topActions'); if(ta) ta.insertAdjacentHTML('afterbegin',agMonthSel('lvMonth',d.months,d.month)); }
  if($('lvMonth')) $('lvMonth').onchange=e=>{ S.lvMonth=e.target.value; viewLeaves({month:e.target.value}); };
  const L=d.list.filter(r=>(!F.kind||r.kind===F.kind)&&(!F.status||r.status===F.status));
  const fb=(k,v,l)=>`<button class="${F[k]===v?'on':''}" onclick="S.lvF.${k}='${v}';renderLeaves()">${l}</button>`;
  $('main').innerHTML=`<div class="grid kpis" style="margin:0 0 18px">
      <div class="kpi"><span>Waiting now</span><b style="color:${d.sum.pending?'var(--warn)':'inherit'}">${d.sum.pending}</b><small>All months</small></div>
      <div class="kpi"><span>Leave days</span><b>${d.sum.leaveDays}</b><small>Approved · ${esc(agMonthLabel(d.month))}</small></div>
      <div class="kpi"><span>Permissions</span><b>${d.sum.permissions}</b><small>${d.sum.permHours} h approved</small></div>
      <div class="kpi"><span>Rejected</span><b>${d.sum.rejected}</b><small>${esc(agMonthLabel(d.month))}</small></div></div>
    <div class="card flush" style="margin-bottom:18px"><div class="chead" style="padding:16px 18px 6px"><h3 style="margin:0">Waiting <span class="muted">· ${d.pending.length}</span></h3></div>
      ${d.pending.length?d.pending.map(r=>lvRow(r,true)).join(''):'<div class="empty"><b>Nothing waiting</b>New requests show up here first.</div>'}</div>
    <div class="card flush"><div class="chead" style="padding:16px 18px 6px;display:flex;flex-wrap:wrap;gap:10px;align-items:center"><h3 style="margin:0">Record <span class="muted">· ${esc(agMonthLabel(d.month))} · nothing here can be deleted</span></h3><span class="spacer"></span>
      <div class="flt" style="margin:0">${fb('kind','','All')}${fb('kind','leave','Leave')}${fb('kind','permission','Permission')}</div>
      <div class="flt" style="margin:0">${fb('status','','Any status')}${fb('status','approved','Approved')}${fb('status','pending','Waiting')}${fb('status','rejected','Rejected')}${fb('status','cancelled','Cancelled')}</div></div>
      ${L.length?L.map(r=>lvRow(r,true)).join(''):'<div class="empty"><b>No requests</b>Nothing matches this month and filter.</div>'}</div>`;
}
async function lvDecide(id,decision){
  let note='';
  if(decision==='reject'){ note=prompt('سبب الرفض؟')||''; if(!note.trim()) return; }
  else if(!confirm('توافق على الطلب ده؟')) return;
  try{ await call('reqDecide',{id,decision,note}); toast(decision==='approve'?'اتوافق ✓':'اترفض'); Object.keys(S.fetched).forEach(k=>{ if(k.indexOf('lv:')===0) S.fetched[k]=0; }); S.cache.rqList=null; viewLeaves({month:S.lvMonth}); refreshDash(); }
  catch(e){ alert(e.message); }
}
function lvXl(){
  const d=S.lvData; if(!d) return null;
  const row=r=>{ const ok=r.approvals.filter(a=>a.decision==='approved'); return [r.name,r.job,r.kind==='leave'?r.typeLabel:'Permission',r.from,r.to,r.kind==='leave'?r.days:'',r.kind==='permission'?(r.timeFrom+'–'+r.timeTo):'',r.kind==='permission'?r.hours:'',r.reason,(RQ_STATUS[r.status]||[r.status])[0],r.flow.join(' → '),r.status==='pending'?r.step:'',agTime(r.createdAt)].concat(r.flow.map((st,i)=>ok[i]?ok[i].by+' · '+agTime(ok[i].at):'')); };
  const maxF=Math.max(1,...d.list.concat(d.pending).map(r=>r.flow.length));
  const head=['Employee','Job','Type','From','To','Days','Time','Hours','Reason','Status','Approval chain','Waiting for','Requested'].concat(Array.from({length:maxF},(_,i)=>'Step '+(i+1)));
  const log=[['Request','Employee','When','Who','Step','Decision','Note']];
  d.list.forEach(r=>{ log.push([r.id,r.name,agTime(r.createdAt),r.name,'','created','']); r.approvals.forEach(a=>log.push([r.id,r.name,agTime(a.at),a.by,a.step,a.decision,a.note||''])); });
  return {name:'leaves-permissions-'+d.month,sheets:[{name:'Requests '+d.month,rows:[head].concat(d.list.map(row))},{name:'Waiting now',rows:[head].concat(d.pending.map(row))},{name:'History',rows:log}]};
}

/* ----- HR → Agent Profiles ----- */
S.agQ='';
function viewAgents(opts){
  const month=(opts&&opts.month)||S.agMonth||'';
  S.agMonth=month;
  setTop('Agent Profiles','Every employee this month · click anyone to open their profile');
  swr('ag:'+(month||'now'),'agentBoard',month?{month}:{},(d)=>{ S.agData=d; renderAgents(); });
}
function renderAgents(){
  const d=S.agData; if(!d) return;
  if(!$('agMonth')){ const ta=$('topActions'); if(ta) ta.insertAdjacentHTML('afterbegin',agMonthSel('agMonth',d.months,d.month)); }
  if($('agMonth')) $('agMonth').onchange=e=>{ S.agMonth=e.target.value; viewAgents({month:e.target.value}); };
  const q=S.agQ.trim().toLowerCase(), L=d.list.filter(x=>!q||(x.name+' '+x.job+' '+x.dept).toLowerCase().indexOf(q)>=0);
  const pay=d.canPay;
  $('main').innerHTML=`<div class="card" style="margin-bottom:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap"><input id="agQ" type="search" placeholder="Search by name, job or department" value="${esc(S.agQ)}" style="flex:1 1 260px" aria-label="Search employees"><span class="muted" style="font-size:13px">${L.length} of ${d.list.length} · ${esc(agMonthLabel(d.month))}</span></div>
    <div class="card flush"><div class="tbl-wrap"><table class="ag-tbl" style="min-width:${pay?1060:840}px"><thead><tr><th>Employee</th><th>Leave days</th><th>Permissions</th><th>Balance left</th><th>Days worked</th><th>Hours</th><th title="Clock-ins closed by the system at the end of the shift (or the overtime limit)">Closed at shift end</th><th>Rank</th>${pay?'<th>Bonus</th><th>Deductions</th><th>Net salary</th>':''}</tr></thead>
    <tbody>${L.map(x=>`<tr tabindex="0" data-u="${esc(x.u)}" onclick="agOpen('${esc(x.u)}')" onkeydown="if(event.key==='Enter')agOpen('${esc(x.u)}')">
      <td><div class="lv-who"><div class="av" data-u="${esc(x.u)}">${esc(initials(x.name))}</div><div class="lv-tx"><b>${bd(x.name)}</b><span class="muted">${esc(x.job||'')} · ${esc(x.dept)}</span></div></div></td>
      <td>${x.leaveDays}</td><td>${x.permCount}${x.permHours?' · '+x.permHours+' h':''}</td><td>${x.balLeft} <span class="muted">/ ${x.balTotal}</span></td><td>${x.clocks?x.days:'—'}</td><td>${x.clocks?x.hours:'—'}</td><td>${x.clocks?(x.shiftOut?`<span class="pill p-prog">${x.shiftOut}</span>`:'0'):'—'}</td>
      <td>${x.rank?`<b>#${x.rank}</b> <span class="muted">· ${x.score}</span>`:'<span class="muted">·</span>'}</td>
      ${pay?`<td class="ag-plus">${x.pay&&x.pay.bonus?'+'+agMoney(x.pay.bonus):'0'}</td><td class="ag-minus">${x.pay&&x.pay.deductions?'−'+agMoney(x.pay.deductions):'0'}</td><td><b>${x.pay&&x.pay.net!=null?agMoney(x.pay.net,x.pay.currency):'<span class="muted">Not set</span>'}</b></td>`:''}</tr>`).join('')}</tbody></table></div></div>
    <p class="muted" style="font-size:12.5px">Rank comes from Scorecards. Net salary = base + bonuses − deductions for the month.</p>`;
  const qi=$('agQ'); if(qi){ qi.oninput=()=>{ S.agQ=qi.value; const p=qi.selectionStart; renderAgents(); const n=$('agQ'); n.focus(); try{ n.setSelectionRange(p,p); }catch(e){} }; }
}
function agXl(){
  const d=S.agData; if(!d) return null; const pay=d.canPay;
  const head=['Employee','Job','Department','Leave days','Leaves','Permissions','Permission hours','Overtime hours','Balance left','Annual balance','Days worked','Hours','Missed clock-outs','Closed at shift end','Score','Rank'].concat(pay?['Base salary','Bonus','Deductions','Net salary','Currency']:[]);
  return {name:'agent-profiles-'+d.month,sheets:[{name:'Agents '+d.month,rows:[head].concat(d.list.map(x=>[x.name,x.job,x.dept,x.leaveDays,x.leaveCount,x.permCount,x.permHours,x.otHours,x.balLeft,x.balTotal,x.days,x.hours,x.missed,x.shiftOut||0,x.score==null?'':x.score,x.rank||''].concat(pay?[x.pay.base==null?'':x.pay.base,x.pay.bonus,x.pay.deductions,x.pay.net==null?'':x.pay.net,x.pay.currency]:[])))}]};
}

/* ----- البروفايل نفسه ----- */
function agProfileHTML(r,drawer){
  const U=r.user, s=r.stats, P=r.pay, K=r.kpi;
  const col=x=>x==null?'var(--muted)':x>=80?'var(--ok)':x>=65?'var(--warn)':'var(--bad)';
  const head=`<div class="ag-head"><div class="lv-who"><div class="av ag-av" data-u="${esc(U.u)}">${esc(initials(U.name))}</div><div class="lv-tx"><h2 style="margin:0">${bd(U.name)}</h2><span class="muted">${esc(U.job||'')} · ${esc(U.dept)}</span>
      <div class="ag-chips"><span>${esc(AG_TYPE[U.empType]||U.empType)}</span><span>${esc(AG_MODE[U.workMode]||U.workMode)}</span><span>Shift ${U.shift} h</span>${U.teamLeader?`<span>Team Leader: ${bd(U.teamLeader)}</span>`:''}</div></div></div>
    <div class="ag-tools">${agMonthSel('agpMonth',r.months,r.month)}<button class="btn small" onclick="agpXl()">⬇ Export Excel</button>${drawer?'<button class="iconbtn" onclick="closeModal()" aria-label="Close">✕</button>':''}</div></div>`;
  const tiles=`<div class="grid kpis" style="margin:0">
      <div class="kpi"><span>Leave days</span><b>${s.leaveDays}</b><small>${s.leaveCount} approved this month</small></div>
      <div class="kpi"><span>Permissions</span><b>${s.permCount}</b><small>${s.permHours} h this month</small></div>
      <div class="kpi"><span>Annual balance left</span><b style="color:${s.balLeft<=3?'var(--warn)':'inherit'}">${s.balLeft}</b><small>of ${s.balTotal} days</small></div>
      <div class="kpi"><span>Scorecard rank</span><b>${s.rank?'#'+s.rank:'·'}</b><small>${s.rank?'of '+s.of+' · score '+s.score:'Not scored yet'}</small></div></div>`;
  const pay=P?`<div class="card ag-card"><div class="chead"><h3>Salary · ${esc(agMonthLabel(r.month))}</h3></div>
      <div class="ag-lines"><div><span>Base salary${P.baseFrom?` <small class="muted">since ${esc(agMonthLabel(P.baseFrom))}</small>`:''}</span><b>${P.base==null?'<span class="muted">Not set</span>':agMoney(P.base,P.currency)}</b></div>
      ${P.items.map(x=>`<div class="${x.status==='void'?'ag-void':''}"><span>${x.kind==='bonus'?'Bonus':'Deduction'} · ${bd(x.reason)}<small class="muted"> · ${bd(x.by)} · ${agTime(x.at)}${x.status==='void'?' · cancelled by '+bd(x.voidBy)+': '+bd(x.voidNote):''}</small></span>
        <b class="${x.kind==='bonus'?'ag-plus':'ag-minus'}">${x.kind==='bonus'?'+':'−'} ${agMoney(x.amount)}</b>${r.canEditPay&&x.status!=='void'?`<button class="btn small ghost" onclick="agVoid('${esc(x.id)}')" title="Cancel this line (it stays in the record)">Cancel</button>`:''}</div>`).join('')}
      ${!P.items.length?'<div><span class="muted">No bonus or deductions this month</span><b></b></div>':''}
      <div class="ag-net"><span>Net</span><b>${P.net==null?'—':agMoney(P.net,P.currency)}</b></div></div>
      ${r.canEditPay?`<div class="mfoot" style="margin-top:12px;flex-wrap:wrap"><button class="btn small primary" onclick="agItem('bonus')">+ Add bonus</button><button class="btn small" onclick="agItem('deduction')">+ Add deduction</button><span class="spacer"></span><button class="btn small ghost" onclick="agSalary()">Set base salary</button></div>`:`<p class="muted" style="font-size:12px;margin:10px 0 0">${r.self?'Only you and the management can see this.':''}</p>`}</div>`:'';
  const score=`<div class="card ag-card"><div class="chead"><h3>Scorecard</h3></div>${K?`<div class="ag-score"><div class="ag-ring" style="border-color:${col(K.total)};color:${col(K.total)}">${K.total==null?'·':K.total}</div><div><b>${s.rank?'Rank #'+s.rank+' of '+s.of:'Not ranked yet'}</b><div class="muted" style="font-size:13px">${esc(U.dept)}</div></div></div>
      ${K.axes.map(a=>`<div class="ag-ax"><span>${esc(a.name[0].toUpperCase()+a.name.slice(1))}</span><i><em style="width:${a.score==null?0:Math.max(0,Math.min(100,a.score))}%"></em></i><b>${a.score==null?'·':a.score}</b></div>`).join('')}`:'<p class="muted">No score for this month yet.</p>'}</div>`;
  const att=`<div class="card ag-card"><div class="chead"><h3>Attendance</h3></div><div class="ag-lines">
      <div><span>Days worked</span><b>${U&&s.clocks?s.days:'—'}</b></div><div><span>Work hours</span><b>${s.clocks?s.hours+' h':'—'}</b></div>
      <div><span>Missed clock-outs</span><b>${s.clocks?s.missed:'—'}</b></div><div><span>Closed at shift end</span><b>${s.clocks?(s.shiftOut||0):'—'}</b></div><div><span>Overtime</span><b>${s.otHours} h</b></div><div><span>Requests waiting</span><b>${s.pending}</b></div></div></div>`;
  const reqs=`<div class="card ag-card"><div class="chead"><h3>Leaves &amp; permissions <span class="muted">· this month</span></h3></div>${r.requests.length?r.requests.map(q=>`<div class="ag-req"><div><b>${q.kind==='leave'?esc(q.typeLabel):q.kind==='overtime'?'Overtime':'Permission'}</b> <span class="muted">${lvWhen(q)}</span>${q.kind!=='overtime'?lvChain(q):''}</div><span class="pill ${(RQ_STATUS[q.status]||['',''])[1]}">${(RQ_STATUS[q.status]||[q.status])[0]}</span></div>`).join(''):'<p class="muted">Nothing this month.</p>'}</div>`;
  const hist=r.payHistory&&r.payHistory.length?`<div class="card ag-card"><div class="chead"><h3>Salary history <span class="muted">· every change is kept</span></h3></div><div class="lv-log" style="display:block">${r.payHistory.map(h=>`<div>${agTime(h.at)} · <b>${bd(h.by)}</b> · ${bd(h.what)}</div>`).join('')}</div></div>`:'';
  return `<div class="ag-prof">${head}${tiles}<div class="ag-grid">${pay}${score}</div><div class="ag-grid">${reqs}${att}</div>${hist}</div>`;
}
function agWire(drawer){
  const m=$('agpMonth'); if(m) m.onchange=e=>{ const un=S.agP&&S.agP.user.u; if(drawer) agOpen(un,e.target.value); else viewAgent({month:e.target.value}); };
}
async function agOpen(un,month){
  const vt=S.vt;
  if(!$('modalRoot').querySelector('.ag-drawer')) $('modalRoot').innerHTML=`<div class="modal ag-modal" onclick="if(event.target===this)closeModal()"><div class="ag-drawer" role="dialog" aria-modal="true" aria-label="Agent profile">${LOADING}</div></div>`;
  try{
    const r=await call('agentProfile',{username:un,month:month||(S.agData&&S.agData.month)||undefined});
    if(S.vt!==vt) return;
    agShow(r,true);
  }catch(e){ closeModal(); toast(e.message); }
}
function agShow(r,drawer){
  S.agP=r;
  if(drawer){ const box=$('modalRoot').querySelector('.ag-drawer'); if(!box){ $('modalRoot').innerHTML=`<div class="modal ag-modal" onclick="if(event.target===this)closeModal()"><div class="ag-drawer" role="dialog" aria-modal="true" aria-label="Agent profile"></div></div>`; } $('modalRoot').querySelector('.ag-drawer').innerHTML=agProfileHTML(r,true); }
  else $('main').innerHTML=agProfileHTML(r,false);
  agWire(drawer);
}
// الموظف نفسه (My Work → My Profile)
function viewAgent(opts){
  const month=opts&&opts.month;
  setTop('My Profile','Your month: leave, permissions, rank and salary');
  swr('agMe:'+(month||'now'),'agentProfile',month?{month}:{},r=>agShow(r,false));
}
function agpXl(){
  const r=S.agP; if(!r) return; const s=r.stats, P=r.pay;
  const sheets=[{name:'Profile',rows:[['Field','Value'],['Name',r.user.name],['Job',r.user.job],['Department',r.user.dept],['Month',r.month],['Leave days',s.leaveDays],['Permissions',s.permCount],['Permission hours',s.permHours],['Overtime hours',s.otHours],['Annual balance left',s.balLeft],['Annual balance',s.balTotal],['Days worked',s.days],['Hours',s.hours],['Missed clock-outs',s.missed],['Closed at shift end',s.shiftOut||0],['Score',s.score==null?'':s.score],['Rank',s.rank?s.rank+' of '+s.of:'']]
    .concat(P?[['Base salary',P.base==null?'':P.base],['Bonus',P.bonus],['Deductions',P.deductions],['Net salary',P.net==null?'':P.net],['Currency',P.currency]]:[])},
    {name:'Requests',rows:[['Type','From','To','Days','Hours','Status','Approvals']].concat(r.requests.map(q=>[q.kind==='leave'?q.typeLabel:q.kind,q.from,q.to,q.days,q.hours,q.status,q.approvals.map(a=>a.step+': '+a.by+' '+a.decision+' '+agTime(a.at)).join(' · ')]))}];
  if(P) sheets.push({name:'Salary lines',rows:[['Type','Amount','Reason','By','When','Status','Cancel note']].concat(P.items.map(x=>[x.kind,x.amount,x.reason,x.by,agTime(x.at),x.status,x.voidNote||'']))});
  if(r.payHistory) sheets.push({name:'Salary history',rows:[['When','By','Change']].concat(r.payHistory.map(h=>[agTime(h.at),h.by,h.what]))});
  xlSave('profile-'+r.user.u+'-'+r.month,sheets); toast('اتحمّل ملف الـ Excel ✓');
}
/* ----- المرتب والبونص والخصم ----- */
function agForm(title,body,btn,fn){
  const box=$('modalRoot').querySelector('.ag-drawer');
  const f=document.createElement('div'); f.className='ag-form'; f.setAttribute('role','dialog'); f.setAttribute('aria-label',title);
  f.innerHTML=`<div class="card"><h3 style="margin:0 0 8px">${title}</h3>${body}<div class="err" id="agErr"></div><div class="mfoot"><span class="spacer"></span><button class="btn" id="agX">Cancel</button><button class="btn primary" id="agOk">${btn}</button></div></div>`;
  (box||document.body).appendChild(f);
  f.querySelector('#agX').onclick=()=>f.remove();
  f.querySelector('#agOk').onclick=async()=>{ const b=f.querySelector('#agOk'); b.disabled=true; f.querySelector('#agErr').textContent='';
    try{ const r=await fn(); f.remove(); agShow(r,!!box); Object.keys(S.fetched).forEach(k=>{ if(k.indexOf('ag:')===0) S.fetched[k]=0; }); if(S.view==='agents') viewAgents({month:S.agMonth}); toast('اتحفظ ✓'); }
    catch(e){ f.querySelector('#agErr').textContent=e.message; b.disabled=false; } };
  const first=f.querySelector('input,select,textarea'); if(first) first.focus();
}
function agSalary(){
  const r=S.agP, P=r.pay||{};
  agForm('Base salary · '+esc(r.user.name),`<div class="row"><div><label for="agB">Monthly base salary</label><input id="agB" type="number" min="0" step="any" value="${P.base==null?'':P.base}"></div><div style="flex:0 0 120px"><label for="agC">Currency</label><select id="agC">${(r.currencies||['EGP']).map(c=>`<option${c===P.currency?' selected':''}>${c}</option>`).join('')}</select></div></div>
    <label for="agF">Starts from</label><input id="agF" type="month" value="${r.month}"><label for="agN">Note (optional)</label><input id="agN" maxlength="200" dir="auto" placeholder="e.g. yearly raise">
    <p class="muted" style="font-size:12px">The old salary stays in the history. Months before the start keep the old amount.</p>`,'Save',
    ()=>call('paySalarySet',{username:r.user.u,base:Number($('agB').value),currency:$('agC').value,from:$('agF').value,note:$('agN').value,month:r.month}));
}
function agItem(kind){
  const r=S.agP;
  agForm((kind==='bonus'?'Add bonus':'Add deduction')+' · '+esc(r.user.name),`<label for="agA">Amount${r.pay&&r.pay.currency?' ('+esc(r.pay.currency)+')':''}</label><input id="agA" type="number" min="0" step="any">
    <label for="agR">Reason</label><input id="agR" maxlength="300" dir="auto" placeholder="${kind==='bonus'?'e.g. Best ROAS November':'e.g. 3 late arrivals'}">
    <p class="muted" style="font-size:12px">For ${esc(agMonthLabel(r.month))}. The employee gets a notification and sees it on their profile.</p>`,kind==='bonus'?'Add bonus':'Add deduction',
    ()=>call('payItemAdd',{username:r.user.u,month:r.month,kind,amount:Number($('agA').value),reason:$('agR').value}));
}
function agVoid(id){
  agForm('Cancel this line',`<label for="agV">Why?</label><input id="agV" maxlength="300" dir="auto" placeholder="e.g. entered in the wrong month"><p class="muted" style="font-size:12px">It stays on the profile, crossed out, with your name and the reason.</p>`,'Cancel line',
    ()=>call('payItemVoid',{id,note:$('agV').value}));
}
