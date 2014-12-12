(function() {

  navigator.serviceWorker.register('/worker.js', {
    scope: '/r3search/'
  }).then(function(reg) {
    console.log('success', reg);
  }, function(err) {
    console.log('fail', err);
  });

}());
