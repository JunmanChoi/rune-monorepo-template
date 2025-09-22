import type {
  SharedData,
  SharedDataSystem,
} from "@man/fe-kit/src/rune/SharedData";
import { getManifest } from "@rune-ts/server";
import { type Html, html, type UnsafeHtml } from "rune-ts";

import {
  createJsEntryTag,
  createStyleSheetTag,
  htmlMap,
} from "./utils/document";

// @rune-ts/server entry point -> 라이브러리에서 빼지 않아 임시로 사용
const STYLE_SHEET_FILES = [
  "vendors.css",
  "common.css",
  "main.css",
  "packages.css",
];
const JS_FILES = [
  "common.js",
  "main.js",
  "packages.js",
  "vendors.js",
  "runtime.js",
];

export class Document {
  constructor(private sharedData: SharedData & SharedDataSystem) {}

  /**
   * Override this method to add attributes to the <html> tag.
   * @returns {Html} Attributes to add to the <html> tag.
   */
  htmlTagAttrs(
    sharedData: SharedData & SharedDataSystem = this.sharedData
  ): Html {
    return html`lang="${sharedData.document.html.lang}"`;
  }

  /**
   * Override this method to add arbitrary tags inside the <head> tag.
   * @returns {Html} Tags to add inside the <head> tag.
   */
  headTags(_sharedData: SharedData & SharedDataSystem = this.sharedData): Html {
    return html``;
  }

  /**
   * Override this method to add attributes to the <html> tag.
   * @returns {Html} Attributes to add to the <html> tag.
   */
  bodyTagAttrs(
    _sharedData: SharedData & SharedDataSystem = this.sharedData
  ): Html {
    return html``;
  }

  /**
   * Override this method to add arbitrary tags inside the <body> tag.
   * @returns {Html} Tags to add inside the <body> tag.
   */
  extraScriptTags(
    _sharedData: SharedData & SharedDataSystem = this.sharedData
  ): Html {
    return html``;
  }

  private getStyleEntry() {
    const manifest = getManifest();
    return htmlMap(STYLE_SHEET_FILES, createStyleSheetTag(manifest));
  }

  private getScriptEntry() {
    const manifest = getManifest();
    return htmlMap(JS_FILES, createJsEntryTag(manifest));
  }

  /**
   * @warning Do not override this method
   */
  template(body: UnsafeHtml): Html {
    return html`<!doctype html>
      <html ${this.htmlTagAttrs(this.sharedData)} data-theme="dark">
        <head>
          ${this.headTags(this.sharedData)}${this.getStyleEntry()}
        </head>
        <body ${this.bodyTagAttrs(this.sharedData)}>
          <div id="root">${body}</div>
          <div id="portal"></div>
          ${this.getScriptEntry()} ${this.extraScriptTags(this.sharedData)}
        </body>
      </html>`;
  }
}
