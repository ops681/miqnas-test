/* ============ الاتصال بالسيرفر ============ */
function call(action, params){
  params = Object.assign({}, params||{}, {token:S.token, dev:deviceId()});
  const done = r => {
    if(r && r.ok) return r.data;
    if(r && r.error==='AUTH'){ forceLogin(); throw new Error('انتهت الجلسة، سجّل دخول تاني'); }
    if(r && r.error==='KICKED'){ forceLogin('اتعمل دخول بحسابك من جهاز تاني، فالجلسة دي اتقفلت', true); throw new Error('اتعمل دخول من جهاز تاني'); }
    throw new Error((r&&r.error)||'حصل خطأ');
  };
  if(IN_GAS){
    return new Promise((res,rej)=>{
      google.script.run.withSuccessHandler(r=>{ try{res(done(r));}catch(e){rej(e);} })
        .withFailureHandler(e=>rej(new Error(e.message||'مشكلة في الاتصال'))).api(action, params);
    });
  }
  // كل طلب ليه رقم مميز ثابت في كل المحاولات، عشان السيرفر مايسجلهوش مرتين
  params.rid = params.rid || (Date.now().toString(36) + Math.random().toString(36).slice(2,10));
  const WAITS = [1000, 3000, 7000];
  // try = رقم المحاولة، q = الحاجات المستنية في الطابور، cf = طلبات فشلت قبل كده (لصفحة System Health)
  const bodyFor = n => JSON.stringify(Object.assign({action},params,{try:n, q:queueSize(), cf:S.cf||0}));
  const attempt = n => fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:bodyFor(n)})
    .then(r=>r.text())
    .then(t=>{ let r; try{ r=JSON.parse(t); }catch(e){ const err=new Error('BAD_REPLY'); err.transient=true; throw err; } return r; },
          e=>{ const err=new Error('NET'); err.transient=true; throw err; })
    .catch(e=>{
      if(!e.transient || n>=WAITS.length) throw e;
      const wait = WAITS[n] + Math.floor(Math.random()*500);
      return new Promise(res=>setTimeout(res, wait)).then(()=>attempt(n+1));
    });
  return attempt(0)
    .then(r=>{ S.cf=0; setOnline(true); return r; })
    .then(done)
    .catch(e=>{
      if(e && e.transient){ S.cf=(S.cf||0)+1; setOnline(false); const x=new Error('مفيش اتصال بالسيرفر دلوقتي. جرّب تاني بعد شوية'); x.offline=true; throw x; }
      throw e.message? e : new Error('مشكلة في الاتصال');
    });
}
function toast(msg){ const t=document.createElement('div'); t.className='toast'; t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),msg.length>40?6000:3200); }
window.erpCall = call;
window.erpToast = toast;
window.ERP_SITE_URL = SITE_URL;

/* ============ كاش (عشان كل صفحة تفتح على طول) ============ */
const PERSIST = ['dash','my','plist','users','board','settings','screen','blockers'];
function cacheKey(){ return 'erp_c_'+(S.user?S.user.username:''); }
function loadCache(){ try{ S.cache=JSON.parse(load(cacheKey())||'{}')||{}; }catch(e){ S.cache={}; } }
function saveCache(){
  clearTimeout(S.csT);
  S.csT=setTimeout(()=>{ const keep={}; PERSIST.forEach(k=>{ if(S.cache[k]) keep[k]=S.cache[k]; }); try{ store(cacheKey(), JSON.stringify(keep)); }catch(e){} },500);
}
function busyTyping(){ const a=document.activeElement; return a && $('main').contains(a) && (a.tagName==='INPUT'||a.tagName==='TEXTAREA'||a.tagName==='SELECT'); }
// بيعرض اللي متخزن فوراً، وبيجيب الجديد في الخلفية
function swr(key, action, params, render){
  const vt=S.vt, c=S.cache[key];
  if(c) render(c,false); else $('main').innerHTML=LOADING;
  return call(action, params).then(r=>{
    S.cache[key]=r; S.fetched[key]=Date.now(); saveCache();
    if(S.vt!==vt) return;
    if(c && busyTyping()) return;
    render(r,true);
  }).catch(e=>{ if(S.vt!==vt) return; if(!c) $('main').innerHTML=`<div class="card err">${esc(e.message)}</div>`; else toast(e.message); });
}
