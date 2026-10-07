/* ============ System Health ============
   سرعة السيرفر، الأخطاء، الطابور، حجم الشيتات، وأبطأ العمليات.
   المؤشر اللي فوق بيقول إمتى نبدأ نفكر في داتابيز. */
const HLV={green:['Healthy','var(--ok)','var(--okbg)'],yellow:['Watch','var(--yel)','var(--yelbg)'],red:['Act now','var(--bad)','var(--badbg)']};
function viewHealth(){
  setTop('System Health','Live from the server · last 24 hours unless noted', `<button class="btn" onclick="viewHealth()">Refresh</button>`);
  swr('health','healthGet',{},renderHealth);
}
function hPill(level){ const v=HLV[level]||HLV.green; return `<span style="display:inline-block;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:700;color:${v[1]};background:${v[2]}">${v[0]}</span>`; }
function fmtMs(ms){ return ms>=1000? (Math.round(ms/100)/10)+' s' : Math.round(ms)+' ms'; }
function fmtN(n){ return Number(n||0).toLocaleString('en-US'); }
function renderHealth(H){
  const k=H.kpis, ov=HLV[H.overall]||HLV.green;
  const msg={green:'Google Sheets is handling the load fine. No need to move to a database.',
    yellow:'Getting close to a limit. Keep an eye on it and start planning the database move.',
    red:'A limit has been passed. Time to plan the move to a database.'}[H.overall];
  const maxN=Math.max(1,...H.hours.map(h=>h.n));
  const nowH=new Date().getHours();
  const lvlP=ms=>ms>=H.limits.p95[1]?'red':ms>=H.limits.p95[0]?'yellow':'green';
  const barCol={green:'var(--brand2)',yellow:'#D9A400',red:'var(--bad)'};
  $('main').innerHTML=`<div style="display:grid;gap:20px">
  <div class="card" style="border-left:5px solid ${ov[1]};display:flex;gap:18px;align-items:center;flex-wrap:wrap">
    <div style="flex:1 1 320px"><div style="display:flex;gap:10px;align-items:center;margin-bottom:6px"><h2 style="margin:0">Database move signal</h2>${hPill(H.overall)}</div>
      <div class="muted">${msg}</div></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">${H.checks.map(c=>`<div style="border:1px solid var(--line);border-radius:12px;padding:10px 14px;min-width:150px">
      <div class="muted" style="font-size:12px">${esc(c.label)}</div>
      <div style="display:flex;align-items:baseline;gap:8px"><b style="font-size:20px">${c.unit==='ms'?fmtMs(c.value):c.value+c.unit}</b>${hPill(c.level)}</div>
      <div class="muted" style="font-size:11.5px">Red at ${c.unit==='ms'?fmtMs(c.limit):c.limit+c.unit}</div></div>`).join('')}</div>
  </div>

  <div class="grid kpis" style="margin:0">
    <div class="kpi"><span>Requests</span><b>${fmtN(k.requests)}</b><small>Last 24 hours</small></div>
    <div class="kpi"><span>Server speed (p95)</span><b>${fmtMs(k.p95)}</b><small>95% of requests were faster</small></div>
    <div class="kpi"><span>Server errors</span><b>${k.errPct}%</b><small>Google limits, timeouts and crashes</small></div>
    <div class="kpi"><span>Failed on devices</span><b>${fmtN(k.clientFails)}</b><small>Requests that never reached the server (usually the employee's internet)</small></div>
    <div class="kpi"><span>Retries</span><b>${k.retryPct}%</b><small>Requests sent again automatically</small></div>
    <div class="kpi"><span>Waiting on devices</span><b>${fmtN(k.queueMax)}</b><small>Biggest offline queue seen</small></div>
    <div class="kpi"><span>Writes today</span><b>${fmtN(k.writesToday)}</b><small>Saves to the sheets</small></div>
  </div>

  <div class="card"><div style="display:flex;align-items:center;gap:10px;margin-bottom:14px"><h2 style="margin:0">Today by hour</h2><span class="muted" style="font-size:13px">Bar = requests · color = speed</span></div>
    <div style="display:grid;grid-template-columns:repeat(24,1fr);gap:4px;align-items:end;height:150px">
      ${H.hours.map(h=>`<div title="${String(h.h).padStart(2,'0')}:00 · ${fmtN(h.n)} requests · p95 ${fmtMs(h.p95)}${h.e?' · '+h.e+' errors':''}" style="height:${h.n?Math.max(4,Math.round(h.n/maxN*100)):1}%;background:${h.n?barCol[lvlP(h.p95)]:'var(--line)'};border-radius:4px 4px 0 0;opacity:${h.h>nowH?.35:1}"></div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:repeat(24,1fr);gap:4px;margin-top:6px">${H.hours.map(h=>`<div class="muted" style="font-size:10.5px;text-align:center">${h.h%3===0?String(h.h).padStart(2,'0'):''}</div>`).join('')}</div>
  </div>

  <div class="two" style="margin:0">
    <div class="card flush"><div class="chead"><h2>Slowest operations</h2></div>
      ${H.slow.length?`<div class="tbl-wrap" style="border:0"><table><tr><th>Operation</th><th>Requests</th><th>p95</th><th>Slowest</th><th>Errors</th></tr>
      ${H.slow.map(s=>`<tr><td><code>${esc(s.act)}</code></td><td>${fmtN(s.n)}</td><td>${fmtMs(s.p95)} ${s.p95>=H.limits.p95[0]?hPill(lvlP(s.p95)):''}</td><td class="muted">${fmtMs(s.max)}</td><td>${s.e||'—'}</td></tr>`).join('')}</table></div>`
      :`<div class="empty" style="padding:22px"><b>No data yet</b>Numbers show up as the team uses the system.</div>`}</div>

    <div class="card flush"><div class="chead"><h2>Sheet size</h2><span class="muted" style="font-size:13px">Google limit: 10 million cells per sheet</span></div>
      <div style="padding:14px 20px;display:grid;gap:14px">${H.books.map(b=>{ const lv=b.pct>=H.limits.size[1]?'red':b.pct>=H.limits.size[0]?'yellow':'green';
        return `<div><div style="display:flex;gap:8px;align-items:baseline"><b>${esc(b.label)}</b><span class="spacer"></span><span>${b.pct}%</span><span class="muted" style="font-size:12px">${fmtN(b.cells)} cells</span></div>
        <div style="height:8px;background:var(--line2);border-radius:99px;margin:6px 0;overflow:hidden"><div style="height:100%;width:${Math.min(100,Math.max(1,b.pct))}%;background:${barCol[lv]}"></div></div>
        <div class="muted" style="font-size:12px">${b.tabs.map(t=>esc(t.name)+' '+fmtN(t.rows)+' rows').join(' · ')}</div></div>`; }).join('')}</div></div>
  </div>

  <div class="card flush"><div class="chead"><h2>Last 7 days</h2></div>
    <div class="tbl-wrap" style="border:0"><table><tr><th>Day</th><th>Requests</th><th>Writes</th><th>p95</th><th>Server errors</th><th>Failed on devices</th></tr>
    ${H.days.slice().reverse().map(d=>`<tr><td>${esc(d.date)}</td><td>${fmtN(d.n)}</td><td>${fmtN(d.w)}</td><td>${d.n?fmtMs(d.p95):'—'}</td><td>${d.e||'—'}</td><td>${d.cf||'—'}</td></tr>`).join('')}</table></div></div>
  <div class="muted" style="font-size:12.5px">Numbers are collected in memory and saved to the "System Health" tab once an hour. The current hour is live.</div>
  </div>`;
}
