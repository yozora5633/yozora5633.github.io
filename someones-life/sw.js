// Each release owns a complete immutable shell. A waiting release takes over
// only after old pages close; installing it must never replace their HTML.
const CACHE='life-a7921837aa0b2676';
const DOCUMENT_HASH='3c1ded228071bb70f3fbc954d6af8c6f64a34792f2549ff01dcd3591689404c9';
const OPTIONAL=["assets/bc-trials-data-121.7b47638a538c74820e0f.json", "assets/china-history-data.6ba56b49617fc9741609.json", "assets/cn-university-tables-116.f753062902373584772e.json", "assets/jp-historical-catalogue-115.c9dc36e6a356a0401cf5.json", "assets/jp-university-locations-108.499d15c1cee6b4757c76.json", "assets/local-food-data-122.bfeecb4598e1ac5a677c.json", "assets/past-hensachi-data-113.21653d42420d20202d36.json", "assets/places-chn-data-105.c20fe7519f9391b38c84.json", "assets/places-hkg-data-106.a306d0a3aab2c545c9b8.json", "assets/places-jpn-data-104.1760f2b95cdab5fbd348.json", "assets/places-mac-data-107.e866266dac4cb1623cf0.json", "assets/prewar-births-111.3dfce7a6c89355cb8493.json", "assets/prewar-calibrated-110.2553f01321d6f6460606.json", "assets/prewar-cj-data-118.dd3045ce955a5f6977f0.json", "assets/prewar-data-124.1a2c4a7ad7983aec1403.json", "assets/prewar-events-119.624478abbf03f1f14ba5.json", "assets/prewar-polities-112.b23575ecf86a61c956f4.json", "assets/prewar-research-120.fe49de1158dc816d2d3f.json", "assets/prewar-social-data.f15583eba257a75dc5ff.json", "assets/prewar-wars-109.f2b1d2e0f5ef75f492c5.json", "assets/school-tables-117.2007dc17feb889307a91.json", "assets/selectivity-tables-114.aab4aa4c309bda045389.json", "assets/somatic-medical-data.637a1aaca8f34c08dc10.json"];
const SHELL=['index.html','manifest.webmanifest','icon-192.png','icon-512.png',...["assets/core.690723f6c5a9cb59e7a9.json", "assets/countries.192d2c642a20e92cadd2.json", "assets/game.cf0708752daf6c437fe0.js", "assets/people.9a4eb97018714ab1ebf4.json"]];
const unavailable=()=>new Response('<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>誰かの一生</title><p>通信できず、保存した画面も見つかりませんでした。</p><button onclick="location.reload()">もう一度読み込む</button></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
const local=path=>new URL(path,self.registration.scope).href;
async function verified(response,hash){
 if(!response.ok)throw Error('HTTP '+response.status);
 if(hash){const actual=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await response.clone().arrayBuffer()))).map(n=>n.toString(16).padStart(2,'0')).join('');if(!actual.startsWith(hash))throw Error('Release asset mismatch');}
 return response;
}
async function download(url,hash){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);try{return await verified(await fetch(url,{cache:'no-cache',signal:controller.signal}),hash);}finally{clearTimeout(timer);}}
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 try{for(const path of SHELL){const hash=path==='index.html'?DOCUMENT_HASH:path.match(/\.([a-f0-9]{20})\./)?.[1];await cache.put(local(path),await download(local(path),hash));}
  // Retain offline access to data already used by a saved life. If its hash
  // changed, fetch the corresponding new table before activating this release.
  const previous=await Promise.all((await caches.keys()).filter(k=>k.startsWith('life-')&&k!==CACHE).map(k=>caches.open(k)));
  const used=(await Promise.all(previous.map(c=>c.keys()))).flat().map(r=>r.url);
  const family=url=>url.replace(/\.[a-f0-9]{20}\./,'.');
  for(const path of OPTIONAL){const url=local(path);if(!used.some(old=>family(old)===family(url)))continue;const hash=path.match(/\.([a-f0-9]{20})\./)?.[1];let response;for(const old of previous){response=await old.match(url);if(response)break;}await cache.put(url,response?await verified(response,hash):await download(url,hash));}
 }
 catch(error){await caches.delete(CACHE);throw error;}
})()));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('life-')&&key!==CACHE).map(key=>caches.delete(key))))));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 const navigation=request.mode==='navigate'||url.href===local('index.html')||url.href===self.registration.scope;
 const hash=url.pathname.match(/\/assets\/[^/]+\.([a-f0-9]{20})\.(json|js|css)$/)?.[1];
 if(!navigation&&!hash&&!SHELL.some(path=>url.href===local(path)))return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE),key=navigation?local('index.html'):request,cached=await cache.match(key);if(cached)return cached;if(navigation)return unavailable();try{const response=await download(url,hash);await cache.put(key,response.clone());return response;}catch{return Response.error();}})());
});
// Cache successful initial-page transfers too, before this page is controlled.
self.addEventListener('message',event=>{
 const data=event.data;if(data?.kind!=='cache-asset'||!(data.body instanceof ArrayBuffer))return;
 const url=new URL(data.url),hash=url.pathname.match(/\/assets\/[^/]+\.([a-f0-9]{20})\.(json|js)$/)?.[1];
 if(url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope)||!hash)return;
 event.waitUntil((async()=>{const response=await verified(new Response(data.body,{headers:{'Content-Type':url.pathname.endsWith('.json')?'application/json':'text/javascript'}}),hash);const cache=await caches.open(CACHE);await cache.put(url.href,response);})());
});
