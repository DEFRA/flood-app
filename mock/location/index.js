const locationService = require('../../server/services/location')
const find = require('./find.json')
const geocode = require('./geocode.json')
const reverseGeocode = require('./reverse-geocode.json')
const mock = require('../../test/mock')

/**
 * Override the real functions with mock implementations
 */
locationService.find = mock.makePromise(null, find)
locationService.geocode = mock.makePromise(null, geocode)
locationService.reverseGeocode = mock.makePromise(null, reverseGeocode)
