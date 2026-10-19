/* ============ الشركاء (Partners) ============
   أي شريك بيتضاف من هنا: بياخد لينك بورتال ويوزر وباسورد وتقرير شهري، ويظهر لوحده
   في فورم المشروع والبريف. للإدارة بس (projects.manage_all). */
function viewPartners(){
  setTop('Partners','');
  // لو الصفحة لسه ماتحملتش: نرسم على طول من أرقام الداشبورد، والتفاصيل تكمل لما توصل
  const dp=S.cache.dash&&S.cache.dash.partners;
  if(!S.cache.partners && dp) S.cache.partners={partners:dp,platforms:[],colors:[],partial:true};
  swr('partners','partnersAdmin',{},renderPartners);
}
function ptnBadge(p,size){ size=size||40; if(p.logo) return `<span class="ptn-b ptn-bl" style="width:${size}px;height:${size}px" aria-hidden="true"><img src="${esc(p.logo)}" alt=""></span>`; return `<span class="ptn-b" style="width:${size}px;height:${size}px;background:${esc(p.color||'#7C5CFC')};font-size:${Math.round(size*0.42)}px" aria-hidden="true">${esc(p.letter||'')}</span>`; }
function renderPartners(r){
  S.ptnAdm=r;
  const L=r.partners||[], act=L.filter(p=>p.active), off=L.filter(p=>!p.active);
  setTop('Partners', act.length+' active partner'+(act.length===1?'':'s'), `<button class="btn primary" onclick="ptnForm()">+ New partner</button>`);
  const card=p=>`<div class="card ptn-card${p.active?'':' off'}">
      <div class="ptn-h">${ptnBadge(p)}<div class="ptn-t"><b>${esc(p.name)}</b><span class="muted" dir="ltr">${esc(p.nameEn)} · ${esc(p.prefix)}-###${p.platform?' · '+esc(p.platform):''}</span></div>
        ${p.active?'':'<span class="pill p-out">Stopped</span>'}</div>
      <div class="ptn-k">
        <div><b>${p.stores}</b><span>Stores</span></div><div><b style="color:var(--warn)">${p.inProgress}</b><span>Active</span></div>
        <div><b style="color:var(--ok)">${p.launched}</b><span>Launched</span></div><div><b style="color:${p.blocked?'var(--bad)':'inherit'}">${p.blocked}</b><span>Blocked</span></div>
      </div>
      <div class="muted" style="font-size:12.5px">${p.thisMonth} new this month${p.hasUser===undefined?'':' · '+(p.hasUser?'Portal sign-in set':'<span style="color:var(--bad)">Portal locked: no username yet</span>')}</div>
      ${p.noAm&&(r.ams||[]).length?`<div class="ptn-am"><span><b>${p.noAm}</b> store${p.noAm===1?'':'s'} without an Account Manager</span><div class="row" style="gap:6px"><select id="ptnAm_${esc(p.id)}" aria-label="Account Manager"><option value="">Choose…</option>${r.ams.map(a=>`<option value="${esc(a.username)}">${esc(a.name)}</option>`).join('')}</select><button class="btn small primary" onclick="ptnAssignAm('${esc(p.id)}')">Assign</button></div></div>`:p.noAm?`<div class="ptn-am"><span><b>${p.noAm}</b> store${p.noAm===1?'':'s'} without an Account Manager. Add an Account Manager from Employees, then assign them here.</span></div>`:''}
      <div class="ptn-a">${p.active?`<button class="btn primary small" onclick="ptAdmin('${esc(p.id)}')">Portal &amp; report</button> <button class="btn small" onclick="go('zstores',{partner:'${esc(p.id)}'})">Stores</button>`:''}<button class="btn ghost small" onclick="ptnForm('${esc(p.id)}')">Edit</button></div>
    </div>`;
  $('main').innerHTML=`<div class="ptn-grid">${act.map(card).join('')||'<div class="card empty">No partners yet.</div>'}</div>
    ${off.length?`<h3 style="margin:22px 0 10px">Stopped</h3><div class="ptn-grid">${off.map(card).join('')}</div>`:''}
    <p class="muted" style="font-size:13px;margin-top:16px">Pick a partner in a project (or in the brief) and the store shows up in that partner's portal. Each partner sees only its own stores. No phone numbers, passwords or team names are shown in any portal.</p>`;
}
function ptnForm(id){
  if(S.ptnAdm&&S.ptnAdm.partial) return toast('ثانية واحدة، بيحمّل…');
  const r=S.ptnAdm||{partners:[],platforms:[],colors:[]}, p=(r.partners||[]).find(x=>x.id===id)||{name:'',nameEn:'',letter:'',color:(r.colors||[])[ (r.partners||[]).length % ((r.colors||[]).length||1) ]||'#7C5CFC',prefix:'',platform:'',active:true};
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:520px">
    <h2 style="margin:0 0 4px">${id?'Edit partner':'New partner'}</h2>
    <div class="muted" style="font-size:13px;margin-bottom:14px">${id?'Changes show in the portal and the reports right away.':'The partner gets its own portal link right away. Set the username and password after saving.'}</div>
    <div class="pfgrid">
      <div><label>Name (Arabic) *</label><input id="ptnN" value="${esc(p.name)}" dir="auto" placeholder="زد"></div>
      <div><label>Name (English) *</label><input id="ptnE" value="${esc(p.nameEn)}" dir="ltr" placeholder="Zid"></div>
      <div><label>Reference prefix *</label><input id="ptnP" value="${esc(p.prefix)}" dir="ltr" placeholder="ZID" maxlength="8"><div class="muted" style="font-size:12px;margin-top:4px" id="ptnPh">Stores get ${esc(p.prefix||'ZID')}-001, ${esc(p.prefix||'ZID')}-002…</div></div>
      <div><label>Platform</label><select id="ptnPl"><option value="">—</option>${[...(r.platforms||[]),...(p.platform&&(r.platforms||[]).indexOf(p.platform)<0?[p.platform]:[])].map(x=>`<option${x===p.platform?' selected':''}>${esc(x)}</option>`).join('')}</select><div class="muted" style="font-size:12px;margin-top:4px">When a project targets this platform, we suggest this partner.</div></div>
      <div><label>Portal letter</label><input id="ptnL" value="${esc(p.letter)}" dir="ltr" maxlength="2" placeholder="Z"></div>
      <div><label>Partner fee per store</label><div class="row" style="gap:6px"><select id="ptnFt" style="flex:1"><option value="none"${(p.feeType||'none')==='none'?' selected':''}>No fee</option><option value="percent"${p.feeType==='percent'?' selected':''}>% of contract</option><option value="fixed"${p.feeType==='fixed'?' selected':''}>Fixed amount</option></select><input id="ptnFv" type="number" min="0" step="0.01" value="${esc(p.feeValue||'')}" style="width:100px" aria-label="Fee value"></div><div class="muted" style="font-size:12px;margin-top:4px">Filled into the partner's contracts in Finance.</div></div>
      <div><label>Logo</label><div class="row" style="gap:8px;align-items:center"><span id="ptnLg">${ptnBadge(p,40)}</span><label class="btn small" for="ptnLf" style="margin:0">${p.logo?'Change':'Upload'}</label><input type="file" id="ptnLf" accept="image/*" hidden>${p.logo?'<button type="button" class="btn ghost small" id="ptnLx">Remove</button>':''}</div><div class="muted" style="font-size:12px;margin-top:4px">Shows in their portal and reports. Without a logo, the letter and color are used.</div></div>
      <div><label>Color</label><div class="ptn-colors">${(r.colors||[]).map(c=>`<button type="button" class="ptn-c${c===p.color?' on':''}" style="background:${c}" data-c="${c}" aria-label="Color ${c}"></button>`).join('')}</div></div>
    </div>
    ${id?`<label class="pf-chk" style="margin-top:12px"><input type="checkbox" id="ptnA"${p.active?' checked':''}> Active <span class="muted">· stopping closes the portal; the stores stay in the system</span></label>`:''}
    <div class="err" id="ptnErr"></div>
    <div class="mfoot"><button class="btn ghost" onclick="closeModal()">Cancel</button><div class="spacer"></div><button class="btn primary" id="ptnSave">${id?'Save':'Add partner'}</button></div></div></div>`;
  let color=p.color, logoNew;
  $('ptnLf').onchange=async()=>{ const f=$('ptnLf').files[0]; if(!f) return; try{ logoNew=await imgShrink(f,160); $('ptnLg').innerHTML=ptnBadge({logo:logoNew},40); }catch(e){ toast('مش قادر أقرا الصورة دي'); } };
  if($('ptnLx')) $('ptnLx').onclick=()=>{ logoNew=''; $('ptnLg').innerHTML=ptnBadge(Object.assign({},p,{logo:''}),40); };
  document.querySelectorAll('.ptn-c').forEach(b=>b.onclick=()=>{ color=b.dataset.c; document.querySelectorAll('.ptn-c').forEach(x=>x.classList.toggle('on',x===b)); });
  if(!id) $('ptnE').addEventListener('input',()=>{ const v=$('ptnE').value.replace(/[^A-Za-z0-9]/g,'').toUpperCase(); if(!$('ptnP').dataset.t) $('ptnP').value=v.slice(0,4); if(!$('ptnL').dataset.t) $('ptnL').value=v.slice(0,1); });
  const ph=()=>{ const v=$('ptnP').value.toUpperCase().replace(/[^A-Z0-9]/g,'')||'ZID'; $('ptnPh').textContent=`Stores get ${v}-001, ${v}-002…`; };
  $('ptnP').addEventListener('input',()=>{ $('ptnP').dataset.t=1; ph(); }); $('ptnE').addEventListener('input',ph); $('ptnL').addEventListener('input',()=>$('ptnL').dataset.t=1);
  $('ptnSave').onclick=async()=>{
    $('ptnErr').textContent=''; $('ptnSave').disabled=true;
    const d={id:id||'',name:$('ptnN').value,nameEn:$('ptnE').value,prefix:$('ptnP').value,platform:$('ptnPl').value,letter:$('ptnL').value,color,feeType:$('ptnFt').value,feeValue:$('ptnFv').value};
    if(logoNew!==undefined){ if(logoNew) d.logo=logoNew; else d.removeLogo=true; }
    if(id) d.active=$('ptnA').checked;
    if(id&&p.active&&!d.active&&!confirm('البورتال بتاع الشريك ده هيتقفل. متاجره هتفضل في السيستم. متأكد؟')){ $('ptnSave').disabled=false; return; }
    try{ const out=await call('partnerSave',{partner:d}); S.cache.partners=out; S.fetched.partners=Date.now(); closeModal(); renderPartners(out); toast(id?'اتحفظ ✓':'اتضاف الشريك ✓');
      if(!id) ptAdmin(out.id); }
    catch(e){ $('ptnErr').textContent=e.message; $('ptnSave').disabled=false; }
  };
  setTimeout(()=>$(id?'ptnN':'ptnN').focus(),30);
}

// متاجر الشريك اللي مالهاش Account Manager (زي المتاجر اللي اتنقلت من سيستم تاني)
async function ptnAssignAm(pid){
  const am=$('ptnAm_'+pid).value; if(!am) return toast('اختار الـ Account Manager');
  const p=(S.ptnAdm.partners||[]).find(x=>x.id===pid), who=(S.ptnAdm.ams||[]).find(a=>a.username===am);
  if(!confirm(p.noAm+' متجر هيتسجلوا على '+(who?who.name:am)+'. متأكد؟')) return;
  try{ const out=await call('partnerAssignAm',{partner:pid,am}); S.cache.partners=out; S.fetched.partners=Date.now(); renderPartners(out); toast('اتسجل '+out.assigned+' متجر ✓'); }
  catch(e){ alert(e.message); }
}
/* ----- بورتال الشريك: اللينك + اليوزر والباسورد + التقرير الشهري ----- */
async function ptAdmin(pid,regen){
  pid=pid||'Zid';
  if(regen && !confirm('اللينك القديم هيقف خالص والشريك محتاج اللينك الجديد ويسجل دخول تاني. متأكد؟')) return;
  try{
    const r=await call('portalAdmin',Object.assign({partner:pid},regen?{regen:true}:{}));
    S.ptAdm=r; ptAdminRender();
    if(regen) toast('اتعمل لينك جديد');
  }catch(e){ alert(e.message); }
}
function ptAdminRender(){
  const r=S.ptAdm; if(!r) return;
  const P=r.partner, url=location.origin+location.pathname.replace(/[^/]*$/,'')+'portal.html?k='+r.key;
  const months=[]; { const [y0,m0]=String(r.first||'').split('-').map(Number); const now=new Date(); let y=y0||now.getFullYear(), m=m0||now.getMonth()+1; while(y<now.getFullYear()||(y===now.getFullYear()&&m<=now.getMonth()+1)){ months.push(y+'-'+String(m).padStart(2,'0')); m++; if(m>12){m=1;y++;} } }
  const mn=m=>new Date(m+'-15').toLocaleDateString('en-GB',{month:'long',year:'numeric'});
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:580px">
    <div class="row" style="gap:10px;align-items:center;margin-bottom:6px">${ptnBadge(P,34)}<h2 style="margin:0">${esc(P.nameEn)} partner portal</h2></div>
    <p class="muted" style="margin:0 0 14px;font-size:13.5px">${r.stores} ${esc(P.nameEn)} stores. The ${esc(P.nameEn)} team opens this link and signs in with the username and password below. They only see their own stores.</p>
    <div class="pt-link"><input readonly value="${esc(url)}" dir="ltr" onclick="this.select()" aria-label="Portal link"><button class="btn primary" onclick="navigator.clipboard.writeText('${esc(url)}').then(()=>toast('اتنسخ اللينك'))">Copy</button></div>
    <h3 style="margin:18px 0 6px;font-size:15px">Portal sign-in</h3>
    <div class="muted" style="font-size:13px;margin-bottom:8px">${r.user&&r.hasPass?`Current username: <b dir="ltr">${esc(r.user)}</b>. Saving a new one signs everyone out of this portal.`:'<span style="color:var(--bad)">No username yet. The portal stays locked until you set one.</span>'}</div>
    <div class="row" style="gap:8px;flex-wrap:wrap">
      <input id="ptAu" placeholder="Username" dir="ltr" autocomplete="off" value="${esc(r.user||'')}" style="flex:1 1 150px" aria-label="Portal username">
      <input id="ptAp" type="password" placeholder="New password (8+)" dir="ltr" autocomplete="new-password" style="flex:1 1 150px" aria-label="Portal password">
      <button class="btn" onclick="const i=$('ptAp');i.type=i.type==='password'?'text':'password'">Show</button>
      <button class="btn primary" onclick="ptCredsSave()">Save</button>
    </div>
    <h3 style="margin:18px 0 6px;font-size:15px">Monthly report (PDF)</h3>
    <div class="row" style="gap:8px;flex-wrap:wrap">
      <select id="ptRm" style="flex:1 1 180px" aria-label="Report month"><option value="all">All stores</option>${months.reverse().map((m,i)=>`<option value="${m}"${i===0?' selected':''}>${mn(m)}</option>`).join('')}</select>
      <button class="btn primary" onclick="ptRepOpen()">Print / PDF</button>
    </div>
    <div class="muted" style="font-size:12.5px;margin-top:6px">A PDF of the previous month is also saved to Google Drive on the 1st of every month.</div>
    <div class="mfoot"><button class="btn ghost danger" onclick="ptAdmin('${esc(P.id)}',true)">New link (stop the old one)</button><div class="spacer"></div><a class="btn" href="${esc(url)}" target="_blank" rel="noopener">Open portal</a><button class="btn ghost" onclick="closeModal()">Close</button></div></div></div>`;
}
async function ptCredsSave(){
  const user=$('ptAu').value.trim(), pass=$('ptAp').value;
  if(!user||!pass) return alert('اكتب اليوزر والباسورد الجديد');
  if(S.ptAdm&&S.ptAdm.hasPass&&!confirm('الشريك هيحتاج اليوزر والباسورد الجداد ويسجل دخول تاني. متأكد؟')) return;
  try{ S.ptAdm=await call('portalAdmin',{partner:S.ptAdm.partner.id,setCreds:true,user,pass}); ptAdminRender(); toast('اتحفظ اليوزر والباسورد');
    if(S.view==='partners') call('partnersAdmin').then(x=>{ S.cache.partners=x; if(S.view==='partners'&&!$('modalRoot').innerHTML) renderPartners(x); }).catch(()=>{}); }
  catch(e){ alert(e.message); }
}
async function ptRepOpen(){
  const v=$('ptRm').value, w=window.open('','_blank');
  if(w) w.document.write('<p style="font-family:sans-serif;padding:24px">Preparing report...</p>');
  try{
    const r=await call('partnerReport',Object.assign({partner:S.ptAdm.partner.id},v==='all'?{all:true}:{month:v}));
    if(!w) return alert('Allow pop-ups for this site and try again');
    w.document.open(); w.document.write(r.html); w.document.close();
    setTimeout(()=>{ try{ w.focus(); w.print(); }catch(e){} },900);
  }catch(e){ if(w) w.close(); alert(e.message); }
}

/* كارت صغير في الداشبورد */
function ptnDashHTML(L){
  if(!L||!L.length) return '';
  return `<div class="card ptn-mini"><div class="cr-h"><h2>Partners</h2><div class="spacer"></div><button class="btn ghost small" onclick="go('partners')">All partners →</button></div>
    <div class="ptn-rows">${L.map(p=>`<button type="button" class="ptn-row" onclick="go('partners')">${ptnBadge(p,30)}<b>${esc(p.name)}</b>
      <span><b>${p.stores}</b> stores</span><span><b style="color:var(--warn)">${p.inProgress}</b> in progress</span><span><b style="color:var(--ok)">${p.launched}</b> launched</span>${p.blocked?`<span><b style="color:var(--bad)">${p.blocked}</b> blocked</span>`:''}<span class="muted">${p.thisMonth} new this month</span></button>`).join('')}</div></div>`;
}
