importScripts('js/serviceworker-cache-polyfill.js');
//vbump2
var cacheVersion = 'test-14';

self.addEventListener('install', function (event) {
  console.log('install');
  event.waitUntil(
    caches.open(cacheVersion)
      .then(function(cache) {
        console.log('Opened cache: ' + cacheVersion);
        return cache.addAll([
          'index.html',
          'js/app.js',
          'css/app.css',
          'img/dog.jpg'
        ]);
      })
  );
});

self.addEventListener('fetch', function (event) {
  console.log('fetch: ' + cacheVersion);
  caches.keys().then(function(cacheNames) {
    console.log(cacheNames);
  });
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        console.log(event.request, response);
        if (response) {

          return response;
        }

        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', function (event) {
  console.log('activate');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
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
