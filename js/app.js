(function () {
  "use strict";


  // Make sure we are accessing over https, if not redirect
  if ((!location.port || location.port === "80") && location.protocol !== "https:" && location.host !== "localhost") {
    location.protocol = "https:";
  }


  // Register our ServiceWorker
  if (navigator.serviceWorker) {
    navigator.serviceWorker.register("/r3search/worker.js", {
      scope: "/r3search/"
    }).then(function (reg) {
      console.log("SW register success", reg);
    }, function (err) {
      console.log("SW register fail", err);
    });
  }

  // localStorage keys
  var lsHistoryID = "r3search-ls-history";


  // DOM references
  var historyContainer = document.querySelector(".history");
  var historyNone = document.querySelector(".history .empty-list");
  var historyButton = document.querySelector(".history-button");
  var historyClear = document.querySelector(".history-clear");

  var suggestionsContainer = document.querySelector(".suggestions");
  var suggestionsNone = document.querySelector(".suggestions .empty-list");
  var suggestionsLoading = document.querySelector(".suggestions-loading");

  var articleContent = document.querySelector(".article-content");
  var articleTitle = document.querySelector(".article-title");
  var articleLink = document.querySelector(".article-link");
  var articleLoading = document.querySelector(".article-loading");

  var searchForm = document.querySelector(".search");
  var searchBox = searchForm.querySelector("[name=query]");

  // options
  var optHistorySize = 10;


  // Enable/disable search functionality based on network availability
  function updateNetworkStatus() {
    searchBox.value = "";

    if (navigator.onLine) {
      searchBox.removeAttribute("disabled");
      searchBox.setAttribute("placeholder", "Search");
    } else {
      closeSuggestions();
      searchBox.setAttribute("disabled", "disabled");
      searchBox.setAttribute("placeholder", "No connection - try history");
    }
  }


  // History button was clicked
  function clickHistoryButton(event) {
    event.preventDefault();

    if (searchForm.classList.contains("history-open")) {
      closeHistory();
    } else {
      openHistory();
    }
  }


  // Open history list
  function openHistory() {
    closeSuggestions();
    searchForm.classList.add("history-open");
  }


  // Close history list
  function closeHistory() {
    searchForm.classList.remove("history-open");
  }


  // Open suggestions list
  function openSuggestions() {
    closeHistory();
    suggestionsContainer.classList.add("suggestions-open");
  }


  // Close suggestions list
  function closeSuggestions() {
    suggestionsContainer.classList.remove("suggestions-open");
  }


  // Show suggestions loading icon
  function showsuggestionsLoading() {
    suggestionsLoading.classList.add("show");
  }


  // Hide suggestions loading icon
  function hidesuggestionsLoading() {
    suggestionsLoading.classList.remove("show");
  }

  //listen for clicks outside history/suggestions divs and close if necessary
  function windowClick(event) {
    if ( !historyContainer.contains(event.target) && !suggestionsContainer.contains(event.target) &&
        !historyButton.contains(event.target) ) {

      closeHistory();
      closeSuggestions();

      }
  }

  // Show article loading icon
  function showArticleLoading() {
    articleLoading.classList.add("show");
  }


  // Hide article loading icon
  function hideArticleLoading() {
    articleLoading.classList.remove("show");
  }


  // A link to an article was clicked
  function clickArticle(event) {
    if (event.target.classList.contains("article-load")) {
      event.preventDefault();

      var query = event.target.dataset.query;
      find(query);

      closeHistory();
      closeSuggestions();
    } else if (event.target.classList.contains("history-clear")) {
      event.preventDefault();

      clearHistory();
    }
  }


  // Update history list
  function updateHistory() {
    var link;
    var history = localStorage.getItem(lsHistoryID);
    var historyList = historyContainer.querySelector(".history-list");

    historyList.innerHTML = "";

    if (history) {
      history = JSON.parse(history);

      if (history.length) {
        historyNone.classList.remove("show");
        historyClear.classList.add("show");

        history.reverse();
        history.forEach(function (query) {

          link = document.createElement("a");
          link.textContent = query;
          link.setAttribute("href", "#");
          link.setAttribute("data-query", query);
          link.setAttribute("class", "article-load");

          historyList.appendChild(link);
        });

      } else {
        historyNone.classList.add("show");
        historyClear.classList.remove("show");
      }

    } else {
      historyNone.classList.add("show");
      historyClear.classList.remove("show");
    }
  }

  function clearHistory() {
    localStorage.setItem(lsHistoryID, JSON.stringify([]));
    closeHistory();
    updateHistory();
  }


  // Save an article to the history
  function saveArticle(title) {
    var history = localStorage.getItem(lsHistoryID);

    if (history) {
      history = JSON.parse(history);
    } else {
      history = [];
    }

    if (history.indexOf(title) === -1) {

      if (history.length >= optHistorySize) {
        history.shift();
      }
      history.push(title);
    }

    localStorage.setItem(lsHistoryID, JSON.stringify(history));

    updateHistory();
  }


  // Search form was sumitted
  function submitSearchForm(event) {
    event.preventDefault();

    search(event.currentTarget.query.value);
  }


  // Search wikipedia for the search query
  function search(query) {
    closeHistory();

    if (query) {
      suggestionsNone.classList.remove("show");

      var suggestions;
      var link;
      var suggestionsList = suggestionsContainer.querySelector(".suggestions-list");

      suggestionsList.innerHTML = "";
      showsuggestionsLoading();
      openSuggestions();

      jsonp("//en.wikipedia.org/w/api.php", {
        format: "json",
        action: "opensearch",
        search: query,
        limit: 5,
        titles: query
      }, function (response) {
        hidesuggestionsLoading();

        suggestions = response[1];

        if (suggestions.length === 0) {

          suggestionsNone.classList.add("show");

        } else {

          if (suggestions.length === 1) {

            closeSuggestions();
            find(suggestions[0]);

          } else {

            suggestions.forEach(function (suggestion) {
              link = document.createElement("a");
              link.textContent = suggestion;
              link.setAttribute("href", "#");
              link.setAttribute("data-query", suggestion);
              link.setAttribute("class", "article-load");
              suggestionsList.appendChild(link);
            });

          }
        }

      }, function (err) {
        hidesuggestionsLoading();

        console.log("error", err);
      });
    } else {
      closeSuggestions();
    }
  }


  // Find an article on Wikipedia
  function find(title) {
    var page, extract, titleText, thumb, img, url, link;

    articleContent.innerHTML = "";
    articleTitle.innerHTML = "";
    articleLink.innerHTML = "";
    showArticleLoading();

    jsonp("//en.wikipedia.org/w/api.php", {
      format: "json",
      action: "query",
      continue: "",
      prop: "extracts|pageimages",
      exsentences: 10,
      exlimit: 1,
      explaintext: true,
      piprop: "thumbnail",
      pithumbsize: 200,
      redirects: true,
      titles: title
    }, function (response) {
      hideArticleLoading();

      console.log("success", response);

      page;
      for(var pageId in response.query.pages) {
        page = response.query.pages[pageId];
      }

      extract = page.extract;
      titleText = page.title;
      thumb = false;

      if (page.thumbnail && page.thumbnail.source) {
        thumb = page.thumbnail.source;
      }

      if (!extract) {
        extract = "No matching article";
      } else {
        saveArticle(titleText);
      }

      if (thumb) {
        img = document.createElement("img");
        img.setAttribute("src", thumb);
        img.setAttribute("class", "thumb");
        articleContent.appendChild(img);
      }

      articleContent.innerHTML += extract;
      articleTitle.textContent = titleText;

      url = "http://en.wikipedia.org/wiki/" + titleText;
      link = document.createElement("a");
      link.textContent = url;
      link.setAttribute("href", url);
      link.setAttribute("target", "_blank");
      articleLink.appendChild(link);

    }, function (err) {
      hideArticleLoading();

      console.log("error", err);
    });
  }


  // Make a JSON-P request
  function jsonp(url, data, callback, onerror) {
    var callbackName = "jsonp_callback";

    var script = document.createElement("script");
    script.src = url + "?" + getParams(data) + "&callback=" + callbackName;
    script.onerror = onerror;

    window[callbackName] = function (data) {
      delete window[callbackName];
      document.body.removeChild(script);
      callback(data);
    };

    document.body.appendChild(script);
  }


  // form a GET query string from object
  function getParams(obj) {
    var str = "";
    for (var key in obj) {
        if (str !== "") {
            str += "&";
        }
        str += key + "=" + encodeURIComponent(obj[key]);
    }

    return str;
  }


  // Event listeners
  historyContainer.addEventListener("click", clickArticle);
  suggestionsContainer.addEventListener("click", clickArticle);
  searchForm.addEventListener("submit", submitSearchForm);
  historyButton.addEventListener("click", clickHistoryButton);
  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);
  window.addEventListener("click", windowClick);


  // Initialisation
  updateHistory();
  updateNetworkStatus();

}());
