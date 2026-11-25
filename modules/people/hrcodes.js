/* ============ كود الموظف عند الـ HR (2026-11-25) ============
   الكود بيطلع أول عمود في كل ملفات الإكسل (علشان الـ HR يطابقوا بالكود بدل الاسم).
   بيتعدّل من: Employees → Edit / New Employee، Agent Profile (✏️ جنب الكود)، أو "⬆ Import HR codes" (شيت الـ HR زي ما هو). */
S.hrc=null; S.hrcAt=0;
// اليوزر → الكود (بيتقرا مرة كل 5 دقايق بالكتير، وبس لما حد يصدّر)
function hrcLoad(force){
  if(!force&&S.hrc&&Date.now()-S.hrcAt<3e5) return Promise.resolve(S.hrc);
  return call('hrCodes').then(m=>{ S.hrc=m||{}; S.hrcAt=Date.now(); return S.hrc; }).catch(()=>S.hrc||{});
}
function hrcOf(un){ return (S.hrc&&un&&S.hrc[String(un).toLowerCase()])||''; }
function hrcForget(){ S.hrc=null; S.hrcAt=0; }

/* ----- في Agent Profile ----- */
function hrcChip(un,code,canEdit){
  if(!code&&!canEdit) return '';
  return `<span class="hrc-chip" id="hrcChip">HR code: <b>${code?esc(code):'—'}</b>${canEdit?` <button type="button" class="hrc-ed" onclick="hrcEdit('${esc(un)}')" title="Edit HR code" aria-label="Edit HR code">✏️</button>`:''}</span>`;
}
function hrcEdit(un){
  const box=$('hrcChip'); if(!box) return;
  const cur=(S.agP&&S.agP.user&&S.agP.user.code)||'';
  box.innerHTML=`HR code: <input id="hrcIn" value="${esc(cur)}" placeholder="EMP-000" maxlength="30" autocapitalize="characters" spellcheck="false" aria-label="HR code"> <button type="button" class="btn small primary" id="hrcOk">Save</button> <button type="button" class="btn small ghost" id="hrcX">✕</button>`;
  const inp=$('hrcIn'); inp.focus(); inp.select();
  const done=c=>{ if(S.agP&&S.agP.user) S.agP.user.code=c; box.outerHTML=hrcChip(un,c,true); };
  $('hrcX').onclick=()=>done(cur);
  const save=async()=>{ $('hrcOk').disabled=true;
    try{ const r=await call('hrCodeSave',{username:un,code:inp.value}); hrcForget(); if(S.cache.users) refreshUsers(); Object.keys(S.fetched||{}).forEach(k=>{ if(k.indexOf('ag:')===0) S.fetched[k]=0; }); done(r.code||''); toast('اتحفظ ✓'); }
    catch(e){ toast(e.message); $('hrcOk').disabled=false; } };
  $('hrcOk').onclick=save; inp.onkeydown=e=>{ if(e.key==='Enter') save(); if(e.key==='Escape') done(cur); };
}

/* ----- قراءة ملف Excel (.xlsx) في المتصفح من غير مكتبة ----- */
async function xlInflate(bytes){
  const ds=new DecompressionStream('deflate-raw');
  const out=new Blob([bytes]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(out).arrayBuffer());
}
async function xlUnzip(buf){
  const b=new Uint8Array(buf), dv=new DataView(buf), files={};
  let e=b.length-22; while(e>=0&&dv.getUint32(e,true)!==0x06054b50) e--;
  if(e<0) throw new Error('الملف ده مش Excel (.xlsx)');
  const n=dv.getUint16(e+10,true); let p=dv.getUint32(e+16,true);
  const dec=new TextDecoder();
  for(let i=0;i<n;i++){
    if(dv.getUint32(p,true)!==0x02014b50) break;
    const method=dv.getUint16(p+10,true), csize=dv.getUint32(p+20,true), nl=dv.getUint16(p+28,true), xl=dv.getUint16(p+30,true), cl=dv.getUint16(p+32,true), off=dv.getUint32(p+42,true);
    const name=dec.decode(b.subarray(p+46,p+46+nl));
    const lnl=dv.getUint16(off+26,true), lxl=dv.getUint16(off+28,true), start=off+30+lnl+lxl;
    files[name]={method,data:b.subarray(start,start+csize)};
    p+=46+nl+xl+cl;
  }
  return async name=>{ const f=files[name]; if(!f) return null; const raw=f.method===8?await xlInflate(f.data):f.data; return dec.decode(raw); };
}
// أول شيت في الملف → صفوف (كل صف array من النصوص)
async function xlRead(file){
  const get=await xlUnzip(await file.arrayBuffer());
  const P=s=>new DOMParser().parseFromString(s||'<x/>','application/xml');
  const T=(el,tag)=>[...el.getElementsByTagNameNS('*',tag)];
  const ss=T(P(await get('xl/sharedStrings.xml')),'si').map(si=>T(si,'t').map(t=>t.textContent).join(''));
  let path='xl/worksheets/sheet1.xml';
  try{ const wb=P(await get('xl/workbook.xml')), rel=P(await get('xl/_rels/workbook.xml.rels'));
    const first=T(wb,'sheet')[0], rid=first&&(first.getAttribute('r:id')||first.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id'));
    const r=rid&&T(rel,'Relationship').find(x=>x.getAttribute('Id')===rid);
    if(r){ const tg=r.getAttribute('Target'); path=tg.charAt(0)==='/'?tg.slice(1):'xl/'+tg.replace(/^\.\//,''); } }catch(e){}
  const sh=P(await get(path)); if(!T(sh,'sheetData').length) throw new Error('مش لاقي شيت جوه الملف');
  const colIx=ref=>{ const m=/^([A-Z]+)/.exec(ref||''); if(!m) return -1; let n=0; for(const ch of m[1]) n=n*26+ch.charCodeAt(0)-64; return n-1; };
  return T(sh,'row').map(row=>{ const out=[]; T(row,'c').forEach((c,k)=>{ const t=c.getAttribute('t'), v=T(c,'v')[0], j=colIx(c.getAttribute('r')); let val='';
      if(t==='s') val=ss[Number(v&&v.textContent)]||''; else if(t==='inlineStr') val=T(c,'t').map(x=>x.textContent).join(''); else val=v?v.textContent:'';
      out[j>=0?j:k]=String(val).trim(); });
    for(let i=0;i<out.length;i++) if(out[i]==null) out[i]='';
    return out; }).filter(r=>r.some(x=>x));
}

/* ----- مطابقة سطور شيت الـ HR بالموظفين ----- */
function hrcNorm(s){
  return String(s||'').toLowerCase().replace(/[ً-ٰٟـ]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي')
    .replace(/[-_.'’`]/g,' ').replace(/\b(al|el)\s+(?=\S)/g,'').replace(/\s+/g,' ').trim();
}
// العناوين: الكود · الاسم بالعربي · الاسم بالإنجليزي · الوظيفة · الاسم في السيستم · الحالة (بأي ترتيب، عربي أو إنجليزي)
function hrcCols(head){
  const h=head.map(x=>hrcNorm(x)), f=re=>h.findIndex(x=>re.test(x));
  const sys=f(/ops681|السيستم|النظام|system/);
  const pick=(re,skip)=>h.findIndex((x,i)=>i!==skip&&i!==sys&&re.test(x));
  return { code:f(/^(الكود|كود|code|hr code|emp(loyee)? ?code|id)/), ar:pick(/عربي|arabic/), en:pick(/انجليزي|english/), job:f(/الوظيفه|وظيفه|job|title|position/), sys:sys, st:f(/الحاله|status/), name:pick(/^(الاسم|name)$/) };
}
function hrcMatch(rows,users){
  const hi=rows.findIndex(r=>{ const c=hrcCols(r); return c.code>=0&&(c.ar>=0||c.en>=0||c.sys>=0||c.name>=0); });
  if(hi<0) throw new Error('مش لاقي عمود "الكود" وعمود الاسم في أول الشيت');
  const C=hrcCols(rows[hi]), g=(r,i)=>i>=0?String(r[i]||'').trim():'';
  const U=users.map(u=>({u:u.username,name:u.name,n:hrcNorm(u.name),t:hrcNorm(u.name).split(' ').filter(Boolean),active:u.active,code:u.hrCode||''}));
  const byFull=k=>{ if(!k) return []; return U.filter(x=>x.n===k||hrcNorm(x.u)===k); };
  // كل كلمات اسم الموظف عندنا (2 على الأقل) موجودة في الاسم الكامل عند الـ HR، بنفس الترتيب
  const bySub=k=>{ if(!k) return []; const kt=k.split(' '); return U.filter(x=>{ if(x.t.length<2) return false; let i=0; for(const w of kt){ if(w===x.t[i]) i++; if(i===x.t.length) return true; } return false; }); };
  return rows.slice(hi+1).map(r=>{
    const o={code:g(r,C.code).toUpperCase().replace(/\s+/g,''),ar:g(r,C.ar)||(C.en<0?g(r,C.name):''),en:g(r,C.en)||(C.ar>=0?g(r,C.name):''),job:g(r,C.job),sys:g(r,C.sys),st:g(r,C.st),u:'',how:''};
    if(!o.code) return null;
    const tries=[['sys',byFull(hrcNorm(o.sys))],['name',byFull(hrcNorm(o.en))],['name',byFull(hrcNorm(o.ar))],['part',bySub(hrcNorm(o.en))],['part',bySub(hrcNorm(o.ar))]];
    for(const [how,L] of tries){ if(L.length===1){ o.u=L[0].u; o.how=how; break; } if(L.length>1&&!o.many) o.many=L.map(x=>x.u); }
    return o;
  }).filter(Boolean);
}

/* ----- شاشة الاستيراد ----- */
function hrcImport(){
  $('modalRoot').innerHTML=`<div class="modal"><div class="card hrc-imp" role="dialog" aria-modal="true" aria-label="Import HR codes">
    <h2>⬆ Import HR codes</h2>
    <p class="muted" style="margin:0 0 10px">Upload the HR sheet as it is (.xlsx). It needs a <b>code</b> column (الكود) and a name column. Each line is matched to an employee here; you check the list before anything is saved.</p>
    <input type="file" id="hrcF" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" aria-label="HR codes Excel file">
    <div id="hrcBody"></div><div class="err" id="hrcE"></div>
    <div class="mfoot"><button class="btn primary" id="hrcS" disabled>Save codes</button><button class="btn" onclick="closeModal()">Cancel</button></div>
  </div></div>`;
  $('hrcF').onchange=async e=>{
    const f=e.target.files[0]; if(!f) return; $('hrcE').textContent=''; $('hrcBody').innerHTML=LOADING;
    try{
      const [rows,U]=await Promise.all([xlRead(f),S.cache.users?Promise.resolve(S.cache.users):call('users').then(r=>{ S.cache.users=r; return r; })]);
      S.hrcRows=hrcMatch(rows,U); S.hrcU=U; hrcDraw();
    }catch(err){ $('hrcBody').innerHTML=''; $('hrcE').textContent=err.message||String(err); }
  };
}
function hrcDraw(){
  const R=S.hrcRows||[], U=(S.hrcU||[]).slice().sort((a,b)=>(b.active-a.active)||String(a.name).localeCompare(String(b.name)));
  const HOW={sys:'✓ system name',name:'✓ same name',part:'✓ name matches'};
  const opt=r=>`<option value="">— Skip —</option>`+U.map(u=>`<option value="${esc(u.username)}"${r.u===u.username?' selected':''}>${esc(u.name)}${u.active?'':' (archived)'}${u.hrCode&&u.hrCode!==r.code?' · now '+esc(u.hrCode):''}</option>`).join('');
  const cnt={}; R.forEach(r=>{ if(r.u) cnt[r.u]=(cnt[r.u]||0)+1; });
  const ok=R.filter(r=>r.u).length, miss=R.length-ok;
  const picked={}; R.forEach(r=>{ if(r.u) picked[r.u]=1; });
  const left=U.filter(u=>u.active&&!picked[u.username]);
  $('hrcBody').innerHTML=`<div class="hrc-sum"><span class="pill p-done">${ok} matched</span>${miss?`<span class="pill p-yel">${miss} not matched: pick the employee or leave Skip</span>`:''}</div>
    <div class="tbl-wrap"><table class="hrc-tbl"><thead><tr><th>Code</th><th>Name in the HR sheet</th><th>Job</th><th>Employee here</th></tr></thead><tbody>
    ${R.map((r,i)=>`<tr class="${!r.u?'hrc-miss':cnt[r.u]>1?'hrc-dup':''}"><td><b>${esc(r.code)}</b></td><td><div dir="auto">${esc(r.en||r.ar)}</div>${r.en&&r.ar?`<div class="sub2" dir="auto">${esc(r.ar)}</div>`:''}${r.st?`<div class="sub2" dir="auto">${esc(r.st)}</div>`:''}</td><td class="muted" style="font-size:12.5px">${esc(r.job)}</td>
      <td><select data-i="${i}" class="hrcSel" aria-label="Employee for ${esc(r.code)}">${opt(r)}</select><div class="sub2">${r.u?(cnt[r.u]>1?'⚠ picked twice':HOW[r.how]||'✓ picked by you'):r.many?'⚠ more than one name fits':'Not found: pick or Skip'}</div></td></tr>`).join('')}
    </tbody></table></div>
    ${left.length?`<p class="muted" style="font-size:12.5px;margin:10px 0 0">Active employees not in this list (${left.length}): ${left.map(u=>esc(u.name)+(u.hrCode?' ('+esc(u.hrCode)+')':'')).join(' · ')}</p>`:''}`;
  document.querySelectorAll('.hrcSel').forEach(s=>s.onchange=()=>{ const r=R[+s.dataset.i]; r.u=s.value; r.how=s.value?'me':''; hrcDraw(); });
  const dup=Object.keys(cnt).some(k=>cnt[k]>1);
  $('hrcS').disabled=!ok||dup; $('hrcS').textContent=dup?'Fix the employee picked twice':'Save '+ok+' codes';
  $('hrcS').onclick=async()=>{ $('hrcS').disabled=true; $('hrcE').textContent='';
    try{ const r=await call('hrCodeImport',{rows:R.filter(x=>x.u).map(x=>({username:x.u,code:x.code}))}); closeModal(); hrcForget(); refreshUsers(); toast('اتحفظ ✓ · '+r.saved+' كود جديد'+(r.same?' · '+r.same+' زي ما هو':'')); }
    catch(e){ $('hrcE').textContent=e.message; $('hrcS').disabled=false; } };
}
