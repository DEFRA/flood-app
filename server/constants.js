module.exports = {
  HTTP_BAD_REQUEST: 400,
  HTTP_NOT_FOUND: 404,
  HTTP_TOO_MANY_REQUESTS: 429,
  HTTP_INTERNAL_SERVER_ERROR: 500,

  rainfall: {
    telemetryDaysAgo: 5,
    valueDuration15: 15,
    valueDuration45: 45,
    batchDataMinutes: 15,
    batchDataDateTimeMinutesToAdd: 45,
    lastDataRefreshProblemMax: 6,
    lastDataRefreshOfflineMin: 5,
    lastDataRefreshOfflineMax: 31,
    lastDataRefreshClosedMin: 30
  },
  station: {
    bannerIconId3: 3,
    outOfDateMax: 5,
    dataStartDateTimeDaysToSubtract: 5
  },
  stationCsv: {
    maxId: 999,
    truncateDateHoursToAdd: 36
  },
  rainfallStationCsv: {
    valueDuration15: 15,
    valueDuration45: 45
  },
  riverAndSeaLevels: {
    distanceInMiles: 1609.344,
    joiValidationQMax: 200,
    joiValidationGroupMax: 11,
    joiValidationSearchTypeMax: 11
  },
  serverMethods: {
    expiresIn: 15,
    floodGetOutlookGenerateTimeout: 30,
    floodGetStationsGeoJsonGenerateTimeout: 30
  },
  utils: {
    rainfallTelemetryPadOutIntervals15: 15,
    rainfallTelemetryPadOutIntervals480: 480,
    rainfallTelemetryPadOutIntervals120: 120
  }
}
