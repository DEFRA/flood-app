const routes = [].concat(
  require('../routes/home'),
  require('../routes/location'),
  require('../routes/national'),
  require('../routes/target-area'),
  require('../routes/station'),
  require('../routes/rain-gauge'),
  require('../routes/roadmap'),
  require('../routes/public'),
  require('../routes/api/stations.geojson'),
  require('../routes/api/warnings.geojson'),
  require('../routes/api/stations-upstream-downstream'),
  require('../routes/api/ows'),
  require('../routes/api/rainfall'),
  require('../routes/api/impacts'),
  require('../routes/start-page'),
  require('../routes/sms-auto-opt-in-info'),
  require('../routes/what-to-do-in-a-flood'),
  require('../routes/plan-ahead-for-flooding'),
  require('../routes/what-happens-after-a-flood'),
  require('../routes/recovering-after-a-flood'),
  require('../routes/warnings'),
  require('../routes/levels'),
  require('../routes/impacts'),
  require('../routes/cookies'),
  require('../routes/terms-and-conditions'),
  require('../routes/privacy-notice'),
  require('../routes/privacy-policy')
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server, options) => {
      server.route(routes)
    }
  }
}
