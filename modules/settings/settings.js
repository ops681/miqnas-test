/* ============ Settings ============ */
const SET_GROUPS=[
  ['Project alerts','When a project shows up as At risk, Behind or Overdue',[
    ['risk_days','Warn before Target Launch','Behind-schedule projects turn red this many days before the deadline','days'],
    ['risk_gap','Behind schedule by','Done % vs expected % (based on working days passed)','%'],
    ['proj_days','Project length','Working days from start date to Target Launch (Friday off). Applies to new and edited projects','days']]],
  ['Task alerts','Catch tasks that are stuck',[
    ['idle_days','Ready but not started','Task is unlocked and nobody started it for','days'],
    ['block_days','Waiting on a teammate','Someone has nothing to do because they wait for a handover for','days'],
    ['stale_days','In Progress with no activity','Status is In Progress but nothing changed for','days']]],
  ['Screen sharing','Screenshots go straight to Google Drive; only the summary shows in the system',[
    ['shot_min','Screenshot every','How often a screenshot is taken while clocked in','minutes'],
    ['stop_count','Alert after sharing stops','Number of stops in one day before you get an alert','times'],
    ['off_min','Alert after time not shared','Total minutes without sharing in one day','minutes'],
    ['keep_days','Keep screenshots for','Older screenshots are deleted from Drive automatically','days']]],
  ['Attendance','Clock-in and clock-out alerts',[
    ['forgot_h','Forgot to clock out','Alert when someone is still clocked in after','hours'],
    ['break_max','Long break','Alert when a break runs longer than','minutes'],
    ['loc_min','Location every','How often the location is taken during the shift','minutes']]]
];
function viewSettings(){
  setTop('Settings','Admins only · changes apply to the whole team', `<button class="btn primary" id="setSave">Save changes</button>`);
  $('setSave').onclick=saveSettings;
  swr('settings','settingsGet',{},renderSettings);
}
function renderSettings(v){
  $('main').innerHTML=`<div style="max-width:900px;display:grid;gap:18px">
  <div id="setBrand"></div><div id="setPush"></div><div id="setMove"></div>
  ${SET_GROUPS.map(g=>`<div class="card flush"><div class="chead" style="flex-direction:column;align-items:flex-start;gap:2px"><h2>${g[0]}</h2><div class="muted" style="font-size:13px">${g[1]}</div></div>
    ${g[2].map(it=>`<div class="set"><div class="tx"><label for="st_${it[0]}">${it[1]}</label><div>${it[2]}</div></div><input type="number" min="1" id="st_${it[0]}" value="${esc(v[it[0]])}"><span class="u">${it[3]}</span></div>`).join('')}</div>`).join('')}
  <div class="card flush"><div class="chead" style="flex-direction:column;align-items:flex-start;gap:2px"><h2>Sign-in security</h2><div class="muted" style="font-size:13px">Turn off only in an emergency</div></div>
    <div class="set"><div class="tx"><label for="st_device_lock">Registered device only</label><div>Each employee signs in from one approved device. A new device needs approval from the Devices page</div></div><input type="checkbox" id="st_device_lock" ${v.device_lock?'checked':''} style="width:20px;height:20px"></div>
    <div class="set"><div class="tx"><label for="st_clock_first">Clock in before anything else</label><div>Employees who clock in see only the Time Clock until they clock in</div></div><input type="checkbox" id="st_clock_first" ${v.clock_first?'checked':''} style="width:20px;height:20px"></div>
    <div class="set"><div class="tx"><label for="st_location_on">Location during the shift</label><div>Location is required to clock in and is taken regularly until clock out</div></div><input type="checkbox" id="st_location_on" ${v.location_on?'checked':''} style="width:20px;height:20px"></div>
    <div class="set"><div class="tx"><label for="st_one_session">One session at a time</label><div>Signing in somewhere else signs the account out of the old place</div></div><input type="checkbox" id="st_one_session" ${v.one_session?'checked':''} style="width:20px;height:20px"></div></div>
  <div class="card flush"><div class="chead" style="flex-direction:column;align-items:flex-start;gap:2px"><h2>Work week & requests</h2><div class="muted" style="font-size:13px">Days off are skipped when counting leave days and project working days</div></div>
    <div class="set"><div class="tx"><label>Weekly days off</label><div>Tick every day the company is closed</div></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">${[['off_sat','Sat'],['off_sun','Sun'],['off_mon','Mon'],['off_tue','Tue'],['off_wed','Wed'],['off_thu','Thu'],['off_fri','Fri']].map(d=>`<label class="check" style="margin:0"><input type="checkbox" id="st_${d[0]}"${v[d[0]]?' checked':''}>${d[1]}</label>`).join('')}</div></div>
    <div class="set"><div class="tx"><label for="st_permissions_on">Hourly permissions</label><div>Let employees ask for a permission of an hour or two (late arrival / leaving early). Off means the option is hidden</div></div><input type="checkbox" id="st_permissions_on" ${v.permissions_on?'checked':''} style="width:20px;height:20px"></div></div>
  <div class="card" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap"><div style="flex:1 1 320px"><h2 style="margin:0 0 4px">Work hours</h2><div class="muted" style="font-size:13px">Off for now, since the team's hours vary. Late-arrival alerts will use this later.</div></div>
    <label class="check" style="margin:0"><input type="checkbox" id="st_late_on" ${v.late_on?'checked':''} disabled>Late-arrival alerts</label></div>
  </div>`;
  setBrandCard(); setPushCard(); setMoveCard();
}
/* ----- هوية الشركة ----- */
function setBrandCard(){
  const B=S.brand||{}; let logo=B.logo||'';
  const draw=()=>{ $('setBrand').innerHTML=`<div class="card"><h2 style="margin:0 0 4px">Company identity</h2><div class="muted" style="font-size:13px;margin-bottom:14px">Your logo and name show for everyone: the side menu, sign-in, the browser tab, portals and printed reports.</div>
    <div class="row" style="gap:16px;align-items:center;flex-wrap:wrap"><div class="brand-prev">${logo?`<img src="${esc(logo)}" alt="Logo">`:'<span class="muted" style="font-size:12px">No logo</span>'}</div>
      <div style="display:grid;gap:8px;flex:1 1 260px"><label>Company name</label><input id="brN" value="${esc(B.name||'')}" placeholder="Miqnas" maxlength="40">
        <div class="row" style="gap:8px;flex-wrap:wrap"><label class="btn" for="brF" style="margin:0">${logo?'Change logo':'Upload logo'}</label><input type="file" id="brF" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden>${logo?'<button class="btn ghost danger" id="brX">Remove logo</button>':''}<div class="spacer"></div><button class="btn primary" id="brS">Save identity</button></div>
        <div class="muted" style="font-size:12px">PNG with a transparent background looks best. It is resized automatically.</div><div class="err" id="brE"></div></div></div></div>`;
    $('brF').onchange=async()=>{ const f=$('brF').files[0]; if(!f) return; try{ logo=await imgShrink(f,256); draw(); }catch(e){ $('brE').textContent='مش قادر أقرا الصورة دي'; } };
    if($('brX')) $('brX').onclick=()=>{ logo=''; draw(); };
    $('brS').onclick=async()=>{ $('brS').disabled=true; try{ const r=await call('brandSave',{name:$('brN').value,logo:logo,removeLogo:!logo}); S.brand={ver:r.ver,name:r.name,logo:r.logo}; try{ store('erp_brand',JSON.stringify(S.brand)); }catch(e){} applyBrand(); toast('اتحفظت الهوية ✓ وهتظهر عند الكل'); draw(); }catch(e){ $('brE').textContent=e.message; $('brS').disabled=false; } };
  };
  draw();
}
/* ----- نقل الإعدادات لسيستم تاني (من التيست للسيستم الجديد) ----- */
async function setMoveCard(){
  let st; try{ st=await call('configImportState'); }catch(e){ return; }
  const box=$('setMove'); if(!box) return;
  const imp=st.imported?`<div class="notice">Settings were brought in on ${new Date(st.imported).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}.</div>`
    :st.fresh?`<label class="btn" for="mvF" style="margin:0">Bring in settings from a file</label><input type="file" id="mvF" accept=".json,application/json" hidden>`
    :'<span class="muted" style="font-size:12.5px">Bringing settings in works only on a new system with no projects yet.</span>';
  box.innerHTML=`<div class="card"><h2 style="margin:0 0 4px">Move settings to another system</h2>
    <div class="muted" style="font-size:13px;margin-bottom:12px">Copies the company identity, settings, workflow rules, roles and permissions, departments and partners with their stores. People are never copied: department heads, seats, groups and project teams come over empty.</div>
    <div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"><button class="btn" id="mvX">Download settings file</button>${imp}</div><div class="err" id="mvE"></div></div>`;
  $('mvX').onclick=async()=>{ $('mvX').disabled=true; $('mvX').textContent='Preparing…';
    try{ const d=await call('configExport'); const b=new Blob([JSON.stringify(d)],{type:'application/json'}), a=document.createElement('a');
      a.href=URL.createObjectURL(b); a.download='miqnas-settings-'+new Date().toISOString().slice(0,10)+'.json'; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },500);
      toast('اتنزل الملف ✓ خليه معاك ومتبعتهوش لحد'); }catch(e){ $('mvE').textContent=e.message; }
    $('mvX').disabled=false; $('mvX').textContent='Download settings file'; };
  if($('mvF')) $('mvF').onchange=async()=>{
    const f=$('mvF').files[0]; if(!f) return;
    let data; try{ data=JSON.parse(await f.text()); }catch(e){ $('mvE').textContent='الملف ده مش ملف إعدادات'; return; }
    try{ const pv=await call('configImport',{data,dry:true}); mvPreview(data,pv); }catch(e){ $('mvE').textContent=e.message; }
    $('mvF').value='';
  };
}
function mvPreview(data,pv){
  const S2=pv.summary, keys=Object.keys(S2).filter(k=>S2[k].has);
  $('modalRoot').innerHTML=`<div class="modal"><div class="card" style="max-width:520px">
    <h2 style="margin:0 0 4px">Bring in settings</h2><div class="muted" style="font-size:13px;margin-bottom:10px">From <b>${esc(pv.from||'')}</b>${pv.at?' · '+new Date(pv.at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):''}. Untick anything you don't want. This can be done only once.</div>
    <div>${keys.map(k=>`<label class="mv-sec"><input type="checkbox" data-k="${k}" checked><span><b>${esc(S2[k].label)}</b><small>${esc(S2[k].detail||'')}</small></span></label>`).join('')}</div>
    <div class="err" id="mvE2"></div>
    <div class="mfoot"><button class="btn ghost" onclick="closeModal()">Cancel</button><div class="spacer"></div><button class="btn primary" id="mvGo">Bring in</button></div></div></div>`;
  $('mvGo').onclick=async()=>{ const sections=[...document.querySelectorAll('.mv-sec input:checked')].map(i=>i.dataset.k); if(!sections.length) return $('mvE2').textContent='اختار حاجة واحدة على الأقل';
    $('mvGo').disabled=true; $('mvGo').textContent='Working…';
    try{ const r=await call('configImport',{data,sections}); if(r.brand){ S.brand={ver:r.brand.ver,name:r.brand.name||'',logo:r.brand.logo||''}; try{ store('erp_brand',JSON.stringify(S.brand)); }catch(e){} applyBrand(); }
      Object.keys(S.cache).forEach(k=>delete S.cache[k]); closeModal(); toast('اتنقلت الإعدادات ✓'); refreshMe(); viewSettings(); }
    catch(e){ $('mvE2').textContent=e.message; $('mvGo').disabled=false; $('mvGo').textContent='Bring in'; } };
}
/* ----- إشعارات الموبايل (Firebase) ----- */
async function setPushCard(){
  let c; try{ c=await call('pushSettingsGet'); }catch(e){ return; }
  const site=location.origin+location.pathname.replace(/[^/]*$/,'');
  $('setPush').innerHTML=`<div class="card"><h2 style="margin:0 0 4px">Phone notifications</h2>
    <div class="muted" style="font-size:13px;margin-bottom:12px">${c.ready?`<b style="color:var(--ok)">On.</b> ${c.devices} phone${c.devices===1?'':'s'} registered. People turn it on from the bell on their phone.`:'Off. Connect a free Firebase project to send the bell notifications to phones, even when the app is closed.'}</div>
    <details${c.ready?'':' open'}><summary style="cursor:pointer;font-weight:600">Firebase settings</summary>
      <div class="pfgrid" style="margin-top:10px">
        <div><label>apiKey</label><input id="pfA" dir="ltr" value="${esc(c.apiKey)}"></div><div><label>projectId</label><input id="pfP" dir="ltr" value="${esc(c.projectId)}"></div>
        <div><label>messagingSenderId</label><input id="pfS" dir="ltr" value="${esc(c.senderId)}"></div><div><label>appId</label><input id="pfI" dir="ltr" value="${esc(c.appId)}"></div>
        <div style="grid-column:1/-1"><label>Web Push key (VAPID public key)</label><input id="pfV" dir="ltr" value="${esc(c.vapidKey)}"></div>
        <div style="grid-column:1/-1"><label>Service account key (JSON) ${c.hasKey?'<span class="pill p-in" style="font-size:11px">saved</span>':''}</label><textarea id="pfK" rows="3" dir="ltr" placeholder="${c.hasKey?'Saved. Paste a new key only to replace it.':'Paste the whole JSON file here'}"></textarea><div class="muted" style="font-size:12px">Kept secret on the server and never shown again.</div></div>
        <div><label>Quiet from (hour)</label><input id="pfQ1" type="number" min="0" max="23" value="${c.quietFrom}"></div><div><label>Quiet until (hour)</label><input id="pfQ2" type="number" min="0" max="23" value="${c.quietTo}"></div>
      </div>
      <div class="muted" style="font-size:12px;margin-top:6px">No phone notifications between these hours. They still show in the bell.</div>
      <div class="err" id="pfE"></div>
      <div class="mfoot"><div class="spacer"></div><button class="btn primary" id="pfB">Save notification settings</button></div></details></div>`;
  $('pfB').onclick=async()=>{ try{ await call('pushSettingsSave',{cfg:{apiKey:$('pfA').value,projectId:$('pfP').value,senderId:$('pfS').value,appId:$('pfI').value,vapidKey:$('pfV').value,serviceKey:$('pfK').value.trim(),quietFrom:$('pfQ1').value,quietTo:$('pfQ2').value,site}}); toast('اتحفظت ✓'); setPushCard(); }catch(e){ $('pfE').textContent=e.message; } };
}
async function saveSettings(){
  const v=Object.assign({}, S.cache.settings||{});
  SET_GROUPS.forEach(g=>g[2].forEach(it=>{ const el=$('st_'+it[0]); if(el) v[it[0]]=Number(el.value); }));
  ['device_lock','one_session','clock_first','location_on','permissions_on','off_sat','off_sun','off_mon','off_tue','off_wed','off_thu','off_fri'].forEach(k=>{ const el=$('st_'+k); if(el) v[k]=el.checked; });
  const b=$('setSave'); b.disabled=true; b.textContent='Saving...';
  try{ const r=await call('settingsSave',{settings:v}); S.cache.settings=r; saveCache(); S.cfg.shotMinutes=r.shot_min; toast('اتحفظت الإعدادات ✓'); refreshDash(); }
  catch(e){ alert(e.message); }
  b.disabled=false; b.textContent='Save changes';
}
