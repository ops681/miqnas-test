/* ============ صفحات جاية قريب ============
   أماكن محجوزة لـ Line 2 و Sales CRM لحد ما نبنيهم. */
const SOON={
  line2:{title:'Line 2 · Marketing & Growth',sub:'Creative · Content · Performance · SEO · Growth',icon:'trend',
    items:['Retainer clients and monthly deliverables per service','Content calendar and approvals','Campaigns and performance reports','Team workload across Line 1 and Line 2']},
  sales:{title:'Sales CRM',sub:'Leads · Pipeline · Proposals · Won / Lost',icon:'chart',
    items:['Leads from every source in one place','Pipeline stages with follow-ups and reminders','Proposals and won/lost reasons','Won deal hands over to an Account Manager and starts delivery','Commercial Pulse filled automatically from the pipeline']}
};
function viewSoon(k){
  const s=SOON[k];
  setTop(s.title,s.sub);
  $('main').innerHTML=`<div class="card" style="max-width:640px;margin:30px auto;padding:34px 30px;text-align:center">
    <div style="display:inline-grid;place-items:center;width:56px;height:56px;border-radius:16px;background:var(--bluebg);color:var(--blue);margin-bottom:14px">${ico(s.icon,28)}</div>
    <div><span class="pill" style="background:var(--warnbg);color:var(--warn)">Coming soon</span></div>
    <h2 style="margin:12px 0 6px">${esc(s.title)}</h2>
    <p class="muted" style="margin:0 0 18px">This part of the system is being prepared. Here is what it will include:</p>
    <div style="text-align:left;display:inline-block">${s.items.map(i=>`<div style="display:flex;gap:10px;margin:8px 0"><span style="color:var(--brand2)">✓</span><span>${esc(i)}</span></div>`).join('')}</div>
  </div>`;
}
