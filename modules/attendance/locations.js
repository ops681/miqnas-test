/* ============ Locations ============
   أماكن الموظفين وقت الشيفت بس (للي معاه location.view). */
S.locDate=null;
function viewLocations(){
  const d=S.locDate||new Date().toISOString().slice(0,10);
  setTop('Locations','Where employees were during their shift · taken at clock-in and regularly after',`<input type="date" id="locD" value="${d}" style="width:auto">`);
  $('locD').onchange=()=>{ S.locDate=$('locD').value; viewLocations(); };
  $('main').innerHTML=LOADING;
  call('locView',{date:d}).then(renderLocations).catch(e=>{ $('main').innerHTML=`<div class="card err">${esc(e.message)}</div>`; });
}
function mapLink(p){ return `https://www.google.com/maps?q=${p.lat},${p.lng}`; }
function renderLocations(L){
  const P=L.people.slice().sort((a,b)=>(b.denied-a.denied)||(b.late-a.late)||(b.clockedIn-a.clockedIn)||(b.points-a.points));
  $('main').innerHTML=`<div class="card flush"><div class="tbl-wrap" style="border:0"><table style="min-width:820px">
    <tr><th>Employee</th><th>Now</th><th>Last location</th><th>Points</th><th>Turned off</th><th></th></tr>
    ${P.map(x=>`<tr><td><b>${esc(x.name)}</b><div class="sub2">${esc(x.job)}</div></td>
      <td>${x.clockedIn?'<span class="pill p-in">Clocked in</span>':'<span class="pill p-out">Not clocked in</span>'}${x.late?' <span class="pill p-bad">No recent location</span>':''}</td>
      <td>${x.last?`${esc(x.last.t)} · <a href="${mapLink(x.last)}" target="_blank" rel="noopener">Open map</a>${x.last.acc?` <span class="muted" style="font-size:12px">±${x.last.acc} m</span>`:''}`:'<span class="muted">—</span>'}</td>
      <td>${x.points}</td><td>${x.denied?`<span class="pill p-bad">${x.denied}</span>`:'0'}</td>
      <td>${x.list.length?`<details><summary style="cursor:pointer">All (${x.list.length})</summary><div style="margin-top:6px">${x.list.map(p=>`<div style="font-size:12.5px;margin:3px 0">${esc(p.t)} · ${p.event==='denied'?'<span style="color:var(--bad)">Location turned off</span>':`<a href="${mapLink(p)}" target="_blank" rel="noopener">${esc(p.event)}</a>`}</div>`).join('')}</div></details>`:''}</td></tr>`).join('')||'<tr><td colspan="6" class="muted">No employees clock in.</td></tr>'}
  </table></div></div>
  <p class="muted" style="font-size:12.5px;margin-top:10px">Location is taken every ${L.every} minutes during the shift only. "No recent location" means nothing arrived for more than twice that time.</p>`;
}
