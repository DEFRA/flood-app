const locationService = require('../../server/services/location')
const find = require('./find.json')
const mock = require('../../test/mock')

/**
 * Override the real functions with mock implementations
 */
locationService.find = mock.makePromise(null, find)
