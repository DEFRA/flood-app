const floodServices = require('./flood')
const webchatServices = require('./webchat')
const config = require('../config')

const cacheType = config.localCache ? undefined : 'redis_cache'

const seconds = secs => secs * 1000
const minutes = min => seconds(min * 60)
const tenSecondTimeout = () => seconds(10)

const expiresIn15 = 15
const floodGetOutlookGenerateTimeout = 30
const floodGetStationsGeoJsonGenerateTimeout = 30

// Cache method wrapper for hapi server
// If we have any service calls we want to store in elasticache (in memory cache if localCache)
// add them to the server.method with appropriate cache settings
// Anything to do with flood data needs a maximum of 1 minute cache age
// Anything to do with telemetry needs a maximum of expiresIn minute cache age

module.exports = server => {
  server.method('flood.getFloods', floodServices.getFloods, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: tenSecondTimeout()
    }
  })

  server.method('flood.getFloodsWithin', floodServices.getFloodsWithin, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: tenSecondTimeout()
    },
    generateKey: array => array.join(',') // functions with array or object var need a non default key
  })

  server.method('flood.getFloodArea', floodServices.getFloodArea, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(expiresIn15),
      generateTimeout: tenSecondTimeout()
    }
  })

  server.method('flood.getOutlook', floodServices.getOutlook, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(expiresIn15),
      generateTimeout: seconds(floodGetOutlookGenerateTimeout)
    }
  })

  server.method('flood.getStationById', floodServices.getStationById, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(expiresIn15),
      generateTimeout: tenSecondTimeout()
    }
  })

  server.method('flood.getForecastFlag', floodServices.getForecastFlag, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: tenSecondTimeout()
    }
  })

  server.method('flood.getStations', floodServices.getStations, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: tenSecondTimeout()
    }
  })

  server.method('flood.getRiversByName', floodServices.getRiversByName, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: tenSecondTimeout()
    }
  })

  server.method('flood.getStationsWithin', floodServices.getStationsWithin, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: tenSecondTimeout()
    },
    generateKey: array => array.join(',') // functions with array or object var need a non default key
  })

  server.method('flood.getStationsWithinTargetArea', floodServices.getStationsWithinTargetArea, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: tenSecondTimeout()
    }
  })

  server.method('flood.getWarningsAlertsWithinStationBuffer', floodServices.getWarningsAlertsWithinStationBuffer, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: tenSecondTimeout()
    }
  })

  server.method('flood.getRiverById', floodServices.getRiverById, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: tenSecondTimeout()
    }
  })

  server.method('flood.getRiverStationByStationId', floodServices.getRiverStationByStationId, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: tenSecondTimeout()
    }
  })

  server.method('flood.getStationTelemetry', floodServices.getStationTelemetry, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: tenSecondTimeout()
    }
  })

  server.method('flood.getStationImtdThresholds', floodServices.getStationImtdThresholds, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: tenSecondTimeout()
    }
  })

  server.method('flood.getTargetAreaThresholds', floodServices.getTargetAreaThresholds, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: tenSecondTimeout()
    }
  })

  server.method('flood.getStationForecastData', floodServices.getStationForecastData, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: tenSecondTimeout()
    }
  })

  server.method('flood.getStationsGeoJson', floodServices.getStationsGeoJson, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(expiresIn15),
      generateTimeout: seconds(floodGetStationsGeoJsonGenerateTimeout)
    }
  })

  server.method('flood.getRainfallGeojson', floodServices.getRainfallGeojson, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(expiresIn15),
      generateTimeout: seconds(30)
    }
  })

  server.method('flood.getIsEngland', floodServices.getIsEngland, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: tenSecondTimeout()
    }
  })

  server.method('flood.getImpactData', floodServices.getImpactData, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: tenSecondTimeout()
    }
  })

  server.method('flood.getImpactsWithin', floodServices.getImpactsWithin, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: tenSecondTimeout()
    },
    generateKey: array => array.join(',') // functions with array or object var need a non default key
  })

  server.method('flood.getRivers', floodServices.getRivers, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: tenSecondTimeout()
    }
  })

  server.method('flood.getStationsOverview', floodServices.getStationsOverview, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: tenSecondTimeout()
    }
  })

  server.method('flood.getTargetArea', floodServices.getTargetArea, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: tenSecondTimeout()
    }
  })

  server.method('flood.getStationsByRadius', floodServices.getStationsByRadius, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: tenSecondTimeout()
    }
  })

  server.method('flood.getRainfallStationTelemetry', floodServices.getRainfallStationTelemetry, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: tenSecondTimeout()
    }
  })

  server.method('flood.getRainfallStation', floodServices.getRainfallStation, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: tenSecondTimeout()
    }
  })

  server.method('webchat.getAvailability', webchatServices.getAvailability, {
    cache: {
      cache: cacheType,
      expiresIn: 1 * 60 * 1000, // 1 minute
      generateTimeout: tenSecondTimeout() // 10 seconds
    }
  })
}
