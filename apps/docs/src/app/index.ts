import { createRouter, hydrate } from "@rune-ts/server";
import { routeMap } from "./routes/constants";
import type { MarppleRoute } from "./routes/types";
export const marpplePageRouter = createRouter<MarppleRoute>({
  ...routeMap,
});
hydrate(marpplePageRouter);
