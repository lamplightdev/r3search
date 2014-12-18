importScripts('js/serviceworker-cache-polyfill.js');
//vbump2
var cacheVersion = 'test-16';

self.addEventListener('install', function (event) {
  console.log('install');
  event.waitUntil(
    caches.open(cacheVersion)
      .then(function(cache) {
        console.log('Opened cache: ' + cacheVersion);
        return cache.addAll([
          '/r3sarch/',
          '/r3search/js/app.js',
          '/r3search/css/app.css'
        ]);
      })
  );
});

self.addEventListener('fetch', function (event) {
  //console.log('fetch: ' + cacheVersion);
  caches.keys().then(function(cacheNames) {
    //console.log(cacheNames);
  });
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {

        if (response) {
          return response;
        }

        var fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          function(response) {
            //if(!response || response.status !== 200 || response.type !== 'basic') {
            //  return response;
            //}

            var responseToCache = response.clone();

            caches.open(cacheVersion)
              .then(function(cache) {
                var cacheRequest = event.request.clone();
                console.log(cacheRequest, responseToCache);
                cache.put(cacheRequest, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', function (event) {
  console.log('activate');
  event.waitUntil(
    caches.keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            if (cacheName !== cacheVersion) {
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
});
