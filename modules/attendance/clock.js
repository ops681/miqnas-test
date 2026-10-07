/* ============ البصمة + مشاركة الشاشة ============ */
function viewClock(){
  const st=S.status||{};
  const inn=st.clockedIn;
  setTop('Time Clock', inn? 'Clocked in since '+st.inT : 'Not clocked in');
  $('main').innerHTML=`
  <div class="card clock">
    <div>${inn?`<span class="pill p-in">Clocked in</span> <span class="muted">since ${esc(st.inT)}</span>`:'<span class="pill p-out">Not clocked in</span>'}</div>
    <div class="big-time" id="elapsed">${inn?'00:00:00':'--:--'}</div>
    <div class="muted">Today's hours: <b>${(st.closedHoursToday||0).toFixed(2)}</b></div>
    ${inn ? (st.onBreak
        ? `<div class="brkbox" dir="auto">On break since <b>${new Date(st.breakSince).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</b> · ${esc(st.breakReason)}</div><button class="btn primary" id="resumeBrk">Resume Work</button> <button class="btn out" id="outBtn">Clock Out</button>`
        : `<button class="btn brk" id="brkBtn">Break</button> <button class="btn out" id="outBtn">Clock Out</button><div id="shareBox"></div>`)
      : `<button class="btn primary" id="inBtn">Clock In</button>`}
    <div class="notice" dir="rtl">
      • أول ما تدوس بصمة دخول، هيطلعلك شباك تختار منه تشارك: <b>تاب</b> أو <b>ويندو</b> أو <b>الشاشة كلها</b>.<br>
      • السيستم بياخد سكرين شوت كل ${S.cfg.shotMinutes} دقايق لحد ما تبصم خروج.<br>
      • خلي الصفحة دي مفتوحة طول الشغل، ولو قفلتها أو وقفت المشاركة هيتسجل.<br>
      • استخدم <b>كروم</b> أو <b>إيدج</b> على الكمبيوتر.
    </div>
  </div>
  <div class="card" style="margin-top:18px"><h3>This Month</h3><div id="myMonth">${LOADING}</div></div>`;
  if(inn){ $('outBtn').onclick=clockOut; if($('brkBtn')) $('brkBtn').onclick=breakForm; if($('resumeBrk')) $('resumeBrk').onclick=breakEnd; renderShareBox(); }
  else $('inBtn').onclick=clockIn;
  tickAll();
  loadMyMonth();
}
function renderShareBox(){
  const b=$('shareBox'); if(!b) return;
  b.innerHTML = S.sharing
    ? `<div class="share-ok">✓ Screen sharing on (${esc(MODE_NAMES[S.mode]||'')}) · Last screenshot: <b id="lastShotT">${S.lastShot? new Date(S.lastShot).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) : '...'}</b></div>`
    : '';
}
function renderMyMonth(r){
  const el=$('myMonth'); if(!el) return;
  const s=r.summary||{days:0,hours:0,avg:0};
  el.innerHTML=`
    <div class="grid kpis" style="margin-bottom:12px">
      <div class="kpi"><span>Days present</span><b>${s.days}</b></div>
      <div class="kpi"><span>Total hours</span><b>${s.hours}</b></div>
      <div class="kpi"><span>Avg per day</span><b>${s.avg}</b></div>
    </div>
    ${r.days.length?`<div class="tbl-wrap"><table style="min-width:420px"><tr><th>Date</th><th>Day</th><th>In</th><th>Out</th><th>Hours</th></tr>
    ${r.days.slice().reverse().map(d=>`<tr><td>${esc(d.date)}</td><td>${esc(d.day)}</td><td>${esc(d.inT)}</td><td>${d.open?'<span class="pill p-in">Working</span>':esc(d.outT)}</td><td>${d.open?'—':d.hours}</td></tr>`).join('')}
    </table></div>`:'<p class="muted">No attendance this month yet.</p>'}`;
}
async function loadMyMonth(){
  if(S.cache.myMonth) renderMyMonth(S.cache.myMonth);
  try{ const r=await call('myMonth'); S.cache.myMonth=r; renderMyMonth(r); }
  catch(e){ if($('myMonth') && !S.cache.myMonth) $('myMonth').textContent=e.message; }
}
function surfaceToMode(track){
  const s=(track.getSettings&&track.getSettings().displaySurface)||'';
  return s==='browser'?'tab': s==='window'?'window': 'screen';
}
async function startShare(){
  if(!navigator.mediaDevices||!navigator.mediaDevices.getDisplayMedia)
    throw new Error('المتصفح ده مش بيدعم مشاركة الشاشة. افتح الصفحة من كروم أو إيدج على الكمبيوتر');
  let stream;
  try{
    stream = await navigator.mediaDevices.getDisplayMedia({ video:{frameRate:1}, audio:false, selfBrowserSurface:'include', surfaceSwitching:'include', monitorTypeSurfaces:'include' });
  }catch(e){
    if(IN_GAS) throw new Error('صفحة جوجل مش بتسمح بمشاركة الشاشة. افتح لينك السيستم الأساسي وابصم منه');
    if(e && e.name==='NotAllowedError') throw new Error('لازم توافق على مشاركة الشاشة عشان تقدر تبصم');
    throw new Error('مشاركة الشاشة مشتغلتش: '+(e.message||e.name));
  }
  const track=stream.getVideoTracks()[0];
  S.stream=stream; S.mode=surfaceToMode(track); S.sharing=true;
  const v=$('cap'); v.srcObject=stream; try{ await v.play(); }catch(e){}
  track.onended=onShareEnded;
  renderSideClock();
  return S.mode;
}
function stopStream(){
  S.sharing=false;
  clearInterval(S.tick);
  if(S.stream){ S.stream.getTracks().forEach(t=>{ t.onended=null; t.stop(); }); }
  S.stream=null;
  $('cap').srcObject=null;
  if(S.user) renderSideClock();
}
async function onShareEnded(){
  stopStream();
  try{ await call('shareEvent',{event:'stopped'}); }catch(e){}
  showAlarm(false);
}
function showAlarm(afterReload){
  if(!S.status||!S.status.clockedIn) return;
  if(S.status.onBreak) return; // وقت البريك مش لازم مشاركة
  if(afterReload && !S.reloadLogged){ S.reloadLogged=true; call('shareEvent',{event:'stopped'}).catch(()=>{}); }
  document.title='⚠ المشاركة واقفة';
  $('modalRoot').innerHTML=`<div class="alarm"><div class="card" dir="rtl">
    <h2>مشاركة الشاشة واقفة</h2>
    <p>${afterReload?'الصفحة اتقفلت أو اتعملها ريفريش، فالمشاركة وقفت.':'المشاركة وقفت.'} انت لسه عامل بصمة دخول، ولازم ترجّع المشاركة عشان الشغل يتحسب.</p>
    <p class="muted" style="font-size:13px">ده متسجل عند الإدارة.</p>
    <div class="err" id="aerr"></div>
    <div class="mfoot" style="justify-content:center">
      <button class="btn primary" id="resumeBtn">رجّع المشاركة</button>
      <button class="btn" id="alarmOut">بصمة خروج</button>
    </div></div></div>`;
  $('resumeBtn').onclick=async()=>{
    $('aerr').textContent='';
    try{
      const mode=await startShare();
      call('shareEvent',{event:'resumed',mode}).catch(()=>{});
      $('modalRoot').innerHTML=''; document.title='Miqnas ERP';
      startShotLoop(true);
      if(S.view==='clock') viewClock();
    }catch(e){ $('aerr').textContent=e.message; }
  };
  $('alarmOut').onclick=()=>{ $('modalRoot').innerHTML=''; document.title='Miqnas ERP'; clockOut(); };
}
function breakForm(){
  $('modalRoot').innerHTML=`<div class="modal"><div class="card">
    <h2>Take a Break</h2>
    <p class="muted" dir="rtl" style="text-align:right">السكرين شوتس هتقف، وأي تايمر شغال على تاسك هيقف لوحده لحد ما ترجع.</p>
    <label for="brkR">Reason</label><input id="brkR" dir="auto" placeholder="مثال: صلاة، غدا، مشوار سريع" maxlength="200">
    <div class="err" id="brkE"></div>
    <div class="mfoot"><button class="btn primary" id="brkS">Start Break</button><button class="btn" onclick="closeModal()">Cancel</button></div>
  </div></div>`;
  $('brkR').focus();
  $('brkS').onclick=async()=>{
    const reason=$('brkR').value.trim();
    if(!reason){ $('brkE').textContent='اكتب سبب البريك'; return; }
    $('brkS').disabled=true;
    try{
      const st=await call('breakStart',{reason});
      setStatus(st); closeModal();
      toast(st.timersStopped?'بدأ البريك ✓ ووقفنا '+st.timersStopped+' تايمر':'بدأ البريك ✓');
      S.cache.my=null; renderSideClock(); if(S.view==='clock') viewClock();
    }catch(e){ $('brkE').textContent=e.message; $('brkS').disabled=false; }
  };
}
async function breakEnd(){
  const b=$('resumeBrk'); if(b){ b.disabled=true; b.textContent='Saving...'; }
  try{
    setStatus(await call('breakEnd'));
    toast('رجعت من البريك ✓');
    if(S.sharing) startShotLoop(true); else showAlarm(false);
    renderSideClock(); if(S.view==='clock') viewClock();
  }catch(e){ alert(e.message); if(b){ b.disabled=false; b.textContent='Resume Work'; } }
}
async function clockIn(){
  const b=$('inBtn'); b.disabled=true; b.textContent='Choose what to share...';
  try{
    const mode=await startShare();
    b.textContent='Saving...';
    setStatus(await call('clockIn',{mode}));
    toast('اتسجلت بصمة الدخول ✓');
    startShotLoop(true);
    renderSide();
    if(can('tasks.mine')) go('mytasks'); else viewClock();
    setTimeout(prefetch, 800);
  }catch(e){ stopStream(); alert(e.message); b.disabled=false; b.textContent='Clock In'; }
}
async function clockOut(){
  if(!confirm('متأكد إنك عاوز تبصم خروج؟')) return;
  const b=$('outBtn'); if(b){ b.disabled=true; b.textContent='Saving...'; }
  try{
    if(S.sharing) await takeShot().catch(()=>{});
    stopStream();
    setStatus(await call('clockOut'));
    toast('اتسجلت بصمة الخروج ✓');
    document.title='Miqnas ERP';
    renderSide();
    if(S.view==='clock' || gated()) go('clock');
  }catch(e){ alert(e.message); if(b){ b.disabled=false; b.textContent='Clock Out'; } }
}
function startShotLoop(now){
  clearInterval(S.tick);
  const ms=S.cfg.shotMinutes*60000;
  if(now) setTimeout(()=>takeShot().catch(()=>{}),2500);
  S.tick=setInterval(()=>{
    if(!S.sharing) return;
    if(S.pending.length) flushPending();
    if(Date.now()-S.lastShot>=ms) takeShot().catch(()=>{});
  },20000);
}
async function grabCanvas(maxW){
  const track=S.stream&&S.stream.getVideoTracks()[0];
  if(!track||track.readyState!=='live') throw new Error('no stream');
  let src=null,w=0,h=0;
  if('ImageCapture' in window){ try{ const bmp=await new ImageCapture(track).grabFrame(); src=bmp; w=bmp.width; h=bmp.height; }catch(e){} }
  if(!src){ const v=$('cap'); src=v; w=v.videoWidth; h=v.videoHeight; }
  if(!w||!h) throw new Error('no frame');
  const sc=Math.min(1,maxW/w); const c=document.createElement('canvas'); c.width=Math.round(w*sc); c.height=Math.round(h*sc);
  c.getContext('2d').drawImage(src,0,0,c.width,c.height);
  return { image: c.toDataURL('image/jpeg',0.6) };
}
async function takeShot(){
  if(!S.sharing) return;
  if(S.status && S.status.onBreak) return;
  const shot=await grabCanvas(1600);
  shot.mode=S.mode;
  S.lastShot=Date.now();
  try{ await call('uploadShot',shot); }
  catch(e){ if(S.pending.length<3) S.pending.push(shot); }
  const el=$('lastShotT'); if(el) el.textContent=new Date(S.lastShot).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
}
async function flushPending(){
  const p=S.pending.splice(0);
  for(const s of p){ try{ await call('uploadShot',s); }catch(e){ S.pending.push(s); break; } }
}
window.addEventListener('beforeunload',e=>{ if(S.status&&S.status.clockedIn){ e.preventDefault(); e.returnValue=''; } });
