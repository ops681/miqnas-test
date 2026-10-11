/* ============ الماليات: العقود والتحصيل ============
   المسؤول عن الماليات (صلاحية Finance) + الـ CEO + الفاوندرز بيشوفوا ويعدّلوا كل حاجة.
   الأكاونت مانجر بيشوف عقود عملاءه وحالة الدفعات بس.
   الفواتير الرسمية بتطلع من برنامج المحاسبة، وهنا بيتسجل رقمها. كل الإعدادات من تاب Settings. */
S.fin={tab:'contracts',f:'all',q:''};
function canFinance(){ return can('finance.manage') || (S.user&&S.user.founder) || can('projects.manage_own'); }
function sar(n,cur){ const v=Number(n)||0; return v.toLocaleString('en-US',{maximumFractionDigits:2})+' '+(cur||(S.cache.fin&&S.cache.fin.settings.currency)||'SAR'); }
const FC_ST={draft:['Draft','p-out'],sent:['Sent','p-yel'],signed:['Signed','p-in'],expired:['Expired','p-absent'],cancelled:['Cancelled','p-out']};
const FI_ST={due:['Due','p-yel'],overdue:['Overdue','p-bad'],paid:['Paid','p-in']};
function viewFinance(opts){
  opts=opts||{};
  if(opts.tab) S.fin.tab=opts.tab;
  setTop('Finance','Contracts and collections');
  if(S.fin.tab==='dash') return finLoadDash();
  swr('fin','finList',{},r=>{ if(S.fin.tab==='settings') finRenderSettings(r); else finRender(r); if(opts.id){ const id=opts.id; opts.id=''; finOpen(id); } });
}
function finTabs(){
  const r=S.cache.fin||{};
  const tabs=[['contracts','Contracts'],['dash','Collections']]; if(r.canEdit) tabs.push(['settings','Settings']);
  return `<div class="chips kb-tabs" role="tablist">${tabs.map(t=>`<button role="tab" aria-selected="${S.fin.tab===t[0]}" class="${S.fin.tab===t[0]?'on':''}" onclick="S.fin.tab='${t[0]}';viewFinance()">${t[1]}</button>`).join('')}</div>`;
}

/* ----- العقود ----- */
function finRender(r){
  S.cache.fin=r;
  setTop('Finance','Contracts and collections',r.canEdit?`<button class="btn primary" onclick="finForm()">+ New contract</button>`:'');
  const q=S.fin.q.trim().toLowerCase(), F={all:()=>true,overdue:c=>c.overdue>0,unsigned:c=>c.status==='draft'||c.status==='sent',expiring:c=>c.expiring,open:c=>c.remaining>0&&c.status!=='cancelled'};
  const L=r.contracts.filter(F[S.fin.f]||F.all).filter(c=>!q||[c.client,c.service,c.amName,c.partnerName].some(v=>String(v||'').toLowerCase().indexOf(q)>=0));
  const cnt=k=>r.contracts.filter(F[k]).length;
  const tot=k=>r.contracts.filter(c=>c.status!=='cancelled').reduce((a,c)=>a+c[k],0);
  $('main').innerHTML=`${finTabs()}
    <div class="grid kpis fin-k">
      <div class="kpi"><span>Contracts value</span><b>${sar(tot('total'))}</b><small>${r.contracts.filter(c=>c.status!=='cancelled').length} contracts, incl. VAT</small></div>
      <div class="kpi"><span>Collected</span><b style="color:var(--ok)">${sar(tot('paid'))}</b><small>All time</small></div>
      <div class="kpi"><span>Remaining</span><b>${sar(tot('remaining'))}</b><small>Still to collect</small></div>
      <div class="kpi"><span>Overdue</span><b style="color:${tot('overdue')?'var(--bad)':'inherit'}">${sar(tot('overdue'))}</b><small>${cnt('overdue')} contracts</small></div>
    </div>
    <div class="kb-bar"><label class="kb-search">${ico('chart',16)}<input id="fnQ" placeholder="Search client, service, account manager…" value="${esc(S.fin.q)}" oninput="S.fin.q=this.value;finRender(S.cache.fin);const i=$('fnQ');i.focus();i.setSelectionRange(i.value.length,i.value.length)" aria-label="Search contracts"></label>
      <div class="chips">${[['all','All'],['open','To collect'],['overdue','Overdue'],['unsigned','Not signed'],['expiring','Ending soon']].map(x=>`<button class="${S.fin.f===x[0]?'on':''}" onclick="S.fin.f='${x[0]}';finRender(S.cache.fin)">${x[1]} <em class="muted">${cnt(x[0])}</em></button>`).join('')}</div></div>
    ${L.length?`<div class="tbl-wrap"><table style="min-width:900px"><tr><th>Client</th><th>Service</th><th>Total</th><th>Paid</th><th>Remaining</th><th>Next payment</th><th>Status</th><th>Account Manager</th></tr>
      ${L.map(c=>`<tr class="clk" onclick="finOpen('${esc(c.id)}')"><td><b>${esc(c.client)}</b>${c.partnerName?`<div class="sub2">${esc(c.partnerName)}</div>`:''}</td><td>${esc(c.service||'—')}</td><td>${sar(c.total)}</td><td>${sar(c.paid)}</td>
        <td>${c.overdue?`<b style="color:var(--bad)">${sar(c.remaining)}</b><div class="sub2" style="color:var(--bad)">${sar(c.overdue)} overdue</div>`:sar(c.remaining)}</td>
        <td>${c.next?`${fmtD(c.next.due)}<div class="sub2">${sar(c.next.amount)}</div>`:'—'}</td>
        <td><span class="pill ${FC_ST[c.status][1]}">${FC_ST[c.status][0]}</span>${c.expiring?' <span class="pill p-yel">Ends '+fmtD(c.end)+'</span>':''}</td><td>${bd(c.amName||'—')}</td></tr>`).join('')}</table></div>`
      :`<div class="card empty"><b>${r.contracts.length?'Nothing here':'No contracts yet'}</b>${r.canEdit&&!r.contracts.length?'Add the first one with “+ New contract”.':''}</div>`}
    <p class="muted" style="font-size:12.5px;margin-top:12px">Official tax invoices come from your accounting software. Write the invoice number on each payment here.</p>`;
}
function finOpen(id){
  const r=S.cache.fin, c=r&&r.contracts.find(x=>x.id===id); if(!c){ toast('العقد ده مش موجود'); return; }
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:820px">
    <div class="kb-ch"><span class="pill ${FC_ST[c.status][1]}">${FC_ST[c.status][0]}</span>${c.partnerName?`<span class="pill p-out">${esc(c.partnerName)}</span>`:''}${c.project?`<button class="btn ghost small" onclick="closeModal();go('projects');viewProject('${esc(c.project)}')">Project ${esc(c.project)} →</button>`:''}</div>
    <h2 style="margin:8px 0 2px">${esc(c.client)}</h2>
    <div class="muted" style="font-size:13px">${esc(c.service||'')}${c.service?' · ':''}${fmtD(c.start)}${c.end?' → '+fmtD(c.end):''} · AM ${bd(c.amName||'—')}${c.file?` · <a href="${esc(c.file)}" target="_blank" rel="noopener">Signed contract ↗</a>`:''}</div>
    <div class="grid kpis" style="margin:14px 0">
      <div class="kpi"><span>Value</span><b style="font-size:20px">${sar(c.value)}</b><small>+ VAT ${c.vat}% = ${sar(c.total)}</small></div>
      <div class="kpi"><span>Paid</span><b style="font-size:20px;color:var(--ok)">${sar(c.paid)}</b></div>
      <div class="kpi"><span>Remaining</span><b style="font-size:20px;color:${c.overdue?'var(--bad)':'inherit'}">${sar(c.remaining)}</b><small>${c.overdue?sar(c.overdue)+' overdue':''}</small></div>
      ${c.partnerFee?`<div class="kpi"><span>Partner fee</span><b style="font-size:20px">${sar(c.partnerFee)}</b><small>${esc(c.partnerName)}</small></div>`:''}
    </div>
    <div class="tbl-wrap"><table><tr><th>#</th><th>Payment</th><th>Amount</th><th>Due</th><th>Status</th><th>Invoice</th>${r.canEdit?'<th></th>':''}</tr>
      ${c.installments.map(i=>`<tr><td>${i.seq}</td><td>${esc(i.label)}${i.note?`<div class="sub2">${esc(i.note)}</div>`:''}</td><td>${sar(i.amount)}</td><td>${fmtD(i.due)}</td>
        <td><span class="pill ${FI_ST[i.status][1]}">${FI_ST[i.status][0]}</span>${i.paidAt?`<div class="sub2">${fmtD(i.paidAt)}${i.method?' · '+esc(i.method):''}</div>`:''}</td><td>${esc(i.invoice||'—')}</td>
        ${r.canEdit?`<td style="white-space:nowrap">${i.status==='paid'?`<button class="btn ghost small" onclick="finInst('unpay','${esc(i.id)}')">Undo</button>`:`<button class="btn small primary" onclick="finPay('${esc(c.id)}','${esc(i.id)}')">Mark paid</button> <button class="btn ghost small" onclick="finInstEdit('${esc(c.id)}','${esc(i.id)}')">Edit</button>`}</td>`:''}</tr>`).join('')}</table></div>
    ${c.notes?`<div class="kb-tips" dir="auto">${esc(c.notes)}</div>`:''}
    <div class="mfoot">${r.canEdit?`<button class="btn" onclick="finForm('${esc(c.id)}')">Edit contract</button><button class="btn ghost" onclick="finInstEdit('${esc(c.id)}','')">+ Add payment</button>`:''}<div class="spacer"></div><button class="btn primary" onclick="closeModal()">Close</button></div></div></div>`;
}
function finPay(cid,iid){
  const r=S.cache.fin, c=r.contracts.find(x=>x.id===cid), i=c.installments.find(x=>x.id===iid);
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:480px">
    <h2 style="margin:0 0 4px">Mark as paid</h2><div class="muted" style="font-size:13px;margin-bottom:12px">${esc(c.client)} · ${esc(i.label)} · ${sar(i.amount)}</div>
    <div class="pfgrid"><div><label>Paid on</label><input type="date" id="fpD" value="${r.today}"></div><div><label>Method</label><select id="fpM">${r.methods.map(m=>`<option>${esc(m)}</option>`).join('')}</select></div>
      <div><label>Invoice number</label><input id="fpI" dir="ltr" placeholder="INV-1001"></div><div><label>Note</label><input id="fpN" dir="auto"></div></div>
    <div class="err" id="fpE"></div><div class="mfoot"><button class="btn ghost" onclick="finOpen('${esc(cid)}')">Back</button><div class="spacer"></div><button class="btn primary" id="fpB">Save</button></div></div></div>`;
  $('fpB').onclick=async()=>{ try{ const out=await call('finInst',{act:'pay',id:iid,paidAt:$('fpD').value,method:$('fpM').value,invoice:$('fpI').value,note:$('fpN').value}); S.cache.fin=out; toast('اتسجل الدفع ✓'); finOpen(cid); finRefreshList(); }catch(e){ $('fpE').textContent=e.message; } };
}
function finInstEdit(cid,iid){
  const r=S.cache.fin, c=r.contracts.find(x=>x.id===cid), i=iid?c.installments.find(x=>x.id===iid):{label:'دفعة إضافية',amount:'',due:r.today};
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:480px">
    <h2 style="margin:0 0 12px">${iid?'Edit payment':'Add payment'}</h2>
    <div class="pfgrid"><div style="grid-column:1/-1"><label>Name</label><input id="fiL" dir="auto" value="${esc(i.label)}"></div><div><label>Amount (incl. VAT)</label><input id="fiA" type="number" min="0" step="0.01" value="${esc(i.amount)}"></div><div><label>Due</label><input type="date" id="fiD" value="${esc(i.due)}"></div></div>
    <div class="err" id="fiE"></div><div class="mfoot">${iid?`<button class="btn ghost danger" id="fiX">Remove</button>`:''}<button class="btn ghost" onclick="finOpen('${esc(cid)}')">Back</button><div class="spacer"></div><button class="btn primary" id="fiB">Save</button></div></div></div>`;
  $('fiB').onclick=async()=>{ try{ const out=await call('finInst',iid?{act:'edit',id:iid,label:$('fiL').value,amount:$('fiA').value,due:$('fiD').value}:{act:'add',contract:cid,label:$('fiL').value,amount:$('fiA').value,due:$('fiD').value}); S.cache.fin=out; toast('اتحفظ ✓'); finOpen(cid); finRefreshList(); }catch(e){ $('fiE').textContent=e.message; } };
  if(iid) $('fiX').onclick=async()=>{ if(!confirm('تشيل الدفعة دي؟')) return; try{ const out=await call('finInst',{act:'cancel',id:iid}); S.cache.fin=out; finOpen(cid); finRefreshList(); }catch(e){ $('fiE').textContent=e.message; } };
}
async function finInst(act,id){ try{ const out=await call('finInst',{act,id}); S.cache.fin=out; const c=out.contracts.find(x=>x.installments.some(i=>i.id===id)); if(c) finOpen(c.id); finRefreshList(); }catch(e){ alert(e.message); } }
function finRefreshList(){ if(S.view==='finance'&&S.fin.tab==='contracts'&&!$('modalRoot').innerHTML) finRender(S.cache.fin); }
function finForm(id){
  const r=S.cache.fin, st=r.settings;
  const c=id?r.contracts.find(x=>x.id===id):{client:'',project:'',service:'',value:'',vat:st.vatPct,start:r.today,end:'',template:(st.templates[0]||{}).id,status:'draft',file:'',am:'',partner:'',notes:'',partnerFee:''};
  const paid=id&&c.paid>0;
  $('modalRoot').innerHTML=`<div class="modal"><div class="card" style="max-width:760px">
    <h2 style="margin:0 0 12px">${id?'Edit contract':'New contract'}</h2>
    <div class="pfgrid">
      <div><label>Project</label><select id="fcP"><option value="">No project</option>${(r.projects||[]).map(p=>`<option value="${esc(p.id)}"${p.id===c.project?' selected':''}>${esc(p.client)} · ${esc(p.id)}</option>`).join('')}</select></div>
      <div><label>Client *</label><input id="fcC" dir="auto" value="${esc(c.client)}"></div>
      <div><label>Service</label><select id="fcS"><option value="">—</option>${st.services.map(s=>`<option${s===c.service?' selected':''}>${esc(s)}</option>`).join('')}</select></div>
      <div><label>Status</label><select id="fcSt">${r.statuses.map(s=>`<option value="${s}"${s===c.status?' selected':''}>${FC_ST[s][0]}</option>`).join('')}</select></div>
      <div><label>Value before VAT (${esc(st.currency)}) *</label><input id="fcV" type="number" min="0" step="0.01" value="${esc(c.value)}"${paid?' disabled title="Payments already recorded"':''}></div>
      <div><label>VAT %</label><input id="fcT" type="number" min="0" max="100" step="0.5" value="${esc(c.vat)}"${paid?' disabled':''}></div>
      <div><label>Start</label><input type="date" id="fcB" value="${esc(c.start)}"></div>
      <div><label>End</label><input type="date" id="fcE" value="${esc(c.end)}"></div>
      <div><label>Payment plan</label><select id="fcTp"${paid?' disabled':''}>${st.templates.map(t=>`<option value="${esc(t.id)}"${t.id===c.template?' selected':''}>${esc(t.name)}</option>`).join('')}</select><div class="muted" style="font-size:12px;margin-top:4px">${paid?'Payments recorded: edit the remaining ones from the contract.':'Payments are created from this plan.'}</div></div>
      <div><label>Account Manager</label><select id="fcA"><option value="">—</option>${(r.ams||[]).map(a=>`<option value="${esc(a.u)}"${a.u===c.am?' selected':''}>${esc(a.name)}</option>`).join('')}</select></div>
      <div><label>Partner</label><select id="fcPt"><option value="">—</option>${(r.partners||[]).map(p=>`<option value="${esc(p.id)}"${p.id===c.partner?' selected':''}>${esc(p.name)}</option>`).join('')}</select></div>
      <div><label>Partner fee (${esc(st.currency)})</label><input id="fcF" type="number" min="0" step="0.01" value="${esc(id?c.partnerFee:'')}" placeholder="Auto from partner settings"></div>
      <div style="grid-column:1/-1"><label>Signed contract link</label><input id="fcL" dir="ltr" placeholder="https://drive.google.com/…" value="${esc(c.file)}"></div>
      <div style="grid-column:1/-1"><label>Notes</label><textarea id="fcN" rows="2" dir="auto">${esc(c.notes)}</textarea></div>
    </div><div class="err" id="fcErr"></div>
    <div class="mfoot"><button class="btn ghost" onclick="${id?`finOpen('${esc(id)}')`:'closeModal()'}">Cancel</button><div class="spacer"></div><button class="btn primary" id="fcSave">${id?'Save':'Create contract'}</button></div></div></div>`;
  $('fcP').onchange=()=>{ const p=(r.projects||[]).find(x=>x.id===$('fcP').value); if(!p) return; if(!$('fcC').value) $('fcC').value=p.client; if(p.am&&!$('fcA').value) $('fcA').value=p.am; if(p.partner) $('fcPt').value=p.partner; if(p.start&&!id) $('fcB').value=p.start; pkSyncAll&&pkSyncAll(); };
  pickify($('fcA'), (r.ams||[]).map(a=>({u:a.u,name:a.name,job:'Account Manager'})));
  $('fcSave').onclick=async()=>{ $('fcSave').disabled=true;
    const d={id:id||'',project:$('fcP').value,client:$('fcC').value,service:$('fcS').value,status:$('fcSt').value,value:$('fcV').value,vat:$('fcT').value,start:$('fcB').value,end:$('fcE').value,template:$('fcTp').value,am:$('fcA').value,partner:$('fcPt').value,partnerFee:$('fcF').value,file:$('fcL').value,notes:$('fcN').value};
    try{ const out=await call('finSave',{contract:d}); S.cache.fin=out; toast(id?'اتحفظ ✓':'اتعمل العقد ✓'); const c2=id?out.contracts.find(x=>x.id===id):out.contracts.slice().sort((a,b)=>b.id<a.id?-1:1)[0]; if(c2) finOpen(c2.id); else closeModal(); finRefreshList(); }
    catch(e){ $('fcErr').textContent=e.message; $('fcSave').disabled=false; } };
}

/* ----- داشبورد التحصيل ----- */
function finLoadDash(){
  if(!S.cache.fin) call('finList').then(r=>{ S.cache.fin=r; }).catch(()=>{});
  swr('finDash','finDash',{month:S.fin.month||''},finRenderDash);
}
function finRenderDash(D){
  S.cache.finDash=D;
  setTop('Finance','Contracts and collections','');
  const k=D.kpis, months=[]; { const n=new Date(); for(let i=-2;i<12;i++){ const d=new Date(n.getFullYear(),n.getMonth()-i,15); months.push(d.toISOString().slice(0,7)); } }
  const cur=D.currency;
  $('main').innerHTML=`${finTabs()}
    <div class="kb-bar"><select style="max-width:240px" onchange="S.fin.month=this.value;delete S.cache.finDash;finLoadDash()" aria-label="Month">${months.map(m=>`<option value="${m}"${m===D.month?' selected':''}>${new Date(m+'-15').toLocaleDateString('en-GB',{month:'long',year:'numeric'})}</option>`).join('')}</select></div>
    <div class="grid kpis fin-k">
      <div class="kpi"><span>Expected this month</span><b>${sar(k.expected,cur)}</b><small>Payments due in ${esc(D.monthName)}</small></div>
      <div class="kpi"><span>Collected</span><b style="color:var(--ok)">${sar(k.collected,cur)}</b><small>${k.rate===null?'':k.rate+'% of what was due'}</small></div>
      <div class="kpi"><span>Overdue now</span><b style="color:${k.overdue?'var(--bad)':'inherit'}">${sar(k.overdue,cur)}</b><small>${k.overdueCount} payments</small></div>
      <div class="kpi"><span>Still to collect</span><b>${sar(k.outstanding,cur)}</b><small>All contracts</small></div>
      <div class="kpi"><span>Signed this month</span><b>${sar(k.signed,cur)}</b><small>New contracts value</small></div>
    </div>
    <div class="two">
      <div class="card"><h2 style="font-size:15px;margin:0 0 10px">Collected by account manager</h2>${finBars(D.byAm,cur)}<h2 style="font-size:15px;margin:16px 0 10px">Overdue by account manager</h2>${finBars(D.overdueByAm,cur,'var(--bad)')}</div>
      <div class="card"><h2 style="font-size:15px;margin:0 0 10px">Collected by partner</h2>${finBars(D.byPartner,cur)}${Object.keys(D.partnerFees).length?`<h2 style="font-size:15px;margin:16px 0 10px">Partner fees (contracts started this month)</h2>${finBars(D.partnerFees,cur,'var(--warn)')}`:''}</div>
      <div class="card"><h2 style="font-size:15px;margin:0 0 10px">Top clients this month</h2>${finBars(D.byClient,cur)}</div>
      <div class="card flush"><div class="chead"><h2>Overdue payments</h2>${D.overdueList.length?`<span class="pill p-bad">${D.overdueList.length}</span>`:''}</div>
        ${D.overdueList.length?D.overdueList.map(x=>`<button class="al" onclick="S.fin.tab='contracts';go('finance',{id:'${esc(x.contract)}'})"><span class="tx"><b>${esc(x.client)} · ${sar(x.amount,cur)}</b><span>${esc(x.label)} · due ${fmtD(x.due)} · ${bd(x.am||'—')}</span></span><span class="pill p-bad">${x.days} days late</span></button>`).join(''):'<div class="empty"><b>Nothing overdue</b>All payments are on time.</div>'}</div>
      ${D.expiring.length?`<div class="card flush"><div class="chead"><h2>Contracts ending soon</h2></div>${D.expiring.map(x=>`<button class="al" onclick="S.fin.tab='contracts';go('finance',{id:'${esc(x.id)}'})"><span class="tx"><b>${esc(x.client)}</b><span>Ends ${fmtD(x.end)}</span></span><span class="pill p-yel">${x.days} days</span></button>`).join('')}</div>`:''}
      ${D.noContract.length?`<div class="card flush"><div class="chead"><h2>Active projects without a signed contract</h2><span class="pill p-yel">${D.noContract.length}</span></div>${D.noContract.map(x=>`<button class="al" onclick="go('projects');viewProject('${esc(x.id)}')"><span class="tx"><b>${esc(x.client)}</b><span>${esc(x.id)} · ${x.contract?'contract '+x.contract:'no contract yet'}</span></span></button>`).join('')}</div>`:''}
    </div>`;
}
function finBars(o,cur,color){
  const keys=Object.keys(o||{}).sort((a,b)=>o[b]-o[a]).slice(0,10);
  if(!keys.length) return '<div class="muted" style="font-size:13px">Nothing yet.</div>';
  const mx=Math.max(...keys.map(k=>o[k]),1);
  return `<div class="kb-bars">${keys.map(k=>`<div class="kb-br"><span dir="auto">${bd(k)}</span><div class="kb-bt"><i style="width:${o[k]/mx*100}%${color?';background:'+color:''}"></i></div><b style="white-space:nowrap;font-size:12px">${sar(o[k],cur)}</b></div>`).join('')}</div>`;
}

/* ----- الإعدادات (من الصفحة) ----- */
function finRenderSettings(r){
  S.cache.fin=r;
  if(!r.canEdit){ S.fin.tab='contracts'; return finRender(r); }
  const st=r.settings;
  S.finTpl=JSON.parse(JSON.stringify(st.templates));
  setTop('Finance','Contracts and collections','');
  $('main').innerHTML=`${finTabs()}<div class="card" style="max-width:860px">
    <h2 style="margin:0 0 4px">Finance settings</h2><div class="muted" style="font-size:13px;margin-bottom:14px">Used for new contracts. Old contracts keep their payments.</div>
    <div class="pfgrid"><div><label>VAT %</label><input id="fsV" type="number" min="0" max="100" step="0.5" value="${st.vatPct}"></div><div><label>Currency</label><input id="fsC" dir="ltr" value="${esc(st.currency)}" maxlength="6"></div><div><label>Warn before a contract ends (days)</label><input id="fsX" type="number" min="1" max="180" value="${st.expiryDays}"></div></div>
    <label style="margin-top:12px;display:block">Services (one per line)</label><textarea id="fsS" rows="5" dir="auto">${esc(st.services.join('\n'))}</textarea>
    <h3 style="margin:18px 0 8px">Payment plans</h3><div id="fsT"></div>
    <div class="row" style="gap:8px;margin-top:8px"><button class="btn ghost small" onclick="S.finTpl.push({name:'',kind:'parts',parts:[{label:'',pct:100,when:'start',days:0}]});finTplDraw()">+ Plan with parts</button><button class="btn ghost small" onclick="S.finTpl.push({name:'',kind:'monthly',months:12});finTplDraw()">+ Monthly plan</button></div>
    <div class="err" id="fsE"></div><div class="mfoot"><div class="spacer"></div><button class="btn primary" id="fsB">Save</button></div></div>`;
  finTplDraw();
  $('fsB').onclick=async()=>{ finTplRead(); try{ const s=await call('finSettingsSave',{settings:{vatPct:$('fsV').value,currency:$('fsC').value,expiryDays:$('fsX').value,services:$('fsS').value.split('\n'),templates:S.finTpl}}); r.settings=s; toast('اتحفظت ✓'); finRenderSettings(r); }catch(e){ $('fsE').textContent=e.message; } };
}
function finTplRead(){
  document.querySelectorAll('.fs-t').forEach(el=>{ const t=S.finTpl[+el.dataset.i]; if(!t) return; t.name=el.querySelector('.fs-n').value;
    if(t.kind==='monthly') t.months=el.querySelector('.fs-m').value;
    else t.parts=[...el.querySelectorAll('.fs-p')].map(p=>({label:p.querySelector('.fs-pl').value,pct:p.querySelector('.fs-pp').value,when:p.querySelector('.fs-pw').value,days:p.querySelector('.fs-pd').value})); });
}
function finTplDraw(){
  $('fsT').innerHTML=S.finTpl.map((t,i)=>`<div class="fs-t card" data-i="${i}" style="margin:0 0 10px;padding:12px">
    <div class="row" style="gap:8px;align-items:center"><input class="fs-n" dir="auto" placeholder="Plan name" value="${esc(t.name)}" style="flex:1"><span class="pill p-out">${t.kind==='monthly'?'Monthly':'Parts'}</span><button class="iconbtn" onclick="finTplRead();S.finTpl.splice(${i},1);finTplDraw()" aria-label="Remove plan">×</button></div>
    ${t.kind==='monthly'?`<div style="margin-top:8px"><label>Number of months</label><input class="fs-m" type="number" min="1" max="60" value="${esc(t.months)}" style="max-width:120px"></div>`
    :`<div style="margin-top:8px;display:grid;gap:6px">${(t.parts||[]).map((p,j)=>`<div class="fs-p row" style="gap:6px;align-items:center;flex-wrap:wrap"><input class="fs-pl" dir="auto" placeholder="Name" value="${esc(p.label)}" style="flex:1 1 140px"><input class="fs-pp" type="number" min="0" max="100" value="${esc(p.pct)}" style="width:80px" aria-label="Percent"><span class="muted">%</span>
      <select class="fs-pw" style="width:150px"><option value="start"${p.when!=='launch'?' selected':''}>After start</option><option value="launch"${p.when==='launch'?' selected':''}>After launch</option></select><span class="muted">+</span><input class="fs-pd" type="number" min="0" max="365" value="${esc(p.days||0)}" style="width:70px" aria-label="Days"><span class="muted">days</span>
      <button class="iconbtn" onclick="finTplRead();S.finTpl[${i}].parts.splice(${j},1);finTplDraw()" aria-label="Remove part">×</button></div>`).join('')}
      <button class="btn ghost small" style="justify-self:start" onclick="finTplRead();S.finTpl[${i}].parts.push({label:'',pct:0,when:'start',days:0});finTplDraw()">+ Part</button></div>`}</div>`).join('');
}

/* ----- كارت الديسك ----- */
function finDeskHTML(L){
  if(!L||!L.length) return '';
  return `<div class="card flush"><div class="chead"><h2>Overdue payments</h2><span class="pill p-bad">${L.length}</span><span class="spacer"></span><button class="btn ghost small" onclick="go('finance')">Finance →</button></div>
    ${L.map(x=>`<button class="al" onclick="go('finance',{id:'${esc(x.contract)}'})"><span class="tx"><b>${esc(x.client)} · ${sar(x.amount)}</b><span>${esc(x.label)} · due ${fmtD(x.due)}</span></span><span class="pill p-bad">Overdue</span></button>`).join('')}</div>`;
}
