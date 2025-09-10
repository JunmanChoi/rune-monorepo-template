import { createPageLoader } from "@man/fe-kit/rune/utils/safeImport";

export const safeImportPage = createPageLoader(
  (path) => import(`@man/fe-web/src/pages${path}`)
);
