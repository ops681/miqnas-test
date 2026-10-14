/* ============ اللوجين ============ */
$('loginForm').addEventListener('submit', async e=>{
  e.preventDefault();
  $('lerr').textContent=''; $('lbtn').disabled=true; $('lbtn').textContent='Signing in...';
  try{
    const r = await call('login',{username:$('lu').value,password:$('lp').value,device:deviceId(),deviceLabel:deviceLabel()});
    S.token=r.token; store('erp_token',r.token); S.mobile=!!r.mobile; store('erp_mobile',S.mobile?'1':null);
    S.user=r.user; S.cfg=r.cfg; if(r.status) setStatus(r.status); store('erp_user',JSON.stringify(r.user));
    startApp();
    refreshMe();
  }catch(err){ $('lerr').textContent=err.message; }
  $('lbtn').disabled=false; $('lbtn').textContent='Sign in';
});

function forceLogin(msg, hard){
  if(VA_TAB){ vaEnded(); return; }
  if(S.sharing && !hard) return;
  if(hard && S.sharing){ try{ stopStream(); }catch(e){} }
  if(msg) $('lerr').textContent=msg;
  S.token=null; store('erp_token',null); store('erp_user',null); if(typeof navClear==='function') navClear();
  $('appView').classList.add('hidden'); $('loginView').classList.remove('hidden');
}

async function logout(){
  if(S.status && S.status.clockedIn && !confirm('انت لسه عامل بصمة دخول. لو خرجت السكرين شوتس هتقف. متأكد؟')) return;
  try{ call('logout'); }catch(e){}
  stopStream(false);
  store(cacheKey(),null);
  S.token=null; store('erp_token',null); store('erp_user',null); store('erp_mobile',null); if(typeof navClear==='function') navClear();
  setTimeout(()=>location.reload(),150);
}

// بيفتح السيستم على طول من البيانات المتخزنة، وبيتأكد من السيرفر في نفس الوقت
function boot(){
  S.token=load('erp_token'); S.mobile=load('erp_mobile')==='1';
  let u=null; try{ u=JSON.parse(load('erp_user')||'null'); }catch(e){}
  // بيانات متخزنة من نسخة قديمة (من غير صلاحيات): نجيب الجديدة من السيرفر الأول
  if(u && !Array.isArray(u.perms)) u=null;
  if(/[?&]setup\b/.test(location.search)){ firstSetupView(); return; }
  if(!S.token && VA_TAB){ vaEnded(); return; }
  if(!S.token){ $('loginView').classList.remove('hidden'); return; }
  if(u){ S.user=u; startApp(); refreshMe(); }
  else refreshMe(true);
}
async function refreshMe(first){
  try{
    const r=await call('me');
    const changed=!S.user || !!S.user.teamAct!==!!r.teamAct || String(S.user.perms)!==String(r.user.perms) || S.user.clocks!==r.user.clocks || S.user.seeAccess!==r.user.seeAccess;
    S.va=r.va||null; r.user.teamAct=!!r.teamAct;
    S.user=r.user; S.cfg=r.cfg; S.mobile=!!r.mobile; store('erp_mobile',S.mobile?'1':null); setStatus(r.status); store('erp_user',JSON.stringify(r.user)); if(VA_TAB) vaBar(); avSync(r.avv); if(window.brandSync) brandSync(r.brv); if(window.piSync) piSync(r.piv);
    if(first||changed) startApp(); else { renderSide(); if(S.view==='clock') viewClock(); else if(gated() && FREE_VIEWS.indexOf(S.view)<0) go('clock'); else if(S.lockShown && !gated()) go(S.view); }
    if(S.status && S.status.clockedIn && !S.sharing && !S.mobile) showAlarm(true);
  }catch(e){ if(first){ $('loginView').classList.remove('hidden'); } }
}

/* ----- أول حساب أدمن في سيستم جديد (?setup + كود التجهيز من Apps Script) ----- */
function firstSetupView(){
  const lv=$('loginView'); lv.classList.remove('hidden');
  lv.innerHTML=`<form class="login" id="fsForm">
    <div class="logo">${typeof brandMark==='function'?brandMark('ERP'):'<i>M</i>Miqnas <span>ERP</span>'}</div>
    <p>Set up the first admin account. You need the setup code from Apps Script.</p>
    <label for="fsC">Setup code</label><input id="fsC" autocomplete="off" autocapitalize="characters" spellcheck="false" dir="ltr" required>
    <label for="fsN">Your name</label><input id="fsN" autocomplete="name" required>
    <label for="fsU">Username</label><input id="fsU" autocomplete="username" autocapitalize="none" spellcheck="false" dir="ltr" required>
    <label for="fsP">Password (8+)</label><input id="fsP" type="password" autocomplete="new-password" dir="ltr" required minlength="8">
    <button class="btn primary full" id="fsB">Create account</button><div class="err" id="fsE"></div></form>`;
  $('fsForm').onsubmit=async e=>{ e.preventDefault(); $('fsE').textContent=''; $('fsB').disabled=true; $('fsB').textContent='Setting up...';
    try{ const r=await call('firstSetup',{code:$('fsC').value,name:$('fsN').value,username:$('fsU').value,password:$('fsP').value,device:deviceId(),deviceLabel:deviceLabel()});
      history.replaceState(null,'',location.pathname);
      S.token=r.token; store('erp_token',r.token); S.mobile=!!r.mobile; S.user=r.user; S.cfg=r.cfg; store('erp_user',JSON.stringify(r.user));
      lv.classList.add('hidden'); startApp(); refreshMe(); setTimeout(()=>toast('اتعمل حسابك ✓ ابدأ من Settings ← Move settings'),600); }
    catch(err){ $('fsE').textContent=err.message; $('fsB').disabled=false; $('fsB').textContent='Create account'; } };
  setTimeout(()=>$('fsC').focus(),30);
}
