/* ============ Export Excel (.xlsx) ============
   ملف Excel حقيقي من غير أي مكتبة من بره: ZIP بسيط (من غير ضغط) جواه شيت أو أكتر.
   كل صفحات الـ HR فيها زرار "Export Excel" فوق، بيصدّر الداتا اللي على الشاشة (بنفس الفلتر والشهر). */
const XL_CRC=(()=>{ const t=new Uint32Array(256); for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; t[n]=c>>>0; } return t; })();
function xlCrc(b){ let c=0xFFFFFFFF; for(let i=0;i<b.length;i++) c=XL_CRC[(c^b[i])&255]^(c>>>8); return (c^0xFFFFFFFF)>>>0; }
function xlZip(files){
  const enc=new TextEncoder(), parts=[], cd=[]; let off=0;
  const u16=v=>[v&255,(v>>>8)&255], u32=v=>[v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];
  files.forEach(f=>{
    const name=enc.encode(f.name), data=enc.encode(f.data), crc=xlCrc(data);
    const head=new Uint8Array([].concat([0x50,0x4b,3,4],u16(20),u16(0x0800),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0)));
    parts.push(head,name,data);
    cd.push(new Uint8Array([].concat([0x50,0x4b,1,2],u16(20),u16(20),u16(0x0800),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(off))),name);
    off+=head.length+name.length+data.length;
  });
  const cdLen=cd.reduce((s,a)=>s+a.length,0);
  const end=new Uint8Array([].concat([0x50,0x4b,5,6],u16(0),u16(0),u16(files.length),u16(files.length),u32(cdLen),u32(off),u16(0)));
  return new Blob(parts.concat(cd,[end]),{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
const xlEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');
function xlCol(i){ let s=''; i++; while(i>0){ const m=(i-1)%26; s=String.fromCharCode(65+m)+s; i=Math.floor((i-1)/26); } return s; }
// sheets: [{name, rows:[[...],[...]]}] أول صف = العناوين (Bold)
function xlBlob(sheets){
  sheets=sheets.filter(s=>s&&s.rows&&s.rows.length);
  if(!sheets.length) sheets=[{name:'Sheet1',rows:[['No data']]}];
  const used={}; sheets.forEach(s=>{ let n=String(s.name||'Sheet').replace(/[\\\/\?\*\[\]:]/g,' ').slice(0,31).trim()||'Sheet'; let k=n,i=2; while(used[k.toLowerCase()]) k=n.slice(0,28)+' '+(i++); used[k.toLowerCase()]=1; s._n=k; });
  const sheetXml=s=>{
    const w=s.rows.reduce((m,r)=>{ r.forEach((c,j)=>{ m[j]=Math.max(m[j]||8,Math.min(60,String(c==null?'':c).length+2)); }); return m; },[]);
    const rows=s.rows.map((r,i)=>`<row r="${i+1}">${r.map((c,j)=>{ const ref=xlCol(j)+(i+1), st=i===0?' s="1"':'';
      if(typeof c==='number'&&isFinite(c)) return `<c r="${ref}"${st}><v>${c}</v></c>`;
      if(c==null||c==='') return '';
      return `<c r="${ref}" t="inlineStr"${st}><is><t xml:space="preserve">${xlEsc(c)}</t></is></c>`; }).join('')}</row>`).join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${w.map((x,j)=>`<col min="${j+1}" max="${j+1}" width="${x}" customWidth="1"/>`).join('')}</cols><sheetData>${rows}</sheetData></worksheet>`;
  };
  const files=[
    {name:'[Content_Types].xml',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((s,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`},
    {name:'_rels/.rels',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`},
    {name:'xl/workbook.xml',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s,i)=>`<sheet name="${xlEsc(s._n)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`},
    {name:'xl/_rels/workbook.xml.rels',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((s,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`},
    {name:'xl/styles.xml',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDCEFEA"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf/><xf fontId="1" fillId="2" applyFont="1" applyFill="1"/></cellXfs></styleSheet>`}
  ].concat(sheets.map((s,i)=>({name:`xl/worksheets/sheet${i+1}.xml`,data:sheetXml(s)})));
  return xlZip(files);
}
function xlSave(filename,sheets){
  const url=URL.createObjectURL(xlBlob(sheets)), a=document.createElement('a');
  a.href=url; a.download=String(filename).replace(/[\\\/:*?"<>|]+/g,'-')+'.xlsx'; a.rel='noopener'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}
// أي جدول على الشاشة → صفوف (أرقام بتفضل أرقام)
function xlTableRows(tbl){
  return [...tbl.querySelectorAll('tr')].map(tr=>[...tr.querySelectorAll('th,td')].map(c=>{ const t=(c.innerText||c.textContent||'').replace(/\s+/g,' ').trim(); return /^-?\d+(\.\d+)?$/.test(t)?Number(t):t; })).filter(r=>r.some(c=>c!==''));
}
const xlToday=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Africa/Cairo'});

/* ----- زرار Export Excel في كل صفحات الـ HR ----- */
// كل صفحة ليها طريقة: من الداتا نفسها لو موجودة، وإلا من الجداول اللي على الشاشة
const XL_VIEWS={
  people:()=>{ const d=S.cache.people; if(!d) return null; const ST={in:'In',break:'On break',out:'Clocked out',absent:'Not in',leave:'On leave',stale:'Forgot to clock out',noclock:'Does not clock in'};
    return {name:'people-dashboard-'+(d.today||xlToday()),sheets:[
      {name:'People',rows:[['HR code','Name','Job','Department','State','In','Out','Hours today','Leave']].concat((d.people||[]).map(p=>[hrcOf(p.u),p.name,p.job,p.deptName,ST[p.state]||p.state,p.inT,p.outT,Number(p.hours)||0,p.leave]))},
      {name:'Alerts',rows:[['Type','Alert','Detail']].concat((d.alerts||[]).map(a=>[a.tag,a.title,a.detail]))},
      {name:'On leave today',rows:[['HR code','Name','Type','From','To','Days']].concat((d.onLeave||[]).map(r=>[hrcOf(r.u),r.name,r.typeLabel,r.from,r.to,r.days]))},
      {name:'Upcoming leave',rows:[['HR code','Name','Type','From','To','Days']].concat((d.upcoming||[]).map(r=>[hrcOf(r.u),r.name,r.typeLabel,r.from,r.to,r.days]))}]}; },
  kpis:()=>{ const B=S.kpiB; if(!B||!B.list) return null; const ax=['delivery','quality','attendance','compliance'].concat((B.cols||[]).map(c=>c.id)), nm=a=>((B.cols||[]).find(c=>c.id===a)||{}).name||a[0].toUpperCase()+a.slice(1);
    return {name:'scorecards-'+B.month,sheets:[{name:'Scorecards '+B.month,rows:[['Rank','HR code','Name','Job','Department','Score'].concat(ax.map(nm),['Load'])].concat(B.list.slice().sort((a,b)=>(b.total==null?-1:b.total)-(a.total==null?-1:a.total)).map((x,i)=>[i+1,hrcOf(x.u),x.name,x.job,x.deptName,x.total==null?'':x.total].concat(ax.map(a=>{ const v=(x.axes||{})[a]; return v==null?'':v==='pending'?'waiting':v; }),[x.load?(x.load.max?x.load.projects+'/'+x.load.max:(x.load.projects||'')):''])))}]}; },
  monthly:()=>{ if(typeof monthlyData==='undefined'||!monthlyData) return null; const L=typeof mrRows==='function'?mrRows(monthlyData):monthlyData.rows;
    return {name:'monthly-report-'+monthlyData.month,sheets:[{name:'Monthly '+monthlyData.month,rows:[['HR code','Name','Department','Job','Days present','Total hours','Avg per day','Leave days','Permission hours','Overtime hours','Missed clock-outs','Sharing stops','Screenshots','Active projects']].concat(L.map(x=>[hrcOf(x.username||x.u),x.name,x.deptName||'',x.job,x.days,x.hours,x.avg,x.leaveDays||0,x.permHours||0,x.otHours||0,x.missed,x.stops,x.shots,x.projects!=null?x.projects:'']))}]}; },
  users:()=>{ const U=S.cache.users; if(!U) return null; const T={full:'Full-time',part:'Part-time'};
    return {name:'employees-'+xlToday(),sheets:[{name:'Employees',rows:[['HR code','Name','Username','Job','Department','Role','Seats','Clocks in','Type','Work mode','Team leader','Shift (h)','Last login','Status']].concat(U.map(u=>[u.hrCode||'',u.name,u.username,u.job,u.dept,u.roleName,(u.seats||[]).join(', '),u.clocks?'Yes':'No',T[u.empType]||u.empType,u.workMode,u.teamLeader,u.shift,u.lastLogin?String(u.lastLogin):'',u.active?'Active':'Archived']))}]}; },
  leaves:()=>typeof lvXl==='function'?lvXl():null,
  agents:()=>typeof agXl==='function'?agXl():null
};
const XL_HR=['people','teamact','today','monthly','screen','kpis','users','devices','locations','leaves','agents'];
async function xlExportView(){
  const v=S.view, f=XL_VIEWS[v];
  try{ await hrcLoad(); }catch(e){}
  let x=null; try{ x=f?f():null; }catch(e){ x=null; }
  if(!x){
    const T=[...$('main').querySelectorAll('table')].filter(t=>t.offsetParent!==null||t.closest('.tbl-wrap'));
    if(!T.length){ toast('مفيش داتا على الشاشة تتصدّر'); return; }
    const title=($('pgTitle')&&$('pgTitle').textContent)||v;
    x={name:title.toLowerCase().replace(/\s+/g,'-')+'-'+xlToday(),sheets:T.map((t,i)=>{ const h=t.closest('.card')&&t.closest('.card').querySelector('h2,h3'); return {name:(h&&h.textContent.trim())||title+(T.length>1?' '+(i+1):''),rows:xlTableRows(t)}; })};
  }
  xlSave(x.name,x.sheets); toast('اتحمّل ملف الـ Excel ✓');
}
// الزرار بيتضاف لوحده جنب أزرار الصفحة (فوق) في صفحات الـ HR
(function(){
  const _st=setTop;
  setTop=function(title,sub,actions){
    _st(title,sub,actions);
    if(XL_HR.indexOf(S.view)>=0 && $('topActions') && !$('xlBtn')){
      const b=document.createElement('button'); b.className='btn'; b.id='xlBtn'; b.type='button'; b.innerHTML='⬇ Export Excel'; b.title='Download what is on this page as an Excel file'; b.onclick=xlExportView;
      $('topActions').appendChild(b);
    }
  };
})();
