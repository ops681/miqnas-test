/* Service worker بسيط: بيخلي الموبايل يعرف إن الموقع تطبيق يتثبت.
   مفيش fetch handler عشان مايعدّيش على كل طلب ويبطّأ الموقع (التثبيت مش محتاجه). */
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
