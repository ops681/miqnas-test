/* ============ Blockers ============ */
const BL_CATS=['UI/UX','Copywriting','Development','Official Documents','Access','Client Response Delay'];
function blBadge(b){
  if(!b||!b.total) return '';
  return b.open ? `<span class="pill p-bad" title="${b.open} open of ${b.total}">${ico('flag',12)} ${b.open} open blocker${b.open>1?'s':''}</span>`
                : `<span class="pill p-out" title="${b.days} days blocked in total">${ico('flag',12)} Had ${b.total} blocker${b.total>1?'s':''}</span>`;
}
function viewBlockers(){
  setTop('Blockers','Delays caused by the client or the platform', `<button class="btn primary" onclick="blockForm()">+ New Blocker</button>`);
  if(!S.blF) S.blF={project:'',cat:'',status:'Open'};
  swr('blockers','blockList',{},renderBlockers);
}
function renderBlockers(r){
  S.skew=Date.now()-r.now;
  const F=S.blF;
  const L=r.blockers.filter(b=>(!F.project||b.project===F.project)&&(!F.cat||b.cat===F.cat)&&(F.status==='All'||(F.status==='Open'?b.status!=='Resolved':b.status==='Resolved')))
    .sort((a,b)=>(a.status==='Resolved')-(b.status==='Resolved') || b.days-a.days);
  const openN=r.blockers.filter(b=>b.status!=='Resolved').length;
  $('main').innerHTML=`
  <div class="grid kpis">
    <div class="kpi"><span>Open blockers</span><b style="color:${openN?'var(--bad)':'var(--ink)'}">${openN}</b></div>
    <div class="kpi"><span>Projects affected</span><b>${new Set(r.blockers.filter(b=>b.status!=='Resolved').map(b=>b.project)).size}</b></div>
    <div class="kpi"><span>Resolved</span><b>${r.blockers.length-openN}</b></div>
    <div class="kpi"><span>Days blocked (all)</span><b>${r.blockers.reduce((s,b)=>s+b.days,0)}</b></div>
  </div>
  <div class="row" style="margin-bottom:14px;align-items:center">
    <div style="flex:0 1 260px"><select id="blP" aria-label="Project"><option value="">All projects</option>${r.projects.map(p=>`<option value="${esc(p.id)}"${F.project===p.id?' selected':''}>${esc(p.id)} · ${esc(p.client)}</option>`).join('')}</select></div>
    <div style="flex:0 1 220px"><select id="blC" aria-label="Type"><option value="">All types</option>${BL_CATS.map(c=>`<option${F.cat===c?' selected':''}>${c}</option>`).join('')}</select></div>
    <div class="chips" style="flex:0 0 auto">${['Open','Resolved','All'].map(s=>`<button class="${F.status===s?'on':''}" onclick="S.blF.status='${s}';renderBlockers(S.cache.blockers)">${s}</button>`).join('')}</div>
  </div>
  ${L.length? `<div style="display:grid;gap:14px">${L.map(blCard).join('')}</div>` : `<div class="card empty"><b>Nothing here</b>No blockers match these filters.</div>`}`;
  $('blP').onchange=e=>{ S.blF.project=e.target.value; renderBlockers(S.cache.blockers); };
  $('blC').onchange=e=>{ S.blF.cat=e.target.value; renderBlockers(S.cache.blockers); };
}
function blCard(b){
  const open=b.status!=='Resolved';
  return `<div class="card" style="border-left:4px solid ${open?'#D92D20':'#98A2B3'}">
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <span class="pill ${open?'p-bad':'p-out'}">${open?'Open':'Resolved'}</span>
      <span class="pill p-prog">${esc(b.cat)}</span>
      <span class="pill ${b.cause==='Platform'?'p-yel':'p-absent'}">Caused by ${esc(b.cause)}</span>
      <button class="btn ghost small" onclick="go('projects');viewProject('${esc(b.project)}')"><b>${esc(b.project)} · ${esc(b.client)}</b></button>
      <span class="spacer"></span>
      <span class="muted" style="font-size:13px">Since ${fmtD(b.start)}${open?'':' → '+fmtD(b.resolved)} · <b style="color:${open?'var(--bad)':'var(--ink)'}">${b.days} day${b.days===1?'':'s'}</b></span>
    </div>
    <div style="margin:12px 0 4px;font-size:14.5px;white-space:pre-wrap" dir="auto">${esc(b.details)}</div>
    ${b.evidence?`<a href="${esc(b.evidence)}" target="_blank" rel="noopener" style="font-size:13px">Evidence ↗</a>`:''}
    ${b.updates.length?`<div style="margin-top:10px;border-top:1px dashed var(--line);padding-top:10px;display:grid;gap:6px">${b.updates.map(u=>`<div style="font-size:13px"><span class="muted">${new Date(u.at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})} · ${bd(u.by)}:</span> <span dir="auto">${esc(u.text)}</span></div>`).join('')}</div>`:''}
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;align-items:center">
      <input id="note_${esc(b.id)}" placeholder="Add a follow-up (e.g. sent a reminder to the client)" dir="auto" style="flex:1 1 280px;padding:8px 10px;font-size:13px">
      <button class="btn small" onclick="blNote('${esc(b.id)}')">Add</button>
      ${open?`<button class="btn small primary" onclick="blResolve('${esc(b.id)}')">Mark resolved</button>`:`<button class="btn small" onclick="blAct('${esc(b.id)}','reopen')">Reopen</button>`}
      <button class="btn small ghost" onclick="blockForm('${esc(b.id)}')">Edit</button>
      ${S.user.role==='admin'?`<button class="btn small ghost danger" onclick="if(confirm('هيتمسح البلوكر ده نهائي. متأكد؟'))blAct('${esc(b.id)}','delete')">Delete</button>`:''}
    </div>
  </div>`;
}
async function blockForm(id, projectId){
  let r=S.cache.blockers;
  if(!r){ $('modalRoot').innerHTML=`<div class="modal"><div class="card">${LOADING}</div></div>`; try{ r=await call('blockList'); S.cache.blockers=r; }catch(e){ closeModal(); alert(e.message); return; } }
  const b=id? r.blockers.find(x=>x.id===id) : {project:projectId||S.blF&&S.blF.project||'',cat:'',cause:'Client',details:'',evidence:'',start:new Date().toLocaleDateString('en-CA',{timeZone:'Africa/Cairo'})};
  const projs=r.projects.filter(p=>p.status==='Active'||p.status==='On Hold'||p.id===b.project);
  $('modalRoot').innerHTML=`<div class="modal"><div class="card">
    <h2>${id?'Edit Blocker':'New Blocker'}</h2>
    <label for="bP">Project</label><select id="bP"><option value="">Choose...</option>${projs.map(p=>`<option value="${esc(p.id)}"${p.id===b.project?' selected':''}>${esc(p.id)} · ${esc(p.client)}</option>`).join('')}</select>
    <label for="bC">Type</label><select id="bC"><option value="">Choose...</option>${BL_CATS.map(c=>`<option${c===b.cat?' selected':''}>${c}</option>`).join('')}</select>
    <label>Caused by</label><div class="chips" id="bCa">${['Client','Platform'].map(c=>`<button type="button" class="${b.cause===c?'on':''}" data-v="${c}">${c}</button>`).join('')}</div>
    <label for="bD">Details</label><textarea id="bD" rows="4" dir="auto" placeholder="مثال: طلبنا الأكسيس بتاع سلة يوم 3 أكتوبر ولسه مبعتش">${esc(b.details)}</textarea>
    <label for="bS">Started on</label><input type="date" id="bS" value="${esc(b.start)}">
    <label for="bE">Evidence link (optional)</label><input id="bE" value="${esc(b.evidence)}" placeholder="https://drive.google.com/...">
    <div class="err" id="bErr"></div>
    <div class="mfoot"><button class="btn primary" id="bSave">${id?'Save':'Add Blocker'}</button><button class="btn" onclick="closeModal()">Cancel</button></div>
  </div></div>`;
  let cause=b.cause;
  $('bCa').querySelectorAll('button').forEach(x=>x.onclick=()=>{ cause=x.dataset.v; $('bCa').querySelectorAll('button').forEach(y=>y.classList.toggle('on',y===x)); });
  $('bSave').onclick=async()=>{
    $('bErr').textContent=''; $('bSave').disabled=true;
    try{
      await call('blockSave',{blocker:{id:id||'',project:$('bP').value,cat:$('bC').value,cause,details:$('bD').value,start:$('bS').value,evidence:$('bE').value}});
      closeModal(); toast(id?'اتحفظ ✓':'اتضاف البلوكر ✓'); afterBlock($('bP')?$('bP').value:'');
    }catch(e){ $('bErr').textContent=e.message; $('bSave').disabled=false; }
  };
}
function afterBlock(pid){
  call('blockList').then(r=>{ S.cache.blockers=r; if(S.view==='blockers'&&!S.proj) renderBlockers(r); }).catch(()=>{});
  if(S.proj&&S.proj.id) viewProject(S.proj.id,true);
  refreshDash();
}
async function blAct(id,act,extra){
  try{ await call('blockAct',Object.assign({id,act},extra||{})); toast(act==='delete'?'اتمسح ✓':'اتحفظ ✓'); afterBlock(); }catch(e){ alert(e.message); }
}
function blNote(id){ const el=$('note_'+id); const t=el?el.value.trim():''; if(!t) return; blAct(id,'note',{text:t}); }
function blResolve(id){
  $('modalRoot').innerHTML=`<div class="modal"><div class="card">
    <h2>Mark as resolved</h2>
    <label for="rD">Resolved on</label><input type="date" id="rD" value="${new Date().toLocaleDateString('en-CA',{timeZone:'Africa/Cairo'})}">
    <label for="rT">Note (optional)</label><input id="rT" dir="auto" placeholder="مثال: العميل بعت الأكسيس">
    <div class="mfoot"><button class="btn primary" id="rS">Resolve</button><button class="btn" onclick="closeModal()">Cancel</button></div>
  </div></div>`;
  $('rS').onclick=()=>{ const d=$('rD').value, t=$('rT').value; closeModal(); blAct(id,'resolve',{date:d,text:t}); };
}

/* ----- تقرير PDF للمنصة ----- */
function loadJs(src){ return new Promise((res,rej)=>{ const el=document.createElement('script'); el.src=src; el.onload=res; el.onerror=rej; document.head.appendChild(el); }); }
async function blockersPDF(pid){
  const r=S.cache['p:'+pid]; if(!r||!r.blockers) return;
  toast('بيجهّز الـ PDF...');
  try{
    if(!window.html2canvas) await loadJs('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    if(!window.jspdf) await loadJs('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    try{ await document.fonts.ready; }catch(e){}
    const B=r.blockers.slice().sort((a,b)=>a.start<b.start?-1:1);
    const total=B.reduce((s,b)=>s+b.days,0);
    const host=document.createElement('div');
    host.style.cssText='position:fixed;left:-10000px;top:0;width:794px;background:#fff;color:#10231F;font-family:IBM Plex Sans,IBM Plex Sans Arabic,sans-serif;padding:40px;box-sizing:border-box';
    host.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #E8753D;padding-bottom:16px">
        <div><div style="font-size:12px;color:#5B6E6A;letter-spacing:.08em">MIQNAS · PROJECT BLOCKERS REPORT</div><div style="font-size:26px;font-weight:700;margin-top:6px" dir="auto">${esc(r.client)}</div><div style="font-size:13px;color:#5B6E6A;margin-top:4px">${esc(r.id)} · ${esc(r.type)} · Start ${fmtD(r.start_date)} · Target Launch ${fmtD(r.target_launch)}</div></div>
        <div style="text-align:right;font-size:12px;color:#5B6E6A">Generated<br><b style="color:#10231F;font-size:13px">${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</b></div>
      </div>
      <div style="display:flex;gap:12px;margin:20px 0">
        ${[['Blockers',B.length],['Days blocked (total)',total],['Caused by client',B.filter(b=>b.cause==='Client').length],['Caused by platform',B.filter(b=>b.cause==='Platform').length]].map(k=>`<div style="flex:1;border:1px solid #DDE6E3;border-radius:10px;padding:12px"><div style="font-size:11px;color:#5B6E6A">${k[0]}</div><div style="font-size:24px;font-weight:700">${k[1]}</div></div>`).join('')}
      </div>
      ${B.map((b,i)=>`<div class="pblk" style="border:1px solid #DDE6E3;border-radius:10px;padding:14px 16px;margin-bottom:12px">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:12px">
          <b style="font-size:14px">#${i+1} · ${esc(b.cat)}</b>
          <span style="background:${b.cause==='Platform'?'#FEF5D6':'#FDEBDD'};border-radius:99px;padding:2px 9px;font-weight:700">Caused by ${esc(b.cause)}</span>
          <span style="background:${b.status==='Resolved'?'#DCF3E6':'#FEE4E2'};border-radius:99px;padding:2px 9px;font-weight:700">${esc(b.status)}</span>
          <span style="margin-left:auto;color:#5B6E6A">${fmtD(b.start)} → ${b.status==='Resolved'?fmtD(b.resolved):'still open'} · <b style="color:#10231F">${b.days} days</b></span>
        </div>
        <div style="margin-top:8px;font-size:13.5px;white-space:pre-wrap" dir="auto">${esc(b.details)}</div>
        ${b.evidence?`<div style="margin-top:6px;font-size:12px;color:#107366;word-break:break-all">Evidence: ${esc(b.evidence)}</div>`:''}
        ${b.updates.length?`<div style="margin-top:8px;border-top:1px dashed #DDE6E3;padding-top:6px">${b.updates.map(u=>`<div style="font-size:12px;margin-top:3px"><span style="color:#5B6E6A">${new Date(u.at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})} · ${esc(u.by)}:</span> <span dir="auto">${esc(u.text)}</span></div>`).join('')}</div>`:''}
      </div>`).join('') || '<div style="color:#5B6E6A">No blockers recorded.</div>'}`;
    document.body.appendChild(host);
    const hr=host.getBoundingClientRect();
    const cuts=[...host.querySelectorAll('.pblk')].map(e=>e.getBoundingClientRect().bottom-hr.top+6);
    const canvas=await html2canvas(host,{scale:2,backgroundColor:'#ffffff',logging:false});
    host.remove();
    const {jsPDF}=window.jspdf; const pdf=new jsPDF({unit:'pt',format:'a4',compress:true});
    const PW=pdf.internal.pageSize.getWidth(), PH=pdf.internal.pageSize.getHeight(), k=PW/794, maxH=PH/k-20, total2=canvas.height/2;
    let y0=0, pg=0;
    while(y0<total2-1){
      let y1=Math.min(total2,y0+maxH);
      if(y1<total2){ const c=cuts.filter(v=>v>y0+80&&v<=y1); if(c.length) y1=c[c.length-1]; }
      if(pg) pdf.addPage();
      const pc=document.createElement('canvas'); pc.width=canvas.width; pc.height=Math.round((y1-y0)*2);
      const ctx=pc.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,pc.width,pc.height); ctx.drawImage(canvas,0,Math.round(y0*2),canvas.width,pc.height,0,0,canvas.width,pc.height);
      pdf.addImage(pc.toDataURL('image/jpeg',0.92),'JPEG',0,10,PW,(y1-y0)*k);
      y0=y1; pg++;
    }
    pdf.save(('Blockers - '+r.client+' - '+r.id).replace(/[\\/:*?"<>|]+/g,' ')+'.pdf');
  }catch(e){ alert('ماقدرتش أعمل الـ PDF. '+(e&&e.message||'')); }
}
function projBlockersHTML(r){
  if(!r.blockers) return '';
  const B=r.blockers, open=B.filter(b=>b.status!=='Resolved').length, days=B.reduce((s,b)=>s+b.days,0);
  return `<div class="card flush" style="margin-top:14px">
    <div class="chead"><span style="color:${open?'var(--bad)':'var(--muted)'}">${ico('flag',18)}</span><h3>Blockers</h3>${B.length?`<span class="muted" style="font-size:13px">${B.length} total · ${open} open · ${days} days blocked</span>`:''}<span class="spacer"></span>
      ${B.length?`<button class="btn small" onclick="blockersPDF('${esc(r.id)}')">Export PDF</button>`:''}
      ${r.canBlock?`<button class="btn small primary" onclick="blockForm('','${esc(r.id)}')">+ Add Blocker</button>`:''}</div>
    ${B.length? `<div style="padding:14px 20px;display:grid;gap:12px">${B.slice().sort((a,b)=>(a.status==='Resolved')-(b.status==='Resolved')).map(blCard).join('')}</div>` : `<div class="empty">No blockers on this project.</div>`}
  </div>`;
}
