/* ============ البصمة + مشاركة الشاشة ============ */
function viewClock(){
  const st=S.status||{};
  const inn=st.clockedIn;
  setTop('Time Clock', inn? 'Clocked in since '+st.inT : 'Not clocked in');
  $('main').innerHTML=`
  <div class="card clock">
    <div>${inn?`<span class="pill p-in">Clocked in</span> <span class="muted">since ${esc(st.inT)}</span>`:'<span class="pill p-out">Not clocked in</span>'}</div>
    <div class="big-time" id="elapsed">${inn?'00:00:00':'--:--'}</div>
    <div class="muted">Today's hours: <b>${(st.closedHoursToday||0).toFixed(2)}</b>${st.breakAllowMs&&inn?` · Paid break left today: <b id="pbLeft">${Math.floor(brkPaidLeft(st)/6e4)} min</b>`:''}</div>
    ${inn ? (st.onBreak
        ? `<div class="brkbox" dir="auto">On break since <b>${new Date(st.breakSince).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</b> · ${bd(st.breakReason==='Paid break'?'☕ Paid break':st.breakReason)}${st.breakAllowMs?` <span class="muted" id="brkLeft"></span>`:''}</div><button class="btn primary" id="resumeBrk">Resume Work</button> <button class="btn out" id="outBtn">Clock Out</button>`
        : `<button class="btn brk" id="brkBtn">Break</button> <button class="btn out" id="outBtn">Clock Out</button><div id="shareBox"></div>`)
      : `${st.lastAuto?soLastAutoMsg(st.lastAuto):''}${soAgainNote(st)}<button class="btn primary" id="inBtn">Clock In</button>`}
    ${inn?soOpenNote(st):''}
    ${cfFree()?`<div class="notice" dir="rtl" style="border-color:var(--blue);background:var(--bluebg)">⏱ <b>الإدارة فاتحالك بصمة بس.</b> البصمة من غير مشاركة شاشة ولا لوكيشن، وتقدر تبصم من الموبايل كمان.<br>• متنساش تبصم خروج لما تخلص.${S.cfg.soOn?' البصمة هتقفل لوحدها أول ما ساعات شيفتك تخلص.':' مفيش خروج أوتوماتيك في الوضع ده.'}</div>`:`<div class="notice" dir="rtl">
      • أول ما تدوس بصمة دخول، هيطلعلك شباك تختار منه تشارك: <b>تاب</b> أو <b>ويندو</b> أو <b>الشاشة كلها</b>.<br>
      • السيستم بياخد سكرين شوت كل ${S.cfg.shotMinutes} دقايق لحد ما تبصم خروج.<br>
      • خلي الصفحة دي مفتوحة طول الشغل، ولو قفلتها أو وقفت المشاركة هيتسجل.<br>
      ${S.cfg.soOn?`• أول ما ساعات شيفتك تخلص البصمة هتقفل لوحدها. لو لسه شغال اعمل بصمة دخول تاني واختار: أوفر تايم، شيفت جديد، أو بكمّل شغل.<br>`:''}
      ${S.cfg.aoOn?`• لو قفلت السيستم ومشيت من غير بصمة خروج، هتتعملك بصمة خروج <b>أوتوماتيك</b> بعد ${S.cfg.aoMin} دقيقة، بوقت آخر مرة كنت موجود فيها.<br>`:''}
      • استخدم <b>كروم</b> أو <b>إيدج</b> على الكمبيوتر.
    </div>`}
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
    ${r.days.slice().reverse().map(d=>`<tr><td>${esc(d.date)}</td><td>${esc(d.day)}</td><td>${esc(d.inT)}</td><td>${d.open?'<span class="pill p-in">Working</span>':esc(d.outT)+aoTag(d.auto,d.why)}${soKindTag(d.kind)}</td><td>${d.open?'—':d.hours}</td></tr>`).join('')}
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
  try{ await callOrQueue('shareEvent',{event:'stopped'}); }catch(e){}
  showAlarm(false);
}
function showAlarm(afterReload){
  if(VA_TAB) return; // View as: مفيش مشاركة شاشة
  if(cfFree()) return; // بصمة بس: مفيش مشاركة شاشة
  if(!S.status||!S.status.clockedIn) return;
  if(S.status.onBreak) return; // وقت البريك مش لازم مشاركة
  if(afterReload && !S.reloadLogged){ S.reloadLogged=true; callOrQueue('shareEvent',{event:'stopped'}).catch(()=>{}); }
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
      callOrQueue('shareEvent',{event:'resumed',mode}).catch(()=>{});
      $('modalRoot').innerHTML=''; document.title='Miqnas ERP';
      startShotLoop(true);
      if(S.view==='clock') viewClock();
    }catch(e){ $('aerr').textContent=e.message; }
  };
  $('alarmOut').onclick=()=>{ $('modalRoot').innerHTML=''; document.title='Miqnas ERP'; clockOut(); };
}
function breakForm(){
  const left=brkPaidLeft(S.status||{}), free=left>=60000;
  $('modalRoot').innerHTML=`<div class="modal"><div class="card">
    <h2>Take a Break</h2>
    <p class="muted" dir="rtl" style="text-align:right">السكرين شوتس هتقف، وأي تايمر شغال على تاسك هيقف لوحده لحد ما ترجع.</p>
    ${free?`<div class="brk-paid" dir="rtl">☕ فاضلك <b>${Math.floor(left/6e4)} دقيقة</b> من ساعة البريك بتاعتك النهارده. مش محتاج تكتب سبب.</div>`
      :`${(S.status||{}).breakAllowMs?'<div class="brk-paid over" dir="rtl">خلصت ساعة البريك بتاعتك النهارده، فلازم تكتب السبب وهيتبعت تنبيه للإدارة.</div>':'<div class="brk-paid over" dir="rtl">اكتب سبب البريك، وهيتبعت تنبيه للإدارة.</div>'}`}
    <label for="brkR">Reason${free?' (optional)':''}</label><textarea id="brkR" dir="auto" placeholder="مثال: صلاة، غدا، مشوار سريع" maxlength="200" rows="1" class="ml"></textarea>
    <div class="err" id="brkE"></div>
    <div class="mfoot"><button class="btn primary" id="brkS">Start Break</button><button class="btn" onclick="closeModal()">Cancel</button></div>
  </div></div>`;
  $('brkR').focus();
  $('brkS').onclick=async()=>{
    const reason=$('brkR').value.trim();
    if(!reason && !free){ $('brkE').textContent='اكتب سبب البريك'; return; }
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
    if(S.sharing) startShotLoop(true); else if(!S.mobile) showAlarm(false);
    renderSideClock(); if(S.view==='clock') viewClock();
  }catch(e){ alert(e.message); if(b){ b.disabled=false; b.textContent='Resume Work'; } }
}
async function clockIn(){
  coAsk();
  // شيفته النهارده خلص: يختار أوفر تايم / شيفت جديد / بكمّل شغل الأول
  let so={};
  if(S.status && S.status.so && S.status.so.need){ so=await soChoose(S.status.so); if(!so) return; }
  const b=$('inBtn'); if(!b) return; b.disabled=true;
  const fail=async e=>{ if(/شيفتك النهارده خلص/.test(e.message||'')){ try{ const r=await call('me'); if(r&&r.status){ setStatus(r.status); } }catch(x){} } alert(e.message); if(S.view==='clock') viewClock(); else { b.disabled=false; b.textContent='Clock In'; } };
  // بصمة بس: من غير شير اسكرين ولا لوكيشن
  if(S.status && S.status.free){
    b.textContent='Saving...';
    try{ setStatus(await call('clockIn',Object.assign({mode:'free'},so))); toast('اتسجلت بصمة الدخول ✓'); renderSide(); if(S.view==='clock') viewClock(); else go(S.view||'desk'); }
    catch(e){ await fail(e); }
    return;
  }
  b.textContent='Choose what to share...';
  try{
    const mode=await startShare();
    let loc=null;
    if(S.cfg.locationOn){ b.textContent='Allow location...'; loc=await getLoc(true); }
    b.textContent='Saving...';
    setStatus(await call('clockIn',Object.assign({mode,loc},so)));
    S.lastLoc=Date.now(); store('erp_lastloc',String(S.lastLoc));
    toast('اتسجلت بصمة الدخول ✓');
    startShotLoop(true);
    renderSide();
    if(can('tasks.mine')) go('mytasks'); else viewClock();
    setTimeout(prefetch, 800);
  }catch(e){ stopStream(); await fail(e); }
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
    if(S.view==='clock' || (gated() && FREE_VIEWS.indexOf(S.view)<0)) go('clock');
  }catch(e){ alert(e.message); if(b){ b.disabled=false; b.textContent='Clock Out'; } }
}
// كل سكرين شوت بعد اللي قبله بـ shotMinutes ± 30 ثانية عشوائي،
// عشان لو الفريق كله بصم في نفس الوقت الصور ماتتبعتش كلها في نفس اللحظة
function nextShotGap(){ return S.cfg.shotMinutes*60000 + Math.floor((Math.random()-0.5)*60000); }
function startShotLoop(now){
  clearInterval(S.tick);
  S.shotGap=nextShotGap();
  if(now) setTimeout(()=>takeShot().catch(()=>{}),2500+Math.floor(Math.random()*4000));
  S.tick=setInterval(()=>{
    if(!S.sharing) return;
    if(S.shotQ.length && !S.offline) flushShots();
    if(Date.now()-S.lastShot>=S.shotGap) takeShot().catch(()=>{});
  },15000+Math.floor(Math.random()*5000));
}
async function grabCanvas(maxW){
  const track=S.stream&&S.stream.getVideoTracks()[0];
  if(!track||track.readyState!=='live') throw new Error('no stream');
  let src=null,w=0,h=0;
  // كروم ساعات مابيردّش على grabFrame (الويندو متصغّرة / مستخبية / مفيهاش حركة): بعد 3 ثواني ناخد آخر فريم من الفيديو
  if('ImageCapture' in window){ try{ const bmp=await shotTimeout(new ImageCapture(track).grabFrame(),3000); src=bmp; w=bmp.width; h=bmp.height; }catch(e){ if(/timeout/.test(e.message)) shotFail('the shared window sent no new picture for 3 seconds (minimized or hidden?), used the last picture', true); } }
  if(!src){ const v=$('cap'); if(v&&v.paused) try{ await shotTimeout(v.play(),1500); }catch(e){} src=v; w=v?v.videoWidth:0; h=v?v.videoHeight:0; }
  if(!w||!h) throw new Error(track.muted?'no picture: the shared window is minimized or hidden':'no picture from the shared screen');
  const sc=Math.min(1,maxW/w); const c=document.createElement('canvas'); c.width=Math.round(w*sc); c.height=Math.round(h*sc);
  c.getContext('2d').drawImage(src,0,0,c.width,c.height);
  return { image: c.toDataURL('image/jpeg',0.6) };
}
function shotTimeout(p,ms){ return Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms))]); }
// صورة فشلت: بتتسجل في سجل المشاركة بالسبب (مرة كل 10 دقايق لنفس السبب). وبتعرّف السيرفر إن الموظف لسه موجود
function shotFail(reason,note){
  const now=Date.now(); reason=String(reason||'unknown').slice(0,140);
  if(S.sfR===reason && now-(S.sfAt||0)<10*60000) return;
  S.sfR=reason; S.sfAt=now;
  call('shareEvent',{event:note?'shotnote':'shotfail',reason,at:now}).catch(()=>{});
}
async function takeShot(){
  if(!S.sharing || S.shotBusy) return;
  if(S.status && S.status.onBreak) return;
  S.shotBusy=true;
  try{ await takeShot0(); } finally{ S.shotBusy=false; }
}
async function takeShot0(){
  let shot;
  try{ shot=await shotTimeout(grabCanvas(1600),8000); }
  catch(e){ shotFail(e.message==='timeout'?'taking the picture took too long':e.message==='no stream'?'screen sharing is not running':e.message); return; }
  shot.mode=S.mode;
  S.lastShot=Date.now(); S.shotGap=nextShotGap();
  shot.at=S.lastShot;
  shot.rid=S.lastShot.toString(36)+Math.random().toString(36).slice(2,10);
  try{ await call('uploadShot',shot); }
  catch(e){ if(e.offline){ S.shotQ.push(shot); if(S.shotQ.length>6) S.shotQ.shift(); renderNet(); } else shotFail('upload refused: '+(e.message||'error')); }
  const el=$('lastShotT'); if(el) el.textContent=new Date(S.lastShot).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
}
// السكرين شوتس اللي استنت لما النت كان فاصل (آخر 6 بس، يعني ساعة)
async function flushShots(){
  if(S.flushingShots) return; S.flushingShots=true;
  try{
    while(S.shotQ.length){
      const s=S.shotQ[0];
      try{ await call('uploadShot',s); }catch(e){ if(e.offline) break; }
      S.shotQ.shift();
    }
  } finally { S.flushingShots=false; renderNet(); }
}
window.addEventListener('beforeunload',e=>{ if(S.status&&S.status.clockedIn){ e.preventDefault(); e.returnValue=''; } });

/* ============ اللوكيشن وقت الشيفت ============
   مطلوب عند البصمة، وبعدها كل locMin دقيقة طول ما الموظف عامل بصمة. */
function getLoc(strict){
  return new Promise((res,rej)=>{
    if(!navigator.geolocation){ rej(new Error('البراوزر ده مش بيدعم اللوكيشن. استخدم كروم أو إيدج')); return; }
    navigator.geolocation.getCurrentPosition(
      p=>res({lat:p.coords.latitude,lng:p.coords.longitude,acc:p.coords.accuracy}),
      e=>{ const err=new Error(e.code===1?'لازم توافق على اللوكيشن عشان تقدر تبصم. اضغط على علامة القفل جنب اللينك فوق وخلّي Location على Allow، وجرّب تاني':'مش قادر أحدد مكانك دلوقتي. اتأكد إن اللوكيشن شغال على الجهاز وجرّب تاني'); err.denied=e.code===1; rej(err); },
      {enableHighAccuracy:false,timeout:20000,maximumAge:60000});
  });
}
S.lastLoc=Number(load('erp_lastloc'))||0;
setInterval(async()=>{
  const st=S.status;
  if(VA_TAB||!S.token||!S.user||!S.user.clocks||!S.cfg.locationOn||!st||!st.clockedIn||cfFree()) return;
  const gap=(S.cfg.locMin||30)*60000;
  if(Date.now()-S.lastLoc < gap) return;
  S.lastLoc=Date.now(); store('erp_lastloc',String(S.lastLoc));
  try{ const loc=await getLoc(); callOrQueue('locPing',{loc}).catch(()=>{}); if($('locAlarm')) closeModal(); }
  catch(e){ if(e.denied){ callOrQueue('locPing',{denied:true}).catch(()=>{}); showLocAlarm(); } }
}, 55000+Math.floor(Math.random()*10000));
function showLocAlarm(){
  if($('modalRoot').querySelector('.alarm')) return;
  $('modalRoot').innerHTML=`<div class="alarm" id="locAlarm"><div class="card" dir="rtl"><h2>اللوكيشن مقفول</h2>
    <p>انت لسه عامل بصمة دخول، واللوكيشن لازم يفضل شغال طول الشيفت. ده متسجل عند الإدارة.</p>
    <p class="muted" style="font-size:13px">اضغط على علامة القفل جنب اللينك فوق ← Location ← Allow، وبعدين دوس "تمام".</p>
    <div class="mfoot" style="justify-content:center"><button class="btn primary" onclick="retryLoc()">تمام، رجّعته</button></div></div></div>`;
}
async function retryLoc(){ try{ const loc=await getLoc(); callOrQueue('locPing',{loc}).catch(()=>{}); S.lastLoc=Date.now(); store('erp_lastloc',String(S.lastLoc)); $('modalRoot').innerHTML=''; toast('اللوكيشن رجع ✓'); }catch(e){ toast(e.message); } }

/* ============ الخروج عند نهاية الشيفت ============ */
// السيرفر بيقفل البصمة لوحده أول ما ساعات الشيفت تخلص (كل 5 دقايق). لو الموقع مفتوح بنقفلها في نفس اللحظة من هنا (clockOut auto).
// لو دخل تاني بعد ما الشيفت خلص: بيختار أوفر تايم (بسبب) / شيفت جديد (بعد nsGap ساعة من آخر خروج) / بكمّل شغل (ربع ساعة، مرة في اليوم).
const soHM = ts => new Date(ts).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
function soLastAutoMsg(a){
  const t=`<b><bdi dir="ltr">${soHM(a.at)}</bdi></b>`;
  const tx=a.why==='shift'?`✅ شيفتك خلص، فالبصمة اتقفلت <b>لوحدها</b> الساعة ${t}. لو لسه شغال اعمل بصمة دخول واختار نوعها.`
    : a.why==='ot'?`⏱ الأوفر تايم وصل للحد الأقصى، فالبصمة اتقفلت الساعة ${t}. طلب الأوفر تايم اتبعت للموافقة.`
    : a.why==='fin'?`✅ وقت "بكمّل شغل" خلص، فالبصمة اتقفلت الساعة ${t}.`
    : `⚠️ آخر بصمة اتقفلت <b>أوتوماتيك</b> الساعة ${t}، لأن السيستم اتقفل من غير بصمة خروج. الساعات اتحسبت لحد آخر مرة كنت موجود فيها.`;
  const warn=!a.why||a.why==='auto'||a.why==='ot';
  return `<div class="notice" dir="rtl" style="border-color:var(--${warn?'warn':'blue'});background:var(--${warn?'warnbg':'bluebg'});margin:0 0 12px">${tx}</div>`;
}
function soAgainNote(st){
  const so=st.so; if(!so||!so.need) return '';
  return `<div class="notice" dir="rtl" style="margin:0 0 12px">شيفتك النهارده (${esc(coDur(so.shiftMs))}) خلص. لو هتبصم دخول تاني هتختار: <b>أوفر تايم</b> أو <b>شيفت جديد</b> أو <b>بكمّل شغل</b>.</div>`;
}
function soOpenNote(st){
  const so=st.so; if(!so||!so.open) return '';
  const left=Math.max(0,so.limitMs-workedMs(st)), end=Date.now()+left;
  const lbl=so.kind==='ot'?`⏱ <b>أوفر تايم</b>${so.otReason?' · '+bd(so.otReason):''}`:so.kind==='fin'?'✅ <b>بكمّل شغل</b>':so.kind==='new'?'🔄 <b>شيفت جديد</b>':'';
  return `<div class="notice so-open" dir="rtl" style="margin:12px 0 0">${lbl?lbl+' · ':''}البصمة هتقفل لوحدها ${st.onBreak?'بعد':'الساعة'} <b><bdi dir="ltr">${st.onBreak?esc(coDur(left))+' شغل':soHM(end)}</bdi></b>${so.kind==='ot'?'، وطلب الأوفر تايم هيتبعت للموافقة لما تخرج':''}.</div>`;
}
function soChoose(so){
  return new Promise(res=>{
    const c=S.cfg||{}, otMax=Number(so.otMax||c.otMax)||4, fin=Number(so.finMin||c.finMin)||15, gap=Number(so.gapH||c.nsGap)||3;
    const opt=(k,ic,t,d,ok,why)=>`<label class="so-opt${ok?'':' off'}"><input type="radio" name="soK" value="${k}"${ok?'':' disabled'}><span class="so-ic">${ic}</span><span class="so-tx"><b>${t}</b><small>${ok?d:why}</small></span></label>`;
    $('modalRoot').innerHTML=`<div class="modal"><div class="card so-card" dir="rtl" role="dialog" aria-labelledby="soH">
      <h2 id="soH">شيفتك النهارده خلص</h2>
      <p class="muted" style="margin-top:-4px">اشتغلت ${esc(coDur(so.blockMs))} من ${esc(coDur(so.shiftMs))}. البصمة دي إيه؟</p>
      <div class="so-opts">
        ${opt('ot','⏱','أوفر تايم',`لازم تكتب السبب. بتقفل لوحدها بعد ${esc(coDur(otMax*36e5))} بالكتير، وطلب الأوفر تايم بيتبعت للموافقة لما تخرج.`,true,'')}
        ${opt('new','🔄','بداية شيفت جديد','العداد يبدأ من الأول بشيفت كامل.',so.newOk,`متاح بعد ${gap} ساعات من آخر خروج${so.newAt?' (من الساعة <bdi dir="ltr">'+soHM(so.newAt)+'</bdi>)':''}.`)}
        ${opt('fin','✅','بكمّل شغل بس',`البصمة بتفضل مفتوحة ${esc(coDur(fin*6e4))} وتقفل لوحدها. مرة واحدة في اليوم.`,so.finOk,'اتاخدت النهارده خلاص.')}
      </div>
      <div id="soRW" hidden><label for="soR">سبب الأوفر تايم</label><textarea id="soR" dir="auto" maxlength="300" rows="1" class="ml" placeholder="مثال: تسليم متجر النهارده"></textarea></div>
      <div class="err" id="soE"></div>
      <div class="mfoot"><button class="btn primary" id="soS">كمّل البصمة</button><button class="btn" id="soC">إلغاء</button></div>
    </div></div>`;
    const done=v=>{ $('modalRoot').innerHTML=''; res(v); };
    document.querySelectorAll('input[name="soK"]').forEach(r=>r.onchange=()=>{ $('soRW').hidden=r.value!=='ot'||!r.checked; if(!$('soRW').hidden) $('soR').focus(); $('soE').textContent=''; });
    $('soC').onclick=()=>done(null);
    $('soS').onclick=()=>{
      const k=(document.querySelector('input[name="soK"]:checked')||{}).value;
      if(!k){ $('soE').textContent='اختار نوع البصمة'; return; }
      const reason=k==='ot'?$('soR').value.trim():'';
      if(k==='ot' && !reason){ $('soE').textContent='اكتب سبب الأوفر تايم'; $('soR').focus(); return; }
      done(k==='ot'?{kind:k,reason}:{kind:k});
    };
  });
}
// الموقع مفتوح والحد خلص: نقفلها دلوقتي بوقت النهاية
async function soTick(){
  const st=S.status, so=st&&st.so;
  if(!so||!so.open||!st.clockedIn||VA_TAB||!(S.cfg||{}).soOn) return;
  if(workedMs(st) < so.limitMs) return;
  if(S.soBusy && Date.now()-S.soBusy<120000) return;
  S.soBusy=Date.now();
  try{
    if(S.sharing) await takeShot().catch(()=>{});
    const r=await call('clockOut',{auto:1});
    stopStream(); setStatus(r); S.soBusy=0;
    document.title='Miqnas ERP';
    const why=r&&r.lastAuto&&r.lastAuto.why;
    toast(why==='ot'?'الأوفر تايم وصل للحد الأقصى، والبصمة اتقفلت ✓':why==='fin'?'وقت "بكمّل شغل" خلص، والبصمة اتقفلت ✓':'شيفتك خلص، والبصمة اتقفلت لوحدها ✓');
    try{ if(document.visibilityState!=='visible' && 'Notification' in window && Notification.permission==='granted') new Notification('✅ البصمة اتقفلت لوحدها',{body:'ساعات شيفتك خلصت. لو لسه شغال افتح Miqnas ERP واعمل بصمة دخول.',tag:'mq-shiftout',icon:(S.brand&&S.brand.logo)||undefined}); }catch(e){}
    renderSide();
    if(S.view==='clock' || (gated() && FREE_VIEWS.indexOf(S.view)<0)) go('clock');
  }catch(e){ /* السيرفر هيقفلها في الـ 5 دقايق الجاية */ }
}
setInterval(soTick, 15000);
