import { MetaView } from "@rune-ts/server";
import type { Request, Response } from "express";
import { Page, type View } from "rune-ts";
import type { Renderer } from "./renderer";
import type { CommonRenderOptions } from "./types";

export class CommonRenderer implements Renderer<CommonRenderOptions> {
  readonly rendererType = "common" as const;
  async render(
    _req: Request,
    res: Response,
    {
      view,
      render_options,
    }: {
      view: View;
      render_options: CommonRenderOptions;
    }
  ) {
    if (view instanceof Page === false) {
      throw new Error(
        `렌더하고자 하는 대상이 Page 클래스가 아닙니다. ${view.toString()}`
      );
    }
    const pageView = new MetaView(view, {
      head: {
        title: render_options.title,
        description: render_options.description,
        open_graph_tags: render_options.open_graph_tags ?? [
          {
            property: "type",
            content: "website",
            image:
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvCJVCf3NQ3GBqpiSG37Bc1b8r23euAI_a3A&s",
            url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvCJVCf3NQ3GBqpiSG37Bc1b8r23euAI_a3A&s",
          },
        ],
        // meta_tags: render_options.meta_tags ?? [],
        // link_tags: render_options.link_tags ?? [],
      },
      body: {
        // scripts: render_options.scripts ?? [],
      },
    });
    res.send(pageView.toHtml(true));
  }
}
