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
    ['break_max','Long break','Alert when a break runs longer than','minutes']]]
];
function viewSettings(){
  setTop('Settings','Admins only · changes apply to the whole team', `<button class="btn primary" id="setSave">Save changes</button>`);
  $('setSave').onclick=saveSettings;
  swr('settings','settingsGet',{},renderSettings);
}
function renderSettings(v){
  $('main').innerHTML=`<div style="max-width:900px;display:grid;gap:18px">
  ${SET_GROUPS.map(g=>`<div class="card flush"><div class="chead" style="flex-direction:column;align-items:flex-start;gap:2px"><h2>${g[0]}</h2><div class="muted" style="font-size:13px">${g[1]}</div></div>
    ${g[2].map(it=>`<div class="set"><div class="tx"><label for="st_${it[0]}">${it[1]}</label><div>${it[2]}</div></div><input type="number" min="1" id="st_${it[0]}" value="${esc(v[it[0]])}"><span class="u">${it[3]}</span></div>`).join('')}</div>`).join('')}
  <div class="card flush"><div class="chead" style="flex-direction:column;align-items:flex-start;gap:2px"><h2>Sign-in security</h2><div class="muted" style="font-size:13px">Turn off only in an emergency</div></div>
    <div class="set"><div class="tx"><label for="st_device_lock">Registered device only</label><div>Each employee signs in from one approved device. A new device needs approval from the Devices page</div></div><input type="checkbox" id="st_device_lock" ${v.device_lock?'checked':''} style="width:20px;height:20px"></div>
    <div class="set"><div class="tx"><label for="st_clock_first">Clock in before anything else</label><div>Employees who clock in see only the Time Clock until they clock in</div></div><input type="checkbox" id="st_clock_first" ${v.clock_first?'checked':''} style="width:20px;height:20px"></div>
    <div class="set"><div class="tx"><label for="st_one_session">One session at a time</label><div>Signing in somewhere else signs the account out of the old place</div></div><input type="checkbox" id="st_one_session" ${v.one_session?'checked':''} style="width:20px;height:20px"></div></div>
  <div class="card flush"><div class="chead" style="flex-direction:column;align-items:flex-start;gap:2px"><h2>Work week & requests</h2><div class="muted" style="font-size:13px">Days off are skipped when counting leave days and project working days</div></div>
    <div class="set"><div class="tx"><label>Weekly days off</label><div>Tick every day the company is closed</div></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">${[['off_sat','Sat'],['off_sun','Sun'],['off_mon','Mon'],['off_tue','Tue'],['off_wed','Wed'],['off_thu','Thu'],['off_fri','Fri']].map(d=>`<label class="check" style="margin:0"><input type="checkbox" id="st_${d[0]}"${v[d[0]]?' checked':''}>${d[1]}</label>`).join('')}</div></div>
    <div class="set"><div class="tx"><label for="st_permissions_on">Hourly permissions</label><div>Let employees ask for a permission of an hour or two (late arrival / leaving early). Off means the option is hidden</div></div><input type="checkbox" id="st_permissions_on" ${v.permissions_on?'checked':''} style="width:20px;height:20px"></div></div>
  <div class="card" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap"><div style="flex:1 1 320px"><h2 style="margin:0 0 4px">Work hours</h2><div class="muted" style="font-size:13px">Off for now, since the team's hours vary. Late-arrival alerts will use this later.</div></div>
    <label class="check" style="margin:0"><input type="checkbox" id="st_late_on" ${v.late_on?'checked':''} disabled>Late-arrival alerts</label></div>
  </div>`;
}
async function saveSettings(){
  const v=Object.assign({}, S.cache.settings||{});
  SET_GROUPS.forEach(g=>g[2].forEach(it=>{ const el=$('st_'+it[0]); if(el) v[it[0]]=Number(el.value); }));
  ['device_lock','one_session','clock_first','permissions_on','off_sat','off_sun','off_mon','off_tue','off_wed','off_thu','off_fri'].forEach(k=>{ const el=$('st_'+k); if(el) v[k]=el.checked; });
  const b=$('setSave'); b.disabled=true; b.textContent='Saving...';
  try{ const r=await call('settingsSave',{settings:v}); S.cache.settings=r; saveCache(); S.cfg.shotMinutes=r.shot_min; toast('اتحفظت الإعدادات ✓'); refreshDash(); }
  catch(e){ alert(e.message); }
  b.disabled=false; b.textContent='Save changes';
}
