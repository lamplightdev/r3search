(function() {

  var lsQueryName = 'r3search-ls-history';
  var historiesContainer,
      resultsContainer,
      form,
      article,
      title,
      articleLoading,
      resultsLoading,
      resultsNone,
      historiesNone,
      connectionNone;

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

    resultsNone = document.querySelector('.results .empty-list');
    historiesNone = document.querySelector('.histories .empty-list');
    connectionNone = document.querySelector('.results .no-connection');

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
    var historiesList = historiesContainer.querySelector('.histories-list');

    if (histories && histories.length) {
      historiesNone.classList.remove('show');

      historiesList.innerHTML = '';
      histories = JSON.parse(histories);
      histories.forEach(function (query) {

        var link = document.createElement('a');
        link.textContent = query;
        link.setAttribute('href', '#');
        link.setAttribute('data-query', query);
        link.setAttribute('class', 'query-load');

        historiesList.appendChild(link);
      });

    } else {

      historiesNone.classList.add('show');

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

    if (query) {
      resultsNone.classList.remove('show');
      connectionNone.classList.remove('show');

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

        if(results.length === 0) {

          resultsNone.classList.add('show');

        } else {

          if (results.length === 1) {

            closeSuggestions();
            find(results[0]);

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
        }

      }, function (err) {
        hideResultsLoading();
        connectionNone.classList.add('show');

        console.log('error', err);
      });
    } else {
      closeSuggestions();
    }
  }

  function find (query) {
    article.innerHTML = '';
    title.innerHTML = '';
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

      var page;
      for(var pageId in response.query.pages) {
        page = response.query.pages[pageId];
      }

      var extract = page.extract;
      var titleText = page.title;
      var thumb = false;

      if (page.thumbnail && page.thumbnail.source) {
        thumb = page.thumbnail.source;
      }

      if (!extract) {
        extract = 'No matching article';
      } else {
        saveQuery(titleText);
      }

      if (thumb) {
        var img = document.createElement('img');
        img.setAttribute('src', thumb);
        img.setAttribute('class', 'thumb');
        article.appendChild(img);
      }

      article.innerHTML += extract;
      title.textContent = titleText;
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
