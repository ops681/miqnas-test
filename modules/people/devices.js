/* ============ Devices ============
   كل موظف ليه جهاز واحد مسجل. الدخول من جهاز تاني محتاج موافقة من هنا. */
function viewDevices(){
  setTop('Devices','One registered device per employee · sign-in from any other device needs approval');
  swr('devices','devicesList',{},renderDevices);
}
function renderDevices(D){
  const who=r=>`<div style="display:flex;align-items:center;gap:10px"><div class="av">${esc(initials(r.name))}</div><div><b>${esc(r.name)}</b><div class="sub2">${esc(r.u)}</div></div></div>`;
  const blocked=r=>`<span class="muted" style="font-size:12.5px">${esc(r.block)}</span>`;
  const ST={active:'Approved',rejected:'Rejected',replaced:'Removed',pending:'Waiting'};
  $('main').innerHTML=`<div style="display:grid;gap:22px">
  <div class="card flush"><div class="chead"><h2>Waiting for approval <span class="muted" style="font-weight:400">· ${D.pending.length}</span></h2></div>
    ${D.pending.length?`<div class="tbl-wrap" style="border:0"><table style="min-width:720px"><tr><th>Employee</th><th>New device</th><th>Requested</th><th></th></tr>
    ${D.pending.map(r=>`<tr><td>${who(r)}</td><td>${esc(r.label)}</td><td class="muted">${esc(r.requestedAt)}</td>
      <td style="white-space:nowrap;text-align:end">${r.block?blocked(r):`<button class="btn small primary" onclick="devDecide('${esc(r.id)}','approve')">Approve</button> <button class="btn small danger" onclick="devDecide('${esc(r.id)}','reject')">Reject</button>`}</td></tr>`).join('')}
    </table></div>`:`<div class="empty" style="padding:22px"><b>No requests</b>Nobody is waiting for a new device.</div>`}
    <div class="muted" style="font-size:12.5px;padding:0 20px 16px">Approving replaces the employee's current device and signs them out of it.</div></div>

  <div class="card flush"><div class="chead"><h2>Registered devices <span class="muted" style="font-weight:400">· ${D.active.length}</span></h2></div>
    <div class="tbl-wrap" style="border:0"><table style="min-width:760px"><tr><th>Employee</th><th>Device</th><th>Since</th><th>Approved by</th><th></th></tr>
    ${D.active.map(r=>`<tr><td>${who(r)}</td><td>${esc(r.label)}</td><td class="muted">${esc(r.decidedAt||r.requestedAt)}</td><td class="muted">${esc(r.decidedBy)}</td>
      <td style="text-align:end">${r.block?'':`<button class="btn small ghost danger" onclick="devDecide('${esc(r.id)}','reset')">Reset</button>`}</td></tr>`).join('')}
    ${D.none.map(r=>`<tr><td>${who(r)}</td><td class="muted" colspan="4">No device yet · the next sign-in registers it automatically</td></tr>`).join('')}
    </table></div>
    <div class="muted" style="font-size:12.5px;padding:0 20px 16px">Reset removes the device and signs the employee out. The next device they sign in from is registered automatically, so use it only when you trust that sign-in.</div></div>

  ${D.history.length?`<div class="card flush"><div class="chead"><h2>History</h2></div>
    <div class="tbl-wrap" style="border:0"><table style="min-width:760px"><tr><th>Employee</th><th>Device</th><th>Result</th><th>By</th><th>When</th><th>Note</th></tr>
    ${D.history.map(r=>`<tr><td><b>${esc(r.name)}</b></td><td>${esc(r.label)}</td><td>${esc(ST[r.status]||r.status)}${r.status==='rejected'&&!r.block?` <button class="btn small ghost" onclick="devDecide('${esc(r.id)}','approve')">Approve</button>`:''}</td><td class="muted">${esc(r.decidedBy)}</td><td class="muted">${esc(r.decidedAt)}</td><td class="muted" style="font-size:13px">${esc(r.note)}</td></tr>`).join('')}
    </table></div></div>`:''}
  </div>`;
}
async function devDecide(id,decision){
  const ask={approve:'توافق على الجهاز ده؟ الجهاز القديم هيخرج من السيستم.',reject:'ترفض الجهاز ده؟',reset:'تشيل الجهاز ده؟ الموظف هيخرج، وأول جهاز يدخل منه بعد كده هيتسجل لوحده.'}[decision];
  if(!confirm(ask)) return;
  let note='';
  if(decision!=='approve'){ note=prompt('سبب (اختياري):','')||''; }
  try{
    const r=await call('deviceDecide',{id,decision,note});
    S.cache.devices=r; S.fetched.devices=Date.now();
    toast('اتسجل ✓'); renderDevices(r); refreshDash();
  }catch(e){ alert(e.message); }
}
