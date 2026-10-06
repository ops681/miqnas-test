/* ============ اللوجين ============ */
$('loginForm').addEventListener('submit', async e=>{
  e.preventDefault();
  $('lerr').textContent=''; $('lbtn').disabled=true; $('lbtn').textContent='Signing in...';
  try{
    const r = await call('login',{username:$('lu').value,password:$('lp').value});
    S.token=r.token; store('erp_token',r.token);
    S.user=r.user; S.cfg=r.cfg; store('erp_user',JSON.stringify(r.user));
    startApp();
    refreshMe();
  }catch(err){ $('lerr').textContent=err.message; }
  $('lbtn').disabled=false; $('lbtn').textContent='Sign in';
});

function forceLogin(){
  if(S.sharing) return;
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
  if(!S.token){ $('loginView').classList.remove('hidden'); return; }
  if(u){ S.user=u; startApp(); refreshMe(); }
  else refreshMe(true);
}
async function refreshMe(first){
  try{
    const r=await call('me');
    const changed=!S.user || S.user.role!==r.user.role || S.user.clocks!==r.user.clocks || S.user.seeAccess!==r.user.seeAccess;
    S.user=r.user; S.cfg=r.cfg; setStatus(r.status); store('erp_user',JSON.stringify(r.user));
    if(first||changed) startApp(); else { renderSide(); if(S.view==='clock') viewClock(); }
    if(S.status && S.status.clockedIn && !S.sharing) showAlarm(true);
  }catch(e){ if(first){ $('loginView').classList.remove('hidden'); } }
}
