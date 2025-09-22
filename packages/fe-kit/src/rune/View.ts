import { View as RuneView } from "rune-ts";

export class View<T extends object = object> extends RuneView<T> {
  private _mountCount = 0;

  get mountCount() {
    return this._mountCount;
  }

  protected _onMount(): this {
    this._mountCount++;
    this.onMount();
    return this;
  }

  setParentView(parentView: RuneView) {
    this.parentView = parentView;
    this.element().setAttribute("data-rune-parent", parentView.toString());
    return this;
  }
}
