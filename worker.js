importScripts('js/serviceworker-cache-polyfill.js');
//vbump2
var cacheNameStatic = 'r3search-static-v3';
var cacheNameWikipedia = 'r3search-wikipedia-v1';

var currentCacheNames = [
  cacheNameStatic,
  cacheNameWikipedia
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(cacheNameStatic)
      .then(function(cache) {
        return cache.addAll([
          '/r3search/',
          '/r3search/js/app.js',
          '/r3search/css/app.css',
          '/r3search/img/loading.svg'
        ]);
      })
  );
});


self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            if (currentCacheNames.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
});

self.addEventListener('fetch', function (event) {
  var requestURL = new URL(event.request.url);

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {

        if (response) {
          return response;
        }

        var fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          function(response) {

            var shouldCache = false;

            if(response && response.status === 200 && response.type === 'basic') {
              shouldCache = cacheNameStatic;
            } else { // if response returns anything but a standard success response (200) or response isn't from our origin

              if (requestURL.hostname === 'en.wikipedia.org' || requestURL.hostname === 'upload.wikimedia.org') {
                shouldCache = cacheNameWikipedia;
              } else {
                // just let response pass through, don't cache
              }

            }

            if (shouldCache) {
              var responseToCache = response.clone();

              caches.open(shouldCache)
                .then(function(cache) {
                  var cacheRequest = event.request.clone();
                  cache.put(cacheRequest, responseToCache);
                });
            }

            return response;
          }
        );
      })
  );
});


