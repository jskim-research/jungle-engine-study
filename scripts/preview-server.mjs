import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

function parseArgs(argv) {
  const options = {
    siteDir: path.join(repoRoot, "_site"),
    host: "127.0.0.1",
    port: 4000,
    basePath: "/jungle-engine-study/"
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if (current === "--site-dir" && next) {
      options.siteDir = path.resolve(repoRoot, next);
      index += 1;
    } else if (current === "--host" && next) {
      options.host = next;
      index += 1;
    } else if (current === "--port" && next) {
      const parsed = Number.parseInt(next, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        options.port = parsed;
      }
      index += 1;
    } else if (current === "--base-path" && next) {
      options.basePath = next.startsWith("/") ? next : `/${next}`;
      index += 1;
    }
  }

  if (!options.basePath.endsWith("/")) {
    options.basePath += "/";
  }

  return options;
}

function getContentType(filePath) {
  switch (path.extname(filePath).toLowerCase()) {
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
    case ".mjs":
      return "application/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".xml":
      return "application/xml; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".ico":
      return "image/x-icon";
    case ".txt":
      return "text/plain; charset=utf-8";
    case ".html":
    default:
      return "text/html; charset=utf-8";
  }
}

function withinRoot(rootDir, candidatePath) {
  const relative = path.relative(rootDir, candidatePath);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

async function resolveRequestPath(siteDir, requestPath) {
  const cleanPath = decodeURIComponent(requestPath).replace(/^\/+/, "");
  const normalizedPath = path.normalize(cleanPath);
  let candidate = path.join(siteDir, normalizedPath);

  if (!withinRoot(siteDir, candidate) && candidate !== siteDir) {
    return null;
  }

  const stats = await fs.stat(candidate).catch(() => null);
  if (stats?.isDirectory()) {
    candidate = path.join(candidate, "index.html");
  } else if (!stats && !path.extname(candidate)) {
    const htmlCandidate = `${candidate}.html`;
    const htmlStats = await fs.stat(htmlCandidate).catch(() => null);
    if (htmlStats?.isFile()) {
      candidate = htmlCandidate;
    }
  }

  const finalStats = await fs.stat(candidate).catch(() => null);
  if (!finalStats?.isFile()) {
    return null;
  }

  if (!withinRoot(siteDir, candidate)) {
    return null;
  }

  return candidate;
}

async function startServer(options) {
  await fs.access(options.siteDir);

  const server = http.createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || "/", `http://${options.host}:${options.port}`);
      const pathname = requestUrl.pathname;

      if (pathname === "/") {
        response.statusCode = 302;
        response.setHeader("Location", options.basePath);
        response.end();
        return;
      }

      if (!pathname.startsWith(options.basePath)) {
        response.statusCode = 404;
        response.end("Not found");
        return;
      }

      const filePath = await resolveRequestPath(options.siteDir, pathname.slice(options.basePath.length));
      if (!filePath) {
        response.statusCode = 404;
        response.end("Not found");
        return;
      }

      const buffer = await fs.readFile(filePath);
      response.statusCode = 200;
      response.setHeader("Content-Type", getContentType(filePath));
      response.end(buffer);
    } catch (error) {
      response.statusCode = 500;
      response.end("Internal server error");
      console.error(error instanceof Error ? error.stack : String(error));
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(options.port, options.host, () => {
      server.off("error", reject);
      resolve();
    });
  });

  console.log(`Preview server: http://${options.host}:${options.port}${options.basePath}`);

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

const options = parseArgs(process.argv.slice(2));

startServer(options).catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
