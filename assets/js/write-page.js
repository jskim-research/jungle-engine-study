(function () {
  var app = document.querySelector("[data-writer-app]");
  if (!app) {
    return;
  }

  var cfg = window.JUNGLE_PAGE_META || {};
  var repo = [cfg.owner || "jskim-research", cfg.repo || "jungle-engine-study"].join("/");
  var baseUrl = cfg.baseurl || "";
  var storageKey = "jungle-writer-draft-v1";
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
    markdown: app.querySelector("[data-writer-output='markdown']")
  };
  var statusNode = app.querySelector("[data-writer-status]");
  var newOnly = app.querySelectorAll("[data-writer-new-only]");
  var editOnly = app.querySelectorAll("[data-writer-edit-only]");

  function setStatus(message) {
    if (statusNode) {
      statusNode.textContent = message;
    }
  }

  function normalizeMode(value) {
    return value === "edit" ? "edit" : "new";
  }

  function getQueryValue(name) {
    var url = new URL(window.location.href);
    return url.searchParams.get(name) || "";
  }

  function readDraft() {
    try {
      var raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeDraft(data) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
      setStatus("초안을 브라우저에 저장했습니다.");
    } catch (e) {
      setStatus("브라우저 저장에 실패했습니다.");
    }
  }

  function slugify(value) {
    var normalized = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[\\/:*?\"<>|]+/g, " ")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    return normalized;
  }

  function encodePathForGitHub(filePath) {
    return String(filePath || "")
      .split("/")
      .map(function (segment) {
        return encodeURIComponent(segment);
      })
      .join("/");
  }

  function buildDefaultTemplate(mode, title) {
    if (mode === "edit") {
      return [
        "## 수정 제안 요약",
        "",
        "- ",
        "",
        "---",
        "",
        "## 수정 대상",
        "",
        "- 기존 설명 중 보강이 필요한 부분:",
        "- 추가하고 싶은 예시:",
        "",
        "---",
        "",
        "## 수정 초안",
        "",
        "> 아래에 실제로 반영하고 싶은 문장을 Markdown으로 적어주세요.",
        ""
      ].join("\n");
    }

    return [
      "## 1. 개요",
      "",
      (title ? title + "는 " : "") + "",
      "",
      "---",
      "",
      "## 2. 핵심 개념",
      "",
      "- ",
      "",
      "---",
      "",
      "## 3. 예시",
      "",
      "```cpp",
      "// example",
      "```",
      ""
    ].join("\n");
  }

  function getState() {
    var mode = normalizeMode(fields.mode.value);
    var title = (fields.title.value || "").trim();
    var rawSlug = (fields.slug.value || "").trim();
    var slug = rawSlug || slugify(title) || "new-document";
    var path = (fields.path.value || "").trim();
    var summary = (fields.summary.value || "").trim();
    var content = fields.content.value || "";
    var category = fields.category.value || "05_misc";
    var targetPath = mode === "edit" ? path : category + "/" + slug + ".md";
    var issueTitle =
      mode === "edit"
        ? "[문서 개선 제안] " + (title || path || "Untitled")
        : "[새 문서 제안] " + (title || slug);

    return {
      mode: mode,
      category: category,
      title: title,
      slug: slug,
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
  }

  function render() {
    var state = getState();
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

    if (outputs.markdown) {
      outputs.markdown.value = state.content;
    }
  }

  function applyDraft(data) {
    if (!data) {
      return;
    }

    if (data.mode) fields.mode.value = normalizeMode(data.mode);
    if (data.category) fields.category.value = data.category;
    if (data.title) fields.title.value = data.title;
    if (data.slug) fields.slug.value = data.slug;
    if (data.path) fields.path.value = data.path;
    if (data.summary) fields.summary.value = data.summary;
    if (data.content) fields.content.value = data.content;
  }

  function applyQueryPreset() {
    var mode = normalizeMode(getQueryValue("mode"));
    var path = getQueryValue("path");
    var title = getQueryValue("title");

    if (mode) fields.mode.value = mode;
    if (path) fields.path.value = path;
    if (title && !fields.title.value) fields.title.value = title;
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
      bodyLines.push(markdown.slice(0, 5000), "```", "", "_전체 Markdown은 글쓰기 도구에서 복사해 첨부해주세요._");
    } else {
      bodyLines.push(markdown || "(본문 없음)", "```");
    }

    return bodyLines.join("\n");
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
      url = "https://github.com/" + repo + "/edit/main/" + encodePathForGitHub(state.targetPath);
    } else {
      url =
        "https://github.com/" +
        repo +
        "/new/main?filename=" +
        encodeURIComponent(state.targetPath);
    }

    copyText(state.content, "Markdown을 복사하고 GitHub 편집기를 엽니다.").finally(function () {
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }

  app.addEventListener("input", function (event) {
    if (event.target === fields.title && !fields.slug.value.trim() && fields.mode.value === "new") {
      fields.slug.value = slugify(fields.title.value);
    }

    render();
  });

  app.addEventListener("change", function () {
    render();
  });

  app.addEventListener("click", function (event) {
    var target = event.target.closest("[data-writer-action]");
    if (!target) {
      return;
    }

    var action = target.getAttribute("data-writer-action");
    var state = getState();

    if (action === "template") {
      if (!fields.content.value.trim()) {
        fields.content.value = buildDefaultTemplate(state.mode, state.title);
      } else {
        fields.content.value = buildDefaultTemplate(state.mode, state.title) + "\n" + fields.content.value;
      }
      render();
      setStatus("기본 템플릿을 본문에 넣었습니다.");
      return;
    }

    if (action === "save") {
      writeDraft(state);
      return;
    }

    if (action === "copy") {
      copyText(state.content, "Markdown을 클립보드에 복사했습니다.");
      return;
    }

    if (action === "issue") {
      openIssue();
      return;
    }

    if (action === "github-editor") {
      openGitHubEditor();
    }
  });

  applyDraft(readDraft());
  applyQueryPreset();

  if (!fields.content.value.trim()) {
    fields.content.value = buildDefaultTemplate(normalizeMode(fields.mode.value), fields.title.value);
  }

  render();
})();
