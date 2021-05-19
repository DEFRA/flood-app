const path = require('path')
const env = process.env.NODE_ENV
const inDev = env === 'dev' || env === 'development'
module.exports = (env, argv) => ({
  mode: !inDev ? 'production' : 'development',
  devtool: !inDev ? false : 'source-map',
  entry: {
    core: './server/src/js/core',
    'alerts-and-warnings': './server/src/js/pages/alerts-and-warnings',
    impacts: './server/src/js/pages/impacts',
    national: './server/src/js/pages/national',
    'river-and-sea-levels': './server/src/js/pages/river-and-sea-levels',
    station: './server/src/js/pages/station',
    'stations-overview': './server/src/js/pages/stations-overview',
    'target-area': './server/src/js/pages/target-area',
    location: './server/src/js/pages/location',
    'find-location': './server/src/js/pages/find-location'
  },
  output: {
    path: path.resolve(__dirname, 'server/dist/js')
  },
  module: {
    rules: [
      {
        // Default exclude removes all node_modules but d3 is now distributed es6 so include d3 (& our own src) in transpile
        include: mPath => mPath.indexOf('server/src') > -1 || mPath.indexOf('node_modules/d3') > -1,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  useBuiltIns: 'usage',
                  corejs: 2
                }
              ]
            ]
          }
        }
      }
    ]
  },
  target: ['web', 'es5']
})
