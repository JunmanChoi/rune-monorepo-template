import { app } from "@rune-ts/server";
import { render_router } from "./renderApp/app/server";

export function bootstrap() {
  const application = app();

  application.use(render_router);

  console.log(process.env.DB);
}

bootstrap();
