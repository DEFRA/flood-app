const config = require('../../config')
const uri = config.geoserverUrl + '/geoserver/flood/ows'

const getTargetAreaCodeFromReferrer = (referrer = '') => {
  const match = referrer.match(/\/target-area\/([^/?#]+)/i)
  return match ? decodeURIComponent(match[1]) : null
}

module.exports = {
  method: 'GET',
  path: '/api/ows',
  handler: {
    proxy: {
      mapUri: function (request) {
        const url = uri + request.url.search
        const typename = (request.query.typename || '').toLowerCase()

        // Temporary diagnostics to identify which target-area pages trigger this OWS call.
        if (typename === 'flood:flood_warning_alert') {
          const referrer = request.headers.referer || request.headers.referrer || ''
          const taCode = getTargetAreaCodeFromReferrer(referrer) || 'unknown'

          request.logger.warn({
            taCode,
            referrer,
            endpoint: '/api/ows',
            typename
          }, 'Target area OWS request')
        }

        return { uri: url }
      },
      passThrough: true
    }
  },
  options: {
    description: 'Proxy requests bound for Geoserver'
  }
}
