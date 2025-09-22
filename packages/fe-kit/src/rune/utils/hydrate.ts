import type { Page } from "@man/fe-kit/src/rune/Page";
import type { SafeImportPage } from "@man/fe-kit/src/rune/utils/safeImport";
import { HydratedEvent } from "@rune-ts/server";
import { $ } from "rune-ts";

export const getInitialData = () => {
  const script = document.querySelector(
    'script.__RUNE_DATA__[data-rune-base-name="Page"]'
  );
  if (!script) {
    throw new Error("No __RUNE_DATA__ script found");
  }

  const props = JSON.parse(script.textContent!);
  const el = $(script)?.prev("[data-rune]")?.element();

  if (!el) {
    throw new Error("No RUNE VIEW found");
  }

  script.remove();
  return { props, el };
};

export const hydrate = async (safeImportPage: SafeImportPage) => {
  const initialData = getInitialData();
  const context = initialData.props.args[0];
  const [{ Body }, { Layout }] = await Promise.all([
    safeImportPage(context.path),
    safeImportPage(context.layoutPath) as unknown as Promise<{
      Layout: typeof Page;
    }>,
  ]);

  const layout = new Layout(
    initialData.props.data,
    initialData.props.sharedData
  );
  const body = new Body(context.bodyData);

  layout.key = initialData.props.key;
  body.key = initialData.props.key;
  layout.setBody(body);

  layout
    .hydrateFromSSR(initialData.el)
    .dispatchEvent(HydratedEvent, { detail: layout });

  return layout;
};
