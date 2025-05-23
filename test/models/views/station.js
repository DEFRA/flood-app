'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const ViewModel = require('../../../server/models/views/station')
const data = require('../../data')
const moment = require('moment-timezone')

const { experiment, beforeEach, afterEach, test } = exports.lab = Lab.script()

experiment('Station view model tests', () => {
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  test('telemetryForecastBuilder formats dataEndDateTime correctly', async () => {
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
    expect(viewModel.telemetryRefined.dataEndDateTime).to.match(isoDateTimeRegex)

    // Check against our expected fixed date
    expect(viewModel.telemetryRefined.dataEndDateTime).to.equal(expectedDateTime)
  })

  test('telemetryForecastBuilder returns correct structure', async () => {
    const stationData = JSON.parse(JSON.stringify(data.stationRiver))
    const viewModel = new ViewModel(stationData)

    // Check the structure of telemetryRefined
    expect(viewModel.telemetryRefined).to.be.an.object()
    expect(viewModel.telemetryRefined.type).to.equal('river')
    expect(viewModel.telemetryRefined.latestDateTime).to.exist()
    expect(viewModel.telemetryRefined.dataStartDateTime).to.exist()
    expect(viewModel.telemetryRefined.dataEndDateTime).to.exist()
    expect(viewModel.telemetryRefined.observed).to.be.an.array()
    expect(viewModel.telemetryRefined.forecast).to.be.an.array()
  })
})
