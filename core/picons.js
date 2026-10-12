/* ============ أيقونات المشاريع ============
   أيقونة المشروع = صورة مرفوعة عليه، ولو مفيش: لوجو البريف المربوط بيه. بتتحفظ في البراوزر،
   وبتتجاب تاني بس لما "نسخة الأيقونات" (piv) تتغير. أي <span class="pi" data-pi="MQ-001"> بيظهر فيه اللوجو لوحده. */
S.pi={ver:'',list:{}};
try{ const c=JSON.parse(load('erp_pi')||'null'); if(c&&c.list) S.pi=c; }catch(e){}
function piTag(id,name,cls){ return `<span class="pi${cls?' '+cls:''}" data-pi="${esc(id||'')}" aria-hidden="true">${esc(initials(name||id||'?'))}</span>`; }
async function piSync(ver){
  if(ver && ver===S.pi.ver) return;
  try{ const r=await call('piconsGet'); S.pi={ver:r.ver,list:r.list||{}}; try{ store('erp_pi',JSON.stringify(S.pi)); }catch(e){} piApply(document.body); }catch(e){}
}
function piApply(root){
  if(!root||!root.querySelectorAll) return;
  const set=el=>{ const k=el.dataset.pi, img=k&&S.pi.list[k];
    if(img){ if(el.dataset.img!==img.length+k){ el.style.backgroundImage='url("'+img+'")'; el.classList.add('has-img'); el.dataset.img=img.length+k; } }
    else if(el.dataset.img){ el.style.backgroundImage=''; el.classList.remove('has-img'); delete el.dataset.img; } };
  if(root.matches && root.matches('.pi[data-pi]')) set(root);
  root.querySelectorAll('.pi[data-pi]').forEach(set);
}
(function(){
  const run=()=>{ piApply(document.body); new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{ if(n.nodeType===1) piApply(n); }))).observe(document.body,{childList:true,subtree:true}); };
  if(document.body) run(); else document.addEventListener('DOMContentLoaded',run);
})();
// تغيير أيقونة مشروع (لمين يقدر يعدّل المشروع)
function piEdit(pid,name,data){
  const cur=data||S.pi.list[pid];
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:420px">
    <h2 style="margin:0 0 4px">Project icon · ${bd(name||pid)}</h2><div class="muted" style="font-size:13px;margin-bottom:14px">Shows everywhere in the system and in the partner and client portals. Without one, the brief logo is used.</div>
    <div style="display:flex;align-items:center;gap:16px"><span class="pi pi-xl${cur?' has-img':''}" id="piPrev"${cur?` style="background-image:url('${cur}')"`:''}>${esc(initials(name||pid))}</span>
      <div style="display:grid;gap:8px"><label class="btn" for="piFile" style="margin:0">${cur?'Choose another':'Choose image'}</label><input type="file" id="piFile" accept="image/*" hidden>
      ${!data&&S.pi.list[pid]?`<button class="btn ghost danger" id="piDel">Remove icon</button>`:''}</div></div>
    <div class="err" id="piErr"></div>
    <div class="mfoot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn primary" id="piSave"${data?'':' disabled'}>Save</button></div></div></div>`;
  $('piFile').onchange=async()=>{ const f=$('piFile').files[0]; if(!f) return; const d=await imgCrop(f,{round:false,size:128,maxLen:25000,title:'Project icon',bg:'#ffffff'}); piEdit(pid,name,d||data); };
  if($('piDel')) $('piDel').onclick=async()=>{ if(!confirm('تمسح الأيقونة؟ هيرجع لوجو البريف لو موجود')) return; try{ const r=await call('piconDelete',{project:pid}); S.pi.ver=''; closeModal(); piSync(); toast('اتمسحت'); }catch(e){ $('piErr').textContent=e.message; } };
  $('piSave').onclick=async()=>{ if(!data) return; $('piSave').disabled=true; $('piSave').textContent='Saving...';
    try{ await call('piconSave',{project:pid,img:data}); S.pi.list[pid]=data; S.pi.ver=''; try{ store('erp_pi',JSON.stringify(S.pi)); }catch(e){} piApply(document.body); closeModal(); toast('اتحفظت الأيقونة ✓'); piSync(); }
    catch(e){ $('piErr').textContent=e.message; $('piSave').disabled=false; $('piSave').textContent='Save'; } };
}
