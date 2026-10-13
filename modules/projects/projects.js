/* ============ المشاريع والتاسكات ============ */
const TSTAT = { 'Not Started':['p-out','Not Started'], 'In Progress':['p-prog','In Progress'], 'Done':['p-in','Done ✓'], 'N/A':['p-na','N/A'] };
const PSTAT = { 'Active':'p-in', 'On Hold':'p-absent', 'Launched':'p-prog', 'Cancelled':'p-out' };
const ROLE_ORDER = ['cp','sm','copy','uiux','designer','dev'];
const CP_TYPE = 'نقل كما هو';
const ROLE_T = { cp:'Store Transfer (Copy-Paste)', sm:'Store Manager', copy:'Copywriter', uiux:'UI/UX', designer:'Designer', dev:'Developer' };
S.skew = 0; S.pFilter = 'Active';

function fmtDay(v){ if(!v) return '—'; const d=new Date(v+'T12:00:00'); return isNaN(d)? v : d.toLocaleDateString('en-GB',{day:'numeric',month:'short'}); }
function liveSpan(t){ return `<span class="ttime" data-live data-total="${t.totalMs}" data-since="${t.running?t.runningSince:0}">${fmtDur(t.liveMs)}</span>`; }
function startTicks(){ tickAll(); }
function pbar(p){ return `<div class="pbar"><i style="width:${p}%"></i></div>`; }

/* ----- Projects list ----- */
S.cache={};
function busyTyping(){ const a=document.activeElement; return a && $('main').contains(a) && (a.tagName==='INPUT'||a.tagName==='TEXTAREA'); }
async function viewProjects(){
  S.proj=null; if(typeof navSave==='function') navSave();
  if(S.cache.plist) renderProjects(S.cache.plist); else $('main').innerHTML=LOADING;
  try{
    const r=await call('projList'); S.skew=Date.now()-r.now; S.cache.plist=r;
    if(S.view!=='projects' || S.proj) return;
    renderProjects(r,true);
  }catch(e){ if(!S.cache.plist) $('main').innerHTML=`<div class="card err">${esc(e.message)}</div>`; else toast(e.message); }
}
function renderProjects(r,keep){
  const y=window.scrollY;
  setTop('Projects', r.projects.length+' projects', (can('projects.manage_all')?'<button class="btn ghost" onclick="go(\'partners\')">Partners</button>':'')+(r.canCreate?'<button class="btn primary" onclick="projForm()">+ New Project</button>':''));
  {
    const P=r.projects, F=S.pFilter;
    const list=P.filter(p=>F==='all'||p.status===F);
    const active=P.filter(p=>p.status==='Active');
    $('main').innerHTML=`<div class="en">
    <div class="grid kpis">
      <div class="kpi"><b>${active.length}</b><span>Active projects</span></div>
      <div class="kpi"><b style="color:${active.some(p=>p.overdue)?'var(--bad)':'var(--brand)'}">${active.filter(p=>p.overdue).length}</b><span>Overdue</span></div>
      <div class="kpi"><b>${P.filter(p=>p.status==='Launched').length}</b><span>Launched</span></div>
      ${r.workload.length||r.running.length?`<div class="kpi"><b>${r.running.length}</b><span>Tasks running now</span></div>`:''}
    </div>
    ${r.running.length?`<div class="card" style="margin-bottom:16px"><h3>Running now</h3><div class="runlist">${r.running.map(x=>`<div class="runit"><b>${bd(x.name)}</b><span class="muted">${esc(x.task)}</span><span class="muted">· ${esc(x.client)}</span><span class="ttime" data-live data-total="0" data-since="${x.since}"></span></div>`).join('')}</div></div>`:''}
    ${r.workload.length?`<div class="card flush" style="margin-bottom:16px"><div class="chead"><h2>Team workload</h2><span class="muted" style="font-size:12.5px">Active projects each person still has work in · click a name for the details</span></div>
      ${r.workload.slice().sort((a,b)=>(b.active||0)-(a.active||0)||b.open-a.open).map(w=>`<button class="tm wl-row" onclick="wlOpen('${esc(w.u)}')"><div class="av" data-u="${esc(w.u)}">${esc(initials(w.name))}</div><div class="tx"><b>${bd(w.name)}</b> <span class="muted" style="font-size:12px">· ${esc(w.job||'')}</span><div>${(w.projects||[]).filter(p=>p.myPct<100).slice(0,3).map(p=>esc(p.client)).join(' · ')||'All parts done'}</div></div>
        <div class="nums"><b>${w.active||0} ${(w.active||0)===1?'project':'projects'}</b>${w.running?'<span style="color:var(--brand2)">● timer running</span>':''}</div></button>`).join('')}</div>`:''}
    <div class="flt">${[['Active','Active'],['On Hold','On Hold'],['Launched','Launched'],['Cancelled','Cancelled'],['all','All']].map(f=>`<button class="${F===f[0]?'on':''}" onclick="S.pFilter='${f[0]}';renderProjects(S.cache.plist)">${f[1]} <span>${f[0]==='all'?P.length:P.filter(p=>p.status===f[0]).length}</span></button>`).join('')}</div>
    ${list.length?`<div class="tbl-wrap"><table>
      <tr><th>Project</th><th>Client</th><th>Type</th><th>Account Manager</th><th>Start</th><th>Target Launch</th><th>Status</th><th style="min-width:150px">Progress</th><th>Hours</th></tr>
      ${list.map(p=>`<tr class="clk" onclick="viewProject('${esc(p.id)}')">
        <td><b>${esc(p.id)}</b></td><td><span class="pi-row">${piTag(p.id,p.client,'pi-sm')}<span>${esc(p.client)}</span></span>${p.blockers&&p.blockers.total?`<div style="margin-top:4px">${blBadge(p.blockers)}</div>`:''}</td><td>${esc(p.type)}</td><td>${esc(p.amName)||'—'}</td>
        <td>${fmtDay(p.start_date)}</td><td>${p.overdue?`<span class="pill p-bad">${fmtDay(p.target_launch)} · Overdue</span>`:fmtDay(p.target_launch)}</td>
        <td><span class="pill ${PSTAT[p.status]||'p-out'}">${esc(p.status)}</span></td>
        <td><div style="display:flex;align-items:center;gap:8px">${pbar(p.progress)}<span class="muted" style="font-size:12px">${p.progress}%</span></div></td>
        <td>${p.hours}</td></tr>`).join('')}
    </table></div>`:`<div class="card muted">No projects here.</div>`}</div>`;
    if(keep) window.scrollTo(0,y);
    startTicks();
  }
}

/* ----- Project page ----- */
async function viewProject(id,keep){
  const k='p:'+id, c=S.cache[k];
  S.proj={id}; if(typeof navSave==='function') navSave();
  if(c) renderProject(c,keep); else if(!keep) $('main').innerHTML=LOADING;
  try{
    const r=await call('projGet',{id}); S.skew=Date.now()-r.now; S.cache[k]=r;
    if(!S.proj || S.proj.id!==id) return;
    if(c && busyTyping()) return;
    renderProject(r,true);
  }catch(e){ if(!c) $('main').innerHTML=`<div class="card err">${esc(e.message)}</div>`; else toast(e.message); }
}
function renderProject(r,keep){
  S.kbTaskMap=(arguments[0]&&arguments[0].sops)||S.kbTaskMap;
  const y=window.scrollY;
  setTop(r.client, r.id+' · '+r.type);
  S.proj=r;
  {
    const backTo = S.view==='mytasks' ? ['viewMyTasks()','My Tasks'] : ['viewProjects()','All Projects'];
    const groups=ROLE_ORDER.map(role=>({role, tasks:r.tasks.filter(t=>t.role===role)})).filter(g=>g.tasks.length && (r.type!==CP_TYPE || g.tasks.some(t=>!t.na)));
    const links=r.tasks.filter(t=>t.link);
    const D=r.data;
    $('main').innerHTML=`<div class="en">
    <button class="btn ghost small" onclick="${backTo[0]}">← ${backTo[1]}</button>
    ${r.contract&&r.contract.status!=='signed'&&r.status==='Active'?`<div class="notice" style="margin:10px 0">${r.contract.status==='none'?'No contract on this project yet.':'The contract is not signed yet ('+esc(r.contract.status)+').'}${typeof canFinance==='function'&&can('finance.manage')||S.user.founder?` <button class="btn ghost small" onclick="${r.contract.id?`go('finance',{id:'${esc(r.contract.id)}'})`:`go('finance')`}">Open in Finance →</button>`:''}</div>`:''}
    <div class="card phead">
      <div class="row" style="align-items:center;gap:10px">${r.canEdit?`<button type="button" class="pi-btn" title="Change icon" aria-label="Change project icon" onclick="piEdit('${esc(r.id)}','${esc(r.client).replace(/'/g,'')}')">${piTag(r.id,r.client,'pi-lg')}</button>`:piTag(r.id,r.client,'pi-lg')}<h2 style="margin:0">${esc(r.client)}</h2><span class="pill p-out">${esc(r.id)}</span><span class="pill ${PSTAT[r.status]||'p-out'}">${esc(r.status)}</span>${r.blockers&&r.blockers.length?blBadge({open:r.blockers.filter(b=>b.status!=='Resolved').length,total:r.blockers.length,days:r.blockers.reduce((s,b)=>s+b.days,0)}):''}<div class="spacer"></div>
        ${r.brief_id?`<button class="btn ghost small" onclick="openBriefFrom('${esc(r.brief_id)}','${esc(r.id)}')">Open Brief</button>`:''}
        ${r.canEdit?`<button class="btn ghost small" onclick="projForm('${esc(r.id)}')">Edit Project</button><button class="btn ghost small" onclick="cpAdmin('${esc(r.id)}')">Client portal${r.clientPortal&&r.clientPortal.on?' ●':''}</button>`:''}
        ${r.isAdmin?`<button class="btn ghost small" style="color:var(--bad)" onclick="projDelete('${esc(r.id)}')">Delete</button>`:''}</div>
      <div class="pinfo">
        <div class="pbox"><h4>Store</h4>
          <div class="kv"><b>Type</b><span>${esc(r.type)}</span></div>
          <div class="kv"><b>Brand Identity</b><span>${esc(D.identity||'—')}</span></div>
          <div class="kv"><b>Platform</b><span>${esc(D.cur_platform||'—')} → ${esc(D.target_platform||'—')}</span></div>
          ${D.store_url?`<div class="kv"><b>Store</b><span><a href="${esc(D.store_url)}" target="_blank" rel="noopener">${esc(D.store_url)}</a></span></div>`:''}
          <div class="kv"><b>Start</b><span>${fmtDay(r.start_date)}</span></div>
          <div class="kv"><b>Target Launch</b><span>${r.overdue?`<span style="color:var(--bad);font-weight:600">${fmtDay(r.target_launch)} · Overdue</span>`:fmtDay(r.target_launch)}</span></div>
          ${r.go_live?`<div class="kv"><b>Go Live</b><span>${fmtDay(r.go_live)}</span></div>`:''}
          ${D.partner?`<div class="kv"><b>Partner</b><span><span class="pill p-prog">${esc(r.partnerName||D.partner)}</span> ${esc([D.partner_ref,D.priority,D.delivery_mode].filter(Boolean).join(' · '))}</span></div>`:''}
          ${D.referral_date?`<div class="kv"><b>Referral</b><span>${fmtDay(D.referral_date)}</span></div>`:''}
        </div>
        <div class="pbox"><h4>Team <span class="pill p-prog" style="margin-left:6px">${r.type===CP_TYPE?'Copy-Paste':esc(r.build_mode)}</span></h4>
          <div class="kv"><b>Account Manager</b><span>${esc(r.amName||'—')}</span></div>
          ${r.type===CP_TYPE?`<div class="kv"><b>Transfer (all tasks)</b><span>${bd(r.team.cp||'—')}</span></div>`:ROLE_ORDER.filter(k=>k!=='cp').map(k=>`<div class="kv"><b>${ROLE_T[k]}</b><span>${bd(r.team[k]||'—')}</span></div>`).join('')}
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">${pbar(r.progress)}<b style="font-size:14px">${r.progress}%</b><span class="muted" style="font-size:13px">${r.done}/${r.total} tasks · ${r.hours} h</span></div>
    </div>
    ${projAccessHTML(r)}
    ${projBlockersHTML(r)}
    ${D.partner||r.canEdit||(r.clientPortal&&r.clientPortal.on)?`<div id="pnBox">${pnHTML(r,S.pn&&S.pn[r.id])}</div>`:''}
    ${links.length?`<div class="card" style="margin-top:14px"><h3>Deliverables</h3><div class="links">${links.map(t=>oneUrl(t.link)?`<a href="${esc(t.link)}" target="_blank" rel="noopener" class="lnk"><b>${esc(t.linkLabel||t.title)}</b><span>${bd(t.assigneeName)}</span></a>`:`<div class="lnk lnk-t"><b>${esc(t.linkLabel||t.title)}</b><span>${bd(t.assigneeName)}</span><p dir="auto">${txtLinks(t.link)}</p></div>`).join('')}</div></div>`:''}
    ${groups.map(g=>{ const a=g.tasks.find(t=>t.assigneeName); const live=g.tasks.filter(t=>!t.na); const dn=live.filter(t=>t.status==='Done').length;
      return `<div class="card tgroup"><div class="tghead"><h3 style="margin:0">${ROLE_T[g.role]}</h3><span class="muted">${esc(a?a.assigneeName:'Unassigned')}</span><div class="spacer"></div><span class="muted" style="font-size:13px">${live.length?dn+'/'+live.length:'Not in scope'}</span></div>
      ${g.tasks.map(t=>taskRowHTML(t,r.id,r.me,r.isAdmin,r.canEdit)).join('')}</div>`; }).join('')}</div>`;
    if(keep) window.scrollTo(0,y);
    startTicks();
    if(D.partner||r.canEdit) pnLoad(r);
  }
}

// نص فيه لينكات: كل لينك بيبقى قابل للضغط، وكل سطر في مكانه
function txtLinks(v){ const L=String(v||'').split(/\r?\n/); const f=x=>esc(x).replace(/https?:\/\/[^\s<>"']+/gi,u=>`<a href="${u}" target="_blank" rel="noopener" dir="ltr">${u}</a>`); return L.length>1?L.map(x=>`<div ${bdd(x)}>${f(x)||'&nbsp;'}</div>`).join(''):(arDir(L[0])?`<bdi dir="rtl">${f(L[0])}</bdi>`:f(L[0])); }
const oneUrl=v=>/^https?:\/\/\S+$/i.test(String(v||'').trim());
function taskRowHTML(t,pid,me,isAdmin,canEdit){
  if(t.na) return `<div class="trow na"><div class="tmain"><div class="tt">${esc(t.title)}</div></div><div class="tside"><span class="pill p-na">N/A</span></div></div>`;
  const assigned=(t.assignees||[]).length>0;
  // اتنين على نفس التاسك: اللي اختار اسمه هو اللي ماسكها، والتاني بيشوفها بس
  const boss=isAdmin||canEdit, withOther=!!(t.multi && t.claim && t.claim!==me && !boss);
  const mine=assigned && ((t.assignees||[]).indexOf(me)>=0||isAdmin) && !withOther;
  const P=`'${esc(pid)}','${esc(t.key)}'`;
  // المشاركين: كل واحد ليه تايمر بتاعه، ومش بيغيّر الحالة
  const sopL=(S.kbTaskMap||{})[t.key], howTo=sopL&&!t.na?`<button class="tnbtn kb-how" onclick="kbOpen('${esc(sopL.id)}')" title="${esc(sopL.title)}">📘 How to</button>`:'';
  const HL=t.helperList||[], meH=HL.find(h=>h.u===me), helping=!!meH && (t.assignees||[]).indexOf(me)<0;
  const canHelpers=t.status!=='Done' && !(t.locked&&!HL.length) && !(t.multi && t.claim && t.claim!==me && !(isAdmin||canEdit)) && ((t.assignees||[]).indexOf(me)>=0||isAdmin||canEdit);
  const hLive=h=>`<span class="ttime" data-live data-total="${h.ms}" data-since="${h.since||0}">${fmtDur(h.ms+(h.since?Date.now()-(S.skew||0)-h.since:0))}</span>`;
  const helpersLine = HL.length||canHelpers ? `<div class="thelp">${HL.length?`<span class="muted">Helping:</span> ${HL.map(h=>`<span class="hchip${h.since?' on':''}">${bd(h.name)}${h.ms||h.since?' · '+hLive(h):''}</span>`).join('')}`:''}${canHelpers?`<button class="tnbtn" onclick="helpersEdit(${P})">${HL.length?'Edit helpers':'+ Add helpers'}</button>`:''}</div>` : '';
  const st=TSTAT[t.status]||TSTAT['Not Started'];
  const blocked=t.locked&&!isAdmin;
  let status;
  if(mine){
    status = `<select class="tstat ${st[0]}" ${blocked?'disabled title="Locked"':''} onchange="tStatus(${P},this)">${['Not Started','In Progress','Done'].map(o=>`<option value="${o}"${o===t.status?' selected':''}>${o}</option>`).join('')}</select>`;
  } else status = `<span class="pill ${st[0]}">${st[1]}</span>`;
  const lock = t.locked ? `<span class="pill p-lock">🔒 Locked</span>` : '';
  let timer='';
  if(helping && t.status!=='Done' && !(t.locked&&!isAdmin)){
    timer = meH.since ? `<button class="tb pause" onclick="tAct(${P},'hpause')">⏸ Stop my timer</button>` : `<button class="tb play" onclick="tAct(${P},'hstart')">▶ Start my timer</button>`;
  } else if(mine && t.status!=='Done' && !blocked){
    timer = t.running ? `<button class="tb pause" onclick="tAct(${P},'pause')">⏸ Stop Timer</button>` : `<button class="tb play" onclick="tAct(${P},'start')">▶ Start Timer</button>`;
  }
  const time = helping ? hLive(meH) : (t.liveMs||t.running) ? liveSpan(t) : (mine&&!blocked&&t.status!=='Done'?`<span class="ttime">00:00:00</span>`:'');
  if(helping) status = `<span class="pill p-prog" title="You are helping on this task">Helping</span> `+status;
  const dl = mine && t.status!=='Done'
    ? `<input type="date" class="tdl${t.late?' late':''}" value="${esc(t.deadline)}" title="Deadline" aria-label="Deadline" onchange="tAct(${P},'deadline',{deadline:this.value})">`
    : (t.deadline?`<span class="tdue${t.late?' late':''}">${t.late?'Overdue · ':'Due '}${fmtDay(t.deadline)}</span>`:'');
  const nk=pid+'|'+t.key, nOpen=S.openNotes.has(nk), nid='nt_'+(pid+'_'+t.key).replace(/[^a-z0-9_]/gi,'_');
  const notes = `<button class="tnbtn" onclick="toggleNotes('${esc(nk)}')">${nOpen?'▾':'▸'} Revisions${t.notes.length?' ('+t.notes.length+')':''}</button>`+
    (nOpen?`<div class="tnotes">${t.notes.length?t.notes.map(n=>`<div class="tnote"><span>${bd(n.by)} · ${new Date(n.at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span><div class="tn-t">${bdl(n.text)}</div></div>`).join(''):'<div class="muted" style="font-size:12.5px">No revisions yet.</div>'}
      <div class="tnadd"><input id="${nid}" dir="auto" maxlength="1000" placeholder="اكتب التعديل المطلوب أو اللي اتعمل"><button class="tb ghost" onclick="addNote(${P},'${nid}')">Add</button></div></div>`:'');
  const wl=t.waiting.slice(0,3).map(w=>esc(w.title)+(w.name?' ('+bd(w.name)+')':'')).join(', ')+(t.waiting.length>3?` +${t.waiting.length-3} more`:'');
  const wait = t.locked ? `<div class="twait">Waiting for: ${wl}</div>` : '';
  const P2=`'${esc(pid)}','${esc(t.key)}'`;
  const who = t.multi ? `<div class="tclaim"><span class="muted">${t.claim?'Working on it:':'Who\'s working on it?'}</span> ${(t.people||[]).map(x=>{ const on=t.claim===x.u, can=t.status!=='Done' && !t.running && (boss || (x.u===me && (!t.claim||t.claim===me))) ; return can?`<button type="button" class="cchip${on?' on':''}" title="${on?'Click to clear':'Click to pick'}" onclick="tClaim(${P2},'${on?'':esc(x.u)}')">${on?'✓ ':''}${bd(x.name)}</button>`:`<span class="cchip${on?' on':''}${t.claim&&!on?' off':''}">${on?'✓ ':''}${bd(x.name)}</span>`; }).join('')}</div>`
    : (t.assignees||[]).length>1 ? `<div class="twait">${bd(t.assigneeName)}</div>` : '';
  let link='';
  if(t.linkLabel){
    const id='lk_'+(pid+'_'+t.key).replace(/[^a-z0-9_]/gi,'_');
    link = mine
      ? `<div class="tlink tlink-ed"><span>${esc(t.linkLabel)}</span><div class="tl-box"><textarea id="${id}" rows="3" class="tl-in" dir="auto" placeholder="Links or text · Enter = new line" onkeydown="if((event.metaKey||event.ctrlKey)&&event.key==='Enter'){event.preventDefault();this.closest('.tlink').querySelector('button').click();}">${esc(t.link)}</textarea>${t.link&&/https?:\/\//i.test(t.link)?`<div class="tl-txt tl-prev" dir="auto">${txtLinks(t.link)}</div>`:''}</div><button class="tb ghost" onclick="tAct(${P},'link',{link:$('${id}').value})">Save</button></div>`
      : `<div class="tlink"><span>${esc(t.linkLabel)}</span>${t.link?`<span class="tl-txt" dir="auto">${txtLinks(t.link)}</span>`:'<span class="muted">Not yet</span>'}</div>`;
  }
  const refs=(t.refs||[]).map(r=>`<div class="tlink tref"><span>${esc(r.label)}</span>${r.url?`<a href="${esc(r.url)}" target="_blank" rel="noopener" dir="ltr">${esc(r.text||r.url)}</a>`:`<span class="tl-txt" dir="auto">${txtLinks(r.text||'')}</span>`}${r.copy?`<button type="button" class="btn ghost small tcopy" aria-label="Copy" onclick="event.stopPropagation();navigator.clipboard.writeText(this.dataset.v).then(()=>toast('اتنسخ'))" data-v="${esc(r.text||r.url)}">Copy</button>`:''}</div>`).join('');
  return `<div class="trow${withOther?' other':''}${t.locked?' locked':''}${t.running||(meH&&meH.since)?' running':''}${t.status==='Done'?' done':''}">
    <div class="tmain"><div class="tt">${esc(t.title)}${howTo}</div>${who}${helpersLine}${wait}${refs}${link}${notes}</div>
    <div class="tside">${lock}${dl}${status}<span class="tsep"></span>${time}${timer}</div></div>`;
}

S.openNotes=new Set();
function toggleNotes(k){ S.openNotes.has(k)?S.openNotes.delete(k):S.openNotes.add(k); rerender(); }
function addNote(pid,key,id){
  const el=$(id); const v=el?el.value.trim():''; if(!v) return; el.value='';
  // النوت ممكن تستنى لو النت فاصل
  callOrQueue('taskAct',{project:pid,key,act:'note',text:v},'Note on task').then(r=>{
    if(r && r.queued){ toast('النت فاصل. التعديل هيتبعت لوحده أول ما يرجع'); return; }
    toast('اتضاف التعديل ✓'); viewRefresh(pid);
  }).catch(e=>alert(e.message));
}
async function projDelete(id){
  if(!confirm('هيتمسح المشروع '+id+' نهائي، ومعاه كل تاسكاته والوقت المتسجل عليه. متأكد؟')) return;
  try{ await call('projDelete',{id}); toast('اتمسح المشروع ✓'); viewProjects(); }catch(e){ alert(e.message); }
}
function tStatus(pid,key,sel){
  const v=sel.value;
  if(v==='Done' && !confirm('متأكد إن التاسك دي خلصت؟')){ rerender(); return; }
  tAct(pid,key,'status',{status:v});
}
function viewRefresh(pid){ if(S.view==='mytasks' && !S.proj) viewMyTasks(true); else viewProject(pid,true); }
function curData(pid){ return (S.view==='mytasks' && !S.proj) ? S.cache.my : S.cache['p:'+pid]; }
function rerender(){ if(S.view==='mytasks' && !S.proj){ if(S.cache.my) renderMyTasks(S.cache.my,true); } else if(S.proj && S.cache['p:'+S.proj.id]) renderProject(S.cache['p:'+S.proj.id],true); }
function findTask(d,pid,key){
  if(!d) return null;
  const list = d.projects ? ((d.projects.find(p=>p.id===pid)||{}).tasks||[]) : (d.tasks||[]);
  return list.find(t=>t.key===key)||null;
}
// بيغيّر الشاشة على طول، والسيرفر بيتحدث في الخلفية
function applyLocal(t,action,extra){
  const now=Date.now()-S.skew;
  const stop=()=>{ if(t.running){ t.totalMs=(t.totalMs||0)+(now-t.runningSince); t.running=false; t.runningSince=0; t.liveMs=t.totalMs; } };
  if(action==='claim'){ t.claim=extra.who||''; const p=(t.people||[]).find(x=>x.u===t.claim); t.claimName=p?p.name:''; return; }
  if(action==='start' && t.multi && !t.claim && (t.assignees||[]).indexOf(S.user.username)>=0){ t.claim=S.user.username; }
  if(action==='start'){ if(!t.running){ t.running=true; t.runningSince=now; } if(t.status!=='In Progress') t.status='In Progress'; }
  else if(action==='deadline'){ t.deadline=extra.deadline; }
  else if(action==='pause') stop();
  else if(action==='status'||action==='force'){ t.status=extra.status; if(extra.status!=='In Progress') stop(); }
  else if(action==='link') t.link=extra.link;
  else if(action==='hstart'||action==='hpause'){ const h=(t.helperList||[]).find(x=>x.u===S.user.username); if(h){ if(action==='hstart'&&!h.since) h.since=now; if(action==='hpause'&&h.since){ h.ms+=now-h.since; h.since=0; } } }
}
function tClaim(pid,key,who){ tAct(pid,key,'claim',{who}); }
// إضافة/شيل المشاركين
async function helpersEdit(pid,key){
  const d=curData(pid), t=findTask(d,pid,key); if(!t) return;
  let opts=[]; try{ opts=await call('helperOptions',{project:pid}); }catch(e){ return alert(e.message); }
  let sel=(t.helperList||[]).map(h=>h.u);
  const draw=()=>{ const avail=opts.filter(o=>sel.indexOf(o.u)<0&&(t.assignees||[]).indexOf(o.u)<0);
    $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:480px">
      <h2 style="margin:0 0 4px">Helpers · ${esc(t.title)}</h2>
      <div class="muted" style="font-size:13px;margin-bottom:14px">Helpers see this task in their desk, log their own time and add notes. Only ${bd(t.assigneeName||'the owner')} can finish it.</div>
      <div class="hsel">${sel.length?sel.map(u=>{ const o=opts.find(x=>x.u===u)||{name:u}; return `<span class="hchip on">${bd(o.name)}<button type="button" aria-label="Remove" onclick="S.hsRm('${esc(u)}')">×</button></span>`; }).join(''):'<span class="muted">No helpers yet</span>'}</div>
      <div style="margin-top:12px"><label>Add a helper</label><select id="hsAdd"><option value="">Choose…</option>${avail.map(o=>`<option value="${esc(o.u)}">${esc(o.name)}${o.job?' · '+esc(o.job):''}</option>`).join('')}</select></div>
      <div class="mfoot"><button class="btn ghost" onclick="closeModal()">Cancel</button><div class="spacer"></div><button class="btn primary" id="hsSave">Save</button></div></div></div>`;
    pickify($('hsAdd'), avail);
    $('hsAdd').onchange=()=>{ const v=$('hsAdd').value; if(v&&sel.indexOf(v)<0){ if(sel.length>=6) return toast('أقصى عدد 6 مشاركين'); sel.push(v); draw(); } };
    $('hsSave').onclick=async()=>{ $('hsSave').disabled=true; closeModal(); await tAct(pid,key,'helpers',{helpers:sel}); toast('اتحفظ ✓'); };
  };
  S.hsRm=u=>{ sel=sel.filter(x=>x!==u); draw(); };
  draw();
}
S.pending=0;
async function tAct(pid,key,action,extra){
  extra=extra||{};
  const mode=(S.view==='mytasks' && !S.proj)?'my':'proj';
  const d=curData(pid), t=findTask(d,pid,key);
  if(t){ applyLocal(t,action,extra); rerender(); }
  S.pending++;
  try{
    const r=await call('taskAct',Object.assign({project:pid,key,act:action,ret:mode},extra));
    S.pending--;
    if(action==='link') toast('Link saved ✓');
    if(action==='note') toast('اتضاف التعديل ✓');
    if(r && typeof r==='object'){
      S.skew=Date.now()-r.now;
      if(mode==='my') S.cache.my=r; else S.cache['p:'+pid]=r;
      if(S.pending===0 && !busyTyping()) rerender();
    }
  }catch(e){ S.pending--; alert(e.message); viewRefresh(pid); }
}

/* ----- My Tasks ----- */
async function viewMyTasks(keep){
  S.proj=null;
  if(!keep) S.myTab='active'; // بتفتح دايماً على Active
  const c=S.cache.my;
  if(c) renderMyTasks(c,keep); else if(!keep) $('main').innerHTML=LOADING;
  try{
    const r=await call('myTasks'); S.skew=Date.now()-r.now; S.cache.my=r;
    if(S.view!=='mytasks' || S.proj) return;
    if(c && busyTyping()) return;
    renderMyTasks(r,true);
  }catch(e){ if(!c) $('main').innerHTML=`<div class="card err">${esc(e.message)}</div>`; else toast(e.message); }
}
// تبويبين: Active على الشمال و Launched بعيد على اليمين عشان مايتلخبطوش
function mtTabs(r){ const nl=S.cache.myl?S.cache.myl.projects.length:(r.launched||0);
  return `<div class="mt-tabs"><button type="button" class="${S.myTab!=='launched'?'on':''}" onclick="mtTab('active')">⚡ Active <span>${r.projects.length}</span></button><span class="sp"></span><button type="button" class="${S.myTab==='launched'?'on':''}" onclick="mtTab('launched')">🚀 Launched <span>${nl}</span></button></div>`; }
function mtTab(t){ S.myTab=t; window.scrollTo(0,0); if(t==='launched') viewLaunched(); else if(S.cache.my) renderMyTasks(S.cache.my); else viewMyTasks(); }
async function viewLaunched(all){
  const r=S.cache.my||{projects:[],launched:0};
  if(S.cache.myl && !all) renderLaunched(S.cache.myl); else $('main').innerHTML=`<div class="en">${mtTabs(r)}${LOADING}</div>`;
  try{ const d=await call('myLaunched',all?{all:true}:{}); d.all=!!all; S.cache.myl=d; if(S.view==='mytasks' && !S.proj && S.myTab==='launched') renderLaunched(d); }
  catch(e){ toast(e.message); }
}
S.mlOpen=new Set();
function mlToggle(id){ S.mlOpen.has(id)?S.mlOpen.delete(id):S.mlOpen.add(id); renderLaunched(S.cache.myl); }
function renderLaunched(d){
  const r=S.cache.my||{projects:[],launched:0};
  setTop('My Tasks', d.projects.length+' launched projects');
  const hm=ms=>{ const m=Math.round((ms||0)/6e4); return Math.floor(m/60)+'h '+String(m%60).padStart(2,'0')+'m'; };
  const card=p=>{ const open=S.mlOpen.has(p.id);
    return `<div class="lp-c"><div class="lp-h">${piTag(p.id,p.client)}<h3 dir="auto">${esc(p.client)}</h3><span class="pill p-out">${esc(p.id)}</span><span class="muted" style="font-size:13px">${esc(p.type)}</span><span class="sp"></span>
      <span class="pill p-in">🚀 Launched${p.goLive?' '+fmtDay(p.goLive):''}</span>${p.brief_id?`<button class="btn ghost small" onclick="openBriefFrom('${esc(p.brief_id)}','')">Brief</button>`:''}<button class="btn ghost small" onclick="mlToggle('${esc(p.id)}')">${open?'▾':'▸'} My tasks</button></div>
      <div class="lp-m"><span>My tasks: <b>${p.done} done</b>${p.tasks.length>p.done?` · ${p.tasks.length-p.done} not done`:''}</span><span>My time: <b>${hm(p.ms)}</b></span></div>
      ${open?`<div class="lp-t">${p.tasks.map(t=>`<div><span>${t.status==='Done'?'✓':'·'}</span><span>${esc(t.title)}${t.helping?' <span class="pill p-prog" style="font-size:10.5px">Helping</span>':''}</span><span>${hm(t.ms)}</span></div>`).join('')}</div>`:''}</div>`; };
  $('main').innerHTML=`<div class="en">${mtTabs(r)}
    ${d.projects.length?`<div class="lp">${d.projects.map(card).join('')}</div>`:'<div class="card muted">No launched projects yet.</div>'}
    ${!d.all&&d.older?`<div class="lp-more muted">Showing the last 3 months · <button class="btn ghost small" onclick="viewLaunched(true)">Show older (${d.older})</button></div>`:''}</div>`;
}
function renderMyTasks(r,keep){
  if(S.myTab==='launched'){ if(S.cache.myl) renderLaunched(S.cache.myl); return; }
  const y=window.scrollY; S.kbTaskMap=r.sops||S.kbTaskMap;
  setTop('My Tasks', r.projects.length+' active projects');
  {
    const all=r.projects.flatMap(p=>p.tasks);
    const rank=t=>(t.running||(t.helperList||[]).some(h=>h.u===r.me&&h.since))?0:(t.status==='Done'?4:t.withOther?3:(t.locked?2:1));
    if(!r.projects.some(p=>p.id===S.myProj)){ const run=r.projects.find(p=>p.tasks.some(t=>t.running)); S.myProj=(run||r.projects[0]||{}).id; }
    const sel=S.myProj;
    $('main').innerHTML=`<div class="en">
    <div class="grid kpis">
      <div class="kpi"><b>${all.filter(t=>t.status!=='Done'&&!t.withOther).length}</b><span>Open tasks</span></div>
      <div class="kpi"><b>${all.filter(t=>t.status!=='Done'&&!t.locked&&!t.withOther).length}</b><span>Ready to start</span></div>
      <div class="kpi"><b style="color:var(--accent)">${all.filter(t=>t.helping?(t.helperList||[]).some(h=>h.u===r.me&&h.since):t.running).length}</b><span>Running now</span></div>
    </div>
    ${mtTabs(r)}
    ${r.projects.length?`<div class="psel"><label for="mysel">Project</label><select id="mysel" onchange="S.myProj=this.value;renderMyTasks(S.cache.my)">${r.projects.map(p=>{ const open=p.tasks.filter(t=>t.status!=='Done').length, run=p.tasks.some(t=>t.running); return `<option value="${esc(p.id)}"${p.id===sel?' selected':''}>${run?'⏱ ':''}${esc(p.id)} · ${esc(p.client)} — ${open} open</option>`; }).join('')}</select></div>`:''}
    ${r.projects.length? r.projects.filter(p=>p.id===sel).map(p=>`
      <div class="card tgroup">
        <div class="tghead">${piTag(p.id,p.client)}<h3 style="margin:0">${esc(p.client)}</h3><span class="pill p-out">${esc(p.id)}</span>${p.status!=='Active'?`<span class="pill p-absent">${esc(p.status)}</span>`:''}<span class="muted" style="font-size:13px">${esc(p.type)} · Target ${fmtDay(p.target_launch)}</span><div class="spacer"></div>
          ${p.brief_id?`<button class="btn ghost small" onclick="openBriefFrom('${esc(p.brief_id)}','')">Brief</button>`:''}
          <button class="btn ghost small" onclick="viewProject('${esc(p.id)}')">Full Project</button></div>
        <div style="display:flex;align-items:center;gap:8px;margin:2px 0 6px">${pbar(p.progress)}<span class="muted" style="font-size:12px">${p.progress}% of project</span></div>
        ${p.links.length?`<div class="links sm">${p.links.map(l=>oneUrl(l.link)?`<a href="${esc(l.link)}" target="_blank" rel="noopener" class="lnk"><b>${esc(l.title)}</b><span>${bd(l.by)}</span></a>`:`<div class="lnk lnk-t"><b>${esc(l.title)}</b><span>${bd(l.by)}</span><p dir="auto">${txtLinks(l.link)}</p></div>`).join('')}</div>`:''}
        ${p.tasks.slice().sort((a,b)=>rank(a)-rank(b)).map(t=>taskRowHTML(t,p.id,r.me,false)).join('')}
      </div>`).join('') : '<div class="card muted">No tasks assigned to you right now.</div>'}</div>`;
    if(keep) window.scrollTo(0,y);
    startTicks();
  }
}

/* ----- Project form ----- */
function platMap(v){ v=String(v||'').toLowerCase().trim(); if(!v) return ''; if(/زد|zid/.test(v)) return 'Zid'; if(/سل[ةه]|salla/.test(v)) return 'Salla'; if(/shopify|شوبي/.test(v)) return 'Shopify'; if(/woo|ووكو/.test(v)) return 'WooCommerce'; return 'Other'; }
// المنصات: قايمة واحدة بتتعدل من السيستم (+ منصة جديدة من الفورم، والأدمن يغيّر الاسم أو يخفي من Settings)
function platOpts(list,v){ const L=list.slice(); if(v&&L.indexOf(v)<0) L.push(v); return `<option value="">—</option>`+L.map(o=>`<option value="${esc(o)}"${o===v?' selected':''}>${esc(o)}</option>`).join('')+`<option value="__new">+ New platform…</option>`; }
function platPick(v,L){ if(!v) return ''; if(L.indexOf(v)>=0) return v; const m=platMap(v); return L.indexOf(m)>=0?m:(L.indexOf('Other')>=0?'Other':''); }
function platBind(el,meta){ let last=el.value; el.addEventListener('change',async e=>{ if(el.value!=='__new'){ last=el.value; return; } e.stopImmediatePropagation();
  const name=(prompt('اسم المنصة الجديدة')||'').trim(); if(!name){ el.value=last; return; }
  try{ const r=await call('platformAdd',{name}); meta.platforms=r.platforms; document.querySelectorAll('#main select[data-plat]').forEach(s2=>{ const keep=s2===el?r.name:s2.value; s2.innerHTML=platOpts(meta.platforms,keep); s2.value=keep; }); last=r.name; el.dispatchEvent(new Event('change')); toast('اتضافت المنصة ✓'); }
  catch(err){ el.value=last; toast(err.message); } },true); }
function typeMap(v){ return v==='نقل متجر كما هو' ? 'نقل كما هو' : v; }
function calcLaunch(s){ const m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})$/); if(!m) return ''; const d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3])); d.setUTCDate(d.getUTCDate()-1); let c=0; while(c<7){ d.setUTCDate(d.getUTCDate()+1); if(d.getUTCDay()!==5) c++; } return d.toISOString().slice(0,10); }

async function projForm(id){
  setTop(id?'Edit '+id:'New Project','');
  $('main').innerHTML=LOADING;
  try{
    const meta=await call('projMeta');
    const bySlot=k=>{ const x=meta.team.find(t=>(t.slots||[]).indexOf(k)>=0); return x?x.u:''; };
    let d={ client:'', type:'', identity:'هوية موجودة', cur_platform:'', target_platform:'', store_url:'', store_id:'', start_date:new Date().toLocaleDateString('en-CA',{timeZone:'Africa/Cairo'}), status:'Active', build_mode:'UI/UX + Dev', brief_id:'', am:'', go_live:'',
      sm:bySlot('sm'), copy:bySlot('copy'), uiux:bySlot('uiux'), designer:bySlot('designer'), dev:bySlot('dev'), fe:bySlot('fe'), joker:bySlot('joker'), joker_role:'uiux' };
    if(id){ const r=await call('projGet',{id}); d=Object.assign(d,r.data); if(!d.joker) d.joker=bySlot('joker'); if(!d.joker_role) d.joker_role='uiux'; }
    const isAdmin=can('projects.manage_all');
    const PTN=meta.partners&&meta.partners.map?meta.partners.filter(p=>typeof p==='object'):[];
    const opt=(list,v,blank)=>(blank!==undefined?`<option value="">${blank}</option>`:'')+list.map(o=>{ const val=typeof o==='string'?o:o.u, lab=typeof o==='string'?o:o.name+(o.job?' · '+o.job:''); return `<option value="${esc(val)}"${val===v?' selected':''}>${esc(lab)}</option>`; }).join('');
    const teamSel=(k,label)=>{ const list=meta.team.filter(t=>(t.slots||[]).indexOf(k)>=0||t.u===d[k]);
      return `<div><label>${label}</label><select id="pf_${k}">${opt(list,d[k],'—')}</select></div>`; };
    $('main').innerHTML=`<div class="en">
    <button class="btn ghost small" onclick="${id?`viewProject('${esc(id)}')`:'viewProjects()'}">← Back</button>
    <div class="card pform">

      <div class="pfsec">
        <label>Brief</label>
        <select id="pf_brief_id"><option value="">No brief</option>${meta.briefs.map(b=>`<option value="${esc(b.id)}"${b.id===d.brief_id?' selected':''}>${esc(b.store||'—')}${b.status==='done'?'':' (draft)'}</option>`).join('')}</select>
        <div class="muted" style="font-size:12.5px;margin-top:6px">Picking a brief fills the client details, and the project team gets access to the brief automatically.</div>
      </div>
      <h3>Project Info</h3>
      <div class="pfgrid">
        <div><label>Client *</label><input id="pf_client" value="${esc(d.client)}"><div class="dupwarn hidden" id="pf_dup"></div></div>
        <div><label>Project Type *</label><select id="pf_type">${opt(meta.types,d.type,'Select...')}</select></div>
        <div><label>Brand Identity</label><select id="pf_identity">${opt(meta.identities,d.identity)}</select></div>
        <div><label>Status</label><select id="pf_status">${opt(meta.statuses,d.status)}</select></div>
        <div><label>Current Platform</label><select id="pf_cur_platform" data-plat>${platOpts(meta.platforms,d.cur_platform)}</select></div>
        <div><label>Target Platform</label><select id="pf_target_platform" data-plat>${platOpts(meta.platforms,d.target_platform)}</select></div>
        <div><label>Current Store URL</label><input id="pf_store_url" value="${esc(d.store_url)}" placeholder="https://"></div>
        <div><label>Store ID</label><input id="pf_store_id" value="${esc(d.store_id)}"></div>
        <div><label>Start Date</label><input type="date" id="pf_start_date" value="${esc(d.start_date)}"><div class="muted" style="font-size:12.5px;margin-top:4px">Target Launch: <b id="pf_tl">${fmtDay(calcLaunch(d.start_date))}</b></div></div>
        ${id?`<div><label>Go Live Date</label><input type="date" id="pf_go_live" value="${esc(d.go_live)}"></div>`:''}
        ${isAdmin?`<div><label>Account Manager</label><select id="pf_am">${opt(meta.ams,d.am,'—')}</select></div>`:''}
      </div>
      <h3>Partner</h3>
      <div class="pfgrid"><div><label>Referred by a partner?</label><select id="pf_partner"><option value="">No partner</option>${PTN.map(p=>`<option value="${esc(p.id)}"${p.id===d.partner?' selected':''}>${esc(p.name)} · ${esc(p.nameEn)}</option>`).join('')}${d.partner&&!PTN.some(p=>p.id===d.partner)?`<option value="${esc(d.partner)}" selected>${esc(d.partner)} (stopped)</option>`:''}</select>
        <div class="ptn-sug hidden" id="pf_ptn_sug"></div></div></div>
      <div class="muted m-partner${d.partner?'':' hidden'}" style="font-size:12.5px;margin:-4px 0 8px">The store shows in this partner's portal.</div>
      <div class="pfgrid m-partner${d.partner?'':' hidden'}">
        <div><label>Partner Project ID</label><input id="pf_partner_ref" value="${esc(d.partner_ref||'')}" placeholder="Auto" dir="ltr"></div>
        <div><label>Referral Date</label><input type="date" id="pf_referral_date" value="${esc(d.referral_date||'')}"></div>
        <div><label>Priority</label><select id="pf_priority">${opt(meta.priorities||[],d.priority||'Normal')}</select></div>
        <div><label>Delivery Mode</label><select id="pf_delivery_mode">${opt(meta.deliveryModes||[],d.delivery_mode||'Professional Build')}</select></div>
        <div><label>Live Domain</label><input id="pf_live_domain" value="${esc(d.live_domain||'')}" placeholder="https://" dir="ltr"></div>
      </div>
      <h3>Team</h3>
      <div class="pfgrid m-cp">
        <div><label>Responsible for the transfer *</label><select id="pf_cp">${opt(meta.team,d.cp,'Select...')}</select></div>
        <div><label>Helper (optional)</label><select id="pf_cp2">${opt(meta.team,d.cp2,'—')}</select></div>
      </div>
      <div class="muted m-cp" style="font-size:12.5px;margin-top:6px">Copy-paste transfer: this person gets every task (store &amp; data, design, content, core dev, domain, tests). All tasks are open from day one, in any order. The helper can work on the same tasks.</div>
      <div class="pfgrid m-team">
        <div><label>Build Mode</label><select id="pf_build_mode">${opt(meta.modes,d.build_mode)}</select></div>
        ${teamSel('sm','Store Manager')}${teamSel('copy','Copywriter')}${teamSel('designer','Designer')}
        <div class="m-split">${teamSel('uiux','UI/UX')}</div><div class="m-split">${teamSel('dev','Developer')}</div>
        <div class="m-fe">${teamSel('fe','Front End (UI/UX + Dev)')}</div>
        <div class="m-joker">${teamSel('joker','Joker')}</div>
        <div class="m-joker"><label>Joker helps with</label><select id="pf_joker_role"><option value="uiux"${d.joker_role==='uiux'?' selected':''}>UI/UX</option><option value="dev"${d.joker_role==='dev'?' selected':''}>Developer</option></select></div>
      </div>
      <div class="muted m-joker m-team" style="font-size:12.5px;margin-top:6px">The Joker shares the selected role's tasks with the main person. Either of them can start and finish them.</div>
      <div class="err" id="pf_err"></div>
      <div class="mfoot"><button class="btn" id="pf_save">${id?'Save':'Create Project'}</button></div>
    </div></div>`;
    const mode=()=>{ const m=$('pf_build_mode').value, cp=$('pf_type').value===CP_TYPE;
      document.querySelectorAll('.m-cp').forEach(e=>e.classList.toggle('hidden',!cp));
      document.querySelectorAll('.m-team').forEach(e=>e.classList.toggle('hidden',cp));
      document.querySelectorAll('.m-split').forEach(e=>e.classList.toggle('hidden',m==='Front End'));
      document.querySelectorAll('.m-fe').forEach(e=>e.classList.toggle('hidden',m!=='Front End'));
      document.querySelectorAll('.m-joker').forEach(e=>e.classList.toggle('hidden',cp||m!=='Joker')); };
    document.querySelectorAll('#main select[data-plat]').forEach(el=>platBind(el,meta));
    $('pf_build_mode').onchange=mode; $('pf_type').addEventListener('change',mode); mode();
    // الشريك: لما يتختار يظهر المرجع الجاي، ولما المنصة المستهدفة تبقى منصة شريك نقترحه (من غير ما نختاره لوحدنا)
    const ptnSet=()=>{ const v=$('pf_partner').value, p=PTN.find(x=>x.id===v);
      document.querySelectorAll('.m-partner').forEach(e=>e.classList.toggle('hidden',!v));
      if(p && !d.partner_ref) $('pf_partner_ref').placeholder=p.nextRef||'Auto';
      if(v && !$('pf_referral_date').value && !id) $('pf_referral_date').value=new Date().toLocaleDateString('en-CA',{timeZone:'Africa/Cairo'});
      ptnSug(); };
    const ptnSug=()=>{ const el=$('pf_ptn_sug'), pl=$('pf_target_platform').value, p=!$('pf_partner').value&&PTN.find(x=>x.platform&&x.platform===pl);
      el.classList.toggle('hidden',!p); el.innerHTML=p?`Is this store referred by <b>${esc(p.name)}</b>? <button type="button" class="btn small" id="pf_ptn_yes">Yes, pick ${esc(p.nameEn)}</button>`:'';
      if(p) $('pf_ptn_yes').onclick=()=>{ $('pf_partner').value=p.id; ptnSet(); }; };
    $('pf_partner').onchange=ptnSet; $('pf_target_platform').addEventListener('change',ptnSug); if(d.partner) ptnSet(); else ptnSug();
    ['cp','cp2','sm','copy','designer','uiux','dev','fe','joker','am'].forEach(k=>pickify($('pf_'+k), k==='am'?meta.ams.map(a=>Object.assign({job:'Account Manager'},meta.team.find(t=>t.u===a.u)||{},a)):meta.team));
    const normName=v=>String(v||'').toLowerCase().replace(/[\u064B-\u065F\u0670\u0640\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g,'').replace(/[\s\-_–—.]+/g,'');
    const dupCheck=()=>{ const v=normName($('pf_client').value), list=(S.cache.plist&&S.cache.plist.projects)||[];
      const hit=v&&list.find(p=>p.id!==(id||'')&&normName(p.client)===v);
      $('pf_dup').textContent=hit?'فيه مشروع بنفس الاسم ده بالفعل ('+hit.id+'). اختار اسم تاني':''; $('pf_dup').classList.toggle('hidden',!hit); };
    $('pf_client').addEventListener('input',dupCheck);
    $('pf_start_date').oninput=()=>{ $('pf_tl').textContent=fmtDay(calcLaunch($('pf_start_date').value)); };
    $('pf_brief_id').onchange=()=>{
      const b=meta.briefs.find(x=>x.id===$('pf_brief_id').value); if(!b) return;
      const set=(k,v)=>{ if(v) $('pf_'+k).value=v; };
      set('client',b.store); dupCheck(); set('type',typeMap(b.f.project_type)); mode(); set('cur_platform',platPick(b.f.current_platform,meta.platforms)); set('target_platform',platPick(b.f.target_platform,meta.platforms));
      set('store_url',b.f.store_url); set('store_id',b.f.zid_id);
      if(b.f.partner){ const p=PTN.find(x=>x.name===b.f.partner||x.nameEn===b.f.partner); if(p){ $('pf_partner').value=p.id; $('pf_partner').onchange(); } }
      $('pf_target_platform').dispatchEvent(new Event('change'));
      if(b.f.logo_plan) $('pf_identity').value = b.f.logo_plan==='لوجو جديد' ? 'هوية جديدة' : 'هوية موجودة';
      if($('pf_am')){ const a=meta.ams.find(x=>x.u===b.owner); if(a) $('pf_am').value=a.u; }
      pkSyncAll(); toast('Filled from the brief');
    };
    $('pf_save').onclick=async()=>{
      $('pf_err').textContent=''; $('pf_save').disabled=true;
      const g=k=>{ const el=$('pf_'+k); return el? el.value : (d[k]||''); };
      const data={ id:id||'' }; ['client','type','identity','status','cur_platform','target_platform','store_url','store_id','start_date','go_live','am','brief_id','build_mode','sm','copy','designer','uiux','dev','fe','joker','joker_role','cp','cp2'].forEach(k=>data[k]=g(k)); data.partner=$('pf_partner').value; ['partner_ref','referral_date','priority','delivery_mode','live_domain'].forEach(k=>data[k]=g(k));
      try{ const r=await call('projSave',{project:data}); toast(id?'Saved ✓':'Project '+r.id+' created ✓'); viewProject(r.id); }
      catch(e){ $('pf_err').textContent=e.message; $('pf_save').disabled=false; }
    };
  }catch(e){ $('main').innerHTML=`<div class="card err">${esc(e.message)}</div>`; }
}

/* ----- أكسيس العميل في صفحة المشروع (للي مسموحله بس) ----- */
// الباسورد بيتجاب من السيرفر لما حد يدوس Show أو Copy، وكل مرة بتتسجل
function projAccessHTML(r){
  if(!r.access) return '';
  return `<div class="card flush" style="margin-bottom:20px"><div class="chead"><span style="color:var(--brand2)">${ico('device',18)}</span><h2>Client access</h2><span class="muted" style="font-size:12.5px">Every password you reveal is logged</span></div>
    ${r.access.length?`<div class="tbl-wrap" style="border:0"><table class="pacc" style="min-width:640px"><colgroup><col style="width:26%"><col style="width:37%"><col style="width:37%"></colgroup><tr><th>Account</th><th>Username / email</th><th>Password</th></tr>
    ${r.access.map(a=>`<tr><td><b>${esc(a.label)}</b>${a.l?`<div class="sub2"><a href="${esc(/^https?:/i.test(a.l)?a.l:'https://'+a.l)}" target="_blank" rel="noopener" dir="ltr">${esc(a.l)}</a></div>`:''}</td>
      <td dir="ltr">${a.u?`<div class="pacc-v"><span class="v" title="${esc(a.u)}">${esc(a.u)}</span><button class="btn small ghost" data-cu="${esc(a.u)}" onclick="navigator.clipboard.writeText(this.dataset.cu).then(()=>toast('اتنسخ'))">Copy</button></div>`:'—'}</td>
      <td dir="ltr">${a.pSet?`<div class="pacc-v"><span class="v mono" id="pw_${a.key}">••••••••</span><button class="btn small ghost" onclick="paReveal('${esc(r.data.id)}','${a.key}',false,this)">Show</button><button class="btn small ghost" onclick="paReveal('${esc(r.data.id)}','${a.key}',true)">Copy</button></div>`:'—'}</td></tr>`).join('')}</table></div>`
    :`<div class="empty" style="padding:16px">No access saved in the brief yet.</div>`}</div>`;
}
async function paReveal(pid,key,copyIt,btn){
  const el=$('pw_'+key);
  try{
    if(!el.dataset.v) el.dataset.v=(await call('accessReveal',{project:pid,key})).p||'';
    if(copyIt){ await navigator.clipboard.writeText(el.dataset.v); toast('اتنسخ'); }
    else { const show=el.textContent.startsWith('••'); el.textContent = show ? el.dataset.v : '••••••••'; el.title = show ? el.dataset.v : ''; if(btn) btn.textContent = show ? 'Hide' : 'Show'; }
  }catch(e){ toast(e.message); }
}

// فتح البريف من المشروع أو من My Tasks، وزرار الرجوع في البريف يرجّع لنفس المكان
function openBriefFrom(briefId, projId){
  const back = projId ? { label:'Back to '+projId, go:()=>goTo({view:'project',id:projId}) }
                      : { label:'Back to My Tasks', go:()=>go('mytasks') };
  go('briefs',{id:briefId, back});
}

// تفاصيل شغل الموظف: المشاريع اللي هو فيها، ونسبة الجزء بتاعه ونسبة المشروع كله
function wlOpen(un){
  const w=((S.cache.plist||{}).workload||[]).find(x=>x.u===un); if(!w) return;
  const P=w.projects||[];
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:560px">
    <div class="row" style="align-items:center;gap:12px"><div class="av" data-u="${esc(w.u)}">${esc(initials(w.name))}</div><div><h2 style="margin:0;font-size:18px">${bd(w.name)}</h2><div class="muted" style="font-size:13px">${esc(w.job||'')} · ${w.active||0} active ${(w.active||0)===1?'project':'projects'} · ${w.open} open tasks</div></div><div class="spacer"></div><button class="btn ghost small" onclick="closeModal()">Close</button></div>
    <div style="display:grid;gap:8px;margin-top:16px">${P.length?P.map(p=>`<button class="wl-proj" onclick="closeModal();goTo({view:'project',id:'${esc(p.id)}'})">
      <div class="row" style="align-items:center;gap:8px">${piTag(p.id,p.client,'pi-sm')}<b>${esc(p.client)}</b><span class="muted" style="font-size:12.5px">${esc(p.id)} · ${esc(p.type||'')}</span><div class="spacer"></div>${p.myPct===100?'<span class="pill p-in">Your part done</span>':p.running?'<span class="pill p-prog">Timer running</span>':''}</div>
      <div class="wl-bars"><span class="muted">Their part</span>${pbar(p.myPct)}<b>${p.myPct}%</b><span class="muted">${p.done}/${p.total} tasks</span></div>
      <div class="wl-bars"><span class="muted">Whole project</span>${pbar(p.projPct)}<b>${p.projPct}%</b><span></span></div></button>`).join(''):'<div class="muted">No active projects.</div>'}</div></div></div>`;
}

/* ----- تحديثات الشريك (زد) على المشروع ----- */
// بتظهر في بورتال زد تحت «آخر التحديثات» مع التحديثات التلقائية
const PN_TO={partner:'Partner',client:'Client',both:'Partner + client'};
function pnHTML(r,list){
  const D=r.data||{}, hasP=!!D.partner;
  const who=hasP?`${esc(r.partnerName||'the partner')} and/or the client`:'the client';
  return `<div class="card" style="margin-top:14px"><div class="row" style="align-items:center;gap:8px"><h3 style="margin:0">Updates <span class="muted" style="font-weight:500;font-size:13px">· shown to ${who} in their portal</span></h3></div>
    ${r.canEdit?`<div class="pn-form"><textarea id="pnT" rows="2" placeholder="اكتب تحديث… (مثلاً: تم إرسال التصميم للمراجعة)" dir="auto"></textarea><input id="pnN" placeholder="الخطوة الجاية (اختياري)" dir="auto">
      <select id="pnTo" aria-label="Who sees it">${(hasP?['partner','client','both']:['client']).map(k=>`<option value="${k}">${PN_TO[k]}</option>`).join('')}</select><button class="btn primary" onclick="pnAdd('${esc(r.id)}')">Post update</button></div>`:''}
    ${list===undefined?'<div class="muted" style="padding:8px 0">Loading...</div>':list.length?list.map(n=>`<div class="pn-row"><div class="pn-h"><b>${bd(n.by)}</b><span class="pill p-out" style="font-size:11px">${PN_TO[n.to]||'Partner'}</span><span class="muted">${new Date(n.at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})}</span>${n.mine||can('projects.manage_all')?`<button class="btn ghost small" onclick="pnDel('${esc(n.id)}','${esc(r.id)}')">Delete</button>`:''}</div><div  style="white-space:normal">${bdl(n.text)}</div>${n.next?`<div class="muted" dir="rtl" style="font-size:13px">الخطوة الجاية: ${bd(n.next)}</div>`:''}</div>`).join(''):'<div class="muted" style="padding:8px 0;font-size:13.5px">No updates yet. Stage changes and blockers already show in the portals automatically.</div>'}</div>`;
}
function pnPut(r,list){ S.pn=S.pn||{}; S.pn[r.id]=list; const el=$('pnBox'); if(el && S.proj && S.proj.id===r.id) el.innerHTML=pnHTML(r,list); }
function pnLoad(r){ call('partnerNotes',{project:r.id}).then(l=>pnPut(r,l)).catch(()=>{}); }
async function pnAdd(id){ const t=$('pnT').value.trim(), n=$('pnN').value.trim(); if(t.length<3){ toast('اكتب التحديث'); return; }
  try{ const l=await call('partnerNoteAdd',{project:id,text:t,next:n,to:$('pnTo')?$('pnTo').value:''}); pnPut(S.proj,l); toast('اتنشر ✓'); }catch(e){ alert(e.message); } }

/* ----- بورتال العميل (لينك + يوزر وباسورد للمشروع ده) ----- */
async function cpAdmin(pid,extra){
  try{ const r=await call('clientPortalAdmin',Object.assign({project:pid},extra||{})); S.cpAdm=r; cpAdminRender(); if(extra&&extra.regen) toast('اتعمل لينك جديد'); }catch(e){ alert(e.message); }
}
function cpAdminRender(){
  const r=S.cpAdm, url=location.origin+location.pathname.replace(/[^/]*$/,'')+'client.html?k='+r.key;
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:580px">
    <h2 style="margin:0 0 6px">Client portal · ${esc(r.client)}</h2>
    <p class="muted" style="margin:0 0 14px;font-size:13.5px">The client sees their store only: stages, what we need from them, updates you post for the client, and their payments. No team names, phone numbers or internal notes.</p>
    <label class="pf-chk"><input type="checkbox" id="cpOn"${r.enabled?' checked':''} onchange="cpAdmin('${esc(r.project)}',{enable:this.checked})"> Portal is on</label>
    <div class="pt-link" style="margin-top:10px"><input readonly value="${esc(url)}" dir="ltr" onclick="this.select()" aria-label="Client portal link"><button class="btn primary" onclick="navigator.clipboard.writeText('${esc(url)}').then(()=>toast('اتنسخ اللينك'))">Copy</button></div>
    <h3 style="margin:18px 0 6px;font-size:15px">Client sign-in</h3>
    <div class="muted" style="font-size:13px;margin-bottom:8px">${r.user&&r.hasPass?`Current username: <b dir="ltr">${esc(r.user)}</b>. Saving a new password signs the client out.`:'<span style="color:var(--bad)">No username yet. The client cannot sign in until you set one.</span>'}</div>
    <div class="row" style="gap:8px;flex-wrap:wrap">
      <input id="cpU" placeholder="Username or client email" dir="ltr" autocomplete="off" value="${esc(r.user||'')}" style="flex:1 1 180px" aria-label="Client username">
      <input id="cpP" type="password" placeholder="Password (8+)" dir="ltr" autocomplete="new-password" style="flex:1 1 150px" aria-label="Client password">
      <button class="btn" onclick="const i=$('cpP');i.type=i.type==='password'?'text':'password'">Show</button>
      <button class="btn primary" onclick="cpCreds()">Save</button>
    </div>
    <div class="mfoot"><button class="btn ghost danger" onclick="if(confirm('اللينك القديم هيقف والعميل محتاج اللينك الجديد. متأكد؟')) cpAdmin('${esc(r.project)}',{regen:true})">New link</button><div class="spacer"></div><a class="btn" href="${esc(url)}" target="_blank" rel="noopener">Open portal</a><button class="btn ghost" onclick="closeModal()">Close</button></div></div></div>`;
}
async function cpCreds(){
  const user=$('cpU').value.trim(), pass=$('cpP').value;
  if(!user||!pass) return alert('اكتب اليوزر والباسورد');
  await cpAdmin(S.cpAdm.project,{setCreds:true,user,pass}); toast('اتحفظ ✓');
}
async function pnDel(nid,id){ if(!confirm('تمسح التحديث ده من البورتال؟')) return; try{ const l=await call('partnerNoteDelete',{id:nid}); pnPut(S.proj,l); }catch(e){ alert(e.message); } }
