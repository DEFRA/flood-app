'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script()
const sinon = require('sinon')
const { referencedStationViewModel, placeViewModel, riverViewModel } = require('../../server/models/views/river-and-sea-levels')
const data = require('../data')

describe('Model - River and Sea Levels', () => {
  let sandbox

  beforeEach(async () => {
    sandbox = await sinon.createSandbox()
  })

  afterEach(async () => {
    await sandbox.restore()
  })

  describe('placeViewModel', () => {
    it('should return stations', async () => {
      const stationsData = data.riverAndSeaLevelData

      const model = placeViewModel(stationsData)

      expect(model.stations.length).to.equal(76)
      expect(model.stations[0].river_name).to.equal('Valley Brook')
      expect(model.stations[0].region).to.equal('North West')
    })

    it('should return stations in distance order from place', async () => {
      const stationsData = data.riverAndSeaLevelDataUnordered
      const firstStation = data.riverAndSeaLevelDataUnordered.stations[0]
      const model = placeViewModel(stationsData)

      expect(model.stations[2].distance).to.be.greaterThan(model.stations[1].distance)
      expect(model.stations[0].river_name).to.not.equal(firstStation.river_name)
      expect(model.stations[0].region).to.equal('North West')
    })

    it('should filter stations into groups', async () => {
      const stationsData = data.riverAndSeaLevelData
      const model = placeViewModel(stationsData)

      expect(model.filters[0].count).to.equal(74)
      expect(model.filters[1].count).to.equal(0)
      expect(model.filters[2].count).to.equal(2)
      expect(model.filters[3].count).to.equal(0)
    })

    it('should return formatted date time for stations', async () => {
      const stationsData = data.riverAndSeaLevelData
      const model = placeViewModel(stationsData)

      expect(model.stations[0].latestDatetime).to.equal('Latest at 5:30am on 16 July ')
    })

    it('should return "formattedValue" with correct number of decimal places', async () => {
      const stationsData = data.riverAndSeaLevelData
      const model = placeViewModel(stationsData)

      const station = model.stations.find(item => {
        return item.station_type === 'S'
      })
      const rainfallStation = model.stations.find(item => {
        return item.station_type === 'R'
      })

      expect(station.formattedValue).to.equal('0.22m')
      expect(rainfallStation.formattedValue).to.equal('0m')
    })

    it('should set "displayGetWarningsLink" with the appropriate value', async () => {
      const stationsData = data.riverAndSeaLevelData

      const result = placeViewModel(stationsData)

      expect(result.displayGetWarningsLink).to.equal(true)
    })

    it('should populate slug correctly', () => {
      const stationsData = data.riverAndSeaLevelData

      const result = placeViewModel(stationsData)

      expect(result.slug).to.equal('cheshire')
    })
  })

  describe('referencedStationViewModel', () => {
    it('should return stations sorted in distance order from rainfall station', async () => {
      const stationsData = data.riverAndSeaLevelDataUnordered
      const [rainfallStation] = data.rainfallStation553564

      const referencePoint = {
        name: rainfallStation.station_name,
        lat: rainfallStation.lat,
        lon: rainfallStation.lon
      }

      const model = referencedStationViewModel(referencePoint, stationsData.stations)

      expect(model.stations.length).to.equal(76)
      expect(model.stations[1].distance).to.be.greaterThan(model.stations[0].distance)
      expect(model.stations[2].distance).to.be.greaterThan(model.stations[1].distance)
    })

    it('should set "displayGetWarningsLink" with the appropriate value', async () => {
      const stationsData = data.riverAndSeaLevelDataUnordered
      const [rainfallStation] = data.rainfallStation553564

      const referencePoint = {
        name: rainfallStation.station_name,
        lat: rainfallStation.lat,
        lon: rainfallStation.lon
      }

      const result = referencedStationViewModel(referencePoint, stationsData.stations)

      expect(result.displayGetWarningsLink).to.equal(true)
    })

    it('should populate slug correctly', async () => {
      const stationsData = data.riverAndSeaLevelDataUnordered

      const [rainfallStation] = data.rainfallStation553564

      const referencePoint = {
        type: 'rainfall',
        id: 'ABC123',
        name: rainfallStation.station_name,
        lat: rainfallStation.lat,
        lon: rainfallStation.lon
      }

      const result = referencedStationViewModel(referencePoint, stationsData.stations)

      expect(result.slug).to.equal('rainfall/ABC123')
    })
  })

  describe('riverViewModel', () => {
    it('should set displayData to true for active Welsh stations', async () => {
      const stations = [{
        status: 'Active',
        value: 1.2,
        value_erred: false,
        iswales: true,
        lon: 0,
        lat: 0,
        external_name: 'Test Station',
        station_type: 'R',
        river_qualified_name: 'Test River',
        trend: 'steady',
        percentile_5: '1.0',
        percentile_95: '0.5',
        value_timestamp: '2022-03-30T12:00:00Z'
      }]

      const riverId = 'testRiverId'
      const result = riverViewModel(riverId, stations, 'river')

      expect(result.stations[0].displayData).to.equal(true)
    })

    it('should set "displayData" to false for suspended Welsh stations', async () => {
      const stations = [{
        status: 'Suspended',
        value: 1.2,
        value_erred: false,
        iswales: true,
        lon: 0,
        lat: 0,
        external_name: 'Test Station',
        station_type: 'R',
        river_qualified_name: 'Test River',
        trend: 'steady',
        percentile_5: '1.0',
        percentile_95: '0.5',
        value_timestamp: '2022-03-30T12:00:00Z'
      }]

      const riverId = 'testRiverId'
      const result = riverViewModel(riverId, stations, 'river')

      expect(result.stations[0].displayData).to.equal(false)
    })

    it('should set "displayData" to false for closed Welsh stations', async () => {
      const stations = [{
        status: 'Closed',
        value: 1.2,
        value_erred: false,
        iswales: true,
        lon: 0,
        lat: 0,
        external_name: 'Test Station',
        station_type: 'R',
        river_qualified_name: 'Test River',
        trend: 'steady',
        percentile_5: '1.0',
        percentile_95: '0.5',
        value_timestamp: '2022-03-30T12:00:00Z'
      }]

      const riverId = 'testRiverId'
      const result = riverViewModel(riverId, stations, 'river')

      expect(result.stations[0].displayData).to.equal(false)
    })
  })
})
