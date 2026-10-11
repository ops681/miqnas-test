/* ============ الشكل العام ============ */
const IC = {
  dash:'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  tasks:'<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>',
  folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  brief:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  monitor:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.7 3 2.5 3.5 5.2"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  out:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  org:'<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-4h12v4"/>',
  device:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M10 17h4"/><path d="M9 8l2 2 4-4"/>',
  pulse:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  todo:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12l3 3 5-6"/>',
  meet:'<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5M13 15.2c.9-.5 1.9-.7 3-.7 2.7 0 4.9 1.5 5.5 4.5"/>',
  pin:'<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  home:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  crown:'<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>',
  crm:'<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M7.5 18c.9-2.2 2.6-3.3 4.5-3.3s3.6 1.1 4.5 3.3"/>',
  trend:'<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  money:'<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9v.01M18 15v.01"/>',
  book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M8 7h7M8 11h5"/>',
  link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  warn:'<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>'
};
const ico=(k,s)=>`<svg width="${s||18}" height="${s||18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg>`;
const initials = n => { n=String(n||'').trim(); const p=n.split(/\s+/); return (p.length>1? p[0][0]+p[1][0] : n.slice(0,2)).toUpperCase(); };

// الخطوط: كل موظف بيشوف صفحات الـ Line بتاعه، والـ C-level بيشوف كل الخطوط
const LINE_OF={projects:'Line 1',partners:'Line 1',finance:'Line 1',blockers:'Line 1',briefs:'Line 1',clientrep:'Line 1',crm:'Line 1',sales:'Sales',line2:'Line 2'};
function inLine(u,id){ const l=LINE_OF[id]; if(!l||!u||u.clevel||u.founder||can('system.admin')) return true; return (u.lines&&u.lines.length?u.lines:['Line 1']).indexOf(l)>=0; }
function navFor(u){
  const N=[];
  const add=(id,label,icon,sec)=>{ if(inLine(u,id)) N.push({id,label,icon,sec}); };
  add('desk','My Desk','home','Workspace');
  if(can('dashboard.view')) add('dash','Dashboard','dash','Workspace');
  if(u.clocks && !S.mobile) add('clock','Time Clock','clock','Workspace');
  if(can('tasks.mine')) add('mytasks','My Tasks','tasks','Workspace');
  add('tasks','Tasks','todo','Workspace');
  add('meetings','Meetings','meet','Workspace');
  add('requests','Leave & Requests','cal','Workspace');
  add('knowledge','Knowledge','book','Workspace');
  if(canAny(['projects.view_all','projects.manage_all','projects.manage_own'])) add('projects','Projects','folder','Workspace');
  if(canClientRep()) add('clientrep','Client Report','chart','Workspace');
  if(can('projects.manage_all')) add('partners','Partners','link','Workspace');
  if(canFinance()) add('finance','Finance','money','Workspace');
  if(can('blockers.manage')) add('blockers','Blockers','flag','Workspace');
  if(can('briefs.use')) add('briefs','Briefs','brief','Workspace');
  if(canBoard()) add('board','Board','chart','Leadership');
  if(can('executive.view')) add('exec','Executive','crown','Leadership');
  if(canAny(['commercial.metrics.manage','executive.view'])) add('pulse','Commercial Pulse','trend','Leadership');
  if(can('crm.view')) add('crm','Clients CRM','crm','Leadership');
  if(canAny(['executive.view','commercial.metrics.manage'])) add('sales','Sales CRM','chart','Business Lines');
  if(canAny(['executive.view','system.admin'])) add('line2','Line 2','trend','Business Lines');
  if(canAny(['attendance.view_all','leave.approve_hr'])) add('people','People Dashboard','dash','People');
  if(can('attendance.view_all')){ add('today','Attendance','cal','People'); add('monthly','Monthly Report','chart','People'); add('screen','Screen Report','monitor','People'); }
  if(can('people.manage')) add('users','Employees','users','People');
  if(can('people.manage')) add('devices','Devices','device','People');
  if(can('location.view')) add('locations','Locations','pin','People');
  if(canAny(['org.manage','people.manage'])) add('org','Organization','org','System');
  if(can('system.admin')) add('settings','Settings','gear','System');
  if(can('system.admin')) add('health','System Health','pulse','System');
  return N;
}
function renderSide(){
  const N=navFor(S.user);
  let sec='', h='';
  const lock=gated();
  N.forEach(n=>{ if(n.sec!==sec){ sec=n.sec; h+=`<div class="nsec">${sec}</div>`; } const b=navBadge(n.id); h+=`<button class="nav${S.view===n.id?' on':''}${lock&&FREE_VIEWS.indexOf(n.id)<0?' locked':''}" data-v="${n.id}">${ico(n.icon)}<span>${n.label}</span>${b?`<span class="nb">${b}</span>`:''}</button>`; });
  $('nav').innerHTML=h;
  $('nav').querySelectorAll('.nav').forEach(b=>b.onclick=()=>go(b.dataset.v));
  $('sUser').innerHTML=`<button class="av av-btn" data-u="${esc(S.user.username)}" onclick="avEdit()" title="Change your photo" aria-label="Change your photo">${esc(initials(S.user.name))}</button><div class="nm"><b>${esc(S.user.name)}</b><small>${esc(S.user.roleName)}${S.user.job&&S.user.job!==S.user.roleName?' · '+esc(S.user.job):''}</small></div><button class="iconbtn" onclick="logout()" aria-label="Logout" title="Logout">${ico('out',17)}</button>`;
  renderSideClock();
}
// الأرقام اللي على القايمة
function navBadge(id){
  if(id==='mytasks') return S.myBadge||0;
  if(id==='devices') return alertsList().filter(a=>a.tag==='DEVICE').length;
  if(id==='requests') return (S.cache.dash&&S.cache.dash.approvals)||0;
  if(id==='knowledge') return ((S.cache.kb&&S.cache.kb.unread)||(S.deskLast&&S.deskLast.sopUnread)||[]).length;
  return 0;
}
function updateNavBadges(){
  document.querySelectorAll('#nav .nav').forEach(el=>{
    const n=navBadge(el.dataset.v); let s=el.querySelector('.nb');
    if(!n){ if(s) s.remove(); return; }
    if(!s){ s=document.createElement('span'); s.className='nb'; el.appendChild(s); }
    s.textContent=n>99?'99+':n;
  });
}
function renderSideClock(){
  const el=$('sClock');
  if(!S.user||!S.user.clocks){ el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  const st=S.status||{};
  el.innerHTML = st.clockedIn
    ? `<small>Clocked in since ${esc(st.inT)}</small><b id="sideElapsed">--:--:--</b>${st.onBreak?`<span class="sh off"><i></i>On break</span>`:`<span class="sh${S.sharing?'':' off'}"><i></i>${S.sharing?'Screen sharing on':'Sharing stopped'}</span>`}`
    : `<small>Time Clock</small><b>Not clocked in</b><span class="sh off"><i></i>${S.mobile?'Clock in from your laptop':'Clock in to start'}</span>`;
  tickAll();
}
function setTop(title, sub, actions){
  $('pgTitle').textContent=title||''; $('pgSub').textContent=sub||''; $('topActions').innerHTML=actions||'';
}

function startApp(){
  setTimeout(pwaBanner, 1500);
  $('loginView').classList.add('hidden'); $('appView').classList.remove('hidden');
  loadCache();
  renderSide();
  renderBell();
  const deep=briefFromHash();
  const N=navFor(S.user);
  if(deep && N.some(n=>n.id==='briefs')) go('briefs',{id:deep});
  else if(gated() && FREE_VIEWS.indexOf(S.view)<0) go('clock');
  else if(!S.view || !N.some(n=>n.id===S.view)) go((S.user.clevel||S.user.founder) && N.some(n=>n.id==='dash') ? 'dash' : N[0].id==='clock' && can('tasks.mine') && S.status && S.status.clockedIn ? 'mytasks' : N[0].id);
  else go(S.view);
  startBellPolling();
  startPrefetchLoop();
  if(S.pendingGo){ const g=S.pendingGo; S.pendingGo=null; try{ setTimeout(()=>goTo(JSON.parse(g)),300); }catch(e){} }
  setTimeout(prefetch, 600);
}

function briefFromHash(){ const m=(location.hash||'').match(/^#brief=(b[a-z0-9]{6,30})$/); return m? m[1] : null; }
window.addEventListener('hashchange',()=>{ const id=briefFromHash(); if(id && S.user && navFor(S.user).some(n=>n.id==='briefs') && S.view!=='briefs') go('briefs',{id}); });

function go(v,opts){
  if(S.view==='briefs' && v!=='briefs' && window.BriefModule) BriefModule.leave();
  sideOpen(false);
  S.view=v; S.vt++; S.proj=null;
  clearInterval(S.viewTimer);
  closeBell();
  $('nav').querySelectorAll('.nav').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
  window.scrollTo(0,0);
  if(gated() && FREE_VIEWS.indexOf(v)<0){ S.lockShown=true; viewLocked(v); return; }
  S.lockShown=false;
  const map={dash:viewDash,clock:viewClock,mytasks:viewMyTasks,projects:viewProjects,briefs:()=>viewBriefs(opts),today:viewToday,monthly:viewMonthly,screen:viewScreen,users:viewUsers,settings:viewSettings,blockers:viewBlockers,org:viewOrg,devices:viewDevices,health:viewHealth,desk:viewDesk,locations:viewLocations,tasks:()=>viewTasks(opts),requests:()=>viewRequests(opts),meetings:()=>viewMeetings(opts),exec:viewExec,pulse:viewPulse,crm:viewCrm,clientrep:()=>viewClientRep(opts),partners:viewPartners,knowledge:()=>viewKnowledge(opts),finance:()=>viewFinance(opts),board:()=>viewBoard(opts),people:viewPeople,sales:()=>viewSoon('sales'),line2:()=>viewSoon('line2')};
  (map[v]||viewDash)();
}
function viewLocked(v){
  const n=navFor(S.user).find(x=>x.id===v);
  setTop(n?n.label:'','');
  $('main').innerHTML=`<div class="card" style="max-width:560px;margin:40px auto;text-align:center;padding:36px 28px">
    <div style="color:var(--muted,#56706B);margin-bottom:10px">${ico('clock',34)}</div>
    <h2 style="margin:0 0 8px">اعمل بصمة دخول الأول</h2>
    <p class="muted" style="margin:0 0 20px">الصفحة دي هتفتح أول ما تبصم دخول.</p>
    <button class="btn primary" onclick="go('clock')">روح لـ Time Clock</button></div>`;
}
function viewBriefs(opts){
  setTop('Briefs','');
  document.documentElement.style.setProperty('--hdr', ($('top').offsetHeight||0)+'px');
  $('main').innerHTML='<div class="bapp"><div class="wrap" id="bwrap"></div></div>';
  BriefModule.enter($('bwrap'), S.user, opts||{});
}

// تحميل مسبق في الخلفية، عشان الصفحات التانية تفتح على طول
// كل صفحة ليها الداتا بتاعتها: [مفتاح الكاش، العملية]
const VIEW_DATA={
  desk:[['desk','deskGet']], dash:[['dash','dash']], mytasks:[['my','myTasks']], tasks:[['gt','gtList']], meetings:[['mt','mtList']],
  requests:[['rqMeta','reqMeta'],['rqList','reqList']], projects:[['plist','projList']], blockers:[['blockers','blockList']],
  briefs:[['briefs','briefList']], exec:[['exec','execDash']], today:[['board','board']], users:[['users','users']],
  devices:[['devices','devicesList']], org:[['org','orgGet']], settings:[['settings','settingsGet']], crm:[['crm','crmList']], people:[['people','peopleDash']], partners:[['partners','partnersAdmin']], knowledge:[['kb','kbList']], finance:[['fin','finList']]
};
// تحميل كل الصفحات في الخلفية في طلب واحد، عشان أي صفحة تتفتح على طول من آخر داتا
async function prefetch(force){
  if(gated() || document.visibilityState==='hidden' || S.prefetching) return;
  const need=[['notifs','notifList']];
  navFor(S.user).forEach(n=>(VIEW_DATA[n.id]||[]).forEach(x=>{ if(!need.some(y=>y[0]===x[0])) need.push(x); }));
  const todo=need.filter(([k])=>force || !(S.fetched[k] && Date.now()-S.fetched[k]<60000));
  if(!todo.length) return;
  S.prefetching=true;
  try{
    const r=await call('bundle',{items:todo.map(x=>x[1])});
    todo.forEach(([k,a])=>{ const x=r[a]; if(!x || !x.ok) return;
      S.cache[k]=x.data; S.fetched[k]=Date.now();
      if(k==='notifs'){ S.notifs=x.data.list; S.unread=x.data.unread; }
      if(k==='dash' && x.data.unread!=null) S.unread=x.data.unread;
      if(k==='briefs' && window.BriefModule && BriefModule.prime) BriefModule.prime(x.data);
    });
    if(r.reqMeta&&r.reqMeta.ok) S.rqMeta=r.reqMeta.data;
    if(r.reqList&&r.reqList.ok) S.rqList=r.reqList.data;
    renderBell(); renderSide(); saveCache();
  }catch(e){
    // السيرفر القديم مايعرفش bundle: نرجع للطريقة القديمة
    if(/غير معروفة/.test(e.message||'')) for(const [k,a] of todo){ try{ const d=await call(a,{}); S.cache[k]=d; S.fetched[k]=Date.now(); }catch(e2){ break; } }
  } finally { S.prefetching=false; }
}
// كل 4 دقايق تقريبًا والصفحة قدام الموظف
function startPrefetchLoop(){
  clearTimeout(S.pfT);
  const next=()=>{ S.pfT=setTimeout(()=>{ if(document.visibilityState==='visible' && S.token) prefetch(); next(); }, 220000+Math.floor(Math.random()*40000)); };
  next();
}
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible' && S.token && S.user) prefetch(); });

/* ============ مؤقت واحد لكل العدادات ============ */
function setStatus(st){ if(st) st._off=Date.now()-(st.serverNow||Date.now()); S.status=st; }
function fmtDur(ms){ ms=Math.max(0,ms); const h=Math.floor(ms/36e5), m=Math.floor(ms%36e5/6e4), s=Math.floor(ms%6e4/1e3); return [h,m,s].map(x=>String(x).padStart(2,'0')).join(':'); }
function tickAll(){
  const now=Date.now();
  document.querySelectorAll('[data-live]').forEach(el=>{ const base=+el.dataset.total||0, since=+el.dataset.since||0; el.textContent=fmtDur(base+(since? now-S.skew-since : 0)); });
  const st=S.status;
  if(st && st.clockedIn){
    const v=fmtDur(now-(st._off||0)-st.inTs-(st.breakMs||0)-(st.onBreak?now-(st._off||0)-st.breakSince:0));
    const a=$('sideElapsed'); if(a) a.textContent=v;
    const b=$('elapsed'); if(b) b.textContent=v;
  }
}
setInterval(tickAll,1000);

/* ============ التنبيهات (الجرس) ============ */
function alertsList(){ const d=S.cache.dash; return d&&d.alerts? d.alerts : []; }
function renderBell(){
  const n=alertsList().length+(S.unread||0);
  $('bell').innerHTML=ico('bell',20)+(n?`<span class="cnt">${n>99?'99+':n}</span>`:'');
  $('bell').setAttribute('aria-label','Notifications'+(n?', '+n:''));
  if(!$('bellPanel').classList.contains('hidden')) openBell();
  updateNavBadges();
}
function alertHTML(a,i){
  return `<div class="al-w"><button class="al sev-${a.sev}" onclick="goAlert(${i})"><span class="dot"></span><span class="tx"><b>${bd(a.title)}</b><span>${bd(a.detail)}</span></span><span class="tg">${esc(a.tag)}</span></button>${seenBtn(a)}</div>`;
}
/* «تمت المشاهدة»: التنبيه يختفي من عندك إنت بس، ويرجع لوحده لو المشكلة كبرت */
function seenBtn(a){ return a&&a.k?`<button class="al-seen" title="Seen · hide it until it gets worse" aria-label="Mark as seen" onclick="event.stopPropagation();alertSee(this,'${esc(encodeURIComponent(a.k))}',${a.lv?a.lv.s:0},${a.lv?a.lv.n:0})"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg><span>Seen</span></button>`:''; }
function hiddenNote(n){ return n?`<button class="btn ghost small al-hid" onclick="event.stopPropagation();alertUnseeAll()" title="Show the alerts you marked as seen">${n} seen · show</button>`:''; }
async function alertSee(btn,ke,s,n){
  const k=decodeURIComponent(ke);
  const drop=d=>{ if(d&&d.alerts){ const b=d.alerts.length; d.alerts=d.alerts.filter(a=>a.k!==k); d.alertsHidden=(d.alertsHidden||0)+(b-d.alerts.length); } };
  drop(S.cache.dash); drop(S.cache.people); saveCache();
  const w=btn.closest('.al-w'); if(w){ w.style.opacity='.3'; }
  try{ await call('alertSeen',{k,s,n}); }catch(e){ toast(e.message); }
  renderBell(); if(S.view==='dash'&&S.cache.dash) renderDash(S.cache.dash,true); if(S.view==='people'&&S.cache.people&&typeof renderPeople==='function') renderPeople(S.cache.people,true);
}
async function alertUnseeAll(){
  try{ await call('alertUnseeAll'); toast('All alerts are back'); }catch(e){ toast(e.message); return; }
  refreshDash(true); if(S.view==='people') go('people');
}
// الجرس: "For you" (إشعارات شخصية) + "Alerts" (تنبيهات محسوبة)
function openBell(){
  const L=alertsList(), N=S.notifs||[];
  $('bellPanel').innerHTML=`<div class="bh">For you${S.unread?` <span class="pill p-bad" style="margin-left:8px">${S.unread} new</span>`:''}<span class="spacer"></span>${S.unread?`<button class="btn ghost small" onclick="event.stopPropagation();readAll()">Mark all read</button>`:''}<button class="btn ghost small" onclick="event.stopPropagation();closeBell();pushPanel()" title="Phone notifications">📱</button><button class="btn ghost small" onclick="go('desk')">My Desk</button></div>`+
    (N.length? N.slice(0,10).map((n,i)=>notifHTML(n,i,'bell')).join('') : `<div class="empty" style="padding:16px"><b>All caught up</b>Nothing new for you.</div>`)+
    `<div class="bh" style="border-top:1px solid var(--line)">Alerts<span class="spacer"></span>${hiddenNote((S.cache.dash||{}).alertsHidden)}${can('dashboard.view')?`<button class="btn ghost small" onclick="go('dash')">Open dashboard</button>`:''}</div>`+
    (L.length? L.slice(0,40).map(alertHTML).join('') : `<div class="empty" style="padding:16px"><b>All clear</b>No alerts right now.</div>`);
  $('bellPanel').classList.remove('hidden');
}
function loadNotifs(){ if(gated()) return; call('notifList').then(r=>{ S.notifs=r.list; S.unread=r.unread; renderBell(); }).catch(()=>{}); }
function closeBell(){ $('bellPanel').classList.add('hidden'); }
$('bell').onclick=e=>{ e.stopPropagation(); if($('bellPanel').classList.contains('hidden')){ openBell(); refreshDash(); loadNotifs(); } else closeBell(); };
document.addEventListener('click',e=>{ if(!$('bellPanel').contains(e.target) && e.target!==$('bell')) closeBell(); });
function goAlert(i){
  const a=alertsList()[i]; if(!a||!a.go) return;
  closeBell(); goTo(a.go);
}
function goTo(g){
  if(!g) return;
  if((g.view==='tasks'||g.view==='meetings') && g.id){ go(g.view,{id:g.id}); return; }
  if(g.view==='requests'){ go('requests',{tab:g.tab}); return; }
  if(g.view==='clientrep'){ go('clientrep',{month:g.month}); return; }
  if(g.view==='knowledge'){ go('knowledge',{tab:g.tab,id:g.id}); return; }
  if(g.view==='finance'){ S.fin&&(S.fin.tab='contracts'); go('finance',{id:g.id}); return; }
  const a={go:g};
  if(a.go.view==='project'){ if(!canAny(['projects.view_all','projects.manage_all','projects.manage_own'])){ go('mytasks'); setTimeout(()=>viewProject(a.go.id),0); } else { go('projects'); viewProject(a.go.id); } }
  else go(a.go.view);
}
async function refreshDash(fresh){
  if(gated()) return;
  try{ const d=await call('dash',fresh===true?{fresh:true}:{}); S.cache.dash=d; S.fetched.dash=Date.now(); saveCache(); if(d.unread!=null) S.unread=d.unread; renderBell(); if(S.view==='dash' && !busyTyping()) renderDash(d,true); }catch(e){}
}
function startBellPolling(){
  clearTimeout(S.bellT);
  // كل دقيقتين تقريبًا (± 20 ثانية) عشان الأجهزة ماتطلبش كلها مع بعض
  const next=()=>{ S.bellT=setTimeout(()=>{ if(document.visibilityState==='visible' && S.token) refreshDash(); next(); }, 100000+Math.floor(Math.random()*40000)); };
  next();
}

/* النايت مود: زرار فوق جنب الإشعارات، والاختيار بيتحفظ على الجهاز */
function themeIsDark(){ return document.documentElement.getAttribute('data-theme')==='dark'; }
function themeBtn(){ const b=$('themeBtn'); if(!b) return; const d=themeIsDark(); b.innerHTML=ico(d?'sun':'moon',18); b.title=d?'Light mode':'Dark mode'; b.setAttribute('aria-label',b.title); }
function themeToggle(){ const t=themeIsDark()?'light':'dark'; document.documentElement.setAttribute('data-theme',t); store('theme',t); themeBtn(); }
document.addEventListener('DOMContentLoaded',themeBtn); setTimeout(themeBtn,0);

/* ============ تطبيق الموبايل (PWA) ============ */
// الأدمنز والـ Account Managers بيتابعوا من الموبايل. التطبيق بيتثبت من المتصفح (Add to Home Screen).
const isStandalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
const isPhone = () => /iPhone|iPad|Android/i.test(navigator.userAgent);
let pwaPrompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); pwaPrompt = e; pwaBanner(); });
if ('serviceWorker' in navigator && location.protocol === 'https:') { window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); }); }
function pwaWho(){ return S.user && (can('system.admin') || (can('projects.manage_own') && !can('projects.manage_all'))); }
function pwaBanner(){
  const el = $('pwaBar'); if (el) el.remove();
  if (!S.user || !pwaWho() || isStandalone() || !isPhone() || load('pwa_hide') === '1') return;
  const ios = /iPhone|iPad/i.test(navigator.userAgent);
  const d = document.createElement('div'); d.id = 'pwaBar'; d.className = 'pwa-bar';
  d.innerHTML = `<div class="pwa-ic">M</div><div class="pwa-tx"><b>ثبّت تطبيق مِقناص</b><span>${ios ? 'دوس على زرار المشاركة <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4M5 12v8h14v-8"/></svg> وبعدين <bdi dir="ltr">Add to Home Screen</bdi>' : 'تابع شغلك من أيقونة على الموبايل'}</span></div>
    ${!ios && pwaPrompt ? '<button class="btn primary small" onclick="pwaInstall()">تثبيت</button>' : ''}<button class="iconbtn pwa-x" aria-label="إخفاء" onclick="store(\'pwa_hide\',\'1\');pwaBanner()">✕</button>`;
  document.body.appendChild(d);
}
async function pwaInstall(){ if (!pwaPrompt) return; pwaPrompt.prompt(); try { await pwaPrompt.userChoice; } catch (e) {} pwaPrompt = null; pwaBanner(); }

/* القايمة الجانبية على الموبايل */
function sideOpen(on){ document.body.classList.toggle('side-open',!!on); const b=$('menuBtn'); if(b) b.setAttribute('aria-expanded',on?'true':'false'); }
document.addEventListener('keydown',e=>{ if(e.key==='Escape' && document.body.classList.contains('side-open')) sideOpen(false); });

/* اسحب لتحت عشان تعمل ريفريش (موبايل) */
(function(){
  if(!('ontouchstart' in window)) return;
  let y0=null, pull=0, busy=false, el=null;
  const TH=70;
  const ind=()=>{ if(!el){ el=document.createElement('div'); el.id='ptr'; el.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 4v5h-5"/></svg>'; document.body.appendChild(el); } return el; };
  const blocked=()=>!S.token || $('appView').classList.contains('hidden') || document.body.classList.contains('side-open') || ($('modalRoot')&&$('modalRoot').children.length) || window.scrollY>0;
  document.addEventListener('touchstart',e=>{ if(busy||blocked()||e.touches.length!==1){ y0=null; return; } y0=e.touches[0].clientY; pull=0; },{passive:true});
  document.addEventListener('touchmove',e=>{ if(y0===null) return; if(window.scrollY>0){ y0=null; return; }
    pull=Math.max(0,e.touches[0].clientY-y0); const d=Math.min(pull*0.5,90), i=ind();
    i.style.opacity=Math.min(1,pull/TH); i.style.transform=`translate(-50%,${d}px) rotate(${pull*2}deg)`; i.classList.toggle('ready',pull*0.5>=TH*0.8); },{passive:true});
  document.addEventListener('touchend',async()=>{ if(y0===null) return; y0=null; const i=ind();
    if(pull*0.5<TH*0.8){ i.style.opacity=0; i.style.transform='translate(-50%,0)'; return; }
    busy=true; i.classList.add('spin'); i.style.transform='translate(-50%,56px)';
    try{ await refreshMe(); go(S.view); if(typeof loadNotifs==='function') loadNotifs(); }catch(e){}
    setTimeout(()=>{ i.classList.remove('spin','ready'); i.style.opacity=0; i.style.transform='translate(-50%,0)'; busy=false; },700);
  });
})();

/* لو الصفحة الرئيسية متخزنة قديمة في الموبايل (الآيفون بيخزنها)، نضيف زراير القايمة والنايت مود من هنا */
function ensureChrome(){
  if(!document.documentElement.getAttribute('data-theme')){ let t=load('theme'); if(t!=='dark'&&t!=='light') t=(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'; document.documentElement.setAttribute('data-theme',t); }
  const top=$('top'); if(!top) return;
  if(!$('menuBtn')){ const b=document.createElement('button'); b.id='menuBtn'; b.type='button'; b.setAttribute('aria-label','Menu'); b.setAttribute('aria-controls','side'); b.setAttribute('aria-expanded','false');
    b.onclick=()=>sideOpen(true); b.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>'; top.insertBefore(b,top.firstChild); }
  if(top.children[1] && !top.children[1].classList.contains('ttl') && top.children[1].querySelector('#pgTitle')) top.children[1].classList.add('ttl');
  if(!$('sideShade')){ const d=document.createElement('div'); d.id='sideShade'; d.onclick=()=>sideOpen(false); $('appView').insertBefore(d,$('appView').firstChild); }
  if(!$('themeBtn') && $('bell')){ const t=document.createElement('button'); t.id='themeBtn'; t.type='button'; t.onclick=themeToggle; $('bell').parentNode.insertBefore(t,$('bell')); themeBtn(); }
}
ensureChrome(); document.addEventListener('DOMContentLoaded',ensureChrome);
