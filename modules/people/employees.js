/* ============ Employees ============ */
// الأدوار والمسميات جاية من صفحة Organization
const hasP=(u,p)=>(u.perms||[]).indexOf(p)>=0;
function loadOrg(){ return S.cache.org ? Promise.resolve(S.cache.org) : call('orgGet').then(o=>{ S.cache.org=o; return o; }); }
function viewUsers(){
  setTop('Employees','Add, edit or archive employees', `<button class="btn primary" onclick="editUser()">+ New Employee</button>`);
  swr('users','users',{},renderUsers);
}
function renderUsers(U,keep){
  const act=U.filter(u=>u.active), arch=U.filter(u=>!u.active);
  const row=u=>{ const lock=u.canManage===false; const me=u.username===S.user.username;
    return `<tr><td><div style="display:flex;align-items:center;gap:10px"><div class="av" data-u="${esc(u.username)}">${esc(initials(u.name))}</div><div><b>${esc(u.name)}</b><div class="sub2">${esc(u.username)}</div></div></div></td>
    <td>${esc(u.roleName||u.role)}${u.founder?' <span class="pill p-yel" style="font-size:10.5px">Founder</span>':u.clevel?' <span class="pill p-prog" style="font-size:10.5px">C-level</span>':''}</td><td class="muted">${esc(u.job)}<div class="sub2">${esc([u.empType==='part'?'Part-time':'Full-time',({remote:'Remote',onsite:'Onsite',hybrid:'Hybrid'})[u.workMode]||'',(u.lines||[]).join(' + ')].filter(Boolean).join(' · '))}</div></td><td>${u.founder?'<span class="muted" style="font-size:12px">Founder</span>':u.clocks?'✓':'—'}</td>
    <td>${!hasP(u,'briefs.access_all')?(u.seeAccess?'✓':'—'):'<span class="muted" style="font-size:12px">Always</span>'}</td>
    <td class="muted" style="font-size:13px">${esc(u.lastLogin)||'—'}</td>
    <td style="white-space:nowrap">${lock?'':u.active?`${!VA_TAB&&(can('system.admin')||can('people.view_as'))&&!me?`<button class="btn small ghost" title="See the system as ${esc(u.name)} (view only)" onclick="viewAsOpen('${esc(u.username)}')">👁 View as</button> `:''}<button class="btn small" onclick="editUser('${esc(u.username)}')">Edit</button> <button class="btn small" onclick="setPw('${esc(u.username)}')">Set Password</button> <button class="btn small" onclick="avEdit('${esc(u.username)}')">Photo</button>${me?'':` <button class="btn small danger" onclick="archiveUser('${esc(u.username)}')">Archive</button>`}`:`<button class="btn small" onclick="restoreUser('${esc(u.username)}')">Restore</button>`}</td></tr>`; };
  $('main').innerHTML=`
  <div class="tbl-wrap"><table style="min-width:860px">
    <tr><th>Employee</th><th>Role</th><th>Job</th><th>Clocks in</th><th>Sees access</th><th>Last login</th><th></th></tr>
    ${act.map(row).join('')}
  </table></div>
  ${arch.length?`<h3 style="margin-top:28px">Archived <span class="muted" style="font-weight:400">· can't sign in</span></h3><div class="tbl-wrap" style="opacity:.85"><table style="min-width:860px">
    <tr><th>Employee</th><th>Role</th><th>Job</th><th>Clocks in</th><th>Sees access</th><th>Last login</th><th></th></tr>${arch.map(row).join('')}</table></div>`:''}`;
}
function closeModal(){ if(!$('modalRoot').querySelector('.alarm')) $('modalRoot').innerHTML=''; }
async function editUser(un){
  let O; try{ O=await loadOrg(); }catch(e){ alert(e.message); return; }
  const U=S.cache.users||[];
  const lowest=O.roles.slice().sort((a,b)=>a.level-b.level)[0]||{id:''};
  const u=un? U.find(x=>x.username===un) : {username:'',name:'',role:lowest.id,job:(O.jobs[0]||{}).name||'',clocks:true,seeAccess:false};
  const roles=O.roles.filter(r=>can('system.admin')||r.perms.indexOf('system.admin')<0||r.id===u.role).map(r=>[r.id,r.name]);
  const LINES=['Line 1','Line 2','Sales'], uL=u.lines&&u.lines.length?u.lines:['Line 1'];
  const tlList=U.filter(x=>x.active&&x.username!==u.username&&!x.founder);
  const JOBS=O.jobs.map(j=>j.name);
  $('modalRoot').innerHTML=`<div class="modal"><div class="card">
    <h2>${un?'Edit Employee':'New Employee'}</h2>
    <label for="fN">Name</label><input id="fN" value="${esc(u.name)}">
    <label for="fU">Username</label><input id="fU" value="${esc(u.username)}" ${un?'disabled':''} placeholder="e.g. ahmed.ali" autocapitalize="none" spellcheck="false">
    ${un?'':`<label for="fP">Password</label><input id="fP" placeholder="6 characters or more" autocomplete="off" spellcheck="false">`}
    <label for="fR">Role</label><select id="fR">${roles.map(r=>`<option value="${r[0]}" ${u.role===r[0]?'selected':''}>${r[1]}</option>`).join('')}</select>
    <label for="fJ">Job</label><select id="fJ">${JOBS.concat(u.job&&!JOBS.includes(u.job)?[u.job]:[]).map(j=>`<option ${j===u.job?'selected':''}>${esc(j)}</option>`).join('')}</select>
    ${u.founder?`<div class="muted" style="font-size:13px;margin:10px 0">Founders don't clock in.</div><input type="checkbox" id="fC" hidden>`:`<label class="check"><input type="checkbox" id="fC" ${u.clocks?'checked':''}>Clocks in / out</label>`}
    <div class="pfgrid" style="grid-template-columns:1fr 1fr;gap:10px;margin-top:6px">
      <div><label for="fT">Employment</label><select id="fT"><option value="full"${u.empType!=='part'?' selected':''}>Full-time · 8 h</option><option value="part"${u.empType==='part'?' selected':''}>Part-time · 4 h</option></select></div>
      <div><label for="fW">Works</label><select id="fW">${[['remote','Remote'],['onsite','Onsite'],['hybrid','Hybrid']].map(m=>`<option value="${m[0]}"${(u.workMode||'remote')===m[0]?' selected':''}>${m[1]}</option>`).join('')}</select></div>
    </div>
    <label for="fL">Team Leader <span class="muted" style="font-weight:400;font-size:12px">· approves their leave first (optional)</span></label>
    <select id="fL"><option value="">— No team leader —</option>${tlList.map(x=>`<option value="${esc(x.username)}"${u.teamLeader===x.username?' selected':''}>${esc(x.name)}${x.job?' · '+esc(x.job):''}</option>`).join('')}</select>
    <label>Lines <span class="muted" style="font-weight:400;font-size:12px">· which business lines they work in</span></label>
    <div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:6px">${LINES.map(l=>`<label class="check" style="margin:0"><input type="checkbox" class="fLn" value="${l}"${uL.indexOf(l)>=0?' checked':''}>${l}</label>`).join('')}</div>
    <label class="check"><input type="checkbox" id="fX" ${u.seeAccess?'checked':''}>Sees the Access section in briefs <span class="muted" style="font-weight:400;font-size:12px">(if their role doesn't already)</span></label>
    <div class="err" id="fE"></div>
    <div class="mfoot"><button class="btn primary" id="fS">${un?'Save':'Create'}</button><button class="btn" onclick="closeModal()">Cancel</button></div>
  </div></div>`;
  if(typeof pickify==='function') pickify($('fL'), tlList.map(x=>({u:x.username,name:x.name,job:x.job,dept:x.dept||''})));
  $('fS').onclick=async()=>{
    $('fE').textContent=''; $('fS').disabled=true;
    const data={username:$('fU').value.trim().toLowerCase(),name:$('fN').value,role:$('fR').value,job:$('fJ').value,clocks:$('fC').checked,seeAccess:$('fX').checked,
      profile:{teamLeader:$('fL').value,lines:[...document.querySelectorAll('.fLn:checked')].map(x=>x.value),empType:$('fT').value,workMode:$('fW').value}};
    if(!data.profile.lines.length){ $('fE').textContent='اختار Line واحد على الأقل'; $('fS').disabled=false; return; }
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
  const opts=(role)=>{ if(role==='am') return imp.ams.map(a=>`<option value="${esc(a.u)}">${esc(a.name)}</option>`).join('');
    const pref=imp.team.filter(t=>(t.slots||[]).indexOf(role)>=0), rest=imp.team.filter(t=>(t.slots||[]).indexOf(role)<0);
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
