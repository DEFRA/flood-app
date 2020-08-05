'use strict'
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const sinon = require('sinon')
const config = require('../../server/config')
const Rain = require('../../server/services/rain')

lab.experiment('Flood service test', () => {
  let sandbox

  // Use a Sinon sandbox to manage spies, stubs and mocks for each test.
  lab.beforeEach(async () => {
    delete require.cache[require.resolve('../../server/services/rain.js')]
    delete require.cache[require.resolve('../../server/util.js')]
    sandbox = await sinon.createSandbox()
    sandbox.stub(config, 'serviceUrl').value('http://server2')
  })

  lab.afterEach(async () => {
    await sandbox.restore()
  })

  lab.experiment('Rain service test', () => {
    lab.test('Check rain service exists', () => {
      Code.expect(Rain).to.be.a.object()
    })
  })
  lab.test('Test getRainGaugeById', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('https://environment.data.gov.uk/flood-monitoring/id/stations/1234')
      .once()
      .returns('ok')

    const rainService = require('../../server/services/rain')

    const result = await rainService.getRainGaugeById(1234)

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getRainMeasuresById', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('https://environment.data.gov.uk/flood-monitoring/id/stations/1234/readings?parameter=rainfall&_sorted&_limit=2800&_sorted')
      .once()
      .returns('ok')

    const rainService = require('../../server/services/rain')

    const result = await rainService.getRainMeasuresById(1234)

    Code.expect(result).to.equal('ok')
  })
})
