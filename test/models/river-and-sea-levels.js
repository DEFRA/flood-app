'use strict'

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const sinon = require('sinon')
const { RainfallViewModel, ViewModel } = require('../../server/models/views/river-and-sea-levels')
const data = require('../data')

lab.experiment('river-and-sea-levels model test', () => {
  let sandbox

  lab.beforeEach(async () => {
    sandbox = await sinon.createSandbox()
  })
  lab.afterEach(async () => {
    await sandbox.restore()
  })
  lab.test('Test river-and-sea-level viewModel returns stations', async () => {
    const stationsData = data.riverAndSeaLevelData
    const viewModel = ViewModel(stationsData)

    const Result = viewModel
    Code.expect(Result.stations.length).to.equal(76)
    Code.expect(Result.stations[0].river_name).to.equal('Valley Brook')
    Code.expect(Result.stations[0].region).to.equal('North West')
  })
  lab.test('Test river-and-sea-level viewModel returns stations in distance order from place', async () => {
    const stationsData = data.riverAndSeaLevelDataUnordered
    const firstStation = data.riverAndSeaLevelDataUnordered.stations[0]
    const viewModel = ViewModel(stationsData)

    const Result = viewModel
    Code.expect(Result.stations[2].distance).to.be.greaterThan(Result.stations[1].distance)
    Code.expect(Result.stations[0].river_name).to.not.equal(firstStation.river_name)
    Code.expect(Result.stations[0].region).to.equal('North West')
  })
  lab.test('Test river-and-sea-level viewModel filters stations into groups', async () => {
    const stationsData = data.riverAndSeaLevelData
    const viewModel = ViewModel(stationsData)

    const Result = viewModel
    Code.expect(Result.filters[0].count).to.equal(74)
    Code.expect(Result.filters[1].count).to.equal(0)
    Code.expect(Result.filters[2].count).to.equal(2)
    Code.expect(Result.filters[3].count).to.equal(0)
  })
  lab.test('Test river-and-sea-level viewModel returns formatted date time for stations', async () => {
    const stationsData = data.riverAndSeaLevelData
    const viewModel = ViewModel(stationsData)

    const Result = viewModel
    Code.expect(Result.stations[0].latestDatetime).to.equal('Updated 5:30am, 16 July ')
  })
  lab.test('Test river-and-sea-level viewModel returns formattedValue with correct number of decimal places', async () => {
    const stationsData = data.riverAndSeaLevelData
    const viewModel = ViewModel(stationsData)

    const Result = viewModel

    const station = Result.stations.find(item => {
      return item.station_type === 'S'
    })
    const rainfallStation = Result.stations.find(item => {
      return item.station_type === 'R'
    })

    Code.expect(station.formattedValue).to.equal('0.22m')
    Code.expect(rainfallStation.formattedValue).to.equal('0.0mm')
  })
  lab.test('Test river-and-sea-level viewModel returns rivers', async () => {
    const riversData = data.riverAndSeaLevelData
    const viewModel = ViewModel(riversData)

    const Result = viewModel

    Code.expect(Result.rivers.length).to.equal(16)
    Code.expect(Result.rivers[0].river_id).to.equal('river-itchen-hampshire')
    Code.expect(Result.rivers[0].display).to.equal('River Itchen (Hampshire)')
  })
  lab.test('Test river-and-sea-level viewModel flags multiple match', async () => {
    const riversData = data.riverAndSeaLevelData
    const viewModel = ViewModel(riversData)

    const Result = viewModel

    Code.expect(Result.isMultilpleMatch).to.equal(true)
  })
  lab.experiment('RainfallViewModel', () => {
    lab.test('Test river-and-sea-level RainfallViewModel sorts stations in distance order from rainfall station', async () => {
      const stationsData = data.riverAndSeaLevelDataUnordered
      const [rainfallStation] = data.rainfallStation553564

      const referencePoint = {
        name: rainfallStation.station_name,
        lat: rainfallStation.lat,
        lon: rainfallStation.lon
      }

      const viewModel = RainfallViewModel(referencePoint, stationsData.stations)

      const Result = viewModel
      Code.expect(Result.stations.length).to.equal(76)
      Code.expect(Result.stations[1].distance).to.be.greaterThan(Result.stations[0].distance)
      Code.expect(Result.stations[2].distance).to.be.greaterThan(Result.stations[1].distance)
    })
  })
})
