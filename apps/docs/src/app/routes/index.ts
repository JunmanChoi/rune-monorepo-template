import { createRouter } from "@rune-ts/server";
import { Router } from "express";
import { CommonRenderer } from "../../infra/renderer/common-renderer";
import { createRouteHandler } from "../../infra/route-handler/route-handler";
import { homeRouteConfig } from "../pages/home/home-route-config";
import { routeMap } from "./constants";
import type { MarppleRoute } from "./types";

/**
 * 라우터 생성
 */
export const marpplePageRouter = createRouter<MarppleRoute>({
  ...routeMap,
});

/**
 * 라우트 등록 함수
 */
export function registerMarppleRoutes(): Router {
  /**
   * 핸들러 / 렌더러 생성
   */
  const marppleRouteHandler = createRouteHandler(marpplePageRouter);
  const renderer = new CommonRenderer();

  const router = Router();
  const routes = [marppleRouteHandler.createRoute(homeRouteConfig, renderer)];

  marppleRouteHandler.registerRoutes(router, routes);
  return router;
}
