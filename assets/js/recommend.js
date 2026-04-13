(function () {
  var shell = document.querySelector("[data-recommend-shell]");
  if (!shell) {
    return;
  }

  var countEl = shell.querySelector("[data-recommend-count]");
  var linkEl = shell.querySelector("[data-recommend-link]");
  var noteEl = shell.querySelector("[data-recommend-note]");
  var cfg = window.JUNGLE_PAGE_META || {};
  var pageUrl = cfg.pageUrl || "";
  var baseurl = cfg.baseurl || "";
  var repo = shell.getAttribute("data-recommend-repo") || "";

  if (!countEl || !linkEl || !noteEl || !repo || !pageUrl) {
    return;
  }

  function getIssuePathname() {
    var normalized = String(pageUrl || "");
    if (baseurl && normalized.indexOf(baseurl) !== 0) {
      normalized = baseurl + normalized;
    }
    return normalized;
  }

  function getSearchUrl(pathname) {
    var q = 'is:issue in:title "' + pathname + '"';
    return "https://github.com/" + repo + "/issues?q=" + encodeURIComponent(q);
  }

  function getNewIssueUrl(pathname) {
    var title = pathname;
    var body = [
      "## Document Recommendation",
      "",
      "- target: `" + pathname + "`",
      "- reaction: +1",
      "",
      "이 이슈에 👍 반응을 남겨 추천을 집계합니다."
    ].join("\n");
    return "https://github.com/" + repo + "/issues/new?title=" + encodeURIComponent(title) + "&body=" + encodeURIComponent(body);
  }

  function setFallback(pathname) {
    countEl.textContent = "0";
    linkEl.href = getNewIssueUrl(pathname);
    linkEl.textContent = "추천 이슈 만들기";
    noteEl.textContent = "아직 문서 이슈가 없어, 클릭하면 새 이슈 작성 화면이 바로 열립니다.";
  }

  function findBestIssue(items, pathname) {
    if (!Array.isArray(items) || !items.length) {
      return null;
    }

    for (var i = 0; i < items.length; i++) {
      if (items[i] && items[i].title === pathname) {
        return items[i];
      }
    }

    return items[0];
  }

  function updateFromIssue(issue) {
    var reactions = (issue && issue.reactions) || {};
    var plusOne = reactions["+1"] || 0;

    countEl.textContent = String(plusOne);
    linkEl.href = issue.html_url || "#";
    linkEl.textContent = "추천(👍) 남기기";
    noteEl.textContent = "추천은 GitHub 이슈의 👍 반응 수를 기준으로 표시됩니다.";
  }

  function loadRecommendation() {
    var pathname = getIssuePathname();
    var api = "https://api.github.com/search/issues?q=" + encodeURIComponent('repo:' + repo + ' is:issue in:title "' + pathname + '"');

    fetch(api, {
      headers: {
        Accept: "application/vnd.github+json"
      }
    })
      .then(function (res) {
        if (!res.ok) {
          throw new Error("recommend search failed: " + res.status);
        }
        return res.json();
      })
      .then(function (data) {
        var issue = findBestIssue(data && data.items, pathname);
        if (!issue) {
          setFallback(pathname);
          return;
        }

        updateFromIssue(issue);
      })
      .catch(function () {
        setFallback(pathname);
      });
  }

  loadRecommendation();
})();
