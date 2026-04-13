(function () {
  var app = document.querySelector("[data-writer-app]");
  if (!app) {
    return;
  }

  var cfg = window.JUNGLE_PAGE_META || {};
  var repo = [cfg.owner || "jskim-research", cfg.repo || "jungle-engine-study"].join("/");
  var baseUrl = cfg.baseurl || "";
  var workingDraftKey = "jungle-writer-working-draft-v2";
  var savedDraftsKey = "jungle-writer-saved-drafts-v2";
  var autoSaveTimer = null;
  var libraryItems = [];
  var draftItems = [];
  var modeButtons = app.querySelectorAll("[data-writer-mode]");
  var newOnly = app.querySelectorAll("[data-writer-new-only]");
  var editOnly = app.querySelectorAll("[data-writer-edit-only]");
  var statusNode = app.querySelector("[data-writer-status]");
  var searchField = app.querySelector("[data-writer-search]");
  var docListNode = app.querySelector("[data-writer-doc-list]");
  var draftListNode = app.querySelector("[data-writer-draft-list]");

  var fields = {
    mode: app.querySelector("[data-writer-field='mode']"),
    category: app.querySelector("[data-writer-field='category']"),
    title: app.querySelector("[data-writer-field='title']"),
    slug: app.querySelector("[data-writer-field='slug']"),
    path: app.querySelector("[data-writer-field='path']"),
    summary: app.querySelector("[data-writer-field='summary']"),
    content: app.querySelector("[data-writer-field='content']")
  };

  var outputs = {
    path: app.querySelector("[data-writer-output='path']"),
    repo: app.querySelector("[data-writer-output='repo']"),
    issueTitle: app.querySelector("[data-writer-output='issue-title']"),
    stats: app.querySelector("[data-writer-output='stats']"),
    preview: app.querySelector("[data-writer-output='preview']")
  };

  var categoryLabels = {
    "00_conventions": "00. Conventions",
    "01_rendering": "01. Rendering",
    "02_math": "02. Math",
    "03_engine": "03. Engine",
    "04_optimization": "04. Optimization",
    "05_misc": "05. Misc"
  };

  var templates = {
    concept: [
      "## 1. 개요",
      "",
      "이 문서가 다루는 대상과 문제를 짧게 설명합니다.",
      "",
      "---",
      "",
      "## 2. 핵심 개념",
      "",
      "- 핵심 개념 1",
      "- 핵심 개념 2",
      "",
      "---",
      "",
      "## 3. 예시",
      "",
      "```cpp",
      "// example",
      "```",
      ""
    ].join("\n"),
    comparison: [
      "## 1. 비교 대상",
      "",
      "- 대상 A:",
      "- 대상 B:",
      "",
      "---",
      "",
      "## 2. 차이점 정리",
      "",
      "| 항목 | 대상 A | 대상 B |",
      "| --- | --- | --- |",
      "| 목적 |  |  |",
      "| 장점 |  |  |",
      "| 단점 |  |  |",
      "",
      "---",
      "",
      "## 3. 선택 기준",
      "",
      "- ",
      ""
    ].join("\n"),
    walkthrough: [
      "## 1. 처리 흐름 개요",
      "",
      "이 문서에서는 기능이 어떤 순서로 동작하는지 단계별로 정리합니다.",
      "",
      "---",
      "",
      "## 2. 단계별 흐름",
      "",
      "1. ",
      "2. ",
      "3. ",
      "",
      "---",
      "",
      "## 3. 코드 기준점",
      "",
      "```cpp",
      "// call path or execution point",
      "```",
      ""
    ].join("\n"),
    review: [
      "## 수정 제안 요약",
      "",
      "- ",
      "",
      "---",
      "",
      "## 수정 대상",
      "",
      "- 보강이 필요한 설명:",
      "- 추가하고 싶은 예시:",
      "- 용어 정리가 필요한 부분:",
      "",
      "---",
      "",
      "## 수정 초안",
      "",
      "> 아래에 실제로 반영하고 싶은 문장을 Markdown으로 적어주세요.",
      ""
    ].join("\n")
  };

  function setStatus(message) {
    if (statusNode) {
      statusNode.textContent = message;
    }
  }

  function normalizeMode(value) {
    return value === "edit" ? "edit" : "new";
  }

  function getQueryValue(name) {
    try {
      return new URL(window.location.href).searchParams.get(name) || "";
    } catch (e) {
      return "";
    }
  }

  function slugify(value) {
    var normalized = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[\\/:*?"<>|]+/g, " ")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    return normalized;
  }

  function encodePathSegments(filePath) {
    return String(filePath || "")
      .split("/")
      .map(function (segment) {
        return encodeURIComponent(segment);
      })
      .join("/");
  }

  function toSitePath(filePath) {
    return [baseUrl.replace(/\/$/, ""), encodePathSegments(filePath)].join("/");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function applyInlineMarkdown(text) {
    var placeholders = [];
    var escaped = escapeHtml(text);

    escaped = escaped.replace(/`([^`]+)`/g, function (_, code) {
      var token = "%%CODE" + placeholders.length + "%%";
      placeholders.push("<code>" + code + "</code>");
      return token;
    });

    escaped = escaped.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, label, href) {
      return (
        '<a href="' +
        href +
        '" target="_blank" rel="noopener noreferrer">' +
        label +
        "</a>"
      );
    });

    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    escaped = escaped.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    escaped = escaped.replace(/~~([^~]+)~~/g, "<del>$1</del>");

    placeholders.forEach(function (html, index) {
      escaped = escaped.replace("%%CODE" + index + "%%", html);
    });

    return escaped;
  }

  function parseTableRow(line) {
    return line
      .trim()
      .replace(/^\||\|$/g, "")
      .split("|")
      .map(function (cell) {
        return cell.trim();
      });
  }

  function isTableSeparator(line) {
    return /^\s*\|?(\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/.test(line || "");
  }

  function isSpecialBlockStart(line) {
    return (
      /^#{1,6}\s+/.test(line) ||
      /^```/.test(line) ||
      /^>\s?/.test(line) ||
      /^\s*[-*_]{3,}\s*$/.test(line) ||
      /^\s*[-+*]\s+/.test(line) ||
      /^\s*\d+\.\s+/.test(line)
    );
  }

  function renderMarkdown(markdown) {
    var lines = String(markdown || "").replace(/\r\n?/g, "\n").split("\n");
    var html = [];
    var index = 0;

    while (index < lines.length) {
      var line = lines[index];
      var trimmed = line.trim();

      if (!trimmed) {
        index += 1;
        continue;
      }

      if (/^```/.test(trimmed)) {
        var language = trimmed.replace(/^```/, "").trim();
        var codeLines = [];
        index += 1;

        while (index < lines.length && !/^```/.test(lines[index].trim())) {
          codeLines.push(lines[index]);
          index += 1;
        }

        if (index < lines.length) {
          index += 1;
        }

        html.push(
          '<pre class="writer-rendered-code"><code' +
            (language ? ' class="language-' + escapeHtml(language) + '"' : "") +
            ">" +
            escapeHtml(codeLines.join("\n")) +
            "</code></pre>"
        );
        continue;
      }

      if (/^#{1,6}\s+/.test(trimmed)) {
        var headingLevel = trimmed.match(/^#{1,6}/)[0].length;
        var headingText = trimmed.slice(headingLevel).trim();
        html.push(
          "<h" + headingLevel + ">" + applyInlineMarkdown(headingText) + "</h" + headingLevel + ">"
        );
        index += 1;
        continue;
      }

      if (lines[index + 1] && line.indexOf("|") >= 0 && isTableSeparator(lines[index + 1])) {
        var headerCells = parseTableRow(line);
        var rows = [];
        index += 2;

        while (index < lines.length && lines[index].trim() && lines[index].indexOf("|") >= 0) {
          rows.push(parseTableRow(lines[index]));
          index += 1;
        }

        var tableHtml = "<table><thead><tr>";
        headerCells.forEach(function (cell) {
          tableHtml += "<th>" + applyInlineMarkdown(cell) + "</th>";
        });
        tableHtml += "</tr></thead><tbody>";
        rows.forEach(function (row) {
          tableHtml += "<tr>";
          row.forEach(function (cell) {
            tableHtml += "<td>" + applyInlineMarkdown(cell) + "</td>";
          });
          tableHtml += "</tr>";
        });
        tableHtml += "</tbody></table>";
        html.push(tableHtml);
        continue;
      }

      if (/^\s*[-*_]{3,}\s*$/.test(trimmed)) {
        html.push("<hr>");
        index += 1;
        continue;
      }

      if (/^>\s?/.test(trimmed)) {
        var quoteLines = [];
        while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
          quoteLines.push(lines[index].replace(/^>\s?/, ""));
          index += 1;
        }
        html.push("<blockquote>" + renderMarkdown(quoteLines.join("\n")) + "</blockquote>");
        continue;
      }

      if (/^\s*[-+*]\s+/.test(line)) {
        var listHtml = "<ul>";
        while (index < lines.length && /^\s*[-+*]\s+/.test(lines[index])) {
          listHtml += "<li>" + applyInlineMarkdown(lines[index].replace(/^\s*[-+*]\s+/, "")) + "</li>";
          index += 1;
        }
        listHtml += "</ul>";
        html.push(listHtml);
        continue;
      }

      if (/^\s*\d+\.\s+/.test(line)) {
        var orderedHtml = "<ol>";
        while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
          orderedHtml +=
            "<li>" + applyInlineMarkdown(lines[index].replace(/^\s*\d+\.\s+/, "")) + "</li>";
          index += 1;
        }
        orderedHtml += "</ol>";
        html.push(orderedHtml);
        continue;
      }

      var paragraph = [trimmed];
      index += 1;
      while (index < lines.length && lines[index].trim() && !isSpecialBlockStart(lines[index].trim())) {
        paragraph.push(lines[index].trim());
        index += 1;
      }
      html.push("<p>" + applyInlineMarkdown(paragraph.join(" ")) + "</p>");
    }

    return html.join("");
  }

  function getWordCount(text) {
    var matches = String(text || "").trim().match(/\S+/g);
    return matches ? matches.length : 0;
  }

  function getCharacterCount(text) {
    return String(text || "").replace(/\s/g, "").length;
  }

  function getSavedDrafts() {
    try {
      var raw = localStorage.getItem(savedDraftsKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function setSavedDrafts(items) {
    draftItems = items.slice(0, 12);
    try {
      localStorage.setItem(savedDraftsKey, JSON.stringify(draftItems));
    } catch (e) {
      return;
    }
  }

  function getWorkingDraft() {
    try {
      var raw = localStorage.getItem(workingDraftKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setWorkingDraft(data) {
    try {
      localStorage.setItem(
        workingDraftKey,
        JSON.stringify({
          savedAt: new Date().toISOString(),
          draft: data
        })
      );
    } catch (e) {
      return;
    }
  }

  function getState() {
    var mode = normalizeMode(fields.mode.value);
    var title = (fields.title.value || "").trim();
    var rawSlug = (fields.slug.value || "").trim();
    var slug = rawSlug || slugify(title) || "new-document";
    var category = fields.category.value || "05_misc";
    var path = (fields.path.value || "").trim();
    var summary = (fields.summary.value || "").trim();
    var content = fields.content.value || "";
    var targetPath = mode === "edit" ? path : category + "/" + slug + ".md";
    var issueTitle =
      mode === "edit"
        ? "[문서 개선 제안] " + (title || path || "Untitled")
        : "[새 문서 제안] " + (title || slug);

    return {
      mode: mode,
      title: title,
      slug: slug,
      category: category,
      path: path,
      summary: summary,
      content: content,
      targetPath: targetPath,
      issueTitle: issueTitle
    };
  }

  function updateVisibility(mode) {
    Array.prototype.forEach.call(newOnly, function (node) {
      node.hidden = mode === "edit";
    });
    Array.prototype.forEach.call(editOnly, function (node) {
      node.hidden = mode !== "edit";
    });
    Array.prototype.forEach.call(modeButtons, function (button) {
      var isActive = button.getAttribute("data-writer-mode") === mode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    });
  }

  function extractTitleFromMarkdown(markdown) {
    var match = String(markdown || "").match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : "";
  }

  function extractSummaryFromMarkdown(markdown) {
    var lines = String(markdown || "").replace(/\r\n?/g, "\n").split("\n");
    for (var index = 0; index < lines.length; index += 1) {
      var line = lines[index].trim();
      if (!line || /^#/.test(line) || /^```/.test(line) || /^[-*_]{3,}$/.test(line)) {
        continue;
      }
      return line;
    }
    return "";
  }

  function pathToTitle(filePath) {
    return String(filePath || "")
      .split("/")
      .pop()
      .replace(/\.md$/i, "");
  }

  function renderPreview(state) {
    if (!outputs.preview) {
      return;
    }

    var parts = [];
    parts.push('<div class="writer-rendered-head">');
    parts.push("<h1>" + escapeHtml(state.title || pathToTitle(state.targetPath) || "Untitled") + "</h1>");
    if (state.summary) {
      parts.push('<p class="writer-rendered-summary">' + escapeHtml(state.summary) + "</p>");
    }
    parts.push('<div class="writer-rendered-meta">');
    parts.push(
      '<span class="writer-rendered-chip">' +
        escapeHtml(categoryLabels[state.category] || state.category || "-") +
        "</span>"
    );
    parts.push('<span class="writer-rendered-chip">' + escapeHtml(state.targetPath || "-") + "</span>");
    parts.push("</div></div>");
    parts.push('<div class="writer-rendered-body">');
    parts.push(renderMarkdown(state.content || ""));
    parts.push("</div>");

    outputs.preview.innerHTML = parts.join("");
  }

  function renderDraftList() {
    if (!draftListNode) {
      return;
    }

    draftItems = getSavedDrafts();

    if (!draftItems.length) {
      draftListNode.innerHTML = '<p class="writer-empty">아직 저장한 초안이 없습니다.</p>';
      return;
    }

    draftListNode.innerHTML = draftItems
      .map(function (draft) {
        var label = draft.title || pathToTitle(draft.targetPath) || "Untitled";
        return [
          '<article class="writer-record">',
          "<button type='button' class='writer-record-main' data-writer-action='load-draft' data-writer-draft-id='" +
            escapeHtml(draft.id) +
            "'>",
          "<strong>" +
            escapeHtml(label) +
            "</strong>",
          "<span>" +
            escapeHtml(draft.targetPath || "-") +
            "</span>",
          "<small>" +
            escapeHtml(new Date(draft.savedAt).toLocaleString("ko-KR")) +
            "</small>",
          "</button>",
          "<button type='button' class='writer-record-delete' data-writer-action='delete-draft' data-writer-draft-id='" +
            escapeHtml(draft.id) +
            "' aria-label='저장한 초안 삭제'>삭제</button>",
          "</article>"
        ].join("");
      })
      .join("");
  }

  function renderDocList() {
    if (!docListNode) {
      return;
    }

    if (!libraryItems.length) {
      docListNode.innerHTML = '<p class="writer-empty">문서 라이브러리를 불러오지 못했습니다.</p>';
      return;
    }

    var searchTerm = String(searchField ? searchField.value : "")
      .trim()
      .toLowerCase();

    var filtered = libraryItems.filter(function (item) {
      if (!searchTerm) {
        return true;
      }

      return (
        item.title.toLowerCase().indexOf(searchTerm) >= 0 ||
        item.path.toLowerCase().indexOf(searchTerm) >= 0 ||
        item.category.toLowerCase().indexOf(searchTerm) >= 0
      );
    });

    if (!filtered.length) {
      docListNode.innerHTML = '<p class="writer-empty">검색 결과가 없습니다.</p>';
      return;
    }

    docListNode.innerHTML = filtered
      .slice(0, 40)
      .map(function (item) {
        return [
          "<button type='button' class='writer-record writer-doc-record' data-writer-action='load-doc' data-writer-doc-path='" +
            escapeHtml(item.path) +
            "'>",
          "<strong>" +
            escapeHtml(item.title) +
            "</strong>",
          "<span>" +
            escapeHtml(item.path) +
            "</span>",
          "<small>" +
            escapeHtml(item.categoryLabel) +
            (item.latestDate ? " · " + escapeHtml(item.latestDate) : "") +
            "</small>",
          "</button>"
        ].join("");
      })
      .join("");
  }

  function scheduleAutoSave() {
    if (autoSaveTimer) {
      window.clearTimeout(autoSaveTimer);
    }

    autoSaveTimer = window.setTimeout(function () {
      setWorkingDraft(getState());
      setStatus("작업 중 초안을 브라우저에 자동 저장했습니다.");
    }, 700);
  }

  function saveSnapshot() {
    var state = getState();
    var snapshot = {
      id: "draft-" + Date.now(),
      mode: state.mode,
      category: state.category,
      title: state.title,
      slug: state.slug,
      path: state.path,
      summary: state.summary,
      content: state.content,
      targetPath: state.targetPath,
      savedAt: new Date().toISOString()
    };

    draftItems = getSavedDrafts();
    draftItems.unshift(snapshot);
    setSavedDrafts(draftItems);
    renderDraftList();
    setStatus("현재 초안을 저장 목록에 추가했습니다.");
  }

  function loadSnapshot(id) {
    draftItems = getSavedDrafts();
    var match = draftItems.find(function (item) {
      return item.id === id;
    });

    if (!match) {
      setStatus("저장한 초안을 찾지 못했습니다.");
      return;
    }

    fields.mode.value = normalizeMode(match.mode);
    fields.category.value = match.category || "05_misc";
    fields.title.value = match.title || "";
    fields.slug.value = match.slug || "";
    fields.path.value = match.path || "";
    fields.summary.value = match.summary || "";
    fields.content.value = match.content || "";
    render();
    setStatus("저장한 초안을 불러왔습니다.");
  }

  function deleteSnapshot(id) {
    draftItems = getSavedDrafts().filter(function (item) {
      return item.id !== id;
    });
    setSavedDrafts(draftItems);
    renderDraftList();
    setStatus("저장한 초안을 삭제했습니다.");
  }

  function buildIssueBody(state) {
    var markdown = state.content.trim();
    var bodyLines = [
      "## 작업 유형",
      state.mode === "edit" ? "- 기존 문서 개선" : "- 새 문서 작성",
      "",
      "## 대상 경로",
      "`" + (state.targetPath || "-") + "`",
      "",
      "## 문서 제목",
      state.title || "-",
      "",
      "## 요약",
      state.summary || "-",
      "",
      "## 초안 Markdown",
      "```md"
    ];

    if (markdown.length > 5000) {
      bodyLines.push(markdown.slice(0, 5000), "```", "", "_전체 Markdown은 Writer Studio에서 복사해 첨부해주세요._");
    } else {
      bodyLines.push(markdown || "(본문 없음)", "```");
    }

    return bodyLines.join("\n");
  }

  function copyText(text, successMessage) {
    if (!navigator.clipboard || !text) {
      setStatus("클립보드 복사를 지원하지 않는 환경입니다.");
      return Promise.resolve(false);
    }

    return navigator.clipboard
      .writeText(text)
      .then(function () {
        setStatus(successMessage);
        return true;
      })
      .catch(function () {
        setStatus("클립보드 복사에 실패했습니다.");
        return false;
      });
  }

  function downloadMarkdown() {
    var state = getState();
    if (!state.content.trim()) {
      setStatus("다운로드할 본문이 없습니다.");
      return;
    }

    var blob = new Blob([state.content], { type: "text/markdown;charset=utf-8" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = (state.targetPath || "draft.md").split("/").pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    setStatus("Markdown 파일을 다운로드했습니다.");
  }

  function openIssue() {
    var state = getState();
    if (!state.targetPath || !state.content.trim()) {
      setStatus("대상 경로와 본문을 먼저 입력하세요.");
      return;
    }

    var url =
      "https://github.com/" +
      repo +
      "/issues/new?title=" +
      encodeURIComponent(state.issueTitle) +
      "&body=" +
      encodeURIComponent(buildIssueBody(state));

    copyText(state.content, "Markdown을 복사하고 GitHub 제안 이슈를 엽니다.").finally(function () {
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }

  function openGitHubEditor() {
    var state = getState();
    if (!state.targetPath) {
      setStatus("대상 경로를 먼저 입력하세요.");
      return;
    }

    var url;
    if (state.mode === "edit") {
      url = "https://github.com/" + repo + "/edit/main/" + encodePathSegments(state.targetPath);
    } else {
      url = "https://github.com/" + repo + "/new/main?filename=" + encodeURIComponent(state.targetPath);
    }

    copyText(state.content, "Markdown을 복사하고 GitHub 편집기를 엽니다.").finally(function () {
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }

  function applyTemplate(templateName) {
    var state = getState();
    var template = templates[templateName];
    if (!template) {
      return;
    }

    if (state.mode === "edit" && templateName !== "review") {
      fields.content.value = templates.review + "\n" + (fields.content.value || "");
    } else if (!fields.content.value.trim()) {
      fields.content.value = template;
    } else {
      fields.content.value = template + "\n" + fields.content.value;
    }

    render();
    setStatus("템플릿을 본문에 적용했습니다.");
  }

  function populateFromMarkdown(path, markdown) {
    var inferredTitle = extractTitleFromMarkdown(markdown) || pathToTitle(path);
    var inferredSummary = extractSummaryFromMarkdown(markdown);

    fields.mode.value = "edit";
    fields.path.value = path;
    fields.title.value = inferredTitle;
    fields.summary.value = fields.summary.value || inferredSummary;
    fields.content.value = markdown;
    render();
  }

  function loadDocument(path) {
    if (!path) {
      return;
    }

    setStatus("문서 원본을 불러오는 중입니다.");

    fetch(toSitePath(path), { credentials: "same-origin" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("document load failed");
        }
        return response.text();
      })
      .then(function (markdown) {
        populateFromMarkdown(path, markdown);
        setStatus("문서 원본을 작업실에 불러왔습니다.");
      })
      .catch(function () {
        fields.mode.value = "edit";
        fields.path.value = path;
        fields.title.value = fields.title.value || pathToTitle(path);
        render();
        setStatus("문서 본문을 자동으로 불러오지 못했습니다. 경로만 채운 뒤 수동 작성 상태로 전환했습니다.");
      });
  }

  function buildLibrary() {
    fetch(baseUrl + "/assets/data/site-meta.json", { credentials: "same-origin" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("site-meta load failed");
        }
        return response.json();
      })
      .then(function (siteMeta) {
        var pages = (siteMeta && siteMeta.pages) || {};
        libraryItems = Object.keys(pages)
          .filter(function (path) {
            var lower = path.toLowerCase();
            return lower !== "index.md" && lower.indexOf("readme.md") < 0 && lower !== "write.md";
          })
          .map(function (path) {
            var pageMeta = pages[path] || {};
            var category = path.split("/")[0] || "05_misc";
            return {
              path: path,
              title: pathToTitle(path),
              category: category,
              categoryLabel: categoryLabels[category] || category,
              latestDate: pageMeta.latest_date
                ? new Date(pageMeta.latest_date).toLocaleDateString("ko-KR")
                : "",
              latestAuthor: pageMeta.latest_author || ""
            };
          })
          .sort(function (left, right) {
            return left.path.localeCompare(right.path);
          });

        renderDocList();
      })
      .catch(function () {
        libraryItems = [];
        renderDocList();
        setStatus("문서 라이브러리를 불러오지 못했습니다.");
      });
  }

  function render() {
    var state = getState();
    var characters = getCharacterCount(state.content);
    var words = getWordCount(state.content);

    updateVisibility(state.mode);

    if (outputs.path) {
      outputs.path.textContent = state.targetPath || "-";
    }

    if (outputs.repo) {
      outputs.repo.textContent = repo;
    }

    if (outputs.issueTitle) {
      outputs.issueTitle.textContent = state.issueTitle;
    }

    if (outputs.stats) {
      outputs.stats.textContent = characters + "자 · " + words + "단어";
    }

    renderPreview(state);
  }

  function applyDraftData(data) {
    if (!data) {
      return;
    }

    fields.mode.value = normalizeMode(data.mode);
    fields.category.value = data.category || "05_misc";
    fields.title.value = data.title || "";
    fields.slug.value = data.slug || "";
    fields.path.value = data.path || "";
    fields.summary.value = data.summary || "";
    fields.content.value = data.content || "";
  }

  function applyQueryPreset() {
    var mode = normalizeMode(getQueryValue("mode"));
    var path = getQueryValue("path");
    var title = getQueryValue("title");

    if (mode) {
      fields.mode.value = mode;
    }

    if (path) {
      fields.path.value = path;
    }

    if (title && !fields.title.value) {
      fields.title.value = title;
    }

    if (mode === "edit" && path) {
      loadDocument(path);
    }
  }

  modeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var mode = normalizeMode(button.getAttribute("data-writer-mode"));
      fields.mode.value = mode;
      render();
      scheduleAutoSave();
    });
  });

  app.addEventListener("input", function (event) {
    if (event.target === fields.title && fields.mode.value === "new" && !fields.slug.value.trim()) {
      fields.slug.value = slugify(fields.title.value);
    }

    if (event.target === searchField) {
      renderDocList();
      return;
    }

    render();
    scheduleAutoSave();
  });

  app.addEventListener("change", function () {
    render();
    scheduleAutoSave();
  });

  app.addEventListener("click", function (event) {
    var actionNode = event.target.closest("[data-writer-action], [data-writer-template]");
    if (!actionNode) {
      return;
    }

    if (actionNode.hasAttribute("data-writer-template")) {
      applyTemplate(actionNode.getAttribute("data-writer-template"));
      scheduleAutoSave();
      return;
    }

    var action = actionNode.getAttribute("data-writer-action");
    var draftId = actionNode.getAttribute("data-writer-draft-id");
    var docPath = actionNode.getAttribute("data-writer-doc-path");

    if (action === "save") {
      saveSnapshot();
      return;
    }

    if (action === "copy") {
      copyText(getState().content, "Markdown을 클립보드에 복사했습니다.");
      return;
    }

    if (action === "download") {
      downloadMarkdown();
      return;
    }

    if (action === "github-editor") {
      openGitHubEditor();
      return;
    }

    if (action === "issue") {
      openIssue();
      return;
    }

    if (action === "load-doc") {
      loadDocument(docPath);
      return;
    }

    if (action === "load-draft") {
      loadSnapshot(draftId);
      return;
    }

    if (action === "delete-draft") {
      deleteSnapshot(draftId);
    }
  });

  draftItems = getSavedDrafts();
  renderDraftList();
  buildLibrary();

  var workingDraft = getWorkingDraft();
  if (workingDraft && workingDraft.draft) {
    applyDraftData(workingDraft.draft);
  }

  applyQueryPreset();

  if (!fields.content.value.trim()) {
    fields.content.value = templates.concept;
  }

  render();
})();
