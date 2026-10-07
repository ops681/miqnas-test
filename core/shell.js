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
  trend:'<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  warn:'<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>'
};
const ico=(k,s)=>`<svg width="${s||18}" height="${s||18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg>`;
const initials = n => { n=String(n||'').trim(); const p=n.split(/\s+/); return (p.length>1? p[0][0]+p[1][0] : n.slice(0,2)).toUpperCase(); };

function navFor(u){
  const N=[];
  const add=(id,label,icon,sec)=>N.push({id,label,icon,sec});
  add('desk','My Desk','home','Workspace');
  if(can('dashboard.view')) add('dash','Dashboard','dash','Workspace');
  if(u.clocks) add('clock','Time Clock','clock','Workspace');
  if(can('tasks.mine')) add('mytasks','My Tasks','tasks','Workspace');
  add('tasks','Tasks','todo','Workspace');
  add('meetings','Meetings','meet','Workspace');
  add('requests','Leave & Requests','cal','Workspace');
  if(canAny(['projects.view_all','projects.manage_all','projects.manage_own'])) add('projects','Projects','folder','Workspace');
  if(can('blockers.manage')) add('blockers','Blockers','flag','Workspace');
  if(can('briefs.use')) add('briefs','Briefs','brief','Workspace');
  if(can('executive.view')) add('exec','Executive','crown','Leadership');
  if(canAny(['commercial.metrics.manage','executive.view'])) add('pulse','Commercial Pulse','trend','Leadership');
  if(canAny(['executive.view','commercial.metrics.manage'])) add('sales','Sales CRM','chart','Business Lines');
  if(canAny(['executive.view','system.admin'])) add('line2','Line 2','trend','Business Lines');
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
  N.forEach(n=>{ if(n.sec!==sec){ sec=n.sec; h+=`<div class="nsec">${sec}</div>`; } const b=navBadge(n.id); h+=`<button class="nav${S.view===n.id?' on':''}${lock&&n.id!=='clock'?' locked':''}" data-v="${n.id}">${ico(n.icon)}<span>${n.label}</span>${b?`<span class="nb">${b}</span>`:''}</button>`; });
  $('nav').innerHTML=h;
  $('nav').querySelectorAll('.nav').forEach(b=>b.onclick=()=>go(b.dataset.v));
  $('sUser').innerHTML=`<div class="av">${esc(initials(S.user.name))}</div><div class="nm"><b>${esc(S.user.name)}</b><small>${esc(S.user.roleName)}${S.user.job&&S.user.job!==S.user.roleName?' · '+esc(S.user.job):''}</small></div><button class="iconbtn" onclick="logout()" aria-label="Logout" title="Logout">${ico('out',17)}</button>`;
  renderSideClock();
}
// الأرقام اللي على القايمة
function navBadge(id){
  if(id==='mytasks') return S.myBadge||0;
  if(id==='devices') return alertsList().filter(a=>a.tag==='DEVICE').length;
  if(id==='requests') return (S.cache.dash&&S.cache.dash.approvals)||0;
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
    : `<small>Time Clock</small><b>Not clocked in</b><span class="sh off"><i></i>Clock in to start</span>`;
  tickAll();
}
function setTop(title, sub, actions){
  $('pgTitle').textContent=title||''; $('pgSub').textContent=sub||''; $('topActions').innerHTML=actions||'';
}

function startApp(){
  $('loginView').classList.add('hidden'); $('appView').classList.remove('hidden');
  loadCache();
  renderSide();
  renderBell();
  const deep=briefFromHash();
  const N=navFor(S.user);
  if(deep && N.some(n=>n.id==='briefs')) go('briefs',{id:deep});
  else if(gated()) go('clock');
  else if(!S.view || !N.some(n=>n.id===S.view)) go(N[0].id==='clock' && can('tasks.mine') && S.status && S.status.clockedIn ? 'mytasks' : N[0].id);
  else go(S.view);
  startBellPolling();
  setTimeout(prefetch, 2500);
}

function briefFromHash(){ const m=(location.hash||'').match(/^#brief=(b[a-z0-9]{6,30})$/); return m? m[1] : null; }
window.addEventListener('hashchange',()=>{ const id=briefFromHash(); if(id && S.user && navFor(S.user).some(n=>n.id==='briefs') && S.view!=='briefs') go('briefs',{id}); });

function go(v,opts){
  if(S.view==='briefs' && v!=='briefs' && window.BriefModule) BriefModule.leave();
  S.view=v; S.vt++; S.proj=null;
  clearInterval(S.viewTimer);
  closeBell();
  $('nav').querySelectorAll('.nav').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
  window.scrollTo(0,0);
  if(gated() && v!=='clock'){ S.lockShown=true; viewLocked(v); return; }
  S.lockShown=false;
  const map={dash:viewDash,clock:viewClock,mytasks:viewMyTasks,projects:viewProjects,briefs:()=>viewBriefs(opts),today:viewToday,monthly:viewMonthly,screen:viewScreen,users:viewUsers,settings:viewSettings,blockers:viewBlockers,org:viewOrg,devices:viewDevices,health:viewHealth,desk:viewDesk,locations:viewLocations,tasks:()=>viewTasks(opts),requests:()=>viewRequests(opts),meetings:()=>viewMeetings(opts),exec:viewExec,pulse:viewPulse,sales:()=>viewSoon('sales'),line2:()=>viewSoon('line2')};
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
async function prefetch(){
  if(gated() || document.visibilityState==='hidden') return;
  const list=[];
  if(can('dashboard.view')) list.push(['dash','dash']);
  if(canAny(['projects.view_all','projects.manage_all','projects.manage_own'])) list.push(['plist','projList']);
  if(can('tasks.mine')) list.push(['my','myTasks']);
  if(can('attendance.view_all')) list.push(['board','board']);
  if(can('people.manage')) list.push(['users','users']);
  const need=list.filter(([k])=>!(S.fetched[k] && Date.now()-S.fetched[k]<60000));
  if(!need.length) return;
  // كله في طلب واحد بدل طلب لكل صفحة
  try{
    const r=await call('bundle',{items:need.map(x=>x[1])});
    need.forEach(([k,a])=>{ const x=r[a]; if(x && x.ok){ S.cache[k]=x.data; S.fetched[k]=Date.now(); if(k==='dash'){ if(x.data.unread!=null) S.unread=x.data.unread; renderBell(); } } });
  }catch(e){
    if(!/غير معروفة/.test(e.message||'')) return;
    for(const [k,a] of need){
      try{ const d=await call(a,{}); S.cache[k]=d; S.fetched[k]=Date.now(); if(k==='dash') renderBell(); }catch(e2){ break; }
    }
  }
  saveCache();
}

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
  return `<button class="al sev-${a.sev}" onclick="goAlert(${i})"><span class="dot"></span><span class="tx"><b>${bd(a.title)}</b><span>${bd(a.detail)}</span></span><span class="tg">${esc(a.tag)}</span></button>`;
}
// الجرس: "For you" (إشعارات شخصية) + "Alerts" (تنبيهات محسوبة)
function openBell(){
  const L=alertsList(), N=S.notifs||[];
  $('bellPanel').innerHTML=`<div class="bh">For you${S.unread?` <span class="pill p-bad" style="margin-left:8px">${S.unread} new</span>`:''}<span class="spacer"></span>${S.unread?`<button class="btn ghost small" onclick="event.stopPropagation();readAll()">Mark all read</button>`:''}<button class="btn ghost small" onclick="go('desk')">My Desk</button></div>`+
    (N.length? N.slice(0,10).map((n,i)=>notifHTML(n,i,'bell')).join('') : `<div class="empty" style="padding:16px"><b>All caught up</b>Nothing new for you.</div>`)+
    `<div class="bh" style="border-top:1px solid var(--line)">Alerts<span class="spacer"></span>${can('dashboard.view')?`<button class="btn ghost small" onclick="go('dash')">Open dashboard</button>`:''}</div>`+
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
