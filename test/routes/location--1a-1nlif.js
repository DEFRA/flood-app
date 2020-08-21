'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()
const data = require('../data')

lab.experiment('Routes test - location - 1 alert 1 nlif', () => {
  let sandbox
  let server

  // Use a Sinon sandbox to manage spies, stubs and mocks for each test.
  lab.beforeEach(async () => {
    delete require.cache[require.resolve('../../server/util.js')]
    delete require.cache[require.resolve('../../server/services/location.js')]
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/routes/location.js')]
    sandbox = await sinon.createSandbox()
    server = Hapi.server({
      port: 3000,
      host: 'localhost'
    })
  })

  lab.afterEach(async () => {
    await server.stop()
    await sandbox.restore()
  })

  lab.test('GET /location with query parameters check for 1 alert 1 nlif', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: true }
    }

    const fakeFloodsData = () => {
      return {
        floods: [
          {
            ta_code: '053WAF117BED',
            ta_id: 180379,
            ta_name: 'Barlings Eau and Duckpool Catchwater',
            quick_dial: '207012',
            severity_value: 1,
            severitydescription: 'Flood Alert',
            message_received: '2020-01-06T11:58:00.000Z',
            severity_changed: '2019-11-07T15:43:00.000Z',
            situation_changed: '2020-01-06T11:58:00.000Z',
            situation: 'River levels remain high.  Heavy rain is forecast for Wednesay 8th and Thursday 9th January and we continue to monitor the situation. Environment Agency contractors have repaired the breached banks at Short Ferry. However, Short Ferry road will remain closed for several weeks until the water has been pumped back into the river.  The pumps are operating again now that river levels have fallen sufficiently.  Do not walk on flood banks and please avoid using low lying footpaths near local watercourses, which may be flooded. We are monitoring river levels and will update this message on Tuesday 7th January, or as the situation changes.'
          }, {
            ta_code: '053WAF117BED',
            ta_id: 180379,
            ta_name: 'Barlings Eau and Duckpool Catchwater',
            quick_dial: '207012',
            severity_value: 4,
            severitydescription: 'No longer in force',
            warningkey: 108229,
            message_received: '2020-01-06T11:58:00.000Z',
            severity_changed: '2019-11-07T15:43:00.000Z',
            situation_changed: '2020-01-06T11:58:00.000Z',
            situation: 'River levels remain high.  Heavy rain is forecast for Wednesay 8th and Thursday 9th January and we continue to monitor the situation. Environment Agency contractors have repaired the breached banks at Short Ferry. However, Short Ferry road will remain closed for several weeks until the water has been pumped back into the river.  The pumps are operating again now that river levels have fallen sufficiently.  Do not walk on flood banks and please avoid using low lying footpaths near local watercourses, which may be flooded. We are monitoring river levels and will update this message on Tuesday 7th January, or as the situation changes.'
          }
        ]
      }
    }
    const fakeStationsData = () => []
    const fakeImpactsData = () => []

    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
    sandbox.stub(floodService, 'getFloodsWithin').callsFake(fakeFloodsData)
    sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
    sandbox.stub(floodService, 'getImpactsWithin').callsFake(fakeImpactsData)
    const fakeGetJson = () => data.warringtonGetJson

    const util = require('../../server/util')
    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const locationPlugin = {
      plugin: {
        name: 'location',
        register: (server, options) => {
          server.route(require('../../server/routes/location'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(locationPlugin)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/location?q=Warrington'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('Some flooding is possible')
    Code.expect(response.payload).to.contain('There is a flood alert in this area')
    Code.expect(response.payload).to.contain('The flood warning for <a href="/target-area/053WAF117BED">Barlings Eau and Duckpool Catchwater</a> was removed')
  })
  lab.test('GET /location query not in England', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: false }
    }

    const fakeFloodsData = () => []
    const fakeStationsData = () => []
    const fakeImpactsData = () => []

    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
    sandbox.stub(floodService, 'getFloodsWithin').callsFake(fakeFloodsData)
    sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
    sandbox.stub(floodService, 'getImpactsWithin').callsFake(fakeImpactsData)
    const fakeGetJson = () => data.scotlandGetJson

    const util = require('../../server/util')
    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const locationPlugin = {
      plugin: {
        name: 'location',
        register: (server, options) => {
          server.route(require('../../server/routes/location'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(locationPlugin)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/location?q=Warrington'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('This service covers England only')
  })
})
