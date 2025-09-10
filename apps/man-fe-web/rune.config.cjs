const path = require("path");
const {
  setClientConfig,
  setServerConfig,
} = require("@man/fe-kit/plugins/build-config");

/**
 * @type {import('@rune-ts/server').RuneConfigType}
 */
module.exports = {
  name: process.env.npm_package_name,
  mode: "render",
  serverEntry: "./src/apps/server/index.ts",
  clientEntry: "./src/apps/client/index.ts",
  sassOptions: {
    api: "modern-compiler",
    sourceMap: true,
  },
  processReload: true,
  serverDynamicChunk: false,
  clientWebpackFinal: setClientConfig({
    project: "man-fe-web-client",
    alias: {
      "@man/fe-web/src": path.resolve(__dirname, "src"),
    },
  }),
  serverWebpackFinal: setServerConfig({
    project: "man-fe-web-server",
    alias: {
      "@man/fe-web/src": path.resolve(__dirname, "src"),
    },
  }),
};
