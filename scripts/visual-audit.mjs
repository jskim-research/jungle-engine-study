import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import puppeteer from "puppeteer-core";

const require = createRequire(import.meta.url);
const axeSourcePath = require.resolve("axe-core/axe.min.js");

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

function parseArgs(argv) {
  const options = {
    baseUrl: process.env.VISUAL_AUDIT_BASE_URL || "http://127.0.0.1:4000/jungle-engine-study/",
    chromePath: process.env.CHROME_PATH || "",
    outputDir: path.join(repoRoot, ".visual-audit"),
    siteDir: path.join(repoRoot, "_site"),
    maxIssuesPerPage: 24
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if (current === "--base-url" && next) {
      options.baseUrl = next;
      index += 1;
    } else if (current === "--chrome-path" && next) {
      options.chromePath = next;
      index += 1;
    } else if (current === "--output-dir" && next) {
      options.outputDir = path.resolve(repoRoot, next);
      index += 1;
    } else if (current === "--site-dir" && next) {
      options.siteDir = path.resolve(repoRoot, next);
      index += 1;
    } else if (current === "--max-issues" && next) {
      const parsed = Number.parseInt(next, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        options.maxIssuesPerPage = parsed;
      }
      index += 1;
    }
  }

  if (!options.baseUrl.endsWith("/")) {
    options.baseUrl += "/";
  }

  return options;
}

async function ensureDirectory(targetPath) {
  await fs.mkdir(targetPath, { recursive: true });
}

async function getHtmlFiles(rootDir) {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getHtmlFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && fullPath.toLowerCase().endsWith(".html")) {
      files.push(fullPath);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function normalizeSlashes(value) {
  return value.split(path.sep).join("/");
}

function toPageUrl(siteDir, htmlPath, baseUrl) {
  const relativePath = normalizeSlashes(path.relative(siteDir, htmlPath));

  if (relativePath === "index.html") {
    return new URL("./", baseUrl).href;
  }

  if (relativePath.endsWith("/index.html")) {
    const directoryPath = relativePath.slice(0, -"/index.html".length);
    return new URL(`${directoryPath}/`, baseUrl).href;
  }

  return new URL(relativePath, baseUrl).href;
}

function findChromeExecutable(explicitPath) {
  const candidates = [
    explicitPath,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      return path.normalize(candidate);
    } catch {
      continue;
    }
  }

  throw new Error("Chrome or Edge executable was not found. Set CHROME_PATH or pass --chrome-path.");
}

async function resolveExistingChromePath(explicitPath) {
  const candidates = [
    explicitPath,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  return findChromeExecutable(explicitPath);
}

function sanitizeFileName(input) {
  return input.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
}

async function runAccessibilityAudit(page, axeSource) {
  await page.addScriptTag({ content: axeSource });
  return page.evaluate(async () => {
    return window.axe.run(document, {
      runOnly: {
        type: "rule",
        values: ["color-contrast"]
      }
    });
  });
}

async function runManualContrastAudit(page, maxIssuesPerPage) {
  return page.evaluate((limit) => {
    const selector = [
      ".post-content pre",
      ".post-content pre *",
      ".post-content code",
      ".post-content code *",
      ".post-content table th",
      ".post-content table td",
      ".post-content mark",
      ".post-content a",
      ".site-footer",
      ".site-footer *",
      ".post-meta",
      ".post-meta *",
      ".theme-toggle",
      ".theme-toggle *"
    ].join(",");

    function parseColor(rawValue) {
      if (!rawValue) {
        return null;
      }

      const value = rawValue.trim().toLowerCase();
      if (value === "transparent") {
        return { r: 0, g: 0, b: 0, a: 0 };
      }

      const rgbMatch = value.match(/^rgba?\(([^)]+)\)$/);
      if (!rgbMatch) {
        return null;
      }

      const parts = rgbMatch[1].split(",").map((part) => part.trim());
      if (parts.length < 3) {
        return null;
      }

      return {
        r: Number.parseFloat(parts[0]),
        g: Number.parseFloat(parts[1]),
        b: Number.parseFloat(parts[2]),
        a: parts[3] === undefined ? 1 : Number.parseFloat(parts[3])
      };
    }

    function compositeColor(foreground, background) {
      if (!foreground) {
        return background;
      }

      if (!background) {
        return foreground;
      }

      const alpha = foreground.a + background.a * (1 - foreground.a);
      if (alpha <= 0) {
        return { r: 0, g: 0, b: 0, a: 0 };
      }

      return {
        r: ((foreground.r * foreground.a) + (background.r * background.a * (1 - foreground.a))) / alpha,
        g: ((foreground.g * foreground.a) + (background.g * background.a * (1 - foreground.a))) / alpha,
        b: ((foreground.b * foreground.a) + (background.b * background.a * (1 - foreground.a))) / alpha,
        a: alpha
      };
    }

    function relativeChannel(value) {
      const normalized = value / 255;
      if (normalized <= 0.03928) {
        return normalized / 12.92;
      }

      return ((normalized + 0.055) / 1.055) ** 2.4;
    }

    function luminance(color) {
      return (
        (0.2126 * relativeChannel(color.r)) +
        (0.7152 * relativeChannel(color.g)) +
        (0.0722 * relativeChannel(color.b))
      );
    }

    function contrastRatio(foreground, background) {
      const lighter = Math.max(luminance(foreground), luminance(background));
      const darker = Math.min(luminance(foreground), luminance(background));
      return (lighter + 0.05) / (darker + 0.05);
    }

    function getBackgroundColor(element) {
      const ancestry = [];
      let current = element;

      while (current && current.nodeType === Node.ELEMENT_NODE) {
        ancestry.push(current);
        current = current.parentElement;
      }

      let resolved = { r: 255, g: 255, b: 255, a: 1 };

      for (const node of ancestry.reverse()) {
        const background = parseColor(window.getComputedStyle(node).backgroundColor);
        if (!background) {
          continue;
        }

        resolved = compositeColor(background, resolved);
      }

      return resolved;
    }

    function isVisible(element) {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number.parseFloat(style.opacity || "1") > 0 &&
        rect.width > 0 &&
        rect.height > 0
      );
    }

    function getThreshold(style) {
      const fontSize = Number.parseFloat(style.fontSize || "0");
      const fontWeight = Number.parseInt(style.fontWeight || "400", 10);
      const isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
      return isLarge ? 3 : 4.5;
    }

    function formatSelector(element) {
      const parts = [];
      let current = element;

      while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 4) {
        let part = current.tagName.toLowerCase();
        if (current.id) {
          part += `#${current.id}`;
          parts.unshift(part);
          break;
        }

        if (current.classList.length > 0) {
          part += `.${Array.from(current.classList).slice(0, 2).join(".")}`;
        }

        parts.unshift(part);
        current = current.parentElement;
      }

      return parts.join(" > ");
    }

    function snippetFor(element) {
      return (element.innerText || element.textContent || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 120);
    }

    function colorToHex(color) {
      const encode = (value) => Math.round(value).toString(16).padStart(2, "0");
      return `#${encode(color.r)}${encode(color.g)}${encode(color.b)}`;
    }

    const elements = Array.from(document.querySelectorAll(selector));
    const issues = [];
    const seen = new Set();

    for (const element of elements) {
      if (issues.length >= limit) {
        break;
      }

      if (!isVisible(element)) {
        continue;
      }

      const text = snippetFor(element);
      if (!text) {
        continue;
      }

      const style = window.getComputedStyle(element);
      const foregroundBase = parseColor(style.color);
      if (!foregroundBase) {
        continue;
      }

      const background = getBackgroundColor(element);
      const foreground = compositeColor(foregroundBase, background);
      const ratio = contrastRatio(foreground, background);
      const threshold = getThreshold(style);

      if (ratio >= threshold) {
        continue;
      }

      const selectorText = formatSelector(element);
      const fingerprint = `${selectorText}|${text}|${Math.round(ratio * 100)}`;
      if (seen.has(fingerprint)) {
        continue;
      }

      seen.add(fingerprint);
      issues.push({
        selector: selectorText,
        snippet: text,
        contrastRatio: Number(ratio.toFixed(2)),
        requiredRatio: threshold,
        foreground: colorToHex(foreground),
        background: colorToHex(background)
      });
    }

    return issues;
  }, maxIssuesPerPage);
}

async function auditPage(browser, options, pageInfo, axeSource, screenshotsDir) {
  const results = [];
  const modes = [
    { name: "system-light", storageTheme: "system", systemTheme: "light" },
    { name: "explicit-light", storageTheme: "light", systemTheme: "light" },
    { name: "system-dark", storageTheme: "system", systemTheme: "dark" },
    { name: "explicit-dark", storageTheme: "dark", systemTheme: "dark" }
  ];

  for (const mode of modes) {
    const page = await browser.newPage();

    try {
      await page.setViewport({ width: 1440, height: 1100, deviceScaleFactor: 1 });
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: mode.systemTheme }]);
      await page.evaluateOnNewDocument((theme) => {
        try {
          if (theme === "system") {
            localStorage.removeItem("jungle-theme");
          } else {
            localStorage.setItem("jungle-theme", theme);
          }
        } catch {
          return;
        }
      }, mode.storageTheme);

      await page.goto(pageInfo.url, { waitUntil: "load", timeout: 60000 });
      await page.waitForFunction(() => document.readyState === "complete", { timeout: 10000 }).catch(() => {});
      const expectedResolvedTheme = mode.storageTheme === "system" ? mode.systemTheme : mode.storageTheme;
      await page.waitForFunction((resolvedTheme) => {
        const root = document.documentElement;
        return root.style.colorScheme === resolvedTheme;
      }, { timeout: 10000 }, expectedResolvedTheme).catch(() => {});
      await page.waitForSelector("body", { timeout: 10000 });

      const [axeResult, manualIssues, title] = await Promise.all([
        runAccessibilityAudit(page, axeSource),
        runManualContrastAudit(page, options.maxIssuesPerPage),
        page.title()
      ]);

      const axeIssues = axeResult.violations.flatMap((violation) =>
        violation.nodes.map((node) => ({
          id: violation.id,
          impact: violation.impact,
          help: violation.help,
          selector: Array.isArray(node.target) ? node.target.join(" ") : String(node.target),
          snippet: (node.html || "").replace(/\s+/g, " ").trim().slice(0, 160)
        }))
      );

      const issueCount = axeIssues.length + manualIssues.length;
      let screenshotPath = null;

      if (issueCount > 0) {
        const fileName = sanitizeFileName(`${pageInfo.slug}-${mode.name}.png`) || `page-${mode.name}.png`;
        screenshotPath = path.join(screenshotsDir, fileName);
        await page.screenshot({ path: screenshotPath, fullPage: true });
      }

      results.push({
        ...pageInfo,
        title,
        mode: mode.name,
        screenshotPath,
        axeIssues,
        manualIssues
      });
    } finally {
      await page.close();
    }
  }

  return results;
}

function formatConsoleSummary(report) {
  const flagged = report.results.filter((entry) => entry.axeIssues.length > 0 || entry.manualIssues.length > 0);
  const lines = [
    `Audited ${report.pagesAudited} pages across ${report.modesAudited} theme states.`,
    `Flagged results: ${flagged.length}`
  ];

  for (const entry of flagged.slice(0, 20)) {
    lines.push(
      `- [${entry.mode}] ${entry.relativePath} :: axe ${entry.axeIssues.length}, manual ${entry.manualIssues.length}`
    );
  }

  if (flagged.length > 20) {
    lines.push(`- ... ${flagged.length - 20} more flagged results`);
  }

  return lines.join("\n");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const chromePath = await resolveExistingChromePath(options.chromePath);
  const axeSource = await fs.readFile(axeSourcePath, "utf8");

  const stats = await fs.stat(options.siteDir).catch(() => null);
  if (!stats || !stats.isDirectory()) {
    throw new Error(`Site directory was not found: ${options.siteDir}`);
  }

  await ensureDirectory(options.outputDir);
  const screenshotsDir = path.join(options.outputDir, "screenshots");
  await ensureDirectory(screenshotsDir);

  const htmlFiles = await getHtmlFiles(options.siteDir);
  const pages = htmlFiles.map((htmlPath) => {
    const relativePath = normalizeSlashes(path.relative(options.siteDir, htmlPath));
    return {
      relativePath,
      slug: relativePath.replace(/\/index\.html$/i, "").replace(/\.html$/i, "").replace(/[\\/]/g, "_") || "index",
      url: toPageUrl(options.siteDir, htmlPath, options.baseUrl)
    };
  });

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    defaultViewport: null,
    args: [
      "--allow-file-access-from-files",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check"
    ]
  });

  try {
    const results = [];

    for (const pageInfo of pages) {
      results.push(...(await auditPage(browser, options, pageInfo, axeSource, screenshotsDir)));
    }

    const report = {
      createdAt: new Date().toISOString(),
      baseUrl: options.baseUrl,
      chromePath,
      pagesAudited: pages.length,
      modesAudited: 4,
      results
    };

    const reportPath = path.join(options.outputDir, "visual-audit-report.json");
    await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

    console.log(formatConsoleSummary(report));
    console.log(`Report: ${reportPath}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
