'use strict'

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const sinon = require('sinon')
const ViewModel = require('../../server/models/views/warnings')

lab.experiment('Outlook model test', () => {
  let sandbox

  // Use a Sinon sandbox to manage spies, stubs and mocks for each test.
  lab.beforeEach(async () => {
    sandbox = await sinon.createSandbox()
  })
  lab.afterEach(async () => {
    await sandbox.restore()
  })
  lab.test('Test location viewModel a with flood warning', async () => {
    const floodWarning = {
      location: 'stockwell',
      place: {
        name: 'Stockwell, London',
        center: [-0.11247999966144562, 51.46965026855469],
        bbox: [
          -0.05051038448925902,
          51.49862065154724,
          -0.17444961483363222,
          51.44067988556213
        ],
        address: 'Stockwell, London',
        isEngland: { is_england: true }
      },
      floods: {
        _floods: { floods: [] },
        _groups: [[Object], [Object], [Object], [Object]],
        _geojson: { type: 'FeatureCollection', totalFeatures: 0, features: [] },
        _count: 0
      }
    }
    const viewModel = new ViewModel(floodWarning)

    const Result = await viewModel

    Code.expect(Result.floods[0].severitydescription).to.equal('Flood Warning')
    Code.expect(Result.place.name).to.equal('Keswick, Cumbria')
    Code.expect(Result.floodSummary).to.equal('A flood warning is in place for <a href="/target-area/011FWFNC6KC">Keswick Campsite</a>. Some flooding is expected in this area.')
  })
})
