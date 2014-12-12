(function() {

  navigator.serviceWorker.register('/r3search/worker.js', {
  }).then(function(reg) {
    console.log('success', reg);
  }, function(err) {
    console.log('fail', err);
  });

}());
