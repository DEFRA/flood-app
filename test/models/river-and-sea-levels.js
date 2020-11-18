'use strict'

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const sinon = require('sinon')
const ViewModel = require('../../server/models/views/river-and-sea-levels')
const data = require('../data')

lab.experiment('river-and-sea-levels model test', () => {
  let sandbox

  lab.beforeEach(async () => {
    sandbox = await sinon.createSandbox()
  })
  lab.afterEach(async () => {
    await sandbox.restore()
  })
  lab.test('Test river-and-sea-level viewModel payload cheshire ', async () => {
    const stationsData = data.riverAndSeaLevelData
    const viewModel = new ViewModel(stationsData)

    const Result = viewModel

    Code.expect(Result.pageTitle).to.equal('cheshire - River and sea levels in England')
    Code.expect(Result.countLevels).to.equal(74)
  })
})
