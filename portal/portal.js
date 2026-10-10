/* ============ بورتال الشركاء (زد) ============
   صفحة لوحدها من غير لوجين: المفتاح في اللينك (?k=...). للاطلاع بس.
   البيانات جاية من السيرفر محسوبة من المشاريع والتاسكات والبلوكرز. */
const PT = { key: new URLSearchParams(location.search).get('k') || '', all: false, month: '', q: '', f: 'all', data: null, open: '' };
const pe = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const AR_M = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const mName = m => { const p = String(m).split('-'); return AR_M[+p[1] - 1] + ' ' + p[0]; };
const dShort = d => d ? String(d).slice(5) : '—';
const PT_CHIPS = [
  ['all', 'الكل', '#C9D6D2', () => true],
  ['wait', 'لم يبدأ', '#F2B84B', s => s.status === 'brief' || s.status === 'ready'],
  ['delivery', 'قيد التنفيذ', '#B69CF5', s => s.status === 'delivery' || s.status === 'qa'],
  ['review', 'مراجعة العميل', '#6EA8F7', s => s.status === 'review'],
  ['blocked', 'عائق', '#F0706A', s => s.blockers.length > 0],
  ['live', 'تم الإطلاق', '#2BB39A', s => s.status === 'done' || s.status === 'support'],
  ['hold', 'متوقف', '#9DB0AA', s => s.status === 'hold' || s.status === 'cancelled']
];
function ago(ms) {
  if (!ms) return '—';
  const m = Math.round((Date.now() - ms) / 6e4);
  if (m < 1) return 'الآن'; if (m < 60) return 'منذ ' + m + ' دقيقة';
  const h = Math.round(m / 60); if (h < 24) return 'منذ ' + h + (h === 1 ? ' ساعة' : ' ساعات');
  const d = Math.round(h / 24); if (d === 1) return 'منذ يوم'; if (d === 2) return 'منذ يومين'; return 'منذ ' + d + (d <= 10 ? ' أيام' : ' يوم');
}
function ptCall() {
  return fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'portal', k: PT.key, month: PT.month, all: PT.all }) })
    .then(r => r.json()).then(r => { if (!r || !r.ok) throw new Error((r && r.error) || 'حصل خطأ'); return r.data; });
}
function ptLoad(quiet) {
  if (!PT.key) { ptErr('اللينك ناقص. اطلب اللينك الصحيح من مِقناص'); return; }
  if (!quiet && !PT.data) document.getElementById('pt').innerHTML = '<div class="pt-load">جاري التحميل...</div>';
  ptCall().then(d => { PT.data = d; if (!PT.month) PT.month = d.month; ptRender(); }).catch(e => { if (!PT.data) ptErr(e.message); });
}
function ptErr(msg) { document.getElementById('pt').innerHTML = '<div class="pt-err"><div><div class="pt-logo" style="margin:0 auto 14px">M</div>' + pe(msg) + '</div></div>'; }
function ptList() {
  const q = PT.q.trim().toLowerCase(), chip = PT_CHIPS.find(c => c[0] === PT.f) || PT_CHIPS[0];
  return PT.data.stores.filter(s => chip[3](s) && (!q || [s.name, s.storeId, s.ref, s.url, s.live].some(v => String(v || '').toLowerCase().indexOf(q) >= 0)));
}
function ptRender() {
  const d = PT.data; if (!d) return;
  if (PT.open) { const s = d.stores.find(x => x.id === PT.open); if (s) return ptDetail(s); PT.open = ''; }
  const k = d.kpis, L = ptList();
  const months = []; { const [y0, m0] = d.first.split('-').map(Number); const cur = new Date(); let y = y0, m = m0; while (y < cur.getFullYear() || (y === cur.getFullYear() && m <= cur.getMonth() + 1)) { months.push(y + '-' + String(m).padStart(2, '0')); m++; if (m > 12) { m = 1; y++; } } }
  const counts = {}; PT_CHIPS.forEach(c => { counts[c[0]] = d.stores.filter(c[3]).length; });
  const focus = document.activeElement && document.activeElement.id === 'ptQ';
  document.getElementById('pt').innerHTML = `<div class="pt-wrap">
  <header class="pt-head"><div class="pt-logo" aria-hidden="true">M</div>
    <div class="pt-title"><b>مِقناص × زد</b><span>بورتال الشركاء · تقرير التسليم</span></div>
    <span class="pt-upd">محدّث ${pe(ago(d.at))}</span></header>
  <div class="pt-bar">
    <div class="pt-tabs" role="tablist"><button type="button" role="tab" aria-selected="${!d.all}" class="${d.all ? '' : 'on'}" onclick="ptSet('all',false)">متاجر الشهر</button><button type="button" role="tab" aria-selected="${d.all}" class="${d.all ? 'on' : ''}" onclick="ptSet('all',true)">كل المتاجر</button></div>
    ${d.all ? '' : `<label class="pt-field month"><small>الشهر</small><select aria-label="الشهر" onchange="ptSet('month',this.value)">${months.reverse().map(m => `<option value="${m}"${m === d.month ? ' selected' : ''}>${mName(m)}</option>`).join('')}</select></label>`}
    <button type="button" class="pt-btn" onclick="ptExport()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>تصدير Excel</button>
  </div>
  <label class="pt-field search"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9DB0AA" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="ptQ" placeholder="ابحث برقم المتجر أو اسمه" aria-label="بحث" value="${pe(PT.q)}" oninput="PT.q=this.value;ptRender()"></label>
  <section class="pt-kpis" aria-label="ملخص">
    <div class="pt-k main"><span>${d.all ? 'إجمالي المتاجر المحالة' : 'متاجر ' + pe(mName(d.month))}</span><b>${k.total}</b><small>${k.isNew} جديد${d.all ? '' : ' هذا الشهر'}</small></div>
    <div class="pt-k"><span>قيد التنفيذ</span><b style="color:var(--warn)">${k.delivery}</b></div>
    <div class="pt-k"><span>تم الإطلاق</span><b style="color:var(--ok)">${k.launched}</b>${k.onTimePct !== null ? `<small>${k.onTimePct}% في الموعد</small>` : ''}</div>
    <div class="pt-k"><span>عوائق مفتوحة</span><b style="color:${k.blockClient + k.blockZid ? 'var(--bad)' : 'var(--ink)'}">${k.blockClient + k.blockZid}</b><small>${k.blockClient} العميل · ${k.blockZid} زد</small></div>
    <div class="pt-k"><span>متوسط التقدم</span><div class="meter"><b>${k.avgPct}%</b><span class="pt-track ok"><i style="width:${k.avgPct}%"></i></span></div></div>
    <div class="pt-k"><span>متوسط مدة التسليم</span><b>${k.avgDays === null ? '—' : k.avgDays + ' <small style="font-size:13px">يوم</small>'}</b></div>
  </section>
  <div class="pt-chips"><span>تصفية بالحالة</span>${PT_CHIPS.map(c => `<button type="button" class="pt-chip${PT.f === c[0] ? ' on' : ''}" aria-pressed="${PT.f === c[0]}" onclick="PT.f='${c[0]}';ptRender()"><i style="background:${c[2]}"></i>${c[1]}<em>${counts[c[0]]}</em></button>`).join('')}</div>
  <div class="pt-grid">${L.length ? L.map(ptCard).join('') : '<div class="pt-empty">مفيش متاجر هنا</div>'}</div>
  <div class="pt-end"><span>عرض ${L.length} من ${d.stores.length} متجر</span><span>مِقناص · تقرير للشريك · للاطلاع فقط</span></div>
  </div>`;
  if (focus) { const q = document.getElementById('ptQ'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
}
const DOM_TXT = { live: 'الدومين: متصل', prog: 'الدومين: قيد الربط', todo: 'الدومين: لم يبدأ' };
function ptCard(s) {
  const b = s.blockers[0];
  return `<button type="button" class="pt-card" onclick="ptOpen('${pe(s.id)}')">
    <div class="pt-top"><b dir="auto">${pe(s.name)}</b>${s.url || s.live ? `<span class="u" dir="ltr">${pe(String(s.live || s.url).replace(/^https?:\/\//, '').replace(/\/$/, ''))}</span>` : ''}
      ${s.storeId || s.ref ? `<span class="pt-id" dir="ltr">${s.storeId ? '#' + pe(s.storeId) : pe(s.ref)}</span>` : ''}
      <div class="pt-pills"><span class="pill s-${s.status}">${pe(s.statusName)}</span>${b ? `<span class="pill p-block">متوقف · ${pe(b.owner)} · ${b.days} ${b.days === 1 ? 'يوم' : 'أيام'}</span>` : ''}${s.domain ? `<span class="pill p-dom">${DOM_TXT[s.domain]}</span>` : ''}</div></div>
    <div class="pt-prog"><div><span>تقدّم مراحل التنفيذ</span><b dir="ltr">${s.pct}% · ${s.stagesDone}/${s.stagesAll}</b></div><span class="pt-track${s.pct === 100 ? ' ok' : ''}"><i style="width:${s.pct}%"></i></span></div>
    <div class="pt-foot">
      <div><span>تاريخ البدء</span><b class="num" dir="ltr">${dShort(s.start)}</b><small>${s.goLive ? 'الإطلاق ' + dShort(s.goLive) : 'المستهدف ' + dShort(s.target)}</small></div>
      <div class="pt-ring ${s.health}" aria-label="${s.days === null ? '' : s.days + ' يوم'}"><b>${s.days === null ? '—' : s.days}</b><span>يوم</span></div>
      <div><span>آخر تحديث</span><b>${pe(ago(s.lastAt))}</b><small dir="auto">${pe(s.lastText)}</small></div>
    </div></button>`;
}
const ST_TXT = { done: 'مكتمل', prog: 'قيد التنفيذ', wait: 'عند العميل', todo: 'لم يبدأ', na: 'لا ينطبق' };
function ptDetail(s) {
  const done = s.stages.filter(x => x.st === 'done').length;
  const qaDone = s.qa.filter(x => x.st === 'done').length;
  document.getElementById('pt').innerHTML = `<div class="pt-wrap"><div class="pt-d">
    <button type="button" class="pt-back" onclick="ptOpen('')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>كل المتاجر</button>
    <section class="pt-sec">
      <div style="display:flex;flex-direction:column;gap:4px"><span class="num" style="font-size:12px;color:var(--mut)" dir="ltr">${[s.ref, s.storeId ? '#' + s.storeId : ''].filter(Boolean).map(pe).join(' · ')}</span>
        <h1 dir="auto">${pe(s.name)}</h1>${s.live || s.url ? `<a href="${pe(/^https?:/.test(s.live || s.url) ? (s.live || s.url) : 'https://' + (s.live || s.url))}" target="_blank" rel="noopener noreferrer" dir="ltr" style="font-size:13px">${pe(String(s.live || s.url).replace(/^https?:\/\//, ''))}</a>` : ''}</div>
      <div class="pt-pills" style="justify-content:flex-start;margin:0"><span class="pill s-${s.status}">${pe(s.statusName)}</span>${s.sla === 'client' ? '<span class="pill p-block">SLA متوقف · من العميل</span>' : s.sla === 'zid' ? '<span class="pill p-block">SLA متوقف · من زد</span>' : ''}<span class="pill s-hold">${pe([s.from && s.from !== 'None' ? 'نقل من ' + s.from : 'متجر جديد', s.mode].filter(Boolean).join(' · '))}</span>${s.priority ? `<span class="pill s-hold">الأولوية: ${pe(s.priority)}</span>` : ''}</div>
      <div class="pt-dates"><div><span>الإحالة</span><b dir="ltr">${dShort(s.referral)}</b></div><div><span>البدء</span><b dir="ltr">${dShort(s.start)}</b></div><div><span>المستهدف</span><b dir="ltr">${dShort(s.target)}</b></div><div><span>الإطلاق</span><b dir="ltr">${dShort(s.goLive)}</b></div></div>
      <div class="pt-prog"><div><span>التقدم الكلي</span><b>${s.pct}%</b></div><span class="pt-track${s.pct === 100 ? ' ok' : ''}" style="height:8px"><i style="width:${s.pct}%"></i></span></div>
    </section>
    ${s.blockers.map(b => `<section class="pt-sec pt-blk"><h2><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F7A29D" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>عائق مفتوح · ${b.days} ${b.days === 1 ? 'يوم' : 'أيام'}</h2><p dir="auto">${pe(b.text)}</p><div class="pt-pills" style="justify-content:flex-start;margin:0"><span class="pill p-block">المسؤول: ${pe(b.owner)}</span><span class="pill p-block">${pe(b.cat)}</span>${b.since ? `<span class="pill p-block">منذ ${dShort(b.since)}</span>` : ''}</div></section>`).join('')}
    <section class="pt-sec"><h2>مراحل التنفيذ <small>${done} / ${s.stages.filter(x => x.st !== 'na').length}</small></h2>
      <div>${s.stages.map(x => `<div class="pt-st ${x.st}"><span class="d" aria-hidden="true">${x.st === 'done' ? '✓' : x.st === 'prog' ? '•' : x.st === 'wait' ? '…' : x.st === 'na' ? '–' : ''}</span><span>${pe(x.name)}</span><em>${ST_TXT[x.st]}</em></div>`).join('')}</div></section>
    ${s.qa.length ? `<section class="pt-sec"><h2>فحص النقل التقني <small>${qaDone} / ${s.qa.length}</small></h2><div class="pt-qa">${s.qa.map(q => `<div class="${q.st}"><i aria-hidden="true"></i>${pe(q.name)}</div>`).join('')}</div></section>` : ''}
    <section class="pt-sec"><h2>آخر التحديثات</h2>${s.log.length ? s.log.map(l => { const dt = new Date(l.at); return `<div class="pt-log"><div><b dir="ltr">${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}</b><span>${dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span></div><div><em>${pe(l.type)}</em><p dir="auto">${pe(l.text)}</p>${l.next ? `<small dir="auto">الخطوة الجاية: ${pe(l.next)}</small>` : ''}</div></div>`; }).join('') : '<div style="color:var(--mut);font-size:13px">لسه مفيش تحديثات</div>'}</section>
    <div class="pt-end">المعلومات دي بتتحدث تلقائياً من سيستم مِقناص · للاطلاع فقط</div>
  </div></div>`;
  window.scrollTo(0, 0);
}
function ptOpen(id) { if (id) PT.y = window.scrollY; PT.open = id; history.replaceState(null, '', location.pathname + location.search + (id ? '#s=' + encodeURIComponent(id) : '')); ptRender(); if (!id) window.scrollTo(0, PT.y || 0); }
function ptSet(k, v) { PT[k] = v; if (k === 'all') PT.f = 'all'; ptLoad(); }
function ptExport() {
  const L = ptList(), csv = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const head = ['Zid Ref', 'Store', 'Store ID', 'Store URL', 'Live Domain', 'Status', 'SLA', 'Progress %', 'Stages', 'Referral', 'Start', 'Target Launch', 'Actual Launch', 'Days', 'Open Blockers', 'Blocker Owner', 'Source Platform', 'Delivery Mode', 'Priority', 'Last Update'];
  const SLA = { run: 'Running', client: 'Paused - Client', zid: 'Paused - Zid', hold: 'On Hold', closed: 'Closed' };
  const rows = L.map(s => [s.ref, s.name, s.storeId, s.url, s.live, s.statusName, SLA[s.sla] || s.sla, s.pct, s.stagesDone + '/' + s.stagesAll, s.referral, s.start, s.target, s.goLive, s.days, s.blockers.length, s.blockers.map(b => b.owner).join(' / '), s.from, s.mode, s.priority, s.lastText]);
  const txt = '﻿' + [head].concat(rows).map(r => r.map(csv).join(',')).join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' }));
  a.download = 'Miqnas-Zid-' + (PT.data.all ? 'all' : PT.data.month) + '.csv'; document.body.appendChild(a); a.click(); a.remove();
}
(function () {
  const m = location.hash.match(/s=([^&]+)/); if (m) PT.open = decodeURIComponent(m[1]);
  ptLoad();
  setInterval(() => { if (document.visibilityState === 'visible') ptLoad(true); }, 5 * 60000);
})();
