/* ============ المشاريع والتاسكات ============ */
const TSTAT = { 'Not Started':['p-out','Not Started'], 'In Progress':['p-prog','In Progress'], 'Done':['p-in','Done ✓'], 'N/A':['p-na','N/A'] };
const PSTAT = { 'Active':'p-in', 'On Hold':'p-absent', 'Launched':'p-prog', 'Cancelled':'p-out' };
const ROLE_ORDER = ['sm','copy','uiux','designer','dev'];
const ROLE_T = { sm:'Store Manager', copy:'Copywriter', uiux:'UI/UX', designer:'Designer', dev:'Developer' };
S.skew = 0; S.pFilter = 'Active';

function fmtDay(v){ if(!v) return '—'; const d=new Date(v+'T12:00:00'); return isNaN(d)? v : d.toLocaleDateString('en-GB',{day:'numeric',month:'short'}); }
function liveSpan(t){ return `<span class="ttime" data-live data-total="${t.totalMs}" data-since="${t.running?t.runningSince:0}">${fmtDur(t.liveMs)}</span>`; }
function startTicks(){ tickAll(); }
function pbar(p){ return `<div class="pbar"><i style="width:${p}%"></i></div>`; }

/* ----- Projects list ----- */
S.cache={};
function busyTyping(){ const a=document.activeElement; return a && $('main').contains(a) && (a.tagName==='INPUT'||a.tagName==='TEXTAREA'); }
async function viewProjects(){
  S.proj=null;
  if(S.cache.plist) renderProjects(S.cache.plist); else $('main').innerHTML=LOADING;
  try{
    const r=await call('projList'); S.skew=Date.now()-r.now; S.cache.plist=r;
    if(S.view!=='projects' || S.proj) return;
    renderProjects(r,true);
  }catch(e){ if(!S.cache.plist) $('main').innerHTML=`<div class="card err">${esc(e.message)}</div>`; else toast(e.message); }
}
function renderProjects(r,keep){
  const y=window.scrollY;
  setTop('Projects', r.projects.length+' projects', r.canCreate?'<button class="btn primary" onclick="projForm()">+ New Project</button>':'');
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
    ${r.workload.length?`<div class="card" style="margin-bottom:16px"><h3>Team workload (active projects)</h3><div class="tbl-wrap" style="border:0"><table style="min-width:420px"><tr><th>Name</th><th>Open</th><th>Ready to start</th><th>Running</th></tr>
      ${r.workload.sort((a,b)=>b.open-a.open).map(w=>`<tr><td><b>${bd(w.name)}</b></td><td>${w.open}</td><td>${w.ready}</td><td>${w.running?`<span class="pill p-run">${w.running}</span>`:'0'}</td></tr>`).join('')}</table></div></div>`:''}
    <div class="flt">${[['Active','Active'],['On Hold','On Hold'],['Launched','Launched'],['Cancelled','Cancelled'],['all','All']].map(f=>`<button class="${F===f[0]?'on':''}" onclick="S.pFilter='${f[0]}';renderProjects(S.cache.plist)">${f[1]} <span>${f[0]==='all'?P.length:P.filter(p=>p.status===f[0]).length}</span></button>`).join('')}</div>
    ${list.length?`<div class="tbl-wrap"><table>
      <tr><th>Project</th><th>Client</th><th>Type</th><th>Account Manager</th><th>Start</th><th>Target Launch</th><th>Status</th><th style="min-width:150px">Progress</th><th>Hours</th></tr>
      ${list.map(p=>`<tr class="clk" onclick="viewProject('${esc(p.id)}')">
        <td><b>${esc(p.id)}</b></td><td>${esc(p.client)}${p.blockers&&p.blockers.total?`<div style="margin-top:4px">${blBadge(p.blockers)}</div>`:''}</td><td>${esc(p.type)}</td><td>${esc(p.amName)||'—'}</td>
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
  S.proj={id};
  if(c) renderProject(c,keep); else if(!keep) $('main').innerHTML=LOADING;
  try{
    const r=await call('projGet',{id}); S.skew=Date.now()-r.now; S.cache[k]=r;
    if(!S.proj || S.proj.id!==id) return;
    if(c && busyTyping()) return;
    renderProject(r,true);
  }catch(e){ if(!c) $('main').innerHTML=`<div class="card err">${esc(e.message)}</div>`; else toast(e.message); }
}
function renderProject(r,keep){
  const y=window.scrollY;
  setTop(r.client, r.id+' · '+r.type);
  S.proj=r;
  {
    const backTo = S.view==='mytasks' ? ['viewMyTasks()','My Tasks'] : ['viewProjects()','All Projects'];
    const groups=ROLE_ORDER.map(role=>({role, tasks:r.tasks.filter(t=>t.role===role)})).filter(g=>g.tasks.length);
    const links=r.tasks.filter(t=>t.link);
    const D=r.data;
    $('main').innerHTML=`<div class="en">
    <button class="btn ghost small" onclick="${backTo[0]}">← ${backTo[1]}</button>
    <div class="card phead">
      <div class="row" style="align-items:center;gap:10px"><h2 style="margin:0">${esc(r.client)}</h2><span class="pill p-out">${esc(r.id)}</span><span class="pill ${PSTAT[r.status]||'p-out'}">${esc(r.status)}</span>${r.blockers&&r.blockers.length?blBadge({open:r.blockers.filter(b=>b.status!=='Resolved').length,total:r.blockers.length,days:r.blockers.reduce((s,b)=>s+b.days,0)}):''}<div class="spacer"></div>
        ${r.brief_id?`<button class="btn ghost small" onclick="openBriefFrom('${esc(r.brief_id)}','${esc(r.id)}')">Open Brief</button>`:''}
        ${r.canEdit?`<button class="btn ghost small" onclick="projForm('${esc(r.id)}')">Edit Project</button>`:''}
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
        </div>
        <div class="pbox"><h4>Team <span class="pill p-prog" style="margin-left:6px">${esc(r.build_mode)}</span></h4>
          <div class="kv"><b>Account Manager</b><span>${esc(r.amName||'—')}</span></div>
          ${ROLE_ORDER.map(k=>`<div class="kv"><b>${ROLE_T[k]}</b><span>${bd(r.team[k]||'—')}</span></div>`).join('')}
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">${pbar(r.progress)}<b style="font-size:14px">${r.progress}%</b><span class="muted" style="font-size:13px">${r.done}/${r.total} tasks · ${r.hours} h</span></div>
    </div>
    ${projAccessHTML(r)}
    ${projBlockersHTML(r)}
    ${links.length?`<div class="card" style="margin-top:14px"><h3>Deliverables</h3><div class="links">${links.map(t=>`<a href="${esc(t.link)}" target="_blank" rel="noopener" class="lnk"><b>${esc(t.linkLabel||t.title)}</b><span>${bd(t.assigneeName)}</span></a>`).join('')}</div></div>`:''}
    ${groups.map(g=>{ const a=g.tasks.find(t=>t.assigneeName); const live=g.tasks.filter(t=>!t.na); const dn=live.filter(t=>t.status==='Done').length;
      return `<div class="card tgroup"><div class="tghead"><h3 style="margin:0">${ROLE_T[g.role]}</h3><span class="muted">${esc(a?a.assigneeName:'Unassigned')}</span><div class="spacer"></div><span class="muted" style="font-size:13px">${live.length?dn+'/'+live.length:'Not in scope'}</span></div>
      ${g.tasks.map(t=>taskRowHTML(t,r.id,r.me,r.isAdmin)).join('')}</div>`; }).join('')}</div>`;
    if(keep) window.scrollTo(0,y);
    startTicks();
  }
}

function taskRowHTML(t,pid,me,isAdmin){
  if(t.na) return `<div class="trow na"><div class="tmain"><div class="tt">${esc(t.title)}</div></div><div class="tside"><span class="pill p-na">N/A</span></div></div>`;
  const assigned=(t.assignees||[]).length>0;
  const mine=assigned && ((t.assignees||[]).indexOf(me)>=0||isAdmin);
  const P=`'${esc(pid)}','${esc(t.key)}'`;
  const st=TSTAT[t.status]||TSTAT['Not Started'];
  const blocked=t.locked&&!isAdmin;
  let status;
  if(mine){
    status = `<select class="tstat ${st[0]}" ${blocked?'disabled title="Locked"':''} onchange="tStatus(${P},this)">${['Not Started','In Progress','Done'].map(o=>`<option value="${o}"${o===t.status?' selected':''}>${o}</option>`).join('')}</select>`;
  } else status = `<span class="pill ${st[0]}">${st[1]}</span>`;
  const lock = t.locked ? `<span class="pill p-lock">🔒 Locked</span>` : '';
  let timer='';
  if(mine && t.status!=='Done' && !blocked){
    timer = t.running ? `<button class="tb pause" onclick="tAct(${P},'pause')">⏸ Stop Timer</button>` : `<button class="tb play" onclick="tAct(${P},'start')">▶ Start Timer</button>`;
  }
  const time = (t.liveMs||t.running) ? liveSpan(t) : (mine&&!blocked&&t.status!=='Done'?`<span class="ttime">00:00:00</span>`:'');
  const dl = mine && t.status!=='Done'
    ? `<input type="date" class="tdl${t.late?' late':''}" value="${esc(t.deadline)}" title="Deadline" aria-label="Deadline" onchange="tAct(${P},'deadline',{deadline:this.value})">`
    : (t.deadline?`<span class="tdue${t.late?' late':''}">${t.late?'Overdue · ':'Due '}${fmtDay(t.deadline)}</span>`:'');
  const nk=pid+'|'+t.key, nOpen=S.openNotes.has(nk), nid='nt_'+(pid+'_'+t.key).replace(/[^a-z0-9_]/gi,'_');
  const notes = `<button class="tnbtn" onclick="toggleNotes('${esc(nk)}')">${nOpen?'▾':'▸'} Revisions${t.notes.length?' ('+t.notes.length+')':''}</button>`+
    (nOpen?`<div class="tnotes">${t.notes.length?t.notes.map(n=>`<div class="tnote" dir="auto"><span>${bd(n.by)} · ${new Date(n.at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span><br>${esc(n.text)}</div>`).join(''):'<div class="muted" style="font-size:12.5px">No revisions yet.</div>'}
      <div class="tnadd"><input id="${nid}" dir="auto" maxlength="1000" placeholder="اكتب التعديل المطلوب أو اللي اتعمل"><button class="tb ghost" onclick="addNote(${P},'${nid}')">Add</button></div></div>`:'');
  const wl=t.waiting.slice(0,3).map(w=>esc(w.title)+(w.name?' ('+bd(w.name)+')':'')).join(', ')+(t.waiting.length>3?` +${t.waiting.length-3} more`:'');
  const wait = t.locked ? `<div class="twait">Waiting for: ${wl}</div>` : '';
  const who = (t.assignees||[]).length>1 ? `<div class="twait">${bd(t.assigneeName)}</div>` : '';
  let link='';
  if(t.linkLabel){
    const id='lk_'+(pid+'_'+t.key).replace(/[^a-z0-9_]/gi,'_');
    link = mine
      ? `<div class="tlink"><span>${esc(t.linkLabel)}</span><input id="${id}" value="${esc(t.link)}" placeholder="https://"><button class="tb ghost" onclick="tAct(${P},'link',{link:$('${id}').value})">Save</button></div>`
      : `<div class="tlink"><span>${esc(t.linkLabel)}</span>${t.link?`<a href="${esc(t.link)}" target="_blank" rel="noopener">${esc(t.link)}</a>`:'<span class="muted">Not yet</span>'}</div>`;
  }
  const refs=(t.refs||[]).map(r=>`<div class="tlink tref"><span>${esc(r.label)}</span><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.url)}</a></div>`).join('');
  return `<div class="trow${t.locked?' locked':''}${t.running?' running':''}${t.status==='Done'?' done':''}">
    <div class="tmain"><div class="tt">${esc(t.title)}</div>${who}${wait}${refs}${link}${notes}</div>
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
  if(action==='start'){ if(!t.running){ t.running=true; t.runningSince=now; } if(t.status!=='In Progress') t.status='In Progress'; }
  else if(action==='deadline'){ t.deadline=extra.deadline; }
  else if(action==='pause') stop();
  else if(action==='status'||action==='force'){ t.status=extra.status; if(extra.status!=='In Progress') stop(); }
  else if(action==='link') t.link=extra.link;
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
  const c=S.cache.my;
  if(c) renderMyTasks(c,keep); else if(!keep) $('main').innerHTML=LOADING;
  try{
    const r=await call('myTasks'); S.skew=Date.now()-r.now; S.cache.my=r;
    if(S.view!=='mytasks' || S.proj) return;
    if(c && busyTyping()) return;
    renderMyTasks(r,true);
  }catch(e){ if(!c) $('main').innerHTML=`<div class="card err">${esc(e.message)}</div>`; else toast(e.message); }
}
function renderMyTasks(r,keep){
  const y=window.scrollY;
  setTop('My Tasks', r.projects.length+' active projects');
  {
    const all=r.projects.flatMap(p=>p.tasks);
    const rank=t=>t.running?0:(t.status==='Done'?3:(t.locked?2:1));
    if(!r.projects.some(p=>p.id===S.myProj)){ const run=r.projects.find(p=>p.tasks.some(t=>t.running)); S.myProj=(run||r.projects[0]||{}).id; }
    const sel=S.myProj;
    $('main').innerHTML=`<div class="en">
    <div class="grid kpis">
      <div class="kpi"><b>${all.filter(t=>t.status!=='Done').length}</b><span>Open tasks</span></div>
      <div class="kpi"><b>${all.filter(t=>t.status!=='Done'&&!t.locked).length}</b><span>Ready to start</span></div>
      <div class="kpi"><b style="color:var(--accent)">${all.filter(t=>t.running).length}</b><span>Running now</span></div>
    </div>
    ${r.projects.length?`<div class="psel"><label for="mysel">Project</label><select id="mysel" onchange="S.myProj=this.value;renderMyTasks(S.cache.my)">${r.projects.map(p=>{ const open=p.tasks.filter(t=>t.status!=='Done').length, run=p.tasks.some(t=>t.running); return `<option value="${esc(p.id)}"${p.id===sel?' selected':''}>${run?'⏱ ':''}${esc(p.id)} · ${esc(p.client)} — ${open} open</option>`; }).join('')}</select></div>`:''}
    ${r.projects.length? r.projects.filter(p=>p.id===sel).map(p=>`
      <div class="card tgroup">
        <div class="tghead"><h3 style="margin:0">${esc(p.client)}</h3><span class="pill p-out">${esc(p.id)}</span>${p.status!=='Active'?`<span class="pill p-absent">${esc(p.status)}</span>`:''}<span class="muted" style="font-size:13px">${esc(p.type)} · Target ${fmtDay(p.target_launch)}</span><div class="spacer"></div>
          ${p.brief_id?`<button class="btn ghost small" onclick="openBriefFrom('${esc(p.brief_id)}','')">Brief</button>`:''}
          <button class="btn ghost small" onclick="viewProject('${esc(p.id)}')">Full Project</button></div>
        <div style="display:flex;align-items:center;gap:8px;margin:2px 0 6px">${pbar(p.progress)}<span class="muted" style="font-size:12px">${p.progress}% of project</span></div>
        ${p.links.length?`<div class="links sm">${p.links.map(l=>`<a href="${esc(l.link)}" target="_blank" rel="noopener" class="lnk"><b>${esc(l.title)}</b><span>${bd(l.by)}</span></a>`).join('')}</div>`:''}
        ${p.tasks.slice().sort((a,b)=>rank(a)-rank(b)).map(t=>taskRowHTML(t,p.id,r.me,false)).join('')}
      </div>`).join('') : '<div class="card muted">No tasks assigned to you right now.</div>'}</div>`;
    if(keep) window.scrollTo(0,y);
    startTicks();
  }
}

/* ----- Project form ----- */
function platMap(v){ v=String(v||'').toLowerCase().trim(); if(!v) return ''; if(/زد|zid/.test(v)) return 'Zid'; if(/سل[ةه]|salla/.test(v)) return 'Salla'; if(/shopify|شوبي/.test(v)) return 'Shopify'; if(/woo|ووكو/.test(v)) return 'WooCommerce'; return 'Other'; }
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
        <div><label>Current Platform</label><select id="pf_cur_platform">${opt(meta.platforms,d.cur_platform,'—')}</select></div>
        <div><label>Target Platform</label><select id="pf_target_platform">${opt(meta.platforms,d.target_platform,'—')}</select></div>
        <div><label>Current Store URL</label><input id="pf_store_url" value="${esc(d.store_url)}" placeholder="https://"></div>
        <div><label>Store ID</label><input id="pf_store_id" value="${esc(d.store_id)}"></div>
        <div><label>Start Date</label><input type="date" id="pf_start_date" value="${esc(d.start_date)}"><div class="muted" style="font-size:12.5px;margin-top:4px">Target Launch: <b id="pf_tl">${fmtDay(calcLaunch(d.start_date))}</b></div></div>
        ${id?`<div><label>Go Live Date</label><input type="date" id="pf_go_live" value="${esc(d.go_live)}"></div>`:''}
        ${isAdmin?`<div><label>Account Manager</label><select id="pf_am">${opt(meta.ams,d.am,'—')}</select></div>`:''}
      </div>
      <h3>Team</h3>
      <div class="pfgrid">
        <div><label>Build Mode</label><select id="pf_build_mode">${opt(meta.modes,d.build_mode)}</select></div>
        ${teamSel('sm','Store Manager')}${teamSel('copy','Copywriter')}${teamSel('designer','Designer')}
        <div class="m-split">${teamSel('uiux','UI/UX')}</div><div class="m-split">${teamSel('dev','Developer')}</div>
        <div class="m-fe">${teamSel('fe','Front End (UI/UX + Dev)')}</div>
        <div class="m-joker">${teamSel('joker','Joker')}</div>
        <div class="m-joker"><label>Joker helps with</label><select id="pf_joker_role"><option value="uiux"${d.joker_role==='uiux'?' selected':''}>UI/UX</option><option value="dev"${d.joker_role==='dev'?' selected':''}>Developer</option></select></div>
      </div>
      <div class="muted m-joker" style="font-size:12.5px;margin-top:6px">The Joker shares the selected role's tasks with the main person. Either of them can start and finish them.</div>
      <div class="err" id="pf_err"></div>
      <div class="mfoot"><button class="btn" id="pf_save">${id?'Save':'Create Project'}</button></div>
    </div></div>`;
    const mode=()=>{ const m=$('pf_build_mode').value;
      document.querySelectorAll('.m-split').forEach(e=>e.classList.toggle('hidden',m==='Front End'));
      document.querySelectorAll('.m-fe').forEach(e=>e.classList.toggle('hidden',m!=='Front End'));
      document.querySelectorAll('.m-joker').forEach(e=>e.classList.toggle('hidden',m!=='Joker')); };
    $('pf_build_mode').onchange=mode; mode();
    const normName=v=>String(v||'').toLowerCase().replace(/[\u064B-\u065F\u0670\u0640\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g,'').replace(/[\s\-_–—.]+/g,'');
    const dupCheck=()=>{ const v=normName($('pf_client').value), list=(S.cache.plist&&S.cache.plist.projects)||[];
      const hit=v&&list.find(p=>p.id!==(id||'')&&normName(p.client)===v);
      $('pf_dup').textContent=hit?'فيه مشروع بنفس الاسم ده بالفعل ('+hit.id+'). اختار اسم تاني':''; $('pf_dup').classList.toggle('hidden',!hit); };
    $('pf_client').addEventListener('input',dupCheck);
    $('pf_start_date').oninput=()=>{ $('pf_tl').textContent=fmtDay(calcLaunch($('pf_start_date').value)); };
    $('pf_brief_id').onchange=()=>{
      const b=meta.briefs.find(x=>x.id===$('pf_brief_id').value); if(!b) return;
      const set=(k,v)=>{ if(v) $('pf_'+k).value=v; };
      set('client',b.store); dupCheck(); set('type',typeMap(b.f.project_type)); set('cur_platform',platMap(b.f.current_platform)); set('target_platform',platMap(b.f.target_platform));
      set('store_url',b.f.store_url); set('store_id',b.f.zid_id);
      if(b.f.logo_plan) $('pf_identity').value = b.f.logo_plan==='لوجو جديد' ? 'هوية جديدة' : 'هوية موجودة';
      if($('pf_am')){ const a=meta.ams.find(x=>x.u===b.owner); if(a) $('pf_am').value=a.u; }
      toast('Filled from the brief');
    };
    $('pf_save').onclick=async()=>{
      $('pf_err').textContent=''; $('pf_save').disabled=true;
      const g=k=>{ const el=$('pf_'+k); return el? el.value : (d[k]||''); };
      const data={ id:id||'' }; ['client','type','identity','status','cur_platform','target_platform','store_url','store_id','start_date','go_live','am','brief_id','build_mode','sm','copy','designer','uiux','dev','fe','joker','joker_role'].forEach(k=>data[k]=g(k));
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
    ${r.access.length?`<div class="tbl-wrap" style="border:0"><table style="min-width:640px"><tr><th>Account</th><th>Username / email</th><th>Password</th></tr>
    ${r.access.map(a=>`<tr><td><b>${esc(a.label)}</b>${a.l?`<div class="sub2"><a href="${esc(/^https?:/i.test(a.l)?a.l:'https://'+a.l)}" target="_blank" rel="noopener" dir="ltr">${esc(a.l)}</a></div>`:''}</td>
      <td dir="ltr">${a.u?`${esc(a.u)} <button class="btn small ghost" data-cu="${esc(a.u)}" onclick="navigator.clipboard.writeText(this.dataset.cu).then(()=>toast('اتنسخ'))">Copy</button>`:'—'}</td>
      <td>${a.pSet?`<span id="pw_${a.key}" dir="ltr" style="font-family:monospace">••••••••</span> <button class="btn small ghost" onclick="paReveal('${esc(r.data.id)}','${a.key}',false)">Show</button><button class="btn small ghost" onclick="paReveal('${esc(r.data.id)}','${a.key}',true)">Copy</button>`:'—'}</td></tr>`).join('')}</table></div>`
    :`<div class="empty" style="padding:16px">No access saved in the brief yet.</div>`}</div>`;
}
async function paReveal(pid,key,copyIt){
  const el=$('pw_'+key);
  try{
    if(!el.dataset.v) el.dataset.v=(await call('accessReveal',{project:pid,key})).p||'';
    if(copyIt){ await navigator.clipboard.writeText(el.dataset.v); toast('اتنسخ'); }
    else el.textContent = el.textContent.startsWith('••') ? el.dataset.v : '••••••••';
  }catch(e){ toast(e.message); }
}

// فتح البريف من المشروع أو من My Tasks، وزرار الرجوع في البريف يرجّع لنفس المكان
function openBriefFrom(briefId, projId){
  const back = projId ? { label:'Back to '+projId, go:()=>goTo({view:'project',id:projId}) }
                      : { label:'Back to My Tasks', go:()=>go('mytasks') };
  go('briefs',{id:briefId, back});
}
