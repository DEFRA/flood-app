'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()
const moment = require('moment-timezone')

lab.experiment('Test - /rainfall-station', () => {
  let sandbox
  let server

  lab.beforeEach(async () => {
    delete require.cache[require.resolve('../../server/util.js')]

    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/services/server-methods.js')]

    delete require.cache[require.resolve('../../server/routes/rainfall-station.js')]
    sandbox = await sinon.createSandbox()
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
  })

  lab.afterEach(async () => {
    await server.stop()
    await sandbox.restore()
  })
  lab.test('GET /rainfall-station', async () => {
    const floodService = require('../../server/services/flood')

    const fakeRainfallStationTelemetryData = () => [
      {
        period: '15 min',
        value: '0',
        value_timestamp: '2022-02-08T09:15:00.000Z'
      },
      {
        period: '15 min',
        value: '0.32',
        value_timestamp: '2022-02-08T09:00:00.000Z'
      },
      {
        period: '15 min',
        value: '0.27',
        value_timestamp: '2022-02-08T08:45:00.000Z'
      },
      {
        period: '15 min',
        value: '0.55',
        value_timestamp: '2022-02-08T08:30:00.000Z'
      }
    ]

    const fakeRainfallStationData = () => ({
      telemetry_station_id: '950',
      station_reference: 'E24195',
      region: 'Anglian',
      station_name: 'LAVENHAM',
      centroid: '0101000020E610000010159197A4D6E93FB7D290B8370Q3T30',
      data_type: 'Total',
      period: '15 min',
      units: 'mm',
      telemetry_value_parent_id: '96504866',
      value: '0',
      value_timestamp: '2022-02-08T09:15:00.000Z',
      day_total: '15.00',
      six_hr_total: '55.00',
      one_hr_total: '65.27',
      type: 'R'
    })

    sandbox.stub(floodService, 'getRainfallStationTelemetry').callsFake(fakeRainfallStationTelemetryData)
    sandbox.stub(floodService, 'getRainfallStation').callsFake(fakeRainfallStationData)

    const rainfallPlugin = {
      plugin: {
        name: 'rainfall-station',
        register: (server, options) => {
          server.route(require('../../server/routes/rainfall-station'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(rainfallPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/rainfall-station/E24195'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('15.0mm')
    Code.expect(response.payload).to.contain('55.0mm')
    Code.expect(response.payload).to.contain('65.3mm')
    Code.expect(response.payload).to.contain('Lavenham')
    Code.expect(response.statusCode).to.equal(200)
    // Related Content tests
    Code.expect(response.payload).to.contain('https://www.gov.uk/sign-up-for-flood-warnings')
    Code.expect(response.payload).to.contain('Get flood warnings by phone, text or email')
    Code.expect(response.payload).to.match(/<div class="defra-related-items">[\s\S]*?<a class="govuk-link" href="https:\/\/www\.gov\.uk\/prepare-for-flooding">\s*Prepare for flooding\s*<\/a>/)
    Code.expect(response.payload).to.match(/<div class="defra-related-items">[\s\S]*?<a class="govuk-link" href="https:\/\/www\.gov\.uk\/guidance\/flood-alerts-and-warnings-what-they-are-and-what-to-do">\s*What to do before or during a flood\s*<\/a>/)
    Code.expect(response.payload).to.match(/<div class="defra-related-items">[\s\S]*?<a class="govuk-link" href="https:\/\/www\.gov\.uk\/after-flood">\s*What to do after a flood\s*<\/a>/)
    Code.expect(response.payload).to.match(/<li>\s*<a class="govuk-link" href=https:\/\/ltf-dev\.aws\.defra\.cloud>\s*Check your long term flood risk\s*<\/a>\s*<\/li>/)
    Code.expect(response.payload).to.match(/<div class="defra-related-items">[\s\S]*?<a class="govuk-link" href="https:\/\/www\.gov\.uk\/report-flood-cause">\s*Report a flood\s*<\/a>/)
  })

  lab.test('GET /rainfall-station produces problem error', async () => {
    const floodService = require('../../server/services/flood')

    const fakeRainfallStationTelemetryData = () => [
      {
        period: '15 min',
        value: '0',
        value_timestamp: moment().subtract(3, 'days').format()
      }
    ]

    const fakeRainfallStationData = () => ({
      telemetry_station_id: '950',
      station_reference: 'E24195',
      region: 'Anglian',
      station_name: 'LAVENHAM',
      centroid: '0101000020E610000010159197A4D6E93FB7D290B8370Q3T30',
      data_type: 'Total',
      period: '15 min',
      units: 'mm',
      telemetry_value_parent_id: '96504866',
      value: '0',
      value_timestamp: '2022-02-08T09:15:00.000Z',
      day_total: '15.00',
      six_hr_total: '55.00',
      one_hr_total: '65.27',
      type: 'R'
    })

    sandbox.stub(floodService, 'getRainfallStationTelemetry').callsFake(fakeRainfallStationTelemetryData)
    sandbox.stub(floodService, 'getRainfallStation').callsFake(fakeRainfallStationData)

    const rainfallPlugin = {
      plugin: {
        name: 'rainfall-station',
        register: (server, options) => {
          server.route(require('../../server/routes/rainfall-station'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(rainfallPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/rainfall-station/E24195'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('<h2 class="defra-service-error__title" id="error-summary-title">There\'s a problem with the latest measurement</h2>')
  })
  lab.test('GET /rainfall-station produces offline error', async () => {
    const floodService = require('../../server/services/flood')

    const fakeRainfallStationTelemetryData = () => [
      {
        period: '15 min',
        value: '0',
        value_timestamp: moment().subtract(15, 'days').format()
      }
    ]

    const fakeRainfallStationData = () => ({
      telemetry_station_id: '950',
      station_reference: 'E24195',
      region: 'Anglian',
      station_name: 'LAVENHAM',
      centroid: '0101000020E610000010159197A4D6E93FB7D290B8370Q3T30',
      data_type: 'Total',
      period: '15 min',
      units: 'mm',
      telemetry_value_parent_id: '96504866',
      value: '0',
      value_timestamp: '2022-02-08T09:15:00.000Z',
      day_total: '15.00',
      six_hr_total: '55.00',
      one_hr_total: '65.27',
      type: 'R'
    })

    sandbox.stub(floodService, 'getRainfallStationTelemetry').callsFake(fakeRainfallStationTelemetryData)
    sandbox.stub(floodService, 'getRainfallStation').callsFake(fakeRainfallStationData)

    const rainfallPlugin = {
      plugin: {
        name: 'rainfall-station',
        register: (server, options) => {
          server.route(require('../../server/routes/rainfall-station'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(rainfallPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/rainfall-station/E24195'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('<h2 class="defra-service-error__title" id="error-summary-title">This measuring station is offline</h2>')
  })

  lab.test('GET /rainfall-station produces closed error', async () => {
    const floodService = require('../../server/services/flood')

    const fakeRainfallStationTelemetryData = () => [
      {
        period: '15 min',
        value: '0',
        value_timestamp: moment().subtract(40, 'days').format()
      }
    ]

    const fakeRainfallStationData = () => ({
      telemetry_station_id: '950',
      station_reference: 'E24195',
      region: 'Anglian',
      station_name: 'LAVENHAM',
      centroid: '0101000020E610000010159197A4D6E93FB7D290B8370Q3T30',
      data_type: 'Total',
      period: '15 min',
      units: 'mm',
      telemetry_value_parent_id: '96504866',
      value: '0',
      value_timestamp: '2022-02-08T09:15:00.000Z',
      day_total: '15.00',
      six_hr_total: '55.00',
      one_hr_total: '65.27',
      type: 'R'
    })

    sandbox.stub(floodService, 'getRainfallStationTelemetry').callsFake(fakeRainfallStationTelemetryData)
    sandbox.stub(floodService, 'getRainfallStation').callsFake(fakeRainfallStationData)

    const rainfallPlugin = {
      plugin: {
        name: 'rainfall-station',
        register: (server, options) => {
          server.route(require('../../server/routes/rainfall-station'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(rainfallPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/rainfall-station/E24195'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('<h2 class="defra-service-error__title" id="error-summary-title">This measuring station is closed</h2>')
  })

  lab.test('GET /rainfall-station produces not found', async () => {
    const floodService = require('../../server/services/flood')

    const fakeRainfallStationTelemetryData = () => [
      {
        period: '15 min',
        value: '0',
        value_timestamp: moment().subtract(40, 'days').format()
      }
    ]

    const fakeRainfallStationData = () => {}

    sandbox.stub(floodService, 'getRainfallStationTelemetry').callsFake(fakeRainfallStationTelemetryData)
    sandbox.stub(floodService, 'getRainfallStation').callsFake(fakeRainfallStationData)

    const rainfallPlugin = {
      plugin: {
        name: 'rainfall-station',
        register: (server, options) => {
          server.route(require('../../server/routes/rainfall-station'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(rainfallPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/rainfall-station/E24195'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('{"statusCode":404,"error":"Not Found","message":"Rainfall station not found"}')
  })
})
