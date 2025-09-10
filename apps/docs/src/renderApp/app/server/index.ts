import { Router } from "express";
import { homeHandler } from "../../pages/home/home.render";
import { ClientRouter } from "../route";

export const render_router: Router = Router();

const routers = {
  defaultRouter: render_router,
};

// 홈 화면
routers.defaultRouter.get("/", homeHandler(ClientRouter["/"]));
