const config = require('../../config')
const uri = config.geoserverUrl + '/geoserver/flood/ows'

module.exports = {
  method: 'GET',
  path: '/api/ows',
  handler: {
    proxy: {
      mapUri: function (request) {
        const url = uri + request.url.search
        return { uri: url }
      },
      passThrough: true
    }
  },
  options: {
    description: 'Proxy requests bound for Geoserver'
  }
}
