import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import compression from "compression";
import sirv from "sirv";
import { createServer as createViteServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prod = process.env.NODE_ENV === "production";

const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/react/" : "/");

const app = express();

async function renderSSR(template, render, url, query) {
  const { head, html, initialDataScript } = await render(url, query);

  return template
    .replace("<!--app-head-->", head)
    .replace("<!--app-html-->", html)
    .replace("</head>", `${initialDataScript}</head>`);
}

function normalizeUrl(url, base) {
  if (base && url.startsWith(base)) {
    url = url.slice(base.length - 1);
  }
  if (!url.startsWith("/")) {
    url = "/" + url;
  }
  return url;
}

// 개발 모드
if (!prod) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });

  app.use(vite.middlewares);

  app.use("*all", async (req, res, next) => {
    const url = req.originalUrl;
    const query = req.query;

    try {
      let template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
      template = await vite.transformIndexHtml(url, template);

      const { render } = await vite.ssrLoadModule(path.resolve(__dirname, "src/main-server.tsx"));

      const finalHtml = await renderSSR(template, render, url, query);

      res.status(200).set({ "Content-Type": "text/html" }).end(finalHtml);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
} else {
  // 프로덕션 모드
  app.use(compression());
  app.use(base, sirv(path.resolve(__dirname, "./dist/react"), { extensions: [] }));

  app.use("*all", async (req, res, next) => {
    try {
      const url = normalizeUrl(req.originalUrl, base);
      const query = req.query;

      const template = fs.readFileSync(path.resolve(__dirname, "./dist/react/index.html"), "utf-8");
      const { render } = await import(path.resolve(__dirname, "./dist/react-ssr/main-server.js"));

      const finalHtml = await renderSSR(template, render, url, query);

      res.status(200).set({ "Content-Type": "text/html" }).end(finalHtml);
    } catch (e) {
      console.error("SSR Error:", e);
      next(e);
    }
  });
}

// Start http server
app.listen(port, () => {
  console.log(`React SSR Server started at http://localhost:${port}`);
});
