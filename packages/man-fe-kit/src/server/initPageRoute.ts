import {
  compact,
  each,
  filter,
  head,
  isNil,
  map,
  partition,
  pipe,
  range,
  reverse,
  sortBy,
  toAsync,
} from "@fxts/core";
import { setSharedData } from "@man/fe-kit/src/rune/SharedData";
import type { SafeImportPage } from "@man/fe-kit/src/rune/utils/safeImport";
import type { ErrorRoute, RouteLayout } from "@man/fe-kit/src/rune/utils/type";
import { NotFoundException } from "@man/fe-kit/src/server/error";
import type { RuneServer } from "@rune-ts/server";
import type { ErrorRequestHandler } from "express";
import fs from "fs";

const getErrorHandler: (
  safeImportPage: SafeImportPage,
  routers: string[],
  path?: string | null
) => Promise<ErrorRequestHandler> = async (safeImportPage, routers, path) => {
  const route = path
    ? ((await safeImportPage(path)) as unknown as ErrorRoute)
    : null;

  return async (error, request, response, _next) => {
    try {
      if (route && path) {
        const errorServerSideProps = await route.getErrorServerSideProps({
          request,
          response,
          error,
        });

        if ("_json" in request.query) {
          response
            .setHeader("Content-Type", "application/json")
            .status(errorServerSideProps.response.status)
            .json({
              bodyData: errorServerSideProps.bodyData,
              layoutData: errorServerSideProps.layoutData,
              sharedData: {
                ...errorServerSideProps.sharedData,
                routers,
              },
            });
        } else {
          const layoutView = new route.Layout(
            errorServerSideProps.layoutData,
            {
              ...errorServerSideProps.sharedData,
              routers,
            },
            {
              bodyData: errorServerSideProps.bodyData,
              path,
              layoutPath: path,
            }
          );

          const bodyView = new route.Body(errorServerSideProps.bodyData);

          layoutView.key = path;
          bodyView.key = path;

          layoutView.setBody(bodyView);

          response
            .setHeader("Content-Type", "text/html")
            .status(errorServerSideProps.response.status)
            .send(layoutView.renderServerSide());
        }
      } else {
        response
          .setHeader(
            "Content-Type",
            "_json" in request.query ? "application/json" : "text/html"
          )
          .status(500)
          .send(error);
      }
    } catch (e) {
      console.error(e);
      response.status(500).end(error);
    }
  };
};

const makePath = (path: string): string => {
  return path.replaceAll("index", "").replaceAll("[", "").replaceAll("]", "");
};

const getPageLayoutPath = (
  routePath: string,
  layouts: { [key in string]: string }
) => {
  const paths = routePath.split("/");

  if (paths.length === 1) {
    return layouts[routePath];
  }

  return pipe(
    range(paths.length),
    reverse,
    map((index) => {
      return layouts[paths.slice(0, index + 1).join("/")];
    }),
    compact,
    head
  );
};

const setPageRoute = async (
  app: RuneServer,
  safeImportPage: SafeImportPage,
  routers: string[],
  layouts: { [key in string]: string },
  error: string | null
) => {
  await pipe(
    routers,
    toAsync,
    map(async (router) => {
      const layoutPath = getPageLayoutPath(router, layouts) ?? layouts["/"];

      const route = await safeImportPage(
        `${router === "/" ? "" : router}/index.ts`
      );

      const routeLayout = (await safeImportPage(
        layoutPath
      )) as unknown as RouteLayout;

      if (!routeLayout.Layout) {
        console.warn(`✔ Register Warn: No Layout - ${layoutPath}.`);
        return null;
      }

      if (!routeLayout.getLayoutServerSideProps) {
        console.warn(
          `✔ Register Warn: No getLayoutServerSideProps - ${layoutPath}.`
        );
        return null;
      }

      if (!route.Body) {
        console.warn(`✔ Register Warn: No Body - ${router}.`);
        return null;
      }

      return {
        path: router,
        route,
        layoutPath,
        layout: routeLayout,
      };
    }),
    compact,
    each(({ path, route, layoutPath, layout }) => {
      const routePath = makePath(path);

      console.info(`✔ Registered Route: [GET] ${routePath}`);

      app.get(routePath, async (req, res, next) => {
        try {
          if (route.getServerSideProps) {
            const [serverSideProps, layoutServerSideProps] = await Promise.all([
              route.getServerSideProps({
                request: req,
                response: res,
              }),
              layout.getLayoutServerSideProps({
                request: req,
                response: res,
              }),
            ]);

            if ("redirect" in layoutServerSideProps) {
              return res
                .status(layoutServerSideProps.redirect.permanent ? 308 : 307)
                .redirect(layoutServerSideProps.redirect.destination);
            }

            if ("redirect" in serverSideProps) {
              return res
                .status(serverSideProps.redirect.permanent ? 308 : 307)
                .redirect(serverSideProps.redirect.destination);
            }

            if ("_json" in req.query) {
              res.setHeader("Content-Type", "application/json").json({
                bodyData: serverSideProps.bodyData,
                layoutData: {
                  ...layoutServerSideProps.layoutData,
                  ...serverSideProps?.layoutData,
                },
                sharedData: {
                  ...setSharedData(serverSideProps?.sharedData ?? {})(
                    layoutServerSideProps.sharedData
                  ),
                  routers,
                },
              });
            } else {
              const layoutView = new layout.Layout(
                {
                  ...layoutServerSideProps.layoutData,
                  ...serverSideProps?.layoutData,
                },
                {
                  ...setSharedData(serverSideProps?.sharedData ?? {})(
                    layoutServerSideProps.sharedData
                  ),
                  routers,
                },
                {
                  bodyData: serverSideProps.bodyData,
                  path,
                  layoutPath,
                }
              );
              const bodyView = new route.Body(serverSideProps.bodyData);
              layoutView.key = path;
              bodyView.key = path;
              layoutView.setBody(bodyView);
              res
                .setHeader("Content-Type", "text/html")
                .send(layoutView.renderServerSide());
            }
          } else {
            const layoutServerSideProps = await layout.getLayoutServerSideProps(
              {
                request: req,
                response: res,
              }
            );

            if ("redirect" in layoutServerSideProps) {
              return res
                .status(layoutServerSideProps.redirect.permanent ? 308 : 307)
                .redirect(layoutServerSideProps.redirect.destination);
            }

            const layoutView = new layout.Layout(
              layoutServerSideProps.layoutData,
              {
                ...layoutServerSideProps.sharedData,
                routers,
              },
              {
                bodyData: {},
                path,
                layoutPath,
              }
            );

            const bodyView = new route.Body({});
            layoutView.key = path;
            bodyView.key = path;
            layoutView.setBody(bodyView);
            res
              .setHeader("Content-Type", "text/html")
              .send(layoutView.renderServerSide());
          }
        } catch (e) {
          console.error(
            new Error(`Server Render Error: ${routePath}`, { cause: e })
          );
          next(e);
        }
      });
    })
  );

  app.use((_req, _res, next) => {
    next(new NotFoundException());
  });
};

const getRouters = (root_path: string, extra_path: string = "") => {
  const full_path = `${root_path}/pages${extra_path}`;
  const pages = fs.readdirSync(full_path);

  const routers: string[] = [];

  const [routes, folders] = pipe(
    pages,
    map((page) => {
      const [name, ...ext] = page.split(".");
      return {
        name,
        ext: ext.join("."),
      };
    }),
    filter((file) => (file.name === "index" && file.ext === "ts") || !file.ext),
    partition((page) => !!page.ext)
  );

  if (folders.length > 0) {
    pipe(
      folders,
      sortBy((folder) => folder.name.includes("[")),
      each((folder) => {
        const _routers = getRouters(root_path, `${extra_path}/${folder.name}`);
        routers.push(..._routers);
      })
    );
  }

  if (routes.length > 0) {
    if (extra_path === "") {
      routers.push("/");
    } else {
      routers.push(extra_path);
    }
  }

  return routers;
};

const getLayouts = (root_path: string, extra_path: string = "") => {
  const full_path = `${root_path}/pages${extra_path}`;
  const pages = fs.readdirSync(full_path);

  const layouts: { [key in string]: string } = {};

  const [_layouts, folders] = pipe(
    pages,
    map((page) => {
      const [name, ...ext] = page.split(".");
      return {
        name,
        ext: ext.join("."),
      };
    }),
    filter(
      (file) => (file.name === "layout" && file.ext === "ts") || !file.ext
    ),
    partition((page) => !!page.ext)
  );

  if (folders.length > 0) {
    pipe(
      folders,
      each((folder) => {
        const _layouts = getLayouts(root_path, `${extra_path}/${folder.name}`);
        if (Object.keys(_layouts).length > 0) {
          Object.assign(layouts, _layouts);
        }
      })
    );
  }

  if (_layouts.length > 0) {
    if (extra_path === "") {
      layouts["/"] = "/layout.ts";
    } else {
      layouts[extra_path] = `${extra_path}/layout.ts`;
    }
  }

  return layouts;
};

const getError = (root_path: string) => {
  const full_path = `${root_path}/pages`;
  const errors = fs.readdirSync(full_path);

  const [error] = pipe(
    errors,
    map((page) => {
      const [name, ...ext] = page.split(".");
      return {
        name,
        ext: ext.join("."),
      };
    }),
    filter((file) => file.name === "error" && file.ext === "ts")
  );

  if (isNil(error)) {
    return null;
  }

  return `/${error.name}.${error.ext}`;
};

export const initPageRoute = async (
  app: RuneServer,
  safeImportPage: SafeImportPage
): Promise<ErrorRequestHandler> => {
  const root_path = "./src";

  const routers = getRouters(root_path);
  const layouts = getLayouts(root_path);
  const error = getError(root_path);

  if (Object.keys(layouts).length === 0) {
    throw new Error("- Register Error: No Layout");
  }

  if (!layouts["/"]) {
    throw new Error("- Register Error: No Base Layout");
  }

  if (!error) {
    console.warn("- Register Warn: No Error Handler");
  }

  await setPageRoute(app, safeImportPage, routers, layouts, error);

  return getErrorHandler(safeImportPage, routers, error);
};
