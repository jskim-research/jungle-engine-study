(function () {
  var shell = document.querySelector("[data-comments-provider]");
  if (!shell) {
    return;
  }

  var mount = shell.querySelector("[data-comments-mount]");
  var provider = (shell.getAttribute("data-comments-provider") || "").toLowerCase();
  var root = document.documentElement;

  if (!mount || !provider) {
    shell.hidden = true;
    return;
  }

  function getResolvedTheme() {
    var explicitTheme = root.getAttribute("data-theme");
    if (explicitTheme === "light" || explicitTheme === "dark") {
      return explicitTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function getUtterancesTheme(resolvedTheme) {
    if (resolvedTheme === "dark") {
      return shell.getAttribute("data-comments-utterances-theme-dark") || "github-dark";
    }

    return shell.getAttribute("data-comments-utterances-theme-light") || "github-light";
  }

  function getGiscusTheme(resolvedTheme) {
    return resolvedTheme === "dark" ? "dark" : "light";
  }

  function postThemeMessage(targetOrigin, payload, selector) {
    var iframe = shell.querySelector(selector);
    if (!iframe || !iframe.contentWindow) {
      return;
    }

    iframe.contentWindow.postMessage(payload, targetOrigin);
  }

  function syncEmbeddedTheme(resolvedTheme) {
    if (provider === "utterances") {
      postThemeMessage(
        "https://utteranc.es",
        {
          type: "set-theme",
          theme: getUtterancesTheme(resolvedTheme)
        },
        "iframe.utterances-frame"
      );
      return;
    }

    if (provider === "giscus") {
      postThemeMessage(
        "https://giscus.app",
        {
          giscus: {
            setConfig: {
              theme: getGiscusTheme(resolvedTheme)
            }
          }
        },
        "iframe.giscus-frame"
      );
    }
  }

  function createScript(src, attributes) {
    var script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";

    Object.keys(attributes).forEach(function (key) {
      if (attributes[key] === undefined || attributes[key] === null || attributes[key] === "") {
        return;
      }

      script.setAttribute(key, attributes[key]);
    });

    return script;
  }

  function mountUtterances() {
    var repo = shell.getAttribute("data-comments-repo");
    if (!repo) {
      shell.hidden = true;
      return;
    }

    mount.appendChild(
      createScript("https://utteranc.es/client.js", {
        repo: repo,
        "issue-term": shell.getAttribute("data-comments-issue-term") || "pathname",
        theme: getUtterancesTheme(getResolvedTheme())
      })
    );
  }

  function mountGiscus() {
    var repo = shell.getAttribute("data-comments-repo");
    var repoId = shell.getAttribute("data-comments-giscus-repo-id");
    var category = shell.getAttribute("data-comments-giscus-category");
    var categoryId = shell.getAttribute("data-comments-giscus-category-id");

    if (!repo || !repoId || !category || !categoryId) {
      shell.hidden = true;
      return;
    }

    mount.appendChild(
      createScript("https://giscus.app/client.js", {
        "data-repo": repo,
        "data-repo-id": repoId,
        "data-category": category,
        "data-category-id": categoryId,
        "data-mapping": shell.getAttribute("data-comments-giscus-mapping") || "pathname",
        "data-strict": shell.getAttribute("data-comments-giscus-strict") || "0",
        "data-reactions-enabled": shell.getAttribute("data-comments-giscus-reactions-enabled") || "1",
        "data-emit-metadata": "0",
        "data-input-position": shell.getAttribute("data-comments-giscus-input-position") || "bottom",
        "data-theme": getGiscusTheme(getResolvedTheme()),
        "data-lang": shell.getAttribute("data-comments-lang") || "ko"
      })
    );
  }

  if (provider === "utterances") {
    mountUtterances();
  } else if (provider === "giscus") {
    mountGiscus();
  } else {
    shell.hidden = true;
    return;
  }

  window.addEventListener("jungle:theme-change", function (event) {
    var detail = event && event.detail ? event.detail : {};
    syncEmbeddedTheme(detail.resolvedTheme || getResolvedTheme());
  });
})();
