// 라우트 등록
import type { NextFunction, Request, Response, Router } from "express";
import type { View } from "rune-ts";
import type { Renderer } from "../renderer/renderer";
import type {
  AnyRouter,
  PagePath,
  PageRouteConfig,
  PageViewParams,
} from "./types";

// router-factory.ts
export function createRouteHandler<T extends AnyRouter>(router: T) {
  type Path = PagePath<T>;

  return {
    createRoute<P extends Path, R extends Renderer = Renderer>(
      config: PageRouteConfig<T, P>,
      renderer: R
    ) {
      const routeHandler = async (
        req: Request,
        res: Response,
        next: NextFunction
      ) => {
        try {
          const pageArgs: PageViewParams<T, P> = config.fetcher
            ? await config.fetcher(req, res)
            : {
                data: {},
                sharedData: {},
              };
          const pageView = router[config.path]?.(
            pageArgs.data,
            pageArgs.sharedData ?? {}
          ) as View;

          return await renderer.render(req, res, {
            view: pageView,
            render_options: config.render_options,
          });
        } catch (error) {
          if (config.errorHandler) {
            return config.errorHandler(error, req, res, next);
          }
          return next(error);
        }
      };

      const path = router[config.path]!.toString(); // 경로 얻기 - 없으면 오류

      return {
        path,
        handler: routeHandler,
        middlewares: config.middlewares ?? [],
      };
    },

    registerRoutes(
      expressRouter: Router,
      routes: ReturnType<typeof this.createRoute>[]
    ): Router {
      routes.forEach((route) => {
        expressRouter.get(route.path, ...route.middlewares, route.handler);
      });
      return expressRouter;
    },
  };
}
