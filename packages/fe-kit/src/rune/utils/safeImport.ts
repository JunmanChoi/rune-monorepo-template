import type { PageRoute } from "@man/fe-kit/src/rune/utils/type";

const safeImportPageMap = new Map<string, PageRoute>();

export type SafeImportPage = <T extends PageRoute = PageRoute>(
  path: string
) => Promise<T> | T;

export const createPageLoader = <T extends PageRoute = PageRoute>(
  importFn: (path: string) => Promise<T>
): SafeImportPage => {
  return async <T extends PageRoute = PageRoute>(path: string): Promise<T> => {
    const page = safeImportPageMap.get(path);

    if (page) {
      return <T>page;
    }

    const _page = <T>(<unknown>await importFn(path));

    safeImportPageMap.set(path, _page);

    return _page;
  };
};
