import { app } from "@rune-ts/server";
import { router } from "./app/server";

export function bootstrap() {
  const application = app();

  application.use(router);
}

bootstrap();
