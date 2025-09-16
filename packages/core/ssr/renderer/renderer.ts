import type { Request, Response } from "express";
import type { View } from "rune-ts";
import type { RenderOptions } from "./types.js";

export interface Renderer<TOptions extends RenderOptions = RenderOptions> {
  readonly rendererType: string; // 렌더러 타입 식별자
  render(
    req: Request,
    res: Response,
    {
      view,
      render_options,
    }: {
      view: View;
      render_options: TOptions;
    }
  ): Promise<void>;
}
