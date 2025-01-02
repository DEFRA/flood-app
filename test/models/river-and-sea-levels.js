'use strict'

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const sinon = require('sinon')
const { referencedStationViewModel, placeViewModel } = require('../../server/models/views/river-and-sea-levels')
const data = require('../data')

lab.experiment('river-and-sea-levels model test', () => {
  let sandbox

  lab.beforeEach(async () => {
    sandbox = await sinon.createSandbox()
  })
  lab.afterEach(async () => {
    await sandbox.restore()
  })
  lab.experiment('placeViewModel', () => {
    lab.test('Test river-and-sea-level placeViewModel returns stations', async () => {
      const stationsData = data.riverAndSeaLevelData

      const model = placeViewModel(stationsData)

      Code.expect(model.stations.length).to.equal(76)
      Code.expect(model.stations[0].river_name).to.equal('Valley Brook')
      Code.expect(model.stations[0].region).to.equal('North West')
    })
    lab.test('Test river-and-sea-level placeViewModel returns stations in distance order from place', async () => {
      const stationsData = data.riverAndSeaLevelDataUnordered
      const firstStation = data.riverAndSeaLevelDataUnordered.stations[0]
      const model = placeViewModel(stationsData)

      Code.expect(model.stations[2].distance).to.be.greaterThan(model.stations[1].distance)
      Code.expect(model.stations[0].river_name).to.not.equal(firstStation.river_name)
      Code.expect(model.stations[0].region).to.equal('North West')
    })
    lab.test('Test river-and-sea-level placeViewModel filters stations into groups', async () => {
      const stationsData = data.riverAndSeaLevelData
      const model = placeViewModel(stationsData)

      Code.expect(model.filters[0].count).to.equal(74)
      Code.expect(model.filters[1].count).to.equal(0)
      Code.expect(model.filters[2].count).to.equal(2)
      Code.expect(model.filters[3].count).to.equal(0)
    })
    lab.test('Test river-and-sea-level placeViewModel returns formatted date time for stations', async () => {
      const stationsData = data.riverAndSeaLevelData
      const model = placeViewModel(stationsData)

      Code.expect(model.stations[0].latestDatetime).to.equal('Latest at 5:30am on 16 July ')
    })
    lab.test('Test river-and-sea-level placeViewModel returns formattedValue with correct number of decimal places', async () => {
      const stationsData = data.riverAndSeaLevelData
      const model = placeViewModel(stationsData)

      const station = model.stations.find(item => {
        return item.station_type === 'S'
      })
      const rainfallStation = model.stations.find(item => {
        return item.station_type === 'R'
      })

      Code.expect(station.formattedValue).to.equal('0.22m')
      Code.expect(rainfallStation.formattedValue).to.equal('0m')
    })

    lab.test('Test displayGetWarningsLink has appropriate Value', async () => {
      const stationsData = data.riverAndSeaLevelData

      const result = placeViewModel(stationsData)

      Code.expect(result.displayGetWarningsLink).to.equal(true)
    })
    lab.test('Test slug has been populated correctly', async () => {
      const stationsData = data.riverAndSeaLevelData

      const result = placeViewModel(stationsData)

      Code.expect(result.slug).to.equal('cheshire')
    })
  })

  lab.experiment('referencedStationViewModel', () => {
    lab.test('Test river-and-sea-level referencedStationViewModel sorts stations in distance order from rainfall station', async () => {
      const stationsData = data.riverAndSeaLevelDataUnordered
      const [rainfallStation] = data.rainfallStation553564

      const referencePoint = {
        name: rainfallStation.station_name,
        lat: rainfallStation.lat,
        lon: rainfallStation.lon
      }

      const model = referencedStationViewModel(referencePoint, stationsData.stations)

      Code.expect(model.stations.length).to.equal(76)
      Code.expect(model.stations[1].distance).to.be.greaterThan(model.stations[0].distance)
      Code.expect(model.stations[2].distance).to.be.greaterThan(model.stations[1].distance)
    })
    lab.test('Test displayGetWarningsLink has appropriate Value', async () => {
      const stationsData = data.riverAndSeaLevelDataUnordered
      const [rainfallStation] = data.rainfallStation553564

      const referencePoint = {
        name: rainfallStation.station_name,
        lat: rainfallStation.lat,
        lon: rainfallStation.lon
      }

      const result = referencedStationViewModel(referencePoint, stationsData.stations)

      Code.expect(result.displayGetWarningsLink).to.equal(true)
    })
    lab.test('Test slug has been populated correctly', async () => {
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

      Code.expect(result.slug).to.equal('rainfall/ABC123')
    })
  })
})
