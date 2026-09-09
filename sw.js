const CACHE='weight-log-v12';
const ASSETS=['./','./index.html','./manifest.webmanifest'];

const COMPACT_STYLE=`<style id="compact-mobile-v12">
@media(max-width:520px){
  .wrap{padding:12px}
  .head{margin:3px 0 9px}
  .card{padding:13px;margin-bottom:10px}
  .chartTop{margin-bottom:6px}
  .rangeTabs{gap:7px}
  .rangeBtn{padding:7px 10px}
  .recordTabs{margin-bottom:9px;gap:7px}
  .tabBtn{padding:10px 7px;min-width:0}
  #weightPanel .sectionTitle{font-size:17px}
  #weightPanel>.sub{margin-bottom:7px!important}
  #weightPanel .row{display:grid!important;grid-template-columns:calc((100% - 8px)/2) calc((100% - 8px)/2)!important;gap:8px!important;align-items:end!important;width:100%;overflow:hidden}
  #weightPanel .row .field{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;overflow:hidden!important}
  #weightPanel .row .field input{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;height:48px!important;box-sizing:border-box!important;padding:10px 9px!important;font-size:15px!important;line-height:1.2!important}
  #weightPanel .row .field input[type="date"]{appearance:none;-webkit-appearance:none;padding:10px 7px!important;font-size:14px!important}
  #weightPanel .row .field input[type="date"]::-webkit-date-and-time-value{text-align:center;min-width:0;margin:0}
  #weightPanel textarea{min-height:52px;height:52px;padding:10px 11px;font-size:14px}
  #weightPanel .gap{height:7px}
  #weightPanel label{margin-bottom:4px}
  #weightPanel .primary{padding:12px 14px}
}
</style>`;

function compactHtml(html){
  let out=html;
  out=out.replace('canvas{width:100%;height:170px;', 'canvas{width:100%;height:155px;');
  out=out.replace('<canvas id="chart" width="680" height="170"></canvas>', '<canvas id="chart" width="680" height="155"></canvas>');
  out=out.replace('w=c.clientWidth||340,h=170;', 'w=c.clientWidth||340,h=155;');
  out=out.replace('</head>', COMPACT_STYLE+'\n</head>');
  return out;
}

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.mode==='navigate'){
    e.respondWith((async()=>{
      try{
        const res=await fetch(req,{cache:'no-store'});
        const type=res.headers.get('content-type')||'';
        if(!type.includes('text/html')) return res;
        const html=compactHtml(await res.text());
        const headers=new Headers(res.headers);
        headers.delete('content-length');
        const transformed=new Response(html,{status:res.status,statusText:res.statusText,headers});
        const cacheCopy=transformed.clone();
        caches.open(CACHE).then(c=>c.put('./index.html',cacheCopy));
        return transformed;
      }catch(err){
        const cached=await caches.match('./index.html');
        if(!cached) throw err;
        const html=compactHtml(await cached.text());
        return new Response(html,{headers:{'content-type':'text/html; charset=utf-8'}});
      }
    })());
    return;
  }
  e.respondWith(
    caches.match(req).then(r=>r||fetch(req).then(res=>{
      const copy=res.clone();
      caches.open(CACHE).then(c=>c.put(req,copy));
      return res;
    }))
  );
});
