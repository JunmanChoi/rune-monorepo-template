import type { GetErrorServerSideProps } from "@man/fe-kit/rune/utils/type";
import { View } from "@man/fe-kit/rune/View";
import css from "@man/fe-web/src/pages/Error.module.scss";
import type { TLayoutData } from "@man/fe-web/src/views/Layout";
import { html } from "rune-ts";

export { Layout } from "@man/fe-web/src/views/Layout";

export const getErrorServerSideProps: GetErrorServerSideProps<
  {
    error: unknown;
  },
  TLayoutData
> = async ({ request, error }) => {
  return {
    bodyData: { error },
    response: {
      status: (<{ status?: number } | undefined>error)?.status ?? 500,
    },
    layoutData: {},
    sharedData: {
      document: {
        html: { lang: "ko" },
        meta: { title: "man", description: "man" },
      },
      title: "man",
      isMobile: !!request.userAgent?.device?.is("mobile"),
    },
  };
};

export class Body extends View<{ error: unknown }> {
  override template() {
    return html`
      <div class="${css.body}">
        <h1>${this.data.error}</h1>
      </div>
    `;
  }
}
