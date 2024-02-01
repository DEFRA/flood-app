'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()
const data = require('../data')
const outlookData = require('../data/outlook.json')

lab.experiment('Test - /alerts-warnings', () => {
  let server
  let sandbox
  let stubs

  lab.beforeEach(async () => {
    delete require.cache[require.resolve('../../server/services/server-methods.js')]
    delete require.cache[require.resolve('../../server/routes/alerts-and-warnings.js')]
    delete require.cache[require.resolve('../../server/services/location.js')]
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/util')]

    const floodService = require('../../server/services/flood')
    const util = require('../../server/util')
    sandbox = await sinon.createSandbox()
    stubs = {
      getJson: sandbox.stub(util, 'getJson'),
      getIsEngland: sandbox.stub(floodService, 'getIsEngland'),
      getFloods: sandbox.stub(floodService, 'getFloods'),
      getFloodsWithin: sandbox.stub(floodService, 'getFloodsWithin'),
      getStationsWithin: sandbox.stub(floodService, 'getStationsWithin'),
      getImpactsWithin: sandbox.stub(floodService, 'getImpactsWithin'),
      getStationById: sandbox.stub(floodService, 'getStationById'),
      getOutlook: sandbox.stub(floodService, 'getOutlook'),
      getWarningsAlertsWithinStationBuffer: sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer')
    }
    server = Hapi.server({
      port: 3000,
      host: 'localhost',
      routes: {
        validate: {
          options: {
            abortEarly: false,
            stripUnknown: true
          }
        }
      }
    })
    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(require('../../server/plugins/logging'))
    require('../../server/services/server-methods')(server)
    await server.register({
      plugin: {
        name: 'warnings',
        register: (server, options) => {
          server.route(require('../../server/routes/alerts-and-warnings'))
        }
      }
    })

    await server.initialize()
  })

  lab.afterEach(async () => {
    await sandbox.restore()
    await server.stop()
    delete require.cache[require.resolve('../../server/services/server-methods.js')]
    delete require.cache[require.resolve('../../server/routes/alerts-and-warnings.js')]
    delete require.cache[require.resolve('../../server/services/location.js')]
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/util')]
  })

  lab.test('GET /alerts-and-warnings with query parameters of Warrington and no warnings or alerts', async () => {
    stubs.getJson.callsFake(() => data.warringtonGetJson)
    stubs.getIsEngland.callsFake(() => ({ is_england: true }))
    stubs.getFloodsWithin.callsFake(() => ({ floods: [] }))
    stubs.getStationsWithin.callsFake(() => [])
    stubs.getImpactsWithin.callsFake(() => [])
    const options = {
      method: 'GET',
      url: '/alerts-and-warnings?q=Warrington'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('No alerts or warnings')
  })
  lab.test('GET /alerts-and-warnings TYPO or non location "afdv vdaf adfv  fda" ', async () => {
    stubs.getJson.callsFake(() => data.nonLocationGetJson)

    const options = {
      method: 'GET',
      url: '/alerts-and-warnings?q=wefwe%20we%20fwef%20str'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('No alerts or warnings')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /alerts-and-warnings with query parameters of Kinghorn, Scotland', async () => {
    stubs.getIsEngland.callsFake(() => ({ is_england: false }))
    stubs.getJson.callsFake(() => data.scotlandGetJson)
    const options = {
      method: 'GET',
      url: '/alerts-and-warnings?q=kinghorn'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('If you searched a place in England, you should:')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /alerts-and-warnings with query parameters, show alert, warnings and severe', async () => {
    stubs.getJson.callsFake(() => data.warringtonGetJson)
    stubs.getIsEngland.callsFake(() => ({ is_england: true }))
    stubs.getFloodsWithin.callsFake(() => data.fakeFloodsData)
    stubs.getStationsWithin.callsFake(() => [])
    stubs.getImpactsWithin.callsFake(() => [])
    const options = {
      method: 'GET',
      url: '/alerts-and-warnings?q=Warrington'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('1 flood warning')
    Code.expect(response.payload).to.contain('1 severe flood warning')
    Code.expect(response.payload).to.contain('3 flood alerts')
    Code.expect(response.payload).to.contain('1 flood warning removed')
    Code.expect(response.payload).to.contain('<a href="/target-area/013WAFGL" class="defra-flood-warnings-list-item__title">River Glaze catchment including Leigh and East Wigan</a>')
    Code.expect(response.payload).to.contain('<a href="/target-area/013FWFCH29" class="defra-flood-warnings-list-item__title">Wider area at risk from Sankey Brook at Dallam</a>')
    Code.expect(response.payload).to.contain('<a href="/target-area/013WAFDI" class="defra-flood-warnings-list-item__title">River Ditton catchment including areas around Huyton-with-Roby and Widnes</a>')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /alerts-and-warnings with query parameters of WA4 1HT', async () => {
    stubs.getJson.callsFake(() => data.warringtonGetJson)
    stubs.getIsEngland.callsFake(() => ({ is_england: true }))
    stubs.getFloodsWithin.callsFake(() => data.floodsByPostCode)
    stubs.getStationsWithin.callsFake(() => [])
    stubs.getImpactsWithin.callsFake(() => [])
    const options = {
      method: 'GET',
      url: '/alerts-and-warnings?q=WA4%201HT'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('4 flood alerts')
    Code.expect(response.payload).to.contain('<a href="/target-area/013WAFLM" class="defra-flood-warnings-list-item__title">Lower River Mersey including Warrington, Runcorn and Lymm areas</a>')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /alerts-and-warnings Bing returns error', async () => {
    stubs.getJson.callsFake(() => {
      throw new Error('Bing error')
    })
    stubs.getFloods.callsFake(() => ({
      floods: []
    }))
    const options = {
      method: 'GET',
      url: '/alerts-and-warnings?q=WA4%201HT'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('Sorry, there is currently a problem searching a location - GOV.UK')
    Code.expect(response.payload).to.contain('Sorry, there is currently a problem searching a location')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /alerts-and-warnings - England parameter query', async () => {
    // Create dummy flood data in place of cached data
    stubs.getFloods.callsFake(() => ({
      floods: [
        {
          ta_code: '013FWFCH29',
          id: 4558714,
          ta_name: 'Wider area at risk from Sankey Brook at Dallam',
          quick_dial: '305027',
          region: 'Midlands',
          area: 'Central',
          floodtype: 'f',
          severity_value: 2,
          severitydescription: 'Flood Warning',
          warningkey: 1,
          message_received: '2020-01-08T13:09:09.628Z',
          severity_changed: '2020-01-08T13:09:09.628Z',
          situation_changed: '2020-01-08T13:09:09.628Z',
          situation: 'Lorem ipsum dolor sit amet, consectetur adipiscing elits nibh.'
        }
      ]
    }))
    stubs.getOutlook.callsFake(() => outlookData.statements[0])
    const options = {
      method: 'GET',
      url: '/alerts-and-warnings?q=England'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('1 flood warning')
  })
  lab.test('GET /alerts-and-warnings ', async () => {
    stubs.getFloods.callsFake(() => ({
      floods: []
    }))
    stubs.getStationsWithin.callsFake(() => [])
    stubs.getImpactsWithin.callsFake(() => [])
    const options = {
      method: 'GET',
      url: '/alerts-and-warnings'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('No flood alerts or warnings')
  })
  lab.test('GET /alerts-and-warnings?station=1001 ', async () => {
    stubs.getStationById.callsFake(() => data.fakeGetStationById)
    stubs.getWarningsAlertsWithinStationBuffer.callsFake(() => [])
    const options = {
      method: 'GET',
      url: '/alerts-and-warnings?station=1001'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('Beeding Bridge - flood alerts and warnings - GOV.UK')
  })
  lab.test('GET /alerts-and-warnings with unknown parameter e.g. facebook click id ', async () => {
    stubs.getStationById.callsFake(() => data.fakeGetStationById)
    stubs.getWarningsAlertsWithinStationBuffer.callsFake(() => [])
    const options = {
      method: 'GET',
      url: '/alerts-and-warnings?station=1001&fbclid=76896789uyuioyuioy&&&'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('Beeding Bridge - flood alerts and warnings - GOV.UK')
    Code.expect(response.statusCode).to.equal(200)
  })
})
