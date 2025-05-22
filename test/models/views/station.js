'use strict'

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const sinon = require('sinon')
const ViewModel = require('../../../server/models/views/station')
const data = require('../../data')
const moment = require('moment-timezone')

lab.experiment('Station view model tests', () => {
  let sandbox

  lab.beforeEach(() => {
    sandbox = sinon.createSandbox()
  })

  lab.afterEach(() => {
    sandbox.restore()
  })

  lab.test('telemetryForecastBuilder formats dataEndDateTime correctly', async () => {
    // Define our expected datetime string
    const expectedDateTime = '2023-01-15T10:30:00Z'

    // Create a fixed date based on the expected datetime
    const fixedDate = new Date(expectedDateTime)

    // Stub moment to return our fixed date
    sandbox.stub(moment, 'now').returns(fixedDate.getTime())

    // Create a test station with telemetry data
    const stationData = JSON.parse(JSON.stringify(data.stationRiver))

    // Create a new view model which will call telemetryForecastBuilder internally
    const viewModel = new ViewModel(stationData)

    // Check that the dataEndDateTime is correctly formatted
    const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    Code.expect(viewModel.telemetryRefined.dataEndDateTime).to.match(isoDateTimeRegex)

    // Check against our expected fixed date
    Code.expect(viewModel.telemetryRefined.dataEndDateTime).to.equal(expectedDateTime)
  })

  lab.test('telemetryForecastBuilder returns correct structure', async () => {
    const stationData = JSON.parse(JSON.stringify(data.stationRiver))
    const viewModel = new ViewModel(stationData)

    // Check the structure of telemetryRefined
    Code.expect(viewModel.telemetryRefined).to.be.an.object()
    Code.expect(viewModel.telemetryRefined.type).to.equal('river')
    Code.expect(viewModel.telemetryRefined.latestDateTime).to.exist()
    Code.expect(viewModel.telemetryRefined.dataStartDateTime).to.exist()
    Code.expect(viewModel.telemetryRefined.dataEndDateTime).to.exist()
    Code.expect(viewModel.telemetryRefined.observed).to.be.an.array()
    Code.expect(viewModel.telemetryRefined.forecast).to.be.an.array()
  })
})
