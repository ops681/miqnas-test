/* ============ View as: تشوف السيستم بعين موظف ============ */
// بيتفتح في تاب لوحده بتوكن خاص بالتاب ده. مفيش بصمة، ولا أي أثر عند الموظف.
async function viewAsOpen(un){
  const w=window.open('about:blank','_blank');
  try{
    const r=await call('viewAsStart',{username:un});
    const url=location.pathname+'#va='+r.token;
    if(w){ w.location.href=url; } else location.href=url;
  }catch(e){ if(w) w.close(); alert(e.message); }
}
function vaBar(){
  let b=$('vaBar'); if(!S.va){ if(b) b.remove(); document.body.classList.remove('va-on'); return; }
  if(!b){ b=document.createElement('div'); b.id='vaBar'; document.body.prepend(b); }
  document.body.classList.add('va-on');
  const ed=!!S.va.edit, nm=S.user?S.user.name:'';
  b.className='va-bar'+(ed?' edit':'');
  b.innerHTML=`<span class="va-ic">${ed?'✏️':'👁'}</span><span class="va-tx" dir="rtl">${ed?`وضع التعديل: أي حاجة هتعملها هتتسجل باسم ${bd(nm)}`:`انت شايف السيستم بعين ${bd(nm)} · للمشاهدة بس`}</span><span class="spacer"></span>
    <button class="btn small ${ed?'':'ghost'}" onclick="vaMode(${ed?'false':'true'})">${ed?'👁 Back to View':'✏️ Edit'}</button>
    <button class="btn small ghost" onclick="vaExit()">Exit</button>`;
}
async function vaMode(edit){
  if(edit && !confirm('وضع التعديل: أي حاجة هتعملها (تايمر، حالة، طلب...) هتتسجل على إن الموظف هو اللي عملها. تكمل؟')) return;
  try{ const r=await call('viewAsMode',{edit}); S.va.edit=r.edit; vaBar(); toast(r.edit?'وضع التعديل شغال':'رجعت للمشاهدة بس'); }catch(e){ toast(e.message); }
}
function vaExit(){
  try{ call('logout').catch(()=>{}); }catch(e){}
  try{ Object.keys(sessionStorage).filter(k=>k.indexOf(KP)===0).forEach(k=>sessionStorage.removeItem(k)); }catch(e){}
  setTimeout(()=>{ window.close(); vaEnded(); },150);
}
function vaEnded(){
  try{ Object.keys(sessionStorage).filter(k=>k.indexOf(KP)===0).forEach(k=>sessionStorage.removeItem(k)); }catch(e){}
  document.body.innerHTML=`<div style="max-width:420px;margin:18vh auto;padding:24px;text-align:center;font-family:inherit" dir="rtl"><h2 style="margin:0 0 8px">View as اتقفل</h2><p style="color:#5B6E6A">الجلسة خلصت أو اتقفلت. اقفل التاب ده وافتح View as تاني من صفحة الموظفين.</p><button class="btn primary" onclick="window.close()">اقفل التاب</button></div>`;
}
