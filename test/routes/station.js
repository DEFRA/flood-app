'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const moment = require('moment-timezone')
const sinon = require('sinon')
const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script()
const data = require('../data')

describe('Route - Station', () => {
  let sandbox
  let server

  beforeEach(async () => {
    delete require.cache[require.resolve('../../server/util.js')]
    delete require.cache[require.resolve('../../server/services/location.js')]
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/services/server-methods.js')]
    delete require.cache[require.resolve('../../server/routes/location.js')]
    delete require.cache[require.resolve('../../server/routes/station.js')]

    sandbox = await sinon.createSandbox()

    server = Hapi.server({
      port: 3000,
      host: 'localhost'
    })
  })

  afterEach(async () => {
    await server.stop()
    await sandbox.restore()
  })

  it('should show error banner with suspended ffoi station', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationData = () => {
      return {
        actual_ngr: 'TL2998009950',
        agency_name: 'Waterhall',
        area: 'Hertfordshre and North London',
        catchment: 'Upper Lee',
        centroid: '0101000020E6100000AB283E556416BEBF7AE12D36F6E24940',
        comments: '',
        coordinates: '{"type":"Point","coordinates":[-0.11752917367099,51.7731387828853]}',
        date_highest_level: '2014-02-07T08:15:00.000Z',
        date_open: '1985-01-01T00:00:00.000Z',
        date_por_max: '2014-02-07T08:15:00.000Z',
        date_por_min: '1990-07-09T20:15:00.000Z',
        display_area: 'North East Thames',
        display_catchment: 'Upper Lee',
        display_region: 'South East',
        external_name: 'Waterhall',
        geography: '0101000020E6100000AB283E556416BEBF7AE12D36F6E24940',
        highest_level: '1.155',
        location_info: 'Birch Green',
        percentile_5: '0.6',
        percentile_95: '0.12',
        period_of_record: 'to date',
        por_max_value: '1.155',
        por_min_value: '0.045',
        post_process: false,
        qualifier: 'u',
        region: 'Thames',
        rloi_id: 7333,
        site_max: '2',
        stage_datum: '43.594',
        station_type: 'S',
        status: 'Suspended',
        status_date: null,
        status_reason: '',
        subtract: null,
        telemetry_context_id: '1186383',
        telemetry_id: '4690TH',
        wiski_id: '4690TH',
        wiski_river_name: 'River Lee',
        x_coord_actual: 529980,
        x_coord_display: 529980,
        y_coord_actual: 209950,
        y_coord_display: 209950
      }
    }

    const fakeTelemetryData = () => [
      {
        ts: '2022-02-08T08:30:00.000Z',
        _: 3.589,
        err: false,
        formattedTime: '6:00am',
        dateWhen: 'today'
      }
    ]

    const fakeRiverData = () => {
      return {
        agency_name: 'Waterhall',
        catchment: 'Upper Lee',
        centroid: '0101000020E6100000AB283E556416BEBF7AE12D36F6E24940',
        down: 7357,
        external_name: 'Waterhall',
        iswales: false,
        lat: 51.7731387828853,
        lon: -0.11752917367099,
        navigable: true,
        percentile_5: '0.6',
        percentile_95: '0.12',
        qualifier: 'u',
        rank: 5,
        region: 'Thames',
        river_id: 'river-lee',
        river_name: 'River Lee',
        rloi_id: 7333,
        station_type: 'S',
        status: 'Suspended',
        telemetry_id: '4690TH',
        up: 7332,
        value: '0.247',
        value_erred: false,
        value_timestamp: '2020-04-01T12:00:00.000Z',
        view_rank: 3,
        wiski_river_name: 'River Lee'
      }
    }

    const fakeImpactsData = () => [
      {
        impactid: 3765,
        gauge: 'River Lee at Waterhall',
        rloiid: 7333,
        value: '0.502',
        units: 'mALD',
        geom: '0101000020E6100000DA1D520C9068BABFF12BD67091E34940',
        coordinates: '{"type":"Point","coordinates":[-0.103158,51.777876]}',
        comment: 'Road flooding in Bayfordbury Rd',
        shortname: 'Flooding to Bayfordbury Road',
        description: 'Flooding to Bayfordbury Road',
        type: 'Road Impact',
        obsfloodyear: null,
        obsfloodmonth: null,
        source: 'Flood Resiliance',
        telemetrylatest: '0.236',
        telemetryactive: false,
        forecastmax: '0.269',
        forecastactive: false
      },
      {
        impactid: 3766,
        gauge: 'River Lee at Waterhall',
        rloiid: 7333,
        value: '0.728',
        units: 'mALD',
        geom: '0101000020E6100000F22554707841B4BFF3E49A0299E34940',
        coordinates: '{"type":"Point","coordinates":[-0.079124,51.778107]}',
        comment: 'Blockage on Brickendon Brook. Road closed to Pub',
        shortname: 'Flooding at Brickendon Brook',
        description: 'Flooding at Brickendon Brook, road close to pub',
        type: 'Road Impact',
        obsfloodyear: null,
        obsfloodmonth: null,
        source: 'Flood Resiliance',
        telemetrylatest: '0.236',
        telemetryactive: false,
        forecastmax: '0.269',
        forecastactive: false
      },
      {
        impactid: 3767,
        gauge: 'River Lee at Waterhall',
        rloiid: 7333,
        value: '0.745',
        units: 'mALD',
        geom: '0101000020E61000004F04711E4E60B6BFCA6B257497E44940',
        coordinates: '{"type":"Point","coordinates":[-0.087407,51.785872]}',
        comment: 'Property Flooding - Harts Horns Pub',
        shortname: 'Flooding at pub',
        description: 'Flooding at pub on Hornsmill Road',
        type: 'Property Impact',
        obsfloodyear: null,
        obsfloodmonth: null,
        source: 'Flood Resiliance',
        telemetrylatest: '0.236',
        telemetryactive: false,
        forecastmax: '0.269',
        forecastactive: false
      },
      {
        impactid: 3768,
        gauge: 'River Lee at Waterhall',
        rloiid: 7333,
        value: '0.954',
        units: 'mALD',
        geom: '0101000020E6100000F99FFCDD3B6AB8BF42D13C8045E44940',
        coordinates: '{"type":"Point","coordinates":[-0.095371,51.783371]}',
        comment: 'Property Flooding - Riverside Garden Centre, Hornsmill, Warehams Lanes',
        shortname: 'Flooding to property',
        description: 'Flooding to property',
        type: 'Property Impact',
        obsfloodyear: null,
        obsfloodmonth: null,
        source: 'Flood Resiliance',
        telemetrylatest: '0.236',
        telemetryactive: false,
        forecastmax: '0.269',
        forecastactive: false
      }
    ]
    const fakeForecastFlag = () => { return { } }

    const fakeStationForecastData = () => []
    const fakeWarningsAlertsData = () => []
    const fakeStationThresholdData = () => []

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)
    sandbox.stub(floodService, 'getStationImtdThresholds').callsFake(fakeStationThresholdData)
    sandbox.stub(floodService, 'getImpactData').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getRiverStationByStationId').callsFake(fakeRiverData)
    sandbox.stub(floodService, 'getStationForecastData').callsFake(fakeStationForecastData)
    sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer').callsFake(fakeWarningsAlertsData)

    const stationPlugin = {
      plugin: {
        name: 'station',
        register: (server) => {
          server.route(require('../../server/routes/station'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(stationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/station/7333'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.not.contain('<h2 class="defra-service-error__title" id="error-station-offline">This measuring station is offline</h2>')
  })

  it('should return river level: Normal', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationData = () => {
      return {
        rloi_id: 5146,
        station_type: 'S',
        qualifier: 'u',
        telemetry_context_id: '1146588',
        telemetry_id: '713030',
        wiski_id: '713030',
        post_process: false,
        subtract: null,
        region: 'North West',
        area: 'Cumbria and Lancashire',
        catchment: 'Ribble Douglas and Crossens',
        display_region: 'North West',
        display_area: '',
        display_catchment: '',
        agency_name: 'Walton-Le-Dale',
        external_name: 'Walton-Le-Dale',
        location_info: 'Preston',
        x_coord_actual: 355230,
        y_coord_actual: 428720,
        actual_ngr: '',
        x_coord_display: 355230,
        y_coord_display: 428720,
        site_max: '5',
        wiski_river_name: 'River Ribble',
        date_open: '2001-01-01T00:00:00.000Z',
        stage_datum: '3.642',
        period_of_record: 'to date',
        por_max_value: '5.488',
        date_por_max: '2020-02-09T18:15:00.000Z',
        highest_level: '3.469',
        date_highest_level: '2012-09-26T01:15:00.000Z',
        por_min_value: '-0.07',
        date_por_min: '2009-04-22T12:45:00.000Z',
        percentile_5: '3.5',
        percentile_95: '0.15',
        comments: '',
        status: 'Active',
        status_reason: '',
        status_date: null,
        coordinates: '{"type":"Point","coordinates":[-2.68044442027032,53.7529105624953]}',
        geography: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40',
        centroid: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40'
      }
    }

    const fakeRiverData = () => {
      return {
        river_id: 'river-ribble',
        river_name: 'River Ribble',
        navigable: true,
        view_rank: 3,
        rank: 9,
        rloi_id: 5146,
        up: 5122,
        down: null,
        telemetry_id: '713030',
        region: 'North West',
        catchment: 'Ribble Douglas and Crossens',
        wiski_river_name: 'River Ribble',
        agency_name: 'Walton-Le-Dale',
        external_name: 'Walton-Le-Dale',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '9.567',
        value_timestamp: '2020-03-17T04:30:00.000Z',
        value_erred: false,
        trend: 'steady',
        percentile_5: '3.5',
        percentile_95: '0.15',
        centroid: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40',
        lon: -2.68044442027032,
        lat: 53.7529105624953,
        id: '2695'
      }
    }

    const fakeTelemetryData = () => [
      {
        ts: '2022-02-08T08:30:00.000Z',
        _: 1.354,
        err: false
      }
    ]

    const fakeImpactsData = () => []
    const fakeForecastFlag = () => data.fakeNonForecastFlag
    const fakeTargetAreasData = () => []
    const fakeStationThresholdData = () => []

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getRiverStationByStationId').callsFake(fakeRiverData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getImpactData').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)
    sandbox.stub(floodService, 'getStationImtdThresholds').callsFake(fakeStationThresholdData)
    sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer').callsFake(fakeTargetAreasData)

    const stationPlugin = {
      plugin: {
        name: 'station',
        register: (server) => {
          server.route(require('../../server/routes/station'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(stationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/station/5146'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.contain('River Ribble level at Walton-Le-Dale - GOV.UK')
    expect(response.payload).to.contain('Normal')
    expect(response.payload).to.contain('Steady')
    expect(response.payload).to.contain('Normal range 0.15m to 3.50m')
    expect(response.payload).to.contain('<a href="/river-and-sea-levels/rloi/5146">Nearby levels</a>')
    expect(response.payload).to.contain('<a href="/station/5122">Upstream</a>')
    expect(response.payload).to.contain('href="/station-csv/5146"')
    expect(response.payload).to.contain('Download data CSV (12KB)')
  })

  it('should return river level: High', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationData = () => {
      return {
        rloi_id: 5146,
        station_type: 'S',
        qualifier: 'u',
        telemetry_context_id: '1146588',
        telemetry_id: '713030',
        wiski_id: '713030',
        post_process: false,
        subtract: null,
        region: 'North West',
        area: 'Cumbria and Lancashire',
        catchment: 'Ribble Douglas and Crossens',
        display_region: 'North West',
        display_area: '',
        display_catchment: '',
        agency_name: 'Walton-Le-Dale',
        external_name: 'Walton-Le-Dale',
        location_info: 'Preston',
        x_coord_actual: 355230,
        y_coord_actual: 428720,
        actual_ngr: '',
        x_coord_display: 355230,
        y_coord_display: 428720,
        site_max: '5',
        wiski_river_name: 'River Ribble',
        date_open: '2001-01-01T00:00:00.000Z',
        stage_datum: '3.642',
        period_of_record: 'to date',
        por_max_value: '5.488',
        date_por_max: '2020-02-09T18:15:00.000Z',
        highest_level: '3.469',
        date_highest_level: '2012-09-26T01:15:00.000Z',
        por_min_value: '-0.07',
        date_por_min: '2009-04-22T12:45:00.000Z',
        percentile_5: '3.5',
        percentile_95: '0.15',
        comments: '',
        status: 'Active',
        status_reason: '',
        status_date: null,
        coordinates: '{"type":"Point","coordinates":[-2.68044442027032,53.7529105624953]}',
        geography: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40',
        centroid: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40'
      }
    }

    const fakeRiverData = () => {
      return {
        river_id: 'river-ribble',
        river_name: 'River Ribble',
        navigable: true,
        view_rank: 3,
        rank: 9,
        rloi_id: 5146,
        up: 5122,
        down: null,
        telemetry_id: '713030',
        region: 'North West',
        catchment: 'Ribble Douglas and Crossens',
        wiski_river_name: 'River Ribble',
        agency_name: 'Walton-Le-Dale',
        external_name: 'Walton-Le-Dale',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '9.567',
        value_timestamp: '2020-03-17T04:30:00.000Z',
        value_erred: false,
        trend: 'falling',
        percentile_5: '3.5',
        percentile_95: '0.15',
        centroid: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40',
        lon: -2.68044442027032,
        lat: 53.7529105624953,
        id: '2695'
      }
    }

    const fakeTelemetryData = () => [
      {
        ts: '2020-03-13T01:30Z',
        _: 9.354,
        err: false
      }
    ]

    const fakeImpactsData = () => []
    const fakeForecastFlag = () => { return { } }
    const fakeWarningsAlertsData = () => []
    const fakeStationThresholdData = () => []

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getRiverStationByStationId').callsFake(fakeRiverData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getImpactData').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)
    sandbox.stub(floodService, 'getStationImtdThresholds').callsFake(fakeStationThresholdData)
    sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer').callsFake(fakeWarningsAlertsData)

    const stationPlugin = {
      plugin: {
        name: 'station',
        register: (server) => {
          server.route(require('../../server/routes/station'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(stationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/station/5146'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.contain('River Ribble level at Walton-Le-Dale - GOV.UK')
    expect(response.payload).to.contain('High')
    expect(response.payload).to.contain('Falling')
    expect(response.payload).to.contain('Latest at 1:30am')
    expect(response.payload).to.contain('<a href="/river-and-sea-levels/rloi/5146">Nearby levels</a>')
    expect(response.payload).to.contain('<a href="/station/5122">Upstream</a>')
    expect(response.payload).to.not.contain('Go downstream</a>')
  })

  it('should return river level: Low ', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationData = () => {
      return {
        rloi_id: 5146,
        station_type: 'S',
        qualifier: 'u',
        telemetry_context_id: '1146588',
        telemetry_id: '713030',
        wiski_id: '713030',
        post_process: false,
        subtract: null,
        region: 'North West',
        area: 'Cumbria and Lancashire',
        catchment: 'Ribble Douglas and Crossens',
        display_region: 'North West',
        display_area: '',
        display_catchment: '',
        agency_name: 'Walton-Le-Dale',
        external_name: 'Walton-Le-Dale',
        location_info: 'Preston',
        x_coord_actual: 355230,
        y_coord_actual: 428720,
        actual_ngr: '',
        x_coord_display: 355230,
        y_coord_display: 428720,
        site_max: '5',
        wiski_river_name: 'River Ribble',
        date_open: '2001-01-01T00:00:00.000Z',
        stage_datum: '3.642',
        period_of_record: 'to date',
        por_max_value: '5.488',
        date_por_max: '2020-02-09T18:15:00.000Z',
        highest_level: '3.469',
        date_highest_level: '2012-09-26T01:15:00.000Z',
        por_min_value: '-0.07',
        date_por_min: '2009-04-22T12:45:00.000Z',
        percentile_5: '3.5',
        percentile_95: '0.15',
        comments: '',
        status: 'Active',
        status_reason: '',
        status_date: null,
        coordinates: '{"type":"Point","coordinates":[-2.68044442027032,53.7529105624953]}',
        geography: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40',
        centroid: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40'
      }
    }

    const fakeRiverData = () => {
      return {
        river_id: 'river-ribble',
        river_name: 'River Ribble',
        navigable: true,
        view_rank: 3,
        rank: 9,
        rloi_id: 5146,
        up: 5122,
        down: null,
        telemetry_id: '713030',
        region: 'North West',
        catchment: 'Ribble Douglas and Crossens',
        wiski_river_name: 'River Ribble',
        agency_name: 'Walton-Le-Dale',
        external_name: 'Walton-Le-Dale',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '9.567',
        value_timestamp: '2020-03-17T04:30:00.000Z',
        value_erred: false,
        trend: 'rising',
        percentile_5: '3.5',
        percentile_95: '0.15',
        centroid: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40',
        lon: -2.68044442027032,
        lat: 53.7529105624953,
        id: '2695'
      }
    }

    const fakeTelemetryData = () => [
      {
        ts: '2020-03-13T01:30Z',
        _: 0.054,
        err: false
      }
    ]

    const fakeImpactsData = () => []
    const fakeForecastFlag = () => { return { } }
    const fakeWarningsAlertsData = () => []
    const fakeStationThresholdData = () => []

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getRiverStationByStationId').callsFake(fakeRiverData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getImpactData').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)
    sandbox.stub(floodService, 'getStationImtdThresholds').callsFake(fakeStationThresholdData)
    sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer').callsFake(fakeWarningsAlertsData)

    const stationPlugin = {
      plugin: {
        name: 'station',
        register: (server) => {
          server.route(require('../../server/routes/station'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(stationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/station/5146'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.contain('River Ribble level at Walton-Le-Dale - GOV.UK')
    expect(response.payload).to.contain('Low\n')
    expect(response.payload).to.contain('Rising')
    expect(response.payload).to.contain('Latest at 1:30am')
    expect(response.payload).to.contain('<a href="/river-and-sea-levels/rloi/5146">Nearby levels</a>')
    expect(response.payload).to.contain('<a href="/station/5122">Upstream</a>')
  })

  it('should return downstream', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationData = () => {
      return {
        rloi_id: 2042,
        station_type: 'M',
        qualifier: 'd',
        telemetry_context_id: '1145946',
        telemetry_id: '2088',
        wiski_id: '2088',
        post_process: false,
        subtract: null,
        region: 'Midlands',
        area: 'Staffordshire Warwickshire and West Midlands',
        catchment: 'Warwickshire Avon',
        display_region: 'Midlands',
        display_area: '',
        display_catchment: '',
        agency_name: 'Lilbourne',
        external_name: 'Lilbourne',
        location_info: 'Lilbourne',
        x_coord_actual: 456360,
        y_coord_actual: 277780,
        actual_ngr: '',
        x_coord_display: 456360,
        y_coord_display: 277780,
        site_max: '3',
        wiski_river_name: 'River Avon',
        date_open: '1972-04-26T23:00:00.000Z',
        stage_datum: '92.6',
        period_of_record: 'to date',
        por_max_value: '1.774',
        date_por_max: '2007-03-03T08:30:00.000Z',
        highest_level: '1.77',
        date_highest_level: '2012-11-25T10:45:00.000Z',
        por_min_value: '-0.346',
        date_por_min: '2015-07-07T18:15:00.000Z',
        percentile_5: '0.666',
        percentile_95: '-0.255',
        comments: '',
        status: 'Active',
        status_reason: '',
        status_date: null,
        coordinates: '{"type":"Point","coordinates":[-1.17316039381184,52.3951465511329]}',
        geography: '0101000020E61000003F2646D543C5F2BF161F852994324A40',
        centroid: '0101000020E61000003F2646D543C5F2BF161F852994324A40'
      }
    }

    const fakeRiverData = () => {
      return {
        river_id: 'river-avon-warwickshire',
        river_name: 'River Avon',
        navigable: true,
        view_rank: 3,
        rank: 1,
        rloi_id: 2042,
        up: null,
        down: 2043,
        telemetry_id: '2088',
        region: 'Midlands',
        catchment: 'Warwickshire Avon',
        wiski_river_name: 'River Avon',
        agency_name: 'Lilbourne',
        external_name: 'Lilbourne',
        station_type: 'M',
        status: 'Active',
        qualifier: 'd',
        iswales: false,
        value: '0.341',
        value_timestamp: '2020-03-18T08:00:00.000Z',
        value_erred: false,
        trend: 'steady',
        percentile_5: '0.659',
        percentile_95: '0.098',
        centroid: '0101000020E61000003F2646D543C5F2BF161F852994324A40',
        lon: -1.17316039381184,
        lat: 52.3951465511329,
        id: '2695'
      }
    }

    const fakeTelemetryData = () => [
      {
        ts: '2020-03-13T01:30Z',
        _: 1.354,
        err: false
      }
    ]

    const fakeImpactsData = () => []
    const fakeForecastFlag = () => { return { } }
    const fakeWarningsAlertsData = () => []
    const fakeStationThresholdData = () => []

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getRiverStationByStationId').callsFake(fakeRiverData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getImpactData').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)
    sandbox.stub(floodService, 'getStationImtdThresholds').callsFake(fakeStationThresholdData)
    sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer').callsFake(fakeWarningsAlertsData)

    const stationPlugin = {
      plugin: {
        name: 'station',
        register: (server) => {
          server.route(require('../../server/routes/station'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(stationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/station/2042/downstream'
    }

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.contain('River Avon level downstream at Lilbourne - GOV.UK')
    expect(response.payload).to.contain('<a href="/river-and-sea-levels/rloi/2042">Nearby levels</a>')
    expect(response.payload).to.contain('<a href="/station/2042">Upstream</a>')
    expect(response.payload).to.contain('<a href="/station/2043">Downstream</a>')
  })

  it('should return closed station', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationData = () => {
      return {
        rloi_id: 5146,
        station_type: 'S',
        qualifier: 'u',
        telemetry_context_id: '1146588',
        telemetry_id: '713030',
        wiski_id: '713030',
        post_process: false,
        subtract: null,
        region: 'North West',
        area: 'Cumbria and Lancashire',
        catchment: 'Ribble Douglas and Crossens',
        display_region: 'North West',
        display_area: '',
        display_catchment: '',
        agency_name: 'Walton-Le-Dale',
        external_name: 'Walton-Le-Dale',
        location_info: 'Preston',
        x_coord_actual: 355230,
        y_coord_actual: 428720,
        actual_ngr: '',
        x_coord_display: 355230,
        y_coord_display: 428720,
        site_max: '5',
        wiski_river_name: 'River Ribble',
        date_open: '2001-01-01T00:00:00.000Z',
        stage_datum: '3.642',
        period_of_record: 'to date',
        por_max_value: '5.488',
        date_por_max: '2020-02-09T18:15:00.000Z',
        highest_level: '3.469',
        date_highest_level: '2012-09-26T01:15:00.000Z',
        por_min_value: '-0.07',
        date_por_min: '2009-04-22T12:45:00.000Z',
        percentile_5: '3.5',
        percentile_95: '0.15',
        comments: '',
        status: 'Closed',
        status_reason: '',
        status_date: null,
        coordinates: '{"type":"Point","coordinates":[-2.68044442027032,53.7529105624953]}',
        geography: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40',
        centroid: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40'
      }
    }

    const fakeTelemetryData = () => []

    const fakeImpactsData = () => []
    const fakeForecastFlag = () => { return { } }
    const fakeWarningsAlertsData = () => []
    const fakeRiverStationData = () => []
    const fakeStationThresholdData = () => []

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getImpactData').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)
    sandbox.stub(floodService, 'getStationImtdThresholds').callsFake(fakeStationThresholdData)
    sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer').callsFake(fakeWarningsAlertsData)
    sandbox.stub(floodService, 'getRiverStationByStationId').callsFake(fakeRiverStationData)

    const stationPlugin = {
      plugin: {
        name: 'station',
        register: (server) => {
          server.route(require('../../server/routes/station'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(stationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/station/5146'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.contain('River Ribble level at Walton-Le-Dale - GOV.UK')
    expect(response.payload).to.contain('This measuring station is closed')
    expect(response.payload).to.contain('No data is available')
  })

  it('should return coastal station', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationData = () => {
      return {
        rloi_id: 3130,
        station_type: 'C',
        qualifier: 'u',
        telemetry_context_id: '1161422',
        telemetry_id: '49150',
        wiski_id: 'S27571_FW',
        post_process: false,
        subtract: null,
        region: 'South West',
        area: 'Devon and Cornwall',
        catchment: 'North Cornwall',
        display_region: 'South West',
        display_area: '',
        display_catchment: '',
        agency_name: 'Bude',
        external_name: 'Bude',
        location_info: 'Bude',
        x_coord_actual: 219905,
        y_coord_actual: 106836,
        actual_ngr: '',
        x_coord_display: 219905,
        y_coord_display: 106836,
        site_max: '5',
        wiski_river_name: 'North Cornwall Coast',
        date_open: '1998-04-30T23:00:00.000Z',
        stage_datum: '0',
        period_of_record: 'to date',
        por_max_value: '5.137',
        date_por_max: '2014-01-03T06:30:00.000Z',
        highest_level: null,
        date_highest_level: null,
        por_min_value: null,
        date_por_min: null,
        percentile_5: null,
        percentile_95: null,
        comments: '',
        status: 'Active',
        status_reason: '',
        status_date: null,
        coordinates: '{"type":"Point","coordinates":[-4.55886096239952,50.8329662083875]}',
        geography: '0101000020E61000006D11520C463C12C049D9FFA29E6A4940',
        centroid: '0101000020E61000006D11520C463C12C049D9FFA29E6A4940'
      }
    }

    const fakeRiverData = () => {
      return {
        river_id: 'Sea Levels',
        river_name: 'Sea Levels',
        navigable: false,
        view_rank: 1,
        rank: null,
        rloi_id: 3130,
        up: null,
        down: null,
        telemetry_id: '49150',
        region: 'South West',
        catchment: 'North Cornwall',
        wiski_river_name: 'North Cornwall Coast',
        agency_name: 'Bude',
        external_name: 'Bude',
        station_type: 'C',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '3.589',
        value_timestamp: '2020-03-23T06:00:00.000Z',
        value_erred: false,
        percentile_5: null,
        percentile_95: null,
        centroid: '0101000020E61000006D11520C463C12C049D9FFA29E6A4940',
        lon: -4.55886096239952,
        lat: 50.8329662083875
      }
    }

    const fakeTelemetryData = () => [
      {
        ts: '2020-03-23T06:00Z',
        _: 3.589,
        err: false,
        formattedTime: '6:00am',
        dateWhen: 'today'
      }
    ]

    const fakeImpactsData = () => []
    const fakeForecastFlag = () => { return { } }
    const fakeWarningsAlertsData = () => []
    const fakeStationThresholdData = () => []

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getRiverStationByStationId').callsFake(fakeRiverData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getImpactData').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)
    sandbox.stub(floodService, 'getStationImtdThresholds').callsFake(fakeStationThresholdData)
    sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer').callsFake(fakeWarningsAlertsData)

    const stationPlugin = {
      plugin: {
        name: 'station',
        register: (server) => {
          server.route(require('../../server/routes/station'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(stationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/station/3130'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.contain('Sea level at Bude - GOV.UK')
    expect(response.payload).to.contain('Latest at 6:00am')
    expect(response.payload).to.contain('3.59m')
  })

  it('should 200 with FFOI: no max value ', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationData = () => {
      return {
        actual_ngr: 'TL2998009950',
        agency_name: 'Waterhall',
        area: 'Hertfordshre and North London',
        catchment: 'Upper Lee',
        centroid: '0101000020E6100000AB283E556416BEBF7AE12D36F6E24940',
        comments: '',
        coordinates: '{"type":"Point","coordinates":[-0.11752917367099,51.7731387828853]}',
        date_highest_level: '2014-02-07T08:15:00.000Z',
        date_open: '1985-01-01T00:00:00.000Z',
        date_por_max: '2014-02-07T08:15:00.000Z',
        date_por_min: '1990-07-09T20:15:00.000Z',
        display_area: 'North East Thames',
        display_catchment: 'Upper Lee',
        display_region: 'South East',
        external_name: 'Waterhall',
        geography: '0101000020E6100000AB283E556416BEBF7AE12D36F6E24940',
        highest_level: '1.155',
        location_info: 'Birch Green',
        percentile_5: '0.6',
        percentile_95: '0.12',
        period_of_record: 'to date',
        por_max_value: '1.155',
        por_min_value: '0.045',
        post_process: false,
        qualifier: 'u',
        region: 'Thames',
        rloi_id: 7333,
        site_max: '2',
        stage_datum: '43.594',
        station_type: 'S',
        status: 'Active',
        status_date: null,
        status_reason: '',
        subtract: null,
        telemetry_context_id: '1186383',
        telemetry_id: '4690TH',
        wiski_id: '4690TH',
        wiski_river_name: 'River Lee',
        x_coord_actual: 529980,
        x_coord_display: 529980,
        y_coord_actual: 209950,
        y_coord_display: 209950
      }
    }

    const fakeTelemetryData = () => [
      {
        ts: '2022-02-08T08:30:00.000Z',
        _: 3.589,
        err: false,
        formattedTime: '6:00am',
        dateWhen: 'today'
      }
    ]

    const fakeRiverData = () => {
      return {
        agency_name: 'Waterhall',
        catchment: 'Upper Lee',
        centroid: '0101000020E6100000AB283E556416BEBF7AE12D36F6E24940',
        down: 7357,
        external_name: 'Waterhall',
        iswales: false,
        lat: 51.7731387828853,
        lon: -0.11752917367099,
        navigable: true,
        percentile_5: '0.6',
        percentile_95: '0.12',
        qualifier: 'u',
        rank: 5,
        region: 'Thames',
        river_id: 'river-lee',
        river_name: 'River Lee',
        rloi_id: 7333,
        station_type: 'S',
        status: 'Active',
        telemetry_id: '4690TH',
        up: 7332,
        value: '0.247',
        value_erred: false,
        value_timestamp: '2020-04-01T12:00:00.000Z',
        view_rank: 3,
        wiski_river_name: 'River Lee'
      }
    }

    const fakeImpactsData = () => [
      {
        impactid: 3765,
        gauge: 'River Lee at Waterhall',
        rloiid: 7333,
        value: '0.502',
        units: 'mALD',
        geom: '0101000020E6100000DA1D520C9068BABFF12BD67091E34940',
        coordinates: '{"type":"Point","coordinates":[-0.103158,51.777876]}',
        comment: 'Road flooding in Bayfordbury Rd',
        shortname: 'Flooding to Bayfordbury Road',
        description: 'Flooding to Bayfordbury Road',
        type: 'Road Impact',
        obsfloodyear: null,
        obsfloodmonth: null,
        source: 'Flood Resiliance',
        telemetrylatest: '0.236',
        telemetryactive: false,
        forecastmax: '0.269',
        forecastactive: false
      },
      {
        impactid: 3766,
        gauge: 'River Lee at Waterhall',
        rloiid: 7333,
        value: '0.728',
        units: 'mALD',
        geom: '0101000020E6100000F22554707841B4BFF3E49A0299E34940',
        coordinates: '{"type":"Point","coordinates":[-0.079124,51.778107]}',
        comment: 'Blockage on Brickendon Brook. Road closed to Pub',
        shortname: 'Flooding at Brickendon Brook',
        description: 'Flooding at Brickendon Brook, road close to pub',
        type: 'Road Impact',
        obsfloodyear: null,
        obsfloodmonth: null,
        source: 'Flood Resiliance',
        telemetrylatest: '0.236',
        telemetryactive: false,
        forecastmax: '0.269',
        forecastactive: false
      },
      {
        impactid: 3767,
        gauge: 'River Lee at Waterhall',
        rloiid: 7333,
        value: '0.745',
        units: 'mALD',
        geom: '0101000020E61000004F04711E4E60B6BFCA6B257497E44940',
        coordinates: '{"type":"Point","coordinates":[-0.087407,51.785872]}',
        comment: 'Property Flooding - Harts Horns Pub',
        shortname: 'Floodining at pub',
        description: 'Flooding at pub on Hornsmill Road',
        type: 'Property Impact',
        obsfloodyear: null,
        obsfloodmonth: null,
        source: 'Flood Resiliance',
        telemetrylatest: '0.236',
        telemetryactive: false,
        forecastmax: '0.269',
        forecastactive: false
      },
      {
        impactid: 3768,
        gauge: 'River Lee at Waterhall',
        rloiid: 7333,
        value: '0.954',
        units: 'mALD',
        geom: '0101000020E6100000F99FFCDD3B6AB8BF42D13C8045E44940',
        coordinates: '{"type":"Point","coordinates":[-0.095371,51.783371]}',
        comment: 'Property Flooding - Riverside Garden Centre, Hornsmill, Warehams Lanes',
        shortname: 'Flooding to property',
        description: 'Flooding to property',
        type: 'Property Impact',
        obsfloodyear: null,
        obsfloodmonth: null,
        source: 'Flood Resiliance',
        telemetrylatest: '0.236',
        telemetryactive: false,
        forecastmax: '0.269',
        forecastactive: false
      }
    ]

    const fakeForecastFlag = () => data.forecastFlag

    const fakeStationForecastData = () => data.fakeStationForecastData
    const fakeWarningsAlertsData = () => []
    const fakeStationThresholdData = () => []

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)
    sandbox.stub(floodService, 'getStationImtdThresholds').callsFake(fakeStationThresholdData)
    sandbox.stub(floodService, 'getImpactData').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getRiverStationByStationId').callsFake(fakeRiverData)
    sandbox.stub(floodService, 'getStationForecastData').callsFake(fakeStationForecastData)
    sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer').callsFake(fakeWarningsAlertsData)

    const stationPlugin = {
      plugin: {
        name: 'station',
        register: (server) => {
          server.route(require('../../server/routes/station'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(stationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/station/7333'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.not.contain('The highest level in the forecast is')
    expect(response.payload).to.not.contain('<button class="defra-button-text govuk-!-margin-bottom-2" aria-controls="impact-list">Show historical events</button>')
    expect(response.payload).to.contain('Download data CSV (16KB)')
  })

  it('should 200 with FFOI: max value ', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationData = () => {
      return {
        actual_ngr: 'TL2998009950',
        agency_name: 'Waterhall',
        area: 'Hertfordshre and North London',
        catchment: 'Upper Lee',
        centroid: '0101000020E6100000AB283E556416BEBF7AE12D36F6E24940',
        comments: '',
        coordinates: '{"type":"Point","coordinates":[-0.11752917367099,51.7731387828853]}',
        date_highest_level: '2014-02-07T08:15:00.000Z',
        date_open: '1985-01-01T00:00:00.000Z',
        date_por_max: '2014-02-07T08:15:00.000Z',
        date_por_min: '1990-07-09T20:15:00.000Z',
        display_area: 'North East Thames',
        display_catchment: 'Upper Lee',
        display_region: 'South East',
        external_name: 'Waterhall',
        geography: '0101000020E6100000AB283E556416BEBF7AE12D36F6E24940',
        highest_level: '1.155',
        location_info: 'Birch Green',
        percentile_5: '0.6',
        percentile_95: '0.12',
        period_of_record: 'to date',
        por_max_value: '1.155',
        por_min_value: '0.045',
        post_process: false,
        qualifier: 'u',
        region: 'Thames',
        rloi_id: 7333,
        site_max: '2',
        stage_datum: '43.594',
        station_type: 'S',
        status: 'Active',
        status_date: null,
        status_reason: '',
        subtract: null,
        telemetry_context_id: '1186383',
        telemetry_id: '4690TH',
        wiski_id: '4690TH',
        wiski_river_name: 'River Lee',
        x_coord_actual: 529980,
        x_coord_display: 529980,
        y_coord_actual: 209950,
        y_coord_display: 209950
      }
    }

    const today = new Date()

    const formattedDate = moment.tz(today, 'Europe/London').format('h:mma')

    const fakeTelemetryData = () => [
      {
        ts: today,
        _: 3.589,
        err: false,
        formattedTime: formattedDate,
        dateWhen: 'today'
      }
    ]

    const fakeRiverData = () => {
      return {
        agency_name: 'Waterhall',
        catchment: 'Upper Lee',
        centroid: '0101000020E6100000AB283E556416BEBF7AE12D36F6E24940',
        down: 7357,
        external_name: 'Waterhall',
        iswales: false,
        lat: 51.7731387828853,
        lon: -0.11752917367099,
        navigable: true,
        percentile_5: '0.6',
        percentile_95: '0.12',
        qualifier: 'u',
        rank: 5,
        region: 'Thames',
        river_id: 'river-lee',
        river_name: 'River Lee',
        rloi_id: 7333,
        station_type: 'S',
        status: 'Active',
        telemetry_id: '4690TH',
        up: 7332,
        value: '0.247',
        value_erred: false,
        value_timestamp: '2020-04-01T12:00:00.000Z',
        view_rank: 3,
        wiski_river_name: 'River Lee'
      }
    }

    const fakeImpactsData = () => [
      {
        impactid: 3765,
        gauge: 'River Lee at Waterhall',
        rloiid: 7333,
        value: '0.502',
        units: 'mALD',
        geom: '0101000020E6100000DA1D520C9068BABFF12BD67091E34940',
        coordinates: '{"type":"Point","coordinates":[-0.103158,51.777876]}',
        comment: 'Road flooding in Bayfordbury Rd',
        shortname: 'Flooding to Bayfordbury Road',
        description: 'Flooding to Bayfordbury Road',
        type: 'Road Impact',
        obsfloodyear: null,
        obsfloodmonth: null,
        source: 'Flood Resiliance',
        telemetrylatest: '0.236',
        telemetryactive: false,
        forecastmax: '0.269',
        forecastactive: false
      },
      {
        impactid: 3766,
        gauge: 'River Lee at Waterhall',
        rloiid: 7333,
        value: '0.728',
        units: 'mALD',
        geom: '0101000020E6100000F22554707841B4BFF3E49A0299E34940',
        coordinates: '{"type":"Point","coordinates":[-0.079124,51.778107]}',
        comment: 'Blockage on Brickendon Brook. Road closed to Pub',
        shortname: 'Flooding at Brickendon Brook',
        description: 'Flooding at Brickendon Brook, road close to pub',
        type: 'Road Impact',
        obsfloodyear: null,
        obsfloodmonth: null,
        source: 'Flood Resiliance',
        telemetrylatest: '0.236',
        telemetryactive: false,
        forecastmax: '0.269',
        forecastactive: false
      },
      {
        impactid: 3767,
        gauge: 'River Lee at Waterhall',
        rloiid: 7333,
        value: '0.745',
        units: 'mALD',
        geom: '0101000020E61000004F04711E4E60B6BFCA6B257497E44940',
        coordinates: '{"type":"Point","coordinates":[-0.087407,51.785872]}',
        comment: 'Property Flooding - Harts Horns Pub',
        shortname: 'Floodining at pub',
        description: 'Flooding at pub on Hornsmill Road',
        type: 'Property Impact',
        obsfloodyear: null,
        obsfloodmonth: null,
        source: 'Flood Resiliance',
        telemetrylatest: '0.236',
        telemetryactive: false,
        forecastmax: '0.269',
        forecastactive: false
      },
      {
        impactid: 3768,
        gauge: 'River Lee at Waterhall',
        rloiid: 7333,
        value: '0.954',
        units: 'mALD',
        geom: '0101000020E6100000F99FFCDD3B6AB8BF42D13C8045E44940',
        coordinates: '{"type":"Point","coordinates":[-0.095371,51.783371]}',
        comment: 'Property Flooding - Riverside Garden Centre, Hornsmill, Warehams Lanes',
        shortname: 'Flooding to property',
        description: 'Flooding to property',
        type: 'Property Impact',
        obsfloodyear: null,
        obsfloodmonth: null,
        source: 'Flood Resiliance',
        telemetrylatest: '0.236',
        telemetryactive: false,
        forecastmax: '0.269',
        forecastactive: false
      }
    ]

    const fakeForecastFlag = () => data.forecastFlag

    const fakeStationForecastData = () => data.fakeStationForecastDataMax
    const fakeWarningsAlertsData = () => []
    const fakeStationThresholdData = () => []

    fakeStationForecastData().SetofValues[0].Value[0].$.date = moment().utc().add(1, 'hours').format('YYYY-MM-DD')
    fakeStationForecastData().SetofValues[0].Value[0].$.time = moment().utc().add(1, 'hours').format('HH:mm:ss')

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)
    sandbox.stub(floodService, 'getStationImtdThresholds').callsFake(fakeStationThresholdData)
    sandbox.stub(floodService, 'getImpactData').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getRiverStationByStationId').callsFake(fakeRiverData)
    sandbox.stub(floodService, 'getStationForecastData').callsFake(fakeStationForecastData)
    sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer').callsFake(fakeWarningsAlertsData)

    const stationPlugin = {
      plugin: {
        name: 'station',
        register: (server) => {
          server.route(require('../../server/routes/station'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(stationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/station/7333'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.contain('The highest level in the model is')
    expect(response.payload).to.not.contain('<button class="defra-button-text govuk-!-margin-bottom-2" aria-controls="impact-list">Show historical events</button>')
    expect(response.payload).to.contain('<a href="/station/7332">Upstream</a>')
    expect(response.payload).to.contain('<a href="/station/7357">Downstream</a>')
    expect(response.payload).to.contain('<a href="/river-and-sea-levels/rloi/7333">Nearby levels</a>')
  })

  it('should 200 with latest value over hour old but under 24 hours ', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationData = () => {
      return {
        rloi_id: 5146,
        station_type: 'S',
        qualifier: 'u',
        telemetry_context_id: '1146588',
        telemetry_id: '713030',
        wiski_id: '713030',
        post_process: false,
        subtract: null,
        region: 'North West',
        area: 'Cumbria and Lancashire',
        catchment: 'Ribble Douglas and Crossens',
        display_region: 'North West',
        display_area: '',
        display_catchment: '',
        agency_name: 'Walton-Le-Dale',
        external_name: 'Walton-Le-Dale',
        location_info: 'Preston',
        x_coord_actual: 355230,
        y_coord_actual: 428720,
        actual_ngr: '',
        x_coord_display: 355230,
        y_coord_display: 428720,
        site_max: '5',
        wiski_river_name: 'River Ribble',
        date_open: '2001-01-01T00:00:00.000Z',
        stage_datum: '3.642',
        period_of_record: 'to date',
        por_max_value: '5.488',
        date_por_max: '2020-02-09T18:15:00.000Z',
        highest_level: '3.469',
        date_highest_level: '2012-09-26T01:15:00.000Z',
        por_min_value: '-0.07',
        date_por_min: '2009-04-22T12:45:00.000Z',
        percentile_5: '3.5',
        percentile_95: '0.15',
        comments: '',
        status: 'Active',
        status_reason: '',
        status_date: null,
        coordinates: '{"type":"Point","coordinates":[-2.68044442027032,53.7529105624953]}',
        geography: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40',
        centroid: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40'
      }
    }

    const fakeRiverData = () => {
      return {
        river_id: 'river-ribble',
        river_name: 'River Ribble',
        navigable: true,
        view_rank: 3,
        rank: 9,
        rloi_id: 5146,
        up: 5122,
        down: null,
        telemetry_id: '713030',
        region: 'North West',
        catchment: 'Ribble Douglas and Crossens',
        wiski_river_name: 'River Ribble',
        agency_name: 'Walton-Le-Dale',
        external_name: 'Walton-Le-Dale',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '9.567',
        value_timestamp: '2020-03-17T04:30:00.000Z',
        value_erred: false,
        percentile_5: '3.5',
        percentile_95: '0.15',
        centroid: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40',
        lon: -2.68044442027032,
        lat: 53.7529105624953
      }
    }

    const newTime = new Date()

    newTime.setMinutes(newTime.getMinutes() - 90)

    const fakeTelemetryData = () => [
      {
        ts: '2022-02-08T08:30:00.000Z',
        _: 1.354,
        err: false
      }
    ]

    const fakeImpactsData = () => []
    const fakeForecastFlag = () => { return { } }

    const fakeTargetAreasData = () => []
    const fakeStationThresholdData = () => []

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getRiverStationByStationId').callsFake(fakeRiverData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getImpactData').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)
    sandbox.stub(floodService, 'getStationImtdThresholds').callsFake(fakeStationThresholdData)
    sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer').callsFake(fakeTargetAreasData)

    const stationPlugin = {
      plugin: {
        name: 'station',
        register: (server) => {
          server.route(require('../../server/routes/station'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(stationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/station/5146'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.contain('We take measurements more often as the risk of flooding increases.')
  })

  it('should redirect to new page ', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationData = () => {
      return {
        rloi_id: 2033,
        station_type: 'S',
        qualifier: 'u',
        telemetry_context_id: '13809678',
        telemetry_id: '2072',
        wiski_id: '2072',
        post_process: false,
        subtract: null,
        region: 'Wales',
        area: 'NRW-South East',
        catchment: 'Severn Uplands',
        display_region: '',
        display_area: '',
        display_catchment: '',
        agency_name: 'Llanidloes',
        external_name: 'Llanidloes',
        location_info: 'Llanidloes',
        x_coord_actual: 295500,
        y_coord_actual: 284810,
        actual_ngr: '',
        x_coord_display: 295500,
        y_coord_display: 284810,
        site_max: '4',
        wiski_river_name: 'River Severn',
        date_open: '1994-03-28T23:00:00.000Z',
        stage_datum: '158',
        period_of_record: 'to date',
        por_max_value: '3.072',
        date_por_max: '1998-10-27T23:45:00.000Z',
        highest_level: '2.778',
        date_highest_level: '2012-06-08T22:45:00.000Z',
        por_min_value: '0.759',
        date_por_min: '2001-06-14T23:00:00.000Z',
        percentile_5: '1.54',
        percentile_95: '0.897',
        comments: '',
        status: 'Active',
        status_reason: '',
        status_date: null,
        coordinates: '{"type":"Point","coordinates":[-3.53914009747622,52.4512181833538]}',
        geography: '0101000020E61000001AFBF4AE28500CC0BA6E7684C1394A40',
        centroid: '0101000020E61000001AFBF4AE28500CC0BA6E7684C1394A40'
      }
    }

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)

    const stationPlugin = {
      plugin: {
        name: 'station',
        register: (server) => {
          server.route(require('../../server/routes/station'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(stationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/station/2033'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(302)
  })

  it('should redirect if upstream is specified ', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationData = () => {
      return {
        rloi_id: 2042,
        station_type: 'M',
        qualifier: 'u',
        telemetry_context_id: '13810510',
        telemetry_id: '2088',
        wiski_id: '2088',
        post_process: false,
        subtract: null,
        region: 'Midlands',
        area: 'Staffordshire Warwickshire and West Midlands',
        catchment: 'Warwickshire Avon',
        display_region: 'Midlands',
        display_area: '',
        display_catchment: '',
        agency_name: 'Lilbourne',
        external_name: 'Lilbourne',
        location_info: 'Lilbourne',
        x_coord_actual: 456360,
        y_coord_actual: 277780,
        actual_ngr: '',
        x_coord_display: 456360,
        y_coord_display: 277780,
        site_max: '3',
        wiski_river_name: 'River Avon',
        date_open: '1972-04-26T23:00:00.000Z',
        stage_datum: '93.6',
        period_of_record: 'to date',
        por_max_value: '1.878',
        date_por_max: '2016-03-09T15:30:00.000Z',
        highest_level: '1.75',
        date_highest_level: '2012-11-25T11:15:00.000Z',
        por_min_value: '0.057',
        date_por_min: '2003-10-20T04:45:00.000Z',
        percentile_5: '0.659',
        percentile_95: '0.098',
        comments: '',
        status: 'Active',
        status_reason: '',
        status_date: null,
        coordinates: '{"type":"Point","coordinates":[-1.17316039381184,52.3951465511329]}',
        geography: '0101000020E61000003F2646D543C5F2BF161F852994324A40',
        centroid: '0101000020E61000003F2646D543C5F2BF161F852994324A40'
      }
    }

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)

    const stationPlugin = {
      plugin: {
        name: 'station',
        register: (server) => {
          server.route(require('../../server/routes/station'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(stationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/station/2042/upstream'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(302)
  })

  it('should return showing time data as interrupted', async () => {
    const floodService = require('../../server/services/flood')

    const dateInterupted = new Date()
    dateInterupted.setDate(dateInterupted.getDate() - 2)

    const fakeStationData = () => {
      return {
        rloi_id: 5146,
        station_type: 'S',
        qualifier: 'u',
        telemetry_context_id: '1146588',
        telemetry_id: '713030',
        wiski_id: '713030',
        post_process: false,
        subtract: null,
        region: 'North West',
        area: 'Cumbria and Lancashire',
        catchment: 'Ribble Douglas and Crossens',
        display_region: 'North West',
        display_area: '',
        display_catchment: '',
        agency_name: 'Walton-Le-Dale',
        external_name: 'Walton-Le-Dale',
        location_info: 'Preston',
        x_coord_actual: 355230,
        y_coord_actual: 428720,
        actual_ngr: '',
        x_coord_display: 355230,
        y_coord_display: 428720,
        site_max: '5',
        wiski_river_name: 'River Ribble',
        date_open: '2001-01-01T00:00:00.000Z',
        stage_datum: '3.642',
        period_of_record: 'to date',
        por_max_value: '5.488',
        date_por_max: '2020-02-09T18:15:00.000Z',
        highest_level: '3.469',
        date_highest_level: '2012-09-26T01:15:00.000Z',
        por_min_value: '-0.07',
        date_por_min: '2009-04-22T12:45:00.000Z',
        percentile_5: '3.5',
        percentile_95: '0.15',
        comments: '',
        status: 'Active',
        status_reason: '',
        status_date: dateInterupted,
        coordinates: '{"type":"Point","coordinates":[-2.68044442027032,53.7529105624953]}',
        geography: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40',
        centroid: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40'
      }
    }

    const fakeRiverData = () => {
      return {
        river_id: 'river-ribble',
        river_name: 'River Ribble',
        navigable: true,
        view_rank: 3,
        rank: 9,
        rloi_id: 5146,
        up: 5122,
        down: null,
        telemetry_id: '713030',
        region: 'North West',
        catchment: 'Ribble Douglas and Crossens',
        wiski_river_name: 'River Ribble',
        agency_name: 'Walton-Le-Dale',
        external_name: 'Walton-Le-Dale',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '9.567',
        value_timestamp: '2020-03-17T04:30:00.000Z',
        value_erred: false,
        percentile_5: '3.5',
        percentile_95: '0.15',
        centroid: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40',
        lon: -2.68044442027032,
        lat: 53.7529105624953
      }
    }

    const fakeTelemetryData = () => [
      {
        ts: '2020-03-13T01:30Z',
        _: 1.354,
        err: false
      }
    ]

    const fakeImpactsData = () => []
    const fakeForecastFlag = () => { return { } }

    const fakeTargetAreasData = () => []
    const fakeStationThresholdData = () => []

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getRiverStationByStationId').callsFake(fakeRiverData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getImpactData').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)
    sandbox.stub(floodService, 'getStationImtdThresholds').callsFake(fakeStationThresholdData)
    sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer').callsFake(fakeTargetAreasData)

    const stationPlugin = {
      plugin: {
        name: 'station',
        register: (server) => {
          server.route(require('../../server/routes/station'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(stationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/station/5146'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.contain('River Ribble level at Walton-Le-Dale - GOV.UK')
    expect(response.payload).to.contain('This data feed was interrupted')
    expect(response.payload).to.contain('<a href="/river-and-sea-levels/rloi/5146">Nearby levels</a>')
    expect(response.payload).to.contain('<a href="/station/5122">Upstream</a>')
    expect(response.payload).to.contain('href="/station-csv/5146"')
    expect(response.payload).to.contain('Download data CSV (12KB)')
  })

  it('should not show IMTD thresholds if not present with "Normal" river level', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationData = () => {
      return {
        rloi_id: 5146,
        station_type: 'S',
        qualifier: 'u',
        telemetry_context_id: '1146588',
        telemetry_id: '713030',
        wiski_id: '713030',
        post_process: false,
        subtract: null,
        region: 'North West',
        area: 'Cumbria and Lancashire',
        catchment: 'Ribble Douglas and Crossens',
        display_region: 'North West',
        display_area: '',
        display_catchment: '',
        agency_name: 'Walton-Le-Dale',
        external_name: 'Walton-Le-Dale',
        location_info: 'Preston',
        x_coord_actual: 355230,
        y_coord_actual: 428720,
        actual_ngr: '',
        x_coord_display: 355230,
        y_coord_display: 428720,
        site_max: '5',
        wiski_river_name: 'River Ribble',
        date_open: '2001-01-01T00:00:00.000Z',
        stage_datum: '3.642',
        period_of_record: 'to date',
        por_max_value: '5.488',
        date_por_max: '2020-02-09T18:15:00.000Z',
        highest_level: '3.469',
        date_highest_level: '2012-09-26T01:15:00.000Z',
        por_min_value: '-0.07',
        date_por_min: '2009-04-22T12:45:00.000Z',
        percentile_5: '3.5',
        percentile_95: '0.15',
        comments: '',
        status: 'Active',
        status_reason: '',
        status_date: null,
        coordinates: '{"type":"Point","coordinates":[-2.68044442027032,53.7529105624953]}',
        geography: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40',
        centroid: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40'
      }
    }

    const fakeRiverData = () => {
      return {
        river_id: 'river-ribble',
        river_name: 'River Ribble',
        navigable: true,
        view_rank: 3,
        rank: 9,
        rloi_id: 5146,
        up: 5122,
        down: null,
        telemetry_id: '713030',
        region: 'North West',
        catchment: 'Ribble Douglas and Crossens',
        wiski_river_name: 'River Ribble',
        agency_name: 'Walton-Le-Dale',
        external_name: 'Walton-Le-Dale',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '9.567',
        value_timestamp: '2020-03-17T04:30:00.000Z',
        value_erred: false,
        percentile_5: '3.5',
        percentile_95: '0.15',
        centroid: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40',
        lon: -2.68044442027032,
        lat: 53.7529105624953
      }
    }

    const fakeTelemetryData = () => [
      {
        ts: '2020-03-13T01:30Z',
        _: 1.354,
        err: false
      }
    ]

    const fakeImpactsData = () => []
    const fakeForecastFlag = () => { return { } }
    const fakeTargetAreasData = () => []
    const fakeStationThresholdData = () => { return {} }

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getRiverStationByStationId').callsFake(fakeRiverData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getImpactData').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)
    sandbox.stub(floodService, 'getStationImtdThresholds').callsFake(fakeStationThresholdData)
    sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer').callsFake(fakeTargetAreasData)

    const stationPlugin = {
      plugin: {
        name: 'station',
        register: (server) => {
          server.route(require('../../server/routes/station'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(stationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/station/5146'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.not.contain('Low lying land flooding is possible above this level. One or more flood alerts may be issued')
    expect(response.payload).to.not.contain('Property flooding is possible above this level. One or more flood warnings may be issued')
  })

  it('should return with missing percentile', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationData = () => {
      return {
        rloi_id: 5146,
        station_type: 'S',
        qualifier: 'u',
        telemetry_context_id: '1146588',
        telemetry_id: '713030',
        wiski_id: '713030',
        post_process: false,
        subtract: null,
        region: 'North West',
        area: 'Cumbria and Lancashire',
        catchment: 'Ribble Douglas and Crossens',
        display_region: 'North West',
        display_area: '',
        display_catchment: '',
        agency_name: 'Walton-Le-Dale',
        external_name: 'Walton-Le-Dale',
        location_info: 'Preston',
        x_coord_actual: 355230,
        y_coord_actual: 428720,
        actual_ngr: '',
        x_coord_display: 355230,
        y_coord_display: 428720,
        site_max: '5',
        wiski_river_name: 'River Ribble',
        date_open: '2001-01-01T00:00:00.000Z',
        stage_datum: '3.642',
        period_of_record: 'to date',
        por_max_value: '5.488',
        date_por_max: '2020-02-09T18:15:00.000Z',
        highest_level: '3.469',
        date_highest_level: '2012-09-26T01:15:00.000Z',
        por_min_value: '-0.07',
        date_por_min: '2009-04-22T12:45:00.000Z',
        percentile_5: '3.5',
        comments: '',
        status: 'Active',
        status_reason: '',
        status_date: null,
        coordinates: '{"type":"Point","coordinates":[-2.68044442027032,53.7529105624953]}',
        geography: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40',
        centroid: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40'
      }
    }

    const fakeRiverData = () => {
      return {
        river_id: 'river-ribble',
        river_name: 'River Ribble',
        navigable: true,
        view_rank: 3,
        rank: 9,
        rloi_id: 5146,
        up: 5122,
        down: null,
        telemetry_id: '713030',
        region: 'North West',
        catchment: 'Ribble Douglas and Crossens',
        wiski_river_name: 'River Ribble',
        agency_name: 'Walton-Le-Dale',
        external_name: 'Walton-Le-Dale',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '9.567',
        value_timestamp: '2020-03-17T04:30:00.000Z',
        value_erred: false,
        trend: 'steady',
        percentile_5: '3.5',
        percentile_95: '0.15',
        centroid: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40',
        lon: -2.68044442027032,
        lat: 53.7529105624953,
        id: '2695'
      }
    }

    const fakeTelemetryData = () => [
      {
        ts: '2022-02-08T08:30:00.000Z',
        _: 1.354,
        err: false
      }
    ]

    const fakeImpactsData = () => []
    const fakeForecastFlag = () => { return { } }
    const fakeTargetAreasData = () => []
    const fakeStationThresholdData = () => []

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getRiverStationByStationId').callsFake(fakeRiverData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getImpactData').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)
    sandbox.stub(floodService, 'getStationImtdThresholds').callsFake(fakeStationThresholdData)
    sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer').callsFake(fakeTargetAreasData)

    const stationPlugin = {
      plugin: {
        name: 'station',
        register: (server) => {
          server.route(require('../../server/routes/station'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(stationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/station/5146'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.contain('River Ribble level at Walton-Le-Dale - GOV.UK')
    expect(response.payload).to.contain('Steady')
    expect(response.payload).to.not.contain('Normal range ')
    expect(response.payload).to.contain('<a href="/river-and-sea-levels/rloi/5146">Nearby levels</a>')
    expect(response.payload).to.contain('<a href="/station/5122">Upstream</a>')
  })

  it('should set page title and h1 as coastal river name', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationData = () => {
      return {
        rloi_id: 1034,
        station_type: 'C',
        qualifier: 'u',
        telemetry_context_id: '56605303',
        telemetry_id: 'E12660',
        wiski_id: '152300002',
        post_process: false,
        subtract: null,
        region: 'Southern',
        area: 'Solent and South Downs',
        catchment: 'Test and Itchen',
        display_region: 'South East',
        display_area: 'Solent and South Downs',
        display_catchment: 'Test and Itchen',
        agency_name: 'Woolston',
        external_name: 'Woolston',
        location_info: 'Woolston',
        x_coord_actual: 443140,
        y_coord_actual: 110250,
        actual_ngr: 'SU4315110254',
        x_coord_display: 443140,
        y_coord_display: 110250,
        site_max: '7',
        wiski_river_name: 'Tide',
        date_open: '1993-06-21T23:00:00.000Z',
        stage_datum: '0',
        period_of_record: 'to date',
        por_max_value: '2.875',
        date_por_max: '2008-03-10T12:15:00.000Z',
        highest_level: null,
        date_highest_level: null,
        por_min_value: null,
        date_por_min: null,
        percentile_5: null,
        percentile_95: null,
        comments: '',
        status: 'Active',
        status_reason: '',
        status_date: null,
        coordinates: '{"type":"Point","coordinates":[-1.388037105,50.890130955]}',
        geography: '0101000020E610000034E523656635F6BF73CCA6CFEF714940',
        centroid: '0101000020E610000034E523656635F6BF73CCA6CFEF714940'
      }
    }

    const fakeRiverData = () => {
      return {
        river_id: 'river-itchen-hampshire',
        river_name: 'River Itchen',
        river_qualified_name: 'River Itchen (Hampshire)',
        navigable: true,
        view_rank: 1,
        rank: '10',
        rloi_id: 1034,
        up: 1056,
        down: null,
        telemetry_id: 'E12660',
        region: 'Southern',
        catchment: 'Test and Itchen',
        wiski_river_name: 'Tide',
        agency_name: 'Woolston',
        external_name: 'Woolston',
        station_type: 'C',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '-1.099',
        value_timestamp: '2024-05-29T08:45:00.000Z',
        value_erred: false,
        trend: 'rising',
        percentile_5: null,
        percentile_95: null,
        centroid: '0101000020E610000034E523656635F6BF73CCA6CFEF714940',
        lon: -1.3880371046819393,
        lat: 50.89013095516648,
        day_total: null,
        six_hr_total: null,
        one_hr_total: null,
        id: '2401'
      }
    }

    const fakeTelemetryData = () => [
      {
        ts: '2024-05-29T08:45:00.000Z',
        _: -1.099,
        err: false,
        formattedTime: '8:45am',
        dateWhen: 'today'
      }
    ]

    const fakeImpactsData = () => []
    const fakeForecastFlag = () => { return { } }
    const fakeTargetAreasData = () => []
    const fakeStationThresholdData = () => []

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getRiverStationByStationId').callsFake(fakeRiverData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getImpactData').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)
    sandbox.stub(floodService, 'getStationImtdThresholds').callsFake(fakeStationThresholdData)
    sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer').callsFake(fakeTargetAreasData)

    const stationPlugin = {
      plugin: {
        name: 'station',
        register: (server) => {
          server.route(require('../../server/routes/station'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(stationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/station/100034'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.match(/<h1 class="govuk-heading-xl govuk-!-margin-bottom-0">\s*River Itchen\s*level\s*at Woolston\s*<\/h1>/)
    expect(response.payload).to.match(/<title>\s*River Itchen level at Woolston - GOV.UK\s*<\/title>/)
  })

  it('should set page title and h1 as coastal river name', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationData = () => {
      return {
        rloi_id: 1034,
        station_type: 'C',
        qualifier: 'u',
        telemetry_context_id: '56605303',
        telemetry_id: 'E12660',
        wiski_id: '152300002',
        post_process: false,
        subtract: null,
        region: 'Southern',
        area: 'Solent and South Downs',
        catchment: 'Test and Itchen',
        display_region: 'South East',
        display_area: 'Solent and South Downs',
        display_catchment: 'Test and Itchen',
        agency_name: 'Woolston',
        external_name: 'Woolston',
        location_info: 'Woolston',
        x_coord_actual: 443140,
        y_coord_actual: 110250,
        actual_ngr: 'SU4315110254',
        x_coord_display: 443140,
        y_coord_display: 110250,
        site_max: '7',
        wiski_river_name: 'Tide',
        date_open: '1993-06-21T23:00:00.000Z',
        stage_datum: '0',
        period_of_record: 'to date',
        por_max_value: '2.875',
        date_por_max: '2008-03-10T12:15:00.000Z',
        highest_level: null,
        date_highest_level: null,
        por_min_value: null,
        date_por_min: null,
        percentile_5: null,
        percentile_95: null,
        comments: '',
        status: 'Active',
        status_reason: '',
        status_date: null,
        coordinates: '{"type":"Point","coordinates":[-1.388037105,50.890130955]}',
        geography: '0101000020E610000034E523656635F6BF73CCA6CFEF714940',
        centroid: '0101000020E610000034E523656635F6BF73CCA6CFEF714940'
      }
    }

    const fakeRiverData = () => {
      return {
        river_id: 'river-itchen-hampshire',
        river_name: 'River Itchen',
        river_qualified_name: 'River Itchen (Hampshire)',
        navigable: true,
        view_rank: 1,
        rank: '10',
        rloi_id: 1034,
        up: 1056,
        down: null,
        telemetry_id: 'E12660',
        region: 'Southern',
        catchment: 'Test and Itchen',
        wiski_river_name: 'Tide',
        agency_name: 'Woolston',
        external_name: 'Woolston',
        station_type: 'C',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '-1.099',
        value_timestamp: '2024-05-29T08:45:00.000Z',
        value_erred: false,
        trend: 'rising',
        percentile_5: null,
        percentile_95: null,
        centroid: '0101000020E610000034E523656635F6BF73CCA6CFEF714940',
        lon: -1.3880371046819393,
        lat: 50.89013095516648,
        day_total: null,
        six_hr_total: null,
        one_hr_total: null,
        id: '2401'
      }
    }

    const fakeTelemetryData = () => [
      {
        ts: '2024-05-29T08:45:00.000Z',
        _: -1.099,
        err: false,
        formattedTime: '8:45am',
        dateWhen: 'today'
      }
    ]

    const fakeImpactsData = () => []
    const fakeForecastFlag = () => { return { } }
    const fakeTargetAreasData = () => []
    const fakeStationThresholdData = () => []

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getRiverStationByStationId').callsFake(fakeRiverData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getImpactData').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)
    sandbox.stub(floodService, 'getStationImtdThresholds').callsFake(fakeStationThresholdData)
    sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer').callsFake(fakeTargetAreasData)

    const stationPlugin = {
      plugin: {
        name: 'station',
        register: (server) => {
          server.route(require('../../server/routes/station'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(stationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/station/1034'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.match(/<h1 class="govuk-heading-xl govuk-!-margin-bottom-0">\s*River Itchen\s*level\s*at Woolston\s*<\/h1>/)
    expect(response.payload).to.match(/<title>\s*River Itchen level at Woolston - GOV.UK\s*<\/title>/)
  })

  it('GET /station/9382/downstream shows correct upstream and downstream navigation links within same multi-reading station', async () => {
    const floodService = require('../../server/services/flood')
    const fakeStationData = () => {
      return {
        rloi_id: 9382,
        station_type: 'M',
        qualifier: 'd',
        telemetry_context_id: '1146588',
        telemetry_id: '713030',
        wiski_id: '713030',
        post_process: false,
        subtract: null,
        region: 'North West',
        area: 'Cumbria and Lancashire',
        catchment: 'Ribble Douglas and Crossens',
        display_region: 'North West',
        display_area: '',
        display_catchment: '',
        agency_name: 'Walton-Le-Dale',
        external_name: 'Walton-Le-Dale',
        location_info: 'Preston',
        x_coord_actual: 355230,
        y_coord_actual: 428720,
        actual_ngr: '',
        x_coord_display: 355230,
        y_coord_display: 428720,
        site_max: '5',
        wiski_river_name: 'River Ribble',
        date_open: '2001-01-01T00:00:00.000Z',
        stage_datum: '3.642',
        period_of_record: 'to date',
        por_max_value: '5.488',
        date_por_max: '2020-02-09T18:15:00.000Z',
        highest_level: '3.469',
        date_highest_level: '2012-09-26T01:15:00.000Z',
        por_min_value: '-0.07',
        date_por_min: '2009-04-22T12:45:00.000Z',
        percentile_5: '3.5',
        comments: '',
        status: 'Active',
        status_reason: '',
        status_date: null,
        coordinates: '{"type":"Point","coordinates":[-2.68044442027032,53.7529105624953]}',
        geography: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40',
        centroid: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40'
      }
    }

    const fakeTelemetryData = () => []
    const fakeImpactsData = () => []
    const fakeForecastFlag = () => { return { } }
    const fakeTargetAreasData = () => []
    const fakeStationThresholdData = () => []

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getRiverStationByStationId').returns(data.fakeRiverData.multiStationDownstreamData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getImpactData').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)
    sandbox.stub(floodService, 'getStationImtdThresholds').callsFake(fakeStationThresholdData)
    sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer').callsFake(fakeTargetAreasData)

    // Set up the Hapi server
    const server = Hapi.server()
    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))

    const stationPlugin = {
      plugin: {
        name: 'station',
        register: (server, options) => {
          server.route(require('../../server/routes/station'))
        }
      }
    }
    await server.register(stationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)
    await server.initialize()

    const response = await server.inject({
      method: 'GET',
      url: '/station/9382/downstream'
    })

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.include('<a href="/station/9382">Upstream</a>')
    expect(response.payload).to.include('<a href="/station/9345">Downstream</a>')
  })

  it('GET /station/9382 redirects to the downstream view and shows correct navigation links for multi-reading station', async () => {
    const floodService = require('../../server/services/flood')
    const fakeStationData = () => {
      return {
        rloi_id: 9382,
        station_type: 'M',
        qualifier: 'u',
        telemetry_context_id: '1146588',
        telemetry_id: '713030',
        wiski_id: '713030',
        post_process: false,
        subtract: null,
        region: 'North West',
        area: 'Cumbria and Lancashire',
        catchment: 'Ribble Douglas and Crossens',
        display_region: 'North West',
        display_area: '',
        display_catchment: '',
        agency_name: 'Walton-Le-Dale',
        external_name: 'Walton-Le-Dale',
        location_info: 'Preston',
        x_coord_actual: 355230,
        y_coord_actual: 428720,
        actual_ngr: '',
        x_coord_display: 355230,
        y_coord_display: 428720,
        site_max: '5',
        wiski_river_name: 'River Ribble',
        date_open: '2001-01-01T00:00:00.000Z',
        stage_datum: '3.642',
        period_of_record: 'to date',
        por_max_value: '5.488',
        date_por_max: '2020-02-09T18:15:00.000Z',
        highest_level: '3.469',
        date_highest_level: '2012-09-26T01:15:00.000Z',
        por_min_value: '-0.07',
        date_por_min: '2009-04-22T12:45:00.000Z',
        percentile_5: '3.5',
        comments: '',
        status: 'Active',
        status_reason: '',
        status_date: null,
        coordinates: '{"type":"Point","coordinates":[-2.68044442027032,53.7529105624953]}',
        geography: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40',
        centroid: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40'
      }
    }

    const fakeTelemetryData = () => []
    const fakeImpactsData = () => []
    const fakeForecastFlag = () => { return { } }
    const fakeTargetAreasData = () => []
    const fakeStationThresholdData = () => []

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getRiverStationByStationId').returns(data.fakeRiverData.multiStationUpstreamData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getImpactData').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)
    sandbox.stub(floodService, 'getStationImtdThresholds').callsFake(fakeStationThresholdData)
    sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer').callsFake(fakeTargetAreasData)

    // Set up the Hapi server
    const server = Hapi.server()
    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))

    const stationPlugin = {
      plugin: {
        name: 'station',
        register: (server, options) => {
          server.route(require('../../server/routes/station'))
        }
      }
    }
    await server.register(stationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)
    await server.initialize()

    const response = await server.inject({
      method: 'GET',
      url: '/station/9382'
    })

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.include('<a href="/station/9045">Upstream</a>')
    expect(response.payload).to.include('<a href="/station/9382/downstream">Downstream</a>')
  })

  it('GET /station/9045 navigates correctly to upstream and downstream views from a single station', async () => {
    const floodService = require('../../server/services/flood')
    const fakeStationData = () => {
      return {
        rloi_id: 9045,
        station_type: 'S',
        qualifier: 'u',
        telemetry_context_id: '1146588',
        telemetry_id: '713030',
        wiski_id: '713030',
        post_process: false,
        subtract: null,
        region: 'North West',
        area: 'Cumbria and Lancashire',
        catchment: 'Ribble Douglas and Crossens',
        display_region: 'North West',
        display_area: '',
        display_catchment: '',
        agency_name: 'Walton-Le-Dale',
        external_name: 'Walton-Le-Dale',
        location_info: 'Preston',
        x_coord_actual: 355230,
        y_coord_actual: 428720,
        actual_ngr: '',
        x_coord_display: 355230,
        y_coord_display: 428720,
        site_max: '5',
        wiski_river_name: 'River Ribble',
        date_open: '2001-01-01T00:00:00.000Z',
        stage_datum: '3.642',
        period_of_record: 'to date',
        por_max_value: '5.488',
        date_por_max: '2020-02-09T18:15:00.000Z',
        highest_level: '3.469',
        date_highest_level: '2012-09-26T01:15:00.000Z',
        por_min_value: '-0.07',
        date_por_min: '2009-04-22T12:45:00.000Z',
        percentile_5: '3.5',
        comments: '',
        status: 'Active',
        status_reason: '',
        status_date: null,
        coordinates: '{"type":"Point","coordinates":[-2.68044442027032,53.7529105624953]}',
        geography: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40',
        centroid: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40'
      }
    }

    const fakeTelemetryData = () => []
    const fakeImpactsData = () => []
    const fakeForecastFlag = () => { return { } }
    const fakeTargetAreasData = () => []
    const fakeStationThresholdData = () => []

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getRiverStationByStationId').returns(data.fakeRiverData.singleStationData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getImpactData').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)
    sandbox.stub(floodService, 'getStationImtdThresholds').callsFake(fakeStationThresholdData)
    sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer').callsFake(fakeTargetAreasData)

    // Set up the Hapi server
    const server = Hapi.server()
    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))

    const stationPlugin = {
      plugin: {
        name: 'station',
        register: (server, options) => {
          server.route(require('../../server/routes/station'))
        }
      }
    }
    await server.register(stationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)
    await server.initialize()

    const response = await server.inject({
      method: 'GET',
      url: '/station/9045'
    })

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.include('<a href="/station/9382/downstream">Upstream</a>')
    expect(response.payload).to.include('<a href="/station/8114">Downstream</a>')
  })

  it('GET /station/9382 shows correct upstream and downstream navigation links for multi to single upstream navigation', async () => {
    const floodService = require('../../server/services/flood')
    const fakeStationData = () => {
      return {
        rloi_id: 9382,
        station_type: 'M',
        qualifier: 'u',
        telemetry_context_id: '1146588',
        telemetry_id: '713030',
        wiski_id: '713030',
        post_process: false,
        subtract: null,
        region: 'North West',
        area: 'Cumbria and Lancashire',
        catchment: 'Ribble Douglas and Crossens',
        display_region: 'North West',
        display_area: '',
        display_catchment: '',
        agency_name: 'Walton-Le-Dale',
        external_name: 'Walton-Le-Dale',
        location_info: 'Preston',
        x_coord_actual: 355230,
        y_coord_actual: 428720,
        actual_ngr: '',
        x_coord_display: 355230,
        y_coord_display: 428720,
        site_max: '5',
        wiski_river_name: 'River Ribble',
        date_open: '2001-01-01T00:00:00.000Z',
        stage_datum: '3.642',
        period_of_record: 'to date',
        por_max_value: '5.488',
        date_por_max: '2020-02-09T18:15:00.000Z',
        highest_level: '3.469',
        date_highest_level: '2012-09-26T01:15:00.000Z',
        por_min_value: '-0.07',
        date_por_min: '2009-04-22T12:45:00.000Z',
        percentile_5: '3.5',
        comments: '',
        status: 'Active',
        status_reason: '',
        status_date: null,
        coordinates: '{"type":"Point","coordinates":[-2.68044442027032,53.7529105624953]}',
        geography: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40',
        centroid: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40'
      }
    }

    const fakeTelemetryData = () => []
    const fakeImpactsData = () => []
    const fakeForecastFlag = () => { return { } }
    const fakeTargetAreasData = () => []
    const fakeStationThresholdData = () => []

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getRiverStationByStationId').returns(data.fakeRiverData.multiStationUpstreamData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getImpactData').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)
    sandbox.stub(floodService, 'getStationImtdThresholds').callsFake(fakeStationThresholdData)
    sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer').callsFake(fakeTargetAreasData)

    // Set up the Hapi server
    const server = Hapi.server()
    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))

    const stationPlugin = {
      plugin: {
        name: 'station',
        register: (server, options) => {
          server.route(require('../../server/routes/station'))
        }
      }
    }
    await server.register(stationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)
    await server.initialize()

    const response = await server.inject({
      method: 'GET',
      url: '/station/9382'
    })

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.include('<a href="/station/9045">Upstream</a>')
    expect(response.payload).to.include('<a href="/station/9382/downstream">Downstream</a>')
  })

  it('GET /station/9382/downstream shows correct upstream and downstream navigation links for multi to single downstream navigation', async () => {
    const floodService = require('../../server/services/flood')
    const fakeStationData = () => {
      return {
        rloi_id: 9382,
        station_type: 'M',
        qualifier: 'd',
        telemetry_context_id: '1146588',
        telemetry_id: '713030',
        wiski_id: '713030',
        post_process: false,
        subtract: null,
        region: 'North West',
        area: 'Cumbria and Lancashire',
        catchment: 'Ribble Douglas and Crossens',
        display_region: 'North West',
        display_area: '',
        display_catchment: '',
        agency_name: 'Walton-Le-Dale',
        external_name: 'Walton-Le-Dale',
        location_info: 'Preston',
        x_coord_actual: 355230,
        y_coord_actual: 428720,
        actual_ngr: '',
        x_coord_display: 355230,
        y_coord_display: 428720,
        site_max: '5',
        wiski_river_name: 'River Ribble',
        date_open: '2001-01-01T00:00:00.000Z',
        stage_datum: '3.642',
        period_of_record: 'to date',
        por_max_value: '5.488',
        date_por_max: '2020-02-09T18:15:00.000Z',
        highest_level: '3.469',
        date_highest_level: '2012-09-26T01:15:00.000Z',
        por_min_value: '-0.07',
        date_por_min: '2009-04-22T12:45:00.000Z',
        percentile_5: '3.5',
        comments: '',
        status: 'Active',
        status_reason: '',
        status_date: null,
        coordinates: '{"type":"Point","coordinates":[-2.68044442027032,53.7529105624953]}',
        geography: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40',
        centroid: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40'
      }
    }

    const fakeTelemetryData = () => []
    const fakeImpactsData = () => []
    const fakeForecastFlag = () => { return { } }
    const fakeTargetAreasData = () => []
    const fakeStationThresholdData = () => []

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getRiverStationByStationId').returns(data.fakeRiverData.multiStationDownstreamData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getImpactData').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)
    sandbox.stub(floodService, 'getStationImtdThresholds').callsFake(fakeStationThresholdData)
    sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer').callsFake(fakeTargetAreasData)

    // Set up the Hapi server
    const server = Hapi.server()
    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))

    const stationPlugin = {
      plugin: {
        name: 'station',
        register: (server, options) => {
          server.route(require('../../server/routes/station'))
        }
      }
    }
    await server.register(stationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)
    await server.initialize()

    const response = await server.inject({
      method: 'GET',
      url: '/station/9382/downstream'
    })

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.include('<a href="/station/9382">Upstream</a>')
    expect(response.payload).to.include('<a href="/station/9345">Downstream</a>')
  })

  it('GET /station/9382/downstream switches from downstream to upstream view within the same multi-reading station', async () => {
    const floodService = require('../../server/services/flood')
    const fakeStationData = () => {
      return {
        rloi_id: 9382,
        station_type: 'M',
        qualifier: 'd',
        telemetry_context_id: '1146588',
        telemetry_id: '713030',
        wiski_id: '713030',
        post_process: false,
        subtract: null,
        region: 'North West',
        area: 'Cumbria and Lancashire',
        catchment: 'Ribble Douglas and Crossens',
        display_region: 'North West',
        display_area: '',
        display_catchment: '',
        agency_name: 'Walton-Le-Dale',
        external_name: 'Walton-Le-Dale',
        location_info: 'Preston',
        x_coord_actual: 355230,
        y_coord_actual: 428720,
        actual_ngr: '',
        x_coord_display: 355230,
        y_coord_display: 428720,
        site_max: '5',
        wiski_river_name: 'River Ribble',
        date_open: '2001-01-01T00:00:00.000Z',
        stage_datum: '3.642',
        period_of_record: 'to date',
        por_max_value: '5.488',
        date_por_max: '2020-02-09T18:15:00.000Z',
        highest_level: '3.469',
        date_highest_level: '2012-09-26T01:15:00.000Z',
        por_min_value: '-0.07',
        date_por_min: '2009-04-22T12:45:00.000Z',
        percentile_5: '3.5',
        comments: '',
        status: 'Active',
        status_reason: '',
        status_date: null,
        coordinates: '{"type":"Point","coordinates":[-2.68044442027032,53.7529105624953]}',
        geography: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40',
        centroid: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40'
      }
    }

    const fakeTelemetryData = () => []
    const fakeImpactsData = () => []
    const fakeForecastFlag = () => { return { } }
    const fakeTargetAreasData = () => []
    const fakeStationThresholdData = () => []

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getRiverStationByStationId').returns(data.fakeRiverData.multiStationDownstreamData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getImpactData').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)
    sandbox.stub(floodService, 'getStationImtdThresholds').callsFake(fakeStationThresholdData)
    sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer').callsFake(fakeTargetAreasData)

    // Set up the Hapi server
    const server = Hapi.server()
    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))

    const stationPlugin = {
      plugin: {
        name: 'station',
        register: (server, options) => {
          server.route(require('../../server/routes/station'))
        }
      }
    }
    await server.register(stationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)
    await server.initialize()

    const response = await server.inject({
      method: 'GET',
      url: '/station/9382/downstream'
    })

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.include('<a href="/station/9382">Upstream</a>')
    expect(response.payload).to.include('<a href="/station/9345">Downstream</a>')
  })

  it('GET /station/9382 switches from upstream to downstream view within the same multi-reading station', async () => {
    const floodService = require('../../server/services/flood')
    const fakeStationData = () => {
      return {
        rloi_id: 9382,
        station_type: 'M',
        qualifier: 'u',
        telemetry_context_id: '1146588',
        telemetry_id: '713030',
        wiski_id: '713030',
        post_process: false,
        subtract: null,
        region: 'North West',
        area: 'Cumbria and Lancashire',
        catchment: 'Ribble Douglas and Crossens',
        display_region: 'North West',
        display_area: '',
        display_catchment: '',
        agency_name: 'Walton-Le-Dale',
        external_name: 'Walton-Le-Dale',
        location_info: 'Preston',
        x_coord_actual: 355230,
        y_coord_actual: 428720,
        actual_ngr: '',
        x_coord_display: 355230,
        y_coord_display: 428720,
        site_max: '5',
        wiski_river_name: 'River Ribble',
        date_open: '2001-01-01T00:00:00.000Z',
        stage_datum: '3.642',
        period_of_record: 'to date',
        por_max_value: '5.488',
        date_por_max: '2020-02-09T18:15:00.000Z',
        highest_level: '3.469',
        date_highest_level: '2012-09-26T01:15:00.000Z',
        por_min_value: '-0.07',
        date_por_min: '2009-04-22T12:45:00.000Z',
        percentile_5: '3.5',
        comments: '',
        status: 'Active',
        status_reason: '',
        status_date: null,
        coordinates: '{"type":"Point","coordinates":[-2.68044442027032,53.7529105624953]}',
        geography: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40',
        centroid: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40'
      }
    }

    const fakeTelemetryData = () => []
    const fakeImpactsData = () => []
    const fakeForecastFlag = () => { return { } }
    const fakeTargetAreasData = () => []
    const fakeStationThresholdData = () => []

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getRiverStationByStationId').returns(data.fakeRiverData.multiStationUpstreamData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getImpactData').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)
    sandbox.stub(floodService, 'getStationImtdThresholds').callsFake(fakeStationThresholdData)
    sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer').callsFake(fakeTargetAreasData)

    // Set up the Hapi server
    const server = Hapi.server()
    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))

    const stationPlugin = {
      plugin: {
        name: 'station',
        register: (server, options) => {
          server.route(require('../../server/routes/station'))
        }
      }
    }
    await server.register(stationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)
    await server.initialize()

    const response = await server.inject({
      method: 'GET',
      url: '/station/9382'
    })

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.include('<a href="/station/9045">Upstream</a>')
    expect(response.payload).to.include('<a href="/station/9382/downstream">Downstream</a>')
  })

  it('GET /station/9345 navigates correctly to another multi-reading station upstream', async () => {
    const floodService = require('../../server/services/flood')
    const fakeStationData = () => {
      return {
        rloi_id: 9345,
        station_type: 'M',
        qualifier: 'u',
        telemetry_context_id: '1146588',
        telemetry_id: '713030',
        wiski_id: '713030',
        post_process: false,
        subtract: null,
        region: 'North West',
        area: 'Cumbria and Lancashire',
        catchment: 'Ribble Douglas and Crossens',
        display_region: 'North West',
        display_area: '',
        display_catchment: '',
        agency_name: 'Walton-Le-Dale',
        external_name: 'Walton-Le-Dale',
        location_info: 'Preston',
        x_coord_actual: 355230,
        y_coord_actual: 428720,
        actual_ngr: '',
        x_coord_display: 355230,
        y_coord_display: 428720,
        site_max: '5',
        wiski_river_name: 'River Ribble',
        date_open: '2001-01-01T00:00:00.000Z',
        stage_datum: '3.642',
        period_of_record: 'to date',
        por_max_value: '5.488',
        date_por_max: '2020-02-09T18:15:00.000Z',
        highest_level: '3.469',
        date_highest_level: '2012-09-26T01:15:00.000Z',
        por_min_value: '-0.07',
        date_por_min: '2009-04-22T12:45:00.000Z',
        percentile_5: '3.5',
        comments: '',
        status: 'Active',
        status_reason: '',
        status_date: null,
        coordinates: '{"type":"Point","coordinates":[-2.68044442027032,53.7529105624953]}',
        geography: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40',
        centroid: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40'
      }
    }

    const fakeTelemetryData = () => []
    const fakeImpactsData = () => []
    const fakeForecastFlag = () => { return { } }
    const fakeTargetAreasData = () => []
    const fakeStationThresholdData = () => []

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getRiverStationByStationId').returns(data.fakeRiverData.multiToMultiUpstreamData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getImpactData').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)
    sandbox.stub(floodService, 'getStationImtdThresholds').callsFake(fakeStationThresholdData)
    sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer').callsFake(fakeTargetAreasData)

    // Set up the Hapi server
    const server = Hapi.server()
    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))

    const stationPlugin = {
      plugin: {
        name: 'station',
        register: (server, options) => {
          server.route(require('../../server/routes/station'))
        }
      }
    }
    await server.register(stationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)
    await server.initialize()

    const response = await server.inject({
      method: 'GET',
      url: '/station/9345'
    })

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.include('<a href="/station/9382/downstream">Upstream</a>')
    expect(response.payload).to.include('<a href="/station/9345/downstream">Downstream</a>')
  })

  it('GET /station/9345/downstream navigates correctly to another multi-reading station', async () => {
    const floodService = require('../../server/services/flood')
    const fakeStationData = () => {
      return {
        rloi_id: 5146,
        station_type: 'S',
        qualifier: 'u',
        telemetry_context_id: '1146588',
        telemetry_id: '713030',
        wiski_id: '713030',
        post_process: false,
        subtract: null,
        region: 'North West',
        area: 'Cumbria and Lancashire',
        catchment: 'Ribble Douglas and Crossens',
        display_region: 'North West',
        display_area: '',
        display_catchment: '',
        agency_name: 'Walton-Le-Dale',
        external_name: 'Walton-Le-Dale',
        location_info: 'Preston',
        x_coord_actual: 355230,
        y_coord_actual: 428720,
        actual_ngr: '',
        x_coord_display: 355230,
        y_coord_display: 428720,
        site_max: '5',
        wiski_river_name: 'River Ribble',
        date_open: '2001-01-01T00:00:00.000Z',
        stage_datum: '3.642',
        period_of_record: 'to date',
        por_max_value: '5.488',
        date_por_max: '2020-02-09T18:15:00.000Z',
        highest_level: '3.469',
        date_highest_level: '2012-09-26T01:15:00.000Z',
        por_min_value: '-0.07',
        date_por_min: '2009-04-22T12:45:00.000Z',
        percentile_5: '3.5',
        comments: '',
        status: 'Active',
        status_reason: '',
        status_date: null,
        coordinates: '{"type":"Point","coordinates":[-2.68044442027032,53.7529105624953]}',
        geography: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40',
        centroid: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40'
      }
    }

    const fakeTelemetryData = () => []
    const fakeImpactsData = () => []
    const fakeForecastFlag = () => { return { } }
    const fakeTargetAreasData = () => []
    const fakeStationThresholdData = () => []

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getRiverStationByStationId').returns(data.fakeRiverData.multiToMultiDownstreamData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getImpactData').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)
    sandbox.stub(floodService, 'getStationImtdThresholds').callsFake(fakeStationThresholdData)
    sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer').callsFake(fakeTargetAreasData)

    // Set up the Hapi server
    const server = Hapi.server()
    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))

    const stationPlugin = {
      plugin: {
        name: 'station',
        register: (server, options) => {
          server.route(require('../../server/routes/station'))
        }
      }
    }
    await server.register(stationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)
    await server.initialize()

    const response = await server.inject({
      method: 'GET',
      url: '/station/9345/downstream'
    })

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.include('<a href="/station/9345">Upstream</a>')
    expect(response.payload).to.include('<a href="/station/8114">Downstream</a>')
  })
})
