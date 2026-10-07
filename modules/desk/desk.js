/* ============ My Desk ============
   الصفحة الشخصية لكل واحد: تاسكاتي، الإشعارات، الموافقات المستنياني، وحالتي النهارده. */
const NOTIF_IC={project:'folder',note:'brief',ready:'tasks',blocker:'flag',brief:'brief',pulse:'chart',task:'todo',review:'todo',returned:'warn',done:'todo',comment:'brief',meeting:'meet'};
function viewDesk(){
  const h=new Date().getHours();
  setTop('أرحب بـ المقناص', String(S.user.name||'')+' · '+new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'}));
  swr('desk','deskGet',{},renderDesk);
}
function timeAgo(ms){ const s=Math.max(0,(Date.now()-ms)/1000); if(s<60) return 'now'; if(s<3600) return Math.floor(s/60)+' min ago'; if(s<86400) return Math.floor(s/3600)+' h ago'; const d=Math.floor(s/86400); return d===1?'yesterday':d+' days ago'; }
function notifHTML(n,i,src){
  return `<button class="al${n.read?'':' unread'}" onclick="openNotif('${src}',${i})"><span style="color:var(--brand2);flex:none;margin-top:1px">${ico(NOTIF_IC[n.type]||'bell',18)}</span><span class="tx"><b>${bd(n.title)}</b><span>${bd(n.detail)}</span></span><span class="muted" style="font-size:11.5px;white-space:nowrap">${timeAgo(n.at)}</span></button>`;
}
function openNotif(src,i){
  const list = src==='desk' ? (S.cache.desk||{}).notifs : S.notifs;
  const n=list&&list[i]; if(!n) return;
  if(!n.read){ n.read=true; call('notifRead',{ids:[n.id]}).then(r=>{ S.unread=r.unread; renderBell(); }).catch(()=>{}); }
  closeBell();
  if(n.go){ if(n.go.view==='briefs') go('briefs',{id:n.go.brief}); else goTo(n.go); }
}
function renderDesk(D){
  S.unread=D.unread; renderBell();
  const T=D.tasks, st=D.status;
  const tile=(label,val,sub,color,goV)=>`<${goV?`button onclick="go('${goV}')" style="text-align:left;cursor:pointer"`:'div'} class="kpi"><span>${label}</span><b style="color:${color||'var(--ink)'}">${val}</b><small>${sub||''}</small></${goV?'button':'div'}>`;
  const tiles=[];
  if(st) tiles.push(tile('Today',st.clockedIn?(st.onBreak?'On break':'Clocked in'):'Not clocked in',st.clockedIn?'Since '+esc(st.inT):'Clock in to start',st.clockedIn?(st.onBreak?'var(--blue)':'var(--ok)'):'var(--warn)','clock'));
  const TP=can('tasks.mine')?'mytasks':'tasks';
  if(T){ tiles.push(tile('Open tasks',T.open,T.ready+' ready to work on',null,TP)); tiles.push(tile('Late',T.late,'Past your deadline',T.late?'var(--bad)':null,TP)); tiles.push(tile('Due today',T.dueToday,'By your deadlines',T.dueToday?'var(--warn)':null,TP)); }
  if(D.toReview) tiles.push(tile('To review',D.toReview,'Tasks waiting for your approval','var(--warn)','tasks'));
  if(D.approvals!=null) tiles.push(tile('Approvals waiting',D.approvals,'Device requests',D.approvals?'var(--warn)':null,'devices'));
  if(D.myProjects!=null) tiles.push(tile('My projects',D.myProjects,'Active, you are the AM',null,'projects'));
  if(D.pulseStale!=null) tiles.push(tile('Commercial Pulse',D.pulseStale?'Not entered':'Up to date','This month',D.pulseStale?'var(--warn)':'var(--ok)','pulse'));
  $('main').innerHTML=`<div style="display:grid;gap:20px">
  ${tiles.length?`<div class="grid kpis" style="margin:0">${tiles.join('')}</div>`:''}
  <div class="two" style="margin:0">
    ${T?`<div class="card flush"><div class="chead"><h2>My next tasks</h2><span class="spacer"></span><button class="btn ghost small" onclick="go('${can('tasks.mine')?'mytasks':'tasks'}')">All my tasks →</button></div>
      ${T.list.length?T.list.map(t=>{ const tag=t.running?['Running','p-in']:t.late?['Late','p-bad']:t.review?['In review','p-yel']:t.locked?['Waiting','p-yel']:t.status==='In Progress'?['In progress','p-in']:['Ready','p-absent'];
        return `<button class="al" onclick="${t.gid?`go('tasks',{id:'${esc(t.gid)}'})`:`go('mytasks')`}"><span class="tx"><b>${bd(t.title)}</b><span>${bd(t.client)}${t.deadline?' · due '+fmtD(t.deadline):''}</span></span><span class="pill ${tag[1]}">${tag[0]}</span></button>`; }).join('')
      :`<div class="empty"><b>Nothing open</b>You have no open tasks.</div>`}</div>`:''}
    <div class="card flush"><div class="chead"><h2>Notifications</h2>${D.unread?`<span class="pill p-bad">${D.unread} new</span>`:''}<span class="spacer"></span>${D.unread?`<button class="btn ghost small" onclick="readAll()">Mark all read</button>`:''}</div>
      ${D.notifs.length?D.notifs.map((n,i)=>notifHTML(n,i,'desk')).join(''):`<div class="empty"><b>All caught up</b>When something needs you, it shows up here.</div>`}</div>
  </div></div>`;
}
async function readAll(){
  try{ const r=await call('notifRead',{all:true}); S.unread=0; S.notifs=r.list; if(S.cache.desk){ S.cache.desk.notifs.forEach(n=>n.read=true); S.cache.desk.unread=0; } renderBell(); if(S.view==='desk') renderDesk(S.cache.desk); else openBell(); }catch(e){ toast(e.message); }
}
