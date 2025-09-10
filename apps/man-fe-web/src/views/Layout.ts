import { Document } from "@man/fe-kit/rune/Document";
import { Page } from "@man/fe-kit/rune/Page";
import css from "@man/fe-web/src/views/Layout.module.scss";
import { html } from "rune-ts";

export type TLayoutData = {};

export class Layout<T extends TLayoutData = TLayoutData> extends Page<T> {
  protected document = new Document(this.sharedData);

  protected template() {
    return html` <section class="${css.layout}">
      <header class="${css.header}">
        <div class=${css.quick}>
          <h1>
            <a href="/">
              MAN
            </a>
          </h1>
        </div>
      </header>
      <main class="${css.body}" id="main">${this.getBody()}</main>
    </section>`;
  }
}
