import { type Html, html } from "rune-ts";
import { mainLayout } from "../main/main-layout";
import styles from "./app-layout.module.scss";

function appLayout(children: Html) {
  return mainLayout(
    html`<div class="${styles.appLayout}">
      <div class="${styles.app}">${children}</div>
    </div>`
  );
}

export { appLayout };
