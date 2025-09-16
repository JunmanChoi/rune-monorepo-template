import { Counter } from "@repo/ui";
import { html, on, Page } from "rune-ts";

interface HomePageParams {
  theme?: "light" | "dark";
}

export class HomePage extends Page<HomePageParams> {
  private counter = new Counter({
    initialValue: 0,
    step: 1,
    onChange: (value) => {
      console.log("Counter value changed:", value);
    },
  });
  template() {
    return html /*html*/`
    <div style="padding: 20px; ${this.data.theme === "dark" ? "background-color: #333; color: white;" : ""}">
      <h1>Welcome to the Home Page</h1>
      <p>This is a simple home page with ${this.data.theme || "no"} theme.</p>
      <button id='toggle'>Click Me To Change Theme</button>
      <div style="margin-top: 20px;">
        ${this.counter}
      </div>  
    </div>`;
  }

  @on("click", "#toggle")
  toggleTheme() {
    console.log("Toggle theme clicked");
    const newTheme = this.data.theme === "dark" ? "light" : "dark";
    this.data.theme = newTheme;
    this.redraw();
  }
}
