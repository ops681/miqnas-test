/* ============ Board: تقرير الإدارة الشهري ============
   للـ C-level والفاوندرز والـ CEO. صورة الشركة في شهر + اتجاه آخر 6 شهور، وبيتطبع PDF لاجتماع البورد.
   الماليات بتظهر بس للي معاه صلاحية Finance أو الـ CEO أو الفاوندرز. */
function canBoard(){ return !!(S.user&&(S.user.clevel||S.user.founder||S.user.ceo)) || can('system.admin'); }
function viewBoard(opts){
  opts=opts||{};
  if(opts.month) S.boardM=opts.month;
  setTop('Board','Monthly company report');
  swr('board_'+(S.boardM||''),'boardDash',{month:S.boardM||''},renderBoard);
}
function brCols(list,key,fmt,color){
  const mx=Math.max(1,...list.map(x=>Number(x[key])||0));
  return `<div class="br-cols">${list.map(x=>`<div class="br-col"><b>${fmt?fmt(x[key]):x[key]}</b><div class="br-bar"><i style="height:${(Number(x[key])||0)/mx*100}%;${color?'background:'+color:''}"></i></div><span>${esc(x.label)}</span></div>`).join('')}</div>`;
}
function brK(label,val,sub,color){ return `<div class="kpi"><span>${label}</span><b style="${color?'color:'+color:''}">${val}</b>${sub?`<small>${sub}</small>`:''}</div>`; }
function renderBoard(r){
  const months=[]; { const n=new Date(); for(let i=0;i<12;i++){ const d=new Date(n.getFullYear(),n.getMonth()-i,15); months.push(d.toISOString().slice(0,7)); } }
  setTop('Board','Monthly company report',`<select onchange="S.boardM=this.value;viewBoard()" aria-label="Month" style="width:auto">${months.map(m=>`<option value="${m}"${m===r.month?' selected':''}>${new Date(m+'-15').toLocaleDateString('en-GB',{month:'long',year:'numeric'})}</option>`).join('')}</select><button class="btn" onclick="call('boardDash',{month:'${esc(r.month)}',fresh:true}).then(x=>{S.cache['board_'+(S.boardM||'')]=x;renderBoard(x);toast('Updated ✓')}).catch(e=>toast(e.message))">Refresh</button><button class="btn primary" onclick="brPrint()">Print / PDF</button>`);
  const k=r.delivery, M=r.money, P=r.people, Q=r.problems, K=r.knowledge, cur=M?M.currency:'SAR';
  const sar=v=>(Number(v)||0).toLocaleString('en-US',{maximumFractionDigits:0})+' '+cur;
  const pct=(a,b)=>b?Math.round(a/b*100)+'%':'—';
  $('main').innerHTML=`<div class="cr-print-h"><div class="logo">${brandMark('Board report')}</div><div><b>${esc(r.monthName)}</b><span class="muted">Generated ${new Date(r.generated).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</span></div></div>
  <div class="br">
    <section><h2 class="br-h">Delivery</h2>
      <div class="grid kpis">${brK('Clients this month',k.total,k.isNew+' new')}${brK('Launched',k.launched,k.launched?pct(k.onTime,k.launched)+' on time':'', 'var(--ok)')}${brK('In progress',k.active,k.blocked+' blocked','var(--warn)')}${brK('Late',k.late,'Past target launch',k.late?'var(--bad)':'')}${brK('Avg days to launch',k.avgDays===null?'—':k.avgDays,'')}${brK('On hold / cancelled',k.hold+' / '+k.cancelled,'')}</div>
      <div class="two"><div class="card"><h3>Launched per month</h3>${brCols(r.trend,'launched',null,'var(--ok)')}</div><div class="card"><h3>New clients per month</h3>${brCols(r.trend,'isNew')}</div></div>
      <div class="two"><div class="card"><h3>By platform</h3>${r.byPlatform.length?`<table class="br-t"><tr><th>Platform</th><th>Clients</th><th>Launched</th></tr>${r.byPlatform.map(x=>`<tr><td>${esc(x.name)}</td><td>${x.total}</td><td>${x.launched}</td></tr>`).join('')}</table>`:'<div class="muted">—</div>'}</div>
        <div class="card"><h3>By account manager</h3>${r.byAm.length?`<table class="br-t"><tr><th>Account Manager</th><th>Clients</th><th>Launched</th><th>Late</th></tr>${r.byAm.map(x=>`<tr><td>${bd(x.name)}</td><td>${x.total}</td><td>${x.launched}</td><td style="${x.late?'color:var(--bad)':''}">${x.late}</td></tr>`).join('')}</table>`:'<div class="muted">—</div>'}</div></div>
    </section>
    ${M?`<section><h2 class="br-h">Money</h2>
      <div class="grid kpis">${brK('Collected',sar(M.kpis.collected),M.kpis.rate===null?'':M.kpis.rate+'% of what was due','var(--ok)')}${brK('Expected',sar(M.kpis.expected),'Due this month')}${brK('Overdue now',sar(M.kpis.overdue),M.overdueCount+' payments',M.kpis.overdue?'var(--bad)':'')}${brK('Signed this month',sar(M.kpis.signed),'New contracts')}${brK('Still to collect',sar(M.kpis.outstanding),'All contracts')}${brK('Contracts ending soon',M.expiring,M.noContract+' active projects without signed contract',M.noContract?'var(--warn)':'')}</div>
      <div class="two"><div class="card"><h3>Collected per month</h3>${brCols(r.trend,'collected',v=>(Number(v)||0)>=1000?Math.round(v/1000)+'k':Math.round(v||0),'var(--ok)')}</div><div class="card"><h3>Signed per month</h3>${brCols(r.trend,'signed',v=>(Number(v)||0)>=1000?Math.round(v/1000)+'k':Math.round(v||0))}</div></div>
    </section>`:''}
    ${r.partners.length?`<section><h2 class="br-h">Partners</h2><div class="card"><table class="br-t"><tr><th>Partner</th><th>Stores</th><th>New this month</th><th>In progress</th><th>Launched</th><th>Blocked</th>${M?'<th>Collected</th><th>Fees</th>':''}</tr>
      ${r.partners.map(p=>`<tr><td><b>${esc(p.name)}</b></td><td>${p.stores}</td><td>${p.thisMonth}</td><td>${p.inProgress}</td><td>${p.launched}</td><td style="${p.blocked?'color:var(--bad)':''}">${p.blocked}</td>${M?`<td>${sar((M.byPartner||{})[p.name]||0)}</td><td>${sar((M.partnerFees||{})[p.name]||0)}</td>`:''}</tr>`).join('')}</table></div></section>`:''}
    ${P?`<section><h2 class="br-h">People</h2>
      <div class="grid kpis">${brK('Headcount',P.headcount,P.clockers+' clock in')}${brK('Worked this month',P.worked,'people with attendance')}${brK('Hours logged',P.hours.toLocaleString('en-US'),P.avgDay+' h per day on average')}${brK('Leave days',P.leaveDays,P.otHours+' overtime hours')}${brK('Requests',P.requests,P.approved+' approved · '+P.pending+' waiting')}${brK('Missed clock-outs',P.missed,'',P.missed?'var(--warn)':'')}</div></section>`:''}
    ${Q||K?`<section><h2 class="br-h">Quality</h2>
      <div class="grid kpis">${Q?brK('Problems reported',Q.reported,(Q.reported-Q.prev>0?'+':'')+(Q.reported-Q.prev)+' vs last month',Q.reported>Q.prev?'var(--bad)':'')+brK('Problems solved',Q.solved,Q.avgDays===null?Q.open+' still open':Q.avgDays+' days on average · '+Q.open+' open','var(--ok)')+(Q.blockers?brK('Blockers opened',Q.blockers.total,Q.blockers.open+' open now'):'')+(Q.revisions!=null?brK('Client revisions',Q.revisions,'Revision notes on tasks'):'')+(Q.late!=null?brK('Late tasks now',Q.late,'',Q.late?'var(--bad)':''):''):''}
        ${K?brK('SOPs',K.sops,(K.readPct===null?'':K.readPct+'% read by their teams')+(K.reviewDue?' · '+K.reviewDue+' due for review':''),K.readPct!==null&&K.readPct<80?'var(--warn)':''):''}</div>
      ${Q&&Q.top.length?`<div class="card"><h3>Most common problems</h3>${Q.top.map(x=>`<div class="br-row"><span dir="auto">${esc(x.name)}</span><b>${x.n}</b></div>`).join('')}</div>`:''}</section>`:''}
  </div>`;
}
function brPrint(){ document.body.classList.add('printing-cr'); setTimeout(()=>{ window.print(); setTimeout(()=>document.body.classList.remove('printing-cr'),500); },50); }
