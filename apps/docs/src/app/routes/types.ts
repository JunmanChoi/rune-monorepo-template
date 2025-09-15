// types/marpple-route.ts
import type { RuneRouter } from "@rune-ts/server";
import type { CommonRenderer } from "../../infra/renderer/common-renderer";
import type { PageRouteConfig } from "../../infra/route-handler/types";
import type { routeMap } from "./constants";

export type MarppleRoute = typeof routeMap;
export type MarpplePageRouter = RuneRouter<MarppleRoute>;

export type MarppleRouteConfig = PageRouteConfig<
  MarpplePageRouter,
  "/",
  CommonRenderer
>;
