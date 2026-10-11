/* ============ إشعارات الموبايل (Push) ============
   الموظف بيفعّلها من الجرس (📱). على الآيفون لازم يضيف التطبيق على الشاشة الرئيسية الأول (iOS 16.4+).
   التوكن بيتسجل في السيستم، والسيرفر بيبعت عن طريق Firebase. */
const FB_V='10.12.2';
function pushSupported(){ return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window; }
function isIOS(){ return /iPhone|iPad|iPod/.test(navigator.userAgent); }
function pushLoad(src){ return new Promise((res,rej)=>{ if(document.querySelector(`script[src="${src}"]`)) return res(); const s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=()=>rej(new Error('load')); document.head.appendChild(s); }); }
async function pushMessaging(cfg){
  await pushLoad(`https://www.gstatic.com/firebasejs/${FB_V}/firebase-app-compat.js`);
  await pushLoad(`https://www.gstatic.com/firebasejs/${FB_V}/firebase-messaging-compat.js`);
  if(!firebase.apps.length) firebase.initializeApp({apiKey:cfg.apiKey,projectId:cfg.projectId,messagingSenderId:cfg.senderId,appId:cfg.appId});
  return firebase.messaging();
}
async function pushEnable(){
  const r=await call('pushConfig'); if(!r.cfg) throw new Error('إشعارات الموبايل لسه مااتفعلتش من الإدارة (Settings)');
  if(Notification.permission==='denied') throw new Error('الإشعارات مقفولة للموقع ده من إعدادات الموبايل/البراوزر. افتحها من هناك وجرّب تاني');
  const perm=await Notification.requestPermission(); if(perm!=='granted') throw new Error('لازم توافق على الإشعارات');
  const reg=await navigator.serviceWorker.register('sw.js');
  await navigator.serviceWorker.ready;
  const m=await pushMessaging(r.cfg);
  const token=await m.getToken({vapidKey:r.cfg.vapidKey,serviceWorkerRegistration:reg});
  if(!token) throw new Error('مقدرتش أسجل الجهاز ده');
  const label=(isIOS()?'iPhone':/Android/.test(navigator.userAgent)?'Android':'Browser')+' · '+new Date().toLocaleDateString('en-GB');
  await call('pushRegister',{ftoken:token,label}); store('erp_push',token); return token;
}
async function pushDisable(){
  const t=load('erp_push'); try{ await call('pushUnregister',{ftoken:t||''}); }catch(e){}
  try{ const r=await call('pushConfig'); if(r.cfg){ const m=await pushMessaging(r.cfg); await m.deleteToken(); } }catch(e){}
  store('erp_push',null);
}
function pushPanel(){
  const on=!!load('erp_push') && pushSupported() && Notification.permission==='granted';
  const iosHint=isIOS()&&!isStandalone();
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:440px">
    <h2 style="margin:0 0 6px">Phone notifications</h2>
    <p class="muted" style="font-size:13.5px;margin:0 0 12px">Get the bell notifications on this phone, even when the app is closed.</p>
    ${!pushSupported()&&!iosHint?'<div class="notice">This browser does not support notifications.</div>'
      :iosHint?'<div class="notice">On iPhone: open this site in Safari, tap Share → <b>Add to Home Screen</b>, open the app from the home screen, then turn notifications on from here. Needs iOS 16.4 or newer.</div>'
      :`<div class="row" style="gap:10px;align-items:center"><span class="pill ${on?'p-in':'p-out'}">${on?'On for this device':'Off'}</span><div class="spacer"></div>${on?'<button class="btn ghost" id="puT">Send a test</button><button class="btn ghost danger" id="puX">Turn off</button>':'<button class="btn primary" id="puO">Turn on</button>'}</div>`}
    <div class="err" id="puE"></div>
    <div class="mfoot"><div class="spacer"></div><button class="btn ghost" onclick="closeModal()">Close</button></div></div></div>`;
  const err=e=>{ $('puE').textContent=e.message||'حصل خطأ'; };
  if($('puO')) $('puO').onclick=async()=>{ $('puO').disabled=true; $('puO').textContent='Turning on…'; try{ await pushEnable(); toast('الإشعارات اتفعلت ✓'); pushPanel(); }catch(e){ err(e); $('puO').disabled=false; $('puO').textContent='Turn on'; } };
  if($('puX')) $('puX').onclick=async()=>{ await pushDisable(); toast('اتقفلت'); pushPanel(); };
  if($('puT')) $('puT').onclick=async()=>{ try{ await call('pushTest'); toast('اتبعت ✓ شوف الموبايل'); }catch(e){ err(e); } };
}
// لما حد يدوس على الإشعار: نفتح المكان بتاعه
if('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message',e=>{ const d=e.data||{}; if(d.type==='push-go'&&d.go&&S.user){ try{ goTo(JSON.parse(d.go)); }catch(x){} } });
(function(){ const m=location.search.match(/[?&]go=([^&]+)/); if(m){ S.pendingGo=decodeURIComponent(m[1]); history.replaceState(null,'',location.pathname+location.hash); } })();
