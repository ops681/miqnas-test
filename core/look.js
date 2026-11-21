/* ============ الشكل الجديد: صف صفحات القسم ============
   تحت عنوان الصفحة بيظهر صف أزرار دايرية بصفحات نفس القسم اللي في القايمة
   (مثلاً Projects · Briefs · Blockers · Client Report). بيتبني من NAV_G و navFor، فالصلاحيات زي ما هي. */
function pillsRender(){
  let el=$('pillNav');
  if(!el){ const top=$('top'); if(!top) return; el=document.createElement('nav'); el.id='pillNav'; el.setAttribute('aria-label','Section pages'); top.insertAdjacentElement('afterend',el); }
  if(!S.user){ el.innerHTML=''; return; }
  const gid=navGroupOf(S.view), g=NAV_G.find(x=>x[0]===gid);
  if(!g){ el.innerHTML=''; return; }
  const N=navFor(S.user), L=g[3].map(id=>N.find(n=>n.id===id)).filter(Boolean);
  if(L.length<2){ el.innerHTML=''; return; }
  el.innerHTML=L.map(n=>{ const b=navBadge(n.id); return `<button type="button" class="pn${S.view===n.id?' on':''}" data-v="${n.id}"><i>${ico(n.icon,15)}</i>${esc(n.label)}${b?`<span class="nb">${b}</span>`:''}</button>`; }).join('');
  el.querySelectorAll('.pn').forEach(b=>b.onclick=()=>go(b.dataset.v));
}
(function(){
  const _go=go;
  go=function(v,opts){ const r=_go(v,opts); try{ pillsRender(); }catch(e){} return r; };
})();
// القايمة الجانبية بقت أقسام بس (My Work، Clients & Projects، HR…)، وصفحات القسم بقت في الصف اللي فوق.
// الضغط على القسم بيفتح أول صفحة فيه.
(function(){
  const _rs=renderSide;
  renderSide=function(){
    _rs();
    const N=navFor(S.user), cur=navGroupOf(S.view);
    document.querySelectorAll('#nav .ngrp').forEach(el=>{
      const g=NAV_G.find(x=>x[0]===el.dataset.g); if(!g) return;
      const first=g[3].map(id=>N.find(n=>n.id===id)).filter(Boolean)[0]; if(!first) return;
      const h=el.querySelector('.nghead'); if(!h) return;
      h.removeAttribute('onclick'); h.removeAttribute('aria-expanded'); h.onclick=()=>go(first.id);
      h.classList.toggle('on',g[0]===cur);
    });
  };
  const _go=go;
  go=function(v,opts){ const r=_go(v,opts); const cur=navGroupOf(v);
    document.querySelectorAll('#nav .ngrp').forEach(el=>{ const h=el.querySelector('.nghead'); if(h) h.classList.toggle('on',el.dataset.g===cur); });
    return r; };
})();
