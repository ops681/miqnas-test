# Miqnas ERP — الواجهة

| الملف | فيه إيه |
| --- | --- |
| `index.html` | هيكل الصفحة + تحميل الملفات بالترتيب |
| `version.json` | رقم النسخة. أي تعديل لازم يغيّره عشان المتصفحات تحمّل الجديد |
| `core/config.js` | لينك السيرفر، الحالة العامة `S`، أدوات صغيرة |
| `core/api.js` | الاتصال بالسيرفر + إعادة المحاولة + الكاش |
| `core/auth.js` | اللوجين والخروج |
| `core/shell.js` | القايمة الجانبية، التنقل، الجرس، العدادات |
| `core/styles.css` | التصميم العام |
| `core/start.js` | تشغيل السيستم (آخر ملف) |
| `modules/dashboard/` | الداشبورد |
| `modules/attendance/` | البصمة والبريك ومشاركة الشاشة (`clock.js`) + تقارير الحضور (`reports.js`) |
| `modules/people/` | الموظفين |
| `modules/settings/` | الإعدادات |
| `modules/blockers/` | البلوكرز |
| `modules/projects/` | المشاريع والتاسكات و My Tasks |
| `modules/briefs/` | البريفات |

الباك إند (Apps Script) في الـ repo الخاص `miqnas-backend`.
