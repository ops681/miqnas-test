/* ============ Organization ============
   الأقسام، المسميات الوظيفية، الأدوار والصلاحيات، المناصب، المجموعات.
   كله داتا بتتعدل من هنا، ومفيش حاجة منها مكتوبة في الكود. */
const ORG_TABS=[['DEPTS','Departments'],['JOBS','Job Titles'],['ROLES','Roles & Permissions'],['SEATS','Seats'],['GROUPS','Groups']];
const SLOT_NAMES={'':'— none —',sm:'Store Manager tasks',copy:'Copywriter tasks',uiux:'UI/UX tasks',designer:'Designer tasks',dev:'Developer tasks',fe:'Front End (UI/UX + Dev, Joker)'};
S.orgTab='DEPTS'; S.orgDraft=null;

function viewOrg(){
  setTop('Organization','Departments, job titles, roles, seats and groups · no code changes needed');
  swr('org','orgGet',{},(o,fresh)=>{ if(fresh||!S.orgDraft) S.orgDraft=JSON.parse(JSON.stringify(o)); renderOrg(); });
}
function orgSelect(id,list,val,blank){
  return `<select id="${id}">${blank!==undefined?`<option value="">${esc(blank)}</option>`:''}${list.map(x=>`<option value="${esc(x[0])}"${String(x[0])===String(val)?' selected':''}>${esc(x[1])}</option>`).join('')}</select>`;
}
function renderOrg(){
  const o=S.orgDraft, ed=o.canEdit, T=S.orgTab, ro=ed?'':' disabled';
  const depts=o.depts.map(d=>[d.id,d.name]), users=o.users.map(x=>[x.u,x.name]);
  const permBoxes=(pfx,i,cur)=>`<div class="pfgrid" style="grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:2px 16px">${o.permissions.map(p=>
    `<label class="check" style="margin:6px 0;align-items:flex-start" title="${esc(p.desc)}"><input type="checkbox" data-perm="${pfx}|${i}|${esc(p.code)}"${cur.indexOf(p.code)>=0?' checked':''}${ro}><span><b style="font-size:13px">${esc(p.name)}</b><br><span class="muted" style="font-size:12px">${esc(p.desc)}</span></span></label>`).join('')}</div>`;
  let body='';
  if(T==='DEPTS') body=`<div class="tbl-wrap"><table style="min-width:700px"><tr><th>Code</th><th>Name</th><th>Business line</th><th>Department head</th><th></th></tr>
    ${o.depts.map((d,i)=>`<tr><td><input data-f="depts|${i}|id" value="${esc(d.id)}"${ro} dir="ltr"></td><td><input data-f="depts|${i}|name" value="${esc(d.name)}"${ro}></td><td><input data-f="depts|${i}|line" value="${esc(d.line)}"${ro} placeholder="Line 1"></td><td>${orgSelect(`dh_${i}`,users,d.head,'— none —')}</td><td>${ed?`<button class="btn small ghost danger" onclick="orgDel('depts',${i})">Remove</button>`:''}</td></tr>`).join('')}</table></div>
    <p class="muted" style="font-size:13px">The department head approves leave and permission requests first, then HR. No head means requests go straight to HR.</p>`;
  if(T==='JOBS') body=`<div class="tbl-wrap"><table style="min-width:760px"><tr><th>Job title</th><th>Department</th><th>Project tasks</th><th>Sees brief access</th><th></th></tr>
    ${o.jobs.map((j,i)=>`<tr><td><input data-f="jobs|${i}|name" value="${esc(j.name)}"${ro}></td><td>${orgSelect(`jd_${i}`,depts,j.dept,'—')}</td><td>${orgSelect(`js_${i}`,Object.keys(SLOT_NAMES).filter(k=>k).map(k=>[k,SLOT_NAMES[k]]),j.slot,SLOT_NAMES[''])}</td><td><input type="checkbox" data-b="jobs|${i}|access"${j.access?' checked':''}${ro}></td><td>${ed?`<button class="btn small ghost danger" onclick="orgDel('jobs',${i})">Remove</button>`:''}</td></tr>`).join('')}</table></div>
    <p class="muted" style="font-size:13px">"Project tasks" decides which slot of a project this job can fill. "Sees brief access" is the default for new employees with this job.</p>`;
  if(T==='ROLES') body=`<div style="display:grid;gap:14px">${o.roles.map((r,i)=>`<div class="card"><div class="row" style="align-items:flex-end">
      <div><label>Code</label><input data-f="roles|${i}|id" value="${esc(r.id)}"${ro} dir="ltr"></div><div><label>Name</label><input data-f="roles|${i}|name" value="${esc(r.name)}"${ro}></div>
      <div style="flex:0 0 120px"><label>Level (1–5)</label><input type="number" min="1" max="5" data-f="roles|${i}|level" value="${esc(r.level)}"${ro}></div>
      ${ed?`<div style="flex:0 0 auto"><button class="btn small ghost danger" onclick="orgDel('roles',${i})">Remove</button></div>`:''}</div>
      ${permBoxes('roles',i,r.perms)}</div>`).join('')}</div>`;
  if(T==='SEATS') body=`<div class="tbl-wrap"><table style="min-width:720px"><tr><th>Code</th><th>Seat</th><th>Department</th><th>Holder</th><th></th></tr>
    ${o.seats.map((s,i)=>`<tr><td><input data-f="seats|${i}|id" value="${esc(s.id)}"${ro} dir="ltr"></td><td><input data-f="seats|${i}|title" value="${esc(s.title)}"${ro}></td><td>${orgSelect(`sd_${i}`,depts,s.dept,'—')}</td><td>${orgSelect(`sh_${i}`,users,s.holder,'Vacant')}</td><td>${ed?`<button class="btn small ghost danger" onclick="orgDel('seats',${i})">Remove</button>`:''}</td></tr>`).join('')}</table></div>
    <p class="muted" style="font-size:13px">A seat stays when people change. To hand it over, pick the new holder.</p>`;
  if(T==='GROUPS') body=`<div style="display:grid;gap:14px">${o.groups.map((g,i)=>`<div class="card"><div class="row" style="align-items:flex-end">
      <div><label>Code</label><input data-f="groups|${i}|id" value="${esc(g.id)}"${ro} dir="ltr"></div><div><label>Name</label><input data-f="groups|${i}|name" value="${esc(g.name)}"${ro}></div>
      ${ed?`<div style="flex:0 0 auto"><button class="btn small ghost danger" onclick="orgDel('groups',${i})">Remove</button></div>`:''}</div>
      <h3 style="margin:16px 0 4px">Members</h3><div class="chips">${o.users.map(x=>`<label class="check" style="margin:4px 12px 4px 0"><input type="checkbox" data-mem="${i}|${esc(x.u)}"${g.members.indexOf(x.u)>=0?' checked':''}${ro}>${esc(x.name)}</label>`).join('')}</div>
      <h3 style="margin:16px 0 4px">Extra permissions for members</h3><p class="muted" style="font-size:12.5px;margin:0">Added on top of each member's role. A group never removes permissions.</p>
      ${permBoxes('groups',i,g.perms)}</div>`).join('')}</div>`;
  const key={DEPTS:'depts',JOBS:'jobs',ROLES:'roles',SEATS:'seats',GROUPS:'groups'}[T];
  $('main').innerHTML=`<div class="flt">${ORG_TABS.map(t=>`<button class="${T===t[0]?'on':''}" onclick="orgTab('${t[0]}')">${t[1]} <span>${o[{DEPTS:'depts',JOBS:'jobs',ROLES:'roles',SEATS:'seats',GROUPS:'groups'}[t[0]]].length}</span></button>`).join('')}</div>
    ${ed?'':'<div class="card" style="margin-bottom:12px">View only. Changing the organization needs the Organization permission.</div>'}
    ${body}
    ${ed?`<div class="mfoot"><button class="btn" onclick="orgAdd('${key}')">+ Add</button><span class="spacer"></span><button class="btn" onclick="orgReset()">Discard changes</button><button class="btn primary" id="orgSave" onclick="orgSave()">Save ${ORG_TABS.find(t=>t[0]===T)[1]}</button></div><div class="err" id="orgErr"></div>`:''}`;
}
// كل تعديل في الشاشة بيتحفظ في المسودة لحد ما يدوس Save
function orgCollect(){
  const o=S.orgDraft;
  document.querySelectorAll('#main [data-f]').forEach(el=>{ const [k,i,f]=el.dataset.f.split('|'); if(o[k][i]) o[k][i][f]=el.type==='number'?Number(el.value):el.value.trim(); });
  document.querySelectorAll('#main [data-b]').forEach(el=>{ const [k,i,f]=el.dataset.b.split('|'); if(o[k][i]) o[k][i][f]=el.checked; });
  o.depts.forEach((d,i)=>{ if($('dh_'+i)) d.head=$('dh_'+i).value; });
  o.jobs.forEach((j,i)=>{ if($('jd_'+i)) j.dept=$('jd_'+i).value; if($('js_'+i)) j.slot=$('js_'+i).value; });
  o.seats.forEach((s,i)=>{ if($('sd_'+i)) s.dept=$('sd_'+i).value; if($('sh_'+i)) s.holder=$('sh_'+i).value; });
  ['roles','groups'].forEach(k=>o[k].forEach((r,i)=>{ const boxes=[...document.querySelectorAll(`#main [data-perm^="${k}|${i}|"]`)]; if(boxes.length) r.perms=boxes.filter(b=>b.checked).map(b=>b.dataset.perm.split('|')[2]); }));
  o.groups.forEach((g,i)=>{ const boxes=[...document.querySelectorAll(`#main [data-mem^="${i}|"]`)]; if(boxes.length) g.members=boxes.filter(b=>b.checked).map(b=>b.dataset.mem.split('|')[1]); });
}
function orgTab(t){ if(S.orgDraft.canEdit) orgCollect(); S.orgTab=t; renderOrg(); }
function orgAdd(k){
  orgCollect();
  const blank={depts:{id:'',name:'',line:'',head:''},jobs:{name:'',dept:'',slot:'',access:false},roles:{id:'',name:'',level:1,perms:[]},seats:{id:'',title:'',dept:'',holder:''},groups:{id:'',name:'',members:[],perms:[]}}[k];
  S.orgDraft[k].push(blank); renderOrg();
}
function orgDel(k,i){ orgCollect(); S.orgDraft[k].splice(i,1); renderOrg(); }
function orgReset(){ S.orgDraft=JSON.parse(JSON.stringify(S.cache.org)); renderOrg(); }
async function orgSave(){
  orgCollect();
  const T=S.orgTab, key={DEPTS:'depts',JOBS:'jobs',ROLES:'roles',SEATS:'seats',GROUPS:'groups'}[T];
  const rows=S.orgDraft[key].map(r=>{ const x=Object.assign({},r); if(Array.isArray(x.perms)) x.perms=x.perms.join(','); if(Array.isArray(x.members)) x.members=x.members.join(','); return x; });
  const b=$('orgSave'); b.disabled=true; b.textContent='Saving...'; $('orgErr').textContent='';
  try{
    const o=await call('orgSave',{kind:T,rows});
    S.cache.org=o; S.fetched.org=Date.now(); saveCache(); S.orgDraft=JSON.parse(JSON.stringify(o));
    toast('اتحفظ ✓'); renderOrg(); refreshMe();
  }catch(e){ $('orgErr').textContent=e.message; b.disabled=false; b.textContent='Save'; }
}
