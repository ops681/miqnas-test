/* ============ اللوجين ============ */
$('loginForm').addEventListener('submit', async e=>{
  e.preventDefault();
  $('lerr').textContent=''; $('lbtn').disabled=true; $('lbtn').textContent='Signing in...';
  try{
    const r = await call('login',{username:$('lu').value,password:$('lp').value,device:deviceId(),deviceLabel:deviceLabel()});
    S.token=r.token; store('erp_token',r.token);
    S.user=r.user; S.cfg=r.cfg; if(r.status) setStatus(r.status); store('erp_user',JSON.stringify(r.user));
    startApp();
    refreshMe();
  }catch(err){ $('lerr').textContent=err.message; }
  $('lbtn').disabled=false; $('lbtn').textContent='Sign in';
});

function forceLogin(msg, hard){
  if(S.sharing && !hard) return;
  if(hard && S.sharing){ try{ stopStream(); }catch(e){} }
  if(msg) $('lerr').textContent=msg;
  S.token=null; store('erp_token',null); store('erp_user',null);
  $('appView').classList.add('hidden'); $('loginView').classList.remove('hidden');
}

async function logout(){
  if(S.status && S.status.clockedIn && !confirm('انت لسه عامل بصمة دخول. لو خرجت السكرين شوتس هتقف. متأكد؟')) return;
  try{ call('logout'); }catch(e){}
  stopStream(false);
  store(cacheKey(),null);
  S.token=null; store('erp_token',null); store('erp_user',null);
  setTimeout(()=>location.reload(),150);
}

// بيفتح السيستم على طول من البيانات المتخزنة، وبيتأكد من السيرفر في نفس الوقت
function boot(){
  S.token=load('erp_token');
  let u=null; try{ u=JSON.parse(load('erp_user')||'null'); }catch(e){}
  // بيانات متخزنة من نسخة قديمة (من غير صلاحيات): نجيب الجديدة من السيرفر الأول
  if(u && !Array.isArray(u.perms)) u=null;
  if(!S.token){ $('loginView').classList.remove('hidden'); return; }
  if(u){ S.user=u; startApp(); refreshMe(); }
  else refreshMe(true);
}
async function refreshMe(first){
  try{
    const r=await call('me');
    const changed=!S.user || String(S.user.perms)!==String(r.user.perms) || S.user.clocks!==r.user.clocks || S.user.seeAccess!==r.user.seeAccess;
    S.user=r.user; S.cfg=r.cfg; setStatus(r.status); store('erp_user',JSON.stringify(r.user)); avSync(r.avv);
    if(first||changed) startApp(); else { renderSide(); if(S.view==='clock') viewClock(); else if(gated() && S.view!=='clock') go('clock'); else if(S.lockShown && !gated()) go(S.view); }
    if(S.status && S.status.clockedIn && !S.sharing) showAlarm(true);
  }catch(e){ if(first){ $('loginView').classList.remove('hidden'); } }
}
