/* ============ Client Report (تقرير العملاء الشهري) ============
   عن العملاء نفسهم مش التيم. الإدارة بتشوف كل العملاء وتقدر تفلتر بالـ AM، والـ AM بيشوف عملاءه بس.
   الشهر الحالي بيتحدث، والشهور اللي فاتت بتفضل زي ما كانت آخر الشهر. زرار Print / PDF بيطبع صفحة A4. */
const CR_G=[['late','Late or blocked','Past target launch or has an open blocker','p-bad'],['active','In progress','On track','p-prog'],['launched','Launched this month','','p-in'],['paused','On hold / cancelled','','p-out']];
function canClientRep(){ return can('projects.view_all') || (can('projects.manage_own') && !can('projects.manage_all')); }
function crCurMonth(){ return new Date().toLocaleDateString('en-CA',{timeZone:'Africa/Cairo'}).slice(0,7); }
function viewClientRep(opts){
  S.crF=S.crF||{month:'',am:''};
  if(opts&&opts.month) S.crF.month=opts.month;
  const k='cr_'+(S.crF.month||crCurMonth())+'_'+(S.crF.am||'');
  setTop('Client Report','');
  S.crKey=k;
  swr(k,'clientReport',{month:S.crF.month||'',am:S.crF.am||''},renderClientRep);
}
function crSet(f,v){ S.crF[f]=v; viewClientRep(); }
function crFresh(){ call('clientReport',{month:S.crF.month||'',am:S.crF.am||'',fresh:true}).then(r=>{ S.cache[S.crKey]=r; if(S.view==='clientrep') renderClientRep(r,true); toast('Updated ✓'); }).catch(e=>toast(e.message)); }
const crD=d=>{ if(!d) return '—'; const x=new Date(d+'T12:00:00'); return isNaN(x)?d:x.toLocaleDateString('en-GB',{day:'numeric',month:'short'}); };
function renderClientRep(r){
  if(S.view!=='clientrep') return;
  const k=r.kpis, cur=crCurMonth();
  const upd=new Date(r.at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
  setTop('Client Report', r.monthName+' · '+(r.live?'updated '+upd:r.final?'closed at month end':r.snap?'saved '+upd:'from current project data')+(r.scope==='own'?' · your clients':''),
    `${r.scope==='all'&&r.ams.length?`<select class="cr-sel" onchange="crSet('am',this.value)" aria-label="Account manager"><option value="">All account managers</option>${r.ams.map(a=>`<option value="${esc(a.u)}"${a.u===r.am?' selected':''}>${esc(a.name)}</option>`).join('')}</select>`:''}
     <input type="month" class="cr-sel" value="${r.month}" min="${r.first}" max="${cur}" onchange="crSet('month',this.value)" aria-label="Month">
     ${r.live?`<button class="btn ghost" onclick="crFresh()">Refresh</button>`:''}
     <button class="btn primary" onclick="crPrint()">Print / PDF</button>`);
  const tile=(lab,val,sub,cls)=>`<div class="kpi"><span>${lab}</span><b${cls?` style="color:${cls}"`:''}>${val}</b>${sub?`<small>${sub}</small>`:''}</div>`;
  const onPct=k.launched?Math.round(k.onTime/k.launched*100):0;
  const brk=(title,list)=>{ const mx=Math.max(1,...list.map(g=>g.total)); return `<div class="card cr-brk"><h3>${title}</h3>${list.length?list.map(g=>`<div class="cr-bar"><span class="cr-bl" dir="auto">${esc(g.name)}</span><span class="cr-track"><i style="width:${g.total/mx*100}%"></i></span><b>${g.total}</b><small>${g.launched} launched${g.late?` · <em>${g.late} late</em>`:''}</small></div>`).join(''):'<div class="muted">—</div>'}</div>`; };
  const rowHTML=x=>`<tr onclick="goTo({view:'project',id:'${esc(x.id)}'})" class="cr-tr">
    <td><b dir="auto">${esc(x.store)}</b>${x.isNew?' <span class="pill p-prog cr-new">New</span>':''}<div class="sub2" dir="auto">${esc(x.client||'')}</div></td>
    ${r.scope==='all'?`<td dir="auto">${esc(x.amName||'—')}</td>`:''}
    <td dir="auto">${esc(x.type)}</td><td class="nw">${esc([x.from,x.to].filter(Boolean).join(' → ')||'—')}</td>
    <td class="nw">${crD(x.start)}</td><td class="nw">${crD(x.target)}</td><td class="nw">${x.goLive?crD(x.goLive):'—'}</td>
    <td><div class="cr-prog"><span class="cr-track"><i style="width:${x.progress}%"></i></span>${x.progress}%</div></td>
    <td class="nw">${x.late?`<span class="cr-late">${x.late} ${x.late===1?'day':'days'}</span>`:x.onTime?'<span class="cr-ok">On time</span>':'—'}${x.blockers?`<div class="sub2 cr-late">${x.blockers} blocker${x.blockers>1?'s':''}</div>`:''}</td>
    <td><span class="pill ${x.status==='Active'?'p-prog':x.status==='Launched'?'p-in':x.status==='On Hold'?'p-yel':'p-out'}">${esc(x.status)}</span></td></tr>`;
  const groups=CR_G.map(([g,title,hint,cls])=>{ const L=r.rows.filter(x=>x.group===g); if(!L.length) return '';
    return `<section class="cr-sec"><div class="cr-h"><h2>${title}</h2><span class="pill ${cls}">${L.length}</span>${hint?`<span class="muted">${hint}</span>`:''}</div>
    <div class="tbl-wrap"><table class="cr-t"><tr><th>Store / client</th>${r.scope==='all'?'<th>Account manager</th>':''}<th>Type</th><th>Platform</th><th>Start</th><th>Target</th><th>Launched</th><th>Progress</th><th>Delay</th><th>Status</th></tr>${L.map(rowHTML).join('')}</table></div></section>`; }).join('');
  $('main').innerHTML=`<div class="cr">
    <div class="cr-print-h"><div class="logo"><i>M</i>Miqnas <span>ERP</span></div><div><b>Client Report · ${esc(r.monthName)}</b><small>${r.am?esc((r.ams.find(a=>a.u===r.am)||{}).name||'')+' · ':''}${r.scope==='own'?esc(S.user.name)+' · ':''}Printed ${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</small></div></div>
    ${r.pdf?`<div class="card cr-pdf">${ico('brief',18)}<span>The PDF for ${esc(r.monthName)} was saved automatically in Google Drive.</span><a class="btn small" href="${esc(r.pdf)}" target="_blank" rel="noopener">Open PDF</a></div>`:''}
    <div class="grid kpis cr-k">
      ${tile('Clients this month',k.total,`${k.isNew} new`)}
      ${tile('Launched',k.launched,k.launched?`${k.onTime} on time · ${k.lateLaunch} late`:'None yet')}
      ${tile('In progress',k.active,`${k.late} late · ${k.blocked} blocked`)}
      ${tile('Avg days to launch',k.avgDays===null?'—':k.avgDays,'From start to launch')}
    </div>
    <div class="grid kpis cr-k">
      ${tile('New clients',k.isNew,'Started this month')}
      ${tile('Late',k.late,'Past target launch',k.late?'var(--bad)':'')}
      ${tile('On hold',k.hold,'')}
      ${tile('Cancelled',k.cancelled,'')}
    </div>
    ${k.launched?`<div class="card cr-ontime"><div><b>${onPct}%</b> of launches were on time</div><span class="cr-track big"><i style="width:${onPct}%"></i></span><small class="muted">${k.onTime} of ${k.launched} launched on or before the target date</small></div>`:''}
    <div class="cr-brks">${brk('By project type',r.byType)}${brk('By platform',r.byPlatform)}${r.scope==='all'&&!r.am?brk('By account manager',r.byAm):''}</div>
    ${groups||`<div class="card empty" style="padding:40px;text-align:center">No clients in ${esc(r.monthName)}.</div>`}
  </div>`;
}
function crPrint(){ document.body.classList.add('printing-cr'); setTimeout(()=>{ window.print(); setTimeout(()=>document.body.classList.remove('printing-cr'),500); },50); }

/* كارت صغير في الداشبورد */
function crCardHTML(r){
  if(!r||!r.kpis) return '';
  const k=r.kpis;
  return `<div class="card cr-mini"><div class="cr-h"><h2>Clients · ${esc(r.monthName)}</h2><div class="spacer"></div><button class="btn ghost small" onclick="go('clientrep')">Full report →</button></div>
    <div class="cr-mini-g">
      <div><b>${k.total}</b><span>Clients</span></div><div><b>${k.isNew}</b><span>New</span></div>
      <div><b>${k.launched}</b><span>Launched${k.launched?` · ${k.onTime} on time`:''}</span></div><div><b>${k.active}</b><span>In progress</span></div>
      <div><b style="color:${k.late?'var(--bad)':'inherit'}">${k.late}</b><span>Late</span></div><div><b>${k.hold}</b><span>On hold</span></div>
    </div></div>`;
}
function crCardLoad(){
  if(!canClientRep()) return;
  const k='cr_'+crCurMonth()+'_';
  const put=r=>{ const el=document.getElementById('crMini'); if(el) el.innerHTML=crCardHTML(r); };
  if(S.cache[k]) put(S.cache[k]);
  if(S.fetched&&S.fetched[k]&&Date.now()-S.fetched[k]<300000) return;
  call('clientReport',{}).then(r=>{ S.cache[k]=r; S.fetched[k]=Date.now(); put(r); }).catch(()=>{});
}
