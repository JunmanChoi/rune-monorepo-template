import { type Html, html } from "rune-ts";
import styles from "./main-layout.module.scss";

function mainLayout(children: Html) {
  return html`<div class="${styles.mainLayout}">${children}</div>`;
}

export { mainLayout };
