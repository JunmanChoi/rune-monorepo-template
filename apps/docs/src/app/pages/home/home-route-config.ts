import type { MarppleRouteConfig } from "../../routes/types";

export const homeRouteConfig: MarppleRouteConfig = {
  path: "/",
  fetcher: async (req, res) => {
    // Fetch data for the home page
    // const data = await fetchHomePageData();
    return {
      data: {
        theme: "dark",
      },
      sharedData: {},
    };
  },
  render_options: {
    title: "Home",
    description: "Welcome to the home page",
  },
};
