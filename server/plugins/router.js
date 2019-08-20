const routes = [].concat(
  require('../routes/home'),
  require('../routes/location'),
  require('../routes/national'),
  require('../routes/target-area'),
  require('../routes/station'),
  require('../routes/rain-gauge'),
  require('../routes/levels'),
  require('../routes/warnings'),
  require('../routes/api'),
  require('../routes/roadmap'),
  require('../routes/public')
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server, options) => {
      server.route(routes)
    }
  }
}
