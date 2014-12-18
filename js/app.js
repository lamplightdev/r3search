(function() {

  var lsQueryName = 'r3search-ls-history';
  var historiesContainer, resultsContainer, form, article, title, articleLoading, resultsLoading;

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
    historiesContainer = document.querySelector('.histories');
    resultsContainer = document.querySelector('.results');

    article = document.querySelector('.article');
    title = document.querySelector('.title');

    articleLoading = document.querySelector('.article-loading');
    resultsLoading = document.querySelector('.results-loading');

    historiesContainer.addEventListener('click', clickFind);
    resultsContainer.addEventListener('click', clickFind);
    updateHistory();

    form = document.querySelector('.search');
    form.addEventListener('submit', formSubmit);

    var buttonHistory = document.querySelector('.history');
    buttonHistory.addEventListener('click', function (event) {
      if (form.classList.contains('history-open')) {
        closeHistory();
      } else {
        openHistory();
      }
    });
  });

  function openHistory () {
    closeSuggestions();
    form.classList.add('history-open');
  }

  function closeHistory () {
    form.classList.remove('history-open');
  }

  function openSuggestions () {
    closeHistory();
    resultsContainer.classList.add('results-open');
  }

  function closeSuggestions () {
    resultsContainer.classList.remove('results-open');
  }

  function showResultsLoading () {
    resultsLoading.classList.add('show');
  }

  function hideResultsLoading () {
    resultsLoading.classList.remove('show');

  }

  function showArticleLoading () {
    articleLoading.classList.add('show');
  }

  function hideArticleLoading () {
    articleLoading.classList.remove('show');
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

  function updateHistory () {
    var histories = localStorage.getItem(lsQueryName);
    if (histories) {
      historiesContainer.innerHTML = '';
      histories = JSON.parse(histories);
      histories.forEach(function (query) {

        var link = document.createElement('a');
        link.textContent = query;
        link.setAttribute('href', '#');
        link.setAttribute('data-query', query);
        link.setAttribute('class', 'query-load');

        historiesContainer.appendChild(link);
      });
    }
  }

  function saveQuery (query) {
    var histories = localStorage.getItem(lsQueryName);
    if (histories) {
      histories = JSON.parse(histories);
    } else {
      histories = [];
    }

    if(histories.indexOf(query) === -1) {
      histories.push(query);
    }

    localStorage.setItem(lsQueryName, JSON.stringify(histories));

    updateHistory();
  }

  function formSubmit (event) {
    event.preventDefault();

    search(this.query.value);
  }

  function search (query) {
    closeHistory();

    var resultsList = resultsContainer.querySelector('.results-list');

    resultsList.innerHTML = '';
    showResultsLoading();
    openSuggestions();

    jsonp('//en.wikipedia.org/w/api.php', {
      format: 'json',
      action: 'opensearch',
      search: query,
      limit: 5,
      titles: query
    }, function (response) {
      hideResultsLoading();

      console.log('success', response);

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
          resultsList.appendChild(link);
        });

      }

    }, function (err) {
      hideResultsLoading();

      console.log('error', err);
    });
  }

  function find (query) {
    article.innerHTML = '';
    showArticleLoading();

    jsonp('//en.wikipedia.org/w/api.php', {
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
      hideArticleLoading();

      console.log('success', response);
      for(var pageId in response.query.pages) {


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

        article.innerHTML += extract;
        title.textContent = title;
      }
    }, function (err) {
      hideArticleLoading();

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
