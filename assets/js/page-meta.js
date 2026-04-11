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
      "<img id='meta-monster-image' src='" + (cfg.baseurl || "") + "/assets/images/monsters/slime.png' alt='monster badge' class='rank-image monster-image' />",
      "<div class='rank-copy'>",
      "<span class='rank-label'>FIRST AUTHOR CLASS</span>",
      "<strong id='meta-level'>계산 중...</strong>",
      "<em id='meta-post-count'>최초 작성자 기여 문서: 조회 중...</em>",
      "<div class='exp-wrap'>",
      "<div class='exp-bar'><span id='meta-exp-fill'></span></div>",
      "<small id='meta-exp-text'>EXP 계산 중...</small>",
      "</div>",
      "</div>",
      "</div>",
      "<div class='page-meta-grid'>",
      "<div class='meta-item'><span>최초 작성자</span><strong id='meta-first-author'>조회 중...</strong></div>",
      "<div class='meta-item'><span>현재 대표 기여자</span><strong id='meta-lead-authors'>조회 중...</strong></div>",
      "<div class='meta-item'><span>최초 작성일</span><strong id='meta-first-date'>조회 중...</strong></div>",
      "<div class='meta-item'><span>최근 수정자</span><strong id='meta-last-author'>조회 중...</strong></div>",
      "<div class='meta-item'><span>최근 수정일</span><strong id='meta-last-date'>조회 중...</strong></div>",
      "</div>",
      "<div class='page-history-panel'>",
      "<div class='page-history-head'>최근 변경 히스토리</div>",
      "<div id='page-history-list' class='page-history-list'>조회 중...</div>",
      "<a id='page-history-more' class='page-history-more' href='#' hidden>전체 히스토리 보기</a>",
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

  function clearChildren(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function getLevel(totalScore) {
    if (totalScore >= 760) return "Dragon Sovereign";
    if (totalScore >= 520) return "Wyvern Marshal";
    if (totalScore >= 320) return "Golem Strategist";
    if (totalScore >= 180) return "Wolf Vanguard";
    return "Slime Apprentice";
  }

  function getLevelNumber(totalScore) {
    if (totalScore >= 760) return 5;
    if (totalScore >= 520) return 4;
    if (totalScore >= 320) return 3;
    if (totalScore >= 180) return 2;
    return 1;
  }

  function formatLeadAuthors(leadAuthors) {
    if (Array.isArray(leadAuthors)) {
      var filtered = leadAuthors.filter(Boolean);
      return filtered.length ? filtered.join(", ") : "정보 없음";
    }

    if (leadAuthors) {
      return String(leadAuthors);
    }

    return "정보 없음";
  }

  function createHistoryLink(url, text, className) {
    var element;

    if (url) {
      element = document.createElement("a");
      element.href = url;
      element.target = "_blank";
      element.rel = "noopener noreferrer";
    } else {
      element = document.createElement("span");
    }

    element.className = className;
    element.textContent = text || "제목 없음";
    return element;
  }

  function renderHistory(entries, historyUrl) {
    var list = document.getElementById("page-history-list");
    var more = document.getElementById("page-history-more");
    if (!list || !more) return;

    clearChildren(list);

    if (!Array.isArray(entries) || !entries.length) {
      list.textContent = "히스토리 정보 없음";
      more.hidden = true;
      more.removeAttribute("href");
      return;
    }

    entries.forEach(function (entry) {
      var item = document.createElement("article");
      item.className = "page-history-item";

      var title = createHistoryLink(entry.commit_url, entry.message || "제목 없음", "page-history-link");
      var meta = document.createElement("div");
      meta.className = "page-history-meta";
      meta.textContent = (entry.author || "작성자 정보 없음") + " · " + formatDate(entry.date);

      item.appendChild(title);
      item.appendChild(meta);
      list.appendChild(item);
    });

    if (historyUrl) {
      more.hidden = false;
      more.href = historyUrl;
      more.target = "_blank";
      more.rel = "noopener noreferrer";
    } else {
      more.hidden = true;
      more.removeAttribute("href");
    }
  }

  function updateAuthorRank(authorName, authors) {
    var profile = (authors && authors[authorName]) || { concept_doc_count: 0, total_score: 0, exp: 0, monster: "Slime", level: "Slime Apprentice" };
    var docCount = profile.concept_doc_count || 0;
    var totalScore = profile.total_score || 0;
    var exp = profile.exp || 0;
    var expCurrent = profile.exp_current || 0;
    var expNext = profile.exp_next;
    var monster = profile.monster || "Slime";
    var level = profile.level || getLevel(totalScore);
    var levelNo = getLevelNumber(totalScore);
    setText("meta-level", "Lv." + levelNo + " " + level);
    setText("meta-post-count", "최초 작성자 기여 문서: " + docCount + "개 | SCORE: " + totalScore + " | EXP: " + exp);
    updateMonsterImage(monster);
    updateExpBar(expCurrent, expNext, exp);
  }

  function getMonsterAsset(monsterName) {
    var key = String(monsterName || "").toLowerCase();
    if (key.indexOf("dragon") >= 0) return "dragon.png";
    if (key.indexOf("wyvern") >= 0) return "wyvern.png";
    if (key.indexOf("golem") >= 0) return "golem.png";
    if (key.indexOf("wolf") >= 0) return "wolf.png";
    return "slime.png";
  }

  function updateMonsterImage(monsterName) {
    var img = document.getElementById("meta-monster-image");
    if (!img) return;
    var file = getMonsterAsset(monsterName);
    img.src = (cfg.baseurl || "") + "/assets/images/monsters/" + file;
    img.alt = monsterName + " badge";
  }

  function updateExpBar(expCurrent, expNext, expTotal) {
    var fill = document.getElementById("meta-exp-fill");
    var text = document.getElementById("meta-exp-text");
    if (!fill || !text) return;

    if (!expNext || expNext <= 0) {
      fill.style.width = "100%";
      text.textContent = "EXP " + expTotal + " | MAX LEVEL";
      return;
    }

    var pct = Math.max(0, Math.min(100, Math.round((expCurrent / expNext) * 100)));
    fill.style.width = pct + "%";
    text.textContent = "EXP " + expCurrent + " / " + expNext + " (" + pct + "%)";
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
        setText("meta-lead-authors", "정보 없음");
        setText("meta-first-date", "정보 없음");
        setText("meta-last-author", "정보 없음");
        setText("meta-last-date", "정보 없음");
        setText("meta-level", "정보 없음");
        setText("meta-post-count", "최초 작성자 기여 문서: 정보 없음 | SCORE: 정보 없음 | EXP: 정보 없음");
        renderHistory([], "");
        updateExpBar(0, 1, 0);
        return;
      }

      var firstAuthor = meta.first_author || "정보 없음";

      setText("meta-first-author", firstAuthor);
      setText("meta-lead-authors", formatLeadAuthors(meta.lead_authors));
      setText("meta-first-date", formatDate(meta.first_date));
      setText("meta-last-author", meta.latest_author || "정보 없음");
      setText("meta-last-date", formatDate(meta.latest_date));
      renderHistory(meta.history_entries, meta.history_url);
      updateAuthorRank(firstAuthor, authors);
    })
    .catch(function () {
      setText("meta-first-author", "조회 실패");
      setText("meta-lead-authors", "조회 실패");
      setText("meta-first-date", "조회 실패");
      setText("meta-last-author", "조회 실패");
      setText("meta-last-date", "조회 실패");
      setText("meta-level", "조회 실패");
      setText("meta-post-count", "최초 작성자 기여 문서: 조회 실패 | SCORE: 조회 실패 | EXP: 조회 실패");
      renderHistory([], "");
      updateExpBar(0, 1, 0);
    });
})();
