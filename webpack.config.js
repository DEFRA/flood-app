const path = require('path')
const env = process.env.NODE_ENV
const inDev = env === 'dev' || env === 'development'
const webpack = require('webpack')

module.exports = (env, argv) => ({
  mode: !inDev ? 'production' : 'development',
  devtool: !inDev ? false : 'source-map',
  entry: {
    core: './server/src/js/core.js',
    utils: './server/src/js/utils.js',
    webchat: './server/src/js/webchat.js',
    chart: './server/src/js/components/chart.js',
    'stations-overview': './server/src/js/pages/stations-overview'
  },
  output: {
    path: path.resolve(__dirname, 'server/dist/js')
  },
  module: {
    rules: [
      {
        // Default exclude removes all node_modules but d3 is now distributed es6 so include d3 (& our own src) in transpile
        include: mPath => mPath.indexOf('server/src') > -1 || mPath.indexOf('node_modules/d3') > -1 || mPath.indexOf('node_modules/internmap') > -1,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  useBuiltIns: 'usage',
                  corejs: 3
                }
              ]
            ]
          }
        }
      }
    ]
  },
  target: ['web', 'es5'],
  plugins: [
    new webpack.DefinePlugin({
      'process.env.GA4_ID': JSON.stringify(process.env.FLOOD_APP_GA4_ID),
      'process.env.GTM_ID': JSON.stringify(process.env.FLOOD_APP_GTM_ID)
    })
  ]
})
