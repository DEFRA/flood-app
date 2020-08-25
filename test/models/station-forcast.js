'use strict'

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const sinon = require('sinon')
const moment = require('moment-timezone')
const ViewModel = require('../../server/models/views/station-forecast')
const data = require('../data')

lab.experiment('Station model test', () => {
  let sandbox

  lab.beforeEach(async () => {
    sandbox = await sinon.createSandbox()
  })
  lab.afterEach(async () => {
    await sandbox.restore()
  })
  lab.test('Test station-forecast viewModel FFOI station 7377', async () => {
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

    Code.expect(Result.hasForecastData).to.equal(true)
    Code.expect(Result.maxValue._).to.equal('0.202')
  })
})
