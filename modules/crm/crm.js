/* ============ Clients CRM ============
   بيتبني لوحده: أي عميل ليه بريف واتعمله مشروع. مفيش إدخال يدوي. */
const CRM_ST={Active:'p-in','On Hold':'p-yel',Launched:'p-prog',Cancelled:'p-out'};
S.crmF={q:'',st:'All'};
function viewCrm(){
  setTop('Clients CRM','Every client with a brief and a project · updates by itself', `<button class="btn" onclick="crmRefresh()">Refresh</button>`);
  swr('crm','crmList',{},renderCrm);
}
function crmRefresh(){ call('crmList',{fresh:true}).then(r=>{ S.cache.crm=r; S.fetched.crm=Date.now(); saveCache(); if(S.view==='crm') renderCrm(r); }).catch(e=>toast(e.message)); }
function crmMatch(c,q){ if(!q) return true; q=q.toLowerCase(); return [c.client,c.store,c.am,c.zid,...c.projects.map(p=>p.id+' '+p.name+' '+p.type+' '+p.platform)].some(v=>String(v||'').toLowerCase().indexOf(q)>=0); }
function renderCrm(r){
  if(!r||!r.clients) return;
  const F=S.crmF, k=r.kpis;
  const L=r.clients.filter(c=>(F.st==='All'||c.status===F.st)&&crmMatch(c,F.q));
  const chip=(v,label,n)=>`<button class="btn small${F.st===v?' primary':''}" onclick="S.crmF.st='${v}';renderCrm(S.cache.crm)">${label}${n!=null?' · '+n:''}</button>`;
  const focus=document.activeElement&&document.activeElement.id==='crmQ';
  $('main').innerHTML=`
  <div class="grid kpis">
    <div class="kpi"><span>Clients</span><b>${k.total}</b><small>${k.projects} projects</small></div>
    <div class="kpi"><span>Active</span><b style="color:var(--ok)">${k.active}</b><small>Work in progress</small></div>
    <div class="kpi"><span>Launched</span><b style="color:var(--brand2,#2f7d6d)">${k.launched}</b><small>Live stores</small></div>
    <div class="kpi"><span>On hold</span><b style="color:${k.hold?'var(--yel)':'var(--ink)'}">${k.hold}</b><small>${k.cancelled} cancelled</small></div>
  </div>
  <div class="card" style="padding:12px 16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px">
    <input id="crmQ" placeholder="Search client, store, account manager, project..." value="${esc(F.q)}" style="flex:1;min-width:220px" oninput="S.crmF.q=this.value;renderCrm(S.cache.crm)">
    <div style="display:flex;gap:6px;flex-wrap:wrap">${chip('All','All',k.total)}${chip('Active','Active',k.active)}${chip('Launched','Launched',k.launched)}${chip('On Hold','On hold',k.hold)}${chip('Cancelled','Cancelled',k.cancelled)}</div>
  </div>
  ${L.length?L.map(crmCard).join(''):`<div class="card empty"><b>${r.clients.length?'No clients match':'No clients yet'}</b>${r.clients.length?'Try another search or filter.':'A client shows up here once their brief has a project.'}</div>`}`;
  if(focus){ const q=$('crmQ'); q.focus(); q.setSelectionRange(q.value.length,q.value.length); }
}
function crmCard(c){
  const logo=c.thumb&&/^(data:image|https:)/.test(c.thumb)?`<img src="${esc(c.thumb)}" alt="">`:esc(initials(c.client||c.store||'?'));
  const facts=[
    ['Account Manager',esc(c.am||'—')],
    c.zid?['Zid store ID',`<span dir="ltr">${esc(c.zid)}</span>`]:null,
    c.contact?['Best time to call',esc(c.contact)]:null,
    ['Client since',c.since?new Date(c.since).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'—'],
    ['Brief',`${c.briefStatus==='done'?'Complete':'Draft · '+c.briefProgress+'%'} · <a href="javascript:void 0" onclick="go('briefs',{id:'${esc(c.id)}',back:{label:'Back to CRM',go:()=>go('crm')}})">Open brief</a>`],
    c.drive?['Drive',`<a href="${esc(c.drive)}" target="_blank" rel="noopener">Client folder</a>`]:null
  ].filter(Boolean);
  return `<div class="card crm">
    <div class="crm-h"><div class="crm-logo">${logo}</div>
      <div style="min-width:0"><h3>${esc(c.client||'—')} <span class="muted" style="font-weight:500">· ${esc(c.store||'—')}</span></h3>
      <div class="muted" style="font-size:13px">${c.projects.length} ${c.projects.length===1?'project':'projects'} · updated ${timeAgo(c.updated)}</div></div>
      <div class="spacer"></div><span class="pill ${CRM_ST[c.status]||'p-out'}">${esc(c.status)}</span></div>
    <div class="crm-b">
      <div class="crm-facts">${facts.map(f=>`<div class="kv"><b>${f[0]}</b><span>${f[1]}</span></div>`).join('')}</div>
      <div class="crm-projs">${c.projects.map(p=>`<button class="crm-p" onclick="goTo({view:'project',id:'${esc(p.id)}'})">
        <div class="row" style="gap:8px;align-items:center"><b>${esc(p.id)}</b><span class="muted">${esc(p.type)}</span><div class="spacer"></div><span class="pill ${CRM_ST[p.status]||'p-out'}">${esc(p.status)}</span></div>
        <div style="display:flex;align-items:center;gap:8px;margin:6px 0">${pbar(p.progress)}<b style="font-size:13px">${p.progress}%</b></div>
        <div class="muted" style="font-size:12.5px">${esc(p.platform)} · Start ${p.start?fmtDay(p.start):'—'} · ${p.go_live?'Live '+fmtDay(p.go_live):'Target '+(p.target?fmtDay(p.target):'—')}</div></button>`).join('')}</div>
    </div></div>`;
}
