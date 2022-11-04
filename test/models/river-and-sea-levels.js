'use strict'

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const sinon = require('sinon')
const { referencedStationViewModel, viewModel } = require('../../server/models/views/river-and-sea-levels')
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

    const model = viewModel(stationsData)

    Code.expect(model.stations.length).to.equal(76)
    Code.expect(model.stations[0].river_name).to.equal('Valley Brook')
    Code.expect(model.stations[0].region).to.equal('North West')
  })
  lab.test('Test river-and-sea-level viewModel returns stations in distance order from place', async () => {
    const stationsData = data.riverAndSeaLevelDataUnordered
    const firstStation = data.riverAndSeaLevelDataUnordered.stations[0]
    const model = viewModel(stationsData)

    Code.expect(model.stations[2].distance).to.be.greaterThan(model.stations[1].distance)
    Code.expect(model.stations[0].river_name).to.not.equal(firstStation.river_name)
    Code.expect(model.stations[0].region).to.equal('North West')
  })
  lab.test('Test river-and-sea-level viewModel filters stations into groups', async () => {
    const stationsData = data.riverAndSeaLevelData
    const model = viewModel(stationsData)

    Code.expect(model.filters[0].count).to.equal(74)
    Code.expect(model.filters[1].count).to.equal(0)
    Code.expect(model.filters[2].count).to.equal(2)
    Code.expect(model.filters[3].count).to.equal(0)
  })
  lab.test('Test river-and-sea-level viewModel returns formatted date time for stations', async () => {
    const stationsData = data.riverAndSeaLevelData
    const model = viewModel(stationsData)

    Code.expect(model.stations[0].latestDatetime).to.equal('Updated 5:30am, 16 July ')
  })
  lab.test('Test river-and-sea-level viewModel returns formattedValue with correct number of decimal places', async () => {
    const stationsData = data.riverAndSeaLevelData
    const model = viewModel(stationsData)

    const station = model.stations.find(item => {
      return item.station_type === 'S'
    })
    const rainfallStation = model.stations.find(item => {
      return item.station_type === 'R'
    })

    Code.expect(station.formattedValue).to.equal('0.22m')
    Code.expect(rainfallStation.formattedValue).to.equal('0.0mm')
  })
  lab.test('Test river-and-sea-level viewModel returns rivers', async () => {
    const riversData = data.riverAndSeaLevelData
    const model = viewModel(riversData)

    Code.expect(model.rivers.length).to.equal(16)
    Code.expect(model.rivers[0].river_id).to.equal('river-itchen-hampshire')
    Code.expect(model.rivers[0].display).to.equal('River Itchen (Hampshire)')
  })
  lab.test('Test river-and-sea-level viewModel flags multiple match', async () => {
    const riversData = data.riverAndSeaLevelData
    const model = viewModel(riversData)

    Code.expect(model.isMultilpleMatch).to.equal(true)
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
  })
})
