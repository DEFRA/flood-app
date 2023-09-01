const floodServices = require('./flood')
const locationService = require('./location')
const webchatServices = require('./webchat')
const config = require('../config')
const cacheType = config.localCache ? undefined : 'redis_cache'

const seconds = secs => secs * 1000
const minutes = min => seconds(min * 60)

// Cache method wrapper for hapi server
// If we have any service calls we want to store in elasticache (in memory cache if localCache)
// add them to the server.method with appropriate cache settings
// Anything to do with flood data needs a maximum of 1 minute cache age
// Anything to do with telemetry needs a maximum of 15 minute cache age

module.exports = server => {
  server.method('flood.getFloods', floodServices.getFloods, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: seconds(10)
    }
  })

  server.method('flood.getFloodsWithin', floodServices.getFloodsWithin, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: seconds(10)
    },
    generateKey: array => array.join(',') // functions with array or object var need a non default key
  })

  server.method('flood.getFloodArea', floodServices.getFloodArea, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(15),
      generateTimeout: seconds(10)
    }
  })

  server.method('flood.getOutlook', floodServices.getOutlook, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(15),
      generateTimeout: seconds(30)
    }
  })

  server.method('flood.getStationById', floodServices.getStationById, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(15),
      generateTimeout: seconds(10)
    }
  })

  server.method('flood.getStations', floodServices.getStations, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: seconds(10)
    }
  })

  server.method('flood.getRiversByName', floodServices.getRiversByName, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: seconds(10)
    }
  })

  server.method('flood.getStationsWithin', floodServices.getStationsWithin, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: seconds(10)
    },
    generateKey: array => array.join(',') // functions with array or object var need a non default key
  })

  server.method('flood.getStationsWithinTargetArea', floodServices.getStationsWithinTargetArea, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: seconds(10)
    }
  })

  server.method('flood.getWarningsAlertsWithinStationBuffer', floodServices.getWarningsAlertsWithinStationBuffer, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: seconds(10)
    }
  })

  server.method('flood.getRiverById', floodServices.getRiverById, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: seconds(10)
    }
  })

  server.method('flood.getRiverStationByStationId', floodServices.getRiverStationByStationId, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: seconds(10)
    }
  })

  server.method('flood.getStationTelemetry', floodServices.getStationTelemetry, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: seconds(10)
    }
  })

  server.method('flood.getStationForecastThresholds', floodServices.getStationForecastThresholds, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: seconds(10)
    }
  })

  server.method('flood.getStationImtdThresholds', floodServices.getStationImtdThresholds, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: seconds(10)
    }
  })

  server.method('flood.getStationForecastData', floodServices.getStationForecastData, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: seconds(10)
    }
  })

  server.method('flood.getStationsGeoJson', floodServices.getStationsGeoJson, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(15),
      generateTimeout: seconds(30)
    }
  })

  server.method('flood.getRainfallGeojson', floodServices.getRainfallGeojson, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(15),
      generateTimeout: seconds(30)
    }
  })

  server.method('flood.getIsEngland', floodServices.getIsEngland, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: seconds(10)
    }
  })

  server.method('flood.getImpactData', floodServices.getImpactData, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: seconds(10)
    }
  })

  server.method('flood.getImpactsWithin', floodServices.getImpactsWithin, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: seconds(10)
    },
    generateKey: array => array.join(',') // functions with array or object var need a non default key
  })

  server.method('flood.getRivers', floodServices.getRivers, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: seconds(10)
    }
  })

  server.method('flood.getStationsOverview', floodServices.getStationsOverview, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: seconds(10)
    }
  })

  server.method('flood.getTargetArea', floodServices.getTargetArea, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: seconds(10)
    }
  })

  server.method('flood.getStationsByRadius', floodServices.getStationsByRadius, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: seconds(10)
    }
  })

  server.method('flood.getRainfallStationTelemetry', floodServices.getRainfallStationTelemetry, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: seconds(10)
    }
  })

  server.method('flood.getRainfallStation', floodServices.getRainfallStation, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(1),
      generateTimeout: seconds(10)
    }
  })

  server.method('location.find', locationService.find, {
    cache: {
      cache: cacheType,
      expiresIn: minutes(15),
      generateTimeout: seconds(10)
    }
  })

  server.method('webchat.getAvailability', webchatServices.getAvailability, {
    cache: {
      cache: cacheType,
      expiresIn: 1 * 60 * 1000, // 1 minute
      generateTimeout: 10 * 1000 // 10 seconds
    }
  })
}
