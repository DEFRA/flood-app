'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script()
const sinon = require('sinon')
const moment = require('moment-timezone')
const ViewModel = require('../../server/models/views/station-forecast')
const data = require('../data')

describe('Model - Station Forecast', () => {
  let sandbox

  beforeEach(async () => {
    sandbox = await sinon.createSandbox()
  })

  afterEach(async () => {
    await sandbox.restore()
  })

  it('should return FFOI station 7377 and set "maxValue._', async () => {
    const stationData = data.forcastStationModelData

    stationData.values.$.date = moment().subtract(1, 'day').format('YYYY-MM-DD')
    stationData.values.$.time = moment().subtract(2, 'hours').format('HH:mm:ss')

    stationData.values.SetofValues[0].$.startDate = moment().subtract(4, 'days').format('YYYY-MM-DD')
    stationData.values.SetofValues[0].$.startTime = moment().subtract(2, 'hours').format('HH:mm:ss')

    stationData.values.SetofValues[0].$.endDate = moment().add(6, 'days').format('YYYY-MM-DD')
    stationData.values.SetofValues[0].$.endTime = moment().subtract(2, 'hours').format('HH:mm:ss')

    stationData.values.SetofValues[0].Value[0].$.date = moment().add(2, 'days').format('YYYY-MM-DD')
    stationData.values.SetofValues[0].Value[0].$.time = moment().format('HH:mm:ss')

    stationData.values.SetofValues[0].Value[1].$.date = moment().format('YYYY-MM-DD')
    stationData.values.SetofValues[0].Value[1].$.time = moment().add(1, 'hours').format('HH:mm:ss')

    stationData.values.SetofValues[0].Value[2].$.date = moment().add(22, 'hours').format('YYYY-MM-DD')
    stationData.values.SetofValues[0].Value[2].$.time = moment().subtract(2, 'hours').format('HH:mm:ss')

    const viewModel = new ViewModel(stationData)

    const Result = viewModel

    expect(Result.hasForecastData).to.equal(true)
    expect(Result.maxValue._).to.equal('0.202')
  })
})
