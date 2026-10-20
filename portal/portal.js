/* ============ بورتال الشركاء (زد وأي شريك تاني) ============
   صفحة لوحدها: المفتاح في اللينك (?k=...) + يوزر وباسورد بتحددهم الإدارة. للاطلاع بس.
   البيانات جاية من السيرفر محسوبة من المشاريع والتاسكات والبلوكرز. */
const PT = { key: new URLSearchParams(location.search).get('k') || '', t: '', info: null, all: false, month: '', q: '', f: 'all', data: null, open: '', view: 'cards', tf: '', topen: '', tm: '' };
const pe = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// النص العربي اللي فيه كلام إنجليزي يتعرض من اليمين (مايتشقلبش)
const pdir = s => { s = String(s == null ? '' : s); const a = (s.match(/[\u0600-\u06FF]/g) || []).length; return a > 0 && a >= (s.match(/[A-Za-z]/g) || []).length ? 'dir="rtl"' : 'dir="auto"'; };
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
const ptStoreKey = () => 'pt_t_' + PT.key.slice(0, 12);
function ptTok(v) { try { if (v === undefined) return localStorage.getItem(ptStoreKey()) || ''; if (v) localStorage.setItem(ptStoreKey(), v); else localStorage.removeItem(ptStoreKey()); } catch (e) {} return v || ''; }
function ptPost(body) {
  return fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ k: PT.key, t: PT.t }, body)) })
    .then(r => r.json()).then(r => { if (!r || !r.ok) { const e = new Error((r && r.error) || 'حصل خطأ'); if (e.message === 'PT_LOGIN') e.login = true; throw e; } return r.data; });
}
const ptName = () => (PT.info && PT.info.name) || 'الشريك';
// لوجو الشركة (من Settings) + لوجو الشريك (من صفحة Partners)
PT.brand = null;
try { PT.brand = JSON.parse(localStorage.getItem('pt_brand') || 'null'); } catch (e) {}
function ptBrand() { return ptPost({ action: 'brand' }).then(b => { PT.brand = b; try { localStorage.setItem('pt_brand', JSON.stringify(b)); } catch (e) {} if (PT.data) ptRender(); else if (!PT.t && PT.info) ptLoginView(); }).catch(() => {}); }
function ptMark(info) {
  const B = PT.brand && PT.brand.logo ? `<div class="pt-logo pt-img" aria-hidden="true"><img src="${pe(PT.brand.logo)}" alt=""></div>` : '<div class="pt-logo" aria-hidden="true">M</div>';
  const b = info && info.logo ? `<div class="pt-logo pt-plogo pt-img" aria-hidden="true"><img src="${pe(info.logo)}" alt=""></div>`
    : info && info.letter ? `<div class="pt-logo pt-plogo" style="background:${pe(info.color || '#7C5CFC')}" aria-hidden="true">${pe(info.letter)}</div>` : '';
  return `<div class="pt-logos">${B}${b}</div>`;
}
function ptSetInfo(i) { if (!i) return; PT.info = i; document.title = 'مِقناص × ' + i.name + ' · بورتال الشركاء'; }
// لوجوهات المتاجر: بتتجاب مرة وتتحفظ في البراوزر لحد ما نسختها تتغير
PT.icons = { ver: '', list: {} }; try { const c = JSON.parse(localStorage.getItem('pt_icons') || 'null'); if (c && c.list) PT.icons = c; } catch (e) {}
function ptIcons() { ptPost({ action: 'portalIcons' }).then(r => { if (r.ver === PT.icons.ver) return; PT.icons = r; try { localStorage.setItem('pt_icons', JSON.stringify(r)); } catch (e) {} if (PT.data) ptRender(); }).catch(() => {}); }
function ptIco(s, big) { const im = PT.icons.list[s.id]; const w = big ? 56 : 34; return im ? `<span class="pt-ico" style="width:${w}px;height:${w}px"><img src="${pe(im)}" alt=""></span>` : ''; }
function ptCall() { return ptPost({ action: 'portal', month: PT.month, all: PT.all }); }
function ptLoad(quiet) {
  if (!PT.key) { ptErr('اللينك ناقص. اطلب اللينك الصحيح من مِقناص'); return; }
  if (!PT.t) { if (PT.info) ptLoginView(); else ptPost({ action: 'portalInfo' }).then(i => { ptSetInfo(i); ptLoginView(); }).catch(e => ptErr(e.message)); return; }
  if (!quiet && !PT.data) document.getElementById('pt').innerHTML = '<div class="pt-load">جاري التحميل...</div>';
  ptCall().then(d => { const first = !PT.data; PT.data = d; ptSetInfo(d.partnerInfo); if (!PT.month) PT.month = d.month; ptRender(); if (first) ptIcons(); }).catch(e => { if (e.login) { ptTok(null); PT.t = ''; PT.data = null; ptLoad(); } else if (!PT.data) ptErr(e.message); });
}
function ptLoginView(msg) {
  document.getElementById('pt').innerHTML = `<div class="pt-login"><form class="pt-lcard" onsubmit="ptLogin(event)">
    ${ptMark(PT.info)}<b>مِقناص × ${pe(ptName())}</b><span>بورتال الشركاء · سجّل دخول عشان تكمل</span>
    <label>اسم المستخدم<input id="ptU" autocomplete="username" dir="ltr" required></label>
    <label>كلمة المرور<input id="ptP" type="password" autocomplete="current-password" dir="ltr" required></label>
    <div class="pt-lerr" role="alert">${msg ? pe(msg) : ''}</div>
    <button type="submit" class="pt-lbtn" id="ptLb">دخول</button></form></div>`;
  setTimeout(() => { const u = document.getElementById('ptU'); if (u) u.focus(); }, 30);
}
function ptLogin(ev) {
  ev.preventDefault();
  const b = document.getElementById('ptLb'); b.disabled = true; b.textContent = 'جاري الدخول...';
  ptPost({ action: 'portalLogin', user: document.getElementById('ptU').value, pass: document.getElementById('ptP').value })
    .then(r => { PT.t = ptTok(r.t); ptLoad(); })
    .catch(e => ptLoginView(e.message));
}
function ptLogout() { ptPost({ action: 'portalLogout' }).catch(() => {}); ptTok(null); PT.t = ''; PT.data = null; ptLoad(); }
function ptReport() {
  const w = window.open('', '_blank');
  if (w) w.document.write('<p dir="rtl" style="font-family:sans-serif;padding:24px">جاري تجهيز التقرير...</p>');
  ptPost({ action: 'portalReport', month: PT.data.month, all: PT.data.all }).then(r => {
    if (!w) { alert('افتح النوافذ المنبثقة (pop-ups) للموقع ده وجرّب تاني'); return; }
    w.document.open(); w.document.write(r.html); w.document.close();
    setTimeout(() => { try { w.focus(); w.print(); } catch (e) {} }, 900);
  }).catch(e => { if (w) w.close(); if (e.login) ptLoad(); else alert(e.message); });
}
function ptErr(msg) { document.getElementById('pt').innerHTML = '<div class="pt-err"><div><div class="pt-logo" style="margin:0 auto 14px">M</div>' + pe(msg) + '</div></div>'; }
function ptList() {
  const q = PT.q.trim().toLowerCase(), chip = PT_CHIPS.find(c => c[0] === PT.f) || PT_CHIPS[0];
  return PT.data.stores.filter(s => chip[3](s) && (!q || [s.name, s.storeId, s.ref, s.url, s.live].some(v => String(v || '').toLowerCase().indexOf(q) >= 0)));
}
function ptTabs() {
  const d = PT.data, tr = PT.view === 'track';
  const b = (on, txt, js) => `<button type="button" role="tab" aria-selected="${on}" class="${on ? 'on' : ''}" onclick="${js}">${txt}</button>`;
  return `<div class="pt-tabs" role="tablist" style="grid-template-columns:repeat(3,1fr)">${b(!tr && !d.all, 'متاجر الشهر', "PT.view='cards';ptSet('all',false)")}${b(!tr && d.all, 'كل المتاجر', "PT.view='cards';ptSet('all',true)")}${b(tr, 'متابعة المتاجر', "PT.view='track';PT.topen='';ptRender()")}</div>`;
}
function ptRender() {
  const d = PT.data; if (!d) return;
  if (PT.view === 'track') return ptTrack();
  if (PT.open && PT.open.indexOf('T:') === 0) { PT.view = 'track'; PT.topen = PT.open.slice(2); PT.open = ''; return ptTrack(); }   // متجر لسه مش مشروع: تفاصيله في متابعة المتاجر
  if (PT.open) { const s = d.stores.find(x => x.id === PT.open); if (s) return ptDetail(s); PT.open = ''; }
  const k = d.kpis, L = ptList();
  const months = []; { const [y0, m0] = d.first.split('-').map(Number); const cur = new Date(); let y = y0, m = m0; while (y < cur.getFullYear() || (y === cur.getFullYear() && m <= cur.getMonth() + 1)) { months.push(y + '-' + String(m).padStart(2, '0')); m++; if (m > 12) { m = 1; y++; } } }
  const counts = {}; PT_CHIPS.forEach(c => { counts[c[0]] = d.stores.filter(c[3]).length; });
  const focus = document.activeElement && document.activeElement.id === 'ptQ';
  document.getElementById('pt').innerHTML = `<div class="pt-wrap">
  <header class="pt-head">${ptMark(PT.info)}
    <div class="pt-title"><b>مِقناص × ${pe(ptName())}</b><span>بورتال الشركاء · تقرير التسليم</span></div>
    <span class="pt-upd">محدّث ${pe(ago(d.at))}</span><button type="button" class="pt-out" onclick="ptLogout()">خروج</button></header>
  <div class="pt-bar">
    ${ptTabs()}
    ${d.all ? '' : `<label class="pt-field month"><small>الشهر</small><select aria-label="الشهر" onchange="ptSet('month',this.value)">${months.reverse().map(m => `<option value="${m}"${m === d.month ? ' selected' : ''}>${mName(m)}</option>`).join('')}</select></label>`}
    <button type="button" class="pt-btn" onclick="ptExport()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>تصدير Excel</button>
    <button type="button" class="pt-btn" onclick="ptReport()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6z"/></svg>تقرير PDF</button>
  </div>
  <label class="pt-field search"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9DB0AA" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="ptQ" placeholder="ابحث برقم المتجر أو اسمه" aria-label="بحث" value="${pe(PT.q)}" oninput="PT.q=this.value;ptRender()"></label>
  <section class="pt-kpis" aria-label="ملخص">
    <div class="pt-k main"><span>${d.all ? 'إجمالي المتاجر المحالة' : 'متاجر ' + pe(mName(d.month))}</span><b>${k.total}</b><small>${k.isNew} جديد${d.all ? '' : ' هذا الشهر'}</small></div>
    <div class="pt-k"><span>قيد التنفيذ</span><b style="color:var(--warn)">${k.delivery}</b></div>
    <div class="pt-k"><span>تم الإطلاق</span><b style="color:var(--ok)">${k.launched}</b>${k.onTimePct !== null ? `<small>${k.onTimePct}% في الموعد</small>` : ''}</div>
    <div class="pt-k"><span>عوائق مفتوحة</span><b style="color:${k.blockClient + k.blockZid ? 'var(--bad)' : 'var(--ink)'}">${k.blockClient + k.blockZid}</b><small>${k.blockClient} العميل · ${k.blockZid} ${pe(ptName())}</small></div>
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
    <div class="pt-top"><span class="pt-nm">${ptIco(s)}<b ${pdir(s.name)}>${pe(s.name)}</b></span>${s.url || s.live ? `<span class="u" dir="ltr">${pe(String(s.live || s.url).replace(/^https?:\/\//, '').replace(/\/$/, ''))}</span>` : ''}
      ${s.storeId || s.ref ? `<span class="pt-id" dir="ltr">${s.storeId ? '#' + pe(s.storeId) : pe(s.ref)}</span>` : ''}
      <div class="pt-pills"><span class="pill s-${s.status}">${pe(s.statusName)}</span>${b ? `<span class="pill p-block">متوقف · ${pe(b.owner)} · ${b.days} ${b.days === 1 ? 'يوم' : 'أيام'}</span>` : ''}${s.domain ? `<span class="pill p-dom">${DOM_TXT[s.domain]}</span>` : ''}</div></div>
    <div class="pt-prog"><div><span>تقدّم مراحل التنفيذ</span><b dir="ltr">${s.pct}% · ${s.stagesDone}/${s.stagesAll}</b></div><span class="pt-track${s.pct === 100 ? ' ok' : ''}"><i style="width:${s.pct}%"></i></span></div>
    <div class="pt-foot">
      <div><span>تاريخ البدء</span><b class="num" dir="ltr">${dShort(s.start)}</b><small>${s.goLive ? 'الإطلاق ' + dShort(s.goLive) : 'المستهدف ' + dShort(s.target)}</small></div>
      <div class="pt-ring ${s.health}" aria-label="${s.days === null ? '' : s.days + ' يوم'}"><b>${s.days === null ? '—' : s.days}</b><span>يوم</span></div>
      <div><span>آخر تحديث</span><b>${pe(ago(s.lastAt))}</b><small ${pdir(s.lastText)}>${pe(s.lastText)}</small></div>
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
        <div class="pt-nm">${ptIco(s, true)}<h1 ${pdir(s.name)}>${pe(s.name)}</h1></div>${s.live || s.url ? `<a href="${pe(/^https?:/.test(s.live || s.url) ? (s.live || s.url) : 'https://' + (s.live || s.url))}" target="_blank" rel="noopener noreferrer" dir="ltr" style="font-size:13px">${pe(String(s.live || s.url).replace(/^https?:\/\//, ''))}</a>` : ''}</div>
      <div class="pt-pills" style="justify-content:flex-start;margin:0"><span class="pill s-${s.status}">${pe(s.statusName)}</span>${s.sla === 'client' ? '<span class="pill p-block">SLA متوقف · من العميل</span>' : s.sla === 'zid' ? '<span class="pill p-block">SLA متوقف · من ' + pe(ptName()) + '</span>' : ''}<span class="pill s-hold">${pe([s.from && s.from !== 'None' ? 'نقل من ' + s.from : 'متجر جديد', s.mode].filter(Boolean).join(' · '))}</span>${s.priority ? `<span class="pill s-hold">الأولوية: ${pe(s.priority)}</span>` : ''}</div>
      <div class="pt-dates"><div><span>الإحالة</span><b dir="ltr">${dShort(s.referral)}</b></div><div><span>البدء</span><b dir="ltr">${dShort(s.start)}</b></div><div><span>المستهدف</span><b dir="ltr">${dShort(s.target)}</b></div><div><span>الإطلاق</span><b dir="ltr">${dShort(s.goLive)}</b></div></div>
      <div class="pt-prog"><div><span>التقدم الكلي</span><b>${s.pct}%</b></div><span class="pt-track${s.pct === 100 ? ' ok' : ''}" style="height:8px"><i style="width:${s.pct}%"></i></span></div>
    </section>
    ${s.blockers.map(b => `<section class="pt-sec pt-blk"><h2><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F7A29D" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>عائق مفتوح · ${b.days} ${b.days === 1 ? 'يوم' : 'أيام'}</h2><p ${pdir(b.text)}>${pe(b.text)}</p><div class="pt-pills" style="justify-content:flex-start;margin:0"><span class="pill p-block">المسؤول: ${pe(b.owner)}</span><span class="pill p-block">${pe(b.cat)}</span>${b.since ? `<span class="pill p-block">منذ ${dShort(b.since)}</span>` : ''}</div></section>`).join('')}
    ${ptBlogHtml((PT.data.track || []).find(r => r.project === s.id))}
    <section class="pt-sec"><h2>مراحل التنفيذ <small>${done} / ${s.stages.filter(x => x.st !== 'na').length}</small></h2>
      <div>${s.stages.map(x => `<div class="pt-st ${x.st}"><span class="d" aria-hidden="true">${x.st === 'done' ? '✓' : x.st === 'prog' ? '•' : x.st === 'wait' ? '…' : x.st === 'na' ? '–' : ''}</span><span>${pe(x.name)}</span><em>${ST_TXT[x.st]}</em></div>`).join('')}</div></section>
    ${s.qa.length ? `<section class="pt-sec"><h2>فحص النقل التقني <small>${qaDone} / ${s.qa.length}</small></h2><div class="pt-qa">${s.qa.map(q => `<div class="${q.st}"><i aria-hidden="true"></i>${pe(q.name)}</div>`).join('')}</div></section>` : ''}
    <section class="pt-sec"><h2>آخر التحديثات</h2>${s.log.length ? s.log.map(l => { const dt = new Date(l.at); return `<div class="pt-log"><div><b dir="ltr">${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}</b><span>${dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span></div><div><em>${pe(l.type)}</em><p ${pdir(l.text)}>${pe(l.text)}</p>${l.next ? `<small dir="auto">الخطوة الجاية: ${pe(l.next)}</small>` : ''}</div></div>`; }).join('') : '<div style="color:var(--mut);font-size:13px">لسه مفيش تحديثات</div>'}</section>
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
  a.download = 'Miqnas-' + String((PT.info && PT.info.nameEn) || 'Partner').replace(/[^A-Za-z0-9]/g, '') + '-' + (PT.data.all ? 'all' : PT.data.month) + '.csv'; document.body.appendChild(a); a.click(); a.remove();
}
(function () {
  const m = location.hash.match(/s=([^&]+)/); if (m) PT.open = decodeURIComponent(m[1]);
  PT.t = ptTok();
  ptLoad(); ptBrand();
  setInterval(() => { if (document.visibilityState === 'visible' && PT.t && PT.data) ptLoad(true); }, 5 * 60000);
})();

/* ============ متابعة المتاجر (بنفس أعمدة شيت الشريك) ============ */
const TR_C = { 'تم بدء التواصل': '#7FB3F5', 'في انتظار المتطلبات': '#F2C14E', 'تم بدء العمل': '#F08A4B', 'متبقي تفعيل زد باي': '#C792EA', 'متبقي تفعيل الدومين': '#C792EA', 'مكتمل': '#4CC38A' };
const trCol = s => TR_C[s] || '#F07171';
const trPill = s => `<span class="pill" style="background:${trCol(s)}22;color:${trCol(s)};border-color:${trCol(s)}55">${pe(s)}</span>`;
const TR_K = [['', 'كل المتاجر', '#EEF3F1', () => true], ['contact', 'تم بدء التواصل', '#7FB3F5', r => r.status === 'تم بدء التواصل'], ['waiting', 'في انتظار المتطلبات', '#F2C14E', r => r.status === 'في انتظار المتطلبات'],
  ['work', 'تم بدء العمل', '#F08A4B', r => r.status === 'تم بدء العمل'], ['left', 'متبقي تفعيل', '#C792EA', r => /^متبقي/.test(r.status)], ['done', 'مكتمل', '#4CC38A', r => r.status === 'مكتمل'],
  ['closed', 'مقفول', '#F07171', r => !TR_C[r.status]], ['blocked', 'عليه عائق', '#F7A29D', r => r.blog.some(b => b.open)]];
function trMonths() {
  const d = PT.data, out = [], cur = new Date(); let [y, m] = String(d.first || d.month).split('-').map(Number);
  while (y < cur.getFullYear() || (y === cur.getFullYear() && m <= cur.getMonth() + 1)) { out.push(y + '-' + String(m).padStart(2, '0')); m++; if (m > 12) { m = 1; y++; } }
  return out;
}
const trMonth = () => PT.tm || (new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0'));
// المتجر يتبع الشهر: دخل فيه، أو اتشغّل فيه، أو لسه شغال (مكملش ومتقفلش)
function trInMonth(r, m) {
  if (m === 'all') return true;
  const inM = v => !!v && String(v).slice(0, 7) === m, end = m + '-31', ent = r.contact;
  if (ent && ent > end) return false;
  if (r.launch) return inM(r.launch) || inM(ent) || r.launch > end;
  if (r.status === 'مكتمل' || !TR_C[r.status]) return inM(ent);
  return true;
}
function trBase() { const m = trMonth(); return (PT.data.track || []).filter(r => trInMonth(r, m)); }
function trList() {
  const q = PT.q.trim().toLowerCase(), k = TR_K.find(x => x[0] === PT.tf) || TR_K[0];
  return trBase().filter(r => k[3](r) && (!q || [r.name, r.sid, r.phone, r.url, r.ref].some(v => String(v || '').toLowerCase().indexOf(q) >= 0)))
    .sort((a, b) => String(b.contact || '').localeCompare(String(a.contact || '')));
}
function trNotes(r) {
  const o = r.blog.filter(b => b.open), c = r.blog.length - o.length;
  const h = o.map(b => `<div style="color:#F7A29D">🔴 عائق عند <b>${pe(b.owner)}</b>: ${pe(b.cat)}${b.text ? ' — ' + pe(b.text) : ''} · ${b.days} ${b.days === 1 ? 'يوم' : 'أيام'}</div>`).join('');
  const n = r.note ? `<div ${pdir(r.note)}>${pe(r.note)}</div>` : '';
  const more = c ? `<div style="font-size:12px;color:var(--mut);margin-top:3px">＋ ${c} ${c === 1 ? 'عائق اتحل' : 'عوائق اتحلت'} · انتظار العميل ${r.bsum.client} يوم · ${pe(ptName())} ${r.bsum.partner} يوم</div>` : '';
  return (h + n + more) || '<span style="color:var(--dim)">—</span>';
}
function ptTrack() {
  const d = PT.data;
  if (PT.topen) { const r = (d.track || []).find(x => x.key === PT.topen); if (r) return ptTrackOne(r); PT.topen = ''; }
  const T = trBase(), tm = trMonth();
  const L = trList(), focus = document.activeElement && document.activeElement.id === 'ptQ';
  const th = 'padding:11px 12px;text-align:start;font-size:12px;color:var(--mut);font-weight:600;border-bottom:1px solid var(--line);white-space:nowrap;background:var(--card2);position:sticky;top:0';
  const td = 'padding:12px;border-bottom:1px solid var(--line);font-size:13.5px;vertical-align:top';
  const url = u => u ? `<a href="${pe(/^https?:/.test(u) ? u : 'https://' + u)}" target="_blank" rel="noopener noreferrer" dir="ltr" onclick="event.stopPropagation()">${pe(String(u).replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a>` : '—';
  document.getElementById('pt').innerHTML = `<div class="pt-wrap">
  <header class="pt-head">${ptMark(PT.info)}
    <div class="pt-title"><b>مِقناص × ${pe(ptName())}</b><span>بورتال الشركاء · متابعة المتاجر</span></div>
    <span class="pt-upd">محدّث ${pe(ago(d.at))}</span><button type="button" class="pt-out" onclick="ptLogout()">خروج</button></header>
  <div class="pt-bar">${ptTabs()}
    <label class="pt-field month"><small>الشهر</small><select aria-label="الشهر" onchange="PT.tm=this.value;ptRender()"><option value="all"${tm === 'all' ? ' selected' : ''}>كل الشهور</option>${trMonths().reverse().map(m => `<option value="${m}"${m === tm ? ' selected' : ''}>${mName(m)}</option>`).join('')}</select></label>
    <button type="button" class="pt-btn" onclick="ptTrackExport()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>تصدير Excel</button>
  </div>
  <label class="pt-field search"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9DB0AA" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="ptQ" placeholder="ابحث برقم المتجر أو اسمه أو رقم التاجر" value="${pe(PT.q)}" oninput="PT.q=this.value;ptRender()"></label>
  <section class="pt-kpis" aria-label="ملخص">${TR_K.filter(k => k[0] !== 'blocked').map(k => `<button type="button" class="pt-k${PT.tf === k[0] ? ' main' : ''}" style="cursor:pointer;text-align:start;font:inherit;color:inherit" onclick="PT.tf='${k[0]}';ptRender()"><span>${k[1]}</span><b style="color:${k[2]}">${T.filter(k[3]).length}</b></button>`).join('')}</section>
  <div style="background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:auto;max-height:75vh"><table style="width:100%;border-collapse:collapse;min-width:1180px">
  <tr>${['Store ID', 'اسم المتجر', 'رقم التواصل للتاجر', 'رابط المتجر', 'الباقة', 'الثيم', 'الحالة', 'تاريخ بدء التواصل', 'تاريخ التشغيل', 'ملاحظات وعوائق التاجر'].map(h => `<th style="${th}">${h}</th>`).join('')}</tr>
  ${L.length ? L.map(r => `<tr style="cursor:pointer" onclick="PT.topen='${pe(r.key)}';ptRender();window.scrollTo(0,0)"><td style="${td}" class="num" dir="ltr">${pe(r.sid) || '—'}</td><td style="${td}"><b ${pdir(r.name)}>${pe(r.name)}</b></td><td style="${td}" class="num" dir="ltr">${pe(r.phone) || '—'}</td><td style="${td}">${url(r.url)}</td><td style="${td};white-space:nowrap">${pe(r.pkg) || '—'}</td><td style="${td}" dir="auto">${pe(r.theme) || '—'}</td><td style="${td}">${trPill(r.status)}</td><td style="${td};white-space:nowrap" class="num">${pe(r.contact) || '—'}</td><td style="${td};white-space:nowrap" class="num">${pe(r.launch) || '—'}</td><td style="${td};min-width:260px;line-height:1.7">${trNotes(r)}</td></tr>`).join('')
    : `<tr><td colspan="10" style="${td};text-align:center;color:var(--mut)">مفيش متاجر هنا</td></tr>`}
  </table></div>
  <div class="pt-end"><span>عرض ${L.length} من ${T.length} متجر${tm === 'all' ? '' : ' في ' + mName(tm)} · اضغط على أي متجر لسجل العوائق كامل</span><span>مِقناص · للاطلاع فقط</span></div></div>`;
  if (focus) { const q = document.getElementById('ptQ'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
}
// سجل العوائق كامل (المفتوح والمقفول) + أيام الانتظار لكل طرف
function ptBlogHtml(r) {
  if (!r || !r.blog || !r.blog.length) return '';
  const td = 'padding:9px 10px;border-bottom:1px solid var(--line);font-size:13px;vertical-align:top';
  return `<section class="pt-sec"><h2>سجل العوائق <small>${r.blog.length}</small></h2>
    <div style="display:flex;gap:10px;flex-wrap:wrap"><div class="pt-k" style="flex:1;min-width:150px"><span>أيام انتظار بسبب العميل</span><b style="color:#F7A29D">${r.bsum.client} <small style="font-size:13px">يوم</small></b></div><div class="pt-k" style="flex:1;min-width:150px"><span>أيام انتظار بسبب ${pe(ptName())}</span><b style="color:#C792EA">${r.bsum.partner} <small style="font-size:13px">يوم</small></b></div></div>
    <div style="font-size:12px;color:var(--mut)">الأيام محسوبة من غير تكرار: لو فيه عائقين في نفس الوقت، اليوم بيتحسب مرة واحدة.</div>
    <div style="overflow:auto"><table style="width:100%;border-collapse:collapse;min-width:640px"><tr>${['العائق', 'عند', 'من', 'لحد', 'المدة', 'الإثبات'].map(h => `<th style="${td};color:var(--mut);font-size:12px;text-align:start">${h}</th>`).join('')}</tr>
    ${r.blog.map(b => `<tr><td style="${td}"><b>${pe(b.cat)}</b>${b.text ? `<div ${pdir(b.text)} style="color:#C9D6D2">${pe(b.text)}</div>` : ''}</td><td style="${td}">${pe(b.owner)}</td><td style="${td}" class="num">${pe(b.from)}</td><td style="${td}" class="num">${b.open ? '<b style="color:#F7A29D">لسه مفتوح</b>' : pe(b.to)}</td><td style="${td}" class="num">${b.days} ${b.days === 1 ? 'يوم' : 'أيام'}</td><td style="${td}">${b.links.length ? b.links.map((l, i) => `<a href="${pe(l)}" target="_blank" rel="noopener noreferrer">🔗 رابط${b.links.length > 1 ? ' ' + (i + 1) : ''}</a>`).join('<br>') : (b.ev ? `<span ${pdir(b.ev)}>${pe(b.ev)}</span>` : '—')}</td></tr>`).join('')}</table></div></section>`;
}
function ptTrackOne(r) {
  const kv = (k, v, ltr) => `<div><span>${k}</span><b ${ltr ? 'dir="ltr" class="num"' : ''}>${v || '—'}</b></div>`;
  document.getElementById('pt').innerHTML = `<div class="pt-wrap"><div class="pt-d">
    <button type="button" class="pt-back" onclick="PT.topen='';ptRender()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>متابعة المتاجر</button>
    <section class="pt-sec"><span class="num" style="font-size:12px;color:var(--mut)" dir="ltr">${[r.ref, r.sid ? '#' + r.sid : ''].filter(Boolean).map(pe).join(' · ')}</span>
      <h1 style="margin:0" ${pdir(r.name)}>${pe(r.name)}</h1><div>${trPill(r.status)}</div>
      <div class="pt-dates" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">${kv('رقم التواصل للتاجر', pe(r.phone), true)}${kv('رابط المتجر', pe(String(r.url || '').replace(/^https?:\/\//, '')), true)}${kv('الباقة', pe(r.pkg))}${kv('الثيم', pe(r.theme))}${kv('تاريخ بدء التواصل', pe(r.contact), true)}${kv('تاريخ التشغيل', pe(r.launch), true)}</div>
      ${r.note ? `<div ${pdir(r.note)} style="font-size:13.5px">📝 ${pe(r.note)}</div>` : ''}
      ${r.project ? `<button type="button" class="pt-btn" style="align-self:flex-start" onclick="PT.view='cards';PT.topen='';PT.open='${pe(r.project)}';ptSet('all',true)">مراحل التنفيذ والتحديثات ←</button>` : ''}
    </section>
    ${ptBlogHtml(r) || '<section class="pt-sec"><h2>سجل العوائق</h2><div style="color:var(--mut)">مفيش عوائق على المتجر ده.</div></section>'}
    <div class="pt-end">المعلومات دي بتتحدث تلقائياً من سيستم مِقناص · للاطلاع فقط</div></div></div>`;
}
// ملف Excel بنفس شكل شيت الشريك بالظبط (التنسيق متاخد من الشيت بتاعهم) ومتملي من البورتال
const XL = { pur: 'FF4E3372', ink: 'FF1F0433', line: 'FFA599B2',
  st: { 'تم بدء التواصل': ['FFF1EAFF', 'FF6E48A1'], 'في انتظار المتطلبات': ['FFFDF5D6', 'FF6F673B'], 'تم بدء العمل': ['FFD1F4F4', 'FF306666'], 'لا يوجد رد من التاجر': ['FFFFEDE6', 'FF723F1A'],
    'التاجر لا يناسب الشريك': ['FFE4E4E5', 'FF1F0433'], 'التاجر منسحب': ['FFFEE5E9', 'FF70192F'], 'تم تحويل التاجر لشريك اخر': ['FFEBE8ED', 'FF3C1C54'], 'متبقي تفعيل زد باي': ['FFE2D2FF', 'FF4E3372'],
    'متبقي تفعيل الدومين': ['FFE9FAFA', 'FF306666'], 'مكتمل': ['FFDDF8DC', 'FF476A44'] } };
async function ptTrackExport() {
  try {
    const L = trList(), sh = PT.data.sheet || {}, label = sh.label || 'Ruk- مقناص';
    const statuses = sh.statuses || Object.keys(XL.st), pk = sh.packages || ['انطلاقة سنوي', 'نمو سنوي', 'الاحترافية'];
    const F = o => Object.assign({ size: 11, color: XL.ink }, o || {});
    const box = XL.line, last = Math.max(505, 5 + L.length);
    const A = { h: 'right', v: 'middle' };
    // تاب المتاجر
    const rows = {};
    [1, 2, 3, 4].forEach(r => { rows[r] = { ht: 27, c: {} }; });
    rows[5] = { ht: 42, c: {} };
    rows[2].c[1] = { v: 'متابعة المتاجر', s: { font: F({ size: 16, b: true, color: XL.pur }), al: A } };
    rows[3].c[1] = { v: 'الشريك', s: { font: F(), al: A } }; rows[3].c[2] = { v: label, s: { font: F(), al: A } };
    ['Store ID', 'اسم المتجر', 'رقم التواصل للتاجر', 'رابط المتجر', 'الباقة', 'الثيم', 'الحالة', 'تاريخ بدء التواصل', 'تاريخ التشغيل', 'ملاحظات وعوائق التاجر']
      .forEach((h, i) => { rows[5].c[i + 1] = { v: h, s: { font: F({ size: 12, b: true, color: 'FFFFFFFF' }), fill: XL.pur, border: box, al: { h: 'center', v: 'middle', wrap: true } } }; });
    const notes = r => [r.note].concat(r.blog.filter(b => b.open).map(b => 'عائق عند ' + b.owner + ': ' + b.cat + (b.text ? ' - ' + b.text : '') + ' (' + b.days + ' ' + (b.days === 1 ? 'يوم' : 'أيام') + ')')).filter(Boolean).join('\n');
    for (let i = 6; i <= last; i++) {
      const r = L[i - 6], v = r ? [r.sid, r.name, r.phone, r.url, r.pkg, r.theme, r.status, r.contact, r.launch, notes(r)] : [];
      rows[i] = { ht: 31.5, c: {} };
      for (let c = 1; c <= 10; c++) {
        const date = c === 8 || c === 9, x = v[c - 1];
        rows[i].c[c] = { v: x === '' || x == null ? null : x, date: date && !!x, s: { font: F({ size: 12 }), border: box, al: { h: 'right', v: 'middle', wrap: c === 10 || c === 4 }, fmt: date ? 'dd/mm/yyyy' : (c === 3 || c === 1 ? '@' : '') } };
      }
    }
    const cf = [{ ref: 'G6:G' + last, rules: statuses.filter(s => XL.st[s]).map(s => ({ f: '$G6="' + s + '"', fill: XL.st[s][0], color: XL.st[s][1], b: true })) },
      { ref: 'A6:A' + last, rules: [{ f: 'AND($A6<>"",COUNTIF($A$6:$A$' + last + ',$A6)>1)', fill: 'FFFEE5E9', color: 'FF9E2342' }] },
      { ref: 'I6:I' + last, rules: [{ f: 'AND($B6<>"",$G6="مكتمل",$I6="")', fill: 'FFFEE5E9', color: 'FF9E2342' }] }];
    const dv = [{ ref: 'E6:E' + last, f: "'التعليمات والقوائم'!$C$2:$C$" + (1 + pk.length) }, { ref: 'G6:G' + last, f: "'التعليمات والقوائم'!$B$2:$B$" + (1 + statuses.length) }];
    // تاب التعليمات والقوائم زي ما هو
    const help = ['هذا الملف مخصص للشريك: ' + label, 'اكتب متجرًا واحدًا في كل صف، بدءًا من الصف 6.', 'Store ID هو رقم المتجر الثابت؛ لا تغيّره ولا تكرره.', 'اختر الباقة والحالة من القائمة المنسدلة.',
      'أدخل التواريخ بصيغة سنة-شهر-يوم، مثل 2026-10-19.', 'عند اختيار مكتمل، أدخل تاريخ التشغيل.', '', '', 'حدّث نفس صف المتجر عند تغيير حالته أو ملاحظاته.', 'الخطوة القادمة ومدة التفعيل تظهران لمسؤول المتابعة في الداشبورد فقط.', 'موعد المتابعة يحدده مسؤول المتابعة في الداشبورد فقط.'];
    const rows2 = {}, n = Math.max(help.length, statuses.length, pk.length) + 1;
    for (let i = 1; i <= n; i++) {
      rows2[i] = { ht: 30, c: {} };
      const v = i === 1 ? ['طريقة التعبئة', 'الحالات', 'الباقات'] : [help[i - 2] || null, statuses[i - 2] || null, pk[i - 2] || null];
      v.forEach((x, c) => {
        const s = i === 1 ? { font: F({ b: true, color: 'FFFFFFFF' }), fill: XL.pur, al: A } : c === 1 && x && XL.st[x] ? { font: F({ b: true, color: XL.st[x][1] }), fill: XL.st[x][0], al: A } : { font: F(), al: A };
        rows2[i].c[c + 1] = { v: x, s: s };
      });
    }
    const blob = xlsxBuild([
      { name: 'المتاجر', tab: XL.pur, rtl: true, grid: false, freeze: { x: 2, y: 5 }, cols: [159, 207, 190, 255, 223, 190, 271, 199, 159, 383], rows: rows, cf: cf, dv: dv },
      { name: 'التعليمات والقوائم', tab: 'FFD8D2DD', rtl: true, grid: false, cols: [759, 271, 223], rows: rows2 }]);
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'متابعة المتاجر - ' + label + (trMonth() === 'all' ? '' : ' - ' + trMonth()) + '.xlsx'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  } catch (e) { alert(e.message || 'حصل خطأ'); }
}
/* ----- ملف xlsx من غير أي مكتبة برة (zip من غير ضغط + XML) ----- */
function xlsxBuild(sheets) {
  const x = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  const col = n => { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
  // الستايلات
  const fonts = ['<font><sz val="11"/><color rgb="FF000000"/><name val="Arial"/></font>'], fills = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>'];
  const borders = ['<border><left/><right/><top/><bottom/><diagonal/></border>'], fmts = {}, xfs = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'], dxfs = [];
  const idx = (arr, v) => { let i = arr.indexOf(v); if (i < 0) { arr.push(v); i = arr.length - 1; } return i; };
  const xfOf = s => {
    if (!s) return 0;
    const f = s.font || {}, fo = idx(fonts, '<font>' + (f.b ? '<b/>' : '') + '<sz val="' + (f.size || 11) + '"/><color rgb="' + (f.color || 'FF000000') + '"/><name val="Arial"/></font>');
    const fi = s.fill ? idx(fills, '<fill><patternFill patternType="solid"><fgColor rgb="' + s.fill + '"/><bgColor indexed="64"/></patternFill></fill>') : 0;
    const b = s.border ? '<color rgb="' + s.border + '"/>' : '', bo = s.border ? idx(borders, '<border><left style="thin">' + b + '</left><right style="thin">' + b + '</right><top style="thin">' + b + '</top><bottom style="thin">' + b + '</bottom><diagonal/></border>') : 0;
    let nf = 0; if (s.fmt === '@') nf = 49; else if (s.fmt) { if (!fmts[s.fmt]) fmts[s.fmt] = 164 + Object.keys(fmts).length; nf = fmts[s.fmt]; }
    const al = s.al || {};
    return idx(xfs, '<xf numFmtId="' + nf + '" fontId="' + fo + '" fillId="' + fi + '" borderId="' + bo + '" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment' + (al.h ? ' horizontal="' + al.h + '"' : '') + (al.v ? ' vertical="' + (al.v === 'middle' ? 'center' : al.v) + '"' : '') + (al.wrap ? ' wrapText="1"' : '') + ' readingOrder="2"/></xf>');
  };
  const serial = d => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d)); return m ? Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - Date.UTC(1899, 11, 30)) / 864e5) : null; };
  const files = [];
  sheets.forEach((S, si) => {
    let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">';
    xml += '<sheetPr>' + (S.tab ? '<tabColor rgb="' + S.tab + '"/>' : '') + '<pageSetUpPr fitToPage="1"/></sheetPr>';
    xml += '<sheetViews><sheetView' + (S.rtl ? ' rightToLeft="1"' : '') + (S.grid === false ? ' showGridLines="0"' : '') + (si === 0 ? ' tabSelected="1"' : '') + ' workbookViewId="0">';
    if (S.freeze) { const tl = col(S.freeze.x + 1) + (S.freeze.y + 1); xml += '<pane xSplit="' + S.freeze.x + '" ySplit="' + S.freeze.y + '" topLeftCell="' + tl + '" activePane="bottomRight" state="frozen"/><selection pane="topRight"/><selection pane="bottomLeft"/><selection pane="bottomRight" activeCell="' + tl + '" sqref="' + tl + '"/>'; }
    xml += '</sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>';
    if (S.cols) xml += '<cols>' + S.cols.map((px, i) => '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + (Math.round((px - 5) / 7 * 100 + 0.5) / 100) + '" customWidth="1"/>').join('') + '</cols>';
    xml += '<sheetData>';
    Object.keys(S.rows).map(Number).sort((a, b) => a - b).forEach(r => {
      const R = S.rows[r]; xml += '<row r="' + r + '"' + (R.ht ? ' ht="' + R.ht + '" customHeight="1"' : '') + '>';
      Object.keys(R.c).map(Number).sort((a, b) => a - b).forEach(c => {
        const C = R.c[c], ref = col(c) + r, s = xfOf(C.s), v = C.v;
        if (v === null || v === undefined || v === '') xml += '<c r="' + ref + '" s="' + s + '"/>';
        else if (C.date && serial(v) !== null) xml += '<c r="' + ref + '" s="' + s + '"><v>' + serial(v) + '</v></c>';
        else if (typeof v === 'number') xml += '<c r="' + ref + '" s="' + s + '"><v>' + v + '</v></c>';
        else xml += '<c r="' + ref + '" s="' + s + '" t="inlineStr"><is><t xml:space="preserve">' + x(v) + '</t></is></c>';
      });
      xml += '</row>';
    });
    xml += '</sheetData>';
    let pr = 1;
    (S.cf || []).forEach(g => {
      xml += '<conditionalFormatting sqref="' + g.ref + '">' + g.rules.map(r => {
        const d = idx(dxfs, '<dxf><font>' + (r.b ? '<b/>' : '') + '<color rgb="' + r.color + '"/></font><fill><patternFill patternType="solid"><bgColor rgb="' + r.fill + '"/></patternFill></fill></dxf>');
        return '<cfRule type="expression" dxfId="' + d + '" priority="' + (pr++) + '"><formula>' + x(r.f) + '</formula></cfRule>';
      }).join('') + '</conditionalFormatting>';
    });
    if ((S.dv || []).length) xml += '<dataValidations count="' + S.dv.length + '">' + S.dv.map(d => '<dataValidation type="list" allowBlank="1" showInputMessage="1" showErrorMessage="1" sqref="' + d.ref + '"><formula1>' + x(d.f) + '</formula1></dataValidation>').join('') + '</dataValidations>';
    xml += '<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/><pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>';
    files.push(['xl/worksheets/sheet' + (si + 1) + '.xml', xml]);
  });
  const nfx = Object.keys(fmts).map(k => '<numFmt numFmtId="' + fmts[k] + '" formatCode="' + x(k) + '"/>').join('');
  const styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' + (nfx ? '<numFmts count="' + Object.keys(fmts).length + '">' + nfx + '</numFmts>' : '') +
    '<fonts count="' + fonts.length + '">' + fonts.join('') + '</fonts><fills count="' + fills.length + '">' + fills.join('') + '</fills><borders count="' + borders.length + '">' + borders.join('') + '</borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="' + xfs.length + '">' + xfs.join('') + '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    '<dxfs count="' + dxfs.length + '">' + dxfs.join('') + '</dxfs></styleSheet>';
  const wb = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets>' +
    sheets.map((S, i) => '<sheet name="' + x(S.name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join('') + '</sheets></workbook>';
  const wbRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    sheets.map((S, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join('') +
    '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
  const ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' + sheets.map((S, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>';
  const rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
  return new Blob([zipStore([['[Content_Types].xml', ct], ['_rels/.rels', rels], ['xl/workbook.xml', wb], ['xl/_rels/workbook.xml.rels', wbRels], ['xl/styles.xml', styles]].concat(files))], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
// zip من غير ضغط (STORE)
function zipStore(entries) {
  const enc = new TextEncoder(), T = zipStore.t || (zipStore.t = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })());
  const crc = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = T[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const d = new Date(), dt = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(), tm = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const parts = [], central = []; let off = 0;
  entries.forEach(([name, text]) => {
    const nb = enc.encode(name), data = typeof text === 'string' ? enc.encode(text) : text, c = crc(data);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, tm, true); h.setUint16(12, dt, true);
    h.setUint32(14, c, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, nb.length, true); h.setUint16(28, 0, true);
    parts.push(new Uint8Array(h.buffer), nb, data);
    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true); cd.setUint16(4, 20, true); cd.setUint16(6, 20, true); cd.setUint16(8, 0x0800, true); cd.setUint16(10, 0, true); cd.setUint16(12, tm, true); cd.setUint16(14, dt, true);
    cd.setUint32(16, c, true); cd.setUint32(20, data.length, true); cd.setUint32(24, data.length, true); cd.setUint16(28, nb.length, true); cd.setUint32(42, off, true);
    central.push(new Uint8Array(cd.buffer), nb);
    off += 30 + nb.length + data.length;
  });
  const cdLen = central.reduce((a, b) => a + b.length, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, entries.length, true); e.setUint16(10, entries.length, true); e.setUint32(12, cdLen, true); e.setUint32(16, off, true);
  const all = parts.concat(central, [new Uint8Array(e.buffer)]), out = new Uint8Array(all.reduce((a, b) => a + b.length, 0)); let p = 0;
  all.forEach(b => { out.set(b, p); p += b.length; });
  return out;
}
