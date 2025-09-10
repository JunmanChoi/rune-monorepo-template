/**
 * @type {import('@rune-ts/server').RuneConfigType}
 */
module.exports = {
  name: 'docs',
  port: 3000,
  mode: 'render',
  sourcePaths: ['./src'],
  envFiles: ['.env'],
  clientEntry: './src/renderApp/app/client/index.ts',
  serverEntry: './src/main.ts',
  dynamicChunk: true,
  serverDynamicChunk: true,
  processReload: true,
  showBundleAnalyzer: false,
  publicPath: '/public/',
};
