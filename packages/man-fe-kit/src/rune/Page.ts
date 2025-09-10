import { Document } from "@man/fe-kit/src/rune/Document";
import type {
  SharedData,
  SharedDataSystem,
} from "@man/fe-kit/src/rune/SharedData";
import { Page as RunePage, type View } from "rune-ts";

export class Page<T extends object> extends RunePage<T> {
  protected document: Document;
  #view?: View;

  constructor(
    data: T,
    public sharedData: SharedData & SharedDataSystem,
    ...args: any[]
  ) {
    super(data, sharedData, ...args);
    this.document = new Document(this.sharedData);
  }

  setBody(view: View): this {
    this.#view = view;
    return this;
  }

  getBody() {
    if (!this.#view) throw new Error("Unable to find a view");
    return this.#view;
  }

  /**
   * Render the page for server-side rendering.
   *
   * @returns The rendered HTML string.
   */
  public renderServerSide(): string {
    return this.document.template(this.toHtmlSSR()).make(this);
  }
}
