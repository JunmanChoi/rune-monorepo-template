import { app } from "@rune-ts/server";
import { registerMarppleRoutes } from "./routes";

const appRouter = app();
appRouter.use(registerMarppleRoutes());
