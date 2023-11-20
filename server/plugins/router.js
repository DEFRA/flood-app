'use strict'

const getAvailability = require('@defra/flood-webchat/dist/server')

const webchat = [{
  method: 'GET',
  path: '/webchat-availability',
  handler: async () => {
    const response = await getAvailability({
      clientId: process.env.CXONE_CLIENT_ID,
      clientSecret: process.env.CXONE_CLIENT_SECRET,
      accessKey: process.env.CXONE_ACCESS_KEY,
      accessSecret: process.env.CXONE_ACCESS_SECRET,
      skillEndpoint: process.env.CXONE_SKILL_ENDPOINT,
      hoursEndpoint: process.env.CXONE_HOURS_ENDPOINT,
      maxQueueCount: process.env.CXONE_MAX_QUEUE_COUNT
    })
    return response
  }
}]

const routes = [].concat(
  webchat,
  require('../routes/find-location'),
  require('../routes/location'),
  require('../routes/national'),
  require('../routes/target-area'),
  require('../routes/station'),
  require('../routes/public'),
  require('../routes/api/stations.geojson'),
  require('../routes/api/rainfall.geojson'),
  require('../routes/api/warnings.geojson'),
  require('../routes/api/warnings'),
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
  require('../routes/accessibility-statement'),
  require('../routes/rainfall-station'),
  require('../routes/rainfall-station-csv')
)

if (process.env.WEBCHAT_ENABLED === 'true') {
  routes.push(require('../routes/api/webchat-availability'))
}

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
