/* ============ صور الموظفين ============
   الصور بتتحفظ في البراوزر، وبتتجاب من السيرفر تاني بس لما "نسخة الصور" (avv) تتغير.
   أي <div class="av" data-u="username"> بيظهر فيه صورة الموظف لوحده لو عنده صورة. */
S.av={ver:'',list:{}};
try{ const c=JSON.parse(load('erp_av')||'null'); if(c&&c.list) S.av=c; }catch(e){}
async function avSync(ver){
  if(ver && ver===S.av.ver) return;
  try{ const r=await call('avatarsGet'); S.av={ver:r.ver,list:r.list||{}}; try{ store('erp_av',JSON.stringify(S.av)); }catch(e){} avApply(document.body); }catch(e){}
}
function avApply(root){
  if(!root||!root.querySelectorAll) return;
  const set=el=>{ const u=el.dataset.u, img=u&&S.av.list[u];
    if(img){ if(el.dataset.img!==u){ el.style.backgroundImage='url("'+img+'")'; el.classList.add('has-img'); el.dataset.img=u; } }
    else if(el.dataset.img){ el.style.backgroundImage=''; el.classList.remove('has-img'); delete el.dataset.img; } };
  if(root.matches && root.matches('.av[data-u]')) set(root);
  root.querySelectorAll('.av[data-u]').forEach(set);
}
(function(){
  const run=()=>{ avApply(document.body); new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{ if(n.nodeType===1) avApply(n); }))).observe(document.body,{childList:true,subtree:true}); };
  if(document.body) run(); else document.addEventListener('DOMContentLoaded',run);
})();
// تغيير الصورة: لنفسك، أو لأي حد لو معاك people.manage
function avEdit(un){
  un=un||S.user.username;
  const mine=un===S.user.username;
  if(!mine && !can('people.manage')) return;
  const u=(S.cache.users||[]).find(x=>x.username===un)||(mine?S.user:{username:un,name:un});
  const cur=S.av.list[un];
  $('modalRoot').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="card" style="max-width:420px">
    <h2 style="margin:0 0 4px">${mine?'Your photo':'Photo · '+bd(u.name)}</h2><div class="muted" style="font-size:13px;margin-bottom:14px">Everyone in the company sees this photo.${mine?'':' You are changing it as an admin.'}</div>
    <div style="display:flex;align-items:center;gap:16px"><div class="av av-xl" id="avPrev"${cur?` style="background-image:url('${cur}')"`:''}>${cur?'':esc(initials(u.name))}</div>
      <div style="display:grid;gap:8px"><label class="btn" for="avFile" style="margin:0">Choose photo</label><input type="file" id="avFile" accept="image/*" hidden>
      ${cur?`<button class="btn ghost danger" onclick="avRemove('${esc(un)}')">Remove photo</button>`:''}</div></div>
    <div class="err" id="avErr"></div>
    <div class="mfoot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn primary" id="avSave" disabled>Save</button></div></div></div>`;
  let data='';
  $('avFile').onchange=async()=>{
    const f=$('avFile').files[0]; if(!f) return;
    try{ data=await avCrop(f); $('avPrev').style.backgroundImage=`url("${data}")`; $('avPrev').textContent=''; $('avSave').disabled=false; $('avErr').textContent=''; }
    catch(e){ $('avErr').textContent='مش قادر أقرا الصورة دي. جرّب صورة تانية'; }
  };
  $('avSave').onclick=async()=>{ $('avSave').disabled=true; $('avSave').textContent='Saving...';
    try{ await call('avatarSave',{username:un,img:data}); S.av.list[un]=data; S.av.ver=''; try{ store('erp_av',JSON.stringify(S.av)); }catch(e){} avApply(document.body); closeModal(); toast('اتحفظت الصورة ✓'); avSync(); }
    catch(e){ $('avErr').textContent=e.message; $('avSave').disabled=false; $('avSave').textContent='Save'; } };
}
async function avRemove(un){
  if(!confirm('تمسح الصورة؟')) return;
  try{ await call('avatarDelete',{username:un}); delete S.av.list[un]; S.av.ver=''; try{ store('erp_av',JSON.stringify(S.av)); }catch(e){} avApply(document.body); closeModal(); toast('اتمسحت الصورة'); avSync(); }catch(e){ alert(e.message); }
}
// قص مربع من النص وتصغير لـ 128px (حجم صغير يتخزن بسهولة)
function avCrop(file){
  return new Promise((res,rej)=>{
    const img=new Image(), url=URL.createObjectURL(file);
    img.onload=()=>{ const s=Math.min(img.width,img.height), c=document.createElement('canvas'); c.width=c.height=128;
      c.getContext('2d').drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,128,128); URL.revokeObjectURL(url);
      let q=0.85, out=c.toDataURL('image/jpeg',q); while(out.length>40000 && q>0.4){ q-=0.15; out=c.toDataURL('image/jpeg',q); } res(out); };
    img.onerror=()=>{ URL.revokeObjectURL(url); rej(new Error('bad image')); };
    img.src=url;
  });
}
