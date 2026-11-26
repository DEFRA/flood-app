'use strict'

const ViewModel = require('../../../server/models/views/station')
const data = require('../../data')
const moment = require('moment-timezone')

describe('Station view model tests', () => {
  it('telemetryForecastBuilder formats dataEndDateTime correctly', async () => {
    // Define our expected datetime string
    const expectedDateTime = '2023-01-15T10:30:00Z'

    // Create a fixed date based on the expected datetime
    const fixedDate = new Date(expectedDateTime)

    // Stub moment to return our fixed date
    jest.spyOn(moment, 'now').mockReturnValue(fixedDate.getTime())

    // Create a test station with telemetry data
    const stationData = structuredClone(data.stationRiver)

    // Create a new view model which will call telemetryForecastBuilder internally
    const viewModel = new ViewModel(stationData)

    // Check that the dataEndDateTime is correctly formatted
    const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/

    expect(viewModel.telemetryRefined.dataEndDateTime).toMatch(isoDateTimeRegex)

    // Check against our expected fixed date
    expect(viewModel.telemetryRefined.dataEndDateTime).toBe(expectedDateTime)
  })

  it('telemetryForecastBuilder returns correct structure', async () => {
    const stationData = structuredClone(data.stationRiver)
    const viewModel = new ViewModel(stationData)

    // Check the structure of telemetryRefined
    expect(viewModel.telemetryRefined).toBeObject()
    expect(viewModel.telemetryRefined.type).toBe('river')
    expect(viewModel.telemetryRefined.latestDateTime).toBeDefined()
    expect(viewModel.telemetryRefined.dataStartDateTime).toBeDefined()
    expect(viewModel.telemetryRefined.dataEndDateTime).toBeDefined()
    expect(viewModel.telemetryRefined.observed).toBeArray()
    expect(viewModel.telemetryRefined.forecast).toBeArray()
  })
})
