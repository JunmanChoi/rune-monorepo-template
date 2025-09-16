/**
 * @type {import('@rune-ts/server').RuneConfigType}
 */
module.exports = {
  name: 'docs',
  port: 3000,
  mode: 'render',
  sourcePaths: ['./src'],
  envFiles: ['.env'],
  clientEntry: './src/app/client.ts',
  serverEntry: './src/app/server.ts',
  dynamicChunk: true,
  serverDynamicChunk: true,
  processReload: true,
  showBundleAnalyzer: false,
  publicPath: '/public/',
  internalModules:[
    /@repo\/ui/,
    /@core\/ssr/
  ]
};
