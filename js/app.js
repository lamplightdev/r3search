(function() {

  navigator.serviceWorker.register('/r3search/worker.js', {
    scope: '/r3search/'
  }).then(function(reg) {
    console.log('success', reg);
  }, function(err) {
    console.log('fail', err);
  });

  document.addEventListener("DOMContentLoaded", function (event) {
    var links = document.querySelectorAll('.ajax-get');
    for(var i=0; i<links.length;i++) {
      links[i].addEventListener('click', linkClick);
    }

    var form = document.querySelector('.search');
    form.addEventListener('submit', search);
  });

  function search (event) {
    event.preventDefault();

    jsonp('http://en.wikipedia.org/w/api.php', {
      format: 'json',
      action: 'query',
      continue: '',
      prop: 'extracts|pageimages',
      redirects: true,
      titles: this.query.value
    }, function (response) {
      console.log('success', response);
      for(var pageId in response.query.pages) {
        document.querySelectorAll('.article')[0].innerHTML = response.query.pages[pageId].extract;
      }
    }, function (err) {
      console.log('error', err);
    });
  }

  function linkClick (event) {
    event.preventDefault();

    jsonp('http://en.wikipedia.org/w/api.php', {
      format: 'json',
      action: 'query',
      continue: '',
      prop: 'extracts|pageimages',
      redirects: true,
      titles: 'James_Cordon'
    }, function (response) {
      console.log('success', response);
      for(var pageId in response.query.pages) {
        document.querySelectorAll('.article')[0].innerHTML = response.query.pages[pageId].extract;
      }
    }, function (err) {
      console.log('error', err);
    });
  }

  function ajaxGet (url, data, onsuccess, onerror) {
    var request = new XMLHttpRequest();
    request.open('GET', url + '?' + getParams(data), true);

    request.onload = function() {
      if (this.status >= 200 && this.status < 400){
        onsuccess(true, this);
      } else {
        onsuccess(false, this);
      }
    };

    request.onerror = onerror;

    request.send();
  }

  function jsonp (url, data, callback, onerror) {
    var callbackName = 'jsonp_callback';  // + Math.round(100000 * Math.random());

    var script = document.createElement('script');
    script.src = url + '?' + getParams(data) + '&callback=' + callbackName;
    script.onerror = onerror;

    window[callbackName] = function(data) {
      delete window[callbackName];
      document.body.removeChild(script);
      callback(data);
    };

    document.body.appendChild(script);
  }

  function getParams (obj) {
    var str = "";
    for (var key in obj) {
        if (str !== "") {
            str += "&";
        }
        str += key + "=" + encodeURIComponent(obj[key]);
    }

    return str;
  }

}());
