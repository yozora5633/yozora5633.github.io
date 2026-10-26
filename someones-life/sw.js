// No skipWaiting: a waiting release takes over after the old pages have closed.
const CACHE='life-dd8551d82d8ef571';
const SHELL=['index.html','manifest.webmanifest','icon-192.png','icon-512.png'];
const unavailable=()=>new Response('<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>誰かの一生</title><p>通信できず，保存した画面も見つかりませんでした。</p><button onclick="location.reload()">もう一度読み込む</button></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
const local=path=>new URL(path,self.registration.scope).href;
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL.map(local)))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('life-')&&key!==CACHE).map(key=>caches.delete(key))))));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 const navigation=request.mode==='navigate'||url.href===local('index.html')||url.href===self.registration.scope;
 const asset=/\/assets\/[^/]+\.[a-f0-9]{20}\.(json|js|css)$/.test(url.pathname);
 if(!navigation&&!asset&&!SHELL.some(path=>url.href===local(path)))return;
 const key=navigation?local('index.html'):request;
 const update=async()=>{
  const response=await fetch(request,{cache:navigation?'no-cache':'default'});
  if(!response.ok)throw Error('HTTP '+response.status);
  const cache=await caches.open(CACHE);await cache.put(key,response.clone());return response;
 };
 if(!navigation){event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(key))||update()).catch(()=>Response.error()));return;}
 let timer;
 const network=update();
 // Keep the network request alive after the fallback is shown, refreshing its copy.
 event.waitUntil(network.then(()=>{},()=>{}));
 event.respondWith((async()=>{
  const cached=await caches.open(CACHE).then(cache=>cache.match(key));
  const deadline=new Promise(resolve=>{timer=setTimeout(()=>resolve(null),3000);});
  try{const response=await Promise.race([network.catch(()=>null),deadline]);if(response)return response;return cached||unavailable();}
  catch{return cached||unavailable();}
  finally{clearTimeout(timer);}
 })());
});

// Cache successful initial-page transfers too, before this page is controlled.
self.addEventListener('message',event=>{
 const data=event.data;if(data?.kind!=='cache-asset'||!(data.body instanceof ArrayBuffer))return;
 const url=new URL(data.url);
 if(url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope)||!/\/assets\/[^/]+\.[a-f0-9]{20}\.(json|js)$/.test(url.pathname))return;
 event.waitUntil((async()=>{
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data.body))).map(n=>n.toString(16).padStart(2,'0')).join('');
  if(!url.pathname.includes('.'+hash.slice(0,20)+'.'))return;
  const cache=await caches.open(CACHE);await cache.put(url.href,new Response(data.body,{headers:{'Content-Type':url.pathname.endsWith('.json')?'application/json':'text/javascript'}}));
 })());
});
