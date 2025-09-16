// types/marpple-route.ts

import type { CommonRenderer } from "@core/fe/ssr/renderer";
import type { PageRouteConfig } from "@core/fe/ssr/route-handler/types";
import type { RuneRouter } from "@rune-ts/server";
import type { routeMap } from "./constants";

export type MarppleRoute = typeof routeMap;
export type MarpplePageRouter = RuneRouter<MarppleRoute>;

export type MarppleRouteConfig<
  TPath extends keyof MarppleRoute = keyof MarppleRoute,
> = PageRouteConfig<MarpplePageRouter, TPath, CommonRenderer>;
