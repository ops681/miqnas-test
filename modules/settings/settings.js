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
    ['paid_break','Paid break (Full time)','Break time per day that counts as work, no reason needed. After it a reason is required and an alert is sent. Part time has no paid break','minutes'],
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
  <div id="setBrand"></div><div id="setAlerts"></div><div id="setSec"></div><div id="setPush"></div><div id="setPlat"></div><div id="setMove"></div>
  ${SET_GROUPS.map(g=>`<div class="card flush"><div class="chead" style="flex-direction:column;align-items:flex-start;gap:2px"><h2>${g[0]}</h2><div class="muted" style="font-size:13px">${g[1]}</div></div>
    ${g[2].map(it=>`<div class="set"><div class="tx"><label for="st_${it[0]}">${it[1]}</label><div>${it[2]}</div></div><input type="number" min="1" id="st_${it[0]}" value="${esc(v[it[0]])}"><span class="u">${it[3]}</span></div>`).join('')}</div>`).join('')}
  <div class="card flush"><div class="chead" style="flex-direction:column;align-items:flex-start;gap:2px"><h2>Sign-in security</h2><div class="muted" style="font-size:13px">Turn off only in an emergency</div></div>
    <div class="set"><div class="tx"><label for="st_device_lock">Registered device only</label><div>Each employee signs in from one approved device. A new device needs approval from the Devices page</div></div><input type="checkbox" id="st_device_lock" ${v.device_lock?'checked':''} style="width:20px;height:20px"></div>
    <div class="set"><div class="tx"><label for="st_clock_first">Clock in before anything else</label><div>Employees who clock in see only the Time Clock until they clock in</div></div><input type="checkbox" id="st_clock_first" ${v.clock_first?'checked':''} style="width:20px;height:20px"></div>
    <div class="set"><div class="tx"><label for="st_location_on">Location during the shift</label><div>Location is required to clock in and is taken regularly until clock out</div></div><input type="checkbox" id="st_location_on" ${v.location_on?'checked':''} style="width:20px;height:20px"></div>
    <div class="set"><div class="tx"><label for="st_one_session">One session at a time</label><div>Signing in somewhere else signs the account out of the old place</div></div><input type="checkbox" id="st_one_session" ${v.one_session?'checked':''} style="width:20px;height:20px"></div></div>
  <div class="card flush"><div class="chead" style="flex-direction:column;align-items:flex-start;gap:2px"><h2>⏰ Clock-out reminder</h2><div class="muted" style="font-size:13px">A bar at the top (and a browser notification) reminds each person to clock out before their shift hours end. It stays until they clock out. Shift hours come from Leave &amp; Requests → Balances &amp; shifts</div></div>
    <div class="set"><div class="tx"><label for="st_co_on">Turn on the reminder</label><div>Only for people who clock in, and not during a break</div></div><input type="checkbox" id="st_co_on" ${v.co_on?'checked':''} style="width:20px;height:20px"></div>
    <div class="set"><div class="tx"><label for="st_co_before">Remind before the shift ends</label><div>Worked hours today, without breaks</div></div><input type="number" min="1" max="120" id="st_co_before" value="${esc(v.co_before)}"><span class="u">min</span></div>
    <div class="set"><div class="tx"><label for="st_co_snooze">"Still working · remind me later"</label><div>The bar hides for this long, then comes back</div></div><input type="number" min="5" max="240" id="st_co_snooze" value="${esc(v.co_snooze)}"><span class="u">min</span></div>
    <div class="set"><div class="tx"><label for="st_co_notify">Browser notification too</label><div>Shows in the corner of the screen even when the site is in another tab or app. The browser asks each person once, when they clock in</div></div><input type="checkbox" id="st_co_notify" ${v.co_notify?'checked':''} style="width:20px;height:20px"></div></div>
  <div class="card flush"><div class="chead" style="flex-direction:column;align-items:flex-start;gap:2px"><h2>🪧 Cards in the middle of the screen</h2><div class="muted" style="font-size:13px">A card in the middle of the screen instead of the small corner notification. Not during a break. "بعدين" brings it back after 30 minutes, unless the task was started. Off = the small corner notification like before</div></div>
    <div class="set"><div class="tx"><label for="st_rd_card">"دورك دلوقتي"</label><div>A task that was waiting for another task is ready: shows who finished and their handover (links and notes)</div></div><input type="checkbox" id="st_rd_card" ${v.rd_card!==false?'checked':''} style="width:20px;height:20px"></div>
    <div class="set"><div class="tx"><label for="st_hp_card">"اتضافت تساعد"</label><div>Someone added you as a helper on a task</div></div><input type="checkbox" id="st_hp_card" ${v.hp_card!==false?'checked':''} style="width:20px;height:20px"></div>
    <div class="set"><div class="tx"><label for="st_gt_card">Side tasks (from the Tasks page)</label><div>📌 Assigned to you · 🤝 helping · 🔓 ready to start · 🔍 waiting for your review · ↩️ returned with a note. Approved ✅ and deadline reminders ⏳ 🚨 stay small in the corner</div></div><input type="checkbox" id="st_gt_card" ${v.gt_card!==false?'checked':''} style="width:20px;height:20px"></div>
    <div class="set"><div class="tx"><label for="st_lc_on">🎉 Thank-you card when a store launches</label><div>Goes to everyone who worked on the project (team, helpers, Account Manager), with confetti. The others get the usual small notification</div></div><input type="checkbox" id="st_lc_on" ${v.lc_on!==false?'checked':''} style="width:20px;height:20px"></div>
    <div class="set" style="align-items:flex-start"><div class="tx"><label for="st_lc_msg">Thank-you message</label><div>{الاسم} = the person's first name · {المتجر} = the store. The first line is the big title</div></div><textarea id="st_lc_msg" rows="3" dir="rtl" style="max-width:380px">${esc(v.lc_msg||'')}</textarea></div>
    <div class="set"><div class="tx"><label for="st_lc_sign">Signed by</label><div>Shows under the message</div></div><input id="st_lc_sign" dir="rtl" value="${esc(v.lc_sign||'')}" style="max-width:260px"></div></div>
  <div class="card flush"><div class="chead" style="flex-direction:column;align-items:flex-start;gap:2px"><h2>🚪 Auto clock-out</h2><div class="muted" style="font-size:13px">For people who close the site or the laptop and leave without clocking out. The clock-out is saved at the last time they were there (last screenshot or the site open in front of them), marked "Auto" in the reports, and they get a notification. Never during a break. Signing out of the site on the laptop always clocks out too</div></div>
    <div class="set"><div class="tx"><label for="st_ao_on">Turn on auto clock-out</label><div>Checked every 5 minutes</div></div><input type="checkbox" id="st_ao_on" ${v.ao_on?'checked':''} style="width:20px;height:20px"></div>
    <div class="set"><div class="tx"><label for="st_ao_min">Clock out after nothing from them for</label><div>10 to 480 minutes. It's never shorter than two screenshots + 5 minutes (now ${2*(Number(v.shot_min)||10)+5} min), so nobody is clocked out between two screenshots</div></div><input type="number" min="10" max="480" id="st_ao_min" value="${esc(v.ao_min)}"><span class="u">min</span></div></div>
  <div class="card flush"><div class="chead" style="flex-direction:column;align-items:flex-start;gap:2px"><h2>Work week & requests</h2><div class="muted" style="font-size:13px">Days off are skipped when counting leave days and project working days</div></div>
    <div class="set"><div class="tx"><label>Weekly days off</label><div>Tick every day the company is closed</div></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">${[['off_sat','Sat'],['off_sun','Sun'],['off_mon','Mon'],['off_tue','Tue'],['off_wed','Wed'],['off_thu','Thu'],['off_fri','Fri']].map(d=>`<label class="check" style="margin:0"><input type="checkbox" id="st_${d[0]}"${v[d[0]]?' checked':''}>${d[1]}</label>`).join('')}</div></div>
    <div class="set"><div class="tx"><label for="st_permissions_on">Hourly permissions</label><div>Let employees ask for a permission of an hour or two (late arrival / leaving early). Off means the option is hidden</div></div><input type="checkbox" id="st_permissions_on" ${v.permissions_on?'checked':''} style="width:20px;height:20px"></div></div>
  <div class="card" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap"><div style="flex:1 1 320px"><h2 style="margin:0 0 4px">Work hours</h2><div class="muted" style="font-size:13px">Off for now, since the team's hours vary. Late-arrival alerts will use this later.</div></div>
    <label class="check" style="margin:0"><input type="checkbox" id="st_late_on" ${v.late_on?'checked':''} disabled>Late-arrival alerts</label></div>
  </div>`;
  setBrandCard(); setAlertsCard(); setSecCard(); setPushCard(); setPlatCard(); setMoveCard();
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
/* ----- المنصات (سلة، زد، ...) ----- */
async function setPlatCard(r){
  if(!r){ try{ r=await call('platformsAdmin'); }catch(e){ return; } }
  const box=$('setPlat'); if(!box) return;
  box.innerHTML=`<div class="card flush"><div class="chead" style="flex-direction:column;align-items:flex-start;gap:2px"><h2>Platforms</h2><div class="muted" style="font-size:13px">One list for projects, briefs and partners. Anyone who creates projects or briefs can add a new one from the form. Hidden platforms stay on the projects that already use them.</div></div>
    ${r.platforms.map(x=>`<div class="set"><div class="tx"><label>${esc(x.name)}${x.active?'':' <span class="pill p-out" style="margin-inline-start:6px">Hidden</span>'}</label><div>${x.projects} project${x.projects===1?'':'s'}</div></div>
      <div class="row" style="gap:6px"><button class="btn ghost small" data-pr="${esc(x.name)}">Rename</button><button class="btn ${x.active?'ghost danger':''} small" data-ph="${esc(x.name)}" data-on="${x.active?0:1}">${x.active?'Hide':'Show'}</button></div></div>`).join('')}
    <div class="set"><div class="tx"><label>Add a platform</label></div><div class="row" style="gap:6px"><input id="plN" placeholder="Platform name" style="width:180px" maxlength="30"><button class="btn small primary" id="plA">Add</button></div></div></div>`;
  const run=async(fn)=>{ try{ setPlatCard(await fn()); toast('اتحفظ ✓'); }catch(e){ alert(e.message); } };
  box.querySelectorAll('[data-pr]').forEach(b=>b.onclick=()=>{ const nn=(prompt('الاسم الجديد',b.dataset.pr)||'').trim(); if(!nn||nn===b.dataset.pr) return; run(()=>call('platformEdit',{name:b.dataset.pr,rename:nn})); });
  box.querySelectorAll('[data-ph]').forEach(b=>b.onclick=()=>run(()=>call('platformEdit',{name:b.dataset.ph,active:b.dataset.on==='1'})));
  $('plA').onclick=()=>{ const n=$('plN').value.trim(); if(!n) return; run(async()=>{ await call('platformAdd',{name:n}); return call('platformsAdmin'); }); };
}
// المحاولات اللي السيرفر رفضها (حد حاول يفتح حاجة مش من صلاحيته)
async function setSecCard(){
  const box=$('setSec'); if(!box) return;
  let L; try{ L=await call('secLog'); }catch(e){ box.innerHTML=''; return; }
  const when=t=>new Date(t).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
  const by={}; L.forEach(x=>{ (by[x.u]||(by[x.u]={name:x.name,n:0,last:0})).n++; if(x.at>by[x.u].last) by[x.u].last=x.at; });
  const ppl=Object.keys(by).sort((a,b)=>by[b].last-by[a].last);
  box.innerHTML=`<div class="card flush"><div class="chead" style="flex-direction:column;align-items:flex-start;gap:2px"><h2>🔒 Refused attempts</h2><div class="muted" style="font-size:13px">Every time the server refused a page or an action because it's outside the person's permissions. The normal site never asks for these, so a line here means someone changed the site code in their browser. The server still blocked it: nothing was shown or changed</div></div>
    ${L.length?`<div style="padding:10px 18px;display:flex;gap:8px;flex-wrap:wrap">${ppl.map(k=>`<span class="pill p-bad">${bd(by[k].name||k)} · ${by[k].n} ${by[k].n===1?'attempt':'attempts'}</span>`).join('')}</div>
    <div class="tbl-wrap" style="max-height:340px;overflow:auto"><table><thead><tr><th>When</th><th>Who</th><th>Tried</th><th>Server reply</th></tr></thead><tbody>${L.slice(0,100).map(x=>`<tr><td style="white-space:nowrap">${when(x.at)}</td><td>${bd(x.name||x.u)}</td><td><code>${esc(x.action)}</code></td><td>${bd(x.msg)}</td></tr>`).join('')}</tbody></table></div>`
    :`<div class="muted" style="padding:14px 18px">No refused attempts. ✓</div>`}</div>`;
}
/* ----- نقل الإعدادات لسيستم تاني (من التيست للسيستم الجديد) ----- */
// التنبيهات + مين يشوف Team Activity (بالمنصب أو المجموعة)
async function setAlertsCard(){
  const box=$('setAlerts'); if(!box) return;
  let r; try{ r=await call('alertCfgGet'); }catch(e){ box.innerHTML=''; return; }
  const c=r.cfg, opt=(name,sel)=>r.options.map(o=>`<label class="check" style="margin:0"><input type="checkbox" data-al="${name}" value="${esc(o.k)}"${sel.indexOf(o.k)>=0?' checked':''}> ${esc(o.label)}${o.who?` <span class="muted" style="font-size:12px">· ${bd(o.who)}</span>`:''}</label>`).join('');
  box.innerHTML=`<div class="card flush"><div class="chead" style="flex-direction:column;align-items:flex-start;gap:2px"><h2>🔔 Alerts & Team Activity</h2><div class="muted" style="font-size:13px">Who gets a bell notification when the team does something, and who can open Team Activity and Live Activity. System admins can always see them</div></div>
    <div class="set"><div class="tx"><label>Send alerts about</label><div>Each one goes to the bell of the people below</div></div><div class="al-grid">${r.events.map(e=>`<label class="check" style="margin:0"><input type="checkbox" data-ev="${esc(e[0])}"${c.ev[e[0]]?' checked':''}> ${esc(e[1])}</label>`).join('')}</div></div>
    <div class="set"><div class="tx"><label>Alerts go to</label><div>By seat or group, so it follows the person who holds it</div></div><div class="al-grid">${opt('to',c.to)}</div></div>
    <div class="set"><div class="tx"><label>🔒 Security alerts go to</label><div>When someone tries to open a page or do an action outside their permissions (for example by changing the site code). One alert per person every 15 minutes</div></div><div class="al-grid">${opt('sec',c.sec||[])}</div></div>
    <div class="set"><div class="tx"><label>Who can see Team Activity</label><div>The daily report of what each person did, and Live Activity on the dashboard</div></div><div class="al-grid">${opt('viewers',c.viewers)}</div></div>
    <div class="mfoot" style="padding:12px 18px"><div class="spacer"></div><button class="btn primary" id="alSave">Save alerts</button></div></div>`;
  $('alSave').onclick=async()=>{ const pick=n=>[...box.querySelectorAll(`[data-al="${n}"]:checked`)].map(x=>x.value); const ev={}; box.querySelectorAll('[data-ev]').forEach(x=>{ ev[x.dataset.ev]=x.checked; });
    try{ await call('alertCfgSave',{cfg:{to:pick('to'),viewers:pick('viewers'),sec:pick('sec'),ev}}); toast('اتحفظت ✓'); setAlertsCard(); }catch(e){ alert(e.message); } };
}
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
  ['co_before','co_snooze','ao_min'].forEach(k=>{ const el=$('st_'+k); if(el) v[k]=Number(el.value); });
  ['lc_msg','lc_sign'].forEach(k=>{ const el=$('st_'+k); if(el) v[k]=el.value; });
  ['co_on','co_notify','ao_on','rd_card','hp_card','gt_card','lc_on','device_lock','one_session','clock_first','location_on','permissions_on','off_sat','off_sun','off_mon','off_tue','off_wed','off_thu','off_fri'].forEach(k=>{ const el=$('st_'+k); if(el) v[k]=el.checked; });
  const b=$('setSave'); b.disabled=true; b.textContent='Saving...';
  try{ const r=await call('settingsSave',{settings:v}); S.cache.settings=r; saveCache(); S.cfg.shotMinutes=r.shot_min; toast('اتحفظت الإعدادات ✓'); refreshDash(); }
  catch(e){ alert(e.message); }
  b.disabled=false; b.textContent='Save changes';
}
