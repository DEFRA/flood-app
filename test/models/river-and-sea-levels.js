'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const lab = exports.lab = Lab.script()
const sinon = require('sinon')
const { referencedStationViewModel, placeViewModel } = require('../../server/models/views/river-and-sea-levels')
const data = require('../data')

lab.experiment('Model - River and Sea Levels', () => {
  let sandbox

  lab.beforeEach(async () => {
    sandbox = await sinon.createSandbox()
  })

  lab.afterEach(async () => {
    await sandbox.restore()
  })

  lab.experiment('placeViewModel', () => {
    lab.test('should return stations', async () => {
      const stationsData = data.riverAndSeaLevelData

      const model = placeViewModel(stationsData)

      expect(model.stations.length).to.equal(76)
      expect(model.stations[0].river_name).to.equal('Valley Brook')
      expect(model.stations[0].region).to.equal('North West')
    })

    lab.test('should return stations in distance order from place', async () => {
      const stationsData = data.riverAndSeaLevelDataUnordered
      const firstStation = data.riverAndSeaLevelDataUnordered.stations[0]
      const model = placeViewModel(stationsData)

      expect(model.stations[2].distance).to.be.greaterThan(model.stations[1].distance)
      expect(model.stations[0].river_name).to.not.equal(firstStation.river_name)
      expect(model.stations[0].region).to.equal('North West')
    })

    lab.test('should filter stations into groups', async () => {
      const stationsData = data.riverAndSeaLevelData
      const model = placeViewModel(stationsData)

      expect(model.filters[0].count).to.equal(74)
      expect(model.filters[1].count).to.equal(0)
      expect(model.filters[2].count).to.equal(2)
      expect(model.filters[3].count).to.equal(0)
    })

    lab.test('should return formatted date time for stations', async () => {
      const stationsData = data.riverAndSeaLevelData
      const model = placeViewModel(stationsData)

      expect(model.stations[0].latestDatetime).to.equal('Latest at 5:30am on 16 July ')
    })

    lab.test('should return "formattedValue" with correct number of decimal places', async () => {
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

    lab.test('should set "displayGetWarningsLink" with the appropriate value', async () => {
      const stationsData = data.riverAndSeaLevelData

      const result = placeViewModel(stationsData)

      expect(result.displayGetWarningsLink).to.equal(true)
    })
  })

  lab.experiment('referencedStationViewModel', () => {
    lab.test('should return stations sorted in distance order from rainfall station', async () => {
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

    lab.test('should set "displayGetWarningsLink" with the appropriate value', async () => {
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
  })
})
