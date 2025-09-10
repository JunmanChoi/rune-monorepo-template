import { hydrate } from "@man/fe-kit/rune/utils/hydrate";
import { safeImportPage } from "@man/fe-web/src/utils/safe-import";

const start = async () => {
  const layout = await hydrate(safeImportPage);

  console.log(layout);
};

start().catch((error) => {
  console.error(error);
});
