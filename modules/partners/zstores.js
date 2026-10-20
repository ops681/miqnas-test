/* ============ متاجر زد (متابعة المتاجر بشكل شيت زد) ============
   زد بتنزّل العميل على البورتال بتاعها، والـ Account Manager بيسجّله هنا "متجر جديد" (مش مشروع).
   بعدين: ابدأ البريف ← المشروع من البريف. الحالة اللي زد بتشوفها بتتحسب لوحدها. */
const ZS_PILL={'تم بدء التواصل':'p-prog','في انتظار المتطلبات':'p-yel','تم بدء العمل':'p-run','متبقي تفعيل زد باي':'p-prog','متبقي تفعيل الدومين':'p-prog','مكتمل':'p-in'};
function zsPill(s){ return `<span class="pill ${ZS_PILL[s]||'p-out'}" dir="rtl">${esc(s)}</span>`; }
function zsAgo(d){ if(!d) return ''; const n=Math.round((Date.now()-new Date(d+'T12:00:00'))/864e5); return n<=0?'today':n===1?'1 day ago':n+' days ago'; }
function viewZStores(opts){
  opts=opts||{}; S.zsP=opts.partner||S.zsP||'Zid'; if(opts.tab) S.zsTab=opts.tab;
  setTop('Zid Stores','');
  swr('zs:'+S.zsP,'zsList',{partner:S.zsP},renderZStores);
}
function zsRefresh(){ delete S.cache['zs:'+S.zsP]; viewZStores(); }
function renderZStores(r){
  S.zsR=r;
  const tab=S.zsTab||'new', L=r.rows||[];
  const isNew=x=>!x.project&&!x.closed, isClosed=x=>x.closed;
  const lists={ new:L.filter(isNew), all:L.filter(x=>!isClosed(x)), closed:L.filter(isClosed) };
  const PN=r.partner.nameEn||r.partner.name||'Zid';
  setTop(PN+' Stores','Stores '+esc(PN)+' sent us, before and after they become projects',
    `${r.admin?`<button class="btn ghost" onclick="zsPkgForm()">Packages & sheet</button> `:''}<button class="btn primary" onclick="zsForm()">+ New store from ${esc(r.partner.nameEn||'Zid')}</button>`);
  const T=(k,l)=>`<button class="btn ${tab===k?'primary':'ghost'} small" onclick="S.zsTab='${k}';renderZStores(S.zsR)">${l} · ${lists[k].length}</button>`;
  const amCol=r.admin;
  const blk=x=>{ const o=x.blog.filter(b=>b.open); return o.length?`<span class="pill p-bad" title="${esc(o.map(b=>b.owner+': '+b.cat).join(' · '))}">${o.length} open</span>`:(x.blog.length?`<span class="muted" style="font-size:12px">${x.blog.length} resolved</span>`:'<span class="muted">—</span>'); };
  const acts=x=>{
    const b=[];
    if(tab==='closed'){ if(x.rec) b.push(`<button class="btn small" onclick="zsState('${esc(x.rec)}','reopen')">Reopen</button>`); }
    else if(!x.project){
      if(x.status==='تم بدء التواصل') b.push(`<button class="btn small" onclick="zsState('${esc(x.rec)}','waiting')">Waiting for requirements</button>`);
      b.push(x.brief?`<button class="btn small" onclick="go('briefs',{id:'${esc(x.brief)}'})">Open brief</button>`:`<button class="btn primary small" onclick="zsBriefGo('${esc(x.rec)}')">Start brief →</button>`);
      b.push(`<button class="btn ghost small" onclick="zsCloseForm('${esc(x.rec)}')">Close…</button>`);
    } else {
      b.push(`<button class="btn small" onclick="goTo({view:'project',id:'${esc(x.project)}'})">Project</button>`);
      if(x.brief) b.push(`<button class="btn ghost small" onclick="go('briefs',{id:'${esc(x.brief)}'})">Brief</button>`);
    }
    b.push(`<button class="btn ghost small" onclick="zsForm('${esc(x.key)}')">Edit</button>`);
    return b.join(' ');
  };
  const list=lists[tab];
  const head=`<tr><th>Store ID</th><th>Store</th><th>Merchant phone</th><th>Package</th><th>Theme</th><th>Status</th><th>Contact started</th>${tab==='new'?'':'<th>Launch</th><th>Blockers</th>'}${amCol?'<th>Account Manager</th>':''}<th></th></tr>`;
  const row=x=>`<tr><td dir="ltr"><b>${esc(x.sid)||'<span class="muted">—</span>'}</b>${x.ref?`<div class="muted" style="font-size:12px">${esc(x.ref)}</div>`:''}</td>
    <td>${bd(x.name)}${x.url?`<div class="muted" style="font-size:12px" dir="ltr">${esc(String(x.url).replace(/^https?:\/\//,''))}</div>`:''}${x.note?`<div class="muted" style="font-size:12px" dir="auto">📝 ${esc(x.note)}</div>`:''}</td>
    <td dir="ltr" class="nw">${esc(x.phone)||'<span class="muted">—</span>'}</td><td class="nw">${x.pkg?bd(x.pkg):'<span class="muted">—</span>'}</td><td>${esc(x.theme)||'<span class="muted">—</span>'}</td>
    <td>${zsPill(x.status)}</td><td class="nw">${esc(x.contact)||'—'}${x.contact&&tab==='new'?`<div class="muted" style="font-size:12px">${zsAgo(x.contact)}</div>`:''}</td>
    ${tab==='new'?'':`<td class="nw">${esc(x.launch)||'—'}</td><td>${blk(x)}</td>`}${amCol?`<td>${x.amName?bd(x.amName):'<span class="muted">—</span>'}</td>`:''}<td class="nw">${acts(x)}</td></tr>`;
  const intro={new:['New stores (not projects yet)','They don\'t show in the dashboard or the team\'s work until the brief and the project are made'],
    all:['All '+(r.partner.nameEn||'Zid')+' stores','Exactly what '+(r.partner.nameEn||'Zid')+' sees in its portal (tab متابعة المتاجر). Missing package / theme / phone on older stores: Edit'],
    closed:['Closed','No answer, not suitable, withdrew, or moved to another partner']}[tab];
  $('main').innerHTML=`<div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap">${T('new','New stores')}${T('all','All stores')}${T('closed','Closed')}</div>
    <div class="card flush"><div class="chead" style="flex-direction:column;align-items:flex-start;gap:2px"><h2>${intro[0]}</h2><div class="muted" style="font-size:13px">${intro[1]}</div></div>
    ${list.length?`<div class="tbl-wrap"><table>${head}${list.map(row).join('')}</table></div>`:`<div class="empty" style="padding:22px">${tab==='new'?'No new stores. Add one with "+ New store".':'Nothing here.'}</div>`}</div>
    <div class="card" style="margin-top:14px;font-size:13px;line-height:1.9" dir="rtl"><b>الحالة اللي ${esc(r.partner.name||'زد')} بتشوفها بتتحسب لوحدها:</b> متجر جديد = <b>تم بدء التواصل</b> · اتعمل البريف = <b>في انتظار المتطلبات</b> · اتعمل المشروع = <b>تم بدء العمل</b> · بعد الإطلاق: <b>متبقي تفعيل زد باي</b> / <b>متبقي تفعيل الدومين</b> / <b>مكتمل</b> (من التاسكات). العوائق (Blockers) بتظهر لهم بالإثبات، وبتفضل في السجل حتى بعد ما تتحل.</div>`;
}
function zsStatusSel(x){
  const r=S.zsR, auto=x.project&&TR_AUTO(x);
  if(auto) return `<select id="zsS" dir="rtl" disabled><option>${esc(x.status)}</option></select><div class="muted" style="font-size:12px;margin-top:4px">It's a project now: the status follows the project and its tasks</div>`;
  const opts=(x.brief?[r.statuses.waiting]:[r.statuses.contact,r.statuses.waiting]).concat(r.closeReasons), cur=x.status||r.statuses.contact, cut=opts.length-r.closeReasons.length;
  return `<select id="zsS" dir="rtl" data-nosearch>${opts.map((o,i)=>`${i===cut?'<optgroup label="Closed">':''}<option${o===cur?' selected':''}>${esc(o)}</option>${i===opts.length-1?'</optgroup>':''}`).join('')}</select>`;
}
const TR_AUTO=x=>['تم بدء العمل','متبقي تفعيل زد باي','متبقي تفعيل الدومين','مكتمل'].indexOf(x.status)>=0;
function zsForm(key){
  const r=S.zsR; if(!r) return;
  const x=(r.rows||[]).find(y=>y.key===key)||{};
  const isVirt=key&&!x.rec, today=new Date().toLocaleDateString('en-CA',{timeZone:'Africa/Cairo'});
  const v=k=>esc(x[k]||'');
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:580px">
    <h2 style="margin:0 0 4px">${key?'Edit store':'New store from '+esc(r.partner.nameEn||'Zid')}</h2>
    <div class="muted" style="font-size:13px;margin-bottom:14px">${key?'Changes show in the portal right away.':'Copy it from '+esc(r.partner.nameEn||'Zid')+'\'s portal. It shows in their portal right away with the status you pick. This is not a project yet'}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div><label for="zsI">Store ID *</label><input id="zsI" dir="ltr" value="${v('sid')}"></div>
      <div><label for="zsN">Store name *</label><input id="zsN" dir="auto" value="${v('name')}"></div>
      <div><label for="zsPh">Merchant phone *</label><input id="zsPh" dir="ltr" inputmode="tel" value="${v('phone')}"></div>
      <div><label for="zsU">Store link</label><input id="zsU" dir="ltr" value="${v('url')}"></div>
      <div><label for="zsK">Package *</label><select id="zsK" dir="auto" data-nosearch><option value="">Choose…</option>${r.packages.map(p=>`<option${p===x.pkg?' selected':''}>${esc(p)}</option>`).join('')}</select></div>
      <div><label for="zsT">Theme</label><input id="zsT" value="${v('theme')}"></div>
      <div><label for="zsD">Contact started *</label><input id="zsD" type="date" value="${esc(x.contact||today)}"></div>
      <div><label for="zsS">Status *</label>${zsStatusSel(x)}</div>
      ${r.admin?`<div><label for="zsA">Account Manager *</label><select id="zsA" dir="auto"><option value="">Choose…</option>${r.ams.map(a=>`<option value="${esc(a.u)}"${a.u===x.am?' selected':''}>${esc(a.name)}</option>`).join('')}</select></div>`:''}
      <div style="grid-column:1/-1"><label for="zsNo">Merchant notes and blockers</label><textarea id="zsNo" rows="2" dir="auto" placeholder="Shows in the portal next to the open blockers">${v('note')}</textarea></div></div>
    <div class="err" id="zsE"></div>
    <div class="mfoot"><button class="btn ghost" onclick="closeModal()">Cancel</button><div class="spacer"></div><button class="btn primary" id="zsGo">${key?'Save':'Save store'}</button></div></div></div>`;
  $('zsGo').onclick=async()=>{
    const b=$('zsGo'); b.disabled=true;
    const store={partner:S.zsP,id:x.rec||'',project:isVirt?x.project:'',store_id:$('zsI').value.trim(),name:$('zsN').value.trim(),phone:$('zsPh').value.trim(),url:$('zsU').value.trim(),
      package:$('zsK').value,theme:$('zsT').value.trim(),contact_date:$('zsD').value,note:$('zsNo').value.trim(),am:r.admin?$('zsA').value:'',status:$('zsS')&&!$('zsS').disabled?$('zsS').value:''};
    try{ await call('zsSave',{store}); closeModal(); toast('اتحفظ ✓'); zsRefresh(); }catch(e){ $('zsE').textContent=e.message; b.disabled=false; }
  };
}
async function zsState(id,state,reason){
  try{ await call('zsState',{id,state,reason}); toast('اتحفظ ✓'); zsRefresh(); }catch(e){ toast(e.message); }
}
function zsCloseForm(id){
  const r=S.zsR;
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:420px">
    <h2 style="margin:0 0 4px">Close store</h2><div class="muted" style="font-size:13px;margin-bottom:12px">The reason shows as the status in ${esc(r.partner.nameEn||'Zid')}'s portal. You can reopen it later</div>
    <div style="display:grid;gap:8px" dir="rtl">${r.closeReasons.map((c,i)=>`<label style="display:flex;align-items:center;gap:10px;margin:0;padding:10px 12px;border:1px solid var(--line);border-radius:10px;cursor:pointer;font-weight:500"><input type="radio" name="zsR" value="${esc(c)}"${i?'':' checked'} style="width:18px;height:18px;margin:0;flex:none"><span>${esc(c)}</span></label>`).join('')}</div>
    <div class="mfoot"><button class="btn ghost" onclick="closeModal()">Cancel</button><div class="spacer"></div><button class="btn primary" onclick="const v=document.querySelector('input[name=zsR]:checked').value;closeModal();zsState('${esc(id)}','close',v)">Close store</button></div></div></div>`;
}
async function zsBriefGo(id){
  try{ const r=await call('zsBrief',{id}); delete S.cache['zs:'+S.zsP]; delete S.cache.briefs; toast('اتعمل البريف ✓'); go('briefs',{id:r.brief}); }catch(e){ toast(e.message); }
}
function zsPkgForm(){
  const r=S.zsR;
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:420px">
    <h2 style="margin:0 0 4px">${esc(r.partner.nameEn||'Zid')} sheet settings</h2>
    <label for="zsPk" style="margin-top:8px">Packages</label><div class="muted" style="font-size:13px;margin-bottom:6px">One per line, the same words ${esc(r.partner.nameEn||'Zid')} uses</div>
    <textarea id="zsPk" rows="5" dir="auto">${esc(r.packages.join('\n'))}</textarea>
    <label for="zsLb" style="margin-top:12px">Our name in their sheet</label><div class="muted" style="font-size:13px;margin-bottom:6px">The "الشريك" row in the Excel file they export from the portal</div>
    <input id="zsLb" dir="auto" value="${esc(r.label||'')}"><div class="err" id="zsPkE"></div>
    <div class="mfoot"><button class="btn ghost" onclick="closeModal()">Cancel</button><div class="spacer"></div><button class="btn primary" id="zsPkGo">Save</button></div></div></div>`;
  $('zsPkGo').onclick=async()=>{ try{ await call('zsPkgSave',{partner:S.zsP,list:$('zsPk').value.split('\n').map(s=>s.trim()).filter(Boolean),label:$('zsLb').value.trim()}); closeModal(); toast('اتحفظ ✓'); zsRefresh(); }catch(e){ $('zsPkE').textContent=e.message; } };
}
