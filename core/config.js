/* ============ الإعداد ============ */
// لينك الـ Web App اللي بينتهي بـ /exec
const API_URL = 'https://script.google.com/macros/s/AKfycbyrNtR6uVU9t9NUJpZ-dJ0mknN3uc_eTQ0Y85kRPt5qROsR4Vv7_Cdu4wMA4ywx7POXvg/exec';
// اللينك الأساسي للسيستم (بيستخدم في لينكات البريفات)
const SITE_URL = 'https://ops681.github.io/miqnas-test/';

const IN_GAS = typeof google !== 'undefined' && google.script && google.script.run;
const S = { token:null, user:null, cfg:{shotMinutes:10}, view:null, status:null, skew:0, vt:0,
            stream:null, mode:null, lastShot:0, tick:null, pending:[], sharing:false,
            cache:{}, fetched:{}, pFilter:'Active', alertFilter:'all' };
const MODE_NAMES = { tab:'Tab', window:'Window', screen:'Full Screen' };
const $ = id => document.getElementById(id);
const esc = s => String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LOADING = '<div class="loading">Loading...</div>';
// الصلاحيات جاية من السيرفر مع بيانات المستخدم
const can = p => !!(S.user && S.user.perms && S.user.perms.indexOf(p) >= 0);
const canAny = list => list.some(can);
// اللي بيبصم: كل الصفحات مقفولة لحد بصمة الدخول (ماعدا Time Clock)
// صفحات مفتوحة حتى قبل البصمة: البصمة نفسها وطلبات الإجازة والإذن
const FREE_VIEWS = ['clock','requests'];
const gated = () => !!(S.user && S.user.clocks && S.cfg && S.cfg.clockFirst && S.status && !S.status.clockedIn);
// بيعرض الأسامي العربي صح جوه الجمل الإنجليزي
const bd = s => esc(s).replace(/[\u0600-\u06FF](?:[\u0600-\u06FF\s\d.,،:()\-\/]*[\u0600-\u06FF])?/g, m=>'<bdi>'+m+'</bdi>');

// نسخة التجربة: مفاتيح منفصلة عشان متختلطش بالسيستم الأصلي على نفس الدومين
const KP = 'test_';
function store(k,v){ try{ v==null? localStorage.removeItem(KP+k) : localStorage.setItem(KP+k,v);}catch(e){} }
function load(k){ try{ return localStorage.getItem(KP+k);}catch(e){ return null; } }
// رقم الجهاز: بيتعمل مرة واحدة ويفضل في البراوزر حتى بعد الخروج
function deviceId(){
  let d=load('erp_dev');
  if(!/^[a-f0-9]{32}$/.test(d||'')){ d=Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join(''); store('erp_dev',d); }
  return d;
}
function deviceLabel(){
  const ua=navigator.userAgent;
  const b=/Edg\//.test(ua)?'Edge':/OPR\//.test(ua)?'Opera':/Firefox\//.test(ua)?'Firefox':/Chrome\//.test(ua)?'Chrome':/Safari\//.test(ua)?'Safari':'Browser';
  const o=/iPhone|iPad/.test(ua)?'iPhone/iPad':/Android/.test(ua)?'Android':/Mac OS X/.test(ua)?'Mac':/Windows/.test(ua)?'Windows':/Linux/.test(ua)?'Linux':'Unknown';
  return b+' · '+o;
}
