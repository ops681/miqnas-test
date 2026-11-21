/* ============ My Desk ============
   الصفحة الشخصية لكل واحد: تاسكاتي، الإشعارات، الموافقات المستنياني، وحالتي النهارده. */
const NOTIF_IC={approval:'cal',request:'cal',leave:'cal',project:'folder',note:'brief',ready:'tasks',blocker:'flag',brief:'brief',pulse:'chart',task:'todo',review:'todo',returned:'warn',done:'todo',comment:'brief',meeting:'meet',launch:'trend',watch:'folder'};
function viewDesk(){
  const h=new Date().getHours();
  setTop('My Desk', 'أرحب بـ المقناص · '+new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'}));
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
function deskHello(D){
  const T=D.tasks, n=(x,w)=>`<b>${x} ${w}${x===1?'':'s'}</b>`;
  if(T&&T.late) return `${n(T.late,'task')} ${T.late===1?'is':'are'} past the deadline`;
  if(T&&T.dueToday) return `You have ${n(T.dueToday,'task')} due today`;
  if(D.requests) return `${n(D.requests,'request')} ${D.requests===1?'is':'are'} waiting for you`;
  if(D.toReview) return `${n(D.toReview,'task')} ${D.toReview===1?'is':'are'} waiting for your review`;
  if(T&&T.ready) return `${n(T.ready,'task')} ${T.ready===1?'is':'are'} ready for you`;
  if(T&&T.open) return `${n(T.open,'open task')}, nothing urgent`;
  return `You're <b>all caught up</b>`;
}
// كل تاسك: دايرة الحالة، الاسم وتحته العميل والميعاد، والحالة
function deskTaskHTML(t){
  const k=t.running?'run':t.late?'late':t.review?'rev':t.locked?'wait':t.helping?'help':t.status==='In Progress'?'prog':'ready';
  const tag={run:['Running','p-in'],late:['Late','p-bad'],rev:['In review','p-yel'],wait:['Waiting','p-out'],help:['Helping','p-prog'],prog:['In progress','p-prog'],ready:['Ready','p-in']}[k];
  return `<button class="dt dt-${k}" onclick="${t.gid?`go('tasks',{id:'${esc(t.gid)}'})`:`go('mytasks')`}"><i class="dt-dot" aria-hidden="true"></i>
    <span class="dt-tx"><b>${bd(t.title)}</b><small>${t.client?bd(t.client):''}${t.deadline?`<em class="${t.late?'late':''}">${t.late?'Overdue · ':'Due '}${fmtD(t.deadline)}</em>`:''}</small></span>
    <span class="pill ${tag[1]}">${tag[0]}</span><span class="dt-go" aria-hidden="true">›</span></button>`;
}
function renderDesk(D){
  S.deskLast=D;
  S.unread=D.unread; renderBell();
  const T=D.tasks, st=D.status, PE=D.people;
  const h=new Date().getHours(), first=String(S.user.name||'').split(/\s+/)[0];
  const tile=(label,val,sub,tone,goV)=>`<button class="dk${tone?' '+tone:''}" onclick="go('${goV}')"><span>${label}</span><b>${val}</b><small>${sub||''}</small></button>`;
  const TP=can('tasks.mine')?'mytasks':'tasks';
  const tiles=[];
  if(T){ tiles.push(tile('Open tasks',T.open,T.ready+' ready to work on','',TP)); tiles.push(tile('Late',T.late,'Past your deadline',T.late?'bad':'',TP)); tiles.push(tile('Due today',T.dueToday,'By your deadlines',T.dueToday?'warn':'',TP)); }
  if(D.toReview) tiles.push(tile('To review',D.toReview,'Waiting for your approval','warn','tasks'));
  if(D.requests) tiles.push(tile('Requests to approve',D.requests,'Leave, permissions, overtime','warn','requests'));
  if(D.leaveLeft!=null) tiles.push(tile('Annual leave left',D.leaveLeft,'Days this year','','requests'));
  if(D.approvals!=null) tiles.push(tile('Device approvals',D.approvals,'Waiting',D.approvals?'warn':'','devices'));
  if(D.myProjects!=null) tiles.push(tile('My projects',D.myProjects,'Active, you are the AM','','projects'));
  if(PE){ tiles.push(tile('Not clocked in',PE.workday?PE.notIn.length:'—',PE.workday?PE.in+' of '+PE.clockers+' clocked in':'Weekend or holiday',PE.workday&&PE.notIn.length?'warn':'','people')); if(PE.leave.length) tiles.push(tile('On leave today',PE.leave.length,PE.leave.map(x=>x.name).slice(0,2).join(', '),'','people')); }
  if(D.pulseStale!=null) tiles.push(tile('Commercial Pulse',D.pulseStale?'Not entered':'Up to date','This month',D.pulseStale?'warn':'','pulse'));
  // الحضور: زرار واحد واضح فوق على اليمين
  const clockBtn = !st ? '' : st.clockedIn
    ? `<button class="dk-clock${st.onBreak?' brk':''}" onclick="go('clock')"><i></i><span><b>${st.onBreak?'On a break':'Clocked in'}</b><small>since ${esc(st.inT)}</small></span></button>`
    : `<button class="btn-cta" onclick="go('clock')">${ico('clock',18)} ${S.mobile&&!st.free?'Clock in from your laptop':'Clock in'}</button>`;
  const head=(title,count,tone,btn)=>`<div class="ch2"><h2>${title}${count?` <span class="cnt${tone?' '+tone:''}">${count}</span>`:''}</h2>${btn||''}</div>`;
  const tasksCard = T ? `<section class="card dcard">${head('My next tasks',T.open,'',`<button class="lnkbtn" onclick="go('${TP}')">All my tasks</button>`)}
      ${T.list.length?`<div class="dts">${T.list.map(deskTaskHTML).join('')}</div>`:`<div class="empty"><b>Nothing open</b>You have no open tasks.</div>`}</section>` : '';
  const reqCard = D.reqList&&D.reqList.length ? `<section class="card dcard dk-wait">${head('Waiting for you',D.requests||D.reqList.length,'warn',`<button class="lnkbtn" onclick="go('requests',{tab:'approve'})">Open requests</button>`)}
      <div class="dts">${D.reqList.map(x=>`<button class="dt dt-rev" onclick="go('requests',{tab:'approve'})"><i class="dt-dot" aria-hidden="true"></i><span class="dt-tx"><b>${bd(x.name)} · ${x.kind==='leave'?esc(x.typeLabel):x.kind==='permission'?'Permission':'Overtime'}</b><small>${fmtD(x.from)}${x.to&&x.to!==x.from?' → '+fmtD(x.to):''}${x.kind==='leave'?' · '+x.days+(x.days===1?' day':' days'):' · '+x.hours+' h'}</small></span><span class="dt-act">Review</span></button>`).join('')}</div></section>` : '';
  const peopleCard = PE ? `<section class="card dcard">${head('Not clocked in today',PE.workday&&PE.notIn.length?PE.notIn.length:'','warn',`<button class="lnkbtn" onclick="go('people')">People</button>`)}
      ${!PE.workday?`<div class="empty"><b>Day off</b>Today is a weekend or holiday.</div>`:PE.notIn.length?`<div class="dk-avs">${PE.notIn.map(x=>`<div class="dk-p"><div class="av" data-u="${esc(x.u||'')}">${esc(initials(x.name))}</div><b>${bd(x.name)}</b><small>${esc(x.job||'')}</small></div>`).join('')}</div>`:`<div class="empty"><b>Everyone is in</b>All who clock in have clocked in today.</div>`}</section>` : '';
  const notifCard = `<section class="card dcard">${head('Notifications',D.unread?D.unread+' new':'','acc',D.unread?`<button class="lnkbtn" onclick="readAll()">Mark all read</button>`:'')}
      ${D.notifs.length?`<div class="dnl">${D.notifs.map((n,i)=>notifHTML(n,i,'desk')).join('')}</div>`:`<div class="empty"><b>All caught up</b>When something needs you, it shows up here.</div>`}</section>`;
  $('main').innerHTML=`<div class="desk2">
  <div class="hello2"><div><p>${h<12?'Good morning':h<17?'Good afternoon':'Good evening'}, <bdi>${esc(first)}</bdi></p><h2>${deskHello(D)}</h2></div>${clockBtn}</div>
  ${tiles.length?`<div class="dks">${tiles.join('')}</div>`:''}
  ${readyCardHTML(D.readyNow).replace('margin-bottom:20px','margin:0')}
  <div class="desk-cols">
    <div class="desk-main">
      ${reqCard}
      ${tasksCard}
      <div id="kpiDesk">${S.cache.kpiMine&&typeof kpiCardHTML==='function'?kpiCardHTML(S.cache.kpiMine,true):''}</div>
      ${typeof finDeskHTML==='function'?finDeskHTML(D.finDue):''}
    </div>
    <div class="desk-side">
      ${todoCardHTML(D)}
      ${typeof kbDeskHTML==='function'?kbDeskHTML(D.sopUnread):''}
      ${peopleCard}
      ${notifCard}
    </div>
  </div></div>`;
  // الـ Scorecard: بيتجاب كل 5 دقايق بالكتير (والنسخة اللي اتجابت بتظهر على طول)
  if(typeof kpiDeskLoad==='function' && Date.now()-(S.kpiDeskAt||0)>300000){ S.kpiDeskAt=Date.now(); kpiDeskLoad(); }
}
async function readAll(){
  try{ const r=await call('notifRead',{all:true}); S.unread=0; S.notifs=r.list; if(S.cache.desk){ S.cache.desk.notifs.forEach(n=>n.read=true); S.cache.desk.unread=0; } renderBell(); if(S.view==='desk') renderDesk(S.cache.desk); else openBell(); }catch(e){ toast(e.message); }
}

/* ============ To-do الشخصية (خاصة بصاحبها بس) ============ */
function todoCardHTML(D){
  const L=D.todos||[], P=D.todoProjects||[], open=L.filter(t=>!t.done);
  return `<div class="card flush td-card"><div class="chead"><h2>My to-do</h2>${open.length?`<span class="pill p-out">${open.length}</span>`:''}<span class="spacer"></span><span class="muted" style="font-size:12px">Only you see this</span></div>
    <form class="td-add" onsubmit="todoAdd(event)">
      <textarea id="tdT" placeholder="Add something to do…" dir="auto" maxlength="300" aria-label="New to-do" onkeydown="if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();this.form.requestSubmit();}" rows="1" class="ml"></textarea>
      <input type="date" id="tdD" aria-label="Due date" title="Due date (optional)">
      ${P.length?`<select id="tdP" aria-label="Project (optional)"><option value="">No project</option>${P.map(p=>`<option value="${esc(p.id)}">${esc(p.client)}</option>`).join('')}</select>`:''}
      <button class="btn primary small" type="submit">Add</button></form>
    ${L.length?`<div class="td-list">${L.map(t=>`<div class="td-row${t.done?' done':''}${t.late?' late':''}">
      <button type="button" class="td-chk" role="checkbox" aria-checked="${t.done}" aria-label="${t.done?'Mark not done':'Mark done'}" onclick="todoToggle('${esc(t.id)}')">${t.done?'✓':''}</button>
      <div class="td-tx"><span ${bdd(t.text)}>${bd(t.text)}</span>${t.due||t.client?`<small>${t.due?`<b class="${t.late?'late':t.today?'today':''}">${t.late?'Overdue · ':t.today?'Today · ':''}${fmtD(t.due)}</b>`:''}${t.due&&t.client?' · ':''}${t.client?esc(t.client):''}</small>`:''}</div>
      <button type="button" class="td-del" aria-label="Delete" title="Delete" onclick="todoDel('${esc(t.id)}')">×</button></div>`).join('')}</div>`
    :`<div class="empty"><b>Nothing here yet</b>Write the small things you don't want to forget.</div>`}</div>`;
}
function todoPut(r){ const D=S.deskLast; if(D){ D.todos=r.list; if(S.view==='desk') renderDesk(D); } }
async function todoAdd(e){
  e.preventDefault();
  const text=$('tdT').value.trim(); if(!text) return;
  const todo={text,due:$('tdD').value,project:$('tdP')?$('tdP').value:''};
  const D=S.deskLast; if(D){ D.todos=[{id:'tmp',text,due:todo.due,project:todo.project,client:'',done:false,late:false}].concat(D.todos||[]); renderDesk(D); }
  try{ todoPut(await call('todoSave',{todo})); setTimeout(()=>{ const i=$('tdT'); if(i) i.focus(); },30); }catch(err){ toast(err.message); if(D) viewDesk(); }
}
async function todoToggle(id){
  const D=S.deskLast, t=D&&(D.todos||[]).find(x=>x.id===id); if(t){ t.done=!t.done; renderDesk(D); }
  try{ todoPut(await call('todoToggle',{id})); }catch(e){ toast(e.message); viewDesk(); }
}
async function todoDel(id){
  const D=S.deskLast; if(D){ D.todos=(D.todos||[]).filter(x=>x.id!==id); renderDesk(D); }
  try{ todoPut(await call('todoDelete',{id})); }catch(e){ toast(e.message); viewDesk(); }
}
