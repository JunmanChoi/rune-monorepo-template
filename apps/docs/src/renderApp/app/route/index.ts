import { createRouter } from "@rune-ts/server";
import { homeRouter } from "../../pages/home/home.route";

export const ClientRouter = createRouter({
  ...homeRouter,
});
