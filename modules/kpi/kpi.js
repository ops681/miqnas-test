/* ============ KPIs: الـ Scorecard الشهري + الـ Heatmap + الإعدادات ============
   الموظف بيشوف بتاعه في My Desk. الإدارة ورئيس القسم بيشوفوا الـ Heatmap (Scorecards + Executive).
   كل الأرقام والأوزان والحدود من Settings → KPIs & Capacity. السكور بيتحسب كل ليلة. */
const KPI_AX=[['delivery','Delivery','التسليم في الميعاد'],['quality','Quality','اتقبلت من أول مرة'],['attendance','Attendance','الحضور'],['compliance','Compliance','بيانات التاسك كاملة']];
const KPI_MISS={timer:'التايمر ماشتغلش',status:'اتقفلت Done من غير In Progress',deadline:'من غير ديدلاين',link:'من غير لينك تسليم',brief:'البريف مش كامل',follow:'البلوكر محتاج متابعة'};
const kpiCol=(s,g,a)=>s==null?'':s>=g?'green':s>=a?'amber':'red';
const kpiMon=m=>{ try{ return new Date(m+'-15T12:00:00').toLocaleDateString('en-GB',{month:'long',year:'numeric'}); }catch(e){ return m; } };
const kpiDay=d=>{ try{ return new Date(d+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'}); }catch(e){ return d; } };
function kpiMonthSel(R,fn){ return `<select class="kpi-ms" aria-label="Month" onchange="${fn}(this.value)">${(R.months||[R.month]).map(m=>`<option value="${esc(m)}"${m===R.month?' selected':''}>${esc(kpiMon(m))}</option>`).join('')}</select>`; }

/* ----- My Desk ----- */
async function kpiDeskLoad(month){
  if(!$('kpiDesk')) return;
  if(!month && S.cache.kpiMine) $('kpiDesk').innerHTML=kpiCardHTML(S.cache.kpiMine,true);
  try{ const r=await call('kpiMine',month?{month}:{}); if(!month) S.cache.kpiMine=r; if($('kpiDesk')) $('kpiDesk').innerHTML=kpiCardHTML(r,true); }catch(e){ if($('kpiDesk')&&!S.cache.kpiMine) $('kpiDesk').innerHTML=''; }
}
function kpiCardHTML(R,own){
  const x=R.me, g=R.green||85, a=R.amber||70, w=R.w||{};
  const head=`<div class="chead"><h2>📊 ${own?'My scorecard':esc(x?x.name:'Scorecard')}</h2>${R.trial?'<span class="pill p-yel" title="السكور بيتحسب ويظهر من غير أي تأثير">شهر تجريبي</span>':''}<span class="spacer"></span>${own?kpiMonthSel(R,'kpiDeskLoad'):`<span class="muted" style="font-size:13px">${esc(kpiMon(R.month))}</span>`}</div>`;
  if(!x) return `<div class="card flush kpi-card">${head}${own&&R.toRate?`<button class="btn small kpi-rate-b" onclick="kpiRateOpen()">⭐ عندك ${R.toRate} تقييم للشهر ده</button>`:''}<div class="empty"><b>لسه مفيش سكور للشهر ده</b>السكور بيتحسب كل ليلة من التاسكات اللي اتسلّمت والحضور.</div></div>`;
  const ring=x.total==null?'<div class="kpi-total na"><div>–</div></div>':`<div class="kpi-total ${x.color}" style="--p:${x.total}"><div><b>${x.total}</b><span>من 100</span></div></div>`;
  const axl=KPI_AX.map(([k,en,ar])=>[k,en,ar+' · '+(w[k]||0)+'%']).concat(Object.keys(x.axes).filter(k=>x.axes[k]&&x.axes[k].custom).map(k=>{ const v=x.axes[k]; return [k,v.name,(v.kind==='manual'?'تقييم':'مقياس')+' · '+v.w+'%']; }));
  const rows=axl.map(([k,en,sub])=>{ const v=x.axes[k]||{}; const c=v.na?'':kpiCol(v.score,g,a);
    return `<details class="kpi-ax"><summary><span class="kpi-an"><b>${esc(en)}</b><small>${esc(sub)}</small></span><span class="kpi-bar"><i class="${c}" style="width:${v.na?0:v.score}%"></i></span><span class="kpi-sc ${c}">${v.na?(v.pending?'<small>⏳ مستني تقييم</small>':'<small>مفيش داتا كفاية</small>'):v.score}</span></summary><div class="kpi-det" dir="rtl">${kpiDetHTML(k,v)}</div></details>`; }).join('');
  const rate=own&&R.toRate?`<button class="btn small kpi-rate-b" onclick="kpiRateOpen()">⭐ عندك ${R.toRate} تقييم للشهر ده</button>`:'';
  const L=x.load||{};
  const load=L.max?`<div class="kpi-load"><span>الحِمل</span><b class="${L.color||''}">${L.pct}%</b><small>${L.projects} مشروع · الـ Capacity ${L.min===L.max?L.max:L.min+'–'+L.max}</small></div>`:L.projects?`<div class="kpi-load"><span>الحِمل</span><b>${L.projects}</b><small>مشروع · مفيش Capacity للوظيفة دي في الإعدادات</small></div>`:'';
  return `<div class="card flush kpi-card">${head}${rate}<div class="kpi-top">${ring}<div class="kpi-axes">${rows}</div></div>${load}
    <div class="muted kpi-foot">${R.computedAt?'اتحسب '+new Date(R.computedAt).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):''} · دوس على أي محور تشوف التفاصيل</div></div>`;
}
function kpiDetHTML(k,v){
  if(v.custom){
    if(v.kind==='manual') return v.na?`<div class="muted">لسه ماتقيّمش. اللي بيقيّم: ${esc(v.rater||'')}. لحد ما يتقيّم وزنه بيتوزع على الباقي.</div>`:`<div>${v.score} من 100${v.by?' · قيّمه '+esc(v.by):''}</div>${v.note?`<div class="muted">${bd(v.note)}</div>`:''}`;
    return v.na?`<div class="muted">${esc(v.metric||'')}: مفيش داتا في الشهر ده.</div>`:`<div>${esc(v.metric||'')}: ${v.actual} من الهدف ${v.target}</div>`;
  }
  if(v.na) return `<div class="muted">${k==='attendance'?'مفيش أيام شغل متحسوبة في الشهر ده لسه.':'أقل من الحد الأدنى للتاسكات المسلّمة ('+(v.n||0)+'). المحور ده مش داخل في السكور، ووزنه اتوزع على الباقي.'}</div>`;
  const it=(t,p,extra)=>`<li><b>${bd(t)}</b> <span class="muted">· ${bd(p||'')}</span>${extra?' · '+extra:''}</li>`;
  if(k==='delivery') return `<div>${v.onTime} من ${v.n} في الميعاد${v.avgLate?` · متوسط التأخير ${v.avgLate} يوم`:''}</div>${(v.late||[]).length?`<ul>${v.late.map(i=>it(i.t,i.pc,`<span style="color:var(--bad)">${i.chargedFor?'اتحسب عليك '+i.late+' يوم ('+esc(i.cause||'')+')':'اتأخرت '+i.late+' يوم'}</span> <span class="muted">(الديدلاين ${kpiDay(i.due)})</span>`)).join('')}</ul>`:''}`;
  if(k==='quality') return `<div>${v.first} من ${v.n} اتقبلت من أول مرة</div>${(v.returned||[]).length?`<ul>${v.returned.map(i=>it(i.t,i.pc,`<span style="color:var(--bad)">↩️ ${i.ret}</span>${(i.why||[]).length?'<div class="muted">'+i.why.map(bd).join('<br>')+'</div>':''}`)).join('')}</ul>`:''}`;
  if(k==='attendance') return `<div>${v.present} من ${v.req} يوم حضور${(v.short||[]).length?` · ${v.short.length} يوم ساعاته ناقصة`:''}</div>${(v.absent||[]).length?`<div class="muted">غياب: ${v.absent.map(kpiDay).join('، ')}</div>`:''}${(v.short||[]).length?`<div class="muted">ساعات ناقصة: ${v.short.map(s=>kpiDay(s.d)+' ('+s.h+' س)').join('، ')}</div>`:''}`;
  return `<div>${v.complete} من ${v.n} كاملة</div>${(v.missing||[]).length?`<ul>${v.missing.map(i=>it(i.t,i.pc,'<span style="color:var(--bad)">'+i.miss.map(m=>KPI_MISS[m]||m).join('، ')+'</span>')).join('')}</ul>`:''}`;
}

/* ----- الـ Heatmap (Scorecards + Executive) ----- */
function viewKpis(){ setTop('Scorecards','KPIs الشهرية للفريق'); $('main').innerHTML=`<div id="kpiBoardBox">${LOADING}</div>`; kpiBoardLoad('kpiBoardBox'); }
async function kpiBoardLoad(id,month){
  const el=$(id); if(!el) return;
  const key='kpiB:'+(month||'');
  if(S.cache[key]) el.innerHTML=kpiBoardHTML(S.cache[key],id);
  if(S.cache[key] && Date.now()-(S.fetched[key]||0)<300000) return;
  try{ const r=await call('kpiBoard',month?{month}:{}); S.cache[key]=r; S.fetched[key]=Date.now(); if($(id)) $(id).innerHTML=kpiBoardHTML(r,id); }
  catch(e){ if($(id)) $(id).innerHTML=id==='kpiExec'?'':`<div class="card err">${esc(e.message)}</div>`; }
}
function kpiBoardHTML(B,id){
  const g=B.green, a=B.amber, col=s=>s==null||s==='pending'?'na':kpiCol(s,g,a);
  const cols=KPI_AX.map(x=>[x[0],x[1],B.w[x[0]]]).concat((B.cols||[]).map(c=>[c.id,c.name,c.w])), DD=B.depts||{};
  const deps={}; B.list.forEach(x=>{ (deps[x.dept]||(deps[x.dept]={name:x.deptName,list:[]})).list.push(x); });
  const avg=L=>{ const v=L.filter(x=>x.total!=null); return v.length?Math.round(v.reduce((s,x)=>s+x.total,0)/v.length):null; };
  const row=(k,s)=>`<div class="kb-row"><span class="l"><bdi>${esc(k[1])}</bdi></span><span class="t"><i class="${col(s)}" style="width:${typeof s==='number'?s:0}%"></i></span><span class="v ${col(s)}">${s==='pending'?'⏳':s==null?'–':s}</span></div>`;
  const load=L=>!L||(!L.max&&!L.projects)?'':L.max?`<div class="kb-f"><span>الحِمل</span><span class="t"><i class="${L.color||''}" style="width:${Math.min(100,L.pct)}%"></i></span><b>${L.pct}%</b><span>${L.projects}/${L.max} مشروع</span></div>`:`<div class="kb-f"><span>الحِمل</span><b>${L.projects}</b><span>مشروع</span></div>`;
  const card=x=>`<div class="kb-card ${col(x.total)}" onclick="kpiOpen('${esc(x.u)}','${esc(B.month)}')"><div class="kb-h"><span class="av" data-u="${esc(x.u)}">${esc(String(x.name||'?').trim().charAt(0))}</span><div class="nm"><b>${esc(x.name)}</b><small>${esc(x.job||'')}</small></div>
      <div class="kb-ring ${col(x.total)}" style="--p:${x.total||0}"><span>${x.total==null?'–':x.total}</span></div></div>
    <div class="kb-ax">${cols.map(k=>row(k,x.axes[k[0]])).filter((h,i)=>i<4||x.axes[cols[i][0]]!==undefined).join('')}</div>${load(x.load)}</div>`;
  S.kpiB=B;
  return `<div class="card flush kpi-board"><div class="chead"><h2>📊 Scorecards</h2>${B.trial?'<span class="pill p-yel">شهر تجريبي</span>':''}${B.locked?'<span class="pill p-out">الشهر اتقفل</span>':''}<span class="spacer"></span>
      ${kpiMonthSel(B,`(m=>kpiBoardLoad('${id}',m))`)}<button class="btn ghost small" onclick="kpiRateOpen('${esc(B.month)}')">⭐ التقييمات</button>${B.admin?`<button class="btn ghost small" onclick="kpiRecalc('${id}','${esc(B.month)}')">إعادة حساب</button>`:''}</div>
    ${B.list.length?`<div class="kb-body">${Object.keys(deps).sort((p,q)=>String(deps[p].name).localeCompare(deps[q].name)).map(d=>{ const D=deps[d], av=avg(D.list);
        return `<div class="kb-dep"><h3>${esc(D.name)}</h3><span class="muted" dir="rtl">${D.list.length} ${D.list.length===1?'موظف':'موظفين'} · المتوسط</span>${av==null?'':`<span class="kb-chip ${col(av)}">${av}</span>`}${DD[d]?`<span class="kpi-dd">⛔ وقّف ناس تانية ${DD[d].days} يوم</span>`:''}</div>
          <div class="kb-grid">${D.list.sort((p,q)=>(q.total==null?-1:q.total)-(p.total==null?-1:p.total)).map(card).join('')}</div>`; }).join('')}</div>`
      :`<div class="empty"><b>لسه مفيش سكور للشهر ده</b>${B.admin?'دوس "إعادة حساب" عشان يتحسب دلوقتي، وبعدها هيتحسب لوحده كل ليلة.':'السكور بيتحسب كل ليلة.'}</div>`}
    ${Object.keys(DD).filter(k=>!deps[k]).map(k=>`<div class="kpi-foot"><span class="kpi-dd">⛔ ${esc(DD[k].name)}: وقّف ناس تانية ${DD[k].days} يوم</span></div>`).join('')}
    <div class="kpi-legend"><span><i style="background:var(--ok)"></i>Green ≥ ${g}</span><span><i style="background:#DC6803"></i>Amber ≥ ${a}</span><span><i style="background:var(--bad)"></i>Red أقل من ${a}</span><span>– مفيش داتا كفاية</span><span>⏳ مستني تقييم</span><span class="spacer"></span><span>${B.computedAt?'اتحسب '+new Date(B.computedAt).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):''} · دوس على أي كارت تشوف التفاصيل</span></div></div>`;
}
async function kpiOpen(un,month){
  try{ const r=await call('kpiUser',{username:un,month}); const B=S.kpiB||{};
    $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div style="max-width:680px;width:100%">${kpiCardHTML({me:r.me,month,trial:B.trial,w:B.w,green:B.green,amber:B.amber},false).replace('<div class="chead">','<div class="chead"><button class="iconbtn" onclick="closeModal()" aria-label="Close" style="order:9">✕</button>')}</div></div>`;
  }catch(e){ toast(e.message); }
}
async function kpiRecalc(id,month){
  toast('بيحسب...');
  try{ const r=await call('kpiRecompute',{month}); toast('اتحسب ✓ ('+r.users+' موظف)'); Object.keys(S.cache).filter(k=>k.indexOf('kpiB:')===0).forEach(k=>{ S.fetched[k]=0; }); S.cache.kpiMine=null; if(id) kpiBoardLoad(id,month===new Date().toISOString().slice(0,7)?undefined:month); }
  catch(e){ alert(e.message); }
}

/* ----- التقييم اليدوي (KPIs إضافية) ----- */
async function kpiRateOpen(month){
  try{ const r=await call('kpiRateList',month?{month}:{}); kpiRateShow(r); }catch(e){ toast(e.message); }
}
function kpiRateShow(r){
  S.kpiRate=r;
  const body=r.list.length?r.list.map(k=>`<div class="kpi-rk"><h3>${esc(k.name)} <small class="muted">· الوزن ${k.w}%${k.rater?' · المقيّم: '+esc(k.rater):''}</small></h3>
      ${k.users.map(x=>`<div class="kpi-rr"><span><b>${esc(x.name)}</b><small class="muted"> · ${esc(x.job||'')}</small></span>
        <input type="number" min="0" max="100" id="kr_${esc(k.id)}_${esc(x.u)}" value="${x.score==null?'':x.score}" placeholder="0–100" aria-label="الدرجة" ${r.locked?'disabled':''}>
        <input id="kn_${esc(k.id)}_${esc(x.u)}" value="${esc(x.note||'')}" placeholder="ملاحظة (اختياري)" dir="auto" ${r.locked?'disabled':''}>
        ${r.locked?'':`<button class="btn small" onclick="kpiRateSave('${esc(k.id)}','${esc(x.u)}')">${x.score==null?'حفظ':'تعديل'}</button>`}</div>`).join('')}</div>`).join('')
    :'<div class="empty"><b>مفيش تقييمات عليك</b>التقييمات بتظهر هنا لو فيه KPI يدوية (Settings → KPIs & Capacity → KPIs إضافية) وانت المقيّم بتاعها، أو رئيس القسم، أو أدمن.</div>';
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:640px;width:100%" dir="rtl">
    <div style="display:flex;gap:10px;align-items:center"><h2 style="flex:1;margin:0">⭐ التقييمات · ${esc(kpiMon(r.month))}</h2>${r.locked?'<span class="pill p-out">الشهر اتقفل</span>':''}<button class="iconbtn" onclick="closeModal()" aria-label="Close">✕</button></div>
    <div class="muted" style="font-size:13px;margin:6px 0 12px">درجة من 100 لكل موظف. تقدر تعدّلها لحد ما الشهر يتقفل. سيبها فاضية واحفظ عشان تشيل التقييم.</div>${body}</div></div>`;
}
async function kpiRateSave(k,u){
  const sc=$('kr_'+k+'_'+u).value, note=$('kn_'+k+'_'+u).value.trim();
  if(sc!=='' && !(Number(sc)>=0 && Number(sc)<=100)) return alert('الدرجة من 0 لـ 100');
  try{ const r=await call('kpiRate',{month:S.kpiRate.month,kpi:k,username:u,score:sc,note}); toast('اتحفظ التقييم ✓'); kpiRateShow(Object.assign({},S.kpiRate,{list:r.list})); S.cache.kpiMine=null; S.kpiDeskAt=0; Object.keys(S.cache).filter(x=>x.indexOf('kpiB:')===0).forEach(x=>{ S.fetched[x]=0; }); }
  catch(e){ alert(e.message); }
}

/* ----- Settings → KPIs & Capacity ----- */
async function setKpiCard(){
  if(!$('setKpi')) return;
  const fail=msg=>{ const b=$('setKpi'); if(b) b.innerHTML=`<div class="card"><h2 style="margin:0 0 6px">📊 KPIs & Capacity</h2><div class="err" dir="rtl">${esc(msg)}</div></div>`; };
  let R; try{ R=await call('kpiCfgGet'); }catch(e){ return fail('مش قادر أجيب إعدادات الـ KPIs: '+e.message); }
  const el=$('setKpi'); if(!el) return;   // الصفحة ممكن تكون اترسمت تاني وإحنا مستنيين
  if(!R||!R.cfg||!Array.isArray(R.cfg.causes)||!Array.isArray(R.cfg.custom)||!R.depts) return fail('الكود اللي على السيرفر أقدم من الموقع. الصق آخر Code.gs في Apps Script واعمل Deploy → Manage deployments → ✏️ → New version، وبعدين اعمل Refresh.');
  const c=R.cfg, n=(id,v,u,attr)=>`<input type="number" id="${id}" value="${esc(v)}" ${attr||'min="0" max="100"'} style="max-width:90px">${u?`<span class="u">${u}</span>`:''}`;
  const set=(lab,sub,inp)=>`<div class="set"><div class="tx"><label>${lab}</label>${sub?`<div>${sub}</div>`:''}</div>${inp}</div>`;
  const jobs=R.jobs.slice(); Object.keys(c.cap).forEach(j=>{ if(jobs.indexOf(j)<0) jobs.push(j); });
  S.kpiSet={R,causes:c.causes.map(x=>Object.assign({},x)),custom:c.custom.map(x=>JSON.parse(JSON.stringify(x)))};
  el.innerHTML=`<div class="card flush"><div class="chead" style="flex-direction:column;align-items:flex-start;gap:2px"><h2>📊 KPIs & Capacity</h2><div class="muted" style="font-size:13px">السكور الشهري لكل موظف من 100. بيتحسب كل ليلة، وفي أول الشهر الشهر اللي فات بيتقفل. أي تغيير هنا بيمشي على الحساب الجاي، والشهور المقفولة مابتتغيّرش</div></div>
    ${set('شهر تجريبي','السكور بيتحسب ويظهر للموظفين والإدارة من غير أي تأثير',`<input type="checkbox" id="kTrial" ${c.trial?'checked':''} style="width:20px;height:20px">`)}
    ${KPI_AX.map(([k,en,ar])=>set(en+' (الوزن)',ar,n('kW_'+k,c.w[k],'%'))).join('')}
    ${set('خصم كل يوم تأخير','Delivery: النقط اللي بتتخصم عن متوسط أيام التأخير (على التاسكات المتأخرة بس)',n('kLate',c.latePen,'نقطة','min="0" max="50" step="0.5"'))}
    ${set('خصم كل يوم ساعاته ناقصة','Attendance: يوم اشتغل فيه أقل من ساعات شيفته بأكتر من فترة السماح',n('kShort',c.shortPen,'نقطة','min="0" max="50" step="0.5"'))}
    ${set('فترة السماح','الأذونات المعتمدة بتتخصم من الساعات المطلوبة',n('kGrace',c.grace,'دقيقة','min="0" max="240"'))}
    ${set('أقل عدد تاسكات','لو الموظف سلّم أقل من كده في الشهر، Delivery و Quality و Compliance يبقوا "مفيش داتا كفاية" ووزنهم يتوزع',n('kMin',c.minTasks,'تاسك','min="1" max="100"'))}
    ${set('متابعة البلوكرز (Account Manager)','البلوكر المفتوح لازم يتحدّث كل كام يوم عشان يتحسب Compliance كامل',n('kAmBlk',c.amBlkDays,'يوم','min="1" max="60"'))}
    ${set('Green من','',n('kGreen',c.green))}${set('Amber من','أقل من كده = Red',n('kAmber',c.amber))}
    <div class="set" style="align-items:flex-start"><div class="tx"><label>أسباب التوقف (⛔) وتتحسب على مين</label><div>التأخير في الأيام اللي التاسك كانت متوقفة فيها. تقدر تغيّر الاسم أو تزوّد سبب جديد.<br>و"مستني حد جوه الشركة" (أي قسم أو موظف) دايماً موجود: بيتحسب على الموظف اللي اتحدد، ولو قسم بس بيتسجل على القسم.</div></div><div id="kCauses" style="flex:1;max-width:460px"></div></div>
    <div class="set" style="align-items:flex-start"><div class="tx"><label>KPIs إضافية</label><div>KPI جديدة ليها وزن وبتدخل في السكور: تقييم يدوي من seat تختاره (أو رئيس القسم)، أو مقياس السيستم بيحسبه لوحده مقابل هدف شهري. تقدر تخليها للكل أو لقسم أو لوظيفة.</div></div><div id="kCustom" style="flex:1;max-width:460px"></div></div>
    <div class="set" style="align-items:flex-start"><div class="tx"><label>Capacity لكل وظيفة</label><div>مشاريع في الشهر: حد أدنى وحد أعلى. نسبة الحِمل = المشاريع ÷ الحد الأعلى. سيبها فاضية لو الوظيفة مالهاش Capacity. مش داخلة في السكور</div></div>
      <div class="kpi-grid3"><b></b><b>أدنى</b><b>أعلى</b>${jobs.map((j,i)=>`<span>${esc(j)}</span><input type="number" min="0" max="500" id="kC0_${i}" data-job="${esc(j)}" value="${c.cap[j]?c.cap[j][0]:''}"><input type="number" min="0" max="500" id="kC1_${i}" value="${c.cap[j]?c.cap[j][1]:''}">`).join('')}</div></div>
    ${set('ألوان الحِمل','Green من … لـ … · Amber من … لحد الـ Green، أو بعد الـ Green لحد … · غير كده Red',`<span class="kpi-grid4">${n('kLgLo',c.load.gLo,'','min="0" max="500"')}${n('kLgHi',c.load.gHi,'','min="0" max="500"')}${n('kLaLo',c.load.aLo,'','min="0" max="500"')}${n('kLaHi',c.load.aHi,'%','min="0" max="500"')}</span>`)}
    <div class="err" id="kErr" style="padding:0 18px"></div>
    <div class="mfoot" style="padding:0 18px 16px"><button class="btn ghost" type="button" onclick="kpiRecalc('',new Date().toISOString().slice(0,7))">احسب الشهر دلوقتي</button><div class="spacer"></div><button class="btn primary" type="button" id="kSave">Save KPI settings</button></div></div>`;
  $('kSave').onclick=async()=>{
    const v=id=>$(id).value, cap={};
    jobs.forEach((j,i)=>{ const lo=v('kC0_'+i), hi=v('kC1_'+i); if(hi!==''||lo!=='') cap[j]=[Number(lo||hi),Number(hi||lo)]; });
    const cfg={trial:$('kTrial').checked,w:{},latePen:v('kLate'),shortPen:v('kShort'),grace:v('kGrace'),minTasks:v('kMin'),amBlkDays:v('kAmBlk'),green:v('kGreen'),amber:v('kAmber'),blk:{},cap,load:{gLo:v('kLgLo'),gHi:v('kLgHi'),aLo:v('kLaLo'),aHi:v('kLaHi')}};
    KPI_AX.forEach(([k])=>{ cfg.w[k]=v('kW_'+k); }); cfg.blk=c.blk;
    kpiCausesRead(); cfg.causes=S.kpiSet.causes.filter(x=>x.label.trim()); cfg.custom=S.kpiSet.custom;
    $('kErr').textContent=''; $('kSave').disabled=true;
    try{ await call('kpiCfgSave',{cfg}); toast('اتحفظت إعدادات الـ KPIs ✓'); S.cache.kpiMine=null; S.blkOpts=null; setKpiCard(); return true; }catch(e){ $('kErr').textContent=e.message; $('kSave').disabled=false; return false; }
  };
  kpiCausesDraw(); kpiCustomDraw();
}
const KPI_HOW={excused:'مايتحسبش',employee:'على صاحب التاسك'};
function kpiCausesRead(){ S.kpiSet.causes.forEach((x,i)=>{ const l=$('kcL_'+i), h=$('kcH_'+i); if(l) x.label=l.value; if(h) x.how=h.value; }); }
function kpiCausesDraw(){
  const el=$('kCauses'); if(!el) return;
  el.innerHTML=`<div class="kpi-cz">${S.kpiSet.causes.map((x,i)=>`<input id="kcL_${i}" value="${esc(x.label)}" dir="auto" aria-label="اسم السبب"><select id="kcH_${i}" aria-label="يتحسب على مين">${Object.keys(KPI_HOW).map(o=>`<option value="${o}"${x.how===o?' selected':''}>${KPI_HOW[o]}</option>`).join('')}</select>${x.id==='client'?'<span title="رد العميل لازم يفضل (بيترفع للبورتال)"></span>':`<button class="iconbtn" type="button" onclick="kpiCauseDel(${i})" aria-label="Delete">✕</button>`}`).join('')}</div>
    <button class="btn ghost small" type="button" onclick="kpiCauseAdd()" style="margin-top:8px">+ سبب جديد</button>`;
}
function kpiCauseAdd(){ kpiCausesRead(); S.kpiSet.causes.push({label:'',how:'excused'}); kpiCausesDraw(); const i=S.kpiSet.causes.length-1; setTimeout(()=>{ const l=$('kcL_'+i); if(l) l.focus(); },30); }
function kpiCauseDel(i){ kpiCausesRead(); S.kpiSet.causes.splice(i,1); kpiCausesDraw(); }
function kpiOnLabel(on){ const R=S.kpiSet.R; if(!on||on.type==='all') return 'للكل'; if(on.type==='dept'){ const d=R.depts.find(x=>x.id===on.v); return 'قسم '+(d?d.name:on.v); } return 'وظيفة '+on.v; }
function kpiRaterLabel(r){ if(r==='head') return 'رئيس القسم'; const s=S.kpiSet.R.seats.find(x=>x.id===r); return s?s.title:r; }
function kpiCustomDraw(){
  const el=$('kCustom'); if(!el) return; const L=S.kpiSet.custom, R=S.kpiSet.R;
  el.innerHTML=(L.length?L.map((k,i)=>`<div class="kpi-cu"><div style="flex:1"><b>${esc(k.name)}</b> <span class="pill">${k.w}%</span><div class="muted" style="font-size:12.5px">${esc(kpiOnLabel(k.on))} · ${k.kind==='manual'?'تقييم يدوي من '+esc(kpiRaterLabel(k.rater)):esc(R.metrics[k.metric]||k.metric)+' · الهدف '+k.target}</div></div>
      <button class="btn ghost small" type="button" onclick="kpiCustomEdit(${i})">تعديل</button><button class="iconbtn" type="button" onclick="kpiCustomDel(${i})" aria-label="Delete">✕</button></div>`).join('')
    :'<div class="muted" style="font-size:13px">مفيش KPIs إضافية لسه.</div>')+`<button class="btn ghost small" type="button" onclick="kpiCustomEdit(-1)" style="margin-top:8px">+ KPI جديدة</button>`;
}
async function kpiCustomDel(i){ if(!confirm('تمسح الـ KPI دي؟ الشهور المقفولة مش هتتأثر.')) return; const old=S.kpiSet.custom.slice(); S.kpiSet.custom.splice(i,1); if(!(await $('kSave').onclick())){ S.kpiSet.custom=old; kpiCustomDraw(); } }
function kpiCustomEdit(i){
  const R=S.kpiSet.R, k=i>=0?S.kpiSet.custom[i]:{name:'',w:10,on:{type:'all',v:''},kind:'manual',rater:'head',metric:'tasks',target:10};
  const on=k.on||{type:'all',v:''};
  kpiModal(i>=0?'تعديل KPI':'+ KPI جديدة',`<label for="kxN">الاسم</label><input id="kxN" value="${esc(k.name)}" dir="auto" placeholder="مثال: التعاون مع الفريق">
    <label for="kxW">الوزن (%)</label><input type="number" id="kxW" min="1" max="100" value="${esc(k.w)}">
    <label for="kxT">تتطبق على</label><select id="kxT" onchange="kpiCxOn()"><option value="all"${on.type==='all'?' selected':''}>كل الموظفين</option><option value="dept"${on.type==='dept'?' selected':''}>قسم معيّن</option><option value="job"${on.type==='job'?' selected':''}>وظيفة معيّنة</option></select>
    <select id="kxD" aria-label="القسم"${on.type==='dept'?'':' hidden'}>${R.depts.map(d=>`<option value="${esc(d.id)}"${on.v===d.id?' selected':''}>${esc(d.name)}</option>`).join('')}</select>
    <select id="kxJ" aria-label="الوظيفة"${on.type==='job'?'':' hidden'}>${R.jobs.map(j=>`<option value="${esc(j)}"${on.v===j?' selected':''}>${esc(j)}</option>`).join('')}</select>
    <label>بتتحسب إزاي</label>
    <label class="check cf-opt"><input type="radio" name="kxK" value="manual"${k.kind!=='metric'?' checked':''} onchange="kpiCxOn()"><span><b>تقييم يدوي</b><small>حد بيدّي درجة من 100 لكل موظف آخر الشهر</small></span></label>
    <label class="check cf-opt"><input type="radio" name="kxK" value="metric"${k.kind==='metric'?' checked':''} onchange="kpiCxOn()"><span><b>مقياس من السيستم</b><small>الرقم الفعلي ÷ الهدف الشهري (أقصى حاجة 100)</small></span></label>
    <div id="kxM1"><label for="kxR">مين اللي بيقيّم</label><select id="kxR"><option value="head"${k.rater==='head'?' selected':''}>رئيس القسم بتاع الموظف</option>${R.seats.map(s=>`<option value="${esc(s.id)}"${k.rater===s.id?' selected':''}>${esc(s.title)}</option>`).join('')}</select></div>
    <div id="kxM2"><label for="kxS">المقياس</label><select id="kxS">${Object.keys(R.metrics).map(m=>`<option value="${m}"${k.metric===m?' selected':''}>${esc(R.metrics[m])}</option>`).join('')}</select>
      <label for="kxG">الهدف الشهري</label><input type="number" id="kxG" min="1" value="${esc(k.target||10)}"></div>`,()=>{
    const name=$('kxN').value.trim(); if(!name) return 'اكتب اسم الـ KPI';
    const type=$('kxT').value, kind=(document.querySelector('input[name="kxK"]:checked')||{}).value||'manual';
    const o={id:k.id,name,w:Number($('kxW').value)||0,on:{type,v:type==='dept'?$('kxD').value:type==='job'?$('kxJ').value:''},kind};
    if(!(o.w>=1&&o.w<=100)) return 'الوزن من 1 لـ 100';
    if(kind==='manual') o.rater=$('kxR').value; else { o.metric=$('kxS').value; o.target=Number($('kxG').value)||0; if(o.target<1) return 'حط الهدف الشهري'; }
    closeModal();
    const old=S.kpiSet.custom.slice(); if(i>=0) S.kpiSet.custom[i]=o; else S.kpiSet.custom.push(o);
    $('kSave').onclick().then(ok=>{ if(!ok){ S.kpiSet.custom=old; kpiCustomDraw(); } });
  });
  kpiCxOn();
}
function kpiCxOn(){
  const t=$('kxT').value, m=(document.querySelector('input[name="kxK"]:checked')||{}).value;
  $('kxD').hidden=t!=='dept'; $('kxJ').hidden=t!=='job'; $('kxM1').hidden=m==='metric'; $('kxM2').hidden=m!=='metric';
}
