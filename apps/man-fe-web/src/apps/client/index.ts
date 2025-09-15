import { hydrate } from "@man/fe-kit/rune/utils/hydrate";
import { safeImportPage } from "@man/fe-web/src/utils/safe-import";

const start = async () => {
  await hydrate(safeImportPage);
};

start().catch((error) => {
  console.error(error);
});
