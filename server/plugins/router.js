const routes = [].concat(
  require('../routes/home'),
  require('../routes/location'),
  require('../routes/national'),
  require('../routes/outlook'),
  require('../routes/target-area'),
  require('../routes/station'),
  require('../routes/api'),
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
