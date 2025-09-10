import type { NextFunction, Request, Response } from "express";
import { UAParser } from "ua-parser-js";

export const UserAgentMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  req.userAgent = UAParser(req.headers["user-agent"]);

  next();
};
