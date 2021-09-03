const routes = [].concat(
  require('../routes/find-location'),
  require('../routes/location'),
  require('../routes/national'),
  require('../routes/target-area'),
  require('../routes/station'),
  require('../routes/public'),
  require('../routes/api/stations.geojson'),
  require('../routes/api/rainfall.geojson'),
  require('../routes/api/warnings.geojson'),
  require('../routes/api/places.geojson'),
  require('../routes/api/ows'),
  require('../routes/api/outlook'),
  require('../routes/start-page'),
  require('../routes/sms-auto-opt-in-info'),
  require('../routes/what-to-do-in-a-flood'),
  require('../routes/plan-ahead-for-flooding'),
  require('../routes/what-happens-after-a-flood'),
  require('../routes/recovering-after-a-flood'),
  require('../routes/alerts-and-warnings'),
  require('../routes/river-and-sea-levels'),
  require('../routes/cookies'),
  require('../routes/terms-and-conditions'),
  require('../routes/privacy-notice'),
  require('../routes/stations-overview'),
  require('../routes/about-levels'),
  require('../routes/error'),
  require('../routes/station-csv'),
  require('../routes/accessibility-statement')
)

// Non production end points
if (process.env.NODE_ENV !== 'production') {
  routes.push(
    require('../routes/status')
  )
}

module.exports = {
  plugin: {
    name: 'router',
    register: server => { server.route(routes) }
  }
}
