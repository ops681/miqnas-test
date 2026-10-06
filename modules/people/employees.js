/* ============ Employees ============ */
const JOBS=['Store Manager','Copywriter','UI/UX','Designer','Developer','Front End','Account Manager','HR','Manager','Operations Manager'];
const ROLE_NAMES={admin:'Admin',hr:'HR',am:'Account Manager',team:'Team'};
function viewUsers(){
  setTop('Employees','Add, edit or archive employees', `<button class="btn primary" onclick="editUser()">+ New Employee</button>`);
  swr('users','users',{},renderUsers);
}
function renderUsers(U,keep){
  const act=U.filter(u=>u.active), arch=U.filter(u=>!u.active);
  const row=u=>{ const lock=S.user.role==='hr'&&u.role==='admin'; const me=u.username===S.user.username;
    return `<tr><td><div style="display:flex;align-items:center;gap:10px"><div class="av">${esc(initials(u.name))}</div><div><b>${esc(u.name)}</b><div class="sub2">${esc(u.username)}</div></div></div></td>
    <td>${esc(ROLE_NAMES[u.role]||u.role)}</td><td class="muted">${esc(u.job)}</td><td>${u.clocks?'✓':'—'}</td>
    <td>${u.role==='team'?(u.seeAccess?'✓':'—'):'<span class="muted" style="font-size:12px">Always</span>'}</td>
    <td class="muted" style="font-size:13px">${esc(u.lastLogin)||'—'}</td>
    <td style="white-space:nowrap">${lock?'':u.active?`<button class="btn small" onclick="editUser('${esc(u.username)}')">Edit</button> <button class="btn small" onclick="setPw('${esc(u.username)}')">Set Password</button>${me?'':` <button class="btn small danger" onclick="archiveUser('${esc(u.username)}')">Archive</button>`}`:`<button class="btn small" onclick="restoreUser('${esc(u.username)}')">Restore</button>`}</td></tr>`; };
  $('main').innerHTML=`
  <div class="tbl-wrap"><table style="min-width:860px">
    <tr><th>Employee</th><th>Role</th><th>Job</th><th>Clocks in</th><th>Sees access</th><th>Last login</th><th></th></tr>
    ${act.map(row).join('')}
  </table></div>
  ${arch.length?`<h3 style="margin-top:28px">Archived <span class="muted" style="font-weight:400">· can't sign in</span></h3><div class="tbl-wrap" style="opacity:.85"><table style="min-width:860px">
    <tr><th>Employee</th><th>Role</th><th>Job</th><th>Clocks in</th><th>Sees access</th><th>Last login</th><th></th></tr>${arch.map(row).join('')}</table></div>`:''}`;
}
function closeModal(){ if(!$('modalRoot').querySelector('.alarm')) $('modalRoot').innerHTML=''; }
function editUser(un){
  const U=S.cache.users||[];
  const u=un? U.find(x=>x.username===un) : {username:'',name:'',role:'team',job:'Store Manager',clocks:true,seeAccess:false};
  const roles=[['team','Team'],['am','Account Manager'],['hr','HR']].concat(S.user.role==='admin'?[['admin','Admin']]:[]);
  $('modalRoot').innerHTML=`<div class="modal"><div class="card">
    <h2>${un?'Edit Employee':'New Employee'}</h2>
    <label for="fN">Name</label><input id="fN" value="${esc(u.name)}">
    <label for="fU">Username</label><input id="fU" value="${esc(u.username)}" ${un?'disabled':''} placeholder="e.g. ahmed.ali" autocapitalize="none" spellcheck="false">
    ${un?'':`<label for="fP">Password</label><input id="fP" placeholder="6 characters or more" autocomplete="off" spellcheck="false">`}
    <label for="fR">Role</label><select id="fR">${roles.map(r=>`<option value="${r[0]}" ${u.role===r[0]?'selected':''}>${r[1]}</option>`).join('')}</select>
    <label for="fJ">Job</label><select id="fJ">${JOBS.concat(u.job&&!JOBS.includes(u.job)?[u.job]:[]).map(j=>`<option ${j===u.job?'selected':''}>${esc(j)}</option>`).join('')}</select>
    <label class="check"><input type="checkbox" id="fC" ${u.clocks?'checked':''}>Clocks in / out</label>
    <label class="check"><input type="checkbox" id="fX" ${u.seeAccess?'checked':''}>Sees the Access section in briefs <span class="muted" style="font-weight:400;font-size:12px">(team only)</span></label>
    <div class="err" id="fE"></div>
    <div class="mfoot"><button class="btn primary" id="fS">${un?'Save':'Create'}</button><button class="btn" onclick="closeModal()">Cancel</button></div>
  </div></div>`;
  $('fS').onclick=async()=>{
    $('fE').textContent=''; $('fS').disabled=true;
    const data={username:$('fU').value.trim().toLowerCase(),name:$('fN').value,role:$('fR').value,job:$('fJ').value,clocks:$('fC').checked,seeAccess:$('fX').checked};
    if(!un) data.password=$('fP').value;
    try{
      await call('saveUser',{isNew:!un,user:data});
      if(!un){ showCreds(data.name,data.username,data.password); } else { closeModal(); toast('اتحفظ ✓'); }
      refreshUsers();
    }catch(e){ $('fE').textContent=e.message; $('fS').disabled=false; }
  };
}
function refreshUsers(){ call('users').then(r=>{ S.cache.users=r; saveCache(); if(S.view==='users') renderUsers(r,true); }).catch(()=>{}); }
function showCreds(name,un,pw){
  $('modalRoot').innerHTML=`<div class="modal"><div class="card">
    <h2>Login for ${esc(name)}</h2>
    <p class="muted" dir="rtl" style="text-align:right">ابعتله اليوزر والباسورد دول.</p>
    <div class="card" style="background:#F7FAF9;font-size:15px;line-height:2"><div>Username: <b>${esc(un)}</b></div><div>Password: <b>${esc(pw)}</b></div><div>Link: <b>${esc(SITE_URL)}</b></div></div>
    <div class="mfoot"><button class="btn primary" id="cpy">Copy</button><button class="btn" onclick="closeModal()">Done</button></div>
  </div></div>`;
  $('cpy').onclick=()=>{ const t='Link: '+SITE_URL+'\nUsername: '+un+'\nPassword: '+pw; (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('اتنسخ ✓')).catch(()=>toast('انسخه يدوي')); };
}
function setPw(un){
  const u=(S.cache.users||[]).find(x=>x.username===un)||{name:un};
  $('modalRoot').innerHTML=`<div class="modal"><div class="card">
    <h2>Set Password · ${esc(u.name)}</h2>
    <p class="muted" dir="rtl" style="text-align:right">أول ما تحفظ، الباسورد القديم هيبطل يشتغل، والموظف هيخرج من أي جهاز كان فاتح عليه.</p>
    <label for="nP">New password</label><input id="nP" placeholder="6 characters or more" autocomplete="off" spellcheck="false">
    <div class="err" id="pE"></div>
    <div class="mfoot"><button class="btn primary" id="pS">Save</button><button class="btn" onclick="closeModal()">Cancel</button></div>
  </div></div>`;
  $('pS').onclick=async()=>{
    $('pE').textContent=''; $('pS').disabled=true;
    try{ const pw=$('nP').value; await call('setPassword',{username:un,password:pw}); showCreds(u.name,un,pw); }
    catch(e){ $('pE').textContent=e.message; $('pS').disabled=false; }
  };
}
async function archiveUser(un){
  const u=(S.cache.users||[]).find(x=>x.username===un)||{name:un};
  $('modalRoot').innerHTML=`<div class="modal"><div class="card">${LOADING}</div></div>`;
  let imp;
  try{ imp=await call('userImpact',{username:un}); }catch(e){ closeModal(); alert(e.message); return; }
  const JOBMAP={sm:'store manager',copy:'copywriter',uiux:'ui/ux',designer:'designer',dev:'developer',fe:'front end',joker:'front end'};
  const opts=(role)=>{ if(role==='am') return imp.ams.map(a=>`<option value="${esc(a.u)}">${esc(a.name)}</option>`).join('');
    const pref=imp.team.filter(t=>String(t.job).toLowerCase()===JOBMAP[role]), rest=imp.team.filter(t=>String(t.job).toLowerCase()!==JOBMAP[role]);
    return pref.concat(rest).map(t=>`<option value="${esc(t.u)}">${esc(t.name)} · ${esc(t.job)}</option>`).join(''); };
  $('modalRoot').innerHTML=`<div class="modal"><div class="card">
    <h2>Archive ${esc(u.name)}</h2>
    <p class="muted" dir="rtl" style="text-align:right">مش هيقدر يدخل السيستم تاني، ولو فاتحه دلوقتي هيخرج على طول. حضوره وشغله القديم هيفضلوا محفوظين، وتقدر ترجّعه بعدين.</p>
    ${imp.projects.length?`<h3 style="margin-top:16px">Replace in active projects</h3>${imp.projects.map(p=>p.roles.map(r=>`<label for="r_${esc(p.id)}_${r.role}">${esc(p.id)} · ${esc(p.client)} — ${esc(r.label)}</label><select id="r_${esc(p.id)}_${r.role}" data-k="${esc(p.id)}|${r.role}"><option value="">Choose...</option>${opts(r.role)}</select>`).join('')).join('')}`:''}
    ${imp.briefs?`<label for="amRepl">Move his ${imp.briefs} brief(s) to</label><select id="amRepl"><option value="">Choose...</option>${imp.owners.map(o=>`<option value="${esc(o.u)}">${esc(o.name)}</option>`).join('')}</select>`:''}
    <div class="err" id="aE"></div>
    <div class="mfoot"><button class="btn primary danger" id="aS" style="background:var(--bad);border-color:var(--bad);color:#fff">Archive</button><button class="btn" onclick="closeModal()">Cancel</button></div>
  </div></div>`;
  $('aS').onclick=async()=>{
    $('aE').textContent='';
    const repl={}; let miss=false;
    $('modalRoot').querySelectorAll('select[data-k]').forEach(s=>{ if(!s.value) miss=true; repl[s.dataset.k]=s.value; });
    const am=$('amRepl')? $('amRepl').value : '';
    if(miss || ($('amRepl') && !am)){ $('aE').textContent='اختار بديل لكل حاجة الأول'; return; }
    $('aS').disabled=true;
    try{ await call('archiveUser',{username:un,repl,amRepl:am}); closeModal(); toast('اتأرشف '+u.name+' ✓'); refreshUsers(); }
    catch(e){ $('aE').textContent=e.message; $('aS').disabled=false; }
  };
}
async function restoreUser(un){
  if(!confirm('ترجّع الموظف ده؟ هيقدر يدخل تاني بنفس الباسورد.')) return;
  try{ await call('restoreUser',{username:un}); toast('رجع ✓'); refreshUsers(); }catch(e){ alert(e.message); }
}
