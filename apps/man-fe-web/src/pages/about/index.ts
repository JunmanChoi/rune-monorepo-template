import type { Context, GetServerSideProps } from "@man/fe-kit/rune/utils/type";
import { View } from "@man/fe-kit/rune/View";
import css from "@man/fe-web/src/pages/Main.module.scss";
import { Counter } from "@repo/ui/counter";
import { html } from "rune-ts";

export const getServerSideProps: GetServerSideProps<
  { title: string },
  unknown,
  Context<unknown, { id: string }>
> = (context) => {
  return {
    bodyData: {
      title: context.request.params.id,
    },
  };
};

export class Body extends View<{ title: string }> {
  private apiResult = "<h1>로딩 중... </h1>";
  override template() {
    const counter = new Counter({
      initialValue: 10,
      step: 2,
      onChange: (value) => {
        fetch("http://localhost:4000/", {
          method: "GET",
        }).then((response) => response.text()).then((data) => {
          this.apiResult = data;
          this.redraw();
        });
      },
    });
    return html`
      <div class="${css.body}">

        <h1>${counter}</h1>

        <div class="api-result">
          ${this.apiResult}
        </div>
      </div>
    `;
  }

  override redraw(): this {
    this.element().querySelector(".api-result")!.innerHTML = this.apiResult;
    return this;
  }
}
