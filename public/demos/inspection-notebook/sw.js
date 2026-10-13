const CACHE = 'inspection-notebook-v1.1.0-r2';
const ASSETS = ['./','./index.html','./styles.css','./app.mjs','./core.mjs','./storage.mjs','./manifest.webmanifest','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(ASSETS);await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('inspection-notebook-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const cached=await cache.match(event.request);
    if(cached)return cached;
    try{return await fetch(event.request);}
    catch(error){if(event.request.mode==='navigate')return await cache.match(new URL('./index.html',self.registration.scope));throw error;}
  })());
});
