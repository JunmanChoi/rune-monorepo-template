import * as http from "node:http";
import { initPageRoute } from "@man/fe-kit/server/initPageRoute";
import { ApiProxyMiddleware } from "@man/fe-web/src/apps/server/middlewares/ApiProxyMiddleware";
import { UserAgentMiddleware } from "@man/fe-web/src/apps/server/middlewares/UserAgentMiddleware";
import { safeImportPage } from "@man/fe-web/src/utils/safe-import";
import { app as application } from "@rune-ts/server";
import CacheableLookup from "cacheable-lookup";
import compression from "compression";
import cookieParser from "cookie-parser";
import express, { json, urlencoded } from "express";
import helmet from "helmet";

if (process.env.NODE_ENV === "development") {
  const cacheable = new CacheableLookup();
  cacheable.install(http.globalAgent);
}

const app = application();

export const start = async () => {
  app.use("/assets", express.static("assets"));

  app.use("/.well-known", (_req, res) => {
    res.status(204).end();
  });

  app.use("/health", (_req, res) => {
    res.status(200).send("ok");
  });

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    }),
    compression(),
    cookieParser(),
    json({ limit: "1mb" }),
    urlencoded({ extended: false }),
    ApiProxyMiddleware,
    UserAgentMiddleware
  );

  const errorHandler = await initPageRoute(app, safeImportPage);
  app.use(errorHandler);
};

start().catch((e) => {
  console.error(e);
});
