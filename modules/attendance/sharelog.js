/* ============ سجل المشاركة لكل موظف (2026-11-22) ============
   من صفحة Attendance: دوس على اسم الموظف أو رقم الـ Stops → كل أيام الشغل في الشهر
   (من غير الإجازات والأيام الأوف)، ودوس على أي يوم تشوف كل حدث بوقته وشرحه. */
function slOpen(un,month){
  const day=S.attDay||tdISO(new Date());
  S.sl={un:un, month:month||day.slice(0,7), open:day};
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card sl-card" dir="rtl" role="dialog" aria-labelledby="slH"><div id="slBody">${LOADING}</div></div></div>`;
  slLoad();
}
function slLoad(){
  const q=S.sl; if(!q) return;
  call('shareLog',{username:q.un,month:q.month}).then(r=>{ if(S.sl!==q) return; q.data=r; slRender(); })
    .catch(e=>{ const b=$('slBody'); if(b) b.innerHTML=`<div class="empty">${esc(e.message)}</div><div class="mfoot"><span class="spacer"></span><button class="btn" onclick="closeModal()">قفل</button></div>`; });
}
function slMonth(v){ if(!S.sl||!v) return; S.sl.month=v; $('slBody').innerHTML=LOADING; slLoad(); }
function slToggle(d){ if(!S.sl) return; S.sl.open=S.sl.open===d?'':d; slRender(); }
const SL_WHY={button:'داس على زرار Stop sharing بنفسه',reload:'الصفحة اتقفلت أو اتعملها ريفريش (أو المتصفح قفلها)'};
const SL_OUT={shift:'ساعات الشيفت خلصت',ot:'وصل لحد الأوفر تايم',fin:'وقت "بكمّل شغل" خلص',auto:'السيستم مكانش شايفه (النظام القديم)'};
const slDur=m=>coDur((+m||0)*6e4);
const slMin=t=>{ const m=String(t||'').match(/^(\d{1,2}):(\d{2})/); return m?(+m[1])*60+(+m[2]):null; };
// كل حدث في سطر: الوقت، الأيقونة، العنوان، وشرح صغير
function slEvents(d,isToday){
  const E=d.ev||[], out=[];
  const nextOf=(i,ks)=>{ for(let j=i+1;j<E.length;j++) if(ks.indexOf(E[j].k)>=0) return E[j]; return null; };
  E.forEach((e,i)=>{
    let ic='•', cls='', h='', s='', to='';
    if(e.k==='in'){ ic='🟢'; h='بصمة دخول'+(e.mode?' · بيشارك '+esc(e.mode):''); s='بدأ الشغل ومشاركة الشاشة شغالة'; }
    else if(e.k==='stop'){ ic='🔴'; cls='bad'; const n=nextOf(i,['resume','out','autoout','brk','in']);
      to=n?n.t:''; const m=n?slMin(n.t)-slMin(e.t):null;
      h='وقف مشاركة الشاشة'+(m!=null&&m>=0?' · <b>'+slDur(m)+'</b>':'');
      s=(SL_WHY[e.why]||'السبب مش متسجل (قبل 22 نوفمبر كان مش بيتسجل)')+'. '+(!n?(isToday&&d.sessions.some(x=>x.open)?'لسه مارجّعهاش.':'مارجّعهاش لحد آخر اليوم.'):n.k==='resume'?'رجّعها الساعة '+esc(n.t)+'.':n.k==='brk'?'وبعدها دخل بريك.':'وبعدها خرج.'); }
    else if(e.k==='resume'){ ic='🟢'; h='رجّع المشاركة'+(e.mode?' · '+esc(e.mode):''); s='السيستم رجع يشوف الشاشة'; }
    else if(e.k==='brk'){ ic='☕'; const n=nextOf(i,['brkEnd','out','autoout']); to=n?n.t:''; const m=n?slMin(n.t)-slMin(e.t):null;
      h='بريك'+(m!=null&&m>=0?' · '+slDur(m):''); s=e.note?'السبب: '+esc(e.note):'وقت البريك المشاركة مش مطلوبة'; }
    else if(e.k==='brkEnd'){ ic='↩️'; h='رجع من البريك'; s='المشاركة مطلوبة تاني'; }
    else if(e.k==='shotfail'){ ic='📷'; cls='warn'; h='سكرين شوت فشلت'; s=(e.note?esc(e.note)+'. ':'')+'غالباً النت ضعيف أو المتصفح منع الصورة'; }
    else if(e.k==='shotnote'){ ic='📷'; h='ملاحظة على السكرين شوت'; s=esc(e.note||''); }
    else if(e.k==='gone'){ ic='⚠️'; cls='warn'; h='السيستم مكانش شايفه'+(e.min?' · '+slDur(e.min):''); s='من الساعة دي مفيش صور ولا الموقع قدامه. الإدارة جالها تنبيه والبصمة فضلت مفتوحة'; }
    else if(e.k==='autoout'){ ic='🚪'; h='البصمة اتقفلت لوحدها'; const w=(d.sessions.find(x=>x.outT===e.t)||{}).why; s=SL_OUT[w]||'خلصت ساعات الشغل المسموحة'; }
    else if(e.k==='out'){ ic='🚪'; h='بصمة خروج'; s='قفل البصمة بنفسه'; }
    else { h=esc(e.note||''); }
    out.push(`<li class="${cls}"><span class="sl-t">${esc(e.t)}${to?`<small dir="rtl">لحد ${esc(to)}</small>`:''}</span><span class="sl-i" aria-hidden="true">${ic}</span><span class="sl-x"><b>${h}</b>${s?`<small>${s}</small>`:''}</span></li>`);
  });
  return out.length?`<ol class="sl-ev">${out.join('')}</ol>`:'<div class="muted" style="padding:10px 4px;font-size:13px">مفيش أحداث متسجلة لليوم ده (بصمة بس أو قبل ما السجل يبدأ).</div>';
}
function slRender(){
  const q=S.sl, r=q&&q.data, b=$('slBody'); if(!r||!b) return;
  const today=tdISO(new Date()), m=r.sum||{};
  const dl=d=>new Date(d+'T12:00:00').toLocaleDateString('ar-EG',{weekday:'long',day:'numeric',month:'long'});
  const rows=(r.days||[]).map(d=>{
    if(d.absent) return `<div class="sl-day absent"><div class="sl-row"><span class="sl-d">${dl(d.date)}</span><span class="pill p-out">غياب</span><span class="muted" style="font-size:12.5px">مفيش بصمة دخول</span></div></div>`;
    const op=q.open===d.date, bad=d.stops||d.gone;
    const se=d.sessions.map(x=>`${esc(x.inT)} → ${x.open?(d.date===today?'دلوقتي':'—'):esc(x.outT)}`).join(' · ');
    return `<div class="sl-day${op?' open':''}${bad?' flag':''}"><button type="button" class="sl-row" aria-expanded="${op}" onclick="slToggle('${d.date}')">
      <span class="sl-d">${dl(d.date)}${d.off?' <span class="pill p-prog">يوم أوف</span>':''}</span>
      <span class="sl-s">${se}</span>
      <span class="sl-n">${d.stops?`<span class="pill p-bad">وقف ${d.stops} مرة · ${slDur(d.offMin)}</span>`:'<span class="pill p-in">مشاركة كاملة</span>'}${d.gone?` <span class="pill p-absent">⚠️ ${d.gone}</span>`:''}${d.fails?` <span class="pill p-out">📷 ${d.fails}</span>`:''}</span>
      <span class="sl-h">${d.sessions.some(x=>x.open)&&d.date===today?'شغال دلوقتي':d.hours+' س'}</span><span class="sl-c" aria-hidden="true">${op?'▴':'▾'}</span></button>
      ${op?`<div class="sl-in"><div class="sl-meta">${d.shots} سكرين شوت${d.hours?' · '+d.hours+' ساعة':''}${d.sessions.length>1?' · '+d.sessions.length+' بصمات':''}</div>${slEvents(d,d.date===today)}</div>`:''}</div>`;
  }).join('');
  const cur=new Date().toISOString().slice(0,7);
  b.innerHTML=`<div class="sl-head"><div><h2 id="slH">سجل المشاركة · ${esc(r.name)}</h2><div class="muted" style="font-size:13px">${esc(r.job||'')}</div></div>
      <input type="month" class="sl-m" value="${esc(r.month)}" max="${cur}" onchange="slMonth(this.value)" aria-label="الشهر"></div>
    <div class="sl-kpis">
      <div><span>أيام شغل</span><b>${m.days||0}</b></div>
      <div><span>غياب</span><b>${m.absent||0}</b></div>
      <div><span>وقف المشاركة</span><b style="color:${m.stops?'var(--bad)':'var(--ink)'}">${m.stops||0} مرة</b></div>
      <div><span>من غير مشاركة</span><b>${slDur(m.offMin)}</b></div>
      <div><span>السيستم مش شايفه</span><b style="color:${m.gone?'var(--warn)':'var(--ink)'}">${m.gone||0}</b></div>
      <div><span>ساعات</span><b>${m.hours||0}</b></div></div>
    <p class="muted" style="font-size:12.5px;margin:0 0 8px">أيام الإجازة والأيام الأوف مش ظاهرة. دوس على أي يوم تشوف تفاصيله.</p>
    <div class="sl-days">${rows||'<div class="empty">مفيش أيام شغل في الشهر ده.</div>'}</div>
    <div class="mfoot"><span class="spacer"></span><button class="btn" type="button" onclick="closeModal()">قفل</button></div>`;
  const o=b.querySelector('.sl-day.open'); if(o && !q.scrolled){ q.scrolled=1; o.scrollIntoView({block:'nearest'}); }
}
