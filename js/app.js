(function() {

  var lsQueryName = 'r3search-ls-queries';
  var queriesContainer, resultsContainer, form;

  if (navigator.serviceWorker) {
    navigator.serviceWorker.register('/r3search/worker.js', {
      scope: '/r3search/'
    }).then(function(reg) {
      console.log('success', reg);
    }, function(err) {
      console.log('fail', err);
    });
  }

  document.addEventListener("DOMContentLoaded", function (event) {
    queriesContainer = document.querySelector('.queries');
    resultsContainer = document.querySelector('.results');

    queriesContainer.addEventListener('click', clickFind);
    resultsContainer.addEventListener('click', clickFind);
    listQueries();

    form = document.querySelector('.search');
    form.addEventListener('submit', formSubmit);

    var buttonHistory = document.querySelector('.history');
    buttonHistory.addEventListener('click', function (event) {
      form.classList.toggle('history-open');
    });
  });

  function openHistory () {
    form.classList.add('history-open');
  }

  function closeHistory () {
    form.classList.remove('history-open');
  }

  function openSuggestions () {
    resultsContainer.classList.add('results-open');
  }

  function closeSuggestions () {
    resultsContainer.classList.remove('results-open');
  }

  function clickFind (event) {
    if (event.target.classList.contains('query-load')) {
      event.preventDefault();

      var query = event.target.dataset.query;
      find(query);

      closeHistory();
      closeSuggestions();
    }
  }

  function listQueries () {
    var queries = localStorage.getItem(lsQueryName);
    if (queries) {
      queriesContainer.innerHTML = '';
      queries = JSON.parse(queries);
      queries.forEach(function (query) {

        var link = document.createElement('a');
        link.textContent = query;
        link.setAttribute('href', '#');
        link.setAttribute('data-query', query);
        link.setAttribute('class', 'query-load');

        queriesContainer.appendChild(link);
      });
    }
  }

  function saveQuery (query) {
    var queries = localStorage.getItem(lsQueryName);
    if (queries) {
      queries = JSON.parse(queries);
    } else {
      queries = [];
    }

    if(queries.indexOf(query) === -1) {
      queries.push(query);
    }

    localStorage.setItem(lsQueryName, JSON.stringify(queries));

    listQueries();
  }

  function formSubmit (event) {
    event.preventDefault();

    search(this.query.value);
  }

  function search (query) {
    closeHistory();

    jsonp('https://en.wikipedia.org/w/api.php', {
      format: 'json',
      action: 'opensearch',
      search: query,
      limit: 5,
      titles: query
    }, function (response) {
      console.log('success', response);

      resultsContainer.innerHTML = '';

      var results = response[1];

      if (results.length === 1) {
        find (results[0]);
      } else {
        results.forEach(function (result) {
          var link = document.createElement('a');
          link.textContent = result;
          link.setAttribute('href', '#');
          link.setAttribute('data-query', result);
          link.setAttribute('class', 'query-load');
          resultsContainer.appendChild(link);
        });

        openSuggestions();
      }

    }, function (err) {
      console.log('error', err);
    });
  }

  function find (query) {
    jsonp('https://en.wikipedia.org/w/api.php', {
      format: 'json',
      action: 'query',
      continue: '',
      prop: 'extracts|pageimages',
      exsentences: 10,
      exlimit: 1,
      explaintext: true,
      piprop: 'thumbnail',
      pithumbsize: 200,
      redirects: true,
      titles: query
    }, function (response) {
      console.log('success', response);
      for(var pageId in response.query.pages) {
        document.querySelector('.article').innerHTML = '';

        var extract = response.query.pages[pageId].extract;
        var title = response.query.pages[pageId].title;
        var thumb = false;

        if (response.query.pages[pageId].thumbnail && response.query.pages[pageId].thumbnail.source) {
          thumb = response.query.pages[pageId].thumbnail.source;
        }

        if (!extract) {
          extract = 'No matching article';
        } else {
          saveQuery(title);
        }

        if (thumb) {
          var img = document.createElement('img');
          img.setAttribute('src', thumb);
          img.setAttribute('class', 'thumb');
          document.querySelector('.article').appendChild(img);
        }

        document.querySelector('.article').innerHTML += extract;
        document.querySelector('.title').textContent = title;
      }
    }, function (err) {
      console.log('error', err);
    });
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
