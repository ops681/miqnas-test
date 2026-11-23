/* ============ Attendance › ⬇ Excel لفترة (2026-11-23) ============
   الـ HR بيسحبه آخر الشهر للمرتبات: من / إلى (أقصى 93 يوم)، قسم أو موظف أو الكل.
   ملف واحد: الملخص (سطر لكل موظف ومجموعه = أيام الفترة) + التفاصيل (سطر لكل موظف في كل يوم، حتى الأجازات) + عن الملف.
   عناوين وحالات بالعربي والإنجليزي. */
const ATR_ST={present:'حاضر / Present',offwork:'اشتغل في يوم أجازة / Worked on day off',absent:'غايب / Absent',leave:'أجازة / Leave',weekend:'أجازة أسبوعية / Weekly off',holiday:'أجازة رسمية / Public holiday',before:'قبل أول بصمة / Before first clock-in',today:'النهارده، لسه مابصمش / Today, not in yet',future:'لسه مجاش / Not yet'};
const ATR_WHY={shift:'نهاية الشيفت / Shift end',ot:'حد الأوفر تايم / Overtime limit',fin:'وقت التكملة خلص / Finish time',auto:'السيستم مكانش شايفه / Inactivity (old)'};
const ATR_KIND={ot:'أوفر تايم / Overtime',new:'شيفت جديد / New shift',fin:'بيكمّل / Finishing'};
const ATR_DAY_AR=['الأحد','الاتنين','التلات','الأربع','الخميس','الجمعة','السبت'], ATR_DAY_EN=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const atrISO=d=>{ const z=new Date(d.getTime()-d.getTimezoneOffset()*6e4); return z.toISOString().slice(0,10); };
const atrAdd=(iso,k)=>{ const x=new Date(iso+'T12:00:00'); x.setDate(x.getDate()+k); return atrISO(x); };
const atrMEnd=iso=>{ const y=+iso.slice(0,4), m=+iso.slice(5,7); return iso.slice(0,7)+'-'+String(new Date(Date.UTC(y,m,0)).getUTCDate()).padStart(2,'0'); };
const atrDays=(a,b)=>Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/864e5)+1;
function atrPreset(k){
  const t=tdISO(new Date()), m1=t.slice(0,7)+'-01';
  if(k==='this') return [m1,atrMEnd(t)];
  if(k==='last'){ const e=atrAdd(m1,-1); return [e.slice(0,7)+'-01',e]; }
  if(k==='7') return [atrAdd(t,-6),t];
  if(k==='30') return [atrAdd(t,-29),t];
  return [m1,t];
}
function atrOpen(){
  const t=tdISO(new Date()), def=+t.slice(8,10)<=5?'last':'this', [f,e]=atrPreset(def);
  S.atr={preset:def,opts:null};
  const chip=(k,l)=>`<button type="button" data-k="${k}" class="${k===def?'on':''}" onclick="atrPick('${k}')">${l}</button>`;
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" dir="rtl" role="dialog" aria-labelledby="atrH">
    <h2 id="atrH" style="margin-top:0">⬇ تصدير الحضور لفترة</h2>
    <div class="muted" style="font-size:13px;margin-bottom:14px">ملف Excel واحد: ملخص لكل موظف، وسطر لكل موظف في كل يوم من أيام الفترة (حتى الأجازات الأسبوعية والرسمية) عشان المرتبات.</div>
    <div class="chips" id="atrChips" style="margin-bottom:12px">${chip('this','الشهر ده')}${chip('last','الشهر اللي فات')}${chip('7','آخر 7 أيام')}${chip('30','آخر 30 يوم')}</div>
    <div class="row2" style="display:flex;gap:10px;flex-wrap:wrap">
      <label style="flex:1;min-width:140px">من<input type="date" id="atrFrom" value="${f}" max="${t}" onchange="atrDirty()"></label>
      <label style="flex:1;min-width:140px">إلى<input type="date" id="atrTo" value="${e}" onchange="atrDirty()"></label>
    </div>
    <div class="row2" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px">
      <label style="flex:1;min-width:140px">القسم<select id="atrDept" onchange="atrFillPeople()"><option value="">كل الأقسام</option></select></label>
      <label style="flex:1;min-width:140px">الموظف<select id="atrUser"><option value="">الكل</option></select></label>
    </div>
    <div id="atrInfo" class="muted" style="font-size:13px;margin-top:10px"></div>
    <div class="mfoot"><span class="spacer"></span><button class="btn" onclick="closeModal()">إلغاء</button><button class="btn primary" id="atrGo" onclick="atrRun()">⬇ نزّل الملف</button></div>
  </div></div>`;
  atrDirty(def);
  call('attRange',{opts:1}).then(o=>{ if(!S.atr) return; S.atr.opts=o; const d=$('atrDept'); if(!d) return;
    d.insertAdjacentHTML('beforeend',(o.depts||[]).map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('')); atrFillPeople(); }).catch(()=>{});
}
function atrPick(k){ const [f,e]=atrPreset(k); $('atrFrom').value=f; $('atrTo').value=e; S.atr.preset=k; atrDirty(k); }
function atrDirty(k){
  document.querySelectorAll('#atrChips button').forEach(b=>b.classList.toggle('on',b.dataset.k===k));
  const f=$('atrFrom').value, e=$('atrTo').value, i=$('atrInfo'), g=$('atrGo'), max=(S.atr&&S.atr.opts&&S.atr.opts.max)||93;
  let msg='', ok=false;
  if(!f||!e) msg='اختار من وإلى';
  else if(f>e) msg='تاريخ البداية لازم يكون قبل النهاية';
  else if(atrDays(f,e)>max) msg='أقصى مدة '+max+' يوم في المرة';
  else if(f>tdISO(new Date())) msg='الفترة دي لسه مجتش';
  else { ok=true; msg=atrDays(f,e)+' يوم · كل موظف هيبقى ليه '+atrDays(f,e)+' سطر'+(e>tdISO(new Date())?' (الأيام الجاية مكتوب قدامها "لسه مجاش")':''); }
  i.textContent=msg; i.style.color=ok?'':'var(--red,#c0392b)'; g.disabled=!ok;
}
function atrFillPeople(){
  const o=S.atr&&S.atr.opts, u=$('atrUser'); if(!o||!u) return; const d=$('atrDept').value;
  u.innerHTML='<option value="">الكل</option>'+(o.people||[]).filter(p=>!d||p.dept===d).map(p=>`<option value="${esc(p.u)}">${esc(p.name)}</option>`).join('');
}
async function atrRun(){
  const f=$('atrFrom').value, e=$('atrTo').value, dept=$('atrDept').value, un=$('atrUser').value, g=$('atrGo');
  g.disabled=true; const old=g.textContent; g.textContent='بيجهّز الملف…';
  try{
    const r=await call('attRange',{from:f,to:e,dept:dept,username:un});
    const o=S.atr&&S.atr.opts, dn=dept&&o?((o.depts||[]).find(x=>x.id===dept)||{}).name:'', pn=un&&o?((o.people||[]).find(x=>x.u===un)||{}).name:'';
    xlSave('attendance-'+f+'_to_'+e+(pn?'-'+un:dn?'-'+dn:''),atrSheets(r,dn,pn));
    toast('اتحمّل ملف الـ Excel ✓'); closeModal();
  }catch(x){ toast(x.message||'حصلت مشكلة'); g.disabled=false; g.textContent=old; }
}
function atrSheets(r,dn,pn){
  const P=r.people||[], num=v=>Number(v)||0;
  const sum=[['الاسم / Name','القسم / Department','الوظيفة / Job','أيام الفترة / Days in period','حاضر / Present','اشتغل في يوم أجازة / Worked on day off','غايب / Absent','أجازة / Leave','أجازة أسبوعية / Weekly off','أجازة رسمية / Public holiday','قبل أول بصمة / Before first clock-in','لسه / Not yet','إجمالي الساعات / Total hours','متوسط اليوم / Avg per day','إذن بالساعات / Permission hours','أوفر تايم معتمد / Approved overtime hours','نسي يخرج / Missed clock-outs','اتقفلت لوحدها / Closed by itself','وقف الشير / Sharing stops']]
    .concat(P.map(p=>{ const s=p.sum||{}; return [p.name+(p.active===false?' (archived)':''),p.deptName,p.job,num(s.days),num(s.present),num(s.offwork),num(s.absent),num(s.leave),num(s.weekend),num(s.holiday),num(s.before),num(s.today)+num(s.future),num(s.hours),num(s.avg),num(s.permHours),num(s.otHours),num(s.missed),num(s.autoClosed),num(s.stops)]; }));
  const det=[['التاريخ / Date','اليوم / Day','الاسم / Name','القسم / Department','الوظيفة / Job','الحالة / Status','نوع الأجازة أو المناسبة / Leave type or holiday','الدخول / In','الخروج / Out','عدد البصمات / Sessions','الساعات / Hours','إذن بالساعات / Permission hours','أوفر تايم معتمد / Approved overtime hours','نسي يخرج / Missed clock-out','اتقفلت لوحدها / Closed by itself','نوع الجلسة / Session type','سبب الأوفر تايم / Overtime reason','وقف الشير / Sharing stops']];
  P.forEach(p=>(p.days||[]).forEach(d=>{ const wd=new Date(d.date+'T12:00:00Z').getUTCDay();
    det.push([d.date,ATR_DAY_AR[wd]+' / '+ATR_DAY_EN[wd],p.name,p.deptName,p.job,ATR_ST[d.st]||d.st,d.leaveType||d.holiday||'',t12?t12(d.inT):d.inT,t12?t12(d.outT):d.outT,d.sessions||'',d.sessions?num(d.hours):'',d.perm?num(d.perm):'',d.ot?num(d.ot):'',d.missed?'أيوه / Yes':'',ATR_WHY[d.why]||d.why||'',String(d.kind||'').split(',').filter(Boolean).map(k=>ATR_KIND[k]||k).join(' + '),d.otReason||'',d.sessions?num(d.stops):'']); }));
  const about=[['البند / Item','القيمة / Value'],['الفترة / Period',r.from+' → '+r.to],['عدد الأيام / Days',num(r.days)],['القسم / Department',dn||'كل الأقسام / All'],['الموظف / Employee',pn||'الكل / All'],['عدد الموظفين / Employees',P.length],['اتصدّر / Exported',new Date().toLocaleString('en-GB',{timeZone:'Africa/Cairo'})],
    ['',''],['الحالات / Statuses','']].concat(Object.keys(ATR_ST).map(k=>['',ATR_ST[k]])).concat([['',''],['ملاحظة / Note','مجموع الحالات لكل موظف في الملخص = أيام الفترة / Statuses per employee add up to the days in the period'],['','الإذن والأوفر تايم = الطلبات المعتمدة بس / Permission and overtime = approved requests only']]);
  return [{name:'الملخص Summary',rows:sum},{name:'التفاصيل Details',rows:det},{name:'عن الملف About',rows:about}];
}
