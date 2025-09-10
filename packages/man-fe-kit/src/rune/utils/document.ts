import { entries, map, pipe, reduce } from "@fxts/core";
import { html, type Html } from "rune-ts";

const addHtml = (pre: string | Html, val: string | Html) => html`${pre}${val}`;

export const htmlMap = <T>(
  iter: IterableIterator<T> | Generator<T> | T[],
  fn: (val: T) => Html
): Html => {
  return pipe(
    iter,
    map((v) => fn(v)),
    reduce(addHtml)
  );
};

export const createTags = <T extends Record<string, any>>(
  tag_data: T[],
  makeTagFunction: (entry: ReturnType<typeof entries<T>>) => Html
) => {
  return pipe(
    tag_data,
    map((meta_tag) => makeTagFunction(entries(meta_tag))),
    reduce(addHtml)
  );
};

export const createStyleSheetTag =
  (manifest?: Record<string, string>) =>
  (style_sheet: string): Html => {
    manifest = manifest ?? {};
    const file = manifest[style_sheet];
    return file
      ? html`<link rel="stylesheet" href="${manifest[style_sheet]}" />`
      : html``;
  };

export const createJsEntryTag =
  (manifest?: Record<string, string>) =>
  (js_file_name: string): Html => {
    manifest = manifest ?? {};
    const file = manifest[js_file_name];
    return file
      ? html`<script
          crossorigin="anonymous"
          src="${manifest[js_file_name]}"
        ></script>`
      : html``;
  };
