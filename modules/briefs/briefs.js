/* ===== موديول البريفات ===== */

(function(){

const SITE_URL = window.ERP_SITE_URL || (location.origin + location.pathname);
const briefLink = id => SITE_URL + "#brief=" + id;

const PAY = ["تابي","تمارا","مدى","Visa","Apple Pay","Zid Pay","Salla Pay","الدفع عند الاستلام"];
const DOCS = ["وثيقة العمل الحر","الهوية الوطنية (National ID)","شهادة الضريبة (VAT Certificate)","العنوان الوطني (National Address)","الآيبان / شهادة بنكية (IBAN)","رقم توثيق المتجر (Store Verification Phone)","السجل التجاري (CR Number)","الرقم الضريبي (VAT Number)"];

const SECTIONS = [
 {id:"client", title:"بيانات العميل", items:[
  {id:"store_name", label:"اسم المتجر", type:"text"},
  {id:"client_name", label:"اسم العميل", type:"text"},
  {id:"am_name", label:"اسم الأكاونت مانجر", type:"text", headerOnly:true},
  {id:"zid_id", label:"الرقم التعريفي للمتجر على زد", type:"text", ltr:true},
  {id:"contact_times", label:"الأوقات المناسبة للتواصل", type:"text"},
  {id:"brief_date", label:"تاريخ البريف", type:"date"},
  {id:"drive", label:"لينك الدرايف الخاص بالعميل", type:"url"}]},
 {id:"scope", title:"Project Scope", items:[
  {id:"project_type", label:"نوع المشروع", type:"select", options:["نقل متجر","تحسين متجر","إنشاء متجر","نقل متجر كما هو"]},
  {id:"current_platform", label:"المنصة الحالية", type:"text", hint:"مثال: سلة"},
  {id:"target_platform", label:"المنصة اللي هينقل عليها", type:"text", hint:"مثال: زد"},
  {id:"store_url", label:"لينك المتجر الحالي", type:"url"},
  {id:"domain_owner", label:"الدومين مملوك لمين حاليًا؟", type:"text"},
  {id:"domain_change", label:"هل هيغيّر الدومين؟", type:"yn"},
  {id:"domain_change_details", label:"تفاصيل تغيير الدومين", type:"textarea", hint:"مثال: هيشتري دومين جديد من زد مجانًا أو من GoDaddy، ولسه ماستقرش", showIf:a=>a.domain_change==="أيوه"},
  {id:"domain_platform", label:"الدومين على أنهي منصة؟", type:"text", hint:"اليوزر والباسورد بيتكتبوا في قسم الأكسيس."},
  {id:"plan", label:"الباقة (Package / Plan)", type:"textarea", hint:"الباقة الحالية على المنصة، والباقة الخاصة بينا"},
  {id:"plan_end", label:"تاريخ انتهاء باقة المنصة", type:"date", hint:"المنصة اللي بننقل منها، اشتراكها بينتهي إمتى؟"},
  {id:"complaints", label:"أهم شكاوي العملاء والمتجر", type:"textarea", hint:"مثال: العملاء بتشتكي من عدم وجود جدول مقاسات، أو استفسارات متكررة عن المنتجات"}]},
 {id:"access", title:"الأكسيس", items:[
  {id:"acc_salla", label:"سلة", type:"cred", optional:true},
  {id:"acc_zid", label:"زد", type:"cred", optional:true},
  {id:"acc_domain", label:"الدومين", type:"cred", withLink:true, optional:true},
  {id:"acc_email", label:"الإيميل", type:"cred", optional:true},
  {id:"acc_tabby", label:"تابي", type:"cred", optional:true},
  {id:"acc_tamara", label:"تمارا", type:"cred", optional:true},
  {id:"acc_other", label:"حساب تاني", type:"cred", named:true, optional:true}]},
 {id:"products", group:"Store Manager", title:"المنتجات", items:[
  {id:"products_scope", label:"نقل المنتجات", type:"choice", options:["كل المنتجات","منتجات معينة"]},
  {id:"products_which", label:"أنهي منتجات؟", type:"textarea", showIf:a=>a.products_scope==="منتجات معينة"},
  {id:"same_categories", label:"هتتنقل بنفس التصنيفات؟", type:"yn"},
  {id:"products_count", label:"عدد المنتجات", type:"text"},
  {id:"variants", label:"خيارات ومخزون المنتجات", type:"textarea"},
  {id:"product_notes", label:"تعليمات عن المنتجات إن وجدت", type:"textarea"},
  {id:"hidden_products", label:"هل في منتجات مخفية؟", type:"yn"},
  {id:"hidden_transfer", label:"المنتجات المخفية هتتنقل؟", type:"yn", showIf:a=>a.hidden_products==="أيوه"},
  {id:"oos_transfer", label:"المنتجات الـ Out of Stock هتتنقل؟", type:"yn"}]},
 {id:"shipping", group:"Store Manager", title:"الشحن", items:[
  {id:"shipping_cos", label:"شركات الشحن والتوصيل", type:"textarea", hint:"الشركات المشترك فيها على المنصة. لو مفيش وفي مناديب خاصة، نسأل عنهم وعن تفاصيلهم."},
  {id:"shipping_zones", label:"المناطق المخصصة للشحن", type:"textarea"},
  {id:"shipping_options", label:"خيارات الشحن", type:"multi", options:["شحن للعميل","استلام من الفرع"]},
  {id:"pickup_cod", label:"الدفع عند الاستلام مفعّل مع الاستلام من الفرع؟", type:"yn", showIf:a=>(a.shipping_options||[]).includes("استلام من الفرع")},
  {id:"branches", label:"بيانات الفروع", type:"textarea", hint:"اسم الفرع والعنوان ومواعيد الاستلام", showIf:a=>(a.shipping_options||[]).includes("استلام من الفرع")},
  {id:"support_phone", label:"رقم دعم خدمة العملاء", type:"text", ltr:true}]},
 {id:"payment", group:"Store Manager", title:"طرق الدفع", items:[
  {id:"payments", label:"طرق الدفع المفعّلة", type:"checks", options:PAY}]},
 {id:"docs", group:"Store Manager", title:"الوثائق الرسمية", items:[
  {id:"documents", label:"الوثائق المستلمة", type:"checks", options:DOCS},
  {id:"docs_drive", label:"لينك درايف مجمّع بكل الوثائق", type:"url"}]},
 {id:"side", group:"Store Manager", title:"معلومات إضافية", items:[
  {id:"categories", label:"الأقسام الخاصة بالمتجر", type:"textarea"},
  {id:"discount_codes", label:"أكواد الخصم", type:"textarea"},
  {id:"blogs", label:"المدونات", type:"textarea"},
  {id:"policies", label:"السياسات", type:"textarea"},
  {id:"reviews", label:"آراء العملاء", type:"textarea"},
  {id:"verify_phone", label:"رقم هاتف توثيق المتجر على زد / سلة", type:"text", ltr:true},
  {id:"cashback", label:"هل يوجد كاش باك؟", type:"yn"},
  {id:"cashback_details", label:"إيه هي الخصومات المطبقة؟", type:"textarea", hint:"نسبة الكاش باك وشروطه، وأي خصومات تانية شغالة", showIf:a=>a.cashback==="أيوه"},
  {id:"offers", label:"هل في عروض مطبقة حاليًا؟", type:"yn"},
  {id:"offers_details", label:"العروض وشروطها", type:"textarea", showIf:a=>a.offers==="أيوه"}]},
 {id:"uiux", title:"UI / UX", items:[
  {id:"brand_story", label:"قصة البراند (Brand Story)", type:"textarea", hint:"معنى اسم المتجر والقصة من إنشائه"},
  {id:"tone", label:"نبرة الكلام (Tone of Voice)", type:"textarea", hint:"بيخاطب أي فئة؟ والأسلوب ودّي، رسمي، ولا شبابي؟"},
  {id:"audience", label:"الجمهور المستهدف", type:"textarea", hint:"مثال: شباب، أطفال، ستات. العمر من 16 لـ 40 سنة"},
  {id:"identity", label:"الهوية البصرية (Brand Identity)", type:"textarea", hint:"لو عنده هوية: الألوان، اللوجو، الخطوط المستخدمة"},
  {id:"identity_link", label:"لينك الهوية البصرية", type:"url", optional:true, hint:"اختياري. لو العميل عنده ملف هوية على درايف أو Behance أو غيره"},
  {id:"design_style", label:"أسلوب التصميم", type:"textarea"},
  {id:"home_page", label:"الصفحة الرئيسية", type:"textarea"},
  {id:"banners", label:"البنرات", type:"textarea", hint:"محتاج كام بانر؟ ولأي أقسام بالظبط؟"},
  {id:"banner_sizes", label:"مقاسات البنرات", type:"text"},
  {id:"product_pages", label:"صفحات المنتجات", type:"textarea"},
  {id:"competitors", label:"منافسين أو References", type:"textarea"},
  {id:"best_sellers", label:"المنتجات الأكثر مبيعًا / اللي بنركز عليها في البنرات", type:"textarea"},
  {id:"product_photos", label:"صور المنتجات بجودة عالية", type:"textarea"},
  {id:"header_footer", label:"الفوتر والهيدر", type:"textarea", hint:"هل هيتضاف حاجة معينة في الفوتر أو الهيدر؟"}]},
 {id:"designer", title:"Designer", items:[
  {id:"logo_plan", label:"اللوجو", type:"choice", options:["هيفضل زي ما هو","تحسين على الحالي","لوجو جديد"]},
  {id:"logo_notes", label:"المطلوب في اللوجو", type:"textarea", showIf:a=>a.logo_plan&&a.logo_plan!=="هيفضل زي ما هو"},
  {id:"colors", label:"الألوان المستخدمة", type:"textarea", hint:"لو مش هيغيّر حاجة: نفس الهوية اللي في قسم UI / UX"},
  {id:"design_refs", label:"References", type:"textarea"}]}
];

const $ = s => document.querySelector(s);
let app = null;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const filled = v => Array.isArray(v) ? v.length > 0 : (v && typeof v==="object") ? Object.values(v).some(x=>String(x??"").trim()!=="") : (v !== undefined && v !== null && String(v).trim() !== "");
const cntText = c => c.t ? `${c.d} من ${c.t}` : "اختياري";
const visible = (it, a) => !it.showIf || it.showIf(a);
function progress(a){
  let t=0,d=0;
  for (const s of SECTIONS) for (const it of s.items){ if (it.type==="checks"||!visible(it,a)) continue; if (it.optional&&!filled(a[it.id])) continue; t++; if (filled(a[it.id])) d++; }
  return {t,d,pct:t?Math.round(d/t*100):0};
}
function secCount(s,a){let t=0,d=0;for(const it of s.items){if(!visible(it,a))continue;if(it.optional&&!filled(a[it.id]))continue;if(it.type==="checks"){t++;if(filled(a[it.id]))d++;continue;}t++;if(filled(a[it.id]))d++;}return {t,d};}
const fmtDate = v => { if(!v) return ""; const d=new Date(v); return isNaN(d)?"":d.toLocaleDateString("ar-EG",{day:"numeric",month:"short",year:"numeric"}); };
function toast(msg){ window.erpToast(msg); }
async function copy(text){try{await navigator.clipboard.writeText(text);toast("اتنسخ");}catch(e){const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();try{document.execCommand("copy");toast("اتنسخ");}catch(_){toast("ماقدرتش أنسخ، انسخ يدوي");}ta.remove();}}

let me=null, myName="", canWrite=false, isAdmin=false, myRole="", seeAccess=false, teamUsers=null;
const session="";
let briefs=new Map(), loaded=false, route={v:"list"}, query="", amFilter="", confirmDel=false;
let draft=null, saveTimer=null, saving=false, again=false, lastSaved=null;
const API_MAP={listBriefs:()=>["briefList",{}],getBrief:(_,id)=>["briefGet",{id}],saveBrief:(_,brief)=>["briefSave",{brief}],deleteBrief:(_,id)=>["briefDelete",{id}],exportAll:()=>["briefExport",{}],importBriefs:(_,list)=>["briefImport",{list}]};
function api(fn,...args){ const [a,p]=API_MAP[fn](...args); return window.erpCall(a,p); }
const canEditB = b => !!b && (isAdmin || (myRole==="am" && b.owner===me));
const canSeeAccess = () => myRole!=="team" || seeAccess;
function setHash(id){ try{ history.replaceState(null,"", id ? "#brief="+id : location.pathname+location.search); }catch(e){} }

function go(r){
  if (route.v==="edit" && draft){ flush(false, draft); draft=null; }
  route=r; confirmDel=false;
  setHash(r.v==="view"?r.id:"");
  if(r.v==="list") loadList();
  render(); window.scrollTo(0,0);
}

const amOf = b => String((b.answers&&b.answers.am_name)||"").trim() || b.amName || "";

function render(){
  if (route.v==="edit") return renderForm();
  if (route.v==="view") return renderView();
  renderList();
}

function renderList(){
  if(!loaded){app.innerHTML=`<div class="note">Loading briefs...</div>`;return;}
  const q=query.trim();
  const amList=[...new Set([...briefs.values()].map(b=>amOf(b)).filter(Boolean))].sort();
  if(amFilter&&!amList.includes(amFilter)) amFilter="";
  const rows=[...briefs.values()].filter(b=>(!q||(b.store+" "+b.client).includes(q))&&(!amFilter||amOf(b)===amFilter)).sort((x,y)=>(y.updatedAt||0)-(x.updatedAt||0));
  const drafts=[...briefs.values()].filter(b=>b.status!=="done").length;
  app.innerHTML=`
  <div class="topbar">
    <div class="brand"><h1>${canWrite?"Client Briefs":"My Briefs"}</h1><small>${briefs.size} briefs · ${drafts} drafts</small></div>
    <div class="actions">${isAdmin?`<label class="btn" for="imp">Import</label><input type="file" id="imp" accept=".json,application/json" hidden>`:""}${isAdmin&&downloads&&briefs.size?`<button class="btn" id="csv">Export All</button>`:""}${canWrite?`<button class="btn primary" id="new">+ New Brief</button>`:""}</div>
  </div>
  ${briefs.size?`<div class="tools"><input type="search" id="q" placeholder="Search by store or client" value="${esc(query)}">${isAdmin&&amList.length>1?`<select id="amf" aria-label="Account Manager" style="width:auto;min-width:160px"><option value="">All account managers</option>${amList.map(n=>`<option value="${esc(n)}"${n===amFilter?" selected":""}>${esc(n)}</option>`).join("")}</select>`:""}</div>
  <div class="ledger">
    <div class="row head"><span>Store</span><span class="c2">Account Manager</span><span class="c3">Last updated</span><span>Status</span></div>
    ${rows.map(b=>`<button class="row" data-id="${b.id}">
      <span class="storecell">${okLogo(b.thumb||b.logo)?`<span class="logo-tile thumb"><img src="${esc(b.thumb||b.logo)}" alt=""></span>`:""}<span style="min-width:0"><div class="t">${esc(b.store||"بدون اسم")}</div><div class="s">${esc(b.client||"")}</div></span></span>
      <span class="c2 s">${esc(amOf(b)||"—")}${(b.assigned||[]).length?`<div style="font-size:12px">${b.assigned.length} team members</div>`:""}</span>
      <span class="c3 s">${fmtDate(b.updatedAt)}</span>
      <span class="p"><span class="pill ${b.status==="done"?"done":"draft"}">${b.status==="done"?"Done":"Draft"}</span><span>${b.progress||0}%</span></span>
    </button>`).join("")||`<div class="row"><span class="muted">No results</span></div>`}
  </div>`:`<div class="note">${canWrite?`No briefs yet. Click "New Brief" to start.`:`No briefs assigned to you yet.`}</div>`}`;
  const nb=$("#new"); if(nb) nb.onclick=newBrief;
  const cv=$("#csv"); if(cv) cv.onclick=exportCSV;
  const im=$("#imp"); if(im) im.onchange=e=>{ const f=e.target.files[0]; e.target.value=""; if(!f) return; const r=new FileReader();
    r.onload=async()=>{ let list; try{ const o=JSON.parse(r.result); list=Array.isArray(o)?o:o.briefs; if(!Array.isArray(list)) throw 0; }catch(_){ toast("الملف ده مش ملف بريفات"); return; }
      toast("بيستورد..."); try{ const n=await api("importBriefs",session,list); toast("اتستورد "+n+" بريف"); loadList(); }catch(err){ toast("ماقدرتش أستورد. "+err.message); } };
    r.readAsText(f); };
  const af=$("#amf"); if(af) af.onchange=e=>{amFilter=e.target.value; renderList();};
  const qi=$("#q"); if(qi){qi.oninput=e=>{query=e.target.value;const pos=e.target.selectionStart;renderList();const n=$("#q");n.focus();n.setSelectionRange(pos,pos);};}
  app.querySelectorAll("button.row[data-id]").forEach(b=>b.onclick=()=>go({v:"view",id:b.dataset.id}));
}

function newBrief(){
  const id="b"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  const today=new Date().toISOString().slice(0,10);
  draft={id,isNew:true,am:me,status:"draft",thumb:"",createdAt:Date.now(),answers:{brief_date:today, am_name: myRole==="am"?myName:""}};
  route={v:"edit",id}; render(); window.scrollTo(0,0);
}
function editBrief(id){
  const b=briefs.get(id); if(!b) return;
  draft={id,logo:b.logo||"",thumb:b.thumb||"",am:b.owner||me,status:b.status||"draft",createdAt:b.createdAt||Date.now(),answers:JSON.parse(JSON.stringify(b.answers||{}))};
  route={v:"edit",id}; render(); window.scrollTo(0,0);
}

function field(it,a){
  const v=a[it.id], id="f_"+it.id;
  switch(it.type){
    case "textarea": return `<textarea id="${id}" data-k="${it.id}" rows="2">${esc(v)}</textarea>`;
    case "url": return `<input type="url" dir="ltr" id="${id}" data-k="${it.id}" value="${esc(v)}" placeholder="https://">`;
    case "cred": { const o=v||{}; return `<div class="credf">${it.named?`<input type="text" data-cred="${it.id}" data-part="n" value="${esc(o.n)}" placeholder="اسم المنصة" aria-label="اسم المنصة">`:""}<input type="text" dir="ltr" id="${id}" data-cred="${it.id}" data-part="u" value="${esc(o.u)}" placeholder="الإيميل أو اليوزر" aria-label="${esc(it.label)}: الإيميل أو اليوزر" autocomplete="off"><input type="text" dir="ltr" data-cred="${it.id}" data-part="p" value="${esc(o.p)}" placeholder="الباسورد" aria-label="${esc(it.label)}: الباسورد" autocomplete="off" spellcheck="false">${it.withLink?`<input type="url" dir="ltr" data-cred="${it.id}" data-part="l" value="${esc(o.l)}" placeholder="لينك منصة الدومين (اختياري)" aria-label="لينك منصة الدومين" style="grid-column:1/-1">`:""}</div>`; }
    case "select": { const opts=[...it.options]; if(filled(v)&&!opts.includes(v)) opts.push(v);
      return `<select id="${id}" data-k="${it.id}"><option value=""${filled(v)?"":" selected"}>اختار...</option>${opts.map(o=>`<option value="${esc(o)}"${v===o?" selected":""}>${esc(o)}</option>`).join("")}</select>`; }
    case "number": return `<input type="number" min="0" inputmode="numeric" id="${id}" data-k="${it.id}" value="${esc(v)}">`;
    case "date": return `<input type="date" id="${id}" data-k="${it.id}" value="${esc(v)}">`;
    case "yn": case "choice": {
      const opts=it.type==="yn"?["أيوه","لا"]:it.options;
      return `<div class="seg" role="group" aria-label="${esc(it.label)}">${opts.map(o=>`<button type="button" data-one="${it.id}" data-v="${esc(o)}" aria-pressed="${v===o}">${esc(o)}</button>`).join("")}</div>`;}
    case "multi": return `<div class="seg" role="group" aria-label="${esc(it.label)}">${it.options.map(o=>`<button type="button" data-many="${it.id}" data-v="${esc(o)}" aria-pressed="${(v||[]).includes(o)}">${esc(o)}</button>`).join("")}</div>`;
    default: return `<input type="text" id="${id}" data-k="${it.id}" value="${esc(v)}"${it.ltr?' dir="ltr"':""}>`;
  }
}

function renderForm(){
  const a=draft.answers, p=progress(a);
  app.innerHTML=`
  <div class="topbar">
    <button class="btn ghost" id="back">← All Briefs</button>
    <span class="saved" id="saved">${draft.isNew?"هيتحفظ أول ما تكتب اسم المتجر":"محفوظ"}</span>
  </div>
  <h1 style="font-size:24px">${esc(a.store_name||"بريف جديد")}</h1>
  <div class="logo-pick">
    ${okLogo(draft.logo)
      ? `<span class="logo-tile"><img src="${esc(draft.logo)}" alt="لوجو العميل"></span><label class="btn" for="logofile">Change logo</label><button type="button" class="btn ghost danger" id="logodel">Remove logo</button>`
      : `<label class="logo-drop" id="logodrop" for="logofile"><span class="plus">+</span><span><b style="color:var(--ink);font-weight:600">لوجو العميل</b><br><span style="font-size:13px">اختياري. اسحب الصورة هنا أو اضغط تختارها</span></span></label>`}
    <input type="file" id="logofile" accept="image/*" hidden>
  </div>
  <div class="sticky">
    <div class="progline"><b id="pct">${p.pct}%</b><div class="bar"><i id="pbar" style="width:${p.pct}%"></i></div><span class="muted" style="font-size:13px" id="pcount">${p.d} من ${p.t}</span></div>
    <nav class="rail" id="rail">${railHTML(a)}</nav>
  </div>
  ${SECTIONS.map(s=>sectionHTML(s,a)).join("")}
  <div class="formfoot">
    <button class="btn primary" id="finish">Submit Brief</button>
    <span class="muted" style="font-size:13px">التسليم بيعلّم البريف "مكتمل" ويفتح صفحة البريف عشان تبعتها للفريق.</span>
  </div>`;
  $("#back").onclick=()=>go({v:"list"});
  $("#logofile").onchange=e=>{const f=e.target.files[0]; if(f) setLogo(f);};
  const ld=$("#logodel"); if(ld) ld.onclick=()=>{draft.logo=""; draft.thumb=""; changed(true);};
  const dz=$("#logodrop"); if(dz){ dz.ondragover=e=>{e.preventDefault();dz.classList.add("over");}; dz.ondragleave=()=>dz.classList.remove("over"); dz.ondrop=e=>{e.preventDefault();dz.classList.remove("over");const f=e.dataTransfer.files[0]; if(f) setLogo(f);}; }
  $("#finish").onclick=async()=>{ if(!filled(a.store_name)){toast("اكتب اسم المتجر الأول");$("#f_store_name").focus();return;} draft.status="done"; const dd=draft; draft=null; await flush(true, dd); const id=dd.id; go({v:"view",id}); };
  bindForm();
}
function railHTML(a){return SECTIONS.map(s=>{const c=secCount(s,a);return `<button type="button" data-sec="${s.id}" class="${c.t&&c.d===c.t?"full":""}">${esc(s.title)} <span style="font-variant-numeric:tabular-nums">${c.t?c.d+"/"+c.t:"اختياري"}</span></button>`;}).join("");}
function sectionHTML(s,a){
  const c=secCount(s,a);
  const body=s.items.filter(it=>visible(it,a)).map(it=>{
    if(it.type==="checks"){
      const sel=a[it.id]||[];
      return `<div class="checks" role="group" aria-label="${esc(it.label)}">${it.options.map(o=>`<label class="chk${sel.includes(o)?" on":""}"><input type="checkbox" data-chk="${it.id}" value="${esc(o)}"${sel.includes(o)?" checked":""}>${esc(o)}</label>`).join("")}</div>`;
    }
    return `<div class="q${it.showIf?" cond":""}${filled(a[it.id])||it.optional?"":" empty"}" data-q="${it.id}"${it.optional?" data-opt":""}>
      <div><label class="l" for="f_${it.id}">${esc(it.label)}</label>${it.hint?`<div class="h">${esc(it.hint)}</div>`:""}</div>
      <div class="a">${field(it,a)}</div></div>`;
  }).join("");
  return `<section class="sec" id="s_${s.id}"><div class="sec-h">${s.group?`<span class="grp">${esc(s.group)}</span>`:""}<h2>${esc(s.title)}</h2><span class="cnt">${cntText(c)}</span></div><div class="card">${body}</div></section>`;
}
function bindForm(){
  app.querySelectorAll("[data-k]").forEach(el=>{
    el.oninput=()=>{ draft.answers[el.dataset.k]=el.value; const q=el.closest(".q"); if(q) q.classList.toggle("empty",!filled(el.value)&&!q.hasAttribute("data-opt")); if(el.tagName==="TEXTAREA") autosize(el); changed(false); };
    if(el.tagName==="TEXTAREA") autosize(el);
  });
  app.querySelectorAll("[data-one]").forEach(b=>b.onclick=()=>{const k=b.dataset.one; draft.answers[k]=draft.answers[k]===b.dataset.v?"":b.dataset.v; changed(true);});
  app.querySelectorAll("[data-many]").forEach(b=>b.onclick=()=>{const k=b.dataset.many, arr=[...(draft.answers[k]||[])], i=arr.indexOf(b.dataset.v); i<0?arr.push(b.dataset.v):arr.splice(i,1); draft.answers[k]=arr; changed(true);});
  app.querySelectorAll("[data-cred]").forEach(el=>el.oninput=()=>{const k=el.dataset.cred; draft.answers[k]={...(draft.answers[k]||{}),[el.dataset.part]:el.value}; changed(false);});
  app.querySelectorAll("[data-chk]").forEach(c=>c.onchange=()=>{const k=c.dataset.chk; const arr=[...(draft.answers[k]||[])].filter(x=>x!==c.value); if(c.checked) arr.push(c.value); draft.answers[k]=arr; c.parentElement.classList.toggle("on",c.checked); changed(false);});
  $("#rail").onclick=e=>{const b=e.target.closest("[data-sec]"); if(b) document.getElementById("s_"+b.dataset.sec).scrollIntoView({behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth"});};
}
function autosize(el){el.style.height="auto";el.style.height=Math.min(el.scrollHeight+2,320)+"px";}
function changed(rerender){
  if(rerender){const y=window.scrollY; renderForm(); window.scrollTo(0,y);}
  else{const a=draft.answers,p=progress(a); $("#pct").textContent=p.pct+"%"; $("#pbar").style.width=p.pct+"%"; $("#pcount").textContent=`${p.d} من ${p.t}`; $("#rail").innerHTML=railHTML(a);
    app.querySelectorAll(".sec").forEach(sec=>{const s=SECTIONS.find(x=>"s_"+x.id===sec.id);const c=secCount(s,a);sec.querySelector(".cnt").textContent=cntText(c);});}
  clearTimeout(saveTimer); saveTimer=setTimeout(()=>flush(),1200);
  const sv=$("#saved"); if(sv) sv.textContent="بيتحفظ...";
}
const okLogo = v => typeof v==="string" && /^data:image\/(png|jpeg|webp);base64,/.test(v);
function setLogo(file){
  if(!/^image\//.test(file.type)){toast("الملف ده مش صورة");return;}
  const rd=new FileReader();
  rd.onload=()=>{const img=new Image(); img.onload=()=>{
      const max=360, k=Math.min(1,max/Math.max(img.naturalWidth||max,img.naturalHeight||max));
      const w=Math.max(1,Math.round((img.naturalWidth||max)*k)), h=Math.max(1,Math.round((img.naturalHeight||max)*k));
      const c=document.createElement("canvas"); c.width=w; c.height=h; c.getContext("2d").drawImage(img,0,0,w,h);
      let url=c.toDataURL("image/png"); if(url.length>150000) url=c.toDataURL("image/webp",0.85); if(url.length>150000) url=c.toDataURL("image/jpeg",0.82);
      if(!okLogo(url)||url.length>200000){toast("الصورة كبيرة أوي، جرّب صورة أصغر");return;}
      const tk=Math.min(1,96/Math.max(w,h)), tc=document.createElement("canvas"); tc.width=Math.max(1,Math.round(w*tk)); tc.height=Math.max(1,Math.round(h*tk)); tc.getContext("2d").drawImage(c,0,0,tc.width,tc.height);
      draft.logo=url; draft.thumb=tc.toDataURL("image/png"); if(draft.thumb.length>40000) draft.thumb=tc.toDataURL("image/jpeg",0.8); changed(true); };
    img.onerror=()=>toast("ماقدرتش أفتح الصورة دي");
    img.src=rd.result; };
  rd.readAsDataURL(file);
}
function bodyOf(d){const a=d.answers,p=progress(a);return {id:d.id,status:d.status,logo:okLogo(d.logo)?d.logo:"",thumb:okLogo(d.thumb)?d.thumb:"",progress:p.pct,createdAt:d.createdAt,answers:a};}
async function flush(force, d=draft){
  clearTimeout(saveTimer);
  if(!d||!me) return;
  if(!filled(d.answers.store_name)){const sv=$("#saved"); if(sv) sv.textContent="هيتحفظ أول ما تكتب اسم المتجر"; return;}
  if(saving){again=d;return;}
  saving=true;
  try{
    const body=bodyOf(d); const r=await api("saveBrief",session,body);
    d.isNew=false; d.am=r.owner;
    const prev=briefs.get(d.id)||{};
    briefs.set(d.id,{...body,id:d.id,owner:r.owner,assigned:prev.assigned||[],canEdit:true,store:String(body.answers.store_name||"").trim(),client:String(body.answers.client_name||"").trim(),amName:(briefs.get(d.id)||{}).amName||myName,updatedAt:r.updatedAt,partial:false});
    lastSaved=new Date(); const sv=$("#saved"); if(sv&&draft===d) sv.textContent="اتحفظ "+lastSaved.toLocaleTimeString("ar-EG",{hour:"numeric",minute:"2-digit"});
  }
  catch(e){ const sv=$("#saved"); if(sv) sv.textContent="ماتحفظش. "+(e.message||"اتأكد من النت وجرّب تكتب تاني"); }
  finally{ saving=false; if(again){const n=again; again=false; flush(false, n);} }
}
const credStr = o => { o=o||{}; const parts=[]; if(o.n) parts.push(o.n); if(o.l) parts.push("لينك: "+o.l); parts.push("يوزر: "+(o.u||"—")); parts.push("باسورد: "+(o.p||"—")); return parts.join(" | "); };
function linkify(text){
  const t=String(text??""), re=/(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi; let out="", last=0, m;
  while((m=re.exec(t))){
    let url=m[0]; const trail=(url.match(/[.,،;:!?)\]}"'»]+$/)||[""])[0]; if(trail) url=url.slice(0,-trail.length);
    out+=esc(t.slice(last,m.index));
    const href=/^www\./i.test(url)?"https://"+url:url;
    out+=`<a href="${esc(href)}" target="_blank" rel="noopener" dir="ltr" style="color:var(--accent)">${esc(url)}</a>`+esc(trail);
    last=m.index+m[0].length;
  }
  return out+esc(t.slice(last));
}
const ICO={
  copy:'<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>',
  eye:'<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  user:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
  link:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',
  lock:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'};
function accLink(l,pdf){
  const href=/^https?:\/\//i.test(l)?l:"https://"+l.replace(/^\/+/,"");
  return `<div class="acc-f"><span class="acc-k">${ICO.link}لينك تسجيل الدخول</span><div class="acc-v" dir="ltr"><a class="credv" href="${esc(href)}" target="_blank" rel="noopener" style="color:var(--accent)">${esc(l)}</a>${pdf?"":`<button type="button" class="ib" data-copyv="${esc(l)}" aria-label="نسخ" title="نسخ">${ICO.copy}</button>`}</div></div>`;
}
function accField(kind,v,pdf){
  const secret=kind==="p";
  const val=pdf||!secret?`<span class="credv sel" dir="ltr">${esc(v)}</span>`:`<span class="credv" dir="ltr" data-secret="${esc(v)}">••••••••••</span>`;
  const btns=pdf?"":`${secret?`<button type="button" class="ib" data-reveal aria-label="إظهار الباسورد" title="إظهار">${ICO.eye}</button>`:""}<button type="button" class="ib" data-copyv="${esc(v)}" aria-label="نسخ" title="نسخ">${ICO.copy}</button>`;
  return `<div class="acc-f"><span class="acc-k">${secret?ICO.lock:ICO.user}${secret?"الباسورد":"اليوزر"}</span><div class="acc-v" dir="ltr">${val}${btns}</div></div>`;
}
function accessHTML(s,a,pdf){
  const cards=s.items.filter(it=>filled(a[it.id])).map(it=>{const o=a[it.id]||{}; const name=it.named&&o.n?o.n:it.label;
    return `<div class="acc"><div class="acc-h"><b>${esc(name)}</b></div>
      ${it.withLink&&o.l?accLink(o.l,pdf):""}${o.u?accField("u",o.u,pdf):""}${o.p?accField("p",o.p,pdf):""}</div>`;}).join("");
  return `<section class="sec vsec" id="v_access"><div class="sec-h"><h2>${esc(s.title)}</h2></div><div class="card">${cards?`<div class="accgrid">${cards}</div>`:`<div class="vq"><dd class="none">مافيش أكسيس متسجّل</dd></div>`}</div></section>`;
}
function credHTML(o,pdf){ o=o||{};
  const row=(k,v,secret)=>`<div class="credr"><span class="credk">${k}</span>${!v?`<span class="none">—</span>`:(secret&&!pdf?`<span class="credv" dir="ltr" data-secret="${esc(v)}">••••••••</span><button type="button" class="mini" data-reveal>إظهار</button><button type="button" class="mini" data-copyv="${esc(v)}">نسخ</button>`:`<span class="credv sel" dir="ltr">${esc(v)}</span>${pdf?"":`<button type="button" class="mini" data-copyv="${esc(v)}">نسخ</button>`}`)}</div>`;
  return `<div class="cred">${o.n?`<div class="credr"><span class="credk">المنصة</span><span>${esc(o.n)}</span></div>`:""}${row("يوزر",o.u,false)}${row("باسورد",o.p,true)}</div>`; }
function briefText(b){
  const a=b.answers||{}; const lines=[`بريف: ${b.store||""}`,`العميل: ${b.client||""}`,`الأكاونت مانجر: ${amOf(b)||"—"}`, ""];
  for(const s of SECTIONS){ if(s.id==="access"&&!canSeeAccess()) continue; lines.push(`■ ${s.group?s.group+" / ":""}${s.title}`);
    for(const it of s.items){ if(!visible(it,a)||it.headerOnly) continue; const v=a[it.id];
      if(it.type==="checks") lines.push(`${it.label}: ${(v||[]).join("، ")||"—"}`);
      else if(it.type==="cred") lines.push(`${it.label}: ${filled(v)?credStr(v):"—"}`);
      else lines.push(`${it.label}: ${Array.isArray(v)?(v.join("، ")||"—"):(filled(v)?v:"—")}`);}
    lines.push(""); }
  return lines.join("\n");
}
function headHTML(b){const a=b.answers||{}; return `
    <div class="vtitle">${okLogo(b.logo)?`<span class="logo-tile"><img src="${esc(b.logo)}" alt="لوجو ${esc(b.store||"")}"></span>`:""}<div class="tt"><h1>${esc(b.store||"بدون اسم")}</h1><span class="pill ${b.status==="done"?"done":"draft"}">${b.status==="done"?"مكتمل":"مسودة"}</span></div></div>
    <div class="meta">
      <span><b>العميل</b>${esc(b.client||"—")}</span>
      <span><b>الأكاونت مانجر</b>${esc(amOf(b)||"—")}</span>
      <span><b>تاريخ البريف</b>${esc(a.brief_date?fmtDate(a.brief_date):"—")}</span>
      <span class="m-prog"><b>الإكتمال</b>${b.progress||0}%</span>
    </div>
    <div class="bar"><i style="width:${b.progress||0}%"></i></div>
`;}
function sectionsHTML(a,pdf){let prevGroup=null;return `${SECTIONS.map(s=>{const band=!!s.group&&s.group!==prevGroup; prevGroup=s.group||null;
  if(s.id==="access") return canSeeAccess()?accessHTML(s,a,pdf):"";
  return `${band?`<div class="grp-band"><span>${esc(s.group)}</span></div>`:""}<section class="sec vsec${s.group?" sub":""}${band?" after-group":""}"><div class="sec-h">${s.group?`<span class="grp">${esc(s.group)}</span>`:""}<h2>${esc(s.title)}</h2></div><div class="card"><dl>
    ${s.items.filter(it=>visible(it,a)&&!it.headerOnly).map(it=>{const v=a[it.id];
      if(it.type==="cred") return `<div class="vq"><dt>${esc(it.label)}</dt><dd>${filled(v)?credHTML(v,pdf):`<span class="none">—</span>`}</dd></div>`;
      if(it.type==="checks") return `<div class="vq"><dt>${esc(it.label)}</dt><dd><div class="tags">${it.options.map(o=>`<span class="tag${(v||[]).includes(o)?"":" off"}">${esc(o)}</span>`).join("")}</div></dd></div>`;
      const shown=Array.isArray(v)?v.join("، "):(it.type==="date"&&v?fmtDate(v):v);
      const isLink=it.type==="url"&&/^https?:\/\//i.test(v||"");
      return `<div class="vq"><dt>${esc(it.label)}</dt><dd class="${filled(v)?"":"none"}"${it.ltr||it.type==="url"?' dir="ltr" style="text-align:right"':""}>${filled(v)?(isLink?`<a href="${esc(v)}" target="_blank" rel="noopener" style="color:var(--accent)">${esc(v)}</a>`:linkify(shown)):"—"}</dd></div>`;}).join("")}
  </dl></div></section>`;}).join("")}`;}
function renderView(){
  const b=briefs.get(route.id);
  const src=b;
  if(b&&b.partial){ app.innerHTML=`<div class="note">Loading brief...</div>`; loadFull(b.id); return; }
  if(!b){app.innerHTML= loaded?`<div class="note">This brief doesn't exist or isn't shared with you. <button class="btn" id="back">All Briefs</button></div>`:`<div class="note">Loading brief...</div>`; const bk=$("#back"); if(bk) bk.onclick=()=>go({v:"list"}); return;}
  const a=b.answers||{};
  app.innerHTML=`
  <div class="topbar"><button class="btn ghost" id="back">← All Briefs</button></div>
  <div class="vhead">
${headHTML(b)}
    <div class="actions">
      ${canEditB(src)?`<button class="btn primary" id="edit">Edit</button>`:""}
      <button class="btn" id="copytxt">Copy as Text</button>
      ${downloads?`<button class="btn" id="pdf">Download PDF</button>`:""}
      <button class="btn" id="copylink">Copy Link</button>
      ${isAdmin&&src?(confirmDel?`<span class="confirm">هيتمسح البريف نهائي. متأكد؟ <button class="btn danger" id="delyes">Delete</button><button class="btn" id="delno">Cancel</button></span>`:`<button class="btn ghost danger" id="del">Delete</button>`):""}
    </div>
    ${assignHTML(src)}
  </div>
  ${sectionsHTML(a)}`;
  const bk=$("#back"); if(bk) bk.onclick=()=>go({v:"list"});
  const ed=$("#edit"); if(ed) ed.onclick=()=>editBrief(src.id);
  $("#copytxt").onclick=()=>copy(briefText(b));
  const pb=$("#pdf"); if(pb) pb.onclick=()=>exportPDF(b,pb);
  app.querySelectorAll("[data-reveal]").forEach(btn=>btn.onclick=()=>{const sp=btn.parentElement.querySelector("[data-secret]"); const hidden=sp.textContent.startsWith("••"); sp.textContent=hidden?sp.dataset.secret:"••••••••••"; btn.classList.toggle("on",hidden); btn.setAttribute("aria-label",hidden?"إخفاء الباسورد":"إظهار الباسورد");});
  app.querySelectorAll("[data-copyv]").forEach(btn=>btn.onclick=()=>copy(btn.dataset.copyv));
  const cl=$("#copylink"); if(cl) cl.onclick=()=>copy(briefLink(src.id));
  bindAssign(src);
  const dl=$("#del"); if(dl) dl.onclick=()=>{confirmDel=true;renderView();};
  const dn=$("#delno"); if(dn) dn.onclick=()=>{confirmDel=false;renderView();};
  const dy=$("#delyes"); if(dy) dy.onclick=async()=>{try{await api("deleteBrief",session,src.id); briefs.delete(src.id); toast("اتمسح"); go({v:"list"});}catch(e){toast("ماقدرتش أمسحه. "+e.message);}};
}

const downloads={ save:async({filename,data})=>{ const blob=data instanceof Blob?data:new Blob([data],{type:/\.pdf$/.test(filename)?"application/pdf":"text/csv;charset=utf-8"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=filename; a.rel="noopener"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),60000); } };
const PDF_BG="#0B2420";
function loadScript(src){return new Promise((res,rej)=>{const el=document.createElement("script");el.src=src;el.onload=res;el.onerror=rej;document.head.appendChild(el);});}
async function pdfLibs(){
  if(!window.html2canvas) await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
  if(!window.jspdf) await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
}
const safeName = t => (String(t||"brief").replace(/[\\/:*?"<>|#]+/g," ").replace(/\s+/g," ").trim().slice(0,80)||"brief");
async function exportPDF(b,btn){
  const label=btn.textContent; btn.disabled=true; btn.textContent="بيجهّز الـ PDF...";
  let wrap=null;
  try{
    await pdfLibs(); try{await document.fonts.ready;}catch(_){}
    wrap=document.createElement("div"); wrap.className="pdfwrap";
    const host=document.createElement("div"); host.className="pdfdoc pdf-dark";
    host.innerHTML=`<div class="vhead">${headHTML(b)}</div>${sectionsHTML(b.answers||{},true)}`;
    const inner=document.createElement("div"); inner.className="bapp"; inner.appendChild(host); wrap.appendChild(inner); document.body.appendChild(wrap);
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const W=794, scale=2, hr=host.getBoundingClientRect(), total=Math.ceil(hr.height);
    const texts=[]; host.querySelectorAll(".sel").forEach(el=>{const t=el.textContent; if(!/^[\x20-\x7E]+$/.test(t)) return; const r=el.getBoundingClientRect(); texts.push({x:r.left-hr.left,y:r.top-hr.top,w:r.width,h:r.height,t});});
    const links=[]; host.querySelectorAll("a[href]").forEach(a=>{ for(const r of a.getClientRects()) links.push({x:r.left-hr.left,y:r.top-hr.top,w:r.width,h:r.height,url:a.href}); });
    const cands=[...host.querySelectorAll(".vq,.vhead,.pdf-top,.checks,.accgrid")].map(e=>e.getBoundingClientRect().bottom-hr.top)
      .concat([...host.querySelectorAll(".sec:not(.after-group),.grp-band")].map(e=>e.getBoundingClientRect().top-hr.top-2)).sort((x,y)=>x-y);
    const canvas=await html2canvas(host,{scale,backgroundColor:PDF_BG,logging:false,width:W,height:total,windowWidth:1100});
    wrap.remove(); wrap=null;
    const {jsPDF}=window.jspdf; const pdf=new jsPDF({unit:"pt",format:"a4",compress:true});
    const PW=pdf.internal.pageSize.getWidth(), PH=pdf.internal.pageSize.getHeight(), k=PW/W, m=30, maxH=PH/k-2*m;
    let y0=0, pages=0;
    while(y0<total-1){
      let y1=Math.min(total,y0+maxH);
      if(y1<total){const c=cands.filter(v=>v>y0+80&&v<=y1); if(c.length) y1=c[c.length-1];}
      if(pages) pdf.addPage();
      const sh=Math.max(1,Math.round((y1-y0)*scale)), pc=document.createElement("canvas"); pc.width=canvas.width; pc.height=sh;
      const ctx=pc.getContext("2d"); ctx.fillStyle=PDF_BG; ctx.fillRect(0,0,pc.width,sh);
      ctx.drawImage(canvas,0,Math.round(y0*scale),canvas.width,sh,0,0,canvas.width,sh);
      pdf.setFillColor(PDF_BG); pdf.rect(0,0,PW,PH,"F");
      pdf.addImage(pc.toDataURL("image/jpeg",0.92),"JPEG",0,m*k,PW,(y1-y0)*k);
      for(const T of texts){ if(T.y>=y0-1&&T.y+T.h<=y1+1){ const fs=T.h*k*0.72; pdf.setFont("helvetica","normal"); pdf.setFontSize(fs); const tw=pdf.getTextWidth(T.t); pdf.text(T.t, T.x*k, (T.y-y0+m)*k + T.h*k*0.78, {renderingMode:"invisible", horizontalScale: tw>0 ? (T.w*k)/tw : 1}); } }
      for(const L of links){ if(L.y>=y0-1&&L.y+L.h<=y1+1) pdf.link(L.x*k,(L.y-y0+m)*k,L.w*k,L.h*k,{url:L.url}); }
      y0=y1; pages++;
    }
    pdf.setFontSize(8); pdf.setTextColor(120,135,129);
    for(let p=1;p<=pages;p++){ pdf.setPage(p); pdf.setFont("helvetica","normal"); pdf.text(p+" / "+pages, PW/2, PH-14, {align:"center", horizontalScale:1, renderingMode:"fill"}); }
    await downloads.save({filename:safeName(b.store)+".pdf", data:pdf.output("arraybuffer")});
  }catch(e){
    if(!(e&&e.code==="declined")){ const why=String((e&&(e.message||e.code))||e||"").slice(0,90); toast(e&&e.code==="unavailable"?"التحميل مش متاح هنا":"ماقدرتش أعمل الـ PDF. السبب: "+why); }
  }finally{ if(wrap) wrap.remove(); btn.disabled=false; btn.textContent=label; }
}
async function exportCSV(){
  let all; try{ toast("بيجهّز الملف..."); all=await api("exportAll",session); }catch(e){ toast("ماقدرتش أصدّر. "+e.message); return; }
  const items=[]; for(const s of SECTIONS) for(const it of s.items) if(!it.headerOnly) items.push({sec:s.title,it});
  const cell=v=>{const t=String(v??""); return /[",\n\r]/.test(t)?'"'+t.replace(/"/g,'""')+'"':t;};
  const head=["المتجر","العميل","الأكاونت مانجر","الحالة","الإكتمال %","تاريخ الإنشاء","آخر تعديل","لينك البريف",...items.map(x=>x.sec+" - "+x.it.label)];
  const rows=all.sort((x,y)=>(y.updatedAt||0)-(x.updatedAt||0)).map(b=>{const a=b.answers||{};
    return [b.store,b.client,amOf(b),b.status==="done"?"مكتمل":"مسودة",b.progress||0,b.createdAt?new Date(b.createdAt).toISOString().slice(0,10):"",b.updatedAt?new Date(b.updatedAt).toISOString().slice(0,10):"",briefLink(b.id),
      ...items.map(x=>{const v=a[x.it.id]; return x.it.type==="cred"?(filled(v)?credStr(v):""):Array.isArray(v)?v.join("، "):(v??"");})];});
  const csv="﻿"+[head,...rows].map(r=>r.map(cell).join(",")).join("\r\n");
  try{ await downloads.save({filename:"briefs-"+new Date().toISOString().slice(0,10)+".csv", data:csv}); }
  catch(e){ if(!(e&&e.code==="declined")) toast("ماقدرتش أصدّر الملف"); }
}
async function loadList(){
  if(!me) return;
  try{ const r=await api("listBriefs",session);
    const m=new Map(); for(const b of r.briefs){ const old=briefs.get(b.id); m.set(b.id, old&&!old.partial&&old.updatedAt>=b.updatedAt?old:b); }
    briefs=m; loaded=true; if(route.v==="list"||(route.v==="view"&&!briefs.has(route.id))) render(); }
  catch(e){ if(!/SESSION|الجلسة/.test(e.message)){ loaded=true; if(route.v==="list") app.innerHTML=`<div class="note">ماقدرتش أحمّل البريفات. ${esc(e.message)}</div>`; } }
}
async function loadFull(id){
  try{ const b=await api("getBrief",session,id); briefs.set(id,b); }
  catch(e){ briefs.delete(id); loaded=true; }
  if(route.v==="view"&&route.id===id) render();
}
function assignHTML(b){
  if(!b) return "";
  const cur=(b.assigned||[]);
  if(!canEditB(b)) return cur.length?`<div class="assign"><span class="muted" style="font-size:13px">Assigned team:</span><div class="tags">${cur.map(x=>`<span class="tag">${esc(x.name)}</span>`).join("")}</div></div>`:"";
  if(!teamUsers) return `<div class="assign"><span class="muted" style="font-size:13px">Assigned team: loading...</span></div>`;
  const on=new Set(cur.map(x=>x.u));
  return `<div class="assign"><div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap"><b style="font-size:14px">Assigned Team</b><span class="muted" style="font-size:12.5px">Only they can view it (read-only)</span></div>
    <div class="seg" id="asg">${teamUsers.map(t=>`<button type="button" data-asg="${esc(t.u)}" aria-pressed="${on.has(t.u)}">${esc(t.name)}<span style="opacity:.7;font-size:12px"> · ${esc(t.job||"")}</span></button>`).join("")}</div>
    <div><button class="btn" id="asgsave" hidden>Save Team</button></div></div>`;
}
function bindAssign(b){
  if(!canEditB(b)) return;
  if(!teamUsers){ window.erpCall("briefTeam",{}).then(r=>{ teamUsers=r; if(route.v==="view"&&route.id===b.id) renderView(); }).catch(e=>toast(e.message)); return; }
  const box=$("#asg"), sv=$("#asgsave"); if(!box) return;
  box.querySelectorAll("[data-asg]").forEach(x=>x.onclick=()=>{ x.setAttribute("aria-pressed", x.getAttribute("aria-pressed")!=="true"); sv.hidden=false; });
  sv.onclick=async()=>{ sv.disabled=true; sv.textContent="Saving...";
    const list=[...box.querySelectorAll('[data-asg][aria-pressed="true"]')].map(x=>x.dataset.asg);
    try{ const r=await window.erpCall("briefAssign",{id:b.id,assigned:list}); b.assigned=r; toast("اتحفظ الفريق ✓"); renderView(); }
    catch(e){ toast(e.message); sv.disabled=false; sv.textContent="Save Team"; } };
}
window.BriefModule={
  enter(el,user,opts){
    const has=p=>(user.perms||[]).indexOf(p)>=0;
    app=el; me=user.username; myName=user.name; isAdmin=has("briefs.manage_all");
    myRole=isAdmin?"admin":has("briefs.manage_own")?"am":"team";
    canWrite=isAdmin||myRole==="am"; seeAccess=!!user.seeAccess||has("briefs.access_all");
    const id=opts&&opts.id;
    if(id){ route={v:"view",id}; setHash(id); render(); if(!briefs.has(id)||briefs.get(id).partial) loadFull(id); loadList(); }
    else { route={v:"list"}; setHash(""); render(); loadList(); }
    window.scrollTo(0,0);
  },
  leave(){ if(route.v==="edit"&&draft){ flush(false,draft); draft=null; } route={v:"list"}; setHash(""); }
};

})();
