/* Service worker بسيط: بيخلي الموبايل يعرف إن الموقع تطبيق يتثبت.
   مش بيخزن حاجة، فكل فتحة بتجيب آخر نسخة من الموقع (نفس اللي على اللابتوب). */
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
