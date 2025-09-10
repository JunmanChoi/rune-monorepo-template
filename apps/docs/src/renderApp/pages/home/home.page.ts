import { type Html, html, Page } from "rune-ts";
import { appLayout } from "../../shared/layouts/app/app-layout";
import klass from "./home.module.scss";

export class HomePage extends Page<object> {
  protected override template(): Html {
    return appLayout(html`
      <div class="${klass.page}">
        <h1>안뇽~</h1>
        <div class="${klass.banner}">
          <video
            autoplay
            loop
            src="https://images.deepai.org/gallery-item/6377f7f82da141a2bf38bd8590d4ec82/e655b06c00274554be693fd4f60e131ef92fe8d07c_lyLbCWa.mp4"
          />
        </div>
      </div>
    `);
  }
}
