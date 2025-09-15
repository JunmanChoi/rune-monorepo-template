import { Router } from "express";
import { registerMarppleRoutes } from "../routes";

export const router: Router = Router();
router.use(registerMarppleRoutes());
