/* ============ الساعة بنظام 12 (5:30 PM بدل 17:30) ============
   السيرفر والشيتات بيخزنوا الوقت 24 ساعة زي ما هو. ده بيغيّر طريقة العرض بس:
   أي وقت HH:mm بيظهر في الصفحة بيتحول لـ h:mm AM/PM.
   العدادات (00:12:34) والخانات اللي بتتكتب فيها والباسوردات مش بتتلمس. */
const T12_RE = /(^|[^\d:])([01]?\d|2[0-3]):([0-5]\d)(?![\d:])(?!\s?[AaPp]\.?[Mm])/g;
const T12_SKIP = 'input,textarea,select,option,script,style,code,pre,[data-live],[data-secret],.credv,.pacc-v,.no12,#sideElapsed,#elapsed,.ttime';
function t12(s){
  return String(s).replace(T12_RE,(m,pre,h,mm)=>{ h=+h; return pre+((h%12)||12)+':'+mm+' '+(h<12?'AM':'PM'); });
}
function t12Node(n){
  if(n.nodeType===3){
    const p=n.parentElement; if(!p || p.closest(T12_SKIP)) return;
    const v=n.nodeValue; if(!v || v.indexOf(':')<0) return;
    const nv=t12(v); if(nv!==v) n.nodeValue=nv;
    return;
  }
  if(n.nodeType!==1 || n.matches(T12_SKIP)) return;
  const w=document.createTreeWalker(n,NodeFilter.SHOW_TEXT,null);
  const list=[]; while(w.nextNode()) list.push(w.currentNode);
  list.forEach(t12Node);
}
(function(){
  const run=()=>{
    t12Node(document.body);
    new MutationObserver(ms=>ms.forEach(m=>{
      if(m.type==='characterData') t12Node(m.target);
      else m.addedNodes.forEach(t12Node);
    })).observe(document.body,{childList:true,subtree:true,characterData:true});
  };
  if(document.body) run(); else document.addEventListener('DOMContentLoaded',run);
})();
