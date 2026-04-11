(function () {
  var cfg = window.JUNGLE_PAGE_META || {};
  var pagePath = cfg.pagePath || "";
  var pageUrl = cfg.pageUrl || "";

  // Skip homepage and non-markdown pages.
  if (!pagePath || !/\.md$/i.test(pagePath) || pagePath.toLowerCase() === "index.md" || pageUrl === "/") {
    return;
  }

  var metaEndpoint = (cfg.baseurl || "") + "/assets/data/site-meta.json";

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch (e) {
      return iso || "-";
    }
  }

  function createMetaShell() {
    var container = document.createElement("section");
    container.className = "page-meta-panel";
    container.innerHTML = [
      "<div class='page-meta-head'>Document Metadata</div>",
      "<div class='author-rank' id='author-rank'>",
      "<img src='" + (cfg.baseurl || "") + "/assets/images/author-badge.svg' alt='author badge' class='rank-image' />",
      "<div class='rank-copy'>",
      "<span class='rank-label'>AUTHOR CLASS</span>",
      "<strong id='meta-level'>계산 중...</strong>",
      "<em id='meta-post-count'>작성 글 수: 조회 중...</em>",
      "</div>",
      "</div>",
      "<div class='page-meta-grid'>",
      "<div class='meta-item'><span>최초 작성자</span><strong id='meta-first-author'>조회 중...</strong></div>",
      "<div class='meta-item'><span>최초 작성일</span><strong id='meta-first-date'>조회 중...</strong></div>",
      "<div class='meta-item'><span>최근 수정자</span><strong id='meta-last-author'>조회 중...</strong></div>",
      "<div class='meta-item'><span>최근 수정일</span><strong id='meta-last-date'>조회 중...</strong></div>",
      "</div>"
    ].join("");
    return container;
  }

  function placePanel(panel) {
    var article = document.querySelector(".post, .page");
    if (article) {
      article.insertBefore(panel, article.firstChild);
      return;
    }

    var content = document.querySelector(".post-content, .page-content");
    if (content && content.parentNode) {
      content.parentNode.insertBefore(panel, content);
    }
  }

  function setText(id, value) {
    var target = document.getElementById(id);
    if (target) {
      target.textContent = value || "-";
    }
  }

  function getLevel(postCount) {
    if (postCount >= 20) return "Legend Engineer";
    if (postCount >= 10) return "Veteran Engineer";
    if (postCount >= 5) return "Advanced Engineer";
    if (postCount >= 2) return "Rising Engineer";
    return "Novice Engineer";
  }

  function updateAuthorRank(authorName, authors) {
    var profile = (authors && authors[authorName]) || { post_count: 1 };
    var postCount = profile.post_count || 1;
    var level = profile.level || getLevel(postCount);
    setText("meta-level", level);
    setText("meta-post-count", "작성 글 수: " + postCount + "개");
  }

  var panel = createMetaShell();
  placePanel(panel);

  fetch(metaEndpoint)
    .then(function (res) {
      if (!res.ok) {
        throw new Error("site-meta load failed: " + res.status);
      }
      return res.json();
    })
    .then(function (siteMeta) {
      var pages = (siteMeta && siteMeta.pages) || {};
      var authors = (siteMeta && siteMeta.authors) || {};
      var meta = pages[pagePath];

      if (!meta) {
        setText("meta-first-author", "정보 없음");
        setText("meta-first-date", "정보 없음");
        setText("meta-last-author", "정보 없음");
        setText("meta-last-date", "정보 없음");
        setText("meta-level", "정보 없음");
        setText("meta-post-count", "작성 글 수: 정보 없음");
        return;
      }

      var firstAuthor = meta.first_author || "정보 없음";

      setText("meta-first-author", firstAuthor);
      setText("meta-first-date", formatDate(meta.first_date));
      setText("meta-last-author", meta.latest_author || "정보 없음");
      setText("meta-last-date", formatDate(meta.latest_date));
      updateAuthorRank(firstAuthor, authors);
    })
    .catch(function () {
      setText("meta-first-author", "조회 실패");
      setText("meta-first-date", "조회 실패");
      setText("meta-last-author", "조회 실패");
      setText("meta-last-date", "조회 실패");
      setText("meta-level", "조회 실패");
      setText("meta-post-count", "작성 글 수: 조회 실패");
    });
})();
