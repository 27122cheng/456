// 台股雷達 Service Worker — 靜態資源快取（App Shell）
const CACHE = 'taistock-v2';
const ASSETS = ['./', './index.html', './css/styles.css', './js/app.js', './js/api.js', './js/indicators.js', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 靜態資源：網路優先、失敗才用快取（確保部署更新即時生效）；API 請求不攔截
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/')) return; // 資料代理不快取、不攔截
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
