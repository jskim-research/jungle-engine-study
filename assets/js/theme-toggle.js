(function () {
  var storageKey = "jungle-theme";
  var root = document.documentElement;
  var button = document.querySelector("[data-theme-toggle]");
  var buttonValue = button ? button.querySelector("[data-theme-toggle-value]") : null;
  var mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  var themeOrder = ["system", "dark", "light"];
  var labels = {
    system: "시스템",
    dark: "다크",
    light: "라이트"
  };
  var resolvedLabels = {
    dark: "다크",
    light: "라이트"
  };

  function normalizeTheme(value) {
    if (value === "light" || value === "dark") {
      return value;
    }

    return "system";
  }

  function getStoredTheme() {
    try {
      return normalizeTheme(localStorage.getItem(storageKey));
    } catch (e) {
      return "system";
    }
  }

  function setStoredTheme(theme) {
    try {
      if (theme === "system") {
        localStorage.removeItem(storageKey);
        return;
      }

      localStorage.setItem(storageKey, theme);
    } catch (e) {
      return;
    }
  }

  function resolveTheme(theme) {
    if (theme === "system") {
      return mediaQuery.matches ? "dark" : "light";
    }

    return theme;
  }

  function applyTheme(theme) {
    var resolvedTheme = resolveTheme(theme);

    if (theme === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }

    root.setAttribute("data-theme-mode", theme);
    root.style.colorScheme = resolvedTheme;

    return resolvedTheme;
  }

  function nextTheme(theme) {
    var currentIndex = themeOrder.indexOf(theme);
    return themeOrder[(currentIndex + 1) % themeOrder.length];
  }

  function updateButton(theme, resolvedTheme) {
    if (!button) {
      return;
    }

    var label = labels[theme] || labels.system;
    if (buttonValue) {
      buttonValue.textContent = label;
    }

    button.setAttribute("data-theme-state", theme);
    button.setAttribute("data-theme-resolved", resolvedTheme);
    button.setAttribute(
      "aria-label",
      "테마 모드: " +
        label +
        ". 현재 적용 색상: " +
        (resolvedLabels[resolvedTheme] || resolvedTheme) +
        ". 클릭하면 시스템, 다크, 라이트 순으로 변경됩니다."
    );
    button.setAttribute("title", "테마 모드 전환");
  }

  function notifyThemeChange(theme, resolvedTheme) {
    window.dispatchEvent(
      new CustomEvent("jungle:theme-change", {
        detail: {
          theme: theme,
          resolvedTheme: resolvedTheme
        }
      })
    );
  }

  function syncTheme(theme) {
    var resolvedTheme = applyTheme(theme);
    updateButton(theme, resolvedTheme);
    notifyThemeChange(theme, resolvedTheme);
  }

  var activeTheme = getStoredTheme();
  syncTheme(activeTheme);

  if (button) {
    button.addEventListener("click", function () {
      activeTheme = nextTheme(activeTheme);
      setStoredTheme(activeTheme);
      syncTheme(activeTheme);
    });
  }

  function handleSystemThemeChange() {
    if (getStoredTheme() !== "system") {
      return;
    }

    activeTheme = "system";
    syncTheme(activeTheme);
  }

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", handleSystemThemeChange);
  } else if (typeof mediaQuery.addListener === "function") {
    mediaQuery.addListener(handleSystemThemeChange);
  }
})();
