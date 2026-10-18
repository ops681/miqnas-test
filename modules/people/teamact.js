/* ============ Team Activity: كل موظف عمل إيه في اليوم + Live Activity على الداشبورد ============ */
S.ta={date:'',user:''};
function viewTeamAct(){
  setTop('Team Activity','What each person worked on', `<button class="btn" onclick="viewTeamAct()">Refresh</button>`);
  const c=S.cache.ta; if(c && c.date===(S.ta.date||c.today)) renderTeamAct(c); else $('main').innerHTML=LOADING;
  call('teamActivity',{date:S.ta.date||''}).then(r=>{ S.cache.ta=r; if(S.view==='teamact') renderTeamAct(r); }).catch(e=>{ $('main').innerHTML=`<div class="card err">${esc(e.message)}</div>`; });
}
const taHM=m=>{ m=Math.round(m||0); return m>=60?Math.floor(m/60)+'h '+String(m%60).padStart(2,'0')+'m':m+'m'; };
function taIcon(a){ return /Done/.test(a)?'✅':/Timer started/.test(a)?'▶️':/Timer stopped|stopped/.test(a)?'⏸':/In Progress/.test(a)?'🔵':/Revision|note/i.test(a)?'📝':/Helper/.test(a)?'🤝':/Working on it/.test(a)?'🙋':'•'; }
function renderTeamAct(r){
  const L=r.list.filter(x=>!S.ta.user||x.u===S.ta.user);
  const all=r.list;
  $('main').innerHTML=`<div class="en">
    <div class="ta-bar"><label>Day</label><input type="date" id="taD" value="${esc(r.date)}" max="${esc(r.today)}">
      <label>Person</label><select id="taU"><option value="">Everyone (${all.length})</option>${all.map(x=>`<option value="${esc(x.u)}"${S.ta.user===x.u?' selected':''}>${esc(x.name)}</option>`).join('')}</select>
      ${r.date!==r.today?`<button class="btn ghost small" onclick="S.ta.date='';viewTeamAct()">Today</button>`:''}${r.holiday?`<span class="pill" style="background:var(--bluebg);color:var(--blue)">🎉 ${esc(r.holiday)}</span>`:''}</div>
    ${L.length?L.map(x=>{
      const brk=x.breaks.reduce((s,b)=>s+(b.mins||0),0);
      return `<div class="card ta-c">
      <div class="ta-h"><span class="av" data-u="${esc(x.u)}">${esc(initials(x.name))}</span><div><b>${bd(x.name)}</b><div class="sub2">${esc(x.job||'')}</div></div><span class="spacer"></span>
        ${x.leave&&!x.sessions.length?`<span class="pill" style="background:var(--bluebg);color:var(--blue)">🌴 On leave</span>`:`<span class="pill p-in">${x.hours} h</span>`}${x.doneCount?`<span class="pill p-in">✅ ${x.doneCount} done</span>`:''}${brk?`<span class="pill p-yel">☕ ${taHM(brk)}</span>`:''}</div>
      <div class="ta-row"><span class="ta-l">Time clock</span><span>${x.sessions.length?x.sessions.map(s=>`${s.inDate?`<span class="pill p-yel" style="font-size:11px">since ${esc(fmtDay(s.inDate))}</span> `:''}${esc(s.inT)} → ${s.open?'<b style="color:var(--ok)">still in</b>':esc(s.outT)+aoTag(s.auto)} <span class="muted">(${s.hours} h)</span>`).join(' · '):(x.leave?`<span class="pill" style="background:var(--bluebg);color:var(--blue)">🌴 On leave · ${esc(x.leave)}</span>`:r.holiday?`<span class="pill" style="background:var(--bluebg);color:var(--blue)">🎉 Holiday · ${esc(r.holiday)}</span>`:`<span class="muted">No clock-in on ${r.date===r.today?'today':esc(fmtDay(r.date))}</span>`)}</span></div>
      ${x.breaks.length?`<div class="ta-row"><span class="ta-l">Breaks</span><span>${x.breaks.map(b=>`<span class="ta-b${b.mins!=null&&b.mins>b.paid&&b.reason!=='Paid break'?' over':''}">${esc(b.from)}–${b.to?esc(b.to):'now'}${b.mins!=null?' · '+taHM(b.mins):''} · ${bd(b.reason==='Paid break'?'☕ paid':b.reason)}</span>`).join(' ')}</span></div>`:''}
      ${x.inProgress.length?`<div class="ta-row"><span class="ta-l">Working on</span><span>${x.inProgress.map(t=>`<span class="ta-ip">${t.running?'⏱ ':'🔵 '}${esc(t.task)} <span class="muted">· ${bd(t.client)}</span></span>`).join(' ')}</span></div>`:''}
      ${x.tasks.length?`<table class="ta-t"><tr><th>Task</th><th>Project</th><th>Time</th><th></th></tr>${x.tasks.map(t=>`<tr><td>${esc(t.task)}</td><td>${bd(t.client)} <span class="muted">${esc(t.project)}</span></td><td>${t.mins?taHM(t.mins):'—'}</td><td>${t.done?'✅ Done':t.progress?'🔵 In progress':''}</td></tr>`).join('')}</table>`:''}
      ${x.events.length?`<details class="ta-ev"><summary>Timeline (${x.events.length})</summary>${x.events.map(e=>`<div><span class="muted">${esc(e.time)}</span> ${taIcon(e.action)} ${esc(e.action)}${e.mins?' · '+taHM(e.mins):''} <span class="muted">· ${esc(e.task)} · ${bd(e.client)}</span></div>`).join('')}</details>`:''}
    </div>`;}).join(''):'<div class="card muted">Nothing recorded for this day.</div>'}</div>`;
  $('taD').onchange=e=>{ S.ta.date=e.target.value; viewTeamAct(); };
  $('taU').onchange=e=>{ S.ta.user=e.target.value; renderTeamAct(r); };
  if(typeof avApply==='function') avApply($('main'));
}
// Live Activity: كارت في الداشبورد بيتحدث كل دقيقة
async function liveActLoad(){
  const box=$('liveAct'); if(!box) return;
  try{ const r=await call('liveActivity',{limit:40}); if(!$('liveAct')) return;
    const ic={done:'✅',timer:'⏱',task:'🔵',clock:'🕘',break:'☕'};
    $('liveAct').innerHTML=`<div class="card la-c"><div class="chead" style="padding:0 0 8px"><h2 style="margin:0">⚡ Live Activity</h2><span class="muted" style="font-size:12.5px">today · updated ${esc(r.now)}</span><span class="spacer"></span><button class="btn ghost small" onclick="go('teamact')">Team Activity →</button></div>
      ${r.list.length?`<div class="la-list">${r.list.map(e=>`<div class="la-i"><span class="la-t">${esc(e.time)}</span><span class="la-ic">${ic[e.kind]||'•'}</span><span><b>${bd(e.who)}</b> ${esc(e.text)}${e.sub?` <span class="muted">· ${bd(e.sub)}</span>`:''}</span></div>`).join('')}</div>`:'<div class="muted">Nothing yet today.</div>'}</div>`;
  }catch(e){ box.innerHTML=''; }
  clearTimeout(S.laT); S.laT=setTimeout(()=>{ if(S.view==='dash') liveActLoad(); },60000);
}
