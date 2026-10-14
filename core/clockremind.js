/* ============ تذكير بصمة الخروج ============ */
// قبل نهاية ساعات الشيفت بكام دقيقة (من Settings) بيظهر كارت في نص الشاشة (بيتسحب) + إشعار من المتصفح، ويفضل لحد ما يبصم خروج.
// "فكّرني بعد" بيخفيه شوية ويرجع تاني. الساعات من غير وقت البريك.
// في View as الكارت بيظهر زي ما الموظف شايفه، بس إشعار المتصفح لأ (عشان مايجيلكش انت).
function coWorkedMs(){
  const st=S.status; if(!st||!st.clockedIn) return 0;
  return (Number(st.closedHoursToday)||0)*36e5 + workedMs(st);
}
function coDur(ms){ const m=Math.max(0,Math.round(ms/6e4)), h=Math.floor(m/60), r=m%60;
  const w=(n,one,two,few,many)=>n===1?one:n===2?two:n<=10?n+' '+few:n+' '+many;
  const H=h?w(h,'ساعة','ساعتين','ساعات','ساعة'):'', M=(r||!h)?w(r,'دقيقة','دقيقتين','دقايق','دقيقة'):'';
  return m<1?'أقل من دقيقة':(H&&M?H+' و'+M:(H||M)); }
function coTick(){
  const c=S.cfg||{}, st=S.status, u=S.user;
  const on=c.coOn && u && u.clocks && !S.mobile && st && st.clockedIn && !st.onBreak;
  if(!on){ coHide(); S.coEp=0; return; }
  const shift=(Number(u.shift)||8)*36e5, before=(Number(c.coBefore)||5)*6e4, w=coWorkedMs();
  if(w < shift-before){ coHide(); S.coEp=0; return; }
  const snz=Number(load('co_snz'))||0;
  if(Date.now()<snz){ coHide(); return; }
  coShow(w, shift);
  // إشعار المتصفح: مرة لما الشريط يظهر، ومرة كل ما "فكّرني بعد" يخلص
  const ep=snz||1;
  if(c.coNotify && !VA_TAB && S.coEp!==ep){ S.coEp=ep; coNotify(shift-w); }
}
function coShow(w, shift){
  let b=$('coCard');
  if(!b){
    b=document.createElement('div'); b.id='coCard'; b.className='co-card'; b.setAttribute('role','alertdialog'); b.setAttribute('aria-label','متنساش تبصم خروج');
    b.innerHTML=`<div class="co-h" title="اسحب من هنا"><span>⏰</span><span dir="rtl">متنساش تبصم خروج</span><span class="co-grip">⠿ اسحب</span></div>
      <div class="co-bd" dir="rtl"><span class="co-tx"></span><small class="co-w"></small></div>
      <div class="co-ft"><button type="button" class="co-b2" onclick="coLater()"></button><button type="button" class="co-b1" onclick="clockOut()">Clock Out</button></div>`;
    document.body.appendChild(b); coDrag(b);
  }
  const left=shift-w;
  const tx=left>30000?`فاضل <b>${esc(coDur(left))}</b> على نهاية شيفتك (${esc(coDur(shift))}).`:`شيفتك (${esc(coDur(shift))}) خلص${left< -6e4?' من <b>'+esc(coDur(-left))+'</b>':''}.`;
  const q=(k,v,html)=>{ const e=b.querySelector(k); if(e && e.dataset.v!==v){ e.dataset.v=v; html? e.innerHTML=v : e.textContent=v; } };
  q('.co-tx',tx,true); q('.co-w','اشتغلت النهارده '+coDur(w)); q('.co-b2','فكّرني بعد '+(Number((S.cfg||{}).coSnooze)||30)+' دقيقة');
  if(!/^⚠/.test(document.title)) document.title='⏰ متنساش تبصم خروج';
}
// السحب من شريط العنوان. المكان مش بيتحفظ: كل مرة الكارت بيظهر في النص
function coDrag(b){
  const h=b.querySelector('.co-h'); let sx=0, sy=0, ox=0, oy=0, on=false;
  h.addEventListener('pointerdown',e=>{ if(e.button) return; const r=b.getBoundingClientRect(); b.style.transform='none'; b.style.left=r.left+'px'; b.style.top=r.top+'px'; sx=e.clientX; sy=e.clientY; ox=r.left; oy=r.top; on=true; b.classList.add('drag'); try{ h.setPointerCapture(e.pointerId); }catch(x){} e.preventDefault(); });
  h.addEventListener('pointermove',e=>{ if(!on) return; const W=window.innerWidth, H=window.innerHeight, bw=b.offsetWidth, bh=b.offsetHeight;
    b.style.left=Math.min(Math.max(8,ox+e.clientX-sx),W-bw-8)+'px'; b.style.top=Math.min(Math.max(8,oy+e.clientY-sy),H-bh-8)+'px'; });
  const end=()=>{ on=false; b.classList.remove('drag'); };
  h.addEventListener('pointerup',end); h.addEventListener('pointercancel',end);
}
function coHide(){
  const b=$('coCard'); if(b) b.remove();
  if(/^⏰/.test(document.title)) document.title='Miqnas ERP';
}
function coLater(){ store('co_snz', String(Date.now()+(Number((S.cfg||{}).coSnooze)||30)*6e4)); coHide(); toast('هفكّرك تاني بعد '+((Number((S.cfg||{}).coSnooze)||30))+' دقيقة'); }
function coNotify(left){
  try{
    if(!('Notification' in window) || Notification.permission!=='granted') return;
    const n=new Notification('⏰ متنساش تبصم خروج',{ body: left>30000?`فاضل ${coDur(left)} على نهاية شيفتك. افتح Miqnas ERP واعمل Clock Out.`:'شيفتك خلص. افتح Miqnas ERP واعمل Clock Out.', tag:'mq-clockout', requireInteraction:true, icon:(S.brand&&S.brand.logo)||undefined });
    n.onclick=()=>{ try{ window.focus(); n.close(); }catch(e){} };
  }catch(e){}
}
// بنطلب إذن الإشعارات وقت بصمة الدخول (لأن المتصفح بيطلب ضغطة من الشخص)
function coAsk(){ try{ if(!VA_TAB && S.cfg && S.cfg.coOn && S.cfg.coNotify && 'Notification' in window && Notification.permission==='default') Notification.requestPermission().catch(()=>{}); }catch(e){} }
setInterval(coTick, 15000);
