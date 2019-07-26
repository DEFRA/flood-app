'use strict'

const Lab = require('@hapi/lab')
const Code = require('code')
const lab = exports.lab = Lab.script()
const Flood = require('../../server/services/flood')

lab.experiment('Flood service test', () => {
  lab.test('Check flood service exists', () => {
    Code.expect(Flood).to.be.a.object()
  })
})
