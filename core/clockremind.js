/* ============ تذكير بصمة الخروج ============ */
// قبل نهاية ساعات الشيفت بكام دقيقة (من Settings) بيظهر شريط فوق + إشعار من المتصفح، ويفضل لحد ما يبصم خروج.
// "فكّرني بعد" بيخفيه شوية ويرجع تاني. الساعات من غير وقت البريك.
// في View as الشريط بيظهر زي ما الموظف شايفه، بس إشعار المتصفح لأ (عشان مايجيلكش انت).
function coWorkedMs(){
  const st=S.status; if(!st||!st.clockedIn) return 0;
  const now=Date.now()-(st._off||0);
  return (Number(st.closedHoursToday)||0)*36e5 + Math.max(0, now-st.inTs-(st.breakMs||0)-(st.onBreak?now-st.breakSince:0));
}
function coDur(ms){ const m=Math.max(0,Math.round(ms/6e4)), h=Math.floor(m/60), r=m%60;
  const w=(n,one,two,few,many)=>n===1?one:n===2?two:n<=10?n+' '+few:n+' '+many;
  const H=h?w(h,'ساعة','ساعتين','ساعات','ساعة'):'', M=(r||!h)?w(r,'دقيقة','دقيقتين','دقايق','دقيقة'):'';
  return H&&M?H+' و'+M:(H||M); }
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
  let b=$('coBar');
  if(!b){ b=document.createElement('div'); b.id='coBar'; b.className='co-bar'; b.setAttribute('role','alert'); const va=$('vaBar'); va? va.after(b) : document.body.prepend(b); }
  const left=shift-w, hrs=Math.round(shift/36e5*10)/10;
  const msg=left>30000?`فاضل ${coDur(left)} على نهاية شيفتك (${hrs} ساعات) · متنساش تبصم خروج`:`شيفتك (${hrs} ساعات) خلص${left< -6e4?' من '+coDur(-left):''} · متنساش تبصم خروج`;
  const html=`<span class="co-ic">⏰</span><span class="co-tx" dir="rtl">${esc(msg)} <small>· اشتغلت النهارده ${esc(coDur(w))}</small></span><span class="spacer"></span>
    <button type="button" class="co-b2" onclick="coLater()">لسه شغال · فكّرني بعد ${Number((S.cfg||{}).coSnooze)||30} دقيقة</button><button type="button" class="co-b1" onclick="clockOut()">Clock Out</button>`;
  if(b.dataset.h!==html){ b.innerHTML=html; b.dataset.h=html; }
  if(!/^⚠/.test(document.title)) document.title='⏰ متنساش تبصم خروج';
}
function coHide(){
  const b=$('coBar'); if(b) b.remove();
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
