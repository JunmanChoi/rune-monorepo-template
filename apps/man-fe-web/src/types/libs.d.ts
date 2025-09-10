import "express";
import "@man/fe-kit/rune/SharedData";

import type { IResult } from "ua-parser-js";

declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.gif";
declare module "*.webp";
declare module "*.svg";
declare module "*.ico";

declare module "express" {
  interface Request {
    // UserAgentMiddleware 를 타면서 만들어지는 값
    userAgent?: IResult;
  }

  interface Response {
    locals: {
      isFirstStack?: boolean;
      isLnbFolded?: string;
    };
  }
}

declare module "@man/fe-kit/rune/SharedData" {
  interface SharedData {
    document: {
      html: { lang: string; "data-is-mobile": "true" | "false" };
      meta: { title: string; description: string };
    };
    title: string;
    studioBaseUrl?: string;
  }
}
