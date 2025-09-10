import { MetaView } from "@rune-ts/server";
import type { RenderHandlerType } from "../../shared/types";
import type { HomePage } from "./home.page";

export const homeHandler: RenderHandlerType<typeof HomePage> = (factory) => {
  return async (_, res) => {
    res.send(new MetaView(factory({}), {}).toHtml());
  };
};
