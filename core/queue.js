/* ============ لو النت فصل ============
   حاجات بتتضاف بس ومفيهاش تعارض (أحداث مشاركة الشاشة، نوتس التاسكات، السكرين شوتس) بتستنى هنا وتتبعت لوحدها لما النت يرجع.
   البصمة والتايمر وحالة التاسك مش بيستنوا: لازم يتسجلوا بوقت السيرفر. */
S.shotQ = [];                 // السكرين شوتس (في الذاكرة بس لأنها كبيرة)
const QUEUE_OK = { shareEvent:1, taskAct:1 };
function loadQ(){ try{ return JSON.parse(load('erp_q')||'[]')||[]; }catch(e){ return []; } }
function saveQ(q){ store('erp_q', q.length? JSON.stringify(q.slice(-50)) : null); }
function queueSize(){ return loadQ().length + (S.shotQ? S.shotQ.length : 0); }

// بيبعت، ولو النت فاصل بيحطها في الطابور (للحاجات المسموح بيها بس)
function callOrQueue(action, params, label){
  params = Object.assign({}, params||{});
  params.at = params.at || Date.now();
  params.rid = params.rid || (Date.now().toString(36) + Math.random().toString(36).slice(2,10));
  return call(action, params).catch(e=>{
    if(!e.offline || !QUEUE_OK[action]) throw e;
    const q=loadQ(); q.push({action, params, label:label||action, u:S.user&&S.user.username}); saveQ(q);
    renderNet();
    return { queued:true };
  });
}

let flushing=false;
async function flushQueue(){
  if(flushing || !S.token) return;
  flushing=true;
  try{
    let q=loadQ();
    while(q.length){
      const it=q[0];
      if(S.user && it.u && it.u!==S.user.username){ q.shift(); saveQ(q); continue; }
      try{ await call(it.action, it.params); }
      catch(e){
        if(e.offline || !S.token) break;           // لسه مفيش نت، أو محتاج يسجل دخول تاني
        toast('حاجة متبعتتش: '+it.label+' · '+e.message);   // السيرفر رفضها
      }
      q=loadQ(); q.shift(); saveQ(q);
    }
    if(S.shotQ.length && typeof flushShots==='function' && !S.offline) await flushShots();
  } finally { flushing=false; renderNet(); }
}

function setOnline(on){
  const was=!S.offline;
  S.offline=!on;
  if(on && (!was || queueSize())) setTimeout(flushQueue, 300 + Math.random()*1500);
  renderNet();
}
window.addEventListener('online', ()=>setTimeout(flushQueue, 500 + Math.random()*2000));
setInterval(()=>{ if(queueSize() && document.visibilityState==='visible') flushQueue(); }, 30000 + Math.floor(Math.random()*10000));

// الشريط اللي فوق
function renderNet(){
  let el=$('netBar');
  const n=queueSize();
  if(!S.offline && !n){ if(el) el.remove(); return; }
  if(!el){ el=document.createElement('div'); el.id='netBar'; document.body.appendChild(el); }
  el.className=S.offline?'off':'sync';
  el.textContent = S.offline
    ? 'انت أوفلاين'+(n?' · '+n+(n===1?' حاجة مستنية':' حاجات مستنية')+' تتبعت لما النت يرجع':' · البصمة والتايمر محتاجين نت')
    : 'بيبعت '+n+(n===1?' حاجة كانت مستنية...':' حاجات كانت مستنية...');
}
