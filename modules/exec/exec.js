/* ============ Executive Dashboard + Commercial Pulse ============
   للـ Executive Leadership: 5 أجزاء + heatmap للأقسام.
   Commercial Pulse: Sales Manager بيدخل الأرقام كل شهر، والـ CEO يقدر يعدّل ويحدد المؤشرات والتارجت. */
const money=v=>v==null?'—':Number(v).toLocaleString('en-US',{maximumFractionDigits:0});
const fmtVal=(v,unit)=>v==null?'—':unit==='SAR'?money(v)+' SAR':unit==='%'?v+'%':money(v);
const HEAT_BG=['var(--okbg)','#F2F7E6','var(--yelbg)','var(--badbg)'], HEAT_FG=['var(--ok)','#4C6B12','var(--yel)','var(--bad)'];

function viewExec(){
  setTop('Executive','Company at a glance',`<button class="btn" onclick="viewExec()">Refresh</button>`);
  swr('exec','execDash',{},renderExec);
}
function pulseCard(P,compact){
  const ms=P.metrics;
  return `<div class="card flush">
    <div class="chead"><h2>Commercial Pulse</h2><span class="muted" style="font-size:13px">${esc(monthName(P.month))}${P.updatedAt?' · updated '+new Date(P.updatedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'})+' by '+esc(P.updatedBy):''}</span><span class="spacer"></span>
      ${P.canEdit?`<button class="btn small" onclick="go('pulse')">${P.updatedAt?'Update numbers':'Enter numbers'}</button>`:''}</div>
    ${!P.updatedAt?`<div class="empty" style="padding:18px"><b style="color:var(--warn)">No numbers yet for ${esc(monthName(P.month))}</b>The Sales Manager enters them from the Commercial Pulse page.</div>`:''}
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(${compact?150:180}px,1fr));gap:1px;background:var(--line2)">
      ${ms.map(m=>{ const good=m.pct==null?null:(m.higher? m.pct>=100 : m.value<=m.target);
        const col=m.pct==null?'var(--line)':good?'var(--ok)':m.higher&&m.pct>=70?'#D6A100':'var(--bad)';
        const delta=m.value!=null&&m.prev!=null&&m.prev!==0?Math.round((m.value-m.prev)/m.prev*100):null;
        return `<div style="background:var(--card);padding:14px 16px">
          <div class="muted" style="font-size:12.5px;font-weight:500">${esc(m.label)}</div>
          <div style="font-size:22px;font-weight:700;margin:2px 0">${fmtVal(m.value,m.unit)}</div>
          <div style="font-size:12px" class="muted">Target ${fmtVal(m.target,m.unit)}${delta!=null?` · <span style="color:${(delta>=0)===m.higher?'var(--ok)':'var(--bad)'}">${delta>=0?'▲':'▼'} ${Math.abs(delta)}%</span> vs last month`:''}</div>
          ${m.target?`<div style="height:6px;background:var(--line2);border-radius:99px;margin-top:8px;overflow:hidden"><div style="height:100%;width:${Math.min(100,m.pct||0)}%;background:${col}"></div></div>`:''}
        </div>`; }).join('')}
    </div></div>`;
}
function monthName(m){ const d=new Date(m+'-15T12:00:00'); return isNaN(d)? m : d.toLocaleDateString('en-GB',{month:'long',year:'numeric'}); }
function renderExec(X){
  S.skew=Date.now()-X.now;
  S.execGo=[];
  const gid=g=>{ S.execGo.push(g); return S.execGo.length-1; };
  const D=X.delivery, R=X.risks, C=X.capacity;
  const seg=(n,c,l)=>n?`<div title="${l}: ${n}" style="flex:${n};background:${c}"></div>`:'';
  const cols=[['people','People'],['present','Present now'],['hours','Hours today'],['open','Open tasks'],['late','Late tasks'],['alerts','Alerts']].filter(c=>!X.noProjects||['people','present','hours'].indexOf(c[0])>=0);
  $('main').innerHTML=`<div style="display:grid;gap:20px">

  ${X.actions.length?`<div class="card flush" style="border-left:5px solid var(--bad)">
    <div class="chead"><span style="color:var(--bad)">${ico('warn',20)}</span><h2>Executive Action Center</h2><span class="pill p-bad">${X.actions.length}</span><span class="muted" style="font-size:13px">Things that need a decision</span></div>
    ${X.actions.map(a=>`<button class="al sev-${a.sev}" onclick="goTo(S.execGo[${gid(a.go)}])"><span class="dot"></span><span class="tx"><b>${bd(a.title)}</b><span>${bd(a.detail)}</span></span></button>`).join('')}
  </div>`:`<div class="card" style="border-left:5px solid var(--ok)"><h2 style="margin:0 0 4px">Executive Action Center</h2><div class="muted">Nothing needs a decision right now.</div></div>`}

  ${pulseCard(X.pulse)}

  ${X.noProjects?'':`  <div class="two" style="margin:0">
    <div class="card flush"><div class="chead"><h2>Delivery Health</h2><span class="spacer"></span><button class="btn ghost small" onclick="go('dash')">Operations dashboard →</button></div>
      <div style="padding:16px 20px">
        <div style="display:flex;gap:24px;flex-wrap:wrap;margin-bottom:14px">
          <div><div class="muted" style="font-size:12.5px">Active projects</div><b style="font-size:26px">${D.active}</b></div>
          <div><div class="muted" style="font-size:12.5px">On track</div><b style="font-size:26px;color:${D.onTrackPct>=70?'var(--ok)':D.onTrackPct>=40?'var(--yel)':'var(--bad)'}">${D.onTrackPct}%</b></div>
          <div><div class="muted" style="font-size:12.5px">Average done</div><b style="font-size:26px">${D.avgDone}%</b></div>
          <div><div class="muted" style="font-size:12.5px">Launched this month</div><b style="font-size:26px">${D.launchedThisMonth}</b></div>
        </div>
        <div style="display:flex;height:12px;border-radius:99px;overflow:hidden;background:var(--line2)">${seg(D.ok,'var(--brand2)','On track')}${seg(D.behind,'#D6A100','Behind')}${seg(D.risk,'var(--accent)','At risk')}${seg(D.overdue,'#D92D20','Overdue')}</div>
        <div class="legend" style="margin-top:8px;font-size:12.5px;display:flex;gap:14px;flex-wrap:wrap">
          <span>● <b>${D.ok}</b> on track</span><span style="color:var(--yel)">● <b>${D.behind}</b> behind</span><span style="color:var(--warn)">● <b>${D.risk}</b> at risk</span><span style="color:var(--bad)">● <b>${D.overdue}</b> overdue</span></div>
      </div>
      ${D.watch.length?D.watch.map(p=>{ const h=HEALTH[p.health]; return `<button class="al" onclick="go('projects');viewProject('${esc(p.id)}')"><span class="tx"><b>${bd(p.client)}</b><span>${p.done}% done vs ${p.expected}% expected · ${p.daysLeft==null?'':p.daysLeft<0?-p.daysLeft+' days late':p.daysLeft+' days left'} · AM ${bd(p.am||'—')}</span></span><span class="pill ${h[1]}">${h[0]}</span></button>`; }).join(''):''}
    </div>

    <div class="card flush"><div class="chead"><h2>Critical Blockers & Risks</h2></div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line2);border-bottom:1px solid var(--line2)">
        ${[['Open blockers',R.blockersTotal,R.blockersTotal?'var(--warn)':'var(--ink)'],['3+ days old',R.blockersOld,R.blockersOld?'var(--bad)':'var(--ink)'],['Caused by client',R.clientCaused,'var(--ink)'],['Critical alerts',R.criticalTotal,R.criticalTotal?'var(--bad)':'var(--ink)']]
          .map(k=>`<div style="background:var(--card);padding:12px 14px"><div class="muted" style="font-size:12px">${k[0]}</div><b style="font-size:22px;color:${k[2]}">${k[1]}</b></div>`).join('')}
      </div>
      ${R.blockers.map(b=>`<button class="al sev-${b.days>=3?'red':'orange'}" onclick="go('projects');viewProject('${esc(b.project)}')"><span class="dot"></span><span class="tx"><b>${bd(b.client)}: ${esc(b.cat)} (${esc(b.cause)})</b><span>${b.days} ${b.days===1?'day':'days'} · ${bd(b.details.slice(0,120))}</span></span><span class="tg">BLOCKER</span></button>`).join('')}
      ${R.critical.filter(a=>a.tag!=='BLOCKER').map(a=>`<button class="al sev-red" onclick="goTo(S.execGo[${gid(a.go)}])"><span class="dot"></span><span class="tx"><b>${bd(a.title)}</b><span>${bd(a.detail)}</span></span><span class="tg">${esc(a.tag)}</span></button>`).join('')}
      ${!R.blockers.length&&!R.critical.length?`<div class="empty"><b>No critical risks</b>${R.idle} idle task alerts · ${R.waiting} people waiting on handovers</div>`:`<div class="muted" style="font-size:12.5px;padding:10px 20px">${R.idle} idle task alerts · ${R.waiting} people waiting on handovers</div>`}
    </div>
  </div>`}

  <div class="card flush"><div class="chead"><h2>People & Capacity</h2><span class="spacer"></span><button class="btn ghost small" onclick="go('today')">Attendance →</button></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:1px;background:var(--line2);border-bottom:1px solid var(--line2)">
      ${[['Headcount',C.headcount],['Clocked in',C.clockedIn+'/'+C.clockers],['On break',C.onBreak],['Absent today',C.absent],['Hours today',C.hoursToday],['Timers running',C.timers],['Done today',C.doneToday],['Late tasks',C.lateTasks]].filter(k=>k[1]!=null)
        .map(k=>`<div style="background:var(--card);padding:12px 14px"><div class="muted" style="font-size:12px">${k[0]}</div><b style="font-size:22px">${k[1]}</b></div>`).join('')}
    </div>
    ${X.noProjects?'':`    <div style="padding:14px 20px">
      <div class="muted" style="font-size:12.5px;margin-bottom:8px">Open tasks per person (team average ${C.avgOpen})</div>
      ${C.load.map(x=>{ const mx=Math.max(1,...C.load.map(y=>y.open)); const over=C.overloaded.some(o=>o.u===x.u);
        return `<div style="display:grid;grid-template-columns:160px 1fr 70px;gap:10px;align-items:center;margin:5px 0;font-size:13px">
          <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><b>${esc(x.name)}</b> <span class="muted">${esc(x.job)}</span></div>
          <div style="height:10px;background:var(--line2);border-radius:99px;overflow:hidden"><div style="height:100%;width:${Math.round(x.open/mx*100)}%;background:${over?'var(--bad)':'var(--brand2)'}"></div></div>
          <div style="text-align:right">${x.open}${x.late?` <span style="color:var(--bad)">· ${x.late} late</span>`:''}</div></div>`; }).join('')||'<div class="muted">No one is assigned to projects yet.</div>'}
      ${C.idle.length?`<div class="muted" style="font-size:12.5px;margin-top:10px">No open tasks: ${C.idle.map(esc).join('، ')}</div>`:''}`}
    </div>
  </div>

  <div class="card flush"><div class="chead"><h2>Departments</h2><span class="muted" style="font-size:13px">Color shows where attention is needed</span></div>
    <div class="tbl-wrap" style="border:0"><table style="min-width:760px"><tr><th>Department</th>${cols.map(c=>`<th style="text-align:center">${c[1]}</th>`).join('')}</tr>
    ${X.heat.map(h=>`<tr><td><b>${esc(h.name)}</b><div class="muted" style="font-size:12px">${esc(h.line)}</div></td>${cols.map(c=>{ const v=h.cells[c[0]]; return `<td style="text-align:center;background:${v.l?HEAT_BG[v.l]:'transparent'};color:${v.l>1?HEAT_FG[v.l]:'inherit'};font-weight:${v.l>1?700:500}">${esc(v.v)}</td>`; }).join('')}</tr>`).join('')}
    </table></div></div>
  </div>`;
}

/* ----- Commercial Pulse (إدخال الأرقام) ----- */
S.pulseMonth=null;
function viewPulse(){
  setTop('Commercial Pulse','Monthly sales numbers for leadership');
  const m=S.pulseMonth||new Date().toISOString().slice(0,7);
  $('main').innerHTML=LOADING;
  call('pulseGet',{month:m}).then(renderPulse).catch(e=>{ $('main').innerHTML=`<div class="card err">${esc(e.message)}</div>`; });
}
function shiftMonth(m,d){ const x=new Date(Number(m.slice(0,4)),Number(m.slice(5,7))-1+d,15); return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0'); }
function renderPulse(P){
  S.pulse=P; S.pulseMonth=P.month;
  const cur=new Date().toISOString().slice(0,7);
  $('main').innerHTML=`<div style="display:grid;gap:20px;max-width:1000px">
  <div style="display:flex;align-items:center;gap:10px">
    <button class="btn small" onclick="S.pulseMonth=shiftMonth(S.pulseMonth,-1);viewPulse()">← Previous</button>
    <b style="font-size:16px">${esc(monthName(P.month))}</b>
    ${P.month<cur?`<button class="btn small" onclick="S.pulseMonth=shiftMonth(S.pulseMonth,1);viewPulse()">Next →</button>`:''}
  </div>
  ${pulseCard(P,true).replace(/<button class="btn small" onclick="go\('pulse'\)">[^<]*<\/button>/,'')}
  ${P.canEdit?`<div class="card"><h2>Enter numbers for ${esc(monthName(P.month))}</h2>
    <p class="muted" style="margin-top:-6px;font-size:13px">Totals for the whole month so far. You can update them any time; leadership sees the latest.</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px 18px">
      ${P.metrics.map(m=>`<div><label for="pv_${m.key}">${esc(m.label)} <span class="muted" style="font-weight:400">(${m.unit})</span></label><input id="pv_${m.key}" type="number" min="0" step="any" value="${m.value==null?'':m.value}" placeholder="—"></div>`).join('')}
    </div>
    <label for="pvNote" style="margin-top:12px">Note (optional)</label><input id="pvNote" maxlength="300" placeholder="Anything leadership should know about these numbers">
    <div class="mfoot"><span class="spacer"></span><button class="btn primary" id="pvSave" onclick="savePulse()">Save numbers</button></div><div class="err" id="pvErr"></div></div>`:''}
  ${P.canDefs?pulseDefsHTML(P.defs):''}
  </div>`;
}
async function savePulse(){
  const values={}; S.pulse.metrics.forEach(m=>{ const el=$('pv_'+m.key); if(el && el.value!=='') values[m.key]=Number(el.value); });
  const b=$('pvSave'); b.disabled=true; b.textContent='Saving...'; $('pvErr').textContent='';
  try{ const r=await call('pulseSave',{month:S.pulseMonth,values,note:$('pvNote').value}); toast('اتحفظت الأرقام ✓'); S.cache.exec=null; renderPulse(r); }
  catch(e){ $('pvErr').textContent=e.message; b.disabled=false; b.textContent='Save numbers'; }
}
function pulseDefsHTML(D){
  S.pulseDefs=JSON.parse(JSON.stringify(D));
  return `<div class="card"><h2>Metrics & targets <span class="muted" style="font-weight:400;font-size:13px">· CEO / Admin only</span></h2>
    <p class="muted" style="margin-top:-6px;font-size:13px">Add, rename or hide metrics and set monthly targets. No code changes needed.</p>
    <div class="tbl-wrap"><table style="min-width:760px"><tr><th>Code</th><th>Name</th><th>Unit</th><th>Monthly target</th><th>Higher is better</th><th>Shown</th><th></th></tr>
    ${S.pulseDefs.map((d,i)=>`<tr><td><input data-pd="${i}|key" value="${esc(d.key)}" dir="ltr" style="max-width:130px"></td><td><input data-pd="${i}|label" value="${esc(d.label)}"></td>
      <td><select data-pd="${i}|unit">${['count','SAR','%'].map(u=>`<option${u===d.unit?' selected':''}>${u}</option>`).join('')}</select></td>
      <td><input type="number" min="0" data-pd="${i}|target" value="${d.target}" style="max-width:140px"></td>
      <td style="text-align:center"><input type="checkbox" data-pdb="${i}|higher"${d.higher?' checked':''}></td><td style="text-align:center"><input type="checkbox" data-pdb="${i}|active"${d.active?' checked':''}></td>
      <td><button class="btn small ghost danger" onclick="pdCollect();S.pulseDefs.splice(${i},1);pdRender()">Remove</button></td></tr>`).join('')}
    </table></div>
    <div class="mfoot"><button class="btn" onclick="pdCollect();S.pulseDefs.push({key:'',label:'',unit:'count',target:0,higher:true,active:true});pdRender()">+ Add metric</button><span class="spacer"></span><button class="btn primary" id="pdSave" onclick="savePulseDefs()">Save metrics</button></div><div class="err" id="pdErr"></div></div>`;
}
function pdCollect(){
  document.querySelectorAll('[data-pd]').forEach(el=>{ const [i,f]=el.dataset.pd.split('|'); if(S.pulseDefs[i]) S.pulseDefs[i][f]=f==='target'?Number(el.value):el.value.trim(); });
  document.querySelectorAll('[data-pdb]').forEach(el=>{ const [i,f]=el.dataset.pdb.split('|'); if(S.pulseDefs[i]) S.pulseDefs[i][f]=el.checked; });
}
function pdRender(){ const keep=S.pulseDefs; const P=Object.assign({},S.pulse,{defs:keep}); renderPulse(P); S.pulseDefs=keep; }
async function savePulseDefs(){
  pdCollect();
  const b=$('pdSave'); b.disabled=true; b.textContent='Saving...';
  try{ const r=await call('pulseDefsSave',{defs:S.pulseDefs}); toast('اتحفظت المؤشرات ✓'); S.cache.exec=null; S.pulseMonth=r.month; renderPulse(r); }
  catch(e){ $('pdErr').textContent=e.message; b.disabled=false; b.textContent='Save metrics'; }
}
