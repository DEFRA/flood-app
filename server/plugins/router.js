const routes = [].concat(
  require('../routes/home'),
  require('../routes/location'),
  require('../routes/national'),
  require('../routes/target-area'),
  require('../routes/station'),
  require('../routes/rain-gauge'),
  require('../routes/api'),
  require('../routes/roadmap'),
  require('../routes/public'),
  require('../routes/api/stations.geojson'),
  require('../routes/api/warnings.geojson'),
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
  require('../routes/privacy-notice')
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server, options) => {
      server.route(routes)
    }
  }
}
