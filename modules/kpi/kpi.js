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
  if(!x) return `<div class="card flush kpi-card">${head}<div class="empty"><b>لسه مفيش سكور للشهر ده</b>السكور بيتحسب كل ليلة من التاسكات اللي اتسلّمت والحضور.</div></div>`;
  const ring=x.total==null?'<div class="kpi-total na">—</div>':`<div class="kpi-total ${x.color}"><b>${x.total}</b><span>من 100</span></div>`;
  const rows=KPI_AX.map(([k,en,ar])=>{ const v=x.axes[k]||{}; const c=v.na?'':kpiCol(v.score,g,a);
    return `<details class="kpi-ax"><summary><span class="kpi-an"><b>${en}</b><small>${ar} · ${w[k]||0}%</small></span><span class="kpi-bar"><i class="${c}" style="width:${v.na?0:v.score}%"></i></span><span class="kpi-sc ${c}">${v.na?'<small>مفيش داتا كفاية</small>':v.score}</span></summary><div class="kpi-det" dir="rtl">${kpiDetHTML(k,v)}</div></details>`; }).join('');
  const L=x.load||{};
  const load=L.max?`<div class="kpi-load"><span>الحِمل</span><b class="${L.color||''}">${L.pct}%</b><small>${L.projects} مشروع · الـ Capacity ${L.min===L.max?L.max:L.min+'–'+L.max}</small></div>`:L.projects?`<div class="kpi-load"><span>الحِمل</span><b>${L.projects}</b><small>مشروع · مفيش Capacity للوظيفة دي في الإعدادات</small></div>`:'';
  return `<div class="card flush kpi-card">${head}<div class="kpi-top">${ring}<div class="kpi-axes">${rows}</div></div>${load}
    <div class="muted kpi-foot">${R.computedAt?'اتحسب '+new Date(R.computedAt).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):''} · دوس على أي محور تشوف التفاصيل</div></div>`;
}
function kpiDetHTML(k,v){
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
  const g=B.green, a=B.amber, cell=(s,extra)=>s==null?`<td class="kpi-c na">—</td>`:`<td class="kpi-c ${kpiCol(s,g,a)}"${extra||''}>${s}</td>`;
  const deps={}; B.list.forEach(x=>{ (deps[x.dept]||(deps[x.dept]={name:x.deptName,list:[]})).list.push(x); });
  const avg=L=>{ const v=L.filter(x=>x.total!=null); return v.length?Math.round(v.reduce((s,x)=>s+x.total,0)/v.length):null; };
  S.kpiB=B;
  return `<div class="card flush kpi-board"><div class="chead"><h2>📊 Scorecards</h2>${B.trial?'<span class="pill p-yel">شهر تجريبي</span>':''}${B.locked?'<span class="pill p-out">الشهر اتقفل</span>':''}<span class="spacer"></span>
      ${kpiMonthSel(B,`(m=>kpiBoardLoad('${id}',m))`)}${B.admin?`<button class="btn ghost small" onclick="kpiRecalc('${id}','${esc(B.month)}')">إعادة حساب</button>`:''}</div>
    ${B.list.length?`<div class="tbl-wrap"><table class="kpi-tbl"><tr><th>Employee</th><th>Score</th>${KPI_AX.map(x=>`<th title="${esc(x[2])}">${x[1]} <small>${B.w[x[0]]}%</small></th>`).join('')}<th>Load</th></tr>
      ${Object.keys(deps).sort((p,q)=>String(deps[p].name).localeCompare(deps[q].name)).map(d=>{ const D=deps[d]; const av=avg(D.list);
        return `<tr class="kpi-dep"><td colspan="7"><b>${esc(D.name)}</b> <span class="muted">· ${D.list.length} · متوسط ${av==null?'—':av}</span></td></tr>`+
          D.list.sort((p,q)=>(q.total==null?-1:q.total)-(p.total==null?-1:p.total)).map(x=>`<tr class="kpi-r" onclick="kpiOpen('${esc(x.u)}','${esc(B.month)}')"><td><b>${esc(x.name)}</b><div class="sub2">${esc(x.job||'')}${x.am?' · AM':''}</div></td>${cell(x.total,' style="font-weight:700"')}${KPI_AX.map(k=>cell(x.axes[k[0]])).join('')}
            <td class="kpi-c ${x.load&&x.load.color||'na'}">${x.load&&x.load.max?x.load.pct+'%<div class="sub2">'+x.load.projects+' / '+x.load.max+'</div>':(x.load&&x.load.projects?x.load.projects+' مشروع':'—')}</td></tr>`).join(''); }).join('')}
    </table></div>`:`<div class="empty"><b>لسه مفيش سكور للشهر ده</b>${B.admin?'دوس "إعادة حساب" عشان يتحسب دلوقتي، وبعدها هيتحسب لوحده كل ليلة.':'السكور بيتحسب كل ليلة.'}</div>`}
    <div class="muted kpi-foot">${B.computedAt?'اتحسب '+new Date(B.computedAt).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})+' · ':''}Green ≥ ${g} · Amber ≥ ${a} · دوس على أي موظف تشوف التفاصيل</div></div>`;
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

/* ----- Settings → KPIs & Capacity ----- */
async function setKpiCard(){
  const el=$('setKpi'); if(!el) return;
  let R; try{ R=await call('kpiCfgGet'); }catch(e){ return; }
  const c=R.cfg, n=(id,v,u,attr)=>`<input type="number" id="${id}" value="${esc(v)}" ${attr||'min="0" max="100"'} style="max-width:90px">${u?`<span class="u">${u}</span>`:''}`;
  const set=(lab,sub,inp)=>`<div class="set"><div class="tx"><label>${lab}</label>${sub?`<div>${sub}</div>`:''}</div>${inp}</div>`;
  const jobs=R.jobs.slice(); Object.keys(c.cap).forEach(j=>{ if(jobs.indexOf(j)<0) jobs.push(j); });
  const BL={excused:'مايتحسبش',seat:'على الـ seat المسؤول',employee:'على صاحب التاسك'};
  el.innerHTML=`<div class="card flush"><div class="chead" style="flex-direction:column;align-items:flex-start;gap:2px"><h2>📊 KPIs & Capacity</h2><div class="muted" style="font-size:13px">السكور الشهري لكل موظف من 100. بيتحسب كل ليلة، وفي أول الشهر الشهر اللي فات بيتقفل. أي تغيير هنا بيمشي على الحساب الجاي، والشهور المقفولة مابتتغيّرش</div></div>
    ${set('شهر تجريبي','السكور بيتحسب ويظهر للموظفين والإدارة من غير أي تأثير',`<input type="checkbox" id="kTrial" ${c.trial?'checked':''} style="width:20px;height:20px">`)}
    ${KPI_AX.map(([k,en,ar])=>set(en+' (الوزن)',ar,n('kW_'+k,c.w[k],'%'))).join('')}
    ${set('خصم كل يوم تأخير','Delivery: النقط اللي بتتخصم عن متوسط أيام التأخير (على التاسكات المتأخرة بس)',n('kLate',c.latePen,'نقطة','min="0" max="50" step="0.5"'))}
    ${set('خصم كل يوم ساعاته ناقصة','Attendance: يوم اشتغل فيه أقل من ساعات شيفته بأكتر من فترة السماح',n('kShort',c.shortPen,'نقطة','min="0" max="50" step="0.5"'))}
    ${set('فترة السماح','الأذونات المعتمدة بتتخصم من الساعات المطلوبة',n('kGrace',c.grace,'دقيقة','min="0" max="240"'))}
    ${set('أقل عدد تاسكات','لو الموظف سلّم أقل من كده في الشهر، Delivery و Quality و Compliance يبقوا "مفيش داتا كفاية" ووزنهم يتوزع',n('kMin',c.minTasks,'تاسك','min="1" max="100"'))}
    ${set('متابعة البلوكرز (Account Manager)','البلوكر المفتوح لازم يتحدّث كل كام يوم عشان يتحسب Compliance كامل',n('kAmBlk',c.amBlkDays,'يوم','min="1" max="60"'))}
    ${set('Green من','',n('kGreen',c.green))}${set('Amber من','أقل من كده = Red',n('kAmber',c.amber))}
    <div class="set" style="align-items:flex-start"><div class="tx"><label>التوقفات (⛔) تتحسب على مين</label><div>التأخير في الأيام اللي التاسك كانت متوقفة فيها</div></div><div class="kpi-grid2">${Object.keys(R.causes).map(k=>`<span>${esc(R.causes[k])}</span><select id="kB_${k}">${Object.keys(BL).map(o=>`<option value="${o}"${c.blk[k]===o?' selected':''}>${BL[o]}</option>`).join('')}</select>`).join('')}</div></div>
    <div class="set" style="align-items:flex-start"><div class="tx"><label>Capacity لكل وظيفة</label><div>مشاريع في الشهر: حد أدنى وحد أعلى. نسبة الحِمل = المشاريع ÷ الحد الأعلى. سيبها فاضية لو الوظيفة مالهاش Capacity. مش داخلة في السكور</div></div>
      <div class="kpi-grid3"><b></b><b>أدنى</b><b>أعلى</b>${jobs.map((j,i)=>`<span>${esc(j)}</span><input type="number" min="0" max="500" id="kC0_${i}" data-job="${esc(j)}" value="${c.cap[j]?c.cap[j][0]:''}"><input type="number" min="0" max="500" id="kC1_${i}" value="${c.cap[j]?c.cap[j][1]:''}">`).join('')}</div></div>
    ${set('ألوان الحِمل','Green من … لـ … · Amber من … لحد الـ Green، أو بعد الـ Green لحد … · غير كده Red',`<span class="kpi-grid4">${n('kLgLo',c.load.gLo,'','min="0" max="500"')}${n('kLgHi',c.load.gHi,'','min="0" max="500"')}${n('kLaLo',c.load.aLo,'','min="0" max="500"')}${n('kLaHi',c.load.aHi,'%','min="0" max="500"')}</span>`)}
    <div class="err" id="kErr" style="padding:0 18px"></div>
    <div class="mfoot" style="padding:0 18px 16px"><button class="btn ghost" type="button" onclick="kpiRecalc('',new Date().toISOString().slice(0,7))">احسب الشهر دلوقتي</button><div class="spacer"></div><button class="btn primary" type="button" id="kSave">Save KPI settings</button></div></div>`;
  $('kSave').onclick=async()=>{
    const v=id=>$(id).value, cap={};
    jobs.forEach((j,i)=>{ const lo=v('kC0_'+i), hi=v('kC1_'+i); if(hi!==''||lo!=='') cap[j]=[Number(lo||hi),Number(hi||lo)]; });
    const cfg={trial:$('kTrial').checked,w:{},latePen:v('kLate'),shortPen:v('kShort'),grace:v('kGrace'),minTasks:v('kMin'),amBlkDays:v('kAmBlk'),green:v('kGreen'),amber:v('kAmber'),blk:{},cap,load:{gLo:v('kLgLo'),gHi:v('kLgHi'),aLo:v('kLaLo'),aHi:v('kLaHi')}};
    KPI_AX.forEach(([k])=>{ cfg.w[k]=v('kW_'+k); }); Object.keys(R.causes).forEach(k=>{ cfg.blk[k]=v('kB_'+k); });
    $('kErr').textContent=''; $('kSave').disabled=true;
    try{ await call('kpiCfgSave',{cfg}); toast('اتحفظت إعدادات الـ KPIs ✓'); S.cache.kpiMine=null; setKpiCard(); }catch(e){ $('kErr').textContent=e.message; $('kSave').disabled=false; }
  };
}
