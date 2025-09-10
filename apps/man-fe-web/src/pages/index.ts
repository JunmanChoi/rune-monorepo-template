import type { GetServerSideProps } from "@man/fe-kit/rune/utils/type";
import { View } from "@man/fe-kit/rune/View";
import css from "@man/fe-web/src/pages/Main.module.scss";
import { html } from "rune-ts";

export const getServerSideProps: GetServerSideProps<{ title: string }> = (
  _context
) => {
  return {
    bodyData: {
      title: "MAIN",
    },
  };
};

export class Body extends View<{ title: string }> {
  override template() {
    return html`
      <div class="${css.body}">
        <h1>${this.data.title}</h1>
      </div>
    `;
  }
}
