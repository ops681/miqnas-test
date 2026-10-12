/* ============ بورتال العميل ============
   متجر واحد: المفتاح في اللينك (?k=...) + يوزر وباسورد بيحددهم الأكاونت مانجر. للاطلاع بس.
   بيستخدم نفس تصميم بورتال الشركاء (portal/portal.css). */
const CP = { key: new URLSearchParams(location.search).get('k') || '', t: '', info: null, data: null };
const ce = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cd = d => { if (!d) return '—'; const x = new Date(String(d).slice(0, 10) + 'T12:00:00'); return isNaN(x) ? '—' : x.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }); };
const cm = (n, c) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' ' + (c || 'SAR');
const cpKey = () => 'cp_t_' + CP.key.slice(0, 12);
function cpTok(v) { try { if (v === undefined) return localStorage.getItem(cpKey()) || ''; if (v) localStorage.setItem(cpKey(), v); else localStorage.removeItem(cpKey()); } catch (e) {} return v || ''; }
function cpPost(body) {
  return fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ k: CP.key, t: CP.t }, body)) })
    .then(r => r.json()).then(r => { if (!r || !r.ok) { const e = new Error((r && r.error) || 'حصل خطأ'); if (e.message === 'PT_LOGIN') e.login = true; throw e; } return r.data; });
}
const cpEl = () => document.getElementById('pt');
CP.brand = null; try { CP.brand = JSON.parse(localStorage.getItem('pt_brand') || 'null'); } catch (e) {}
function cpMark() { return CP.brand && CP.brand.logo ? `<div class="pt-logo pt-img" aria-hidden="true"><img src="${ce(CP.brand.logo)}" alt=""></div>` : '<div class="pt-logo" aria-hidden="true">M</div>'; }
function cpBrand() { cpPost({ action: 'brand' }).then(b => { CP.brand = b; try { localStorage.setItem('pt_brand', JSON.stringify(b)); } catch (e) {} if (CP.data) cpRender(); else if (!CP.t && CP.info) cpLoginView(); }).catch(() => {}); }
function cpErr(msg) { cpEl().innerHTML = '<div class="pt-err"><div><div class="pt-logo" style="margin:0 auto 14px">M</div>' + ce(msg) + '</div></div>'; }
function cpLoad(quiet) {
  if (!CP.key) return cpErr('اللينك ناقص. اطلب اللينك الصحيح من مِقناص');
  if (!CP.t) { if (CP.info) return cpLoginView(); return cpPost({ action: 'cportalInfo' }).then(i => { CP.info = i; document.title = 'مِقناص · ' + i.client; cpLoginView(); }).catch(e => cpErr(e.message)); }
  if (!quiet && !CP.data) cpEl().innerHTML = '<div class="pt-load">جاري التحميل...</div>';
  cpPost({ action: 'cportal' }).then(d => { CP.data = d; document.title = 'مِقناص · ' + d.client; cpRender(); })
    .catch(e => { if (e.login) { cpTok(null); CP.t = ''; CP.data = null; cpLoad(); } else if (!CP.data) cpErr(e.message); });
}
function cpLoginView(msg) {
  cpEl().innerHTML = `<div class="pt-login"><form class="pt-lcard" onsubmit="cpLogin(event)">
    ${cpMark()}<b>${ce(CP.info ? CP.info.client : 'متجرك')}</b><span>متابعة متجرك مع مِقناص · سجّل دخول عشان تكمل</span>
    <label>اسم المستخدم<input id="cpU" autocomplete="username" dir="ltr" required></label>
    <label>كلمة المرور<input id="cpP" type="password" autocomplete="current-password" dir="ltr" required></label>
    <div class="pt-lerr" role="alert">${msg ? ce(msg) : ''}</div>
    <button type="submit" class="pt-lbtn" id="cpB">دخول</button></form></div>`;
  setTimeout(() => { const u = document.getElementById('cpU'); if (u) u.focus(); }, 30);
}
function cpLogin(ev) {
  ev.preventDefault();
  const b = document.getElementById('cpB'); b.disabled = true; b.textContent = 'جاري الدخول...';
  cpPost({ action: 'cportalLogin', user: document.getElementById('cpU').value, pass: document.getElementById('cpP').value })
    .then(r => { CP.t = cpTok(r.t); cpLoad(); }).catch(e => cpLoginView(e.message));
}
function cpLogout() { cpPost({ action: 'cportalLogout' }).catch(() => {}); cpTok(null); CP.t = ''; CP.data = null; cpLoad(); }
const CST = { done: 'مكتمل', prog: 'قيد التنفيذ', wait: 'مستني موافقتك', todo: 'لم يبدأ', na: 'لا ينطبق' };
const PST = { paid: ['تم الدفع', 's-done'], due: ['مستحقة', 's-ready'], overdue: ['متأخرة', 'p-block'] };
function cpRender() {
  const d = CP.data;
  const host = String(d.live || d.url || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
  const open = d.payments.filter(p => p.status !== 'paid');
  cpEl().innerHTML = `<div class="pt-wrap"><div class="pt-d">
    <header class="pt-head">${cpMark()}${d.logo ? `<span class="pt-ico" style="width:46px;height:46px"><img src="${ce(d.logo)}" alt=""></span>` : ''}<div class="pt-title"><b>${ce(d.client)}</b><span>متابعة متجرك مع مِقناص${d.am ? ' · مدير حسابك: ' + ce(d.am) : ''}</span></div><button type="button" class="pt-out" onclick="cpLogout()">خروج</button></header>
    <section class="pt-sec">
      <div class="pt-pills" style="justify-content:flex-start;margin:0"><span class="pill s-${d.status}">${ce(d.statusName)}</span>${host ? `<a class="pill s-hold" href="${ce(/^https?:/.test(d.live || d.url) ? (d.live || d.url) : 'https://' + host)}" target="_blank" rel="noopener noreferrer" dir="ltr">${ce(host)}</a>` : ''}</div>
      <div class="pt-prog"><div><span>التقدم الكلي</span><b>${d.pct}%</b></div><span class="pt-track${d.pct === 100 ? ' ok' : ''}" style="height:10px"><i style="width:${d.pct}%"></i></span></div>
      <div class="pt-dates"><div><span>البدء</span><b>${cd(d.start)}</b></div><div><span>الإطلاق المتوقع</span><b>${cd(d.target)}</b></div><div><span>الإطلاق</span><b>${cd(d.goLive)}</b></div><div><span>المراحل</span><b dir="ltr">${d.stagesDone} / ${d.stagesAll}</b></div></div>
    </section>
    ${d.need.length ? `<section class="pt-sec pt-blk"><h2>مطلوب منك</h2>${d.need.map(n => `<p dir="auto">• ${ce(n.text)}${n.days ? ` <small style="opacity:.8">(من ${n.days} ${n.days === 1 ? 'يوم' : 'أيام'})</small>` : ''}</p>`).join('')}<p style="font-size:12.5px;opacity:.85">أول ما يوصلنا ده هنكمل على طول.</p></section>` : ''}
    <section class="pt-sec"><h2>مراحل التنفيذ <small>${d.stagesDone} / ${d.stagesAll}</small></h2>
      <div>${d.stages.map(x => `<div class="pt-st ${x.st}"><span class="d" aria-hidden="true">${x.st === 'done' ? '✓' : x.st === 'prog' ? '•' : x.st === 'wait' ? '…' : x.st === 'na' ? '–' : ''}</span><span>${ce(x.name)}</span><em>${CST[x.st]}</em></div>`).join('')}</div></section>
    ${d.payments.length ? `<section class="pt-sec"><h2>الدفعات <small>${open.length ? 'متبقي ' + cm(open.reduce((a, p) => a + p.amount, 0), d.currency) : 'كله اتدفع ✓'}</small></h2>
      ${d.payments.map(p => `<div class="pt-st ${p.status === 'paid' ? 'done' : p.status === 'overdue' ? 'prog' : ''}"><span class="d" aria-hidden="true">${p.status === 'paid' ? '✓' : ''}</span><span>${ce(p.label)} · <b dir="ltr">${cm(p.amount, d.currency)}</b><br><small style="color:var(--mut)">${p.status === 'paid' ? 'اتدفعت ' + cd(p.paidAt) : 'الاستحقاق ' + cd(p.due)}</small></span><em class="pill ${PST[p.status][1]}">${PST[p.status][0]}</em></div>`).join('')}</section>` : ''}
    <section class="pt-sec"><h2>آخر التحديثات</h2>${d.log.length ? d.log.map(l => { const dt = new Date(l.at); return `<div class="pt-log"><div><b dir="ltr">${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}</b><span>${dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span></div><div><em>${ce(l.type)}</em><p dir="auto">${ce(l.text)}</p>${l.next ? `<small dir="auto">الخطوة الجاية: ${ce(l.next)}</small>` : ''}</div></div>`; }).join('') : '<div style="color:var(--mut);font-size:13px">لسه مفيش تحديثات</div>'}</section>
    <div class="pt-end">المعلومات دي بتتحدث تلقائياً من سيستم مِقناص · للاطلاع فقط</div>
  </div></div>`;
}
(function () {
  CP.t = cpTok();
  cpLoad(); cpBrand();
  setInterval(() => { if (document.visibilityState === 'visible' && CP.t && CP.data) cpLoad(true); }, 5 * 60000);
})();
