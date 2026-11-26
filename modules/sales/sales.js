/* ============ Sales · المقانيص (المرحلة 1، 2026-11-26) ============
   Sales Home (الأرقام والتارجت) · My Queue (طابور العيش: ليد واحد في المرة، القفل من السيرفر) · My Pipeline
   · Sales Meetings · Data Center (رفع الداتا والمراجعة والبحث) · Command Center (مدير المبيعات) · Sales Settings.
   كل الأسماء هنا بتبدأ بـ sx عشان متتخبطش مع حاجة تانية في السيستم. */
S.sx={meta:null,metaAt:0,per:'today',pipeTab:'deals',dataTab:'batches',meetF:'up',mf:{}};
function sxF(){ return srvFlag('sales')||null; }
async function sxMeta(force){
  if(!force&&S.sx.meta&&Date.now()-S.sx.metaAt<120000) return S.sx.meta;
  const m=await call('salesMeta'); S.sx.meta=m; S.sx.metaAt=Date.now(); return m;
}
const sxN=n=>Number(n||0).toLocaleString('en-US',{maximumFractionDigits:1});
const sxMoney=(n,c)=>sxN(Math.round(Number(n)||0))+' '+(c||(S.sx.meta&&S.sx.meta.cfg.currency)||'SAR');
function sxDT(ms){ if(!ms) return '—'; const d=new Date(Number(ms)); return d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})+' · '+d.toLocaleTimeString('en-GB',{hour:'numeric',minute:'2-digit',hour12:true}); }
function sxDay(s){ if(!s) return '—'; const d=new Date(s+'T12:00:00'); return isNaN(d)?s:d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}); }
function sxT12(t){ const m=/^(\d{1,2}):(\d{2})/.exec(t||''); if(!m) return t||''; let h=+m[1]; const ap=h>=12?'PM':'AM'; h=h%12||12; return h+':'+m[2]+' '+ap; }
const SX_ST={pool:['In pool','p-out'],assigned:['New','p-prog'],active:['In progress','p-run'],meeting:['Meeting','p-yel'],deal:['Deal','p-prog'],won:['Won','p-in'],lost:['Lost','p-bad'],invalid:['Bad data','p-na'],dnc:['Do not contact','p-bad'],nurture:['Nurturing','p-out']};
const SX_MP={pending:'p-absent',accepted:'p-prog',held:'p-run',qualified:'p-in',unqualified:'p-bad',rejected:'p-bad',cancelled:'p-na',cust_noshow:'p-out',sales_noshow:'p-bad'};
const sxSt=s=>{ const x=SX_ST[s]||[s||'—','p-out']; return `<span class="pill ${x[1]}">${esc(x[0])}</span>`; };
const sxOpts=(L,v,blank)=>(blank!=null?`<option value="">${esc(blank)}</option>`:'')+(L||[]).map(x=>{ const k=typeof x==='object'?x.u:x, l=typeof x==='object'?x.name:x; return `<option value="${esc(k)}"${String(k)===String(v)?' selected':''}>${esc(l)}</option>`; }).join('');
const sxK=(label,val,sub,color)=>`<div class="kpi"><span>${esc(label)}</span><b${color?` style="color:${color}"`:''}>${val}</b>${sub?`<small>${sub}</small>`:''}</div>`;
function sxBar(v,t,label){ if(!t) return ''; const p=Math.min(100,Math.round(v/t*100)); return `<div class="sx-bar"><div class="sx-bar-h"><span>${esc(label)}</span><b>${sxN(v)} / ${sxN(t)}</b></div><div class="sx-track"><i style="width:${p}%;${p>=100?'background:var(--ok)':''}"></i></div></div>`; }
function sxErr(e){ toast(e&&e.message||String(e)); }
function sxBusy(b,t){ if(!b) return ()=>{}; const o=b.textContent; b.disabled=true; b.textContent=t||'...'; return ()=>{ b.disabled=false; b.textContent=o; }; }

/* ================= Sales Home ================= */
function viewSxHome(){
  setTop('Sales Home','Where you stand today, this week, this month and this quarter');
  swr('sxh','salesHome',{},sxHomeRender);
}
function sxHomeRender(H){
  if(H.scr) return sxScrHome(H);
  const P=H.per[S.sx.per]||H.per.today, T=H.target, M=H.per.month, F=sxF()||{};
  const per=[['today','Today'],['week','This week'],['month','This month'],['quarter','This quarter']];
  const revPct=T.rev?Math.round(M.revenue/T.rev*100):null, qPct=T.qual?Math.round(M.qualified/T.qual*100):null;
  const hello=revPct!=null?`You're at <b>${revPct}%</b> of your revenue target this month.`:qPct!=null?`You're at <b>${qPct}%</b> of your qualified meetings target this month.`:`Let's make today count.`;
  const isScr=H.kind==='scraper';
  $('main').innerHTML=`
  <div class="sx-hello"><div><h2>Hi ${esc((H.name||'').split(' ')[0])} 👋</h2><p>${hello}</p></div>
    <div class="sx-hello-a">${F.work&&!isScr?`<button class="btn primary" onclick="go('slq')">▶ Start my queue <em class="muted" style="font-style:normal;color:inherit;opacity:.8">· ${H.queue.left} waiting</em></button>`:''}${F.data?`<button class="btn" onclick="go('sld')">Data Center</button>`:''}</div></div>
  ${H.gaps.length?`<div class="sx-gaps">${H.gaps.map(g=>`<div class="sx-gap"><b>${g.k==='rev'?sxMoney(g.left,H.currency):sxN(g.left)}</b><span>${esc(g.label)}</span></div>`).join('')}</div>`:''}
  <div class="chips" style="margin:6px 0 14px">${per.map(x=>`<button class="${S.sx.per===x[0]?'on':''}" onclick="S.sx.per='${x[0]}';sxHomeRender(S.cache.sxh)">${x[1]}</button>`).join('')}</div>
  <div class="grid kpis">
    ${sxK('Calls',sxN(P.calls),P.leads+' leads worked')}
    ${sxK('Meetings booked',sxN(P.booked),P.accepted+' accepted')}
    ${sxK('Qualified meetings',sxN(P.qualified),'','var(--ok)')}
    ${sxK('Quotations',sxN(P.quotes),P.opps+' new deals')}
    ${sxK('Deals won',sxN(P.won),P.wonFromMe?P.wonFromMe+' from meetings you booked':'')}
    ${sxK('Revenue',sxMoney(P.revenue,H.currency),P.avgDeal?'Avg deal '+sxMoney(P.avgDeal,H.currency):'','var(--brand2)')}
    ${sxK('Conversion',P.conv+'%','meetings / calls')}
    ${sxK('Self-generated',sxN(P.self),P.skips?P.skips+' skips':'')}
  </div>
  <div class="sx-2col">
    <div class="card"><h3 style="margin:0 0 12px">Targets</h3>
      ${sxBar(H.per.today.calls,T.calls,'Calls today')}
      ${sxBar(H.per.week.booked,T.mtg,'Meetings this week')}
      ${sxBar(M.qualified,T.qual,'Qualified meetings this month')}
      ${sxBar(M.won,T.deals,'Deals this month')}
      ${sxBar(M.revenue,T.rev,'Revenue this month ('+(H.currency||'SAR')+')')}
      ${!T.calls&&!T.mtg&&!T.qual&&!T.rev&&!T.deals?'<div class="muted">No targets yet. The Sales Manager sets them in Sales Settings.</div>':''}
      <div class="muted" style="margin-top:10px;font-size:12.5px">Open pipeline: <b>${H.pipeline.count}</b> deals · <b>${sxMoney(H.pipeline.value,H.currency)}</b></div>
    </div>
    <div class="card flush"><div class="chead"><h2>Upcoming meetings</h2><button class="btn small ghost" onclick="go('slm')">All</button></div>
      ${H.upcoming.length?H.upcoming.map(sxMtRow).join(''):`<div class="empty"><b>No meetings coming up</b>Book one from your queue.</div>`}</div>
  </div>`;
}

/* ----- Sales Home بتاعة الـ Data Scraper: الداتا اللي رفعها ونتيجتها ----- */
function sxScrHome(H){
  const X=H.scr, P=X.per[S.sx.per]||X.per.today, M=X.per.month, T=H.target;
  const per=[['today','Today'],['week','This week'],['month','This month'],['quarter','This quarter']];
  const pct=T.data?Math.round(M.approved/T.data*100):null;
  const hello=pct!=null?`You're at <b>${pct}%</b> of your approved-data target this month.`:`${sxN(M.approved)} of your leads were approved this month.`;
  const gaps=[];
  if(T.data&&M.approved<T.data) gaps.push(`<div class="sx-gap"><b>${sxN(T.data-M.approved)}</b><span>approved leads left to hit your monthly target</span></div>`);
  if(X.stock.days!=null&&X.stock.days<5) gaps.push(`<div class="sx-gap"><b>${X.stock.days} ${X.stock.days===1?"day":"days"}</b><span>of data left for the team (${sxN(X.stock.pool)} leads, they use ${sxN(X.stock.daily)} a day)</span></div>`);
  if(X.returned) gaps.push(`<div class="sx-gap"><b>${X.returned}</b><span>${X.returned===1?'batch was':'batches were'} returned to you for fixing</span></div>`);
  $('main').innerHTML=`
  <div class="sx-hello"><div><h2>Hi ${esc((H.name||'').split(' ')[0])} 👋</h2><p>${hello}</p></div>
    <div class="sx-hello-a"><button class="btn primary" onclick="S.sx.dataTab='upload';go('sld')">⬆ Upload data</button><button class="btn" onclick="S.sx.dataTab='batches';go('sld')">My batches${X.waiting?` <em class="muted" style="font-style:normal;color:inherit;opacity:.8">· ${X.waiting} in review</em>`:''}</button></div></div>
  ${gaps.length?`<div class="sx-gaps">${gaps.join('')}</div>`:''}
  <div class="chips" style="margin:6px 0 14px">${per.map(x=>`<button class="${S.sx.per===x[0]?'on':''}" onclick="S.sx.per='${x[0]}';sxHomeRender(S.cache.sxh)">${x[1]}</button>`).join('')}</div>
  <div class="grid kpis">
    ${sxK('Uploaded',sxN(P.uploaded),P.batches+' batches')}
    ${sxK('Approved',sxN(P.approved),P.rejected?P.rejected+' rejected':'','var(--ok)')}
    ${sxK('Flagged by checks',P.flagRate+'%','duplicates, wrong numbers, missing',P.flagRate>20?'var(--bad)':'')}
    ${sxK('Valid contacts',P.validRate+'%','not marked bad data by the team')}
    ${sxK('Calls on your data',sxN(P.worked),'')}
    ${sxK('Meetings from your data',sxN(P.meetings),P.qualified+' qualified')}
    ${sxK('Deals from your data',sxN(P.deals),'shared result with sales')}
    ${sxK('Revenue from your data',sxMoney(P.revenue,H.currency),'shared result with sales','var(--brand2)')}
  </div>
  <div class="sx-2col">
    <div class="card"><h3 style="margin:0 0 12px">Targets</h3>
      ${sxBar(M.approved,T.data,'Approved leads this month')}
      ${!T.data?'<div class="muted">No target yet. The Sales Manager sets it in Sales Settings.</div>':''}
      <div class="muted" style="margin-top:10px;font-size:12.5px">Data stock for the team: <b>${sxN(X.stock.pool)}</b> leads${X.stock.days!=null?' · about <b>'+X.stock.days+'</b> days':''}</div></div>
    <div class="card flush"><div class="chead"><h2>My data tasks</h2><button class="btn small ghost" onclick="S.sx.dataTab='tasks';go('sld')">All</button></div>
      ${X.tasks.length?X.tasks.map(t=>`<div class="al" style="cursor:default"><span class="tx"><b dir="auto">${bd(t.title)}</b><span>${t.qty?t.got+' / '+t.qty+' approved · ':''}${esc([t.sector,t.platform,t.city].filter(Boolean).join(' · '))}${t.due?' · due '+fmtD(t.due):''} · from ${esc(t.byName)}</span>${t.qty?`<div class="sx-track" style="margin-top:6px;max-width:320px"><i style="width:${Math.min(100,Math.round(t.got/t.qty*100))}%"></i></div>`:''}</span></div>`).join(''):`<div class="empty"><b>No open data tasks</b>Tasks from the Sales Manager show up here.</div>`}</div>
  </div>`;
}

/* ================= My Queue (طابور العيش) ================= */
function viewSxQueue(){
  setTop('My Queue','One lead at a time · Submit & Next',`<button class="btn" onclick="sxSelfAdd()">+ Lead I found</button>`);
  $('main').innerHTML=LOADING;
  const vt=S.vt;
  Promise.all([sxMeta(),call('salesNext')]).then(([m,r])=>{ if(S.vt!==vt) return; sxQRender(r); }).catch(e=>{ if(S.vt===vt) $('main').innerHTML=`<div class="card err">${esc(e.message)}</div>`; });
}
function sxQStrip(r){
  const q=r.queue, t=r.today, me=(S.cache.sxh&&S.cache.sxh.target)||{};
  return `<div class="sx-strip"><span><b>${q.left}</b> waiting now</span><span>${q.fresh} new</span><span>${q.followups} follow-ups due</span><span>${q.retries} retries</span>${q.later?`<span class="muted">${q.later} later</span>`:''}<span class="spacer"></span><span>Calls today <b>${t.calls}${me.calls?' / '+me.calls:''}</b></span><span>Skips <b>${t.skips}</b></span></div>`;
}
function sxQRender(r){
  S.sx.cur=r.lead; S.sx.res='';
  if(!r.lead){ $('main').innerHTML=sxQStrip(r)+`<div class="card" style="text-align:center;padding:40px 20px"><div style="font-size:40px">🎉</div><h2 style="margin:8px 0">Your queue is empty</h2><p class="muted">${r.queue.later?r.queue.later+' leads come back later (retries and follow-ups).':'Ask the Sales Manager for more data, or add a lead you found.'}</p><button class="btn" onclick="sxSelfAdd()">+ Lead I found</button></div>`; return; }
  const L=r.lead, M=S.sx.meta, wa=L.phone?String(L.phone).replace(/\D/g,''):'';
  const R=M.cfg.results.filter(x=>x.on!==false);
  $('main').innerHTML=sxQStrip(r)+`
  <div class="sx-lead card">
    <div class="sx-lh"><div style="flex:1;min-width:0"><h2 dir="auto">${bd(L.store)}</h2>
      <div class="sx-tags">${sxSt(L.status)}${L.sector?`<span class="pill p-out">${esc(L.sector)}</span>`:''}${L.platform?`<span class="pill p-out">${esc(L.platform)}</span>`:''}${L.city?`<span class="pill p-out">${esc(L.city)}</span>`:''}${L.source==='self'?'<span class="pill p-yel">Found by you</span>':''}${L.attempts?`<span class="pill p-run">Try ${L.attempts+1}</span>`:''}${L.lastRes?`<span class="muted" style="font-size:12.5px">Last: ${esc(sxResName(L.lastRes))} · ${sxDT(L.lastAt)}</span>`:''}</div></div>
      <button class="btn small ghost" onclick="sxOpen('${esc(L.id)}')">Merchant 360</button></div>
    <div class="sx-contact">
      ${L.phone?`<a class="sx-call" href="tel:+${esc(wa)}">📞 +${esc(wa)}</a><a class="btn small" target="_blank" rel="noopener" href="https://wa.me/${esc(wa)}">WhatsApp</a>`:''}
      ${L.url?`<a class="btn small" target="_blank" rel="noopener" href="${esc(/^https?:/i.test(L.url)?L.url:'https://'+L.url)}">Open store ↗</a>`:''}
      ${L.social?`<span class="muted">${bd(L.social)}</span>`:''}${L.email?`<span class="muted">${esc(L.email)}</span>`:''}
    </div>
    <div class="sx-info">${[['Decision maker',L.contact],['Size',L.size],['Products',L.products],['Need',L.need],['Service',L.service],['Next step',L.next],['Notes',L.notes],['Second phone',L.phone2]].filter(x=>x[1]).map(x=>`<div><span>${x[0]}</span><b dir="auto">${bd(x[1])}</b></div>`).join('')||'<div class="muted">No more details yet. Add what you learn in the call.</div>'}</div>
    ${L.history.length?`<details class="sx-hist"><summary>History · ${L.history.length}</summary>${L.history.map(sxHistRow).join('')}</details>`:''}
    <h3 style="margin:18px 0 8px">How did the call go?</h3>
    <div class="sx-res">${R.map(x=>`<button type="button" data-k="${esc(x.k)}" onclick="sxPick('${esc(x.k)}')">${esc(x.l)}</button>`).join('')}</div>
    <div id="sxFields"></div>
    <div class="err sx-e" id="sxErr"></div>
    <div class="mfoot"><button class="btn ghost" onclick="sxSkipAsk()">Skip</button><span class="spacer"></span><button class="btn primary" id="sxGo" onclick="sxSubmit()" disabled>Submit & Next →</button></div>
  </div>`;
}
function sxResName(k){ const r=((S.sx.meta||{}).cfg||{results:[]}).results.find(x=>x.k===k); return r?r.l:k; }
const SX_KIND={call:'Call',skip:'Skipped',assign:'Assigned',reassign:'Reassigned',recycle:'Back to pool',meeting:'Meeting',mstatus:'Meeting update',opp:'Deal',stage:'Deal stage',edit:'Edited',import:'Approved from batch',self_add:'Added as self-generated',self_dup:'Tried to add as self-generated',attrib:'Attribution changed'};
function sxHistRow(h){
  const d=h.data||{}, extra=[d.need&&'Need: '+d.need,d.service&&'Service: '+d.service,d.next&&'Next: '+d.next,d.when&&'Follow-up: '+d.when].filter(Boolean).join(' · ');
  return `<div class="sx-hr"><span class="muted">${sxDT(h.at)}</span><b>${esc(SX_KIND[h.kind]||h.kind)}${h.kind==='call'?': '+esc(sxResName(h.res)):h.kind==='mstatus'?': '+esc((S.sx.meta&&S.sx.meta.mtStatus[h.res])||h.res):h.res&&(h.kind==='stage'||h.kind==='opp')?': '+esc(h.res):''}</b><span>${esc(h.name)}</span>${h.note||extra?`<div class="muted" dir="auto">${bd([h.note,extra].filter(Boolean).join(' · '))}</div>`:''}</div>`;
}
function sxPick(k){
  const M=S.sx.meta, r=M.cfg.results.find(x=>x.k===k); if(!r) return; S.sx.res=k;
  document.querySelectorAll('.sx-res button').forEach(b=>b.classList.toggle('on',b.dataset.k===k));
  const L=S.sx.cur||{}, f=r.f||[], tom=new Date(Date.now()+864e5).toISOString().slice(0,10);
  let h='';
  if(f.indexOf('need')>=0) h+=`<label for="sxNeed">What does the merchant need?</label><input id="sxNeed" dir="auto" value="${esc(L.need||'')}">`;
  if(f.indexOf('service')>=0) h+=`<label for="sxSvc">Service that fits</label><select id="sxSvc">${sxOpts(M.cfg.services,L.service,'—')}</select>`;
  if(f.indexOf('next')>=0) h+=`<label for="sxNext">Next step</label><input id="sxNext" dir="auto" value="${esc(L.next||'')}">`;
  if(f.indexOf('when')>=0||r.act==='followup') h+=`<div class="row"><div><label for="sxWhen">Follow-up on</label><input type="date" id="sxWhen" value="${tom}"></div><div><label for="sxWhenT">Time</label><input type="time" id="sxWhenT" value="11:00"></div></div>`;
  if(f.indexOf('reason')>=0||r.act==='close') h+=`<label for="sxWhy">Reason</label><select id="sxWhy">${sxOpts(M.cfg.lost_reasons,'','Pick a reason')}</select>`;
  if(r.act==='meeting') h+=sxBookFields(L.need,f.indexOf('need')>=0);
  if(f.indexOf('note')>=0||true) h+=`<label for="sxNote">Note <span class="muted" style="font-weight:400">· optional</span></label><textarea id="sxNote" rows="2" dir="auto" maxlength="500"></textarea>`;
  if(r.act==='retry') h=`<div class="notice" style="margin-top:10px">The system will bring this lead back later by itself. You go on to the next one.</div>`+h;
  if(r.act==='dnc') h=`<div class="notice" style="margin-top:10px;border-color:var(--bad)">This merchant will never be given to anyone again.</div>`+h;
  $('sxFields').innerHTML=h; $('sxGo').disabled=false; $('sxErr').textContent='';
}
function sxBookFields(need,noNeed){
  const M=S.sx.meta, tom=new Date(Date.now()+864e5).toISOString().slice(0,10);
  const sellers=M.sellers.filter(s=>s.kind!=='tele'||s.u===S.user.username);
  return `<div class="sx-book"><div class="muted" style="font-size:12.5px;margin-bottom:4px">Meeting · the sales gets notified and must accept</div>
    <div class="row"><div><label for="sxMS">Sales in charge</label><select id="sxMS">${sxOpts(sellers.length?sellers:M.sellers,'','Pick the sales')}</select></div><div><label for="sxMD">Date</label><input type="date" id="sxMD" value="${tom}"></div><div><label for="sxMT">Time</label><input type="time" id="sxMT" value="12:00"></div><div><label for="sxMDur">Minutes</label><input type="number" id="sxMDur" min="15" max="240" step="15" value="${M.cfg.meet_min||45}"></div></div>
    <label for="sxML">Meeting link <span class="muted" style="font-weight:400">· optional</span></label><input id="sxML" placeholder="https://meet.google.com/...">
    <label for="sxMB">Brief for the sales</label><textarea id="sxMB" rows="2" dir="auto" maxlength="2000"></textarea>
    ${noNeed?'':`<label for="sxMN">Need</label><input id="sxMN" dir="auto" value="${esc(need||'')}">`}
    <label>Other people in the meeting <span class="muted" style="font-weight:400">· manager, technical, management</span></label>
    <div class="sx-ppl">${M.people.filter(p=>p.u!==S.user.username).map(p=>`<label class="check"><input type="checkbox" class="sxPp" value="${esc(p.u)}">${esc(p.name)}</label>`).join('')}</div></div>`;
}
function sxBookRead(){ return {sales:$('sxMS').value,date:$('sxMD').value,time:$('sxMT').value,dur:Number($('sxMDur').value)||0,link:$('sxML').value.trim(),brief:$('sxMB').value.trim(),need:($('sxMN')||$('sxNeed')||{value:''}).value.trim(),parts:[...document.querySelectorAll('.sxPp:checked')].map(x=>x.value)}; }
async function sxSubmit(){
  const L=S.sx.cur, k=S.sx.res; if(!L||!k) return;
  const M=S.sx.meta, r=M.cfg.results.find(x=>x.k===k), v=id=>$(id)?$(id).value.trim():'';
  const fields={need:v('sxNeed')||v('sxMN'),service:v('sxSvc'),next:v('sxNext'),when:v('sxWhen'),whenTime:v('sxWhenT'),reason:v('sxWhy'),note:v('sxNote')};
  const p={id:L.id,res:k,fields};
  if(r.act==='meeting'){ p.meeting=sxBookRead(); if(!p.meeting.sales){ $('sxErr').textContent='اختار السيلز المسؤول'; return; } }
  if(r.act==='close'&&!fields.reason){ $('sxErr').textContent='اختار السبب'; return; }
  const done=sxBusy($('sxGo'),'Saving...');
  try{ const out=await call('salesSubmit',p); if(out.booked) toast('اتحجز الاجتماع ✓ السيلز هيوصله إشعار'); S.cache.sxh=null; sxQRender(out); window.scrollTo(0,0); }
  catch(e){ done(); $('sxErr').textContent=e.message; }
}
function sxSkipAsk(){
  const M=S.sx.meta, L=S.sx.cur; if(!L) return;
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:440px"><h2>Skip this lead</h2>
    <p class="muted">Only for real exceptions. The Sales Manager sees every skip. Max ${M.cfg.skip_max} a day.</p>
    <label for="sxSkR">Reason</label><select id="sxSkR">${sxOpts(M.cfg.skip_reasons,'','Pick a reason')}</select>
    <label for="sxSkN">Note</label><input id="sxSkN" dir="auto" maxlength="200"><div class="err sx-e" id="sxSkE"></div>
    <div class="mfoot"><button class="btn ghost" onclick="closeModal()">Cancel</button><span class="spacer"></span><button class="btn primary" id="sxSkB" onclick="sxSkip()">Skip</button></div></div></div>`;
}
async function sxSkip(){
  const reason=$('sxSkR').value; if(!reason){ $('sxSkE').textContent='اختار السبب'; return; }
  const done=sxBusy($('sxSkB'));
  try{ const r=await call('salesSkip',{id:S.sx.cur.id,reason,note:$('sxSkN').value}); closeModal(); sxQRender(r); }catch(e){ done(); $('sxSkE').textContent=e.message; }
}
async function sxSelfAdd(){
  let M; try{ M=await sxMeta(); }catch(e){ return sxErr(e); }
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:560px"><h2>Lead I found myself</h2>
    <p class="muted" style="margin-top:0">It is checked against all company data first. If the merchant already exists it can't be added as yours.</p>
    <label for="sfS">Store name</label><input id="sfS" dir="auto">
    <div class="row"><div><label for="sfP">Phone</label><input id="sfP" placeholder="05xxxxxxxx" inputmode="tel"></div><div><label for="sfU">Store link</label><input id="sfU" placeholder="https://"></div></div>
    <div class="row"><div><label for="sfSec">Sector</label><select id="sfSec">${sxOpts(M.cfg.sectors,'','—')}</select></div><div><label for="sfPl">Platform</label><select id="sfPl">${sxOpts(M.cfg.platforms,'','—')}</select></div><div><label for="sfC">City</label><select id="sfC">${sxOpts(M.cfg.cities,'','—')}</select></div></div>
    <div class="row"><div><label for="sfCt">Decision maker</label><input id="sfCt" dir="auto"></div><div><label for="sfO">Where did you find it?</label><select id="sfO">${sxOpts(M.cfg.sources,'Direct Sales')}</select></div></div>
    <label for="sfN">Notes</label><textarea id="sfN" rows="2" dir="auto"></textarea><div class="err sx-e" id="sfE"></div>
    <div class="mfoot"><button class="btn ghost" onclick="closeModal()">Cancel</button><span class="spacer"></span><button class="btn primary" id="sfB" onclick="sxSelfSave()">Check & add</button></div></div></div>`;
}
async function sxSelfSave(){
  const v=id=>$(id).value.trim(), done=sxBusy($('sfB'),'Checking...');
  try{ await call('salesSelfAdd',{lead:{store:v('sfS'),phone:v('sfP'),url:v('sfU'),sector:v('sfSec'),platform:v('sfPl'),city:v('sfC'),contact:v('sfCt'),notes:v('sfN'),origin:v('sfO')}});
    closeModal(); toast('اتضاف ✓ وهيظهرلك في الطابور'); if(S.view==='slq') viewSxQueue(); }
  catch(e){ done(); $('sfE').textContent=e.message; }
}

/* ================= My Pipeline ================= */
function viewSxPipe(){
  setTop('My Pipeline','Follow-ups, deals and the leads you worked on');
  const vt=S.vt;
  sxMeta().then(()=>{ if(S.vt===vt) swr('sxp','salesMine',{},sxPipeRender); }).catch(e=>{ $('main').innerHTML=`<div class="card err">${esc(e.message)}</div>`; });
}
function sxPipeRender(D){
  const M=S.sx.meta, tab=S.sx.pipeTab, now=Date.now();
  const tabs=[['deals','Deals',D.opps.filter(o=>o.stage!=='Closed-Won'&&M.outcomes.indexOf(o.stage)<0).length],['fu','Follow-ups',D.followups.length],['meet','Meetings',D.meetings.length],['leads','All my leads',D.leads.length]];
  let body='';
  if(tab==='deals'){
    const cols=M.cfg.stages.map(s=>s.n).concat(M.outcomes);
    body=D.opps.length?`<div class="sx-kan">${cols.map(c=>{ const L=D.opps.filter(o=>o.stage===c); if(!L.length&&M.outcomes.indexOf(c)>=0) return ''; return `<div class="sx-col"><div class="sx-colh"><b>${esc(c)}</b><span>${L.length}${L.length?' · '+sxMoney(L.reduce((a,o)=>a+o.value,0)):''}</span></div>${L.map(o=>`<button class="sx-card" onclick="sxOpp('${esc(o.id)}')"><b dir="auto">${bd(o.store)}</b><span>${o.value?sxMoney(o.value,o.cur):'No value yet'}</span>${o.close?`<small class="muted">Close ${fmtD(o.close)}</small>`:''}${o.teleName?`<small class="muted">Booked by ${esc(o.teleName)}</small>`:''}</button>`).join('')}</div>`; }).join('')}</div>`:`<div class="card empty"><b>No deals yet</b>A deal opens by itself when a meeting is marked qualified, or from Merchant 360 → + Deal.</div>`;
  } else if(tab==='fu'){
    body=`<div class="card flush">${D.followups.length?D.followups.map(m=>`<button class="al" onclick="sxOpen('${esc(m.id)}')"><span class="tx"><b dir="auto">${bd(m.store)}</b><span>${esc(sxResName(m.lastRes))} · last ${sxDT(m.lastAt)}</span></span><span class="pill ${m.nextAt&&m.nextAt<now?'p-bad':'p-prog'}">${m.nextAt?sxDT(m.nextAt):'—'}</span></button>`).join(''):`<div class="empty"><b>No follow-ups</b>They come back in your queue on their date by themselves.</div>`}</div>`;
  } else if(tab==='meet'){
    body=`<div class="card flush">${D.meetings.length?D.meetings.map(sxMtRow).join(''):`<div class="empty"><b>No meetings</b></div>`}</div>`;
  } else {
    body=`<div class="tbl-wrap"><table><tr><th>Store</th><th>Status</th><th>Last result</th><th>Updated</th></tr>${D.leads.map(m=>`<tr onclick="sxOpen('${esc(m.id)}')" style="cursor:pointer"><td dir="auto"><b>${bd(m.store)}</b><div class="muted" style="font-size:12px">${esc([m.sector,m.platform,m.city].filter(Boolean).join(' · '))}</div></td><td>${sxSt(m.status)}</td><td>${esc(sxResName(m.lastRes)||'—')}</td><td class="muted">${sxDT(m.updated)}</td></tr>`).join('')||'<tr><td colspan="4" class="muted">Nothing yet</td></tr>'}</table></div>`;
  }
  $('main').innerHTML=`<div class="chips" style="margin-bottom:14px">${tabs.map(t=>`<button class="${tab===t[0]?'on':''}" onclick="S.sx.pipeTab='${t[0]}';sxPipeRender(S.cache.sxp)">${t[1]} <em class="muted">${t[2]}</em></button>`).join('')}</div>${body}`;
}
async function sxPipeReload(){ try{ const r=await call('salesMine'); S.cache.sxp=r; if(S.view==='slp') sxPipeRender(r); }catch(e){} }

/* ----- Deal (Opportunity) ----- */
function sxOppFind(id){ const all=[].concat((S.cache.sxp||{}).opps||[],(S.sx.m360||{}).opps||[]); return all.find(o=>o.id===id); }
async function sxOpp(id,o){
  let M; try{ M=await sxMeta(); }catch(e){ return sxErr(e); }
  o=o||sxOppFind(id); if(!o) return toast('الفرصة دي مش موجودة');
  S.sx.opp=o; const d=o.data||{};
  const st=M.cfg.stages.map(s=>s.n), ix=st.indexOf(o.stage), nxt=ix>=0&&ix<st.length-1?st[ix+1]:'';
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:720px">
    <div style="display:flex;gap:10px;align-items:flex-start"><div style="flex:1"><h2 style="margin:0" dir="auto">${bd(o.store)}</h2><div class="muted" style="margin-top:4px">${esc(o.ownerName)} · ${esc(o.stage)} · ${o.prob}% likely</div></div><button class="btn small ghost" onclick="sxOpen('${esc(o.m)}')">Merchant 360</button><button class="iconbtn" onclick="closeModal()" aria-label="Close">✕</button></div>
    <div class="sx-steps">${st.map((s,i)=>`<span class="${i<ix||o.stage==='Closed-Won'?'done':i===ix?'on':''}">${esc(s)}</span>`).join('')}</div>
    <div class="row"><div><label for="opV">Deal value</label><input id="opV" type="number" min="0" value="${o.value||''}"></div><div><label for="opC">Currency</label><select id="opC">${sxOpts(['SAR','EGP','USD'],o.cur)}</select></div><div><label for="opCl">Expected close</label><input id="opCl" type="date" value="${esc(o.close||'')}"></div></div>
    <label>Services</label><div class="sx-ppl" style="max-height:none">${M.cfg.services.map(s=>`<label class="check"><input type="checkbox" class="opSv" value="${esc(s)}"${o.services.indexOf(s)>=0?' checked':''}>${esc(s)}</label>`).join('')}</div>
    <label for="opN">Customer need</label><input id="opN" dir="auto" value="${esc(d.need||'')}">
    <div class="row"><div><label for="opA">Pre-Sales Audit link <span class="muted" style="font-weight:400">· Google Doc / Slides</span></label><input id="opA" value="${esc(d.audit||'')}" placeholder="https://"></div><div><label for="opQ">Quotation link</label><input id="opQ" value="${esc(d.quote||'')}" placeholder="https://"></div></div>
    <div class="row"><div><label for="opK">Contract link</label><input id="opK" value="${esc(d.contract||'')}" placeholder="https://"></div><div><label for="opP">Amount paid</label><input id="opP" type="number" min="0" value="${d.paid||''}"></div></div>
    <label for="opNo">Notes</label><textarea id="opNo" rows="2" dir="auto">${esc(d.notes||'')}</textarea>
    <div class="err sx-e" id="opE"></div>
    <div class="mfoot" style="flex-wrap:wrap"><button class="btn" id="opSB" onclick="sxOppSave()">Save</button><span class="spacer"></span>
      ${o.stage!=='Closed-Won'?`<select id="opSt" style="width:auto">${st.concat(M.outcomes).filter(s=>s!==o.stage).map(s=>`<option${s===nxt?' selected':''}>${esc(s)}</option>`).join('')}</select><button class="btn primary" id="opMB" onclick="sxOppMove()">Move</button>`:'<span class="pill p-in">Won 🎉</span>'}</div>
    <div id="opLost" class="hidden" style="margin-top:8px"><label for="opLR">Why did we lose it?</label><select id="opLR">${sxOpts(M.cfg.lost_reasons,'','Pick a reason')}</select></div>
    ${o.hist&&o.hist.length?`<details class="sx-hist" style="margin-top:12px"><summary>Stage history</summary>${o.hist.map(h=>`<div class="sx-hr"><span class="muted">${sxDT(h.at)}</span><b>${esc(h.f?h.f+' → ':'')}${esc(h.s)}</b><span>${esc(h.u)}</span></div>`).join('')}</details>`:''}
  </div></div>`;
  const sel=$('opSt'); if(sel) sel.onchange=()=>$('opLost').classList.toggle('hidden',sel.value!=='Closed-Lost');
}
function sxOppRead(){ return {id:S.sx.opp.id,value:Number($('opV').value)||0,cur:$('opC').value,close:$('opCl').value,services:[...document.querySelectorAll('.opSv:checked')].map(x=>x.value),need:$('opN').value,audit:$('opA').value.trim(),quote:$('opQ').value.trim(),contract:$('opK').value.trim(),paid:Number($('opP').value)||0,notes:$('opNo').value}; }
async function sxOppSave(silent){
  const done=sxBusy($('opSB'),'Saving...');
  try{ const o=await call('salesOppSave',{opp:sxOppRead()}); S.sx.opp=o; done(); if(!silent){ toast('اتحفظ ✓'); sxOpp(o.id,o); } sxPipeReload(); return o; }catch(e){ done(); $('opE').textContent=e.message; throw e; }
}
async function sxOppMove(){
  const stage=$('opSt').value, lost=$('opLR')?$('opLR').value:'';
  if(stage==='Closed-Lost'&&!lost){ $('opLost').classList.remove('hidden'); $('opE').textContent='اختار سبب الخسارة'; return; }
  try{ await sxOppSave(true); }catch(e){ return; }
  const done=sxBusy($('opMB'));
  try{ const o=await call('salesOppStage',{id:S.sx.opp.id,stage,lost}); toast(stage==='Closed-Won'?'🎉 مبروك! الصفقة اتقفلت':'اتنقلت لـ '+stage+' ✓'); S.cache.sxh=null; sxPipeReload(); sxOpp(o.id,o); }
  catch(e){ done(); $('opE').textContent=e.message; }
}

/* ================= Sales Meetings ================= */
function viewSxMeet(opts){
  setTop('Sales Meetings','Booked → Accepted → Held → Qualified');
  const vt=S.vt;
  sxMeta().then(()=>{ if(S.vt!==vt) return; swr('sxm','salesMeetings',{},L=>{ sxMeetRender(L); if(opts&&opts.id){ const id=opts.id; opts.id=null; sxMt(id); } }); }).catch(e=>{ $('main').innerHTML=`<div class="card err">${esc(e.message)}</div>`; });
}
function sxMtRow(x){
  const d=new Date((x.date||'')+'T12:00:00');
  return `<button class="al" onclick="sxMt('${esc(x.id)}')"><span class="sx-date"><small>${isNaN(d)?'':d.toLocaleDateString('en-GB',{month:'short'})}</small><b>${isNaN(d)?'—':d.getDate()}</b></span>
    <span class="tx"><b dir="auto">${bd(x.store||'')}</b><span>${esc(sxT12(x.time))} · ${esc(x.salesName)} · booked by ${esc(x.byName)}${x.parts.length?' · +'+x.parts.length:''}</span></span>
    <span class="pill ${SX_MP[x.status]||''}">${esc(x.statusName)}</span>${x.review==='waiting'?'<span class="pill p-yel">Review</span>':''}</button>`;
}
function sxMeetRender(L){
  const today=new Date().toISOString().slice(0,10), f=S.sx.meetF;
  const live=x=>x.status==='pending'||x.status==='accepted';
  const G={up:L.list.filter(x=>live(x)&&x.date>=today).reverse(),review:L.list.filter(x=>x.review==='waiting'),todo:L.list.filter(x=>(x.status==='held')||(live(x)&&x.date<today)),past:L.list.filter(x=>!live(x)&&x.status!=='held')};
  const tabs=[['up','Upcoming'],['todo','Needs an update'],['review','Waiting review'],['past','Done']];
  $('main').innerHTML=`<div class="chips" style="margin-bottom:14px">${tabs.map(t=>`<button class="${f===t[0]?'on':''}" onclick="S.sx.meetF='${t[0]}';sxMeetRender(S.cache.sxm)">${t[1]} <em class="muted">${G[t[0]].length}</em></button>`).join('')}</div>
    <div class="card flush">${G[f].length?G[f].map(sxMtRow).join(''):`<div class="empty"><b>Nothing here</b></div>`}</div>`;
}
function sxMtFind(id){ return [].concat((S.cache.sxm||{}).list||[],(S.cache.sxh||{}).upcoming||[],(S.cache.sxp||{}).meetings||[],(S.sx.m360||{}).meetings||[],((S.cache.sxc||{}).pending||{}).reviews||[]).find(x=>x.id===id); }
async function sxMt(id){
  let M; try{ M=await sxMeta(); }catch(e){ return sxErr(e); }
  let x=sxMtFind(id);
  if(!x){ try{ const L=await call('salesMeetings'); S.cache.sxm=L; x=L.list.find(y=>y.id===id); }catch(e){} }
  if(!x) return toast('الاجتماع ده مش موجود أو مش من صلاحياتك');
  S.sx.mt=x;
  const me=S.user.username, F=sxF()||{}, isS=x.sales===me||F.mgr, isB=x.by===me||F.mgr, live=x.status==='pending'||x.status==='accepted';
  const A=[];
  if(isS&&x.status==='pending') A.push(['accept','✓ Accept','primary']);
  if(isS&&live) A.push(['reject','Reject','']);
  if(isS&&live) A.push(['held','Meeting happened','']);
  if(isS&&live) A.push(['cust_noshow','Customer no-show','']);
  if(isS&&(x.status==='held'||x.status==='accepted')) A.push(['qualify','Qualified ✓','primary'],['unqualify','Not qualified','']);
  if((isS||isB)&&(live||x.status==='cust_noshow')) A.push(['resched','Reschedule','']);
  if((isS||isB)&&live) A.push(['cancel','Cancel','danger']);
  if((x.by===me||F.mgr||x.parts.some(p=>p.u===me))&&live&&x.sales!==me) A.push(['sales_noshow','Sales did not attend','']);
  if(F.mgr&&x.review==='waiting') A.push(['overturn','Overturn decision','primary'],['uphold','Keep decision','']);
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:640px">
    <div style="display:flex;gap:10px;align-items:flex-start"><div style="flex:1"><h2 style="margin:0" dir="auto">${bd(x.store||'Meeting')}</h2>
      <div class="muted" style="margin-top:4px">${sxDay(x.date)} · ${esc(sxT12(x.time))} · ${x.dur} min</div></div><span class="pill ${SX_MP[x.status]||''}">${esc(x.statusName)}</span><button class="iconbtn" onclick="closeModal()" aria-label="Close">✕</button></div>
    <div class="sx-info" style="margin-top:12px">${[['Sales in charge',x.salesName],['Booked by',x.byName],['Others',x.parts.map(p=>p.name).join(', ')],['Phone',x.phone],['Need',x.need],['Brief',x.brief],['Reason',x.reason],['Criteria met',(x.qual||[]).join(', ')],['Review',x.review==='waiting'?'Waiting for the Sales Manager':x.review]].filter(y=>y[1]).map(y=>`<div><span>${y[0]}</span><b dir="auto">${bd(y[1])}</b></div>`).join('')}
      ${x.link?`<div><span>Link</span><b><a href="${esc(x.link)}" target="_blank" rel="noopener">${esc(x.link)}</a></b></div>`:''}</div>
    <div id="mtX"></div><div class="err sx-e" id="mtE"></div>
    <div class="mfoot" style="flex-wrap:wrap;gap:6px"><button class="btn small ghost" onclick="sxOpen('${esc(x.m)}')">Merchant 360</button><span class="spacer"></span>${A.map(a=>`<button class="btn small ${a[2]}" onclick="sxMtAsk('${a[0]}')">${esc(a[1])}</button>`).join('')}</div>
    ${x.hist.length?`<details class="sx-hist" style="margin-top:12px"><summary>History</summary>${x.hist.map(h=>`<div class="sx-hr"><span class="muted">${sxDT(h.at)}</span><b>${esc(M.mtStatus[h.s]||h.s)}</b><span>${esc(h.u)}</span>${h.n?`<div class="muted" dir="auto">${bd(h.n)}</div>`:''}</div>`).join('')}</details>`:''}
  </div></div>`;
}
function sxMtAsk(act){
  const M=S.sx.meta, x=S.sx.mt, box=$('mtX');
  const go=`<div class="mfoot"><span class="spacer"></span><button class="btn primary small" id="mtGo" onclick="sxMtDo('${act}')">Confirm</button></div>`;
  if(act==='accept'||act==='held'){ sxMtDo(act); return; }
  if(act==='reject') box.innerHTML=`<label for="mtR">Why? <span class="muted" style="font-weight:400">· the Sales Manager reviews every rejection</span></label><select id="mtR">${sxOpts(M.cfg.reject_reasons,'','Pick a reason')}</select><input id="mtRn" placeholder="Details" dir="auto" style="margin-top:6px">`+go;
  else if(act==='qualify') box.innerHTML=`<label>Qualified meeting criteria</label><div class="sx-ppl" style="max-height:none">${M.cfg.qual_criteria.map(c=>`<label class="check"><input type="checkbox" class="mtQ" value="${esc(c)}" checked>${esc(c)}</label>`).join('')}</div><input id="mtRn" placeholder="Note (optional)" dir="auto" style="margin-top:6px"><div class="muted" style="font-size:12.5px;margin-top:6px">A deal opens for the sales by itself.</div>`+go;
  else if(act==='resched') box.innerHTML=`<div class="row"><div><label for="mtD">New date</label><input type="date" id="mtD" value="${esc(x.date)}"></div><div><label for="mtT">Time</label><input type="time" id="mtT" value="${esc(x.time)}"></div></div><input id="mtRn" placeholder="Why (optional)" dir="auto" style="margin-top:6px">`+go;
  else box.innerHTML=`<label for="mtRn">${act==='unqualify'?'Why is it not qualified?':act==='overturn'||act==='uphold'?'Note for the team (optional)':'Reason'}</label><input id="mtRn" dir="auto">`+go;
}
async function sxMtDo(act){
  const v=id=>$(id)?$(id).value.trim():'';
  const reason=[v('mtR'),v('mtRn')].filter(Boolean).join(' · ');
  const p={id:S.sx.mt.id,act,reason,date:v('mtD'),time:v('mtT'),criteria:[...document.querySelectorAll('.mtQ:checked')].map(x=>x.value)};
  const done=sxBusy($('mtGo'));
  try{ const x=await call('salesMeetingAct',p); toast('اتسجل ✓'); const old=S.sx.mt; Object.assign(old,x); S.cache.sxh=null; S.cache.sxc=null;
    try{ const L=await call('salesMeetings'); S.cache.sxm=L; if(S.view==='slm') sxMeetRender(L); }catch(e){}
    if(act==='qualify') sxPipeReload();
    sxMt(x.id); }
  catch(e){ done(); $('mtE').textContent=e.message; }
}
async function sxBook(mid){
  let M; try{ M=await sxMeta(); }catch(e){ return sxErr(e); }
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:640px"><h2>Book a meeting</h2>${sxBookFields('')}<div class="err sx-e" id="sxErr"></div>
    <div class="mfoot"><button class="btn ghost" onclick="closeModal()">Cancel</button><span class="spacer"></span><button class="btn primary" id="bkB" onclick="sxBookSave('${esc(mid)}')">Book</button></div></div></div>`;
}
async function sxBookSave(mid){
  const m=sxBookRead(); if(!m.sales){ $('sxErr').textContent='اختار السيلز المسؤول'; return; }
  const done=sxBusy($('bkB'));
  try{ const r=await call('salesMeetingBook',{m:mid,meeting:m}); closeModal(); toast('اتحجز الاجتماع ✓'); S.cache.sxm=null; sxMt(r.id); }catch(e){ done(); $('sxErr').textContent=e.message; }
}

/* ================= Merchant 360 ================= */
async function sxOpen(id){
  let M; try{ M=await sxMeta(); }catch(e){ return sxErr(e); }
  let D; try{ D=await call('salesMerchant',{id}); }catch(e){ return sxErr(e); }
  S.sx.m360=D; sxM360(D);
}
function sxM360(D){
  const m=D.m, F=sxF()||{}, wa=m.phone?String(m.phone).replace(/\D/g,''):'';
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:860px">
    <div style="display:flex;gap:10px;align-items:flex-start"><div style="flex:1;min-width:0"><h2 style="margin:0" dir="auto">${bd(m.store)}</h2>
      <div class="sx-tags" style="margin-top:6px">${sxSt(m.status)}${[m.sector,m.platform,m.city,m.source==='self'?'Self-generated':m.source].filter(Boolean).map(t=>`<span class="pill p-out">${esc(t)}</span>`).join('')}</div></div>
      ${D.canEdit?`<button class="btn small" onclick="sxMEdit()">Edit</button>`:''}<button class="iconbtn" onclick="closeModal()" aria-label="Close">✕</button></div>
    <div class="sx-contact" style="margin-top:12px">${m.phone?`<a class="sx-call" href="tel:+${esc(wa)}">📞 +${esc(wa)}</a><a class="btn small" target="_blank" rel="noopener" href="https://wa.me/${esc(wa)}">WhatsApp</a>`:''}${m.url?`<a class="btn small" target="_blank" rel="noopener" href="${esc(/^https?:/i.test(m.url)?m.url:'https://'+m.url)}">Open store ↗</a>`:''}${m.email?`<span class="muted">${esc(m.email)}</span>`:''}${m.social?`<span class="muted" dir="auto">${bd(m.social)}</span>`:''}</div>
    <div id="m3Edit"></div>
    <div class="sx-info">${[['Decision maker',m.contact],['Size',m.size],['Products',m.products],['Need',m.need],['Service',m.service],['Pre-Sales Audit',m.audit],['Lost reason',m.lostReason],['Notes',m.notes]].filter(x=>x[1]).map(x=>`<div><span>${x[0]}</span><b dir="auto">${/^https?:\/\//.test(x[1])?`<a href="${esc(x[1])}" target="_blank" rel="noopener">${esc(x[1])}</a>`:bd(x[1])}</b></div>`).join('')}</div>
    <h3 style="margin:16px 0 6px">Who</h3>
    <div class="sx-info">${[['Found by',m.foundName,'found_by'],['With now',m.ownerName,''],['Telesales',m.teleName,'tele'],['Sales',m.salesName,'sales']].map(x=>`<div><span>${x[0]}</span><b>${esc(x[1]||'—')}${D.mgr&&x[2]?` <button class="btn small ghost" style="padding:1px 7px" onclick="sxAttrib('${x[2]}')">change</button>`:''}</b></div>`).join('')}</div>
    <div style="display:flex;gap:8px;align-items:center;margin:16px 0 6px"><h3 style="margin:0;flex:1">Meetings</h3>${(F.work||F.mgr)&&m.status!=='dnc'?`<button class="btn small" onclick="sxBook('${esc(m.id)}')">+ Meeting</button>`:''}</div>
    <div class="sx-list">${D.meetings.length?D.meetings.map(x=>sxMtRow(Object.assign({store:m.store},x))).join(''):'<div class="empty" style="padding:14px">No meetings</div>'}</div>
    <div style="display:flex;gap:8px;align-items:center;margin:16px 0 6px"><h3 style="margin:0;flex:1">Deals</h3>${(F.work||F.mgr)&&m.status!=='dnc'?`<button class="btn small" onclick="sxOppNew('${esc(m.id)}')">+ Deal</button>`:''}</div>
    <div class="sx-list">${D.opps.length?D.opps.map(o=>`<button class="al" onclick="sxOpp('${esc(o.id)}')"><span class="tx"><b>${esc(o.stage)}</b><span>${esc(o.ownerName)} · ${o.value?sxMoney(o.value,o.cur):'no value'}${o.services.length?' · '+esc(o.services.join(', ')):''}</span></span><span class="pill ${o.stage==='Closed-Won'?'p-in':o.stage==='Closed-Lost'?'p-bad':'p-prog'}">${o.prob}%</span></button>`).join(''):'<div class="empty" style="padding:14px">No deals</div>'}</div>
    ${D.projects.length?`<h3 style="margin:16px 0 6px">Projects with us</h3><div class="sx-list">${D.projects.map(p=>`<button class="al" onclick="closeModal();go('projects');setTimeout(()=>{try{viewProject('${esc(p.id)}')}catch(e){}},300)"><span class="tx"><b dir="auto">${bd(p.client)}</b><span>${esc(p.type)} · since ${fmtD(p.start)}</span></span><span class="pill p-out">${esc(p.status)}</span></button>`).join('')}</div>`:''}
    <h3 style="margin:16px 0 6px">History</h3><div class="sx-hist open">${D.history.map(sxHistRow).join('')||'<div class="muted">Nothing yet</div>'}</div>
  </div></div>`;
}
function sxMEdit(){
  const m=S.sx.m360.m, M=S.sx.meta, mgr=S.sx.m360.mgr;
  const inp=(id,l,v,ph)=>`<div><label for="${id}">${l}</label><input id="${id}" value="${esc(v||'')}" dir="auto"${ph?` placeholder="${ph}"`:''}></div>`;
  $('m3Edit').innerHTML=`<div class="sx-book">${mgr?`<div class="row">${inp('meS','Store name',m.store)}${inp('meP','Phone',m.phone)}${inp('meU','Store link',m.url)}</div>`:''}
    <div class="row"><div><label for="meSec">Sector</label><select id="meSec">${sxOpts(M.cfg.sectors,m.sector,'—')}</select></div><div><label for="mePl">Platform</label><select id="mePl">${sxOpts(M.cfg.platforms,m.platform,'—')}</select></div><div><label for="meC">City</label><select id="meC">${sxOpts(M.cfg.cities,m.city,'—')}</select></div></div>
    <div class="row">${inp('meCt','Decision maker',m.contact)}${inp('meE','Email',m.email)}${inp('meSo','Social',m.social)}</div>
    <div class="row">${inp('meSz','Size / branches',m.size)}${inp('meP2','Second phone',m.phone2)}${inp('meA','Pre-Sales Audit link',m.audit,'https://')}</div>
    <label for="mePr">Products</label><input id="mePr" value="${esc(m.products||'')}" dir="auto"><label for="meN">Notes</label><textarea id="meN" rows="2" dir="auto">${esc(m.notes||'')}</textarea>
    <div class="err sx-e" id="meE"></div><div class="mfoot"><button class="btn ghost small" onclick="$('m3Edit').innerHTML=''">Cancel</button><span class="spacer"></span><button class="btn primary small" id="meB" onclick="sxMSave()">Save</button></div></div>`;
}
async function sxMSave(){
  const v=id=>$(id)?$(id).value.trim():undefined, d={id:S.sx.m360.m.id,sector:v('meSec'),platform:v('mePl'),city:v('meC'),contact:v('meCt'),email:v('meE'),social:v('meSo'),size:v('meSz'),phone2:v('meP2'),audit:v('meA'),products:v('mePr'),notes:v('meN')};
  if($('meS')){ d.store=v('meS'); d.phone=v('meP'); d.url=v('meU'); }
  const done=sxBusy($('meB'));
  try{ const D=await call('salesMerchantSave',{m:d}); S.sx.m360=D; sxM360(D); toast('اتحفظ ✓'); }catch(e){ done(); $('meE').textContent=e.message; }
}
function sxAttrib(field){
  const M=S.sx.meta, D=S.sx.m360, cur=field==='found_by'?D.m.foundBy:field==='tele'?D.m.tele:D.m.sales;
  $('m3Edit').innerHTML=`<div class="sx-book"><b>Change ${field==='found_by'?'who found this merchant':field==='tele'?'the telesales':'the sales'}</b><div class="muted" style="font-size:12.5px">Saved in the audit log with your name and the reason.</div>
    <div class="row"><div><label for="atU">Person</label><select id="atU">${sxOpts(M.people,cur,'Nobody')}</select></div><div style="flex:2"><label for="atR">Reason</label><input id="atR" dir="auto"></div></div>
    <div class="err sx-e" id="atE"></div><div class="mfoot"><button class="btn ghost small" onclick="$('m3Edit').innerHTML=''">Cancel</button><span class="spacer"></span><button class="btn primary small" id="atB" onclick="sxAttribSave('${field}')">Save</button></div></div>`;
}
async function sxAttribSave(field){
  const done=sxBusy($('atB'));
  try{ const D=await call('salesAttrib',{id:S.sx.m360.m.id,field,to:$('atU').value,reason:$('atR').value}); S.sx.m360=D; sxM360(D); toast('اتغير ✓ واتسجل في الـ Audit log'); }catch(e){ done(); $('atE').textContent=e.message; }
}
async function sxOppNew(mid){
  const M=S.sx.meta;
  $('m3Edit').innerHTML=`<div class="sx-book"><b>New deal</b><div class="row"><div><label for="onV">Value</label><input id="onV" type="number" min="0"></div><div><label for="onN">Need</label><input id="onN" dir="auto"></div></div>
    <div class="err sx-e" id="onE"></div><div class="mfoot"><button class="btn ghost small" onclick="$('m3Edit').innerHTML=''">Cancel</button><span class="spacer"></span><button class="btn primary small" id="onB" onclick="sxOppNewSave('${esc(mid)}')">Create</button></div></div>`;
  $('m3Edit').scrollIntoView({block:'nearest'});
}
async function sxOppNewSave(mid){
  const done=sxBusy($('onB'));
  try{ const o=await call('salesOppSave',{opp:{m:mid,value:Number($('onV').value)||0,need:$('onN').value}}); sxPipeReload(); sxOpp(o.id,o); }catch(e){ done(); $('onE').textContent=e.message; }
}

/* ================= Data Center ================= */
function viewSxData(){
  setTop('Data Center','Upload → automatic checks → Sales Manager review → ready to distribute');
  const vt=S.vt;
  sxMeta().then(()=>{ if(S.vt===vt) swr('sxd','salesBatches',{},sxDataRender); }).catch(e=>{ $('main').innerHTML=`<div class="card err">${esc(e.message)}</div>`; });
}
function sxDataRender(D){
  const F=sxF()||{}, tab=S.sx.dataTab;
  const tabs=[['batches','Batches'],['upload','⬆ Upload data'],['tasks','Data tasks']].concat(F.view?[['merchants','Merchants'],['quality','Data quality']]:[]);
  if(!tabs.some(t=>t[0]===tab)) S.sx.dataTab='batches';
  const head=`<div class="chips" style="margin-bottom:14px">${tabs.map(t=>`<button class="${S.sx.dataTab===t[0]?'on':''}" onclick="S.sx.dataTab='${t[0]}';sxDataRender(S.cache.sxd)">${t[1]}</button>`).join('')}</div>`;
  const BST={pending:'p-absent',partial:'p-run',approved:'p-in',rejected:'p-bad',returned:'p-yel'};
  let body='';
  if(S.sx.dataTab==='batches') body=`<div class="card flush">${D.batches.length?D.batches.map(b=>`<button class="al" onclick="sxBatch('${esc(b.id)}')"><span class="tx"><b dir="auto">${bd(b.name)}</b><span>${esc(b.byName)} · ${sxDT(b.at)} · ${b.total} rows · ${b.flagged} flagged${b.ok?' · '+b.ok+' approved':''}${b.rej?' · '+b.rej+' rejected':''}</span></span><span class="pill ${BST[b.status]||''}">${esc(b.status)}</span></button>`).join(''):`<div class="empty"><b>No batches yet</b>Upload an Excel or CSV from ⬆ Upload data.</div>`}</div>`;
  else if(S.sx.dataTab==='upload') body=sxUploadForm(D);
  else if(S.sx.dataTab==='tasks') body=`${D.mgr?`<div style="margin-bottom:10px"><button class="btn primary" onclick="sxTaskEdit()">+ New data task</button></div>`:''}<div class="card flush">${D.tasks.length?D.tasks.map(t=>`<div class="al" style="cursor:default"><span class="tx"><b dir="auto">${bd(t.title)}</b><span>${esc(t.toName)}${t.qty?' · '+t.got+' / '+t.qty+' approved':''}${[t.sector,t.platform,t.city].filter(Boolean).length?' · '+esc([t.sector,t.platform,t.city].filter(Boolean).join(' · ')):''}${t.due?' · due '+fmtD(t.due):''}</span>${t.note?`<span class="muted" dir="auto">${bd(t.note)}</span>`:''}${t.qty?`<div class="sx-track" style="margin-top:6px;max-width:320px"><i style="width:${Math.min(100,Math.round(t.got/t.qty*100))}%"></i></div>`:''}</span>
    <span class="pill ${t.status==='done'?'p-in':'p-prog'}">${t.status==='done'?'Done':'Open'}</span>${t.status!=='done'?`<button class="btn small" onclick="sxTaskAct('${esc(t.id)}','done')">Mark done</button>`:`<button class="btn small ghost" onclick="sxTaskAct('${esc(t.id)}','reopen')">Reopen</button>`}${D.mgr?`<button class="btn small ghost" onclick="sxTaskAct('${esc(t.id)}','delete')">Delete</button>`:''}</div>`).join(''):`<div class="empty"><b>No data tasks</b>${D.mgr?'Ask for data: e.g. 500 perfume stores on Zid in Riyadh.':'Tasks from the Sales Manager show up here.'}</div>`}</div>`;
  else if(S.sx.dataTab==='quality') body=`<div class="tbl-wrap"><table><tr><th>Data Scraper</th><th>Uploaded</th><th>Approved</th><th>Rejected</th><th>Flagged</th><th>Valid contacts</th><th>Worked</th><th>Meetings</th><th>Qualified</th><th>Deals</th><th>Revenue</th></tr>${D.quality.map(q=>`<tr><td><b>${esc(q.name)}</b></td><td>${sxN(q.uploaded)}</td><td>${sxN(q.approved)}</td><td>${sxN(q.rejected)}</td><td>${q.dupRate}%</td><td>${q.validRate}%</td><td>${sxN(q.worked)}</td><td>${sxN(q.meetings)}</td><td>${sxN(q.qualified)}</td><td>${sxN(q.deals)}</td><td>${sxMoney(q.revenue)}</td></tr>`).join('')||'<tr><td colspan="11" class="muted">No data yet</td></tr>'}</table></div><p class="muted" style="font-size:12.5px">Meetings, deals and revenue are shared results with the sales team.</p>`;
  else if(S.sx.dataTab==='merchants'){ body=`<div id="sxMerch">${LOADING}</div>`; setTimeout(sxMerchLoad,0); }
  $('main').innerHTML=head+body;
}
/* ----- رفع الداتا ----- */
const SX_COLS=[['store','Store name',/^(store|store name|name|اسم المتجر|المتجر|الاسم|اسم)$/],['phone','Phone',/(phone|mobile|tel|whats|رقم|جوال|موبايل|تليفون|هاتف|واتس)/],['url','Store link',/(url|link|site|website|لينك|رابط|موقع)/],['platform','Platform',/(platform|منصه|منصة)/],['sector','Sector',/(sector|category|industry|قطاع|نشاط|فئه|فئة)/],['city','City',/(city|region|area|مدينه|مدينة|منطقه|منطقة)/],['email','Email',/(mail|ايميل|بريد)/],['social','Social',/(social|insta|tiktok|snap|twitter|سوشيال|انستا)/],['contact','Decision maker',/(owner|contact|decision|صاحب|المسؤول|مسئول|المالك)/],['size','Size',/(size|branch|حجم|فروع)/],['products','Products',/(product|منتج)/],['notes','Notes',/(note|ملاحظ)/]];
function sxUploadForm(D){
  const M=S.sx.meta, U=S.sx.up;
  return `<div class="card"><h3 style="margin-top:0">Upload a data batch</h3>
    <p class="muted" style="margin-top:0">Excel (.xlsx) or CSV. First row = headers. Data does not go to the team directly: the system checks duplicates, wrong phone numbers, missing data and merchants we already have, then the Sales Manager approves.</p>
    <input type="file" id="sxFile" accept=".xlsx,.csv,text/csv" onchange="sxFileRead(this.files[0])">
    <div id="sxMap">${U?sxMapHtml():''}</div></div>`;
}
function sxCsv(text){
  const rows=[]; let row=[], cur='', q=false;
  const sep=(text.split('\n')[0].match(/;/g)||[]).length>(text.split('\n')[0].match(/,/g)||[]).length?';':',';
  for(let i=0;i<text.length;i++){ const c=text[i];
    if(q){ if(c==='"'){ if(text[i+1]==='"'){ cur+='"'; i++; } else q=false; } else cur+=c; }
    else if(c==='"') q=true; else if(c===sep){ row.push(cur.trim()); cur=''; } else if(c==='\n'){ row.push(cur.trim()); rows.push(row); row=[]; cur=''; } else if(c!=='\r') cur+=c; }
  if(cur||row.length){ row.push(cur.trim()); rows.push(row); }
  return rows.filter(r=>r.some(x=>x));
}
async function sxFileRead(file){
  if(!file) return;
  try{
    const rows=/\.csv$/i.test(file.name)?sxCsv(await file.text()):await xlRead(file);
    if(rows.length<2) throw new Error('الملف فاضي أو مفيهوش غير العناوين');
    const head=rows[0].map(x=>String(x||''));
    const norm=s=>String(s||'').toLowerCase().replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').trim();
    const map={}; SX_COLS.forEach(([k,,re])=>{ const i=head.findIndex((h,j)=>re.test(norm(h))&&Object.values(map).indexOf(j)<0); if(i>=0) map[k]=i; });
    S.sx.up={name:file.name.replace(/\.[^.]+$/,''),head,rows:rows.slice(1),map,check:null};
    $('sxMap').innerHTML=sxMapHtml();
  }catch(e){ sxErr(e); }
}
function sxMapHtml(){
  const U=S.sx.up, M=S.sx.meta, D=S.cache.sxd||{tasks:[]};
  const c=U.check;
  return `<h3 style="margin:16px 0 6px">${U.rows.length} rows · match the columns</h3>
    <div class="sx-mapg">${SX_COLS.map(([k,l])=>`<div><label for="mp_${k}">${l}</label><select id="mp_${k}" onchange="sxMapSet('${k}',this.value)"><option value="">— not in the file —</option>${U.head.map((h,i)=>`<option value="${i}"${U.map[k]===i?' selected':''}>${esc(h||'Column '+(i+1))}</option>`).join('')}</select></div>`).join('')}</div>
    <div class="row"><div style="flex:2"><label for="upN">Batch name</label><input id="upN" value="${esc(U.name)}"></div><div><label for="upT">For data task</label><select id="upT">${sxOpts((D.tasks||[]).filter(t=>t.status!=='done').map(t=>({u:t.id,name:t.title})),'','—')}</select></div><div><label for="upS">Income source</label><select id="upS">${sxOpts(M.cfg.sources,'Direct Sales')}</select></div></div>
    ${c?`<div class="sx-check"><b>${c.clean} clean</b> of ${c.total}${Object.keys(c.counts).map(k=>` · <span class="pill p-absent">${esc(SX_FLAG[k]||k)}: ${c.counts[k]}</span>`).join('')}</div>`:''}
    <div class="err sx-e" id="upE"></div>
    <div class="mfoot"><button class="btn" id="upC" onclick="sxUpCheck()">Check the data</button><span class="spacer"></span><button class="btn primary" id="upB" onclick="sxUpSend()">Send for review</button></div>`;
}
const SX_FLAG={missing_name:'No store name',missing_contact:'No phone or link',bad_phone:'Wrong phone',exists:'Already in our data',dnc:'Do not contact',dup_file:'Repeated in the file'};
function sxMapSet(k,v){ if(v==='') delete S.sx.up.map[k]; else S.sx.up.map[k]=Number(v); S.sx.up.check=null; }
function sxUpRows(){ const U=S.sx.up; return U.rows.map(r=>{ const o={}; Object.keys(U.map).forEach(k=>{ o[k]=r[U.map[k]]||''; }); return o; }); }
async function sxUpCheck(){
  if(S.sx.up.map.store==null){ $('upE').textContent='اختار عمود اسم المتجر'; return; }
  const done=sxBusy($('upC'),'Checking...');
  try{ S.sx.up.name=$('upN').value; S.sx.up.check=await call('salesBatchCheck',{rows:sxUpRows()}); $('sxMap').innerHTML=sxMapHtml(); }catch(e){ done(); $('upE').textContent=e.message; }
}
async function sxUpSend(){
  if(S.sx.up.map.store==null){ $('upE').textContent='اختار عمود اسم المتجر'; return; }
  const done=sxBusy($('upB'),'Sending...');
  try{ const r=await call('salesBatchUpload',{name:$('upN').value,task:$('upT').value,source:$('upS').value,rows:sxUpRows()});
    toast('اتبعتت للمراجعة ✓ '+r.total+' سطر ('+r.flagged+' عليهم ملاحظات)'); S.sx.up=null; S.sx.dataTab='batches';
    const D=await call('salesBatches'); S.cache.sxd=D; sxDataRender(D); }
  catch(e){ done(); $('upE').textContent=e.message; }
}
/* ----- مراجعة الدفعة ----- */
async function sxBatch(id){
  let D; try{ D=await call('salesBatchGet',{id}); }catch(e){ return sxErr(e); }
  S.sx.bt=D; const b=D.batch, open=D.mgr&&(b.status==='pending'||b.status==='partial');
  const def=r=>r.dec||(r.flags.some(f=>f==='exists'||f==='dnc'||f==='dup_file'||f==='missing_contact'||f==='missing_name')?'rej':r.flags.length?'fix':'ok');
  const rows=D.rows.slice(0,600);
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:1100px">
    <div style="display:flex;gap:10px;align-items:flex-start"><div style="flex:1"><h2 style="margin:0" dir="auto">${bd(b.name)}</h2><div class="muted" style="margin-top:4px">${esc(b.byName||b.by)} · ${b.total} rows · ${b.flagged} flagged · ${esc(b.status)}${b.note?' · '+esc(b.note):''}</div></div><button class="iconbtn" onclick="closeModal()" aria-label="Close">✕</button></div>
    ${open?`<div class="notice" style="margin:12px 0">Pick for every row: <b>Approve</b> (goes to the data center, ready to distribute), <b>Reject</b>, or <b>Fix</b> (goes back to the scraper). Duplicates of merchants we already have are never approved.</div>
      <div class="chips" style="margin-bottom:8px"><button onclick="sxBtAll('ok')">All clean → Approve</button><button onclick="sxBtAll('rej')">All → Reject</button></div>`:''}
    <div class="tbl-wrap" style="max-height:44vh"><table style="min-width:900px"><tr><th>#</th><th>Store</th><th>Phone</th><th>Link</th><th>Sector</th><th>Platform</th><th>City</th><th>Checks</th><th>${open?'Decision':'Result'}</th></tr>
    ${rows.map(r=>`<tr><td class="muted">${r.i+2}</td><td dir="auto"><b>${bd(r.data.store||'—')}</b></td><td>${esc(r.data.phone||'')}</td><td style="max-width:180px;overflow:hidden;text-overflow:ellipsis">${esc(r.data.url||'')}</td><td>${esc(r.data.sector||'')}</td><td>${esc(r.data.platform||'')}</td><td>${esc(r.data.city||'')}</td>
      <td>${r.flags.map(f=>`<span class="pill ${f==='exists'||f==='dnc'?'p-bad':'p-absent'}" style="margin:1px">${esc(SX_FLAG[f]||f)}</span>`).join('')||'<span class="pill p-in">OK</span>'}</td>
      <td>${open&&!r.dec?`<select class="sxDec" data-i="${r.i}" data-flag="${r.flags.length?1:0}"><option value="ok"${def(r)==='ok'?' selected':''}>Approve</option><option value="rej"${def(r)==='rej'?' selected':''}>Reject</option><option value="fix"${def(r)==='fix'?' selected':''}>Fix</option></select>`:esc({ok:'Approved',rej:'Rejected',fix:'Returned'}[r.dec]||'—')}</td></tr>`).join('')}</table></div>
    ${D.rows.length>rows.length?`<div class="muted" style="margin-top:6px">Showing the first ${rows.length} rows. The rest get the default decision (clean = approve).</div>`:''}
    ${open?`<label for="btN">Note to the scraper</label><input id="btN" dir="auto"><div class="err sx-e" id="btE"></div><div class="mfoot"><span class="spacer"></span><button class="btn primary" id="btB" onclick="sxBtSave()">Save decisions</button></div>`:''}
  </div></div>`;
}
function sxBtAll(v){ document.querySelectorAll('.sxDec').forEach(s=>{ if(v==='rej'||s.dataset.flag==='0') s.value=v; }); }
async function sxBtSave(){
  const D=S.sx.bt, dec={};
  D.rows.forEach(r=>{ if(r.dec) return; dec[r.i]=r.flags.length?'rej':'ok'; });
  document.querySelectorAll('.sxDec').forEach(s=>{ dec[s.dataset.i]=s.value; });
  const done=sxBusy($('btB'),'Saving...');
  try{ const r=await call('salesBatchReview',{id:D.batch.id,dec,note:$('btN').value}); closeModal(); toast(r.ok+' اتقبلوا · '+r.rej+' اترفضوا'+(r.fix?' · '+r.fix+' رجعوا للتعديل':''));
    const B=await call('salesBatches'); S.cache.sxd=B; if(S.view==='sld') sxDataRender(B); S.cache.sxc=null; }
  catch(e){ done(); $('btE').textContent=e.message; }
}
/* ----- تاسكات الداتا ----- */
function sxTaskEdit(){
  const M=S.sx.meta, D=S.cache.sxd||{scrapers:[]};
  const who=D.scrapers.length?D.scrapers:M.people;
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:560px"><h2>New data task</h2>
    <label for="tkT">What do you need?</label><input id="tkT" dir="auto" placeholder="500 perfume stores on Zid in Riyadh">
    <div class="row"><div><label for="tkU">Who collects it</label><select id="tkU">${sxOpts(who,'','Pick')}</select></div><div><label for="tkQ">How many stores</label><input id="tkQ" type="number" min="0"></div><div><label for="tkD">Due</label><input id="tkD" type="date"></div></div>
    <div class="row"><div><label for="tkS">Sector</label><select id="tkS">${sxOpts(M.cfg.sectors,'','Any')}</select></div><div><label for="tkP">Platform</label><select id="tkP">${sxOpts(M.cfg.platforms,'','Any')}</select></div><div><label for="tkC">City</label><select id="tkC">${sxOpts(M.cfg.cities,'','Any')}</select></div></div>
    <label for="tkN">Why / campaign</label><textarea id="tkN" rows="2" dir="auto"></textarea><div class="err sx-e" id="tkE"></div>
    <div class="mfoot"><button class="btn ghost" onclick="closeModal()">Cancel</button><span class="spacer"></span><button class="btn primary" id="tkB" onclick="sxTaskSave()">Send task</button></div></div></div>`;
}
async function sxTaskSave(){
  const v=id=>$(id).value.trim(), done=sxBusy($('tkB'));
  try{ await call('salesTaskSave',{task:{title:v('tkT'),to:v('tkU'),qty:Number(v('tkQ'))||0,due:v('tkD'),sector:v('tkS'),platform:v('tkP'),city:v('tkC'),note:v('tkN')}}); closeModal(); toast('اتبعتت ✓'); const D=await call('salesBatches'); S.cache.sxd=D; S.sx.dataTab='tasks'; sxDataRender(D); }
  catch(e){ done(); $('tkE').textContent=e.message; }
}
async function sxTaskAct(id,act){ try{ await call('salesTaskAct',{id,act}); const D=await call('salesBatches'); S.cache.sxd=D; sxDataRender(D); }catch(e){ sxErr(e); } }
/* ----- قاعدة التجار ----- */
async function sxMerchLoad(){
  const f=S.sx.mf, M=S.sx.meta;
  let R; try{ R=await call('salesMerchants',{f}); }catch(e){ $('sxMerch').innerHTML=`<div class="card err">${esc(e.message)}</div>`; return; }
  S.sx.ml=R; const F=sxF()||{};
  const sel=(k,L,blank)=>`<select onchange="S.sx.mf.${k}=this.value;sxMerchLoad()" style="width:auto">${sxOpts(L,f[k]||'',blank)}</select>`;
  const st=Object.keys(SX_ST).map(k=>({u:k,name:SX_ST[k][0]+' ('+(R.counts[k]||0)+')'}));
  if(!$('sxMerch')) return;
  $('sxMerch').innerHTML=`<div class="sx-filt"><input id="mfQ" placeholder="Search store, phone or link" value="${esc(f.q||'')}" onkeydown="if(event.key==='Enter'){S.sx.mf.q=this.value;sxMerchLoad()}">
    ${sel('status',st,'All statuses')}${sel('sector',M.cfg.sectors,'All sectors')}${sel('platform',M.cfg.platforms,'All platforms')}${sel('city',M.cfg.cities,'All cities')}${sel('owner',M.team,'Anyone')}</div>
    <div class="muted" style="margin:8px 0">${sxN(R.total)} match · ${sxN(R.all)} merchants in total${R.total>R.list.length?' · showing the latest '+R.list.length:''}</div>
    ${F.mgr?`<div class="sx-bulk"><label class="check" style="margin:0"><input type="checkbox" onchange="document.querySelectorAll('.mfC').forEach(c=>c.checked=this.checked)">All</label><span class="spacer"></span><select id="mfTo" style="width:auto">${sxOpts(M.sellers,'','Give to…')}</select><button class="btn small primary" onclick="sxAssign('mfC','mfTo')">Assign</button><button class="btn small" onclick="sxAssign('mfC','')">Back to pool</button></div>`:''}
    <div class="tbl-wrap"><table style="min-width:900px"><tr>${F.mgr?'<th></th>':''}<th>Store</th><th>Phone</th><th>Sector · Platform · City</th><th>Status</th><th>With</th><th>Found by</th><th>Updated</th></tr>
    ${R.list.map(m=>`<tr>${F.mgr?`<td><input type="checkbox" class="mfC" value="${esc(m.id)}"></td>`:''}<td dir="auto" style="cursor:pointer" onclick="sxOpen('${esc(m.id)}')"><b>${bd(m.store)}</b></td><td>${esc(m.phone||'')}</td><td class="muted">${esc([m.sector,m.platform,m.city].filter(Boolean).join(' · '))}</td><td>${sxSt(m.status)}</td><td>${esc(m.ownerName||'—')}</td><td>${esc(m.foundName||'—')}</td><td class="muted">${sxDT(m.updated)}</td></tr>`).join('')||`<tr><td colspan="8" class="muted">No merchants</td></tr>`}</table></div>`;
}
async function sxAssign(cls,toId){
  const ids=[...document.querySelectorAll('.'+cls+':checked')].map(x=>x.value), to=toId?$(toId).value:'';
  if(!ids.length) return toast('اختار ليدز الأول'); if(toId&&!to) return toast('اختار الشخص');
  try{ const r=await call('salesAssign',{ids,to}); toast(r.n+' ✓'); S.cache.sxc=null; if(S.view==='sld') sxMerchLoad(); if(S.view==='slc') viewSxCmd(true); }catch(e){ sxErr(e); }
}

/* ================= Command Center (مدير المبيعات) ================= */
function viewSxCmd(fresh){
  setTop('Sales Command Center','Team, data stock, approvals and pipeline');
  const vt=S.vt;
  sxMeta().then(()=>{ if(S.vt===vt) swr('sxc','salesBoard',fresh===true?{fresh:1}:{},sxCmdRender); }).catch(e=>{ $('main').innerHTML=`<div class="card err">${esc(e.message)}</div>`; });
}
function sxCmdRender(B){
  const M=S.sx.meta, I=B.inventory, P=B.pipeline, cur=B.currency, mgr=B.mgr;
  const pend=B.pending.batches.length+B.pending.reviews.length;
  const kindN=k=>(M.kinds||{})[k]||k;
  $('main').innerHTML=`
  <div class="grid kpis">
    ${sxK('Data in stock',sxN(I.pool),I.days==null?'Set daily targets to see days left':I.days+' days at '+I.daily+' leads/day',I.days!=null&&I.days<3?'var(--bad)':'')}
    ${sxK('Open pipeline',sxMoney(P.value,cur),P.open+' deals')}
    ${sxK('Forecast',sxMoney(P.forecast,cur),'value × stage probability')}
    ${sxK('Won this month',sxMoney(P.wonMonth,cur),P.wonCount+' deals','var(--ok)')}
    ${sxK('Waiting for you',sxN(pend),B.pending.batches.length+' batches · '+B.pending.reviews.length+' meeting reviews',pend?'var(--warn)':'')}
  </div>
  ${mgr?`<div class="card"><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end"><div style="flex:1;min-width:220px"><h3 style="margin:0 0 4px">Distribute data</h3><div class="muted" style="font-size:12.5px">Tops up everyone's new leads to their daily company target, round robin, skipping people on approved leave and matching their sectors / platforms.</div></div>
    <div><label for="dsS">Sector</label><select id="dsS">${sxOpts(M.cfg.sectors,'','Any')}</select></div><div><label for="dsP">Platform</label><select id="dsP">${sxOpts(M.cfg.platforms,'','Any')}</select></div><div><label for="dsC">City</label><select id="dsC">${sxOpts(M.cfg.cities,'','Any')}</select></div>
    <button class="btn primary" id="dsB" onclick="sxDist()">Distribute now</button></div></div>`:''}
  <div class="card flush"><div class="chead"><h2>Team today</h2><button class="btn small ghost" onclick="viewSxCmd(true)">↻ Refresh</button></div>
  <div class="tbl-wrap" style="border:0"><table style="min-width:980px"><tr><th>Name</th><th>Now</th><th>Calls today</th><th>Queue</th><th>Late follow-ups</th><th>Skips</th><th>Booked (month)</th><th>Qualified (month)</th><th>Won</th><th>Revenue (month)</th></tr>
  ${B.team.filter(t=>t.kind!=='scraper').map(t=>`<tr><td><b>${esc(t.name)}</b><div class="muted" style="font-size:12px">${esc(kindN(t.kind))}</div></td>
    <td>${t.leave?`<span class="pill p-out">On leave</span>`:t.inMeeting?'<span class="pill p-yel">In a meeting</span>':t.lastAt?`<span class="muted" style="font-size:12.5px">${timeAgo(t.lastAt)}</span>`:'<span class="muted">—</span>'}</td>
    <td>${sxN(t.today.calls)}${t.target.calls?` / ${t.target.calls}`:''}</td><td>${t.queue}${t.fresh?` <span class="muted">(${t.fresh} new)</span>`:''}</td>
    <td>${t.overdue?`<span class="pill p-bad">${t.overdue}</span>`:'0'}</td><td>${t.today.skips||0}</td><td>${t.month.booked}</td><td>${t.month.qualified}${t.target.qual?' / '+t.target.qual:''}</td><td>${t.month.won}</td><td>${sxMoney(t.month.revenue,cur)}${t.target.rev?` <span class="muted">/ ${sxN(t.target.rev)}</span>`:''}</td></tr>`).join('')||'<tr><td colspan="10" class="muted">No team yet. Add people in Sales Settings.</td></tr>'}
  </table></div></div>
  <div class="sx-2col">
    <div class="card flush"><div class="chead"><h2>Data batches to review</h2></div>${B.pending.batches.length?B.pending.batches.map(b=>`<button class="al" onclick="sxBatch('${esc(b.id)}')"><span class="tx"><b dir="auto">${bd(b.name)}</b><span>${esc(b.by)} · ${b.total} rows · ${b.flagged} flagged</span></span><span class="pill p-absent">Review</span></button>`).join(''):'<div class="empty" style="padding:14px">Nothing waiting</div>'}</div>
    <div class="card flush"><div class="chead"><h2>Meeting decisions to review</h2></div>${B.pending.reviews.length?B.pending.reviews.map(sxMtRow).join(''):'<div class="empty" style="padding:14px">Nothing waiting</div>'}</div>
  </div>
  <div class="sx-2col">
    <div class="card"><h3 style="margin-top:0">Pipeline by stage</h3><div class="sx-mini">${P.stages.map(s=>`<div><span>${esc(s.n)}</span><b>${s.c}</b><b>${sxMoney(s.v,cur)}</b><em>${s.p}%</em></div>`).join('')}</div>
      ${P.lost.length?`<h3>Why we lose</h3><div class="sx-mini">${P.lost.map(l=>`<div><span dir="auto">${bd(l.n)}</span><b>${l.c}</b></div>`).join('')}</div>`:''}</div>
    <div class="card"><h3 style="margin-top:0">Data stock by sector</h3><div class="sx-mini">${I.sectors.map(s=>`<div><span>${esc(s.n)}</span><b>${s.c}</b></div>`).join('')||'<div><span class="muted">Empty: ask for a data task</span></div>'}</div>
      ${I.platforms.length?`<h3>By platform</h3><div class="sx-mini">${I.platforms.map(s=>`<div><span>${esc(s.n)}</span><b>${s.c}</b></div>`).join('')}</div>`:''}
      ${I.cooling?`<div class="muted" style="font-size:12.5px;margin-top:8px">${I.cooling} more come back after their no-answer cool-off.</div>`:''}
      ${I.days!=null&&I.days<5?`<div class="notice" style="margin-top:10px">Data runs out in ${I.days} days. <button class="btn small" onclick="go('sld');S.sx.dataTab='tasks';setTimeout(()=>{if(S.cache.sxd)sxTaskEdit()},400)">+ Data task</button></div>`:''}</div>
  </div>
  <div class="card flush"><div class="chead"><h2>Neglected leads</h2><span class="muted" style="font-size:12.5px">follow-up 2+ days late, or no activity for ${(M.cfg&&M.cfg.own_days)||7}+ days</span></div>
    ${B.neglected.length?`${mgr?`<div class="sx-bulk" style="padding:10px 20px"><label class="check" style="margin:0"><input type="checkbox" onchange="document.querySelectorAll('.ngC').forEach(c=>c.checked=this.checked)">All</label><span class="spacer"></span><select id="ngTo" style="width:auto">${sxOpts(M.sellers,'','Give to…')}</select><button class="btn small primary" onclick="sxAssign('ngC','ngTo')">Reassign</button><button class="btn small" onclick="sxAssign('ngC','')">Back to pool</button></div>`:''}
      ${B.neglected.map(m=>`<div class="al" style="cursor:default">${mgr?`<input type="checkbox" class="ngC" value="${esc(m.id)}" style="margin-top:4px">`:''}<span class="tx" style="cursor:pointer" onclick="sxOpen('${esc(m.id)}')"><b dir="auto">${bd(m.store)}</b><span>${esc(m.ownerName)} · last ${sxDT(m.lastAt)} · due ${sxDT(m.nextAt)}</span></span></div>`).join('')}`:'<div class="empty" style="padding:14px">All good</div>'}</div>
  <div class="sx-2col">
    <div class="card flush"><div class="chead"><h2>Skips (last 3 days)</h2></div>${B.pending.skips.length?B.pending.skips.map(s=>`<button class="al" onclick="sxOpen('${esc(s.m)}')"><span class="tx"><b>${esc(s.name)}</b><span dir="auto">${bd(s.store)} · ${bd(s.note)}</span></span><span class="muted" style="font-size:12px">${sxDT(s.at)}</span></button>`).join(''):'<div class="empty" style="padding:14px">No skips</div>'}</div>
    <div class="card flush"><div class="chead"><h2>Tried to claim company data</h2></div>${B.pending.selfDup.length?B.pending.selfDup.map(s=>`<button class="al" onclick="sxOpen('${esc(s.m)}')"><span class="tx"><b>${esc(s.name)}</b><span dir="auto">${bd(s.store)}${s.owner?' · with '+esc(s.owner):''}</span></span><span class="muted" style="font-size:12px">${sxDT(s.at)}</span></button>`).join(''):'<div class="empty" style="padding:14px">Nothing</div>'}</div>
  </div>
  <div class="card flush"><div class="chead"><h2>Audit log</h2><span class="muted" style="font-size:12.5px">reassign, back to pool, attribution</span></div>${B.audit.length?B.audit.map(a=>`<div class="al" style="cursor:default"><span class="tx"><b>${esc(a.name)} · ${esc(SX_KIND[a.kind]||a.kind)}</b><span dir="auto">${bd(a.store)} · ${bd(a.note)}</span></span><span class="muted" style="font-size:12px">${sxDT(a.at)}</span></div>`).join(''):'<div class="empty" style="padding:14px">Nothing yet</div>'}</div>`;
}
async function sxDist(){
  const done=sxBusy($('dsB'),'Distributing...');
  try{ const r=await call('salesDistribute',{f:{sector:$('dsS').value,platform:$('dsP').value,city:$('dsC').value}}); done();
    toast(r.given?r.given+' ليد اتوزعوا ✓ · فاضل '+r.left+' في المخزون':'مفيش حد محتاج داتا دلوقتي، أو المخزون خلص'); viewSxCmd(true); }
  catch(e){ done(); sxErr(e); }
}

/* ================= Sales Settings ================= */
function viewSxSet(){
  setTop('Sales Settings','Team & targets, queue rules, call results, pipeline stages and lists');
  swr('sxs','salesCfgGet',{},sxSetRender);
}
function sxSetRender(R){
  const C=R.cfg, ed=R.canEdit, dis=ed?'':' disabled';
  S.sx.set=JSON.parse(JSON.stringify(C));
  const num=(id,l,v,h)=>`<div><label for="${id}">${l}${h?` <span class="muted" style="font-weight:400;font-size:12px">· ${h}</span>`:''}</label><input id="${id}" type="number" min="0" value="${v}"${dis}></div>`;
  const ta=(k,l)=>`<div><label for="ls_${k}">${l} <span class="muted" style="font-weight:400;font-size:12px">· one per line</span></label><textarea id="ls_${k}" rows="6" dir="auto"${dis}>${esc((C[k]||[]).join('\n'))}</textarea></div>`;
  $('main').innerHTML=`
  <div class="card"><h3 style="margin-top:0">Team & targets</h3><p class="muted" style="margin-top:0">Everyone here can open the Sales pages. Daily company leads = X (from the company), self = Y (they find), follow-ups counted on their own. Calls per day can be anything you set.</p>
    <div class="tbl-wrap"><table id="sxTeam" style="min-width:1380px"><tr><th>Person</th><th>Role</th><th>On</th><th>Approved data / month</th><th>Calls / day</th><th>Company leads / day</th><th>Self leads / day</th><th>Follow-ups / day</th><th>Meetings / week</th><th>Qualified / month</th><th>Deals / month</th><th>Revenue / month</th><th>Only sectors</th><th>Only platforms</th><th></th></tr>
    ${C.team.map((t,i)=>sxTeamRow(t,i,R,dis)).join('')}</table></div>
    ${ed?`<button class="btn small" style="margin-top:8px" onclick="sxTeamAdd()">+ Add person</button>`:''}</div>
  <div class="card"><h3 style="margin-top:0">Queue rules</h3><div class="row">
    ${num('cfR','Retry after (hours)',C.retry_h,'no answer / busy')}${num('cfM','Tries before back to pool',C.max_tries)}${num('cfCo','Cool-off (days)',C.cool_days,'before it comes back')}${num('cfO','Neglected after (days)',C.own_days,'no activity')}${num('cfSk','Max skips / day',C.skip_max)}${num('cfMm','Meeting length (min)',C.meet_min)}</div>
    <div class="row"><div><label for="cfCur">Currency</label><select id="cfCur"${dis}>${sxOpts(['SAR','EGP','USD'],C.currency)}</select></div><div style="flex:3"><label class="check" style="margin-top:28px"><input type="checkbox" id="cfAD"${C.auto_dist?' checked':''}${dis}>Distribute automatically every working day at 8 AM</label></div></div></div>
  <div class="card"><h3 style="margin-top:0">Call results</h3><p class="muted" style="margin-top:0">The buttons the team sees after each call. What each one does is fixed; the name, fields and on/off are yours.</p>
    <div class="tbl-wrap"><table id="sxRes" style="min-width:900px"><tr><th>Name</th><th>What it does</th><th>Asks for</th><th>On</th></tr>
    ${C.results.map((r,i)=>`<tr data-k="${esc(r.k)}"><td><input class="rsL" value="${esc(r.l)}"${dis}></td><td><select class="rsA" style="min-width:200px"${dis}>${Object.keys(R.acts).map(a=>`<option value="${a}"${r.act===a?' selected':''}>${esc(R.acts[a])}</option>`).join('')}</select></td>
      <td>${Object.keys(R.fields).map(f=>`<label class="check" style="display:inline-flex;margin-right:8px"><input type="checkbox" class="rsF" value="${f}"${(r.f||[]).indexOf(f)>=0?' checked':''}${dis}>${esc(R.fields[f])}</label>`).join('')}</td><td><input type="checkbox" class="rsO"${r.on!==false?' checked':''}${dis}></td></tr>`).join('')}</table></div></div>
  <div class="card"><h3 style="margin-top:0">Pipeline stages & gates</h3><p class="muted" style="margin-top:0">A deal can only move to a stage when everything that stage (and the ones before it) needs is filled in. The last stage must be Closed-Won. Closed-Lost, On Hold and Nurturing are always there.</p>
    <div id="sxStg">${sxStgHtml(C.stages,R,dis)}</div>${ed?`<button class="btn small" style="margin-top:8px" onclick="sxStgAdd()">+ Add stage</button>`:''}</div>
  <div class="card"><h3 style="margin-top:0">Lists</h3><div class="sx-lists">
    ${ta('sectors','Sectors')}${ta('platforms','Platforms')}${ta('cities','Cities')}${ta('services','Services / service lines')}${ta('sources','Income sources')}${ta('skip_reasons','Skip reasons')}${ta('lost_reasons','Lost reasons')}${ta('reject_reasons','Meeting reject reasons')}${ta('qual_criteria','Qualified meeting criteria')}</div></div>
  ${ed?`<div class="sx-save"><div class="err sx-e" id="cfE"></div><button class="btn primary" id="cfB" onclick="sxSetSave()">Save Sales settings</button></div>`:'<div class="muted">Only the Sales Manager can change these.</div>'}`;
}
function sxTeamRow(t,i,R,dis){
  R=R||S.cache.sxs; dis=dis||'';
  const n=(k)=>`<td><input type="number" min="0" class="tm_${k}" value="${Number(t[k])||0}" style="width:84px"${dis}></td>`;
  return `<tr class="sxTm"><td><select class="tm_u" style="min-width:170px"${dis}>${sxOpts(R.people,t.u,'Pick')}</select></td><td><select class="tm_kind" style="min-width:150px"${dis}>${Object.keys(R.kinds).map(k=>`<option value="${k}"${t.kind===k?' selected':''}>${esc(R.kinds[k])}</option>`).join('')}</select></td><td><input type="checkbox" class="tm_on"${t.on!==false?' checked':''}${dis}></td>
    ${['data','calls','co','self','fu','mtg','qual','deals','rev'].map(n).join('')}<td><input class="tm_sectors" value="${esc((t.sectors||[]).join(', '))}" placeholder="all" style="width:130px"${dis}></td><td><input class="tm_platforms" value="${esc((t.platforms||[]).join(', '))}" placeholder="all" style="width:110px"${dis}></td>
    <td>${dis?'':`<button class="btn small ghost" onclick="this.closest('tr').remove()" aria-label="Remove">✕</button>`}</td></tr>`;
}
function sxTeamAdd(){ $('sxTeam').insertAdjacentHTML('beforeend',sxTeamRow({u:'',kind:'tele',on:true},0)); }
function sxStgHtml(L,R,dis){
  R=R||S.cache.sxs; dis=dis||'';
  return `<div class="tbl-wrap"><table style="min-width:900px"><tr><th></th><th>Stage</th><th>Probability %</th><th>Needs before entering</th><th></th></tr>${L.map((s,i)=>`<tr class="sxSg"><td style="white-space:nowrap">${dis?'':`<button class="btn small ghost" onclick="sxStgMove(${i},-1)" aria-label="Up">↑</button><button class="btn small ghost" onclick="sxStgMove(${i},1)" aria-label="Down">↓</button>`}</td>
    <td><input class="sg_n" value="${esc(s.n)}"${dis}></td><td><input type="number" min="0" max="100" class="sg_p" value="${Number(s.p)||0}" style="width:80px"${dis}></td>
    <td>${Object.keys(R.gates).map(g=>`<label class="check" style="display:inline-flex;margin-right:8px"><input type="checkbox" class="sg_g" value="${g}"${(s.g||[]).indexOf(g)>=0?' checked':''}${dis}>${esc(R.gates[g])}</label>`).join('')}</td>
    <td>${dis?'':`<button class="btn small ghost" onclick="sxStgDel(${i})" aria-label="Remove">✕</button>`}</td></tr>`).join('')}</table></div>`;
}
function sxStgRead(){ return [...document.querySelectorAll('.sxSg')].map(tr=>({n:tr.querySelector('.sg_n').value.trim(),p:Number(tr.querySelector('.sg_p').value)||0,g:[...tr.querySelectorAll('.sg_g:checked')].map(x=>x.value)})); }
function sxStgMove(i,d){ const L=sxStgRead(), j=i+d; if(j<0||j>=L.length) return; [L[i],L[j]]=[L[j],L[i]]; $('sxStg').innerHTML=sxStgHtml(L); }
function sxStgDel(i){ const L=sxStgRead(); L.splice(i,1); $('sxStg').innerHTML=sxStgHtml(L); }
function sxStgAdd(){ const L=sxStgRead(); L.splice(Math.max(0,L.length-1),0,{n:'New stage',p:50,g:[]}); $('sxStg').innerHTML=sxStgHtml(L); }
async function sxSetSave(){
  const v=id=>$(id).value, lines=k=>$('ls_'+k).value.split('\n').map(x=>x.trim()).filter(Boolean), csv=s=>String(s||'').split(',').map(x=>x.trim()).filter(Boolean);
  const team=[...document.querySelectorAll('.sxTm')].map(tr=>{ const q=c=>tr.querySelector('.tm_'+c); const o={u:q('u').value,kind:q('kind').value,on:q('on').checked,sectors:csv(q('sectors').value),platforms:csv(q('platforms').value)}; ['data','calls','co','self','fu','mtg','qual','deals','rev'].forEach(k=>{ o[k]=Number(q(k).value)||0; }); return o; }).filter(t=>t.u);
  const results=[...document.querySelectorAll('#sxRes tr[data-k]')].map(tr=>({k:tr.dataset.k,l:tr.querySelector('.rsL').value.trim(),act:tr.querySelector('.rsA').value,on:tr.querySelector('.rsO').checked,f:[...tr.querySelectorAll('.rsF:checked')].map(x=>x.value)}));
  const cfg={team,results,stages:sxStgRead(),retry_h:v('cfR'),max_tries:v('cfM'),cool_days:v('cfCo'),own_days:v('cfO'),skip_max:v('cfSk'),meet_min:v('cfMm'),currency:v('cfCur'),auto_dist:$('cfAD').checked};
  ['sectors','platforms','cities','services','sources','skip_reasons','lost_reasons','reject_reasons','qual_criteria'].forEach(k=>{ cfg[k]=lines(k); });
  const done=sxBusy($('cfB'),'Saving...');
  try{ const R=await call('salesCfgSave',{cfg}); S.cache.sxs=R; S.sx.meta=null; done(); toast('اتحفظت إعدادات المبيعات ✓'); sxSetRender(R); refreshMe&&refreshMe(); }
  catch(e){ done(); $('cfE').textContent=e.message; }
}
