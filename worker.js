importScripts('js/serviceworker-cache-polyfill.js');

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open('test-cache')
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll([
          'index.html',
          'js/app.js',
          'css/app.css',
          'img/dog.jpg'
        ]);
      })
  );
});

/*
self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request);
      }
    );
  );
});
*/
