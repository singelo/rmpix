self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('push',e=>{let data={};try{data=e.data.json()}catch{}e.waitUntil(self.registration.showNotification('RM PIX',{body:data.body||'Nova movimentação na partida.',tag:data.tag||'rmpix',icon:'/icon.svg',data:{url:'/'},renotify:false}))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>cs.length?cs[0].focus():self.clients.openWindow('/')))});
