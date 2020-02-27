'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()
const data = require('../data')

lab.experiment('Test - /river-and-sea-levels', () => {
  let sandbox
  let server

  // Use a Sinon sandbox to manage spies, stubs and mocks for each test.
  lab.beforeEach(async () => {
    delete require.cache[require.resolve('../../server/util.js')]
    delete require.cache[require.resolve('../../server/services/location.js')]
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/routes/location.js')]
    delete require.cache[require.resolve('../../server/routes/river-and-sea-levels.js')]
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
  lab.test('GET river-and-sea-levels TYPO or non location "afdv vdaf adfv  fda" ', async () => {
    const fakeGetJson = () => data.nonLocationGetJson

    const util = require('../../server/util')
    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const riversPlugin = {
      plugin: {
        name: 'rivers',
        register: (server, options) => {
          server.route(require('../../server/routes/river-and-sea-levels'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(riversPlugin)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=wefwe%20we%20fwef%20str'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('No river, sea or groundwater levels found.')
    Code.expect(response.payload).to.contain('0 levels')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /alerts-and-warnings with query parameters of Kinghorn, Scotland', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: false }
    }

    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)

    const fakeGetJson = () => data.scotlandGetJson

    const util = require('../../server/util')
    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const riversPlugin = {
      plugin: {
        name: 'rivers',
        register: (server, options) => {
          server.route(require('../../server/routes/river-and-sea-levels'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(riversPlugin)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=Kinghorn'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('<h1 class="govuk-heading-xl">This service provides flood warning information for England only</h1>')
    Code.expect(response.statusCode).to.equal(200)
  })
  // lab.test('GET /rivers-and-sea-levels Bing returns error', async () => {
  //   const floodService = require('../../server/services/flood')

  //   const fakeStationsData = () => [
  //     {
  //       rloi_id: 5203,
  //       telemetry_id: '694460',
  //       region: 'North West',
  //       catchment: 'Lower Mersey',
  //       wiski_river_name: 'Netherley Brook',
  //       agency_name: 'Winster Drive',
  //       external_name: 'Winster Drive',
  //       station_type: 'S',
  //       status: 'Active',
  //       qualifier: 'u',
  //       iswales: false,
  //       value: '0.502',
  //       value_timestamp: '2020-02-21T04:30:00.000Z',
  //       value_erred: false,
  //       percentile_5: '2.7',
  //       percentile_95: '0.219'
  //     }
  //   ]

  //   sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)

  //   const fakeGetJson = () => {
  //     throw new Error('Bing error')
  //   }

  //   const util = require('../../server/util')
  //   sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

  //   const riversPlugin = {
  //     plugin: {
  //       name: 'rivers',
  //       register: (server, options) => {
  //         server.route(require('../../server/routes/river-and-sea-levels'))
  //       }
  //     }
  //   }

  //   await server.register(require('../../server/plugins/views'))
  //   await server.register(require('../../server/plugins/session'))
  //   await server.register(riversPlugin)

  //   await server.initialize()
  //   const options = {
  //     method: 'GET',
  //     url: '/river-and-sea-levels?q=WA4%201HT'
  //   }

  //   const response = await server.inject(options)

  //   Code.expect(response.payload).to.contain('Sorry, there is currently a problem searching a location - GOV.UK')
  //   Code.expect(response.payload).to.contain('Sorry, there is currently a problem searching a location')
  //   Code.expect(response.statusCode).to.equal(200)
  // })
  // lab.test('GET /river-and-sea-levels with levels Low, Normal, High', async () => {
  //   const floodService = require('../../server/services/flood')

  //   const fakeIsEngland = () => {
  //     return { is_england: true }
  //   }

  //   const fakeStationsData = () => [
  //     {
  //       rloi_id: 5050,
  //       telemetry_id: '694063',
  //       region: 'North West',
  //       catchment: 'Lower Mersey',
  //       wiski_river_name: 'River Mersey',
  //       agency_name: 'Fiddlers Ferry',
  //       external_name: 'Fiddlers Ferry',
  //       station_type: 'S',
  //       status: 'Active',
  //       qualifier: 'u',
  //       iswales: false,
  //       value: '3.17',
  //       value_timestamp: '2020-02-25T04:30:00.000Z',
  //       value_erred: false,
  //       percentile_5: '6.2',
  //       percentile_95: '2.611'
  //     },
  //     {
  //       rloi_id: 5149,
  //       telemetry_id: '693976',
  //       region: 'North West',
  //       catchment: 'Lower Mersey',
  //       wiski_river_name: 'River Mersey',
  //       agency_name: 'Westy',
  //       external_name: 'Westy',
  //       station_type: 'S',
  //       status: 'Active',
  //       qualifier: 'u',
  //       iswales: false,
  //       value: '5.038',
  //       value_timestamp: '2020-02-25T10:30:00.000Z',
  //       value_erred: false,
  //       percentile_5: '4.14',
  //       percentile_95: '3.548'
  //     },
  //     {
  //       rloi_id: 5085,
  //       telemetry_id: '694041',
  //       region: 'North West',
  //       catchment: 'Lower Mersey',
  //       wiski_river_name: 'Sankey Brook',
  //       agency_name: 'Liverpool Road',
  //       external_name: 'Liverpool Road',
  //       station_type: 'S',
  //       status: 'Active',
  //       qualifier: 'u',
  //       iswales: false,
  //       value: '1.111',
  //       value_timestamp: '2020-02-25T04:30:00.000Z',
  //       value_erred: false,
  //       percentile_5: '3.8',
  //       percentile_95: '1.209'
  //     }
  //   ]

  //   sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
  //   sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)

  //   const fakeGetJson = () => data.warringtonGetJson

  //   const util = require('../../server/util')
  //   sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

  //   const riversPlugin = {
  //     plugin: {
  //       name: 'rivers',
  //       register: (server, options) => {
  //         server.route(require('../../server/routes/river-and-sea-levels'))
  //       }
  //     }
  //   }

  //   await server.register(require('../../server/plugins/views'))
  //   await server.register(require('../../server/plugins/session'))
  //   await server.register(riversPlugin)

  //   await server.initialize()
  //   const options = {
  //     method: 'GET',
  //     url: '/river-and-sea-levels?q=Warrington'
  //   }

  //   const response = await server.inject(options)

  //   Code.expect(response.payload).to.contain('</time> (Low)')
  //   Code.expect(response.payload).to.contain('<div class="defra-flood-list__item defra-flood-list__item--low">')
  //   Code.expect(response.payload).to.contain('</time> (Normal)')
  //   Code.expect(response.payload).to.contain('<div class="defra-flood-list__item defra-flood-list__item--normal">')
  //   Code.expect(response.payload).to.contain('</time> (<strong>High</strong>)')
  //   Code.expect(response.payload).to.contain('<div class="defra-flood-list__item defra-flood-list__item--high">')
  //   Code.expect(response.payload).to.contain('3 levels')
  //   Code.expect(response.payload).to.contain('River Mersey')
  //   Code.expect(response.payload).to.contain('Sankey Brook')
  //   Code.expect(response.statusCode).to.equal(200)
  // })
  // lab.test('GET /river-and-sea-levels station status Closed', async () => {
  //   const floodService = require('../../server/services/flood')

  //   const fakeIsEngland = () => {
  //     return { is_england: true }
  //   }

  //   const fakeStationsData = () => [
  //     {
  //       rloi_id: 5050,
  //       telemetry_id: '694063',
  //       region: 'North West',
  //       catchment: 'Lower Mersey',
  //       wiski_river_name: 'River Mersey',
  //       agency_name: 'Fiddlers Ferry',
  //       external_name: 'Fiddlers Ferry',
  //       station_type: 'S',
  //       status: 'Closed',
  //       qualifier: 'u',
  //       iswales: false,
  //       value: '3.17',
  //       value_timestamp: '2020-02-25T04:30:00.000Z',
  //       value_erred: false,
  //       percentile_5: '6.2',
  //       percentile_95: '2.611'
  //     }
  //   ]

  //   sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
  //   sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)

  //   const fakeGetJson = () => data.warringtonGetJson

  //   const util = require('../../server/util')
  //   sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

  //   const riversPlugin = {
  //     plugin: {
  //       name: 'rivers',
  //       register: (server, options) => {
  //         server.route(require('../../server/routes/river-and-sea-levels'))
  //       }
  //     }
  //   }

  //   await server.register(require('../../server/plugins/views'))
  //   await server.register(require('../../server/plugins/session'))
  //   await server.register(riversPlugin)

  //   await server.initialize()
  //   const options = {
  //     method: 'GET',
  //     url: '/river-and-sea-levels?q=Warrington'
  //   }

  //   const response = await server.inject(options)

  //   Code.expect(response.payload).to.contain('Data not available')
  //   Code.expect(response.payload).to.contain('1 level')
  //   Code.expect(response.payload).to.contain('River Mersey')
  //   Code.expect(response.payload).to.contain('Fiddlers Ferry')
  //   Code.expect(response.payload).to.contain('<div class="defra-flood-list__item">')
  //   Code.expect(response.statusCode).to.equal(200)
  // })
  // lab.test('GET /river-and-sea-levels station status Suspended', async () => {
  //   const floodService = require('../../server/services/flood')

  //   const fakeIsEngland = () => {
  //     return { is_england: true }
  //   }

  //   const fakeStationsData = () => [
  //     {
  //       rloi_id: 5050,
  //       telemetry_id: '694063',
  //       region: 'North West',
  //       catchment: 'Lower Mersey',
  //       wiski_river_name: 'River Mersey',
  //       agency_name: 'Fiddlers Ferry',
  //       external_name: 'Fiddlers Ferry',
  //       station_type: 'S',
  //       status: 'Suspended',
  //       qualifier: 'u',
  //       iswales: false,
  //       value: '3.17',
  //       value_timestamp: '2020-02-25T04:30:00.000Z',
  //       value_erred: false,
  //       percentile_5: '6.2',
  //       percentile_95: '2.611'
  //     }
  //   ]

  //   sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
  //   sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)

  //   const fakeGetJson = () => data.warringtonGetJson

  //   const util = require('../../server/util')
  //   sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

  //   const riversPlugin = {
  //     plugin: {
  //       name: 'rivers',
  //       register: (server, options) => {
  //         server.route(require('../../server/routes/river-and-sea-levels'))
  //       }
  //     }
  //   }

  //   await server.register(require('../../server/plugins/views'))
  //   await server.register(require('../../server/plugins/session'))
  //   await server.register(riversPlugin)

  //   await server.initialize()
  //   const options = {
  //     method: 'GET',
  //     url: '/river-and-sea-levels?q=Warrington'
  //   }

  //   const response = await server.inject(options)

  //   Code.expect(response.payload).to.contain('Data not available')
  //   Code.expect(response.payload).to.contain('1 level')
  //   Code.expect(response.payload).to.contain('River Mersey')
  //   Code.expect(response.payload).to.contain('Fiddlers Ferry')
  //   Code.expect(response.payload).to.contain('<div class="defra-flood-list__item">')
  //   Code.expect(response.statusCode).to.equal(200)
  // })
  // lab.test('GET /river-and-sea-levels station status Active but no value', async () => {
  //   const floodService = require('../../server/services/flood')

  //   const fakeIsEngland = () => {
  //     return { is_england: true }
  //   }

  //   const fakeStationsData = () => [
  //     {
  //       rloi_id: 5050,
  //       telemetry_id: '694063',
  //       region: 'North West',
  //       catchment: 'Lower Mersey',
  //       wiski_river_name: 'River Mersey',
  //       agency_name: 'Fiddlers Ferry',
  //       external_name: 'Fiddlers Ferry',
  //       station_type: 'S',
  //       status: 'Active',
  //       qualifier: 'u',
  //       iswales: false,
  //       value: null,
  //       value_timestamp: '2020-02-25T04:30:00.000Z',
  //       value_erred: false,
  //       percentile_5: '6.2',
  //       percentile_95: '2.611'
  //     }
  //   ]

  //   sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
  //   sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)

  //   const fakeGetJson = () => data.warringtonGetJson

  //   const util = require('../../server/util')
  //   sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

  //   const riversPlugin = {
  //     plugin: {
  //       name: 'rivers',
  //       register: (server, options) => {
  //         server.route(require('../../server/routes/river-and-sea-levels'))
  //       }
  //     }
  //   }

  //   await server.register(require('../../server/plugins/views'))
  //   await server.register(require('../../server/plugins/session'))
  //   await server.register(riversPlugin)

  //   await server.initialize()
  //   const options = {
  //     method: 'GET',
  //     url: '/river-and-sea-levels?q=Warrington'
  //   }

  //   const response = await server.inject(options)

  //   Code.expect(response.payload).to.contain('Data error')
  //   Code.expect(response.payload).to.contain('1 level')
  //   Code.expect(response.payload).to.contain('River Mersey')
  //   Code.expect(response.payload).to.contain('Fiddlers Ferry')
  //   Code.expect(response.payload).to.contain('<div class="defra-flood-list__item">')
  //   Code.expect(response.statusCode).to.equal(200)
  // })
})
