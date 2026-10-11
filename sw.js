/* Service worker: بيخلي الموقع تطبيق يتثبت، وبيستقبل إشعارات الموبايل.
   مفيش fetch handler عشان مايعدّيش على كل طلب ويبطّأ الموقع. */
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('push', e => {
  let d = {};
  try { const j = e.data ? e.data.json() : {}; d = j.data || j.notification || j; } catch (x) { d = { title: 'Miqnas', body: e.data ? e.data.text() : '' }; }
  const title = d.title || 'Miqnas';
  e.waitUntil(self.registration.showNotification(title, { body: d.body || '', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: d.tag || undefined, data: { go: d.go || '' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const go = (e.notification.data && e.notification.data.go) || '';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const w = list.find(c => c.url.indexOf(self.registration.scope) === 0);
    if (w) { w.postMessage({ type: 'push-go', go: go }); return w.focus(); }
    return self.clients.openWindow(self.registration.scope + (go ? '?go=' + encodeURIComponent(go) : ''));
  }));
});
