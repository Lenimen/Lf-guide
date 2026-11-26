/* Hors ligne : garde l'app et les fiches en cache. Changer VERSION à chaque mise en ligne. */
var VERSION='lf-app-v18';
var FICHIERS=['./','index.html','manifest.webmanifest','icons/logo-creme.png','icons/icon-192.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(VERSION).then(function(c){return c.addAll(FICHIERS)}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(n){return n!==VERSION}).map(function(n){return caches.delete(n)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
  var u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  /* Réseau d'abord (toujours la dernière version), cache si pas de réseau */
  e.respondWith(fetch(e.request).then(function(r){var c=r.clone();caches.open(VERSION).then(function(x){x.put(e.request,c)});return r}).catch(function(){return caches.match(e.request,{ignoreSearch:true}).then(function(r){return r||caches.match('index.html')})}));
});
/* Notifications push (envoyées au plus une fois par jour par la fonction notifs-push) */
self.addEventListener('push',function(e){
  var d={};try{d=e.data?e.data.json():{}}catch(x){d={texte:e.data&&e.data.text()}}
  e.waitUntil(self.registration.showNotification(d.titre||'LF Coaching',{body:d.texte||'',icon:'icons/icon-192.png',badge:'icons/icon-192.png',tag:'lf',data:{lien:d.lien||'#notifs'}}));
});
self.addEventListener('notificationclick',function(e){
  e.notification.close();var lien=(e.notification.data&&e.notification.data.lien)||'#notifs';
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(l){
    if(l.length){l[0].postMessage({lien:lien});return l[0].focus()}
    return self.clients.openWindow('./'+lien);
  }));
});
