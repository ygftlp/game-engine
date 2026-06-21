(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function normalize(value) {
    return (value || "").toLowerCase().trim();
  }

  ready(function () {
    var input = document.querySelector("[data-search-input]");
    var panel = document.querySelector("[data-search-panel]");
    if (!input || !panel) return;

    var base = typeof window.__DOCS_BASE__ === "string" ? window.__DOCS_BASE__ : "./";
    var docs = Array.isArray(window.__DOCS_SEARCH__) ? window.__DOCS_SEARCH__ : [];

    function closePanel() {
      panel.classList.remove("is-open");
      panel.innerHTML = "";
    }

    function renderResults(matches) {
      if (matches.length === 0) {
        panel.innerHTML = '<div class="search-result"><strong>No results</strong><span>Try another keyword.</span></div>';
        panel.classList.add("is-open");
        return;
      }

      panel.innerHTML = matches
        .map(function (item) {
          return (
            '<a class="search-result" href="' +
            item.url +
            '">' +
            "<strong>" +
            item.title +
            "</strong>" +
            "<span>" +
            item.excerpt +
            "</span>" +
            "</a>"
          );
        })
        .join("");
      panel.classList.add("is-open");
    }

    input.addEventListener("input", function () {
      var query = normalize(input.value);
      if (!query) {
        closePanel();
        return;
      }

      var matches = docs
        .filter(function (item) {
          return normalize(item.title + " " + item.text).indexOf(query) >= 0;
        })
        .slice(0, 8)
        .map(function (item) {
          var text = item.text.replace(/\s+/g, " ");
          var excerpt = text.slice(0, 140);
          return {
            title: item.locale + " / " + item.title,
            url: base + item.path,
            excerpt: excerpt + (text.length > 140 ? "..." : ""),
          };
        });

      renderResults(matches);
    });

    input.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        input.value = "";
        closePanel();
      }
    });

    document.addEventListener("click", function (event) {
      if (!panel.contains(event.target) && event.target !== input) {
        closePanel();
      }
    });
  });
})();
