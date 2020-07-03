const path = require('path')
module.exports = (env, argv) => ({
  mode: 'development', // 'development' or 'production',
  devtool: 'source-map', // 'source-map' or 'none',
  entry: {
    core: './server/src/js/core',
    'alerts-and-warnings': './server/src/js/pages/alerts-and-warnings',
    impacts: './server/src/js/pages/impacts',
    national: './server/src/js/pages/national',
    'river-and-sea-levels': './server/src/js/pages/river-and-sea-levels',
    station: './server/src/js/pages/station',
    'stations-overview': './server/src/js/pages/stations-overview',
    'target-area': './server/src/js/pages/target-area',
    location: './server/src/js/pages/location'
  },
  output: {
    path: path.resolve(__dirname, 'server/dist/js')
  },
  module: {
    rules: [
      {
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  }
})
