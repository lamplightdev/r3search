//(function() {

  navigator.serviceWorker.register('/r3search/worker.js', {
    scope: 'r3search'
  }).then(function(reg) {
    console.log('success', reg);
  }, function(err) {
    console.log('fail', err);
  });

//}());
