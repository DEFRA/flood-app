'use strict'

const Lab = require('@hapi/lab')
const Hapi = require('@hapi/hapi')
const lab = exports.lab = Lab.script()
const sinon = require('sinon')
const Code = require('@hapi/code')

lab.experiment('data schedule plugin test', () => {
  let server

  lab.before(async () => {
    server = Hapi.server({
      port: 3000,
      host: 'localhost'
    })
    delete require.cache[require.resolve('../../server/services/flood.js')]
  })

  lab.after(async () => {
    await server.stop()
  })

  lab.test('data-schedulle plugin successfully loads', async () => {
    const flood = require('../../server/services/flood.js')

    sinon.stub(flood, 'getStationsGeoJson').callsFake(() => {
      return require('../data/stations.geojson.json')
    })
    sinon.stub(flood, 'getRainfallGeojson').callsFake(() => {
      return require('../data/rainfall.geojson.json')
    })
    sinon.stub(flood, 'getOutlook').callsFake(() => {
      return require('../data/fgs.json')
    })
    sinon.stub(flood, 'getFloods').callsFake(() => {
      return require('../data/fakeFloodsData.json')
    })

    const dataSchedule = require('../../server/plugins/data-schedule')

    Code.expect(dataSchedule.plugin.name).to.equal('data-schedule')
    Code.expect(dataSchedule.plugin.register).to.be.a.function()

    await server.register(dataSchedule)
    await server.initialize()
  })
})
